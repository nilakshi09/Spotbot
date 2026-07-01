import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { bulkScanService } from '../services/bulk-scan.service.js'
import { csvParserService } from '../services/csv-parser.service.js'
import { verifyAccessToken } from '../middleware/auth.middleware.js'
import { db } from '../db/client.js'
import { organizations, bulkScans } from '../db/schema/index.js'
import { eq, and } from 'drizzle-orm'
import { AppError, NotFoundError, ValidationError } from '../middleware/error-handler.js'
import { redis } from '../config/redis.js'

export default async function bulkScanRoutes(app: FastifyInstance) {

  // ─── POST /api/scans/bulk ─────────────────────────────────────
  // Upload CSV and create bulk scan
  // Content-Type: multipart/form-data

  app.post('/bulk', {
    preHandler: [verifyAccessToken],
    config: { rawBody: false },
  }, async (req, reply) => {
    // Get org to determine plan limits
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, req.user.orgId),
    })

    if (!org) throw new NotFoundError('Organization')

    const maxHandles = bulkScanService.getMaxHandles(org.plan)

    if (maxHandles === 0) {
      throw new AppError(
        402,
        'PLAN_NOT_SUPPORTED',
        'Bulk scanning requires Starter plan or above',
      )
    }

    // Parse multipart form data
    const data = await req.file()

    if (!data) {
      throw new ValidationError('No CSV file uploaded')
    }

    if (!data.filename.endsWith('.csv')) {
      throw new ValidationError('File must be a CSV (.csv)')
    }

    // Read file content
    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const csvContent = Buffer.concat(chunks).toString('utf-8')

    if (!csvContent.trim()) {
      throw new ValidationError('CSV file is empty')
    }

    // Parse CSV
    const parsed = csvParserService.parse(csvContent, maxHandles)

    if (parsed.handles.length === 0) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_CSV',
          message: 'No valid handles found in CSV',
          details: { errors: parsed.errors },
        },
      })
    }

    // Create bulk scan
    const result = await bulkScanService.createBulkScan(
      req.user.sub,
      req.user.orgId,
      parsed.handles,
    )

    return reply.status(201).send({
      ...result,
      parseWarnings: parsed.errors,
    })
  })

  // ─── GET /api/scans/bulk ──────────────────────────────────────
  // List all bulk scans for current user

  app.get('/bulk', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const results = await bulkScanService.listBulkScans(req.user.sub)
    return reply.send({ data: results })
  })

  // ─── GET /api/scans/bulk/:id ──────────────────────────────────
  // Get bulk scan status and progress

  app.get('/bulk/:id', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await bulkScanService.getBulkScan(id, req.user.sub)
    return reply.send(result)
  })

  // ─── GET /api/scans/bulk/:id/download ────────────────────────
  // Download bulk scan results as CSV

  app.get('/bulk/:id/download', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const csv = await bulkScanService.generateResultsCSV(
      id,
      req.user.sub,
    )

    return reply
      .header('Content-Type', 'text/csv')
      .header(
        'Content-Disposition',
        `attachment; filename="spotbot-bulk-${id.slice(0, 8)}.csv"`,
      )
      .send(csv)
  })

  // ─── GET /api/scans/bulk/template ────────────────────────────
  // Download CSV template

  app.get('/bulk/template', async (req, reply) => {
    const template = csvParserService.generateTemplate()

    return reply
      .header('Content-Type', 'text/csv')
      .header(
        'Content-Disposition',
        'attachment; filename="spotbot-bulk-template.csv"',
      )
      .send(template)
  })

  // ─── GET /api/scans/bulk/:id/progress ──────────────────────────
  // Returns real-time progress from Redis
  // Lightweight endpoint for frequent polling

  app.get('/bulk/:id/progress', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    // Try Redis first for real-time data
    const cached = await redis.get(`bulk:progress:${id}`)
    if (cached) {
      return reply.send(JSON.parse(cached))
    }

    // Fall back to DB
    const bulkScan = await db.query.bulkScans.findFirst({
      where: and(
        eq(bulkScans.id, id),
        eq(bulkScans.userId, req.user.sub),
      ),
      columns: {
        id: true,
        status: true,
        totalHandles: true,
        completedCount: true,
        failedCount: true,
      },
    })

    if (!bulkScan) throw new NotFoundError('Bulk scan')

    const progressPct = bulkScan.totalHandles > 0
      ? Math.round(
          ((bulkScan.completedCount + bulkScan.failedCount) /
            bulkScan.totalHandles) * 100
        )
      : 0

    return reply.send({
      status: bulkScan.status,
      completedCount: bulkScan.completedCount,
      failedCount: bulkScan.failedCount,
      progressPct,
    })
  })
}
