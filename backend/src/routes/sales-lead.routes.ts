import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { salesLeadService } from '../services/sales-lead.service.js'

export default async function salesLeadRoutes(
  app: FastifyInstance
) {

  // POST /api/sales/contact
  // Submit a contact sales request
  // Auth: optional (works for logged-in and logged-out users)
  app.post('/contact', {
    schema: {
      body: z.object({
        companyName: z.string().min(1).max(255),
        contactName: z.string().min(1).max(255),
        contactEmail: z.string().email(),
        teamSize: z.string().max(50).optional(),
        estimatedScansPerMonth: z.string().max(50).optional(),
        message: z.string().max(2000).optional(),
      }),
    },
  }, async (req, reply) => {
    const data = req.body as {
      companyName: string
      contactName: string
      contactEmail: string
      teamSize?: string
      estimatedScansPerMonth?: string
      message?: string
    }

    // Try to get auth context if logged in (optional)
    let userId: string | null = null
    let orgId: string | null = null

    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = app.jwt.verify(token) as any
        userId = payload.sub
        orgId = payload.orgId
      } catch {
        // Not logged in or invalid token — proceed as anonymous lead
      }
    }

    const result = await salesLeadService.submitLead(
      userId,
      orgId,
      data,
    )

    return reply.status(201).send(result)
  })
}
