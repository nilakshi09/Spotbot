import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import type { ScanListItem, ScanFilters } from '@/types/scan';

interface ScansResponse {
  data: ScanListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useScans(filters: ScanFilters) {
  return useQuery({
    queryKey: ['scans', filters],
    queryFn: async () => {
      // Build query string from filters
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      return api.get<ScansResponse>(`/api/scans${queryString ? `?${queryString}` : ''}`);
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
