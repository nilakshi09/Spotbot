import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { InvoicesResponse, Invoice } from '@/types/sales-lead'

export { type Invoice }

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiClient.get<InvoicesResponse>('/api/billing/invoices'),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  })
}
