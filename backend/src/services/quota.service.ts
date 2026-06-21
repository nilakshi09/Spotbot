import { db } from '../db/client'
import { organizations } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { logger } from '../utils/logger'
import { NotFoundError } from '../middleware/error-handler'

export class QuotaService {

  // Atomically increment scan usage
  // Uses SQL increment to prevent race conditions
  // Returns the new scansUsed value
  async incrementUsage(orgId: string): Promise<number> {
    const result = await db
      .update(organizations)
      .set({
        scansUsed: sql`scans_used + 1`,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning({ scansUsed: organizations.scansUsed })

    const newCount = result[0]?.scansUsed ?? 0

    logger.info({ orgId, scansUsed: newCount }, 'Scan quota incremented')

    return newCount
  }

  // Decrement usage (called if scan fails after quota was incremented)
  async decrementUsage(orgId: string): Promise<void> {
    await db
      .update(organizations)
      .set({
        scansUsed: sql`GREATEST(scans_used - 1, 0)`,  // never go below 0
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))

    logger.info({ orgId }, 'Scan quota decremented (scan failed)')
  }

  // Get current quota status
  async getQuotaStatus(orgId: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: {
        plan: true,
        scanLimit: true,
        scansUsed: true,
        billingCycleStart: true,
      },
    })

    if (!org) throw new NotFoundError('Organization')

    const remaining = Math.max(0, org.scanLimit - org.scansUsed)
    const percentUsed = Math.round((org.scansUsed / org.scanLimit) * 100)

    return {
      plan: org.plan,
      scanLimit: org.scanLimit,
      scansUsed: org.scansUsed,
      remaining,
      percentUsed,
      isAtLimit: org.scansUsed >= org.scanLimit,
      billingCycleStart: org.billingCycleStart,
    }
  }
}

export const quotaService = new QuotaService()
