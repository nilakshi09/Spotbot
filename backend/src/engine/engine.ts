import { InstagramClient } from '../integrations/instagram.client.js';
import { SocialBladeClient } from '../integrations/socialblade.client.js';
import { OpenAIClient } from '../integrations/openai.client.js';
import { FraudAnalysisResult } from './types.js';
import { GrowthVelocityAnalyzer } from './analyzers/growth-velocity.js';
import { EngagementBenchmarkAnalyzer } from './analyzers/engagement-benchmark.js';
import { CommentSentimentAnalyzer } from './analyzers/comment-sentiment.js';
import { SpikeDetectionAnalyzer } from './analyzers/spike-detection.js';
import { computeCompositeScore, classifyRisk, estimateRealReach, generateRiskSummary } from './scoring.js';

export class FraudEngine {
  constructor(
    private instagram: InstagramClient,
    private socialBlade: SocialBladeClient,
    private openai: OpenAIClient
  ) {}

  async analyze(platform: 'instagram' | 'youtube', handle: string): Promise<FraudAnalysisResult> {
    if (platform !== 'instagram') {
      throw new Error(`Platform ${platform} is not supported in this phase`);
    }

    // 1. Fetch all data (parallel where possible)
    // We fetch profile first because if it fails, we cannot proceed
    const profile = await this.instagram.getProfile(handle);

    const [postsResult, commentsResult, followerHistoryResult] = await Promise.allSettled([
      this.instagram.getRecentPosts(handle, 20),
      this.instagram.getComments(handle, 20),
      this.socialBlade.getFollowerHistory(handle, 90),
    ]);

    const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
    const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];
    const followerHistory = followerHistoryResult.status === 'fulfilled' ? followerHistoryResult.value : [];

    if (postsResult.status === 'rejected') console.warn('Failed to fetch posts:', postsResult.reason);
    if (commentsResult.status === 'rejected') console.warn('Failed to fetch comments:', commentsResult.reason);
    if (followerHistoryResult.status === 'rejected') console.warn('Failed to fetch follower history:', followerHistoryResult.reason);

    // 2. Run all 4 analyzers
    const growthVelocityAnalyzer = new GrowthVelocityAnalyzer();
    const engagementBenchmarkAnalyzer = new EngagementBenchmarkAnalyzer();
    const commentSentimentAnalyzer = new CommentSentimentAnalyzer(this.openai);
    const spikeDetectionAnalyzer = new SpikeDetectionAnalyzer();

    const [growthVelocity, engagementRate, commentSentiment, spikeDetection] = await Promise.all([
      Promise.resolve(growthVelocityAnalyzer.analyze(followerHistory)),
      Promise.resolve(engagementBenchmarkAnalyzer.analyze(profile, posts)),
      commentSentimentAnalyzer.analyze(comments),
      Promise.resolve(spikeDetectionAnalyzer.analyze(followerHistory, posts)),
    ]);

    const signals = { growthVelocity, engagementRate, commentSentiment, spikeDetection };

    // 3. Compute composite score
    const fraudScore = computeCompositeScore(signals);
    const riskLevel = classifyRisk(fraudScore);
    const realReach = estimateRealReach(profile.followers, fraudScore);
    const summary = generateRiskSummary(fraudScore, riskLevel, signals);

    return {
      fraudScore,
      riskLevel,
      realReach,
      summary,
      signals,
      profile
    };
  }
}
