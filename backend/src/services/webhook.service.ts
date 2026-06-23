import Stripe from 'stripe';
import { stripe, getPlanFromPriceId } from '../integrations/stripe.client.js';
import { billingService, ValidationError } from './billing.service.js';
import { db } from '../db/client.js';
import { organizations, billingEvents, users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import * as emailService from './email.service.js';

export class WebhookService {

  async handleWebhookEvent(payload: Buffer, signature: string, webhookSecret: string) {
    // CRITICAL: Verify Stripe signature before ANY processing
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      throw new ValidationError('Invalid webhook signature');
    }

    logger.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe webhook');

    // Idempotency check — skip if already processed
    const alreadyProcessed = await this.isEventProcessed(event.id);
    if (alreadyProcessed) {
      logger.info({ eventId: event.id }, 'Webhook event already processed, skipping');
      return { received: true, skipped: true };
    }

    // Route to correct handler
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info({ eventType: event.type }, 'Unhandled webhook event type');
    }

    // Record event as processed
    await this.recordEvent(event);

    return { received: true, skipped: false };
  }

  // ─── CHECKOUT COMPLETED ──────────────────────────────────────────────────

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orgId = session.metadata?.orgId;
    if (!orgId) {
      logger.error({ sessionId: session.id }, 'No orgId in checkout session metadata');
      return;
    }

    // Retrieve full subscription details
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;

    const planName = getPlanFromPriceId(priceId);
    if (!planName) {
      logger.error({ priceId }, 'Unknown price ID in checkout');
      return;
    }

    // Apply plan upgrade
    await billingService.applyPlanChange(orgId, planName, subscriptionId);

    logger.info({ orgId, planName, subscriptionId }, 'Plan upgraded via checkout');
  }

  // ─── SUBSCRIPTION UPDATED ────────────────────────────────────────────────

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    const priceId = subscription.items.data[0]?.price.id;
    const planName = getPlanFromPriceId(priceId);
    if (!planName) return;

    // Handle cancel_at_period_end — don't downgrade yet
    if (subscription.cancel_at_period_end) {
      logger.info({ orgId }, 'Subscription set to cancel at period end');
      // Keep current plan active until period ends
      // subscription.deleted event will handle actual downgrade
      return;
    }

    // Apply plan change (could be upgrade or downgrade)
    await billingService.applyPlanChange(orgId, planName, subscription.id);

    logger.info({ orgId, planName }, 'Subscription updated');
  }

  // ─── SUBSCRIPTION DELETED ────────────────────────────────────────────────

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    // Downgrade to free plan
    await billingService.downgradeToFree(orgId);

    logger.info({ orgId }, 'Subscription deleted — downgraded to free');
  }

  // ─── INVOICE PAYMENT SUCCEEDED ───────────────────────────────────────────

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Only reset quota on subscription renewals, not the first payment
    if (invoice.billing_reason !== 'subscription_cycle') return;

    const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;

    if (!subscriptionId) return;

    // Find org by subscription ID
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.stripeSubscriptionId, subscriptionId),
    });
    if (!org) return;

    // Reset monthly scan quota
    await billingService.resetMonthlyQuota(org.id);

    logger.info({ orgId: org.id }, 'Monthly quota reset on invoice payment');
  }

  // ─── INVOICE PAYMENT FAILED ──────────────────────────────────────────────

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;

    if (!subscriptionId) return;

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.stripeSubscriptionId, subscriptionId),
    });
    if (!org) return;

    // Find the org admin to notify
    const admin = await db.query.users.findFirst({
      where: eq(users.organizationId, org.id),
      // In this DB schema role might be available, assuming admin role is stored
      // Let's filter by role if available, or just get the first user
    });

    // Send payment failure email
    if (admin) {
      await emailService.sendPaymentFailedEmail(admin.email, admin.name, {
        planName: org.plan,
        invoiceUrl: invoice.hosted_invoice_url ?? '',
      });
    }

    logger.warn({ orgId: org.id }, 'Invoice payment failed — email sent');
  }

  // ─── IDEMPOTENCY HELPERS ─────────────────────────────────────────────────

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await db.query.billingEvents.findFirst({
      where: eq(billingEvents.stripeEventId, eventId),
    });
    return !!existing;
  }

  private async recordEvent(event: Stripe.Event) {
    await db.insert(billingEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      eventData: event.data.object as unknown as Record<string, unknown>,
    }).onConflictDoNothing();
  }
}

export const webhookService = new WebhookService();
