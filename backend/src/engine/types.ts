import { InstagramPost, InstagramComment } from '../integrations/instagram.client.js';
import { FollowerSnapshot } from '../integrations/socialblade.client.js';

export interface ProfileData {
  displayName: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  profilePictureUrl: string;
  isVerified: boolean;
  category: string;
}

export interface AnalyzerInput {
  profile: ProfileData;
  posts: InstagramPost[];
  comments: InstagramComment[];
  followerHistory: FollowerSnapshot[];
}

export interface AnalyzerResult {
  score: number;           // 0–100 (higher = more suspicious)
  confidence: number;      // 0–1 (data quality indicator)
  summary: string;         // Human-readable finding
  details: Record<string, unknown>;
}

export interface FraudAnalysisResult {
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  realReach: number;
  summary: string;
  signals: {
    growthVelocity: AnalyzerResult;
    engagementRate: AnalyzerResult;
    commentSentiment: AnalyzerResult;
    spikeDetection: AnalyzerResult;
  };
  profile: ProfileData;
}
