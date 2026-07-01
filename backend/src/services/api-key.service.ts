import crypto from 'crypto'
import { db } from '../db/client.js'
import { apiKeys, organizations } from '../db/schema/index.js'
import { eq, and, desc } from 'drizzle-orm'
import { logger } from '../utils/logger.js'
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '../middleware/error-handler.js'
import { redis } from '../config/redis.js'

// Key format: sb_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// sb = Spotbot prefix
// live = environment
// 32 random bytes = 64 hex chars

const KEY_PREFIX_FORMAT = 'sb_live_'

export class ApiKeyService {

  // Check plan allows API access
  private async requireProOrEnterprise(orgId: string): Promise<void> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { plan: true },
    })

    if (!org) throw new NotFoundError('Organization')

    if (!['pro', 'enterprise'].includes(org.plan)) {
      throw new AppError(
        402,
        'PLAN_NOT_SUPPORTED',
        'API access requires Pro or Enterprise plan.',
      )
    }
  }

  // Generate a new API key
  async createApiKey(
    orgId: string,
    userId: string,
    name: string,
    expiresInDays?: number,
  ) {
    await this.requireProOrEnterprise(orgId)

    // Check key limit per org (max 10 keys)
    const existingKeys = await db.query.apiKeys.findMany({
      where: and(
        eq(apiKeys.organizationId, orgId),
        eq(apiKeys.isActive, true),
      ),
      columns: { id: true },
    })

    if (existingKeys.length >= 10) {
      throw new ValidationError(
        'Maximum of 10 active API keys per organization. ' +
        'Revoke an existing key before creating a new one.',
      )
    }

    // Generate raw key (shown ONCE to user)
    const rawKey = crypto.randomBytes(32).toString('hex')
    const fullKey = `${KEY_PREFIX_FORMAT}${rawKey}`

    // Hash key for storage
    const keyHash = crypto
      .createHash('sha256')
      .update(fullKey)
      .digest('hex')

    // Store prefix for identification (first 12 chars after sb_live_)
    const keyPrefix = `${KEY_PREFIX_FORMAT}${rawKey.slice(0, 6)}...`

    // Calculate expiry
    let expiresAt: Date | null = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Save to DB
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        organizationId: orgId,
        createdByUserId: userId,
        name,
        keyHash,
        keyPrefix,
        expiresAt,
        rateLimit: 60,  // 60 requests per minute
      })
      .returning()

    logger.info(
      { orgId, userId, keyId: apiKey.id, name },
      'API key created',
    )

    // Return the FULL key only here — never again
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey,          // Only time this is returned
      keyPrefix,
      expiresAt: expiresAt?.toISOString() ?? null,
      createdAt: apiKey.createdAt.toISOString(),
      warning: 'Save this key now — it will not be shown again.',
    }
  }

  // Validate an API key and return org context
  async validateApiKey(fullKey: string) {
    // Validate format
    if (!fullKey.startsWith(KEY_PREFIX_FORMAT)) {
      throw new UnauthorizedError('Invalid API key format')
    }

    // Hash the provided key
    const keyHash = crypto
      .createHash('sha256')
      .update(fullKey)
      .digest('hex')

    // Look up key
    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true),
      ),
    })

    if (!apiKey) {
      throw new UnauthorizedError('Invalid or revoked API key')
    }

    // Check expiry
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new UnauthorizedError('API key has expired')
    }

    // Update last used + request count (fire and forget)
    db.update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        requestCount: apiKey.requestCount + 1,
      })
      .where(eq(apiKeys.id, apiKey.id))
      .catch(err => logger.error({ err }, 'Failed to update API key usage'))

    return {
      keyId: apiKey.id,
      orgId: apiKey.organizationId,
      rateLimit: apiKey.rateLimit,
    }
  }

  // List all API keys for an org
  async listApiKeys(orgId: string) {
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.organizationId, orgId),
      orderBy: [desc(apiKeys.createdAt)],
    })

    // Never return keyHash
    return keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      requestCount: k.requestCount,
      createdAt: k.createdAt.toISOString(),
    }))
  }

  // Revoke an API key
  async revokeApiKey(
    orgId: string,
    keyId: string,
  ) {
    const key = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.organizationId, orgId),
      ),
    })

    if (!key) throw new NotFoundError('API key')

    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, keyId))

    // Remove from Redis cache
    await redis.del(`apikey:${key.keyHash}`)

    logger.info({ orgId, keyId }, 'API key revoked')

    return { revoked: true }
  }

  // Rotate an API key (revoke old, create new with same name)
  async rotateApiKey(
    orgId: string,
    userId: string,
    keyId: string,
  ) {
    const key = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.organizationId, orgId),
      ),
    })

    if (!key) throw new NotFoundError('API key')

    // Revoke old key
    await this.revokeApiKey(orgId, keyId)

    // Create new key with same name
    return this.createApiKey(orgId, userId, key.name)
  }
}

export const apiKeyService = new ApiKeyService()
