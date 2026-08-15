export interface UserStats {
  totalBugsKilled: number;
  totalScore: number;
  totalWavesCompleted: number;
  totalPlayTime: number; // in seconds
  totalPowerupsCollected: number;
  bossesKilled: number;
  lastPlayed: string;
  totalRuns: number;
  bestWaveReached: number;
  averageHitAccuracy?: number;
  averageTimeToClear?: number;
}

export const INITIAL_STATS: UserStats = {
  totalBugsKilled: 0,
  totalScore: 0,
  totalWavesCompleted: 0,
  totalPlayTime: 0,
  totalPowerupsCollected: 0,
  bossesKilled: 0,
  lastPlayed: new Date().toISOString(),
  totalRuns: 0,
  bestWaveReached: 0,
  averageHitAccuracy: 0,
  averageTimeToClear: 0,
};

export class StatsManager {
  private stats: UserStats = this.loadLocal();

  private loadLocal(): UserStats {
    const saved = localStorage.getItem('nexus_user_stats');
    if (saved) {
      return { ...INITIAL_STATS, ...JSON.parse(saved) };
    }
    return { ...INITIAL_STATS };
  }

  getStats(): UserStats {
    return { ...this.stats };
  }

  updateStats(sessionStats: Partial<UserStats>) {
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

  setStats(newStats: UserStats) {
      this.stats = { ...newStats };
      this.saveLocal();
  }

  recordRunStart(): void {
    this.stats.totalRuns = (this.stats.totalRuns || 0) + 1;
    this.saveLocal();
  }

  recordRunEnd(wave: number, score: number): void {
    this.stats.bestWaveReached = Math.max(this.stats.bestWaveReached || 0, wave);
    if (score > 0) {
      this.stats.totalScore = Math.max(this.stats.totalScore || 0, score);
    }
    this.stats.lastPlayed = new Date().toISOString();
    this.saveLocal();
  }

  private saveLocal() {
    localStorage.setItem('nexus_user_stats', JSON.stringify(this.stats));
  }
}

/** Default app-wide instance. Engine paths receive injected instances (A-03). */
export const statsManager = new StatsManager();
