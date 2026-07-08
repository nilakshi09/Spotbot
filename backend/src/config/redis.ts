import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { env } from './env.js';

const redisUrl = new URL(env.REDIS_URL);
const useTls = redisUrl.protocol === 'rediss:';

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  commandTimeout: 5000,
  connectTimeout: 10000,
  ...(useTls && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

// Shared client for direct commands (cache, progress, locks)
export const redis = new Redis(env.REDIS_URL, baseOptions);

// Connection options for BullMQ (Queue & Worker create their own connections)
export const redisConnection: RedisOptions & { url: string } = {
  url: env.REDIS_URL,
  ...baseOptions,
};

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

