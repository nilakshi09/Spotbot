import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'
import type { BrandingConfig } from '@/types/white-label'

export function useBranding() {
  return useQuery({
    queryKey: ['branding'],
    queryFn: () => api.get<BrandingConfig>('/api/org/branding'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateBranding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<BrandingConfig>) =>
      api.patch<BrandingConfig>('/api/org/branding', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })
}

export function useResetBranding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete('/api/org/branding'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      // The frontend uses cookies instead of getAccessToken based on current codebase context,
      // I will just use fetch with credentials if needed, or api.post with formData
      // Actually `api.post` handles auth usually. But for FormData it might need custom headers.
      // Let's use the standard fetch with credentials.
      
      const res = await fetch(
        `${apiUrl}/api/org/branding/logo`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include', // Important for cookie auth
        },
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? 'Upload failed')
      }

      return res.json() as Promise<{ logoUrl: string }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })
}
