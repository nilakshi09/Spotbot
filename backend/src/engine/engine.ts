import { InstagramClient } from '../integrations/instagram.client.js';
import { SocialBladeClient } from '../integrations/socialblade.client.js';
import { OpenAIClient } from '../integrations/openai.client.js';
import { YouTubeClient } from '../integrations/youtube.client.js';
import { mapYouTubeProfile, mapYouTubePosts, mapYouTubeComments } from '../integrations/youtube.mapper.js';
import { FraudAnalysisResult } from './types.js';
import { GrowthVelocityAnalyzer } from './analyzers/growth-velocity.js';
import { EngagementBenchmarkAnalyzer } from './analyzers/engagement-benchmark.js';
import { CommentSentimentAnalyzer } from './analyzers/comment-sentiment.js';
import { SpikeDetectionAnalyzer } from './analyzers/spike-detection.js';
import { computeCompositeScore, classifyRisk, estimateRealReach, generateRiskSummary } from './scoring.js';
import { getYouTubeBenchmark } from './benchmarks.js';

export type ProgressCallback = (step: string, stepsCompleted: number, totalSteps: number) => Promise<void> | void;

export class FraudEngine {
  constructor(
    private instagram: InstagramClient,
    private socialBlade: SocialBladeClient,
    private openai: OpenAIClient
  ) {}

  async analyze(platform: 'instagram' | 'youtube', handle: string, onProgress?: ProgressCallback): Promise<FraudAnalysisResult> {
    if (platform === 'youtube') {
      return this.analyzeYouTube(handle, onProgress);
    }

    return this.analyzeInstagram(handle, onProgress);
  }

  // ── Instagram analysis (existing logic, unchanged) ──────────────────────
  private async analyzeInstagram(handle: string, onProgress?: ProgressCallback): Promise<FraudAnalysisResult> {
    const totalSteps = 6;

    // 1. Fetch all data (parallel where possible)
    // We fetch profile first because if it fails, we cannot proceed
    await onProgress?.('fetching_profile', 0, totalSteps);
    const profile = await this.instagram.getProfile(handle);

    await onProgress?.('fetching_posts', 1, totalSteps);
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
    await onProgress?.('analyzing_engagement', 2, totalSteps);
    const growthVelocityAnalyzer = new GrowthVelocityAnalyzer();
    const engagementBenchmarkAnalyzer = new EngagementBenchmarkAnalyzer();
    const commentSentimentAnalyzer = new CommentSentimentAnalyzer(this.openai);
    const spikeDetectionAnalyzer = new SpikeDetectionAnalyzer();

    const [growthVelocity, engagementRate] = await Promise.all([
      Promise.resolve(growthVelocityAnalyzer.analyze(followerHistory)),
      Promise.resolve(engagementBenchmarkAnalyzer.analyze(profile, posts)),
    ]);

    await onProgress?.('detecting_spikes', 3, totalSteps);
    const spikeDetection = spikeDetectionAnalyzer.analyze(followerHistory, posts);

    await onProgress?.('analyzing_comments', 4, totalSteps);
    const commentSentiment = await commentSentimentAnalyzer.analyze(comments);

    const signals = { growthVelocity, engagementRate, commentSentiment, spikeDetection };

    // 3. Compute composite score
    await onProgress?.('computing_score', 5, totalSteps);
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

  // ── YouTube analysis (new) ──────────────────────────────────────────────
  private async analyzeYouTube(handle: string, onProgress?: ProgressCallback): Promise<FraudAnalysisResult> {
    const youtube = new YouTubeClient();
    const totalSteps = 6;

    // 1. Fetch YouTube data
    await onProgress?.('fetching_channel', 0, totalSteps);
    const channel = await youtube.getChannel(handle);

    await onProgress?.('fetching_videos', 1, totalSteps);
    const videos = await youtube.getRecentVideos(channel.channelId, 20);

    await onProgress?.('fetching_comments', 2, totalSteps);
    const comments = await youtube.getComments(channel.channelId, 5);

    // 2. Map to unified format
    const profile = mapYouTubeProfile(channel);
    const mappedPosts = mapYouTubePosts(videos);
    const mappedComments = mapYouTubeComments(comments);

    // 3. Run analyzers
    await onProgress?.('analyzing_engagement', 3, totalSteps);
    const growthVelocityAnalyzer = new GrowthVelocityAnalyzer();
    const engagementBenchmarkAnalyzer = new EngagementBenchmarkAnalyzer();
    const commentSentimentAnalyzer = new CommentSentimentAnalyzer(this.openai);
    const spikeDetectionAnalyzer = new SpikeDetectionAnalyzer();

    const [growthVelocity, engagementRate] = await Promise.all([
      Promise.resolve(growthVelocityAnalyzer.analyze([])),  // no history available
      Promise.resolve(engagementBenchmarkAnalyzer.analyzeYouTube(
        channel,
        videos,
        getYouTubeBenchmark(profile.category, channel.subscribers),
      )),
    ]);

    await onProgress?.('analyzing_comments', 4, totalSteps);
    const commentSentiment = await commentSentimentAnalyzer.analyze(mappedComments);
    const spikeDetection = spikeDetectionAnalyzer.analyze([], mappedPosts);

    const signals = { growthVelocity, engagementRate, commentSentiment, spikeDetection };

    await onProgress?.('computing_score', 5, totalSteps);
    const fraudScore = computeCompositeScore(signals);
    const riskLevel = classifyRisk(fraudScore);
    const realReach = estimateRealReach(channel.subscribers, fraudScore);
    const summary = generateRiskSummary(fraudScore, riskLevel, signals);

    return {
      fraudScore,
      riskLevel,
      realReach,
      summary,
      signals,
      profile,
    };
  }
}
