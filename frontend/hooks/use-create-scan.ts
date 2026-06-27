import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Platform } from '@/types/scan';

interface CreateScanArgs {
  platform: Platform;
  handle: string;
}

export function useCreateScan() {
  return useMutation({
    mutationFn: async (args: CreateScanArgs) => {
      // rescan endpoint is actually POST /api/scans/:id/rescan,
      // but if we don't have the id here, we just use POST /api/scans
      const data = await apiClient.post<{ id: string }>('/api/scans', args);
      return data;
    },
  });
}
