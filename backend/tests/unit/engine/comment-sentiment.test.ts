import { describe, it, expect, vi } from 'vitest';
import { CommentSentimentAnalyzer } from '../../../src/engine/analyzers/comment-sentiment.js';
import { OpenAIClient } from '../../../src/integrations/openai.client.js';
import organicData from '../../fixtures/organic-instagram.json';
import bottedData from '../../fixtures/botted-instagram.json';

// Mock OpenAI
const mockClassifyComments = vi.fn().mockResolvedValue([]);
const MockOpenAIClient = vi.fn().mockImplementation(() => {
  return { classifyComments: mockClassifyComments };
});

describe('CommentSentimentAnalyzer', () => {
  const mockClient = { classifyComments: mockClassifyComments } as any as OpenAIClient;
  const analyzer = new CommentSentimentAnalyzer(mockClient);

  it('should score organic profile low using rules', async () => {
    const result = await analyzer.analyze(organicData.comments);
    // Rules shouldn't find many bots here
    expect(result.score).toBeLessThan(30);
  });

  it('should score botted profile high using rules', async () => {
    const result = await analyzer.analyze(bottedData.comments);
    // Botted profile has emojis and "Awesome post 🔥" duplicated
    expect(result.score).toBeGreaterThan(30);
    expect(result.details.duplicateComments).toBeGreaterThan(0);
  });

  it('should fallback gracefully if OpenAI throws', async () => {
    mockClassifyComments.mockRejectedValueOnce(new Error('API Down'));
    const result = await analyzer.analyze(organicData.comments);
    expect(result.confidence).toBe(0.5); // Fallback confidence
  });
});
