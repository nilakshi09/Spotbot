import type { FastifyInstance } from 'fastify'

import { salesLeadService } from '../services/sales-lead.service.js'

export default async function salesLeadRoutes(
  app: FastifyInstance
) {

  // POST /api/sales/contact
  // Submit a contact sales request
  // Auth: optional (works for logged-in and logged-out users)
  app.post('/contact', {
    schema: {
      body: {
        type: 'object',
        required: ['companyName', 'contactName', 'contactEmail'],
        properties: {
          companyName: { type: 'string', minLength: 1, maxLength: 255 },
          contactName: { type: 'string', minLength: 1, maxLength: 255 },
          contactEmail: { type: 'string', format: 'email' },
          teamSize: { type: 'string', maxLength: 50 },
          estimatedScansPerMonth: { type: 'string', maxLength: 50 },
          message: { type: 'string', maxLength: 2000 },
        },
      },
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
        const payload = app.jwt.verify(token) as { sub?: string; orgId?: string };
        userId = payload.sub ?? null
        orgId = payload.orgId ?? null
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
