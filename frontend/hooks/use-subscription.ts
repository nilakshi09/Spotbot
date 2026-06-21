import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Subscription {
  plan: string
  planName: string
  price: number | null
  scanLimit: number
  scansUsed: number
  seats: number
  billingCycleStart: string | null
  nextBillingDate: string | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  cancelAtPeriodEnd: boolean
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.get<Subscription>('/api/billing/subscription'),
    staleTime: 1000 * 60 * 2,  // 2 minutes
  })
}
