import { env } from '../config/env.js';

export interface FollowerSnapshot {
  date: string; // YYYY-MM-DD
  followers: number;
}

export class SocialBladeClient {
  private readonly baseUrl = 'https://matrix.sbapis.com/b/instagram/statistics';
  
  async getFollowerHistory(handle: string, days: number = 90): Promise<FollowerSnapshot[]> {
    if (!env.SOCIALBLADE_API_KEY) {
      console.warn('SOCIALBLADE_API_KEY not set. Returning empty follower history.');
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout
    try {
      const response = await fetch(`${this.baseUrl}?query=${encodeURIComponent(handle)}`, {
        headers: {
          'clientid': env.SOCIALBLADE_API_KEY,
          // 'token': ... depending on API setup
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`SocialBlade API failed with status ${response.status}. Returning empty history.`);
        return [];
      }
      
      const data: any = await response.json();
      
      // Map response to our FollowerSnapshot format
      // SocialBlade typically returns a daily array
      const history = data.data?.daily || [];
      
      const snapshots = history.slice(-days).map((day: any) => ({
        date: day.date,
        followers: day.followers || 0
      }));
      
      return snapshots;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('SocialBlade request failed, returning empty follower history:', error);
      return [];
    }
  }
}
