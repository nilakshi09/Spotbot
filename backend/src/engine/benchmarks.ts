export const BENCHMARKS: Record<string, Record<string, number>> = {
  // niche → tier → median ER %
  fitness:       { nano: 5.2, micro: 3.8, mid: 2.4, macro: 1.6, mega: 1.0 },
  beauty:        { nano: 4.8, micro: 3.5, mid: 2.2, macro: 1.4, mega: 0.9 },
  fashion:       { nano: 4.5, micro: 3.2, mid: 2.0, macro: 1.2, mega: 0.8 },
  food:          { nano: 5.5, micro: 4.0, mid: 2.6, macro: 1.7, mega: 1.1 },
  travel:        { nano: 4.2, micro: 3.0, mid: 1.9, macro: 1.2, mega: 0.8 },
  tech:          { nano: 3.8, micro: 2.8, mid: 1.8, macro: 1.1, mega: 0.7 },
  gaming:        { nano: 4.0, micro: 3.2, mid: 2.1, macro: 1.4, mega: 0.9 },
  lifestyle:     { nano: 4.5, micro: 3.3, mid: 2.1, macro: 1.3, mega: 0.8 },
  business:      { nano: 3.5, micro: 2.6, mid: 1.6, macro: 1.0, mega: 0.6 },
  education:     { nano: 4.0, micro: 3.0, mid: 1.9, macro: 1.2, mega: 0.7 },
  health:        { nano: 4.8, micro: 3.6, mid: 2.3, macro: 1.5, mega: 1.0 },
  parenting:     { nano: 5.0, micro: 3.8, mid: 2.4, macro: 1.5, mega: 0.9 },
  pets:          { nano: 6.0, micro: 4.5, mid: 2.9, macro: 1.8, mega: 1.2 },
  sports:        { nano: 4.2, micro: 3.1, mid: 2.0, macro: 1.3, mega: 0.8 },
  entertainment: { nano: 4.5, micro: 3.4, mid: 2.2, macro: 1.4, mega: 0.9 },
  photography:   { nano: 4.8, micro: 3.5, mid: 2.2, macro: 1.4, mega: 0.9 },
  art:           { nano: 5.2, micro: 3.9, mid: 2.5, macro: 1.6, mega: 1.0 },
  music:         { nano: 4.6, micro: 3.4, mid: 2.2, macro: 1.4, mega: 0.9 },
  // Default fallback (general/unknown niche)
  general:       { nano: 4.5, micro: 3.3, mid: 2.1, macro: 1.3, mega: 0.8 },
};

// Tier boundaries
export function getFollowerTier(followers: number): string {
  if (followers < 10_000) return 'nano';
  if (followers < 50_000) return 'micro';
  if (followers < 200_000) return 'mid';
  if (followers < 1_000_000) return 'macro';
  return 'mega';
}

// Niche detection from bio + category string
export function detectNiche(bio: string, category: string): string {
  const text = `${bio} ${category}`.toLowerCase();
  // keyword → niche mapping
  const nicheKeywords: Record<string, string[]> = {
    fitness: ['fitness', 'gym', 'workout', 'training', 'bodybuilding', 'crossfit', 'athlete'],
    beauty: ['beauty', 'makeup', 'skincare', 'cosmetic', 'glam'],
    fashion: ['fashion', 'style', 'ootd', 'outfit', 'model', 'streetwear'],
    food: ['food', 'recipe', 'cooking', 'chef', 'foodie', 'baking', 'restaurant'],
    travel: ['travel', 'adventure', 'wanderlust', 'explore', 'nomad', 'backpack'],
    tech: ['tech', 'technology', 'developer', 'coding', 'software', 'startup', 'ai'],
    gaming: ['gaming', 'gamer', 'esports', 'twitch', 'streamer', 'game'],
    lifestyle: ['lifestyle', 'life', 'daily', 'routine', 'vlog', 'content'],
    business: ['business', 'entrepreneur', 'ceo', 'founder', 'marketing', 'brand'],
    education: ['education', 'teacher', 'learning', 'study', 'tutoring', 'school'],
    health: ['health', 'wellness', 'mental health', 'yoga', 'meditation', 'nutrition'],
    parenting: ['mom', 'dad', 'parent', 'baby', 'kids', 'family', 'toddler'],
    pets: ['dog', 'cat', 'pet', 'puppy', 'kitten', 'animal', 'paws'],
    sports: ['sport', 'football', 'basketball', 'soccer', 'tennis', 'swimming'],
    entertainment: ['comedian', 'actor', 'actress', 'performer', 'entertainer'],
    photography: ['photographer', 'photography', 'photo', 'canon', 'nikon', 'portrait'],
    art: ['artist', 'art', 'drawing', 'painting', 'illustration', 'design'],
    music: ['musician', 'singer', 'rapper', 'dj', 'producer', 'music'],
  };
  
  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    if (keywords.some(kw => text.includes(kw))) return niche;
  }
  return 'general';
}
