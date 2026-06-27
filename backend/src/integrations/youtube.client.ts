import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { UpstreamError } from '../utils/errors.js';

// YouTube API base URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeChannel {
  displayName: string;
  handle: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  bio: string;
  profilePictureUrl: string;
  isVerified: boolean;
  category: string;
  channelId: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeComment {
  text: string;
  authorName: string;
  likeCount: number;
  publishedAt: string;
}

export class YouTubeClient {
  private apiKey: string;

  constructor() {
    this.apiKey = env.YOUTUBE_API_KEY ?? '';
  }

  // Search for channel by handle/username
  async getChannel(handle: string): Promise<YouTubeChannel> {
    try {
      // Remove @ prefix if present
      const cleanHandle = handle.replace(/^@/, '');

      // First try searching by handle
      const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', cleanHandle);
      searchUrl.searchParams.set('type', 'channel');
      searchUrl.searchParams.set('maxResults', '5');
      searchUrl.searchParams.set('key', this.apiKey);

      const searchRes = await fetch(searchUrl.toString());
      const searchData: any = await searchRes.json();

      if (!searchData.items || searchData.items.length === 0) {
        throw new Error(`YouTube channel not found: ${cleanHandle}`);
      }

      // Get the first matching channel ID
      const channelId = searchData.items[0].snippet.channelId;

      // Fetch full channel details
      return await this.getChannelById(channelId, cleanHandle);
    } catch (error) {
      logger.error({ error, handle }, 'YouTube getChannel failed');
      throw new UpstreamError(
        `YouTube API error while fetching channel: ${(error as Error).message}`,
      );
    }
  }

  private async getChannelById(
    channelId: string,
    handle: string,
  ): Promise<YouTubeChannel> {
    const channelUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
    channelUrl.searchParams.set('part', 'snippet,statistics,brandingSettings');
    channelUrl.searchParams.set('id', channelId);
    channelUrl.searchParams.set('key', this.apiKey);

    const channelRes = await fetch(channelUrl.toString());
    const channelData: any = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error(`Channel data not found for ID: ${channelId}`);
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const stats = channel.statistics;

    return {
      displayName: snippet.title ?? handle,
      handle: handle,
      subscribers: parseInt(stats.subscriberCount ?? '0', 10),
      videoCount: parseInt(stats.videoCount ?? '0', 10),
      viewCount: parseInt(stats.viewCount ?? '0', 10),
      bio: snippet.description ?? '',
      profilePictureUrl:
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.default?.url ?? '',
      isVerified: false, // YouTube API doesn't expose verification status
      category: snippet.defaultLanguage ?? 'general',
      channelId,
    };
  }

  // Get recent videos for a channel
  async getRecentVideos(
    channelId: string,
    count: number = 20,
  ): Promise<YouTubeVideo[]> {
    try {
      // Get video IDs from channel
      const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      searchUrl.searchParams.set('part', 'id');
      searchUrl.searchParams.set('channelId', channelId);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('order', 'date');
      searchUrl.searchParams.set('maxResults', String(count));
      searchUrl.searchParams.set('key', this.apiKey);

      const searchRes = await fetch(searchUrl.toString());
      const searchData: any = await searchRes.json();

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      const videoIds = searchData.items
        .map((item: any) => item.id.videoId)
        .filter(Boolean)
        .join(',');

      // Get video statistics
      const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
      videoUrl.searchParams.set('part', 'snippet,statistics');
      videoUrl.searchParams.set('id', videoIds);
      videoUrl.searchParams.set('key', this.apiKey);

      const videoRes = await fetch(videoUrl.toString());
      const videoData: any = await videoRes.json();

      return (videoData.items ?? []).map((video: any) => ({
        id: video.id,
        title: video.snippet?.title ?? '',
        publishedAt: video.snippet?.publishedAt ?? '',
        viewCount: parseInt(video.statistics?.viewCount ?? '0', 10),
        likeCount: parseInt(video.statistics?.likeCount ?? '0', 10),
        commentCount: parseInt(video.statistics?.commentCount ?? '0', 10),
      }));
    } catch (error) {
      logger.error({ error, channelId }, 'YouTube getRecentVideos failed');
      return [];
    }
  }

  // Get comments from recent videos
  async getComments(
    channelId: string,
    videoCount: number = 5,
  ): Promise<YouTubeComment[]> {
    try {
      // Get recent video IDs first
      const videos = await this.getRecentVideos(channelId, videoCount);
      const allComments: YouTubeComment[] = [];

      for (const video of videos.slice(0, videoCount)) {
        try {
          const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
          commentsUrl.searchParams.set('part', 'snippet');
          commentsUrl.searchParams.set('videoId', video.id);
          commentsUrl.searchParams.set('maxResults', '40');
          commentsUrl.searchParams.set('order', 'relevance');
          commentsUrl.searchParams.set('key', this.apiKey);

          const commentsRes = await fetch(commentsUrl.toString());
          const commentsData: any = await commentsRes.json();

          if (commentsData.items) {
            const comments = commentsData.items.map((item: any) => ({
              text: item.snippet?.topLevelComment?.snippet?.textDisplay ?? '',
              authorName:
                item.snippet?.topLevelComment?.snippet?.authorDisplayName ?? '',
              likeCount:
                item.snippet?.topLevelComment?.snippet?.likeCount ?? 0,
              publishedAt:
                item.snippet?.topLevelComment?.snippet?.publishedAt ?? '',
            }));
            allComments.push(...comments);
          }
        } catch {
          // Skip video if comments are disabled
          continue;
        }
      }

      return allComments.slice(0, 200);
    } catch (error) {
      logger.error({ error, channelId }, 'YouTube getComments failed');
      return [];
    }
  }
}

export const youtubeClient = new YouTubeClient();
