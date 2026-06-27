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

// --- Phase 5B: YouTube + Platform-aware types ---

export type Platform = 'instagram' | 'youtube';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ScanProfile {
  displayName: string;
  followers: number;        // subscribers for YouTube
  following: number;        // always 0 for YouTube
  posts: number;            // videos for YouTube
  bio: string;
  profilePictureUrl: string;
  isVerified: boolean;
  category: string;
  platform?: Platform;
  extraData?: {
    channelId?: string;
    totalViews?: number;
    videoCount?: number;
  };
}

export interface EngagementRateDetails {
  accountER: number;
  benchmarkER: number;
  ratio: number;
  tier: string;
  niche: string;
  avgLikes: number;
  avgComments: number;
  postsAnalyzed: number;
  percentile: number;
  avgViews?: number;        // YouTube only
}

export interface FraudSignal {
  label: string;
  value: string;
  risk: 'low' | 'medium' | 'high';
  description?: string;
}

export interface FollowerHistoryPoint {
  date: string;
  count: number;
}

export interface ScanResult {
  id: string;
  handle: string;
  platform: Platform;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  cached?: boolean;
  expiresAt?: string | null;
  profile?: ScanProfile;
  fraudScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals?: FraudSignal[];
  engagementDetails?: EngagementRateDetails;
  followerHistory?: FollowerHistoryPoint[];
  realReach?: {
    estimatedReal: number;
    total: number;
    percentage: number;
  };
  shareStatus?: ShareStatus;
}

export interface ScanListItem {
  id: string;
  handle: string;
  platform: Platform;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  fraudScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  followers?: number;
  shareStatus?: ShareStatus;
}

// Alias used by the public report page
export type Scan = ScanResult;

// ─── Phase 5C: Report Sharing types ─────────────────────────────────────

export interface ShareStatus {
  isShared: boolean;
  isExpired?: boolean;
  shareUrl: string | null;
  expiresAt: string | null;
  viewCount: number;
}

export interface ShareReportResponse {
  shareUrl: string;
  token: string;
}

export interface ScanFilters {
  page?: number;
  limit?: number;
  status?: string;
  handle?: string;
  platform?: Platform;
  riskLevel?: RiskLevel;
  scoreMin?: number;
  scoreMax?: number;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: 'created_at' | 'fraud_score' | 'handle';
  order?: 'asc' | 'desc';
}
