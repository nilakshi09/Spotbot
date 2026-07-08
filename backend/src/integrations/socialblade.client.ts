export interface FollowerSnapshot {
  date: string; // YYYY-MM-DD
  followers: number;
}

export class SocialBladeClient {
  async getFollowerHistory(handle: string, days: number = 90): Promise<FollowerSnapshot[]> {
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