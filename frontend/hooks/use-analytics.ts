import { useQuery } from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api-client'

export interface AnalyticsData {
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  scanVolumeByDay: Array<{
    date: string
    count: number
  }>
  avgScoreByDay: Array<{
    date: string
    avgScore: number | null
  }>
  platformDistribution: {
    instagram: number
    youtube: number
  }
  scoreDistribution: Array<{
    range: string
    count: number
  }>
  totalScansLast30Days: number
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () =>
      api.get<AnalyticsData>('/api/users/me/analytics'),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  })
}
