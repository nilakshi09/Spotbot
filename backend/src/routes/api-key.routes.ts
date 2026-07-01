import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { apiKeyService } from '../services/api-key.service.js'
import { verifyAccessToken } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/role.middleware.js'

export default async function apiKeyRoutes(
  app: FastifyInstance
) {

  // GET /api/keys
  // List all API keys for the org
  app.get('/', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const keys = await apiKeyService.listApiKeys((req as any).user.orgId)
    return reply.send({ data: keys })
  })

  // POST /api/keys
  // Create a new API key (admin only)
  app.post('/', {
    preHandler: [verifyAccessToken, requireAdmin],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        expiresInDays: z.number().int().min(1).max(365).optional(),
      }),
    },
  }, async (req, reply) => {
    const { name, expiresInDays } = req.body as {
      name: string
      expiresInDays?: number
    }

    const result = await apiKeyService.createApiKey(
      (req as any).user.orgId,
      (req as any).user.sub,
      name,
      expiresInDays,
    )

    return reply.status(201).send(result)
  })

  // DELETE /api/keys/:id
  // Revoke an API key (admin only)
  app.delete('/:id', {
    preHandler: [verifyAccessToken, requireAdmin],
    schema: {
      params: z.object({ id: z.string().uuid() }),
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const result = await apiKeyService.revokeApiKey(
      (req as any).user.orgId,
      id,
    )
    return reply.send(result)
  })

  // POST /api/keys/:id/rotate
  // Rotate an API key (revoke + create new)
  app.post('/:id/rotate', {
    preHandler: [verifyAccessToken, requireAdmin],
    schema: {
      params: z.object({ id: z.string().uuid() }),
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const result = await apiKeyService.rotateApiKey(
      (req as any).user.orgId,
      (req as any).user.sub,
      id,
    )
    return reply.status(201).send(result)
  })
}
