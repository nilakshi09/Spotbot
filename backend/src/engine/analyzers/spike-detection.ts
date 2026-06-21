import { InstagramPost } from '../../integrations/instagram.client.js';
import { FollowerSnapshot } from '../../integrations/socialblade.client.js';
import { AnalyzerResult } from '../types.js';

export class SpikeDetectionAnalyzer {
  analyze(followerHistory: FollowerSnapshot[], posts: InstagramPost[]): AnalyzerResult {
    const dataPointCount = followerHistory.length;

    let confidence = 0.3;
    if (dataPointCount >= 60) confidence = 0.9;
    else if (dataPointCount >= 30) confidence = 0.7;
    else if (dataPointCount >= 14) confidence = 0.5;

    if (dataPointCount < 14) {
      return {
        score: 0,
        confidence,
        summary: "Insufficient data for spike detection (needs 14+ days)",
        details: { totalSpikes: 0 }
      };
    }

    const dailyGains: number[] = [];
    for (let i = 1; i < dataPointCount; i++) {
      dailyGains.push(followerHistory[i].followers - followerHistory[i - 1].followers);
    }

    let totalSpikes = 0;
    let explainedSpikes = 0;
    let partiallyExplainedSpikes = 0;
    let unexplainedSpikes = 0;
    let largestSpikeSize = 0;
    let largestSpikeDate = '';

    const spikes: any[] = [];
    
    // Calculate average post-driven gain (simplified: average of all gains where post was made)
    // For this prototype we will assume a typical post driven gain is simply the rolling avg * 2. 
    // Wait, the spec says: "magnitude <= 5x typical post-driven gain"
    // Let's compute average gain.
    const averageGain = dailyGains.reduce((a, b) => a + Math.max(0, b), 0) / dailyGains.length;
    const typicalPostDrivenGain = Math.max(averageGain, 100);

    for (let i = 13; i < dailyGains.length; i++) {
      const window = dailyGains.slice(i - 13, i + 1); // 14 days including current
      const rollingAvg = window.reduce((a, b) => a + b, 0) / 14;

      const gain = dailyGains[i];
      if (gain > 2 * rollingAvg && gain > 1000) {
        totalSpikes++;
        const date = followerHistory[i + 1].date; // index shift

        if (gain > largestSpikeSize) {
          largestSpikeSize = gain;
          largestSpikeDate = date;
        }

        // Check if explained
        const spikeDateMs = new Date(date).getTime();
        
        let nearestPost: string | undefined;
        let isExplainedByPost = false;

        for (const post of posts) {
          const postDateMs = new Date(post.timestamp).getTime();
          // within +/- 1 day
          if (Math.abs(postDateMs - spikeDateMs) <= 24 * 60 * 60 * 1000) {
            isExplainedByPost = true;
            nearestPost = post.timestamp;
            break;
          }
        }

        let classification: 'explained' | 'partially_explained' | 'unexplained';

        if (isExplainedByPost) {
          if (gain <= 5 * typicalPostDrivenGain) {
            classification = 'explained';
            explainedSpikes++;
          } else {
            classification = 'partially_explained';
            partiallyExplainedSpikes++;
          }
        } else {
          classification = 'unexplained';
          unexplainedSpikes++;
        }

        spikes.push({
          date,
          magnitude: gain,
          classification,
          nearestPost
        });
      }
    }

    let score = 0;
    if (unexplainedSpikes === 0) {
      // 0–10 random noise based on partially explained
      score = Math.min(10, partiallyExplainedSpikes * 5);
    } else if (unexplainedSpikes === 1) {
      score = 35; // 30-40
    } else if (unexplainedSpikes === 2) {
      score = 60; // 55-65
    } else {
      score = Math.min(100, 70 + (unexplainedSpikes - 3) * 10);
    }

    const summary = unexplainedSpikes > 0 
      ? `${unexplainedSpikes} unexplained follower spikes detected with no corresponding content activity.` 
      : `No unexplained follower spikes detected.`;

    return {
      score,
      confidence,
      summary,
      details: {
        totalSpikes,
        explainedSpikes,
        partiallyExplainedSpikes,
        unexplainedSpikes,
        largestSpikeSize,
        largestSpikeDate,
        spikes
      }
    };
  }
}
