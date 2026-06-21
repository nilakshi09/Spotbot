import { describe, it, expect } from 'vitest';
import { SpikeDetectionAnalyzer } from '../../../src/engine/analyzers/spike-detection.js';
import organicData from '../../fixtures/organic-instagram.json';
import bottedData from '../../fixtures/botted-instagram.json';

describe('SpikeDetectionAnalyzer', () => {
  const analyzer = new SpikeDetectionAnalyzer();

  it('should score organic profile low', () => {
    const result = analyzer.analyze(organicData.followerHistory, organicData.posts);
    expect(result.score).toBeLessThan(30);
  });

  it('should score botted profile high', () => {
    const result = analyzer.analyze(bottedData.followerHistory, bottedData.posts);
    // Botted profile has spikes not correlated with posts
    expect(result.score).toBeGreaterThan(60);
    expect((result.details as any).unexplainedSpikes).toBeGreaterThan(0);
  });

  it('should handle insufficient data gracefully', () => {
    const result = analyzer.analyze(organicData.followerHistory.slice(0, 10), organicData.posts);
    expect(result.score).toBe(0);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
