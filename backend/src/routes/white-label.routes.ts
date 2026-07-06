import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { whiteLabelService } from '../services/white-label.service.js'
import { verifyAccessToken } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/role.middleware.js'
import { ValidationError, AppError } from '../middleware/error-handler.js'
import { env } from '../config/env.js'

export default async function whiteLabelRoutes(
  app: FastifyInstance
) {

  // GET /api/org/branding
  // Get current branding config
  // Auth: required (any member can view)
  app.get('/branding', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const branding = await whiteLabelService.getBranding(
      (req as FastifyRequest & { user: { orgId: string } }).user.orgId
    )
    return reply.send(branding)
  })

  // PATCH /api/org/branding
  // Update branding settings (enterprise + admin only)
  app.patch('/branding', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    const schema = z.object({
        companyName: z.string().min(1).max(255).optional(),
        logoUrl: z.string().url().optional(),
        primaryColor: z.string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color')
          .optional(),
        accentColor: z.string()
          .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color')
          .optional(),
        reportFooterText: z.string().max(500).optional(),
        reportHeaderText: z.string().max(255).optional(),
        hidePoweredBySpotbot: z.boolean().optional(),
        hideSpotbotLogo: z.boolean().optional(),
    });
    const updates = schema.parse(req.body);
    const branding = await whiteLabelService.updateBranding(
      (req as FastifyRequest & { user: { orgId: string } }).user.orgId,
      updates,
    )
    return reply.send(branding)
  })

  // DELETE /api/org/branding
  // Reset branding to Spotbot defaults
  app.delete('/branding', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    await whiteLabelService.resetBranding((req as FastifyRequest & { user: { orgId: string } }).user.orgId)
    return reply.send({ reset: true })
  })

  // POST /api/org/branding/logo
  // Upload logo image
  app.post('/branding/logo', {
    preHandler: [verifyAccessToken, requireAdmin],
    config: { rawBody: false },
  }, async (req, reply) => {
    const data = await req.file()

    if (!data) {
      throw new ValidationError('No file uploaded')
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(data.mimetype)) {
      throw new ValidationError(
        'Logo must be PNG, JPEG, SVG, or WebP'
      )
    }

    // Read file
    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const fileBuffer = Buffer.concat(chunks)

    // Validate size (max 2MB)
    if (fileBuffer.length > 2 * 1024 * 1024) {
      throw new ValidationError('Logo must be under 2MB')
    }

    // Upload to Supabase Storage
    const logoUrl = await uploadLogo(
      (req as FastifyRequest & { user: { orgId: string } }).user.orgId,
      fileBuffer,
      data.mimetype,
    )

    await whiteLabelService.updateLogoUrl((req as FastifyRequest & { user: { orgId: string } }).user.orgId, logoUrl)

    return reply.send({ logoUrl })
  })
}

// Upload logo to Supabase Storage
async function uploadLogo(
  orgId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    env.SUPABASE_URL!,
    env.SUPABASE_ANON_KEY!,
  )

  const ext = mimeType.split('/')[1].replace('svg+xml', 'svg')
  const fileName = `logos/${orgId}.${ext}`

  const { error } = await supabase.storage
    .from('reports')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    throw new AppError(500, 'UPLOAD_FAILED', 'Failed to upload logo')
  }

  const { data } = supabase.storage
    .from('reports')
    .getPublicUrl(fileName)

  return data.publicUrl
}
