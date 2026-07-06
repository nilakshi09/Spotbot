import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as Sentry from '@sentry/node';
import { track, startMetricsLogging } from './utils/metrics.js';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import rawBody from 'fastify-raw-body';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import billingRoutes from './routes/billing.routes.js';
import scanRoutes from './routes/scan.routes.js';
import publicRoutes from './routes/public.routes.js';
import orgRoutes from './routes/org.routes.js';
import multipart from '@fastify/multipart';
import bulkScanRoutes from './routes/bulk-scan.routes.js';
import whiteLabelRoutes from './routes/white-label.routes.js';
import apiKeyRoutes from './routes/api-key.routes.js';
import salesLeadRoutes from './routes/sales-lead.routes.js';
export async function buildApp() {
  const app = Fastify({
    ignoreTrailingSlash: true,
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
  });

  // Register BEFORE other plugins and routes
  await app.register(rawBody, {
    field: 'rawBody',
    global: false,      // only on routes that opt in with config.rawBody: true
    encoding: false,    // preserve as Buffer
    runFirst: true,
  });

  // Register multipart BEFORE routes:
  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024,  // 1MB max CSV size
      files: 1,               // Only 1 file per request
    },
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
      ].filter(Boolean)

      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  // Cookie
  await app.register(cookie);

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Global error handler
  app.setErrorHandler(globalErrorHandler);

  // Monitoring Hooks
  app.addHook('onRequest', async (request) => {
    track.apiRequest();
    try {
      Sentry.setTag('requestId', request.id);
      const reqWithUser = request as { user?: { sub: string; email: string } };
      if (reqWithUser.user) {
        Sentry.setUser({
          id: reqWithUser.user.sub,
          email: reqWithUser.user.email,
        });
      }
    } catch {
      // ignore Sentry errors
    }
  });

  app.addHook('onError', async () => {
    track.apiError();
  });

  // Start metrics logging
  startMetricsLogging();

  // Routes
  await app.register(publicRoutes, { prefix: '/api/public' });
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(scanRoutes, { prefix: '/api/scans' });
  await app.register(bulkScanRoutes, { prefix: '/api/scans' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(reportRoutes, { prefix: '/api' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(orgRoutes, { prefix: '/api/org' });
  await app.register(whiteLabelRoutes, { prefix: '/api/org' });
  await app.register(apiKeyRoutes, { prefix: '/api/keys' });
  await app.register(salesLeadRoutes, { prefix: '/api/sales' });

  return app;
}
