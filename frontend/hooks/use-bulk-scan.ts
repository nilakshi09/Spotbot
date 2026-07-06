import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'
import type {
  BulkScan,
  BulkScanProgress,
  CreateBulkScanResponse,
} from '@/types/bulk-scan'

// Upload CSV and create bulk scan
export function useCreateBulkScan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      // Use fetch directly for multipart upload
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const token = getAccessToken()  // from auth lib

      const res = await fetch(`${apiUrl}/api/scans/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type — browser sets it with boundary
        },
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(
          error.error?.message ?? 'Failed to upload CSV'
        )
      }

      return res.json() as Promise<CreateBulkScanResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-scans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// List all bulk scans
export function useBulkScans() {
  return useQuery({
    queryKey: ['bulk-scans'],
    queryFn: () =>
      api.get<{ data: BulkScan[] }>('/api/scans/bulk'),
    staleTime: 1000 * 30,
  })
}

// Get single bulk scan with full details
export function useBulkScan(bulkScanId: string | null) {
  return useQuery({
    queryKey: ['bulk-scan', bulkScanId],
    queryFn: () =>
      api.get<BulkScan>(`/api/scans/bulk/${bulkScanId}`),
    enabled: !!bulkScanId,
    staleTime: 1000 * 10,
  })
}

// Poll progress of a bulk scan
export function useBulkScanProgress(
  bulkScanId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['bulk-scan-progress', bulkScanId],
    queryFn: () =>
      api.get<BulkScanProgress>(
        `/api/scans/bulk/${bulkScanId}/progress`
      ),
    enabled: !!bulkScanId && enabled,
    // Poll every 3s while processing
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 3000
      if (data.status === 'completed' || data.status === 'failed') {
        return false
      }
      return 3000
    },
  })
}

// Download bulk scan results as CSV
export function useDownloadBulkResults() {
  return useMutation({
    mutationFn: async (bulkScanId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const token = getAccessToken()

      const res = await fetch(
        `${apiUrl}/api/scans/bulk/${bulkScanId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spotbot-bulk-results.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}

// Helper to get access token
function getAccessToken(): string | null {
  // Import from your auth lib
  // This should be the same pattern used in report-actions.tsx
  if (typeof window === 'undefined') return null
  return (window as Window & { __spotbot_access_token?: string }).__spotbot_access_token ?? null
}
