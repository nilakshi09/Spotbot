import { ProfileData, AnalyzerResult } from '../types.js';
import { InstagramPost } from '../../integrations/instagram.client.js';
import { BENCHMARKS, getFollowerTier, detectNiche } from '../benchmarks.js';

export class EngagementBenchmarkAnalyzer {
  analyze(profile: ProfileData, posts: InstagramPost[]): AnalyzerResult {
    const postsAnalyzed = posts.length;
    const confidence = postsAnalyzed >= 5 ? 1.0 : (postsAnalyzed > 0 ? 0.6 : 0.0);
    
    if (postsAnalyzed === 0 || profile.followers === 0) {
      return {
        score: 0,
        confidence,
        summary: "No posts or followers to analyze engagement.",
        details: { postsAnalyzed: 0 }
      };
    }

    const avgLikes = posts.reduce((sum, p) => sum + p.likes, 0) / postsAnalyzed;
    const avgComments = posts.reduce((sum, p) => sum + p.commentsCount, 0) / postsAnalyzed;
    const accountER = ((avgLikes + avgComments) / profile.followers) * 100;

    const tier = getFollowerTier(profile.followers);
    const niche = detectNiche(profile.bio, profile.category);

    // Look up benchmark median ER from benchmarks.ts for (niche, tier)
    // Fall back to tier-only benchmark if niche not found
    const nicheBenchmarks = BENCHMARKS[niche] || BENCHMARKS['general'];
    const benchmarkER = nicheBenchmarks[tier] || BENCHMARKS['general'][tier];

    const ratio = accountER / benchmarkER;

    let score = 0;
    
    // lerp function helper
    const lerp = (start: number, end: number, t: number) => start + t * (end - start);

    if (ratio >= 0.8) {
      score = lerp(0, 20, Math.max(0, 1 - ratio / 1.0));
    } else if (ratio >= 0.6) {
      score = lerp(20, 40, (0.8 - ratio) / 0.2);
    } else if (ratio >= 0.4) {
      score = lerp(40, 60, (0.6 - ratio) / 0.2);
    } else if (ratio >= 0.2) {
      score = lerp(60, 80, (0.4 - ratio) / 0.2);
    } else {
      score = lerp(80, 100, Math.min(1, 1 - ratio / 0.2));
    }

    // ALSO flag abnormally HIGH engagement (ratio > 3.0) as potential engagement pod
    let summary = `Engagement rate is ${accountER.toFixed(2)}% (benchmark: ${benchmarkER.toFixed(2)}%).`;
    if (ratio > 3.0) {
      score = Math.min(score + 20, 100);
      summary += " Abnormally high engagement detected, possible engagement pod.";
    }

    return {
      score: Math.round(score),
      confidence,
      summary,
      details: {
        accountER,
        benchmarkER,
        ratio,
        tier,
        niche,
        avgLikes,
        avgComments,
        postsAnalyzed,
        percentile: 50 // Rough approximation
      }
    };
  }
}
