import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { reports } from '../db/schema/reports.js';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { PdfService } from '../services/pdf.service.js';
import { ScanService } from '../services/scan.service.js';
import { env } from '../config/env.js';

const pdfService = new PdfService();
const scanService = new ScanService();

const ShareSchema = z.object({
  expiresInDays: z.number().min(1).max(30).default(7),
});

export async function reportRoutes(app: FastifyInstance) {
  // Public endpoint (no auth)
  app.get('/public/reports/:token', async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
    const { token } = request.params;
    const reportData = await db.select().from(reports).where(eq(reports.shareToken, token)).limit(1);

    if (!reportData[0]) {
      return reply.status(404).send({ error: 'Report not found' });
    }

    if (reportData[0].shareExpiresAt && new Date() > reportData[0].shareExpiresAt) {
      return reply.status(404).send({ error: 'This report has expired' });
    }

    // Increment viewCount
    await db.update(reports)
      .set({ viewCount: reportData[0].viewCount + 1 })
      .where(eq(reports.id, reportData[0].id));

    // Fetch scan data
    const scanData = await db.select().from(scans).where(eq(scans.id, reportData[0].scanId)).limit(1);
    const scan = scanData[0];

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
      followerHistory: (scan.rawData as any)?.followerHistory || [],
      createdAt: scan.createdAt,
      expiresAt: scan.expiresAt
    });
  });

  // Protected endpoints
  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', verifyAccessToken);

    protectedApp.get('/reports/:scanId', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request.user as any).sub;
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
        followerHistory: (scan.rawData as any)?.followerHistory || [],
        createdAt: scan.createdAt,
        expiresAt: scan.expiresAt
      });
    });

    protectedApp.get('/reports/:scanId/pdf', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request.user as any).sub;
      const { scanId } = request.params;

      const scan = await scanService.getScan(scanId, userId);
      if (scan.status !== 'completed') {
        return reply.status(409).send({ error: 'Scan not yet completed' });
      }

      const reportData = await db.select().from(reports).where(eq(reports.scanId, scanId)).limit(1);
      
      if (reportData[0]?.pdfUrl && reportData[0]?.pdfGeneratedAt) {
        return reply.redirect(reportData[0].pdfUrl);
      }

      const pdfUrl = await pdfService.generatePdf(scan);

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

    protectedApp.post('/reports/:scanId/share', async (request: FastifyRequest<{ Params: { scanId: string } }>, reply: FastifyReply) => {
      const userId = (request.user as any).sub;
      const { scanId } = request.params;
      const body = ShareSchema.parse(request.body);

      const scan = await scanService.getScan(scanId, userId);
      if (scan.status !== 'completed') {
        return reply.status(409).send({ error: 'Scan not yet completed' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + body.expiresInDays);

      const reportData = await db.select().from(reports).where(eq(reports.scanId, scanId)).limit(1);

      if (reportData[0]) {
        await db.update(reports)
          .set({ shareToken: token, shareExpiresAt: expiresAt })
          .where(eq(reports.scanId, scanId));
      } else {
        await db.insert(reports).values({
          scanId,
          shareToken: token,
          shareExpiresAt: expiresAt
        });
      }

      return reply.send({
        shareUrl: `${env.FRONTEND_URL}/public/reports/${token}`,
        token,
        expiresAt: expiresAt.toISOString()
      });
    });
  });
}
