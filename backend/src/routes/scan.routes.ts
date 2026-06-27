import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ScanService } from '../services/scan.service.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { checkScanQuota } from '../middleware/quota.middleware.js';
import { ScanLimitError } from '../middleware/quota.middleware.js';
import { db } from '../db/client.js';
import { reports } from '../db/schema/reports.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';

const scanService = new ScanService();
import { redis } from '../config/redis.js';

const CreateScanSchema = z.object({
  platform: z.enum(['instagram', 'youtube']),
  handle: z.string().min(1).max(100).regex(/^@?[a-zA-Z0-9._-]+$/),
});

const ListScansSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  platform: z.enum(['instagram', 'youtube']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  handle: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  scoreMin: z.coerce.number().min(0).max(100).optional(),
  scoreMax: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  orderBy: z.enum(['created_at', 'fraud_score', 'handle']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export default async function scanRoutes(app: FastifyInstance) {
  // All scan routes require authentication
  app.addHook('onRequest', verifyAccessToken);

  app.post('/', { preHandler: [checkScanQuota] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { platform, handle } = CreateScanSchema.parse(request.body);
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;

    try {
      const result = await scanService.createScan(userId, orgId, platform, handle);
      
      if (result.cached) {
        return reply.status(200).send(result.scan);
      }
      
      return reply.status(202).send({
        id: result.scan.id,
        status: result.scan.status,
        platform: result.scan.platform,
        handle: result.scan.handle,
        createdAt: result.scan.createdAt,
        pollUrl: `/api/scans/${result.scan.id}`
      });
    } catch (error) {
      if (error instanceof ScanLimitError) {
        return reply.status(402).send({
          error: { code: 'SCAN_LIMIT_REACHED', message: error.message }
        });
      }
      throw error;
    }
  });

  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;
    const role = (request.user as any).role;
    const scanId = request.params.id;

    const scan = await scanService.getScan(scanId, userId, orgId, role);

    if (scan.status === 'completed') {
      // Fetch share status for completed scans
      const reportData = await db.select({
        shareToken: reports.shareToken,
        shareExpiresAt: reports.shareExpiresAt,
        viewCount: reports.viewCount,
      }).from(reports).where(eq(reports.scanId, scan.id)).limit(1);

      const report = reportData[0];
      const isShared = !!(
        report?.shareToken &&
        report?.shareExpiresAt &&
        new Date(report.shareExpiresAt) > new Date()
      );

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
        shareStatus: {
          isShared,
          shareUrl: isShared
            ? `${env.FRONTEND_URL}/public/reports/${report!.shareToken}`
            : null,
          expiresAt: report?.shareExpiresAt?.toISOString() ?? null,
          viewCount: report?.viewCount ?? 0,
        },
      });
    } else if (scan.status === 'processing' || scan.status === 'pending') {
      const progressRaw = await redis.get(`scan:progress:${scan.id}`);
      const progress = progressRaw ? JSON.parse(progressRaw) : {
        step: 'initializing',
        stepsCompleted: 0,
        totalSteps: 6,
        estimatedSecondsRemaining: 60
      };

      return reply.send({
        id: scan.id,
        status: scan.status,
        platform: scan.platform,
        handle: scan.handle,
        progress,
        createdAt: scan.createdAt
      });
    } else if (scan.status === 'failed') {
      return reply.send({
        id: scan.id,
        status: scan.status,
        platform: scan.platform,
        handle: scan.handle,
        errorMessage: scan.errorMessage || 'Unknown error occurred',
        createdAt: scan.createdAt
      });
    }
  });

  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;
    const role = (request.user as any).role;
    const query = ListScansSchema.parse(request.query);

    const result = await scanService.listScans(userId, orgId, role, query);
    return reply.send(result);
  });

  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const scanId = request.params.id;

    await scanService.deleteScan(scanId, userId);
    return reply.status(204).send();
  });

  app.post('/:id/rescan', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;
    const scanId = request.params.id;

    const result = await scanService.rescan(scanId, userId, orgId);
    
    return reply.status(202).send({
      id: result.scan.id,
      status: result.scan.status,
      platform: result.scan.platform,
      handle: result.scan.handle,
      createdAt: result.scan.createdAt,
      pollUrl: `/api/scans/${result.scan.id}`
    });
  });
}
