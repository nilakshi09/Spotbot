import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { reports } from '../db/schema/reports.js';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { PdfService } from '../services/pdf.service.js';
import { ScanService } from '../services/scan.service.js';
import { reportShareService } from '../services/report-share.service.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/error-handler.js';
import { whiteLabelService } from '../services/white-label.service.js';
import { users } from '../db/schema/users.js';

const pdfService = new PdfService();
const scanService = new ScanService();

const ShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

// ─── Rate Limiting Helper ──────────────────────────────────────────────────
// Prevent abuse — max 10 share links per user per hour

async function checkShareRateLimit(userId: string): Promise<void> {
  const key = `share:ratelimit:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // First request — set expiry of 1 hour
    await redis.expire(key, 3600);
  }

  if (count > 10) {
    throw new AppError(
      429,
      'Too many share links generated. Please wait before creating more.',
      'RATE_LIMITED',
    );
  }
}

export default async function reportRoutes(app: FastifyInstance) {
  // Protected endpoints
  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', verifyAccessToken);

    protectedApp.get('/reports/:scanId', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
      const { scanId } = request.params;

      const scan = await scanService.getScan(scanId, userId);
      if (scan.status !== 'completed') {
        return reply.status(409).send({ error: 'Scan not yet completed' });
      }

      return reply.send({
        id: scan.id,
        status: scan.status,
        platform: scan.platform,
        handle: scan.handle,
        fraudScore: scan.fraudScore || 0,
        riskLevel: scan.riskLevel || 'low',
        realReach: scan.realReach || 0,
        cached: false,
        dataQuality: 'full',
        riskSummary: 'Analysis complete based on multiple signals',
        profile: scan.profileData || {
          displayName: '', followers: 0, following: 0, posts: 0, bio: '', profilePictureUrl: '', isVerified: false, category: ''
        },
        signals: scan.subScores || {},
        followerHistory: (scan.rawData as { followerHistory?: unknown[] })?.followerHistory || [],
        createdAt: scan.createdAt,
        expiresAt: scan.expiresAt
      });
    });

    protectedApp.get('/reports/:scanId/pdf', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
      const { scanId } = request.params;

      const scan = await scanService.getScan(scanId, userId);
      if (scan.status !== 'completed') {
        return reply.status(409).send({ error: 'Scan not yet completed' });
      }

      const reportData = await db.select().from(reports).where(eq(reports.scanId, scanId)).limit(1);
      
      if (reportData[0]?.pdfUrl && reportData[0]?.pdfGeneratedAt) {
        return reply.redirect(reportData[0].pdfUrl);
      }
      
      const userResult = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { organizationId: true },
      })

      let branding;
      if (userResult?.organizationId) {
        branding = await whiteLabelService.getBranding(userResult.organizationId);
      }

      const pdfUrl = await pdfService.generatePdf(scan, branding);

      // Upsert report record
      if (reportData[0]) {
        await db.update(reports)
          .set({ pdfUrl, pdfGeneratedAt: new Date() })
          .where(eq(reports.scanId, scanId));
      } else {
        await db.insert(reports).values({
          scanId,
          pdfUrl,
          pdfGeneratedAt: new Date()
        });
      }

      // Return a 302 redirect to the PDF url so the browser downloads it
      // The spec asks to stream the PDF back but also says "return URL" or "redirect to S3/R2 URL" and "stream PDF back to client".
      // Usually S3 redirects handle streaming to client perfectly well.
      // If we must stream directly, we'd pipe the S3 object, but redirecting is cleaner and fulfills the caching strategy.
      // We will redirect.
      return reply.redirect(pdfUrl);
    });

    // ─── POST /api/reports/:scanId/share ──────────────────────────────────
    // Generate a public share link for a report
    protectedApp.post('/reports/:scanId/share', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
      const { scanId } = request.params;
      const body = ShareSchema.parse(request.body);

      // Rate limit: max 10 share links per user per hour
      await checkShareRateLimit(userId);

      const result = await reportShareService.generateShareLink(
        scanId,
        userId,
        body.expiresInDays,
      );

      return reply.status(201).send(result);
    });

    // ─── DELETE /api/reports/:scanId/share ────────────────────────────────
    // Revoke an existing share link
    protectedApp.delete('/reports/:scanId/share', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
      const { scanId } = request.params;

      const result = await reportShareService.revokeShareLink(
        scanId,
        userId,
      );

      return reply.send(result);
    });

    // ─── GET /api/reports/:scanId/share ───────────────────────────────────
    // Get current share status for a report
    protectedApp.get('/reports/:scanId/share', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
      const { scanId } = request.params;

      const status = await reportShareService.getShareStatus(
        scanId,
        userId,
      );

      return reply.send(status);
    });
  });
}
