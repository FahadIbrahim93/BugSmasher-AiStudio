export interface UserStats {
  totalBugsKilled: number;
  totalScore: number;
  totalWavesCompleted: number;
  totalPlayTime: number; // in seconds
  totalPowerupsCollected: number;
  bossesKilled: number;
  lastPlayed: string;
}

export const INITIAL_STATS: UserStats = {
  totalBugsKilled: 0,
  totalScore: 0,
  totalWavesCompleted: 0,
  totalPlayTime: 0,
  totalPowerupsCollected: 0,
  bossesKilled: 0,
  lastPlayed: new Date().toISOString()
};

export class StatsManager {
  private static stats: UserStats = StatsManager.loadLocal();

  private static loadLocal(): UserStats {
    const saved = localStorage.getItem('nexus_user_stats');
    if (saved) {
      return { ...INITIAL_STATS, ...JSON.parse(saved) };
    }
    return { ...INITIAL_STATS };
  }

  static getStats(): UserStats {
    return { ...this.stats };
  }

  static updateStats(sessionStats: Partial<UserStats>) {
    this.stats = {
      ...this.stats,
      totalBugsKilled: (this.stats.totalBugsKilled || 0) + (sessionStats.totalBugsKilled || 0),
      totalScore: (this.stats.totalScore || 0) + (sessionStats.totalScore || 0),
      totalWavesCompleted: (this.stats.totalWavesCompleted || 0) + (sessionStats.totalWavesCompleted || 0),
      totalPlayTime: (this.stats.totalPlayTime || 0) + (sessionStats.totalPlayTime || 0),
      totalPowerupsCollected: (this.stats.totalPowerupsCollected || 0) + (sessionStats.totalPowerupsCollected || 0),
      bossesKilled: (this.stats.bossesKilled || 0) + (sessionStats.bossesKilled || 0),
      lastPlayed: new Date().toISOString()
    };
    this.saveLocal();
  }

  static setStats(newStats: UserStats) {
      this.stats = { ...newStats };
      this.saveLocal();
  }

  private static saveLocal() {
    localStorage.setItem('nexus_user_stats', JSON.stringify(this.stats));
  }
}
