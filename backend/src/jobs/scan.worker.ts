import { Worker, Job } from 'bullmq';
import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { eq } from 'drizzle-orm';
import { redis } from '../config/redis.js';
import { ScanJobData } from './queue.js';
import { FraudEngine } from '../engine/engine.js';
import { InstagramClient } from '../integrations/instagram.client.js';
import { SocialBladeClient } from '../integrations/socialblade.client.js';
import { OpenAIClient } from '../integrations/openai.client.js';
import { quotaService } from '../services/quota.service.js';
import { captureMessage } from '../config/sentry.js';
import { track } from '../utils/metrics.js';
import { businessLogger, logger } from '../utils/logger.js';

const instagramClient = new InstagramClient();
const socialBladeClient = new SocialBladeClient();
const openAIClient = new OpenAIClient();

export const scanWorker = new Worker<ScanJobData>(
  'scans',
  async (job: Job<ScanJobData>) => {
    const { scanId, platform, handle } = job.data;

    // 1. Update scan status → 'processing'
    await db.update(scans).set({ status: 'processing' }).where(eq(scans.id, scanId));

    const userId = (job.data as any).userId || job.data.orgId;
    businessLogger.scanCreated(scanId, userId, platform, handle);
    track.scanCreated();
    const startTime = Date.now();

    try {
      // 2. Run fraud engine
      const engine = new FraudEngine(instagramClient, socialBladeClient, openAIClient);
      const result = await engine.analyze(platform, handle);

      // 3. Update scan with results → 'completed'
      await db.update(scans).set({
        status: 'completed',
        fraudScore: result.fraudScore,
        riskLevel: result.riskLevel,
        realReach: result.realReach,
        subScores: result.signals,
        profileData: result.profile,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }).where(eq(scans.id, scanId));

      // 4. Cache result in Redis (key: scan:{platform}:{handle})
      await redis.setex(
        `scan:${platform}:${handle.toLowerCase()}`,
        86400, // 24 hours
        JSON.stringify({ scanId, fraudScore: result.fraudScore, riskLevel: result.riskLevel })
      );

      const durationMs = Date.now() - startTime;
      businessLogger.scanCompleted(scanId, result.fraudScore, durationMs);
      track.scanCompleted(durationMs);

      if (durationMs > 30_000) {
        logger.warn({ scanId, durationMs }, 'Scan took longer than 30 seconds');
        captureMessage(
          `Slow scan detected: ${durationMs}ms for ${handle}`,
          'warning',
          { scanId, handle, durationMs }
        );
      }

      return result;
    } catch (error) {
      console.error(`Error processing scan ${scanId}:`, error);
      throw error; // Let BullMQ retry
    }
  },
  {
    connection: redis as any,
    concurrency: 5,
    limiter: { max: 10, duration: 60_000 },
  }
);

// On failure after all retries:
scanWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= job.opts.attempts!) {
    console.error(`Job ${job.id} completely failed after ${job.attemptsMade} attempts.`);
    
    businessLogger.scanFailed(job.data.scanId, err.message, job.attemptsMade);
    track.scanFailed();

    // Decrement quota
    await quotaService.decrementUsage(job.data.orgId);

    await db.update(scans).set({
      status: 'failed',
      errorMessage: err.message,
    }).where(eq(scans.id, job.data.scanId));
  }
});
