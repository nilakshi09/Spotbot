import { stripe, PLANS, getPlanFromPriceId, type PlanName } from '../integrations/stripe.client.js';
import { db } from '../db/client.js';
import { organizations, users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { businessLogger } from '../utils/logger.js';

// Define error classes internally if they don't exist, or just use Error
export class NotFoundError extends Error {
  constructor(message: string) {
    super(`${message} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BillingService {

  // ─── GET SUBSCRIPTION ────────────────────────────────────────────────────

  async getSubscription(orgId: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (!org) throw new NotFoundError('Organization');

    const plan = PLANS[org.plan as PlanName];

    let stripeSubscription = null;
    let nextBillingDate = null;

    // Fetch live subscription data from Stripe if on paid plan
    if (org.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
        stripeSubscription = sub;
        const currentPeriodEnd = (sub as { current_period_end?: number }).current_period_end;

if (currentPeriodEnd) {
  nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
}
      } catch {
        // Stripe unreachable — return DB data only
      }
    }

    return {
      plan: org.plan,
      planName: plan.name,
      price: plan.price,
      scanLimit: org.scanLimit,
      scansUsed: org.scansUsed,
      seats: plan.seats,
      billingCycleStart: org.billingCycleStart,
      nextBillingDate,
      stripeSubscriptionId: org.stripeSubscriptionId,
      stripeCustomerId: org.stripeCustomerId,
      cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end ?? false,
    };
  }

  // ─── CREATE CHECKOUT SESSION ─────────────────────────────────────────────

  async createCheckoutSession(orgId: string, userId: string, priceId: string) {
    // Validate priceId is one of our known prices
    const targetPlan = getPlanFromPriceId(priceId);
    if (!targetPlan) throw new ValidationError('Invalid price ID');
    if (targetPlan === 'free' || targetPlan === 'enterprise') {
      throw new ValidationError('Cannot checkout for this plan');
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (!org) throw new NotFoundError('Organization');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) throw new NotFoundError('User');

    // Create or retrieve Stripe customer
    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          orgId: org.id,
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Store customer ID immediately
      await db.update(organizations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organizations.id, orgId));
    }

    // If already has active subscription → use upgrade flow (not new checkout)
    if (org.stripeSubscriptionId) {
      return this.createUpgradeSession(org.stripeSubscriptionId, priceId, customerId);
    }

    // Create new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        orgId: org.id,
        userId: user.id,
        priceId,
      },
      subscription_data: {
        metadata: {
          orgId: org.id,
        },
      },
      allow_promotion_codes: true,
    });

    return { checkoutUrl: session.url };
  }

  // ─── CREATE UPGRADE SESSION (existing subscriber changing plan) ──────────

  private async createUpgradeSession(
    subscriptionId: string,
    newPriceId: string,
    customerId: string,
  ) {
    // For plan changes, use Stripe's billing portal with a flow
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.FRONTEND_URL}/billing`,
      flow_data: {
        type: 'subscription_update_confirm',
        subscription_update_confirm: {
          subscription: subscriptionId,
          items: [{
            id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
            price: newPriceId,
            quantity: 1,
          }],
        },
      },
    });

    return { checkoutUrl: session.url };
  }

  // ─── CREATE PORTAL SESSION ───────────────────────────────────────────────

  async createPortalSession(orgId: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (!org) throw new NotFoundError('Organization');

    if (!org.stripeCustomerId) {
      throw new ValidationError('No billing account found. Please upgrade your plan first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/billing`,
    });

    return { portalUrl: session.url };
  }

  // ─── APPLY PLAN CHANGE (called from webhook handlers) ───────────────────

  async applyPlanChange(orgId: string, planName: PlanName, subscriptionId?: string) {
    const plan = PLANS[planName];

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    const oldPlan = org?.plan;

    await db.update(organizations)
      .set({
        plan: planName,
        scanLimit: plan.scanLimit,
        stripeSubscriptionId: subscriptionId ?? null,
        billingCycleStart: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    if (oldPlan && oldPlan !== planName) {
      if (planName === 'free') {
        businessLogger.planDowngraded(orgId, oldPlan, planName);
      } else {
        businessLogger.planUpgraded(orgId, oldPlan, planName);
      }
    }
  }

  // ─── RESET MONTHLY QUOTA ─────────────────────────────────────────────────

  async resetMonthlyQuota(orgId: string) {
    await db.update(organizations)
      .set({
        scansUsed: 0,
        billingCycleStart: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
  }

  // ─── DOWNGRADE TO FREE ───────────────────────────────────────────────────

  async downgradeToFree(orgId: string) {
    await this.applyPlanChange(orgId, 'free');
    // Clear subscription ID since they cancelled
    await db.update(organizations)
      .set({ stripeSubscriptionId: null })
      .where(eq(organizations.id, orgId));
  }

  // ─── GET TRIAL STATUS ────────────────────────────────────────────────────

  async getTrialStatus(orgId: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: {
        plan: true,
        scanLimit: true,
        scansUsed: true,
      },
    })
    if (!org) throw new NotFoundError('Organization')

    const isOnFreePlan = org.plan === 'free'
    const scansRemaining = Math.max(0, org.scanLimit - org.scansUsed)
    const isTrialExpired = isOnFreePlan && org.scansUsed >= org.scanLimit

    return {
      isOnFreePlan,
      isTrialExpired,
      scansRemaining,
      scansUsed: org.scansUsed,
      scanLimit: org.scanLimit,
      nudgeLevel: isTrialExpired
        ? 'expired'
        : scansRemaining === 1
        ? 'urgent'
        : org.scansUsed >= 3
        ? 'gentle'
        : 'none',
    }
  }
}

export const billingService = new BillingService();
