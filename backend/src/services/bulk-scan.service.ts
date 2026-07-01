import { db } from '../db/client.js'
import { bulkScans, scans, organizations, users } from '../db/schema/index.js'
import { eq, and, inArray, sql, desc } from 'drizzle-orm'
import { scanQueue } from '../jobs/queue.js'
import { quotaService } from './quota.service.js'
import { logger } from '../utils/logger.js'
import { redis } from '../config/redis.js'
import type { BulkHandle } from '../db/schema/bulk-scans.js'
import { AppError, NotFoundError, ValidationError } from '../middleware/error-handler.js'
import { ScanLimitError } from '../middleware/quota.middleware.js'

// Plan limits for bulk scanning
const BULK_SCAN_LIMITS = {
  free: 0,        // No bulk scanning on free plan
  starter: 50,    // 50 handles per bulk scan
  pro: 200,       // 200 handles per bulk scan
  enterprise: 500, // 500 handles per bulk scan
}

export class BulkScanService {

  // Get max handles allowed for org plan
  getMaxHandles(plan: string): number {
    return BULK_SCAN_LIMITS[plan as keyof typeof BULK_SCAN_LIMITS] ?? 0
  }

  // Create a new bulk scan job
  async createBulkScan(
    userId: string,
    orgId: string,
    handles: BulkHandle[],
  ) {
    // Get org to check plan and quota
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    if (!org) throw new NotFoundError('Organization')

    // Check if plan allows bulk scanning
    const maxHandles = this.getMaxHandles(org.plan)
    if (maxHandles === 0) {
      throw new AppError(
        402,
        'PLAN_NOT_SUPPORTED',
        'Bulk scanning is not available on the free plan. ' +
        'Upgrade to Starter or Pro to use bulk scanning.',
      )
    }

    // Limit handles to plan maximum
    const limitedHandles = handles.slice(0, maxHandles)

    // Check quota — will this exceed the monthly limit?
    const quotaStatus = await quotaService.getQuotaStatus(orgId)
    const remaining = quotaStatus.remaining

    if (remaining === 0) {
      throw new ScanLimitError(
        quotaStatus.scansUsed,
        quotaStatus.scanLimit,
        quotaStatus.plan,
      )
    }

    // Limit to remaining quota if needed
    const handleCount = Math.min(limitedHandles.length, remaining)
    const finalHandles = limitedHandles.slice(0, handleCount)

    if (handleCount < limitedHandles.length) {
      logger.warn(
        { orgId, requested: limitedHandles.length, allowed: handleCount },
        'Bulk scan limited by quota',
      )
    }

    // Create bulk scan record
    const [bulkScan] = await db
      .insert(bulkScans)
      .values({
        userId,
        organizationId: orgId,
        status: 'pending',
        totalHandles: finalHandles.length,
        handles: finalHandles,
      })
      .returning()

    // Enqueue individual scan jobs for each handle
    // Use bulk scan ID as a group identifier
    const jobs = finalHandles.map((item, index) => ({
      name: 'scan',
      data: {
        scanId: '',           // Will be set when scan record is created
        platform: item.platform,
        handle: item.handle,
        userId,
        orgId,
        bulkScanId: bulkScan.id,
        bulkIndex: index,
      },
      opts: {
        delay: index * 500,   // Stagger by 500ms to avoid rate limits
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }))

    // Add all jobs to queue
    await scanQueue.addBulk(jobs)

    // Increment quota usage for all handles
    await db.update(organizations)
      .set({
        scansUsed: sql`scans_used + ${finalHandles.length}`,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))

    logger.info(
      {
        bulkScanId: bulkScan.id,
        orgId,
        handleCount: finalHandles.length,
      },
      'Bulk scan created',
    )

    return {
      id: bulkScan.id,
      totalHandles: finalHandles.length,
      skippedHandles: handles.length - finalHandles.length,
      status: 'pending',
      message: handleCount < limitedHandles.length
        ? `Processing ${handleCount} of ${handles.length} handles ` +
          `(limited by monthly quota)`
        : `Processing ${finalHandles.length} handles`,
    }
  }

  // Get bulk scan status and progress
  async getBulkScan(bulkScanId: string, userId: string) {
    const bulkScan = await db.query.bulkScans.findFirst({
      where: and(
        eq(bulkScans.id, bulkScanId),
        eq(bulkScans.userId, userId),
      ),
    })

    if (!bulkScan) throw new NotFoundError('Bulk scan')

    const progressPct = bulkScan.totalHandles > 0
      ? Math.round(
          ((bulkScan.completedCount + bulkScan.failedCount) /
            bulkScan.totalHandles) * 100
        )
      : 0

    return {
      id: bulkScan.id,
      status: bulkScan.status,
      totalHandles: bulkScan.totalHandles,
      completedCount: bulkScan.completedCount,
      failedCount: bulkScan.failedCount,
      progressPct,
      handles: bulkScan.handles,
      resultUrl: bulkScan.resultUrl,
      createdAt: bulkScan.createdAt,
      completedAt: bulkScan.completedAt,
    }
  }

  // List bulk scans for a user
  async listBulkScans(userId: string) {
    const results = await db.query.bulkScans.findMany({
      where: eq(bulkScans.userId, userId),
      orderBy: [desc(bulkScans.createdAt)],
      limit: 20,
    })

    return results.map(b => ({
      id: b.id,
      status: b.status,
      totalHandles: b.totalHandles,
      completedCount: b.completedCount,
      failedCount: b.failedCount,
      progressPct: b.totalHandles > 0
        ? Math.round(
            ((b.completedCount + b.failedCount) / b.totalHandles) * 100
          )
        : 0,
      createdAt: b.createdAt,
      completedAt: b.completedAt,
    }))
  }

  // Update bulk scan progress
  // Called by scan worker after each individual scan completes
  async updateProgress(
    bulkScanId: string,
    handleIndex: number,
    result: {
      scanId: string
      status: 'completed' | 'failed'
      fraudScore?: number
      riskLevel?: string
      error?: string
    },
  ) {
    // Get current bulk scan
    const bulkScan = await db.query.bulkScans.findFirst({
      where: eq(bulkScans.id, bulkScanId),
    })

    if (!bulkScan) return

    // Update the specific handle in the handles array
    const updatedHandles = (bulkScan.handles as BulkHandle[]).map(
      (h, i) => {
        if (i === handleIndex) {
          return {
            ...h,
            scanId: result.scanId,
            status: result.status,
            fraudScore: result.fraudScore,
            riskLevel: result.riskLevel,
            error: result.error,
          }
        }
        return h
      }
    )

    // Count completed and failed
    const completedCount = updatedHandles.filter(
      h => h.status === 'completed'
    ).length
    const failedCount = updatedHandles.filter(
      h => h.status === 'failed'
    ).length
    const isAllDone =
      completedCount + failedCount >= bulkScan.totalHandles

    await db
      .update(bulkScans)
      .set({
        handles: updatedHandles,
        completedCount,
        failedCount,
        status: isAllDone ? 'completed' : 'processing',
        completedAt: isAllDone ? new Date() : null,
      })
      .where(eq(bulkScans.id, bulkScanId))

    // Store progress in Redis for real-time polling
    await redis.setex(
      `bulk:progress:${bulkScanId}`,
      3600,  // 1 hour TTL
      JSON.stringify({ completedCount, failedCount, progressPct:
        Math.round((completedCount + failedCount) / bulkScan.totalHandles * 100)
      }),
    )

    logger.info(
      {
        bulkScanId,
        completedCount,
        failedCount,
        isAllDone,
      },
      'Bulk scan progress updated',
    )
  }

  // Generate CSV results file
  async generateResultsCSV(
    bulkScanId: string,
    userId: string,
  ): Promise<string> {
    const bulkScan = await db.query.bulkScans.findFirst({
      where: and(
        eq(bulkScans.id, bulkScanId),
        eq(bulkScans.userId, userId),
      ),
    })

    if (!bulkScan) throw new NotFoundError('Bulk scan')

    if (bulkScan.status !== 'completed') {
      throw new ValidationError(
        'Bulk scan is not yet completed'
      )
    }

    const handles = bulkScan.handles as BulkHandle[]

    // Build CSV content
    const headers = [
      'handle',
      'platform',
      'fraud_score',
      'risk_level',
      'status',
      'error',
    ]

    const rows = handles.map(h => [
      h.handle,
      h.platform,
      h.fraudScore ?? '',
      h.riskLevel ?? '',
      h.status,
      h.error ?? '',
    ])

    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell
        ).join(',')
      ),
    ]

    return csvLines.join('\n')
  }

  async refundQuota(orgId: string, handleCount: number): Promise<void> {
    await db.update(organizations)
      .set({
        scansUsed: sql`GREATEST(scans_used - ${handleCount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))

    logger.info(
      { orgId, handleCount },
      'Bulk scan quota refunded',
    )
  }
}

export const bulkScanService = new BulkScanService()
