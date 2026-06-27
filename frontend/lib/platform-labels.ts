// Platform-specific label mappings
// YouTube uses different terminology than Instagram

export type Platform = 'instagram' | 'youtube';

export const platformLabels = {
  instagram: {
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    likes: 'Likes',
    comments: 'Comments',
    followerGrowth: 'Follower Growth',
    engagementRate: 'Engagement Rate',
    engagementRateDesc: 'Likes + Comments / Followers × 100',
    handlePrefix: '@',
    handlePlaceholder: 'username',
    handleLabel: 'Instagram Handle',
    scanButtonText: 'Analyze Instagram Audience',
    realReachLabel: 'Estimated Real Followers',
    followerHistoryLabel: 'Follower Growth Timeline',
  },
  youtube: {
    followers: 'Subscribers',
    following: 'N/A',
    posts: 'Videos',
    likes: 'Likes',
    comments: 'Comments',
    followerGrowth: 'Subscriber Growth',
    engagementRate: 'Video Engagement Rate',
    engagementRateDesc: 'Likes + Comments / Views × 100',
    handlePrefix: '@',
    handlePlaceholder: 'channelname',
    handleLabel: 'YouTube Handle or Channel',
    scanButtonText: 'Analyze YouTube Audience',
    realReachLabel: 'Estimated Real Subscribers',
    followerHistoryLabel: 'Subscriber Growth Timeline',
  },
} as const;

export function getLabel(
  platform: Platform,
  key: keyof typeof platformLabels.instagram,
): string {
  return platformLabels[platform][key];
}

// Format follower/subscriber count with platform-aware label
export function formatFollowerCount(
  count: number,
  platform: Platform,
): string {
  const label = platform === 'youtube' ? 'subscribers' : 'followers';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M ${label}`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K ${label}`;
  return `${count} ${label}`;
}

// Get platform color for UI accents
export function getPlatformColor(platform: Platform): string {
  return platform === 'youtube'
    ? 'text-red-400'
    : 'text-pink-400';
}

export function getPlatformBg(platform: Platform): string {
  return platform === 'youtube'
    ? 'bg-red-400/10 border-red-400/20'
    : 'bg-pink-400/10 border-pink-400/20';
}
