export type AnalyticsRange = '7d' | '30d' | '90d';

export interface TopFlaggedAccount {
  handle: string;
  platform: 'instagram' | 'youtube';
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  followers: number;
  scanDate: string;
}

export interface AnalyticsSummary {
  totalScans: number;
  avgFraudScore: number;
  highRiskCount: number;
  highRiskPct: number;
  totalEstimatedReach: number;
}

export interface AdvancedAnalyticsData {
  range: AnalyticsRange;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  platformDistribution: {
    instagram: number;
    youtube: number;
  };
  scanVolumeTrend: Array<{ date: string; count: number }>;
  avgScoreTrend: Array<{ date: string; avgScore: number | null }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  topFlaggedAccounts: TopFlaggedAccount[];
  summary: AnalyticsSummary;
  
  // Backward compatibility with Phase 5H
  scanVolumeByDay: Array<{ date: string; count: number }>;
  avgScoreByDay: Array<{ date: string; avgScore: number | null }>;
  totalScansLast30Days: number;
}
