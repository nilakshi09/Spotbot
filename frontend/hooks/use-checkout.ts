import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const result = await apiClient.post<{ checkoutUrl: string }>(
        '/api/billing/checkout',
        { priceId },
      )
      // Redirect to Stripe Checkout
      window.location.href = result.checkoutUrl
    },
  })
}
