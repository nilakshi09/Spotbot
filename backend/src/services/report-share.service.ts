import crypto from 'crypto';
import { db } from '../db/client.js';
import { reports, scans } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError, AppError } from '../middleware/error-handler.js';

export class ReportShareService {

  // ─── GENERATE SHARE LINK ─────────────────────────────────────────────────

  async generateShareLink(
    scanId: string,
    userId: string,
    expiresInDays: number = 7,
  ) {
    // Validate expiresInDays range
    if (expiresInDays < 1 || expiresInDays > 30) {
      throw new ValidationError('expiresInDays must be between 1 and 30');
    }

    // Verify scan belongs to user and is completed
    const scan = await db.query.scans.findFirst({
      where: and(
        eq(scans.id, scanId),
        eq(scans.userId, userId),
      ),
    });

    if (!scan) {
      throw new NotFoundError('Scan');
    }

    if (scan.status !== 'completed') {
      throw new ValidationError(
        'Cannot share a scan that is not completed'
      );
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Upsert report record with share token
    // (report may already exist if PDF was previously generated)
    await db
      .insert(reports)
      .values({
        scanId,
        shareToken: token,
        shareExpiresAt: expiresAt,
      })
      .onConflictDoUpdate({
        target: reports.scanId,
        set: {
          shareToken: token,
          shareExpiresAt: expiresAt,
        },
      });

    const shareUrl = `${env.FRONTEND_URL}/public/reports/${token}`;

    logger.info(
      { scanId, userId, expiresInDays, shareUrl },
      'Share link generated',
    );

    return {
      shareUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ─── GET PUBLIC REPORT BY TOKEN ──────────────────────────────────────────

  async getPublicReport(token: string) {
    // Validate token format (64 hex chars)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new NotFoundError('Report');
    }

    // Find report by token
    const report = await db.query.reports.findFirst({
      where: eq(reports.shareToken, token),
    });

    if (!report) {
      throw new NotFoundError('Report');
    }

    // Check expiry
    if (report.shareExpiresAt && new Date(report.shareExpiresAt) < new Date()) {
      throw new AppError(410, 'This report link has expired', 'REPORT_EXPIRED');
    }

    // Fetch the scan data
    const scan = await db.query.scans.findFirst({
      where: eq(scans.id, report.scanId),
    });

    if (!scan || scan.status !== 'completed') {
      throw new NotFoundError('Report');
    }

    // Increment view count (fire and forget — don't await)
    db.update(reports)
      .set({ viewCount: report.viewCount + 1 })
      .where(eq(reports.id, report.id))
      .catch((err: unknown) => logger.error({ err }, 'Failed to increment view count'));

    logger.info(
      { token: token.slice(0, 8) + '...', scanId: scan.id },
      'Public report accessed',
    );

    return {
      scan,
      report: {
        shareToken: token,
        shareExpiresAt: report.shareExpiresAt,
        viewCount: report.viewCount + 1,
        createdAt: report.createdAt,
      },
    };
  }

  // ─── REVOKE SHARE LINK ───────────────────────────────────────────────────

  async revokeShareLink(scanId: string, userId: string) {
    // Verify scan belongs to user
    const scan = await db.query.scans.findFirst({
      where: and(
        eq(scans.id, scanId),
        eq(scans.userId, userId),
      ),
    });

    if (!scan) {
      throw new NotFoundError('Scan');
    }

    // Clear share token and expiry
    await db
      .update(reports)
      .set({
        shareToken: null,
        shareExpiresAt: null,
      })
      .where(eq(reports.scanId, scanId));

    logger.info({ scanId, userId }, 'Share link revoked');

    return { revoked: true };
  }

  // ─── GET SHARE STATUS ────────────────────────────────────────────────────

  async getShareStatus(scanId: string, userId: string) {
    // Verify scan belongs to user
    const scan = await db.query.scans.findFirst({
      where: and(
        eq(scans.id, scanId),
        eq(scans.userId, userId),
      ),
    });

    if (!scan) {
      throw new NotFoundError('Scan');
    }

    const report = await db.query.reports.findFirst({
      where: eq(reports.scanId, scanId),
    });

    if (!report || !report.shareToken) {
      return {
        isShared: false,
        shareUrl: null,
        expiresAt: null,
        viewCount: 0,
      };
    }

    // Check if expired
    const isExpired = report.shareExpiresAt
      ? new Date(report.shareExpiresAt) < new Date()
      : false;

    return {
      isShared: !isExpired,
      isExpired,
      shareUrl: isExpired
        ? null
        : `${env.FRONTEND_URL}/public/reports/${report.shareToken}`,
      expiresAt: report.shareExpiresAt?.toISOString() ?? null,
      viewCount: report.viewCount,
    };
  }
}

export const reportShareService = new ReportShareService();
