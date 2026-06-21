export interface TrialStatus {
  isOnFreePlan: boolean;
  isTrialExpired: boolean;
  scansRemaining: number;
  scansUsed: number;
  scanLimit: number;
  nudgeLevel: 'none' | 'gentle' | 'urgent' | 'expired';
}

export interface DashboardStats {
  totalScans: number;
  avgFraudScore: number;
  highRiskCount: number;
  scansThisMonth: number;
  scanLimit: number;
  scansUsed: number;
  planName: string;
  trial: TrialStatus;
}
