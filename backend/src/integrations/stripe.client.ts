import Stripe from 'stripe';
import { env } from '../config/env.js';

export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
});

// Plan configuration — single source of truth
export const PLANS = {
  free: {
    name: 'Free',
    priceId: null,
    scanLimit: 5,
    seats: 1,
    price: 0,
  },
  starter: {
    name: 'Starter',
    priceId: env.STRIPE_STARTER_PRICE_ID,
    scanLimit: 100,
    seats: 3,
    price: 49,
  },
  pro: {
    name: 'Pro',
    priceId: env.STRIPE_PRO_PRICE_ID,
    scanLimit: 500,
    seats: 10,
    price: 149,
  },
  enterprise: {
    name: 'Enterprise',
    priceId: null,   // custom pricing, handled manually
    scanLimit: 999999,
    seats: 999999,
    price: null,
  },
} as const;

export type PlanName = keyof typeof PLANS;

// Get plan config from Stripe price ID
export function getPlanFromPriceId(priceId: string): PlanName | null {
  for (const [plan, config] of Object.entries(PLANS)) {
    if (config.priceId === priceId) return plan as PlanName;
  }
  return null;
}
