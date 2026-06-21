import { describe, it, expect } from 'vitest';
import { GrowthVelocityAnalyzer } from '../../../src/engine/analyzers/growth-velocity.js';
import organicData from '../../fixtures/organic-instagram.json';
import bottedData from '../../fixtures/botted-instagram.json';
import mixedData from '../../fixtures/mixed-instagram.json';

describe('GrowthVelocityAnalyzer', () => {
  const analyzer = new GrowthVelocityAnalyzer();

  it('should score organic profile low', () => {
    const result = analyzer.analyze(organicData.followerHistory);
    expect(result.score).toBeLessThan(30);
    expect(result.details.anomalyDays).toHaveLength(0);
  });

  it('should score botted profile high', () => {
    const result = analyzer.analyze(bottedData.followerHistory);
    // Botted profile has multiple large spikes
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect((result.details.anomalyDays as any[]).length).toBeGreaterThanOrEqual(2);
  });

  it('should score mixed profile medium', () => {
    const result = analyzer.analyze(mixedData.followerHistory);
    // Mixed profile has 1 large spike
    expect(result.score).toBe(25);
    expect((result.details.anomalyDays as any[]).length).toBe(1);
  });

  it('should handle insufficient data gracefully', () => {
    const result = analyzer.analyze(organicData.followerHistory.slice(0, 5));
    expect(result.score).toBe(0);
    expect(result.confidence).toBe(0.3);
  });
});
