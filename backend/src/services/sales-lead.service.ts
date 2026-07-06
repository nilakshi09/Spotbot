import { db } from '../db/client.js'
import { salesLeads, organizations } from '../db/schema/index.js'
import { eq, desc } from 'drizzle-orm'
import * as emailService from './email.service.js'
import { logger } from '../utils/logger.js'

export class SalesLeadService {

  // Submit a contact sales request
  async submitLead(
    userId: string | null,
    orgId: string | null,
    data: {
      companyName: string
      contactName: string
      contactEmail: string
      teamSize?: string
      estimatedScansPerMonth?: string
      message?: string
    },
  ) {
    const [lead] = await db
      .insert(salesLeads)
      .values({
        organizationId: orgId,
        userId,
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        teamSize: data.teamSize,
        estimatedScansPerMonth: data.estimatedScansPerMonth,
        message: data.message,
        status: 'new',
      })
      .returning()

    // Notify sales team
    await emailService.sendSalesLeadNotification(lead)

    // Send confirmation to the lead
    await emailService.sendSalesLeadConfirmation(
      data.contactEmail,
      data.contactName,
    )

    logger.info(
      { leadId: lead.id, companyName: data.companyName },
      'Sales lead submitted',
    )

    return {
      id: lead.id,
      message:
        'Thank you! Our team will reach out within 1 business day.',
    }
  }

  // List all leads (internal admin use — for founder dashboard)
  async listLeads() {
    return db.query.salesLeads.findMany({
      orderBy: [desc(salesLeads.createdAt)],
      limit: 100,
    })
  }

  // Manually upgrade an org to enterprise
  // (Used after a sales-assisted deal closes — no Stripe required)
  async manuallyGrantEnterprise(
    orgId: string,
    scanLimit: number = 999999,
  ) {
    await db
      .update(organizations)
      .set({
        plan: 'enterprise',
        scanLimit,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))

    logger.info({ orgId }, 'Organization manually upgraded to enterprise')

    return { upgraded: true, orgId, plan: 'enterprise' }
  }
}

export const salesLeadService = new SalesLeadService()
