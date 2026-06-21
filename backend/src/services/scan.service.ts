import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { organizations } from '../db/schema/organizations.js';
import { eq, and, sql, desc, ilike, gte, lte } from 'drizzle-orm';
import { redis } from '../config/redis.js';
import { scanQueue } from '../jobs/queue.js';
import { quotaService } from './quota.service.js';
import { ScanLimitError } from '../middleware/quota.middleware.js';
import { AppError, NotFoundError } from '../middleware/error-handler.js';

export class ScanService {
  async createScan(userId: string, orgId: string, platform: 'instagram' | 'youtube', handle: string) {
    if (platform !== 'instagram') {
      throw new Error("Platform not supported");
    }

    // 1. Normalize handle (lowercase, strip @ prefix)
    const normalizedHandle = handle.toLowerCase().replace(/^@/, '');

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

  async getScan(scanId: string, userId: string) {
    const scan = await db.select().from(scans)
      .where(and(eq(scans.id, scanId), eq(scans.userId, userId)))
      .limit(1);

    if (!scan[0]) throw new NotFoundError('Scan not found or unauthorized');
    return scan[0];
  }

  async listScans(userId: string, filters: {
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
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(scans.userId, userId)];
    if (filters.platform) conditions.push(eq(scans.platform, filters.platform as any));
    if (filters.riskLevel) conditions.push(eq(scans.riskLevel, filters.riskLevel as any));
    if (filters.status) conditions.push(eq(scans.status, filters.status as any));
    if (filters.handle) conditions.push(ilike(scans.handle, `%${filters.handle}%`));
    if (filters.dateFrom) conditions.push(gte(scans.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(scans.createdAt, new Date(filters.dateTo)));
    if (filters.scoreMin !== undefined) conditions.push(gte(scans.fraudScore, filters.scoreMin));
    if (filters.scoreMax !== undefined) conditions.push(lte(scans.fraudScore, filters.scoreMax));

    const data = await db.select().from(scans)
      .where(and(...conditions))
      .orderBy(desc(scans.createdAt))
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
