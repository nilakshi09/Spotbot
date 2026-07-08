export interface InstagramProfile {
  displayName: string;
  handle: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  profilePictureUrl: string;
  isVerified: boolean;
  category: string;
}

export interface InstagramPost {
  id: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  caption: string;
}

export interface InstagramComment {
  text: string;
  username: string;
  timestamp: string;
}

export class InstagramClient {

  async getProfile(handle: string): Promise<InstagramProfile> {
    // Generate consistent mock data based on handle
    const seed = handle.length
    const followers = 50000 + (seed * 37891) % 900000
    const following = 500 + (seed * 123) % 2000
    const posts = 100 + (seed * 47) % 800

    return {
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
      handle,
      followers,
      following,
      posts, // Kept as 'posts' to match the interface instead of 'postCount'
      bio: '✨ Content Creator | Brand Ambassador | DM for collabs',
      profilePictureUrl: '',
      isVerified: followers > 500000,
      category: ['fitness', 'beauty', 'travel', 'food', 'tech'][seed % 5],
    }
  }

  async getRecentPosts(handle: string, count: number = 20): Promise<InstagramPost[]> {
    const seed = handle.length
    const followers = 50000 + (seed * 37891) % 900000
    // Low engagement rate for high-follower accounts (suspicious)
    const baseEngagement = followers > 500000 ? 0.008 : 0.025

    return Array.from({ length: count }, (_, i) => ({
      id: `post_${handle}_${i}`,
      timestamp: new Date(
        Date.now() - i * 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      likes: Math.floor(followers * baseEngagement * (0.8 + Math.random() * 0.4)),
      commentsCount: Math.floor(followers * baseEngagement * 0.05),
      caption: `Post ${i + 1} caption here ✨ #lifestyle #content`,
    }))
  }

  async getComments(handle: string, postCount: number = 10): Promise<InstagramComment[]> {
    const seed = handle.length
    // Generate mix of authentic and bot comments
    const botRatio = 0.3 + (seed % 5) * 0.08

    const botPhrases = [
      'Great post! 🔥', 'Love this! ❤️', 'Amazing! 💯',
      '🔥🔥🔥', 'So good!', 'Wow! 😍', '👏👏👏',
      'Follow me back!', 'Check my page!', '💕💕',
    ]
    const authenticPhrases = [
      'This is exactly what I needed to see today!',
      'Where did you get that? Looks amazing on you',
      'I tried this recipe and it turned out great!',
      'Been following you for 2 years, love your content',
      'This place looks incredible, adding to my bucket list',
      'Your editing style has improved so much lately',
    ]

    return Array.from({ length: 100 }, (_, i) => ({
      text: Math.random() < botRatio
        ? botPhrases[i % botPhrases.length]
        : authenticPhrases[i % authenticPhrases.length],
      username: `user_${handle}_${i}`,
      timestamp: new Date().toISOString(),
    }))
  }
}

export const instagramClient = new InstagramClient()
