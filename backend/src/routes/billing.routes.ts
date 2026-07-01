import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { billingService } from '../services/billing.service.js';
import { webhookService } from '../services/webhook.service.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { db } from '../db/client.js';
import { organizations } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { stripe } from '../integrations/stripe.client.js';

export default async function billingRoutes(app: FastifyInstance) {

  // ─── GET SUBSCRIPTION ──────────────────────────────────────────────────
  app.get('/subscription', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const subscription = await billingService.getSubscription(req.user.orgId);
    return reply.send(subscription);
  });

  // ─── CREATE CHECKOUT SESSION ───────────────────────────────────────────
  const checkoutSchema = z.object({
    priceId: z.string().startsWith('price_'),
  });

  app.post('/checkout', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const { priceId } = checkoutSchema.parse(req.body);
    const result = await billingService.createCheckoutSession(
      req.user.orgId,
      req.user.sub,
      priceId,
    );
    return reply.send(result);
  });

  // ─── CREATE PORTAL SESSION ─────────────────────────────────────────────
  app.post('/portal', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const result = await billingService.createPortalSession(req.user.orgId);
    return reply.send(result);
  });

  // ─── STRIPE WEBHOOK ────────────────────────────────────────────────────
  // CRITICAL: Must receive raw body (not parsed JSON) for signature verification
  app.post('/webhook', {
    config: {
      rawBody: true,   // Fastify raw body plugin required
    },
  }, async (req, reply) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    // req.rawBody must be Buffer — configure Fastify to preserve raw body
    const result = await webhookService.handleWebhookEvent(
      req.rawBody as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    return reply.send(result);
  });

  // ─── GET INVOICES ──────────────────────────────────────────────────────
  app.get('/invoices', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    // If Stripe is not configured, return empty gracefully
    if (!env.STRIPE_SECRET_KEY) {
      return reply.send({
        invoices: [],
        stripeConfigured: false,
      })
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, req.user.orgId),
    });

    if (!org?.stripeCustomerId) {
      return reply.send({
        invoices: [],
        stripeConfigured: true,
      });
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: org.stripeCustomerId,
        limit: 24,  // 2 years of monthly invoices
      });

      return reply.send({
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amount: inv.amount_paid / 100,  // convert cents to dollars
          currency: inv.currency,
          date: new Date(inv.created * 1000).toISOString(),
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        })),
        stripeConfigured: true,
      });
    } catch (err) {
      req.log.error({ err }, 'Failed to fetch invoices from Stripe');
      return reply.send({ invoices: [], stripeConfigured: true });
    }
  });
}
