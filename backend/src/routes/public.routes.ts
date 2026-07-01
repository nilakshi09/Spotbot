import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { reportShareService } from '../services/report-share.service.js';
import { NotFoundError, AppError } from '../middleware/error-handler.js';
import { db } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';
import { whiteLabelService, DEFAULT_BRANDING } from '../services/white-label.service.js';

// Public routes — NO authentication required
export default async function publicRoutes(app: FastifyInstance) {

  // GET /api/public/reports/:token
  // Returns full report data for a valid share token
  app.get('/reports/:token', async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
    const { token } = request.params;

    try {
      const { scan, report } = await reportShareService.getPublicReport(token);

      const scanUser = await db.query.users.findFirst({
        where: eq(users.id, scan.userId),
        columns: { organizationId: true },
      })

      const branding = scanUser?.organizationId
        ? await whiteLabelService.getBranding(scanUser.organizationId)
        : DEFAULT_BRANDING

      // Return same structure as authenticated GET /api/scans/:id
      // but with additional share metadata
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
        expiresAt: scan.expiresAt,
        shareInfo: {
          expiresAt: report.shareExpiresAt,
          viewCount: report.viewCount,
        },
        branding,
      });
    } catch (error) {
      // For public endpoints, return 404 for any error
      // Don't leak information about whether token exists
      if (
        error instanceof NotFoundError ||
        (error instanceof AppError && error.statusCode === 410)
      ) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'This report link is invalid or has expired',
          },
        });
      }
      throw error;
    }
  });
}
