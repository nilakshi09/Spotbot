import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  commandTimeout: 2000,
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
