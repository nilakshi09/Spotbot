// import { env } from '../config/env.js';

// export interface FollowerSnapshot {
//   date: string; // YYYY-MM-DD
//   followers: number;
// }

// export class SocialBladeClient {
//   private readonly baseUrl = 'https://matrix.sbapis.com/b/instagram/statistics';
  
//   async getFollowerHistory(handle: string, days: number = 90): Promise<FollowerSnapshot[]> {
//     if (!env.SOCIALBLADE_API_KEY) {
//       console.warn('SOCIALBLADE_API_KEY not set. Returning empty follower history.');
//       return [];
//     }

//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout
//     try {
//       const response = await fetch(`${this.baseUrl}?query=${encodeURIComponent(handle)}`, {
//         headers: {
//           'clientid': env.SOCIALBLADE_API_KEY,
//           // 'token': ... depending on API setup
//         },
//         signal: controller.signal,
//       });
      
//       clearTimeout(timeoutId);
//       if (!response.ok) {
//         console.warn(`SocialBlade API failed with status ${response.status}. Returning empty history.`);
//         return [];
//       }
      
//       const data = (await response.json()) as { data?: { daily?: { date: string; followers?: number }[] } };
      
//       // Map response to our FollowerSnapshot format
//       // SocialBlade typically returns a daily array
//       const history = data.data?.daily || [];
      
//       const snapshots = history.slice(-days).map((day: { date: string; followers?: number }) => ({
//         date: day.date,
//         followers: day.followers || 0
//       }));
      
//       return snapshots;
//     } catch (error) {
//       clearTimeout(timeoutId);
//       console.warn('SocialBlade request failed, returning empty follower history:', error);
//       return [];
//     }
//   }
// }




export class SocialBladeClient {
  async getFollowerHistory(handle: string, days: number = 90) {
    const seed = handle.length
    const baseFollowers = 50000 + (seed * 37891) % 900000

    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))

      // Add suspicious spike on day 30 and day 60
      const isSpike = i === 30 || i === 60
      const growth = isSpike
        ? Math.floor(baseFollowers * 0.04)
        : Math.floor(Math.random() * 200) - 50

      return {
        date: date.toISOString().split('T')[0],
        followers: baseFollowers + (i * 150) + (isSpike ? growth : 0),
      }
    })
  }
}

export const socialBladeClient = new SocialBladeClient()