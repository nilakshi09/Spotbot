import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const scanQueue = new Queue('scans', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export interface ScanJobData {
  scanId: string;
  platform: 'instagram' | 'youtube';
  handle: string;
  userId: string;
  orgId: string;
  bulkScanId?: string;
  bulkIndex?: number;
}
