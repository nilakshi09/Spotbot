import { InstagramComment } from '../../integrations/instagram.client.js';
import { OpenAIClient } from '../../integrations/openai.client.js';
import { AnalyzerResult } from '../types.js';

export class CommentSentimentAnalyzer {
  constructor(private openaiClient: OpenAIClient) {}

  async analyze(comments: InstagramComment[]): Promise<AnalyzerResult> {
    const totalAnalyzed = comments.length;
    
    // Confidence
    let confidence = 0.5; // Default for rule-based only or < 50
    if (totalAnalyzed >= 100) confidence = 0.9;
    else if (totalAnalyzed >= 50) confidence = 0.7;

    if (totalAnalyzed === 0) {
      return {
        score: 0,
        confidence: 0.5,
        summary: "No comments to analyze",
        details: { totalAnalyzed: 0 }
      };
    }

    let authentic = 0;
    let genericBot = 0;
    let emojiOnly = 0;
    let spam = 0;
    let duplicateComments = 0;

    const botRegex = /^(nice|great|amazing|awesome|love|beautiful|gorgeous|stunning|perfect|wow|cool)\s*(post|pic|photo|content|shot|feed|work|job)?[!\s][❤🔥💯👏✨😍💪🙌👍]*$/i;
    const emojiRegex = /^[❤🔥💯👏✨😍👍💪🙌💕🌟⭐🎉🥰😘]+$/;
    const followBaitRegex = /follow\s*(me|back|us)|check\s*(my|out)\s*(page|profile|bio|link)/i;
    const fireLitRegex = /^(f+i+r+e+|l+i+t+|🔥+|💯+)$/i;
    const niceJobRegex = /^(great|nice|good|excellent)\s*(content|post|pic|work|job)[.!]*$/i;
    const keepGoingRegex = /^(keep\s*(it\sup|going|posting)|stay\sblessed|god\sbless)[.!]$/i;
    const twoUserTagRegex = /^[a-z0-9_.]+\s+[a-z0-9_.]+$/i;

    const seenTexts = new Map<string, number>();

    // Pass 1: Rule-based & Deduplication
    const toClassify: { index: number, text: string }[] = [];

    for (let i = 0; i < comments.length; i++) {
      const text = comments[i].text.trim();
      const lowerText = text.toLowerCase();
      
      const count = (seenTexts.get(lowerText) || 0) + 1;
      seenTexts.set(lowerText, count);

      if (count === 3) {
        duplicateComments += 2; // the first 2 were previously counted somewhere, now we know they're dupes
      }
      if (count >= 3) {
        duplicateComments++;
        genericBot++; // classify as generic bot due to duplication
        continue;
      }

      // Check Rules
      if (emojiRegex.test(text)) {
        emojiOnly++;
      } else if (followBaitRegex.test(text) || fireLitRegex.test(text) || twoUserTagRegex.test(text)) {
        spam++;
      } else if (botRegex.test(text) || niceJobRegex.test(text) || keepGoingRegex.test(text)) {
        genericBot++;
      } else {
        toClassify.push({ index: i, text });
      }
    }

    // Step 3 — OpenAI batch classification for remaining ambiguous comments
    let openAIClassified = 0;
    
    // Batch in groups of 50
    for (let i = 0; i < toClassify.length; i += 50) {
      const batch = toClassify.slice(i, i + 50);
      try {
        const results = await this.openaiClient.classifyComments(batch.map(b => b.text));
        openAIClassified += results.length;
        
        for (const res of results) {
          if (res === 'authentic') authentic++;
          else if (res === 'generic_bot') genericBot++;
          else if (res === 'emoji_only') emojiOnly++;
          else if (res === 'spam') spam++;
          else authentic++; // default to authentic if invalid classification
        }
      } catch (err) {
        console.warn('OpenAI classification failed for batch, using rule-based only:', err);
        // If it fails, assume the remaining are authentic to avoid false positives, or just reduce confidence.
        // Spec says: "If OpenAI is unavailable, return rule-based classification only (set comment sentiment confidence to 0.5)."
        confidence = 0.5;
        authentic += batch.length; // conservatively mark as authentic if we can't classify
      }
    }

    const botCount = genericBot + emojiOnly + spam;
    const botRatio = botCount / totalAnalyzed;

    // score = min(100, Math.round(botRatio * 130))
    const score = Math.min(100, Math.round(botRatio * 130));

    const summary = `${(botRatio * 100).toFixed(1)}% of comments match bot or spam patterns.`;

    return {
      score,
      confidence,
      summary,
      details: {
        totalAnalyzed,
        authentic,
        genericBot,
        emojiOnly,
        spam,
        botRatio,
        duplicateComments,
        openAIClassified,
        topBotPhrases: [] // Hard to compute without full NLP grouping
      }
    };
  }
}
