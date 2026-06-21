import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.post<{ portalUrl: string }>(
        '/api/billing/portal',
        {},
      )
      // Redirect to Stripe Customer Portal
      window.location.href = result.portalUrl
    },
  })
}
