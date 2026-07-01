import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'
import type {
  ApiKeyItem,
  CreateApiKeyResponse,
} from '@/types/api-key'

// List all API keys
export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () =>
      api.get<{ data: ApiKeyItem[] }>('/api/keys'),
    staleTime: 1000 * 60,
  })
}

// Create new API key
export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      expiresInDays?: number
    }) => api.post<CreateApiKeyResponse>('/api/keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

// Revoke an API key
export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) =>
      api.delete(`/api/keys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

// Rotate an API key
export function useRotateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) =>
      api.post<CreateApiKeyResponse>(
        `/api/keys/${keyId}/rotate`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}
