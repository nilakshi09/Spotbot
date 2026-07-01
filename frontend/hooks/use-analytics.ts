import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import type {
  AdvancedAnalyticsData,
  AnalyticsRange,
} from '@/types/analytics';
import { getAccessToken } from '@/lib/auth';

export function useAnalytics(range: AnalyticsRange = '30d') {
  return useQuery({
    queryKey: ['analytics', range],
    queryFn: () =>
      api.get<AdvancedAnalyticsData>(
        `/api/users/me/analytics?range=${range}`
      ),
    staleTime: 1000 * 60 * 5,
  });
}

export function useExportAnalytics() {
  return useMutation({
    mutationFn: async (range: AnalyticsRange) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = getAccessToken();

      const res = await fetch(
        `${apiUrl}/api/users/me/analytics/export?range=${range}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spotbot-analytics-${range}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
