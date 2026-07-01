import { useMutation } from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'
import type {
  ContactSalesInput,
  ContactSalesResponse,
} from '@/types/sales-lead'

export function useContactSales() {
  return useMutation({
    mutationFn: (data: ContactSalesInput) =>
      api.post<ContactSalesResponse>('/api/sales/contact', data),
  })
}
