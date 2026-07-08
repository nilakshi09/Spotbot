import { Worker, Job, UnrecoverableError } from 'bullmq';
import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { eq } from 'drizzle-orm';
import { redis, redisConnection } from '../config/redis.js';
import { ScanJobData } from './queue.js';
import { FraudEngine } from '../engine/engine.js';
import { InstagramClient } from '../integrations/instagram.client.js';
import { SocialBladeClient } from '../integrations/socialblade.client.js';
import { OpenAIClient } from '../integrations/openai.client.js';
import { quotaService } from '../services/quota.service.js';
import { captureMessage } from '../config/sentry.js';
import { track } from '../utils/metrics.js';
import { businessLogger, logger } from '../utils/logger.js';
import { bulkScanService } from '../services/bulk-scan.service.js';

const instagramClient = new InstagramClient();
const socialBladeClient = new SocialBladeClient();
const openAIClient = new OpenAIClient();

// Helper: update progress in Redis for frontend polling
async function updateProgress(scanId: string, step: string, stepsCompleted: number, totalSteps: number) {
  await redis.setex(`scan:progress:${scanId}`, 300, JSON.stringify({
    step,
    stepsCompleted,
    totalSteps,
    estimatedSecondsRemaining: Math.max(5, (totalSteps - stepsCompleted) * 5),
  }));
}

export async function startScanWorker() {
  const worker = new Worker<ScanJobData>(
    'scans',
    async (job: Job<ScanJobData>) => {
      const { scanId, platform, handle } = job.data;

      // 1. Update scan status → 'processing'
      await db.update(scans).set({ status: 'processing' }).where(eq(scans.id, scanId));

      const userId = job.data.userId || job.data.orgId;
      businessLogger.scanCreated(scanId, userId, platform, handle);
      track.scanCreated();
      const startTime = Date.now();

      try {
        // Report progress: initializing
        await updateProgress(scanId, 'initializing', 0, 6);

        // 2. Run fraud engine with progress callbacks
        const engine = new FraudEngine(instagramClient, socialBladeClient, openAIClient);

        // Wrap analyze() in a timeout as a last-resort safety net
        const result = await Promise.race([
          engine.analyze(platform, handle, async (step: string, stepsCompleted: number, totalSteps: number) => {
            await updateProgress(scanId, step, stepsCompleted, totalSteps);
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Scan timed out after 80 seconds')), 80_000)
          ),
        ]);

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

        // Clean up progress key
        await redis.del(`scan:progress:${scanId}`);

        const durationMs = Date.now() - startTime;
        businessLogger.scanCompleted(scanId, result.fraudScore, durationMs);
        track.scanCompleted(durationMs);

        if (job.data.bulkScanId !== undefined) {
          await bulkScanService.updateProgress(
            job.data.bulkScanId,
            job.data.bulkIndex!,
            {
              scanId: scanId,
              status: 'completed',
              fraudScore: result.fraudScore,
              riskLevel: result.riskLevel,
            },
          ).catch(e => logger.error({ e }, 'Failed to update bulk progress'));
        }

        if (durationMs > 30_000) {
          logger.warn({ scanId, durationMs }, 'Scan took longer than 30 seconds');
          captureMessage(
            `Slow scan detected: ${durationMs}ms for ${handle}`,
            'warning',
            { scanId, handle, durationMs }
          );
        }

        return result;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (err.message?.includes('Authentication failed')) {
          await redis.del(`scan:progress:${scanId}`).catch(() => {});
          console.error(`Unrecoverable error processing scan ${scanId}:`, err);
          throw new UnrecoverableError(err.message);
        }
        // Do not clean up progress key on transient failure so the UI doesn't hang at step 0
        console.error(`Error processing scan ${scanId}:`, err);
        throw err; // Let BullMQ retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 10, duration: 60_000 },
    }
  );

  // On failure after all retries:
  worker.on('failed', async (job, err) => {
    const isUnrecoverable = err.name === 'UnrecoverableError';
    if (job && (job.attemptsMade >= (job.opts.attempts || 3) || isUnrecoverable)) {
      console.error(`Job ${job.id} completely failed after ${job.attemptsMade} attempts.`);
      
      businessLogger.scanFailed(job.data.scanId, err.message, job.attemptsMade);
      track.scanFailed();

      // Update bulk scan progress on failure
      if (job.data.bulkScanId !== undefined) {
        await bulkScanService.updateProgress(
          job.data.bulkScanId,
          job.data.bulkIndex!,
          {
            scanId: job.data.scanId,
            status: 'failed',
            error: err.message,
          },
        ).catch(e => logger.error({ e }, 'Failed to update bulk progress'));
      }

      // Decrement quota
      await quotaService.decrementUsage(job.data.orgId);

      await db.update(scans).set({
        status: 'failed',
        errorMessage: err.message,
      }).where(eq(scans.id, job.data.scanId));
    }
  });

  worker.on('completed', (job) => {
    console.log(`Scan job ${job.id} completed`);
  });

  return worker;
}
