import OpenAI from 'openai';
import { env } from '../config/env.js';

export type CommentClassification = 'authentic' | 'generic_bot' | 'emoji_only' | 'spam';

export class OpenAIClient {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async classifyComments(comments: string[]): Promise<CommentClassification[]> {
    if (comments.length === 0) return [];
    
    const prompt = `Classify each comment as exactly one of: "authentic", "generic_bot", "emoji_only", or "spam".

authentic: specific to the content, shows genuine engagement
generic_bot: vague templated phrase that could apply to any post ("Great post!", "Love this 🔥")
emoji_only: contains only emojis, no meaningful text
spam: promotional links, follow-bait, unrelated content

Return ONLY a JSON array of strings in the same order as input. No explanation.

Example: ["authentic", "generic_bot", "emoji_only", "spam"]
Comments:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      
      // Attempt to parse JSON array from response
      const match = responseText.match(/\[.*\]/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === comments.length) {
          return parsed as CommentClassification[];
        }
      }
      
      throw new Error('Invalid response format from OpenAI');
    } catch (error) {
      console.warn('OpenAI classification failed, falling back to rule-based:', error);
      // Return empty array to signify failure, will be handled by fallback
      throw error;
    }
  }
}
