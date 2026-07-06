import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { redis } from '../config/redis.js';
import { scanQueue } from '../jobs/queue.js';
import { env } from '../config/env.js';
import { getMetrics } from '../utils/metrics.js';
import { openApiSpec } from '../docs/openapi.js';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (req, reply) => {
    // const checks: Record<string, unknown> = {}
    const checks: Record<string, unknown> = {}
    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok'

    // Database check
    const dbStart = Date.now()
    try {
      await db.execute(sql`SELECT 1`)
      checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
    } catch {
      checks.database = {
        status: 'error',
        latencyMs: Date.now() - dbStart,
        error: 'Database unreachable',
      }
      overallStatus = 'down'
    }

    // Redis check
    const redisStart = Date.now()
    try {
      await redis.ping()
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
    } catch {
      checks.redis = {
        status: 'error',
        latencyMs: Date.now() - redisStart,
        error: 'Redis unreachable',
      }
      overallStatus = overallStatus === 'down' ? 'down' : 'degraded'
    }

    // Queue check
    try {
      const [waiting, active, failed] = await Promise.all([
        scanQueue.getWaitingCount(),
        scanQueue.getActiveCount(),
        scanQueue.getFailedCount(),
      ])
      checks.queue = {
        status: 'ok',
        waiting,
        active,
        failed,
      }
      // Warn if queue is backing up
      if (waiting > 50) {
  checks.queue = {
    status: 'degraded',
    waiting,
    active,
    failed,
    warning: 'Queue depth exceeds 50',
  }

  overallStatus = overallStatus === 'ok'
    ? 'degraded'
    : overallStatus
}
    } catch {
      checks.queue = { status: 'error', error: 'Queue unreachable' }
      overallStatus = overallStatus === 'ok' ? 'degraded' : overallStatus
    }

    const statusCode = overallStatus === 'down' ? 503 : 200

    return reply.status(statusCode).send({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
      environment: env.NODE_ENV,
      uptime: Math.round(process.uptime()),
      checks,
    })
  })

  // GET /api/health/live — simple liveness probe (for Railway/k8s)
  app.get('/api/health/live', async (req, reply) => {
    return reply.send({ status: 'ok' })
  })

  // GET /api/health/ready — readiness probe
  app.get('/api/health/ready', async (req, reply) => {
    try {
      await Promise.all([
        db.execute(sql`SELECT 1`),
        redis.ping(),
      ])
      return reply.send({ status: 'ready' })
    } catch {
      return reply.status(503).send({ status: 'not_ready' })
    }
  })

  app.get('/api/metrics', async (req, reply) => {
    const token = req.headers['x-internal-token']
    if (token !== env.INTERNAL_METRICS_TOKEN && env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    return reply.send(getMetrics())
  })

  // GET /api/docs — OpenAPI spec
  app.get('/docs', async (req, reply) => {
    return reply.send(openApiSpec)
  })

  // GET /api/docs/ui — Swagger UI HTML
  app.get('/docs/ui', async (req, reply) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Spotbot API Docs</title>
        <meta charset="utf-8"/>
        <link rel="stylesheet" type="text/css"
          href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            deepLinking: true,
          })
        </script>
      </body>
      </html>
    `
    return reply.header('Content-Type', 'text/html').send(html)
  })
}
