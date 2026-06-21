import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Invoice {
  id: string
  number: string | null
  status: string
  amount: number
  currency: string
  date: string
  pdfUrl: string | null
  hostedUrl: string | null
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiClient.get<{ invoices: Invoice[] }>('/api/billing/invoices'),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  })
}
