import { describe, it, expect } from 'vitest';
import { computeCompositeScore, classifyRisk, estimateRealReach } from '../../../src/engine/scoring.js';

describe('Scoring Utilities', () => {
  it('should compute weighted score correctly', () => {
    const signals: any = {
      growthVelocity: { score: 100, confidence: 1.0 },
      engagementRate: { score: 50, confidence: 0.8 },
      commentSentiment: { score: 0, confidence: 0.5 },
      spikeDetection: { score: 100, confidence: 0.2 },
    };

    // totalWeight = 0.25*1 + 0.3*0.8 + 0.25*0.5 + 0.2*0.2 = 0.25 + 0.24 + 0.125 + 0.04 = 0.655
    // weightedSum = 25 + 12 + 0 + 4 = 41
    // result = 41 / 0.655 = 62.59 -> 63
    
    const score = computeCompositeScore(signals);
    expect(score).toBe(63);
  });

  it('should classify risk', () => {
    expect(classifyRisk(10)).toBe('low');
    expect(classifyRisk(45)).toBe('medium');
    expect(classifyRisk(80)).toBe('high');
  });

  it('should estimate real reach', () => {
    // 10,000 followers, fraud score 100 -> 85% fake -> 15% real -> 1500
    expect(estimateRealReach(10000, 100)).toBe(1500);
    
    // 10,000 followers, fraud score 0 -> 0% fake -> 10,000
    expect(estimateRealReach(10000, 0)).toBe(10000);
  });
});
