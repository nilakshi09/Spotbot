import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { users } from '../db/schema/users.js';
import { eq, and, sql, desc, asc, ilike, gte, lte, inArray, SQL } from 'drizzle-orm';
import { redis } from '../config/redis.js';
import { scanQueue } from '../jobs/queue.js';
import { quotaService } from './quota.service.js';
import { ScanLimitError } from '../middleware/quota.middleware.js';
import { AppError, NotFoundError } from '../middleware/error-handler.js';

export class ScanService {
  async createScan(userId: string, orgId: string, platform: 'instagram' | 'youtube', handle: string) {
    // Validate handle format based on platform
    const cleanHandle = handle.replace(/^@/, '');
    const handleRegex = platform === 'youtube'
      ? /^[a-zA-Z0-9._-]{1,100}$/   // YouTube handles are more flexible
      : /^[a-zA-Z0-9._]{1,30}$/;    // Instagram handles

    if (!handleRegex.test(cleanHandle)) {
      throw new AppError(400, `Invalid ${platform} handle format`, 'VALIDATION_ERROR');
    }

    // 1. Normalize handle (lowercase, strip @ prefix)
    const normalizedHandle = cleanHandle.toLowerCase();

    // 2. Check Redis cache (key: scan:{platform}:{handle})
    const cached = await redis.get(`scan:${platform}:${normalizedHandle}`);
    if (cached) {
      const { scanId } = JSON.parse(cached);
      const existingScan = await db.select().from(scans).where(eq(scans.id, scanId)).limit(1);
      if (existingScan[0]?.status === 'completed') {
        return { scan: existingScan[0], cached: true };
      }
    }

    // 3. Check org scan quota with Redis lock
    const lockKey = `scan:lock:${orgId}`;
    const lockAcquired = await redis.set(lockKey, '1', 'EX', 5, 'NX');
    if (!lockAcquired) {
      throw new AppError(429, 'Another scan is being created. Please wait a moment.', 'TOO_MANY_REQUESTS');
    }

    try {
      const quotaStatus = await quotaService.getQuotaStatus(orgId);
      if (quotaStatus.isAtLimit) {
        throw new ScanLimitError(quotaStatus.scansUsed, quotaStatus.scanLimit, quotaStatus.plan);
      }

      // 4. Create scan record
      const [scan] = await db.insert(scans).values({
        userId,
        platform,
        handle: normalizedHandle,
        status: 'pending',
      }).returning();

      // 5. Enqueue job
      await scanQueue.add('scan', {
        scanId: scan.id,
        platform,
        handle: normalizedHandle,
        userId,
        orgId, // ADD THIS
      });

      // 6. Increment org scansUsed
      await quotaService.incrementUsage(orgId);

      return { scan, cached: false };
    } finally {
      await redis.del(lockKey);
    }
  }

  async getScan(scanId: string, userId: string, orgId?: string, role?: string) {
    const isAdmin = role === 'admin';

    let condition: SQL;
    if (isAdmin && orgId) {
      condition = and(
        eq(scans.id, scanId),
        inArray(
          scans.userId,
          db.select({ id: users.id }).from(users).where(eq(users.organizationId, orgId))
        )
      )!;
    } else {
      condition = and(eq(scans.id, scanId), eq(scans.userId, userId))!;
    }

    const scan = await db.select().from(scans)
      .where(condition)
      .limit(1);

    if (!scan[0]) throw new NotFoundError('Scan not found or unauthorized');
    return scan[0];
  }

  async listScans(userId: string, orgId: string, role: string, filters: {
    platform?: string;
    riskLevel?: string;
    page?: number;
    limit?: number;
    handle?: string;
    dateFrom?: string;
    dateTo?: string;
    scoreMin?: number;
    scoreMax?: number;
    status?: string;
    orderBy?: 'created_at' | 'fraud_score' | 'handle';
    order?: 'asc' | 'desc';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const isAdmin = role === 'admin';

    let baseCondition: SQL;
    if (isAdmin && orgId) {
      baseCondition = inArray(
        scans.userId,
        db.select({ id: users.id }).from(users).where(eq(users.organizationId, orgId))
      )!;
    } else {
      baseCondition = eq(scans.userId, userId)!;
    }

    const conditions = [baseCondition];
    if (filters.platform) conditions.push(eq(scans.platform, filters.platform as 'instagram' | 'youtube'));
    if (filters.riskLevel) conditions.push(eq(scans.riskLevel, filters.riskLevel as 'low' | 'medium' | 'high'));
    if (filters.status) conditions.push(eq(scans.status, filters.status as 'pending' | 'processing' | 'completed' | 'failed'));
    if (filters.handle) conditions.push(ilike(scans.handle, `%${filters.handle}%`));
    if (filters.dateFrom) conditions.push(gte(scans.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(scans.createdAt, new Date(filters.dateTo)));
    if (filters.scoreMin !== undefined) conditions.push(gte(scans.fraudScore, filters.scoreMin));
    if (filters.scoreMax !== undefined) conditions.push(lte(scans.fraudScore, filters.scoreMax));

    const orderByMap: Record<string, unknown> = {
      created_at: scans.createdAt,
      fraud_score: scans.fraudScore,
      handle: scans.handle,
    };
    const orderByCol = (orderByMap[filters.orderBy ?? 'created_at'] || scans.createdAt) as import('drizzle-orm').SQL;
    const orderDir = filters.order === 'asc' ? asc : desc;

    const data = await db.select().from(scans)
      .where(and(...conditions))
      .orderBy(orderDir(orderByCol))
      .limit(limit).offset(offset);
    
    // Count query
    const countResult = await db.select({ count: sql<number>`cast(count(${scans.id}) as int)` })
      .from(scans)
      .where(and(...conditions));
    const total = countResult[0].count;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async deleteScan(scanId: string, userId: string) {
    const deleted = await db.delete(scans)
      .where(and(eq(scans.id, scanId), eq(scans.userId, userId)))
      .returning({ id: scans.id });
    
    if (deleted.length === 0) {
      throw new NotFoundError('Scan not found or unauthorized');
    }
  }

  async rescan(scanId: string, userId: string, orgId: string) {
    const existing = await this.getScan(scanId, userId);
    
    // Clear redis cache
    await redis.del(`scan:${existing.platform}:${existing.handle}`);
    
    // Delete old scan (or we could just spawn a new one, but spec says "creates new scan job")
    // Creating a new scan is cleaner than modifying the existing one's status.
    return this.createScan(userId, orgId, existing.platform, existing.handle);
  }
}
