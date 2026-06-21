import { FollowerSnapshot } from '../../integrations/socialblade.client.js';
import { AnalyzerResult } from '../types.js';

export class GrowthVelocityAnalyzer {
  analyze(followerHistory: FollowerSnapshot[]): AnalyzerResult {
    const dataPointCount = followerHistory.length;
    
    // Confidence based on data availability
    let confidence = 0.3;
    if (dataPointCount >= 90) confidence = 1.0;
    else if (dataPointCount >= 60) confidence = 0.8;
    else if (dataPointCount >= 30) confidence = 0.6;
    
    if (dataPointCount < 7) {
      return {
        score: 0,
        confidence: 0.3, // Forced confidence for insufficient data
        summary: "Insufficient data",
        details: { dataPointCount }
      };
    }

    const rates: number[] = [];
    const dailyGains: number[] = [];
    
    // Compute day-over-day growth rate
    for (let i = 1; i < dataPointCount; i++) {
      const prev = followerHistory[i - 1].followers;
      const curr = followerHistory[i].followers;
      
      if (prev > 0) {
        rates.push((curr - prev) / prev);
      } else {
        rates.push(0);
      }
      dailyGains.push(curr - prev);
    }

    // Since we need a rolling 30-day mean, let's simplify for the full period if less than 30, 
    // or compute a global mean/std for simplicity of the prototype (as per spec "Calculate rolling 30-day mean").
    // To strictly follow spec, we'll do a simple global mean/std if < 30, otherwise a sliding window.
    // For ease, let's use the mean and std dev of the last 30 days (or all available if < 30).
    let anomalies = 0;
    const anomalyDays: string[] = [];
    const anomalyMagnitudes: number[] = [];

    let lastRollingMean = 0;
    let lastRollingStdDev = 0;

    for (let i = 0; i < rates.length; i++) {
      // Calculate rolling mean and std for the window BEFORE this day
      // Spec: "Calculate rolling 30-day mean (μ) and standard deviation (σ) of growth rate"
      // If we don't have past data, we compare against the overall mean as fallback
      let windowRates = rates.slice(Math.max(0, i - 30), i);
      if (windowRates.length < 3) windowRates = rates; // fallback if early in the array
      
      const rMean = windowRates.reduce((a, b) => a + b, 0) / windowRates.length;
      const rVar = windowRates.reduce((a, b) => a + Math.pow(b - rMean, 2), 0) / windowRates.length;
      const rStd = Math.sqrt(rVar);
      
      lastRollingMean = rMean;
      lastRollingStdDev = rStd;

      const threshold = rMean + 3 * rStd;

      // only flag if spike is > 500 followers in absolute terms
      if (rates[i] > threshold && dailyGains[i] > 500) {
        anomalies++;
        anomalyDays.push(followerHistory[i + 1].date);
        anomalyMagnitudes.push(dailyGains[i]);
      }
    }

    let score = 0;
    if (anomalies === 1) score = 25;
    else if (anomalies === 2) score = 50;
    else if (anomalies === 3) score = 75;
    else if (anomalies >= 4) score = 100;

    let summary = `No abnormal growth spikes detected in the last ${dataPointCount} days`;
    if (anomalies > 0) {
      const examples = anomalyDays.map((d, i) => `${d}: +${anomalyMagnitudes[i]}`).join(', ');
      summary = `${anomalies} abnormal growth spikes detected (${examples})`;
    }

    const avgDailyGrowth = dailyGains.reduce((a, b) => a + b, 0) / dailyGains.length;
    const maxDailyGrowth = Math.max(...dailyGains);

    return {
      score,
      confidence,
      summary,
      details: {
        anomalyDays,
        anomalyMagnitudes,
        avgDailyGrowth: Math.round(avgDailyGrowth),
        maxDailyGrowth,
        dataPointCount,
        rollingMean: lastRollingMean,
        rollingStdDev: lastRollingStdDev
      }
    };
  }
}
