import { env } from '../config/env.js';
import { UpstreamError } from '../utils/errors.js';

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
  private readonly baseUrl = 'https://instagram-scraper-api2.p.rapidapi.com';
  
  private async fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        const isTimeout = error instanceof DOMException && error.name === 'AbortError';
        console.error(`InstagramClient error (attempt ${i + 1}):`, isTimeout ? 'Request timed out after 15s' : error);
        if (i === retries) {
          throw new UpstreamError(
            isTimeout
              ? 'Instagram API request timed out after multiple retries'
              : 'Failed to fetch from Instagram API after multiple retries'
          );
        }
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  private getHeaders() {
    return {
      'x-rapidapi-key': env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com'
    };
  }

  async getProfile(handle: string): Promise<InstagramProfile> {
    const url = `${this.baseUrl}/v1/info?username_or_id_or_url=${encodeURIComponent(handle)}`;
    const data = await this.fetchWithRetry(url, { headers: this.getHeaders() });
    
    const user = data.data;
    
    return {
      displayName: user.full_name || user.username,
      handle: user.username,
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      posts: user.media_count || 0,
      bio: user.biography || '',
      profilePictureUrl: user.profile_pic_url || '',
      isVerified: user.is_verified || false,
      category: user.category_name || ''
    };
  }

  async getRecentPosts(handle: string, count: number = 20): Promise<InstagramPost[]> {
    const url = `${this.baseUrl}/v1.2/posts?username_or_id_or_url=${encodeURIComponent(handle)}`;
    const data = await this.fetchWithRetry(url, { headers: this.getHeaders() });
    
    const items = data.data?.items || [];
    return items.slice(0, count).map((item: any) => ({
      id: item.id,
      timestamp: new Date((item.taken_at || 0) * 1000).toISOString(),
      likes: item.like_count || 0,
      commentsCount: item.comment_count || 0,
      caption: item.caption?.text || ''
    }));
  }

  async getComments(handle: string, postCount: number = 10): Promise<InstagramComment[]> {
    // Note: A true robust implementation would fetch posts first, then fetch comments for each post.
    // For this prototype, we'll fetch recent posts and then gather comments from them.
    const posts = await this.getRecentPosts(handle, postCount);
    const comments: InstagramComment[] = [];
    
    for (const post of posts) {
      if (post.commentsCount === 0) continue;
      
      const url = `${this.baseUrl}/v1/comments?code_or_id_or_url=${post.id}`;
      try {
        const data = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 1);
        const postComments = data.data?.items || [];
        
        for (const item of postComments) {
          comments.push({
            text: item.text || '',
            username: item.user?.username || '',
            timestamp: new Date((item.created_at || 0) * 1000).toISOString()
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch comments for post ${post.id}`);
        // gracefully continue for other posts
      }
    }
    
    return comments;
  }
}
