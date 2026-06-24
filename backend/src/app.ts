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

export async function buildApp() {
  const app = Fastify({
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

  // CORS
  await app.register(cors, {
    origin: env.FRONTEND_URL,
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
      if ((request as any).user) {
        Sentry.setUser({
          id: (request as any).user.sub,
          email: (request as any).user.email,
        });
      }
    } catch (e) {
      // ignore Sentry errors
    }
  });

  app.addHook('onError', async () => {
    track.apiError();
  });

  // Start metrics logging
  startMetricsLogging();

  // Routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(scanRoutes, { prefix: '/api/scans' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(reportRoutes, { prefix: '/api' });
  await app.register(billingRoutes, { prefix: '/api/billing' });

  return app;
}
