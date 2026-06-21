import { AnalyzerResult } from './types.js';

const WEIGHTS = {
  growthVelocity: 0.25,
  engagementRate: 0.30,
  commentSentiment: 0.25,
  spikeDetection: 0.20,
};

export function computeCompositeScore(signals: {
  growthVelocity: AnalyzerResult;
  engagementRate: AnalyzerResult;
  commentSentiment: AnalyzerResult;
  spikeDetection: AnalyzerResult;
}): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const signal = signals[key as keyof typeof signals];
    const effectiveWeight = weight * signal.confidence;
    weightedSum += signal.score * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  if (totalWeight === 0) return 0; // fallback if no data
  
  return Math.round(weightedSum / totalWeight);
}

export function classifyRisk(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  return 'high';
}

export function estimateRealReach(followers: number, fraudScore: number): number {
  const fakeRatio = (fraudScore / 100) * 0.85; // assume max 85% are fake to be conservative
  return Math.round(followers * (1 - fakeRatio));
}

export function generateRiskSummary(
  fraudScore: number,
  riskLevel: 'low' | 'medium' | 'high',
  signals: Record<string, AnalyzerResult>
): string {
  if (riskLevel === 'low') {
    return "This account shows minimal signs of audience manipulation. Growth is steady and engagement appears organic.";
  }

  const sentences = [];
  
  if (riskLevel === 'high') {
    sentences.push("This account shows strong signs of audience manipulation.");
  } else {
    sentences.push("This account shows moderate signs of irregular growth or engagement.");
  }

  // Highlight highest-scoring signals with decent confidence
  const sortedSignals = Object.entries(signals)
    .filter(([_, s]) => s.score > 40 && s.confidence >= 0.5)
    .sort((a, b) => b[1].score - a[1].score);

  for (const [key, signal] of sortedSignals) {
    if (key === 'spikeDetection' && signal.details?.unexplainedSpikes) {
      sentences.push(`${signal.details.unexplainedSpikes} unexplained follower spikes were detected with no corresponding content activity.`);
    }
    if (key === 'engagementRate' && signal.details?.accountER !== undefined) {
      const { accountER, benchmarkER, ratio } = signal.details as any;
      if (ratio < 0.6) {
        sentences.push(`Engagement rate (${accountER.toFixed(2)}%) is well below the niche average (${benchmarkER.toFixed(2)}%).`);
      } else if (ratio > 3.0) {
        sentences.push(`Abnormally high engagement rate (${accountER.toFixed(2)}%) suggests possible use of engagement pods.`);
      }
    }
    if (key === 'commentSentiment' && signal.details?.botRatio) {
      const botRatio = signal.details.botRatio as number;
      if (botRatio > 0.3) {
        sentences.push(`${(botRatio * 100).toFixed(0)}% of analyzed comments match bot or spam patterns.`);
      }
    }
    if (key === 'growthVelocity' && signal.details?.anomalyDays) {
      const anomalies = (signal.details.anomalyDays as any[]).length;
      if (anomalies > 1) {
        sentences.push(`${anomalies} abnormal growth spikes detected in the recent period.`);
      }
    }
  }

  if (sentences.length === 1) {
    sentences.push("Some irregularities were detected across multiple signals but no single red flag stood out.");
  }

  return sentences.join(' ');
}
