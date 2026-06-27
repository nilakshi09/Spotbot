import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ShareStatus, ShareReportResponse } from '@/types/scan';

// Generate share link
export function useGenerateShareLink(scanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expiresInDays: number) =>
      apiClient.post<ShareReportResponse>(
        `/api/reports/${scanId}/share`,
        { expiresInDays },
      ),
    onSuccess: () => {
      // Invalidate scan query to update shareStatus
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] });
      queryClient.invalidateQueries({ queryKey: ['share-status', scanId] });
    },
  });
}

// Revoke share link
export function useRevokeShareLink(scanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.delete(`/api/reports/${scanId}/share`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] });
      queryClient.invalidateQueries({ queryKey: ['share-status', scanId] });
    },
  });
}

// Get share status
export function useShareStatus(scanId: string) {
  return useQuery({
    queryKey: ['share-status', scanId],
    queryFn: () =>
      apiClient.get<ShareStatus>(`/api/reports/${scanId}/share`),
    staleTime: 1000 * 60, // 1 minute
  });
}
