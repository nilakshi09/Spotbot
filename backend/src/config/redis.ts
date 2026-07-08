import Redis from 'ioredis';
import { env } from './env.js';

const redisUrl = new URL(env.REDIS_URL);
const useTls = redisUrl.protocol === 'rediss:';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  commandTimeout: 5000,
  connectTimeout: 10000,
  ...(useTls && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
