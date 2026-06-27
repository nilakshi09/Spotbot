import type { YouTubeChannel, YouTubeVideo, YouTubeComment } from './youtube.client.js';
import type { ProfileData } from '../engine/types.js';

// Map YouTube channel to unified ProfileData format
// used by the fraud engine (same format as Instagram)
export function mapYouTubeProfile(channel: YouTubeChannel): ProfileData {
  return {
    displayName: channel.displayName,
    followers: channel.subscribers,    // subscribers = followers equivalent
    following: 0,                      // YouTube channels don't have following
    posts: channel.videoCount,         // videos = posts equivalent
    bio: channel.bio,
    profilePictureUrl: channel.profilePictureUrl,
    isVerified: channel.isVerified,
    category: detectYouTubeCategory(channel.bio, channel.category),
    // YouTube-specific extra data:
    platform: 'youtube' as const,
    extraData: {
      channelId: channel.channelId,
      totalViews: channel.viewCount,
      videoCount: channel.videoCount,
    },
  } as ProfileData;
}

// Map YouTube videos to unified post format
export function mapYouTubePosts(videos: YouTubeVideo[]) {
  return videos.map(video => ({
    id: video.id,
    timestamp: video.publishedAt,
    likes: video.likeCount,
    commentsCount: video.commentCount,
    caption: video.title,
    // YouTube-specific:
    views: video.viewCount,
  }));
}

// Map YouTube comments to unified comment format
export function mapYouTubeComments(comments: YouTubeComment[]) {
  return comments.map(comment => ({
    text: comment.text,
    username: comment.authorName,
    timestamp: comment.publishedAt,
  }));
}

// Detect YouTube channel category from bio
function detectYouTubeCategory(bio: string, category: string): string {
  const text = `${bio} ${category}`.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    gaming: ['gaming', 'gamer', 'gameplay', 'minecraft', 'fortnite', 'roblox'],
    tech: ['tech', 'technology', 'programming', 'coding', 'software', 'ai', 'review'],
    education: ['education', 'tutorial', 'learn', 'teacher', 'course', 'explain'],
    entertainment: ['entertainment', 'comedy', 'funny', 'vlog', 'challenge'],
    music: ['music', 'song', 'singer', 'rapper', 'producer', 'beats'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'yoga'],
    food: ['food', 'recipe', 'cooking', 'chef', 'baking', 'restaurant'],
    travel: ['travel', 'vlog', 'adventure', 'explore', 'journey'],
    beauty: ['beauty', 'makeup', 'skincare', 'fashion', 'style'],
    finance: ['finance', 'investing', 'money', 'crypto', 'stocks', 'business'],
  };

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => text.includes(kw))) return cat;
  }

  return 'general';
}
