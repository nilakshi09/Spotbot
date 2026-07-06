import type { FastifyRequest } from 'fastify'
import { db } from '../db/client'
import { organizations } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../utils/logger'
import { AppError, NotFoundError } from './error-handler'

export class ScanLimitError extends AppError {
  constructor(used: number, limit: number, plan: string) {
    super(402, 'SCAN_LIMIT_REACHED', `Monthly scan limit reached (${used}/${limit})`, {
      used,
      limit,
      plan,
      upgradeUrl: '/billing',
    })
  }
}

export async function checkScanQuota(
  req: FastifyRequest,
): Promise<void> {
  const orgId = req.user.orgId

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: {
      id: true,
      plan: true,
      scanLimit: true,
      scansUsed: true,
    },
  })

  if (!org) {
    throw new NotFoundError('Organization')
  }

  if (org.scansUsed >= org.scanLimit) {
    logger.info(
      { orgId, scansUsed: org.scansUsed, scanLimit: org.scanLimit, plan: org.plan },
      'Scan quota exceeded',
    )
    throw new ScanLimitError(org.scansUsed, org.scanLimit, org.plan)
  }
}
