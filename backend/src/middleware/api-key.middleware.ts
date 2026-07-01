import type { FastifyRequest, FastifyReply } from 'fastify'
import { apiKeyService } from '../services/api-key.service.js'
import { db } from '../db/client.js'
import { organizations, users } from '../db/schema/index.js'
import { eq, and } from 'drizzle-orm'
import { redis } from '../config/redis.js'
import crypto from 'crypto'
import { verifyAccessToken } from './auth.middleware.js'
import { UnauthorizedError, AppError } from './error-handler.js'

// Middleware that accepts EITHER JWT OR API key
// Tries JWT first, then falls back to API key
export async function verifyJwtOrApiKey(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = req.headers.authorization
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined

  // Try JWT first (existing middleware)
  if (authHeader?.startsWith('Bearer ')) {
    try {
      await verifyAccessToken(req)
      return  // JWT valid — proceed
    } catch {
      // JWT failed — try API key if provided
    }
  }

  // Try API key
  if (apiKeyHeader) {
    await authenticateWithApiKey(req, apiKeyHeader)
    return
  }

  throw new UnauthorizedError('Authentication required. ' +
    'Provide a Bearer token or X-API-Key header.')
}

// Authenticate request using API key
async function authenticateWithApiKey(
  req: FastifyRequest,
  apiKey: string,
): Promise<void> {
  // Check Redis cache first (avoid DB hit on every request)
  const cacheKey = `apikey:${crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')
    .slice(0, 16)}`

  const cached = await redis.get(cacheKey)

  let orgId: string
  let keyId: string
  let rateLimit: number

  if (cached) {
    const parsed = JSON.parse(cached)
    orgId = parsed.orgId
    keyId = parsed.keyId
    rateLimit = parsed.rateLimit
  } else {
    // Validate key against DB
    const result = await apiKeyService.validateApiKey(apiKey)
    orgId = result.orgId
    keyId = result.keyId
    rateLimit = result.rateLimit

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result))
  }

  // Apply rate limiting for this API key
  await checkApiKeyRateLimit(keyId, rateLimit)

  // Load org and build user context
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: {
      id: true,
      plan: true,
      scanLimit: true,
      scansUsed: true,
    },
  })

  if (!org) throw new UnauthorizedError('Organization not found')

  // Find the org's admin user to act as
  // (API keys act with admin permissions)
  const adminUser = await db.query.users.findFirst({
    where: and(
      eq(users.organizationId, orgId),
      eq(users.role, 'admin'),
    ),
    columns: { id: true, email: true },
  })

  if (!adminUser) throw new UnauthorizedError('No admin user found')

  // Set user context on request (same shape as JWT middleware)
  ;(req as any).user = {
    sub: adminUser.id,
    email: adminUser.email,
    orgId,
    role: 'admin',
    plan: org.plan,
    authMethod: 'api_key',
    apiKeyId: keyId,
  }
}

// Per-key rate limiting using Redis
async function checkApiKeyRateLimit(
  keyId: string,
  limitPerMinute: number,
): Promise<void> {
  const rateLimitKey = `ratelimit:apikey:${keyId}`
  const count = await redis.incr(rateLimitKey)

  if (count === 1) {
    await redis.expire(rateLimitKey, 60)
  }

  if (count > limitPerMinute) {
    throw new AppError(
      429,
      'RATE_LIMITED',
      `API key rate limit exceeded. ` +
      `Maximum ${limitPerMinute} requests per minute.`,
    )
  }
}
