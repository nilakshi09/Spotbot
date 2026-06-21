// Single source of truth for plan display info on the frontend
// Price IDs come from env vars — never hardcoded

export interface PlanConfig {
  id: string
  name: string
  price: number | null
  priceId: string | null
  scanLimit: number
  seats: number
  features: string[]
  badge?: string
  highlighted?: boolean
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    scanLimit: 5,
    seats: 1,
    features: [
      '5 scans per month',
      'Web-based reports',
      'Instagram only',
      'Basic fraud score',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? null,
    scanLimit: 100,
    seats: 3,
    badge: 'Most Popular',
    highlighted: true,
    features: [
      '100 scans per month',
      'PDF export',
      'Report sharing',
      'Up to 3 seats',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? null,
    scanLimit: 500,
    seats: 10,
    features: [
      '500 scans per month',
      'Priority processing',
      'Bulk scanning (CSV)',
      'Up to 10 seats',
      'API access',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceId: null,
    scanLimit: 999999,
    seats: 999999,
    features: [
      'Unlimited scans',
      'Unlimited seats',
      'White-label reports',
      'SSO / SAML',
      'Dedicated support',
      'Custom SLA',
    ],
  },
]

export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find(p => p.id === id)
}

export function getPlanColor(planId: string): string {
  const colors: Record<string, string> = {
    free: 'text-gray-400',
    starter: 'text-blue-400',
    pro: 'text-purple-400',
    enterprise: 'text-amber-400',
  }
  return colors[planId] ?? 'text-gray-400'
}

export function getPlanBadgeStyle(planId: string): string {
  const styles: Record<string, string> = {
    free: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    starter: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    pro: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
    enterprise: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  }
  return styles[planId] ?? 'bg-gray-400/10 text-gray-400 border-gray-400/20'
}
