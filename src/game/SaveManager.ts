// SaveManager - Handles persistent game data using localStorage
// High scores, settings, and statistics

interface GameSaveData {
  highScore: number;
  totalBugsSmashed: number;
  totalPlayTime: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  lastPlayed: string;
  gamesPlayed: number;
  prestigeLevel: number;
  prestigePoints: number;
  dailyChallengeCompleted: string;
  dailyChallengesCompleted: number;
  totalPrestigePointsEarned: number;
  highestWave: number;
  unlockedBiomes: string[];
}

const SAVE_KEY = 'bugsmasher_save';
const DEFAULT_SAVE: GameSaveData = {
  highScore: 0,
  totalBugsSmashed: 0,
  totalPlayTime: 0,
  soundEnabled: true,
  musicEnabled: true,
  lastPlayed: '',
  gamesPlayed: 0,
  prestigeLevel: 0,
  prestigePoints: 0,
  dailyChallengeCompleted: '',
  dailyChallengesCompleted: 0,
  totalPrestigePointsEarned: 0,
  highestWave: 0,
  unlockedBiomes: ['neon_core']
};

export class SaveManager {
  private data: GameSaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): GameSaveData {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        return { ...DEFAULT_SAVE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE };
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save:', e);
    }
  }

  // Getters
  getHighScore(): number { return this.data.highScore; }
  getTotalBugsSmashed(): number { return this.data.totalBugsSmashed; }
  getTotalPlayTime(): number { return this.data.totalPlayTime; }
  isSoundEnabled(): boolean { return this.data.soundEnabled; }
  isMusicEnabled(): boolean { return this.data.musicEnabled; }
  getGamesPlayed(): number { return this.data.gamesPlayed; }
  getPrestigeLevel(): number { return this.data.prestigeLevel; }
  getPrestigePoints(): number { return this.data.prestigePoints; }
  getDailyChallengeCompleted(): string { return this.data.dailyChallengeCompleted; }
  getDailyChallengesCompleted(): number { return this.data.dailyChallengesCompleted; }
  getTotalPrestigePointsEarned(): number { return this.data.totalPrestigePointsEarned; }
  getHighestWave(): number { return this.data.highestWave; }
  getUnlockedBiomes(): string[] { return this.data.unlockedBiomes; }
  setHighestWave(wave: number): void {
    if (wave > this.data.highestWave) {
      this.data.highestWave = wave;
      this.save();
    }
  }
  unlockBiome(biomeId: string): void {
    if (!this.data.unlockedBiomes.includes(biomeId)) {
      this.data.unlockedBiomes.push(biomeId);
      this.save();
    }
  }

  // Update methods
  updateHighScore(score: number): boolean {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  addBugsSmashed(count: number): void {
    this.data.totalBugsSmashed += count;
    this.save();
  }

  addPlayTime(seconds: number): void {
    this.data.totalPlayTime += seconds;
    this.save();
  }

  setSoundEnabled(enabled: boolean): void {
    this.data.soundEnabled = enabled;
    this.save();
  }

  setMusicEnabled(enabled: boolean): void {
    this.data.musicEnabled = enabled;
    this.save();
  }

  recordGamePlayed(): void {
    this.data.gamesPlayed++;
    this.data.lastPlayed = new Date().toISOString();
    this.save();
  }

  addPrestigePoints(points: number): void {
    this.data.prestigePoints += points;
    this.data.totalPrestigePointsEarned += points;
    this.save();
  }

  prestige(level: number): void {
    const pointsToAdd = this.calculatePrestigePoints(level);
    this.data.prestigeLevel = level;
    this.data.prestigePoints = pointsToAdd + this.data.totalPrestigePointsEarned;
    this.save();
  }

  private calculatePrestigePoints(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level));
  }

  getPrestigeMultiplier(): number {
    return 1 + (this.data.prestigeLevel * 0.1);
  }

  hasCompletedDailyChallenge(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.data.dailyChallengeCompleted === today;
  }

  completeDailyChallenge(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.dailyChallengeCompleted !== today) {
      this.data.dailyChallengeCompleted = today;
      this.data.dailyChallengesCompleted++;
      this.save();
    }
  }

  getDailyChallengeBonus(): number {
    const streak = this.getDailyStreak();
    return 1 + Math.min(streak, 7) * 0.25;
  }

  getDailyStreak(): number {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (this.data.dailyChallengeCompleted === yesterdayStr) {
      return Math.floor((new Date().getTime() - new Date(this.data.dailyChallengeCompleted).getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  }

  // Get formatted stats
  getFormattedStats(): string {
    const hours = Math.floor(this.data.totalPlayTime / 3600);
    const mins = Math.floor((this.data.totalPlayTime % 3600) / 60);
    return `High Score: ${this.data.highScore.toLocaleString()} | Bugs: ${this.data.totalBugsSmashed.toLocaleString()} | Time: ${hours}h ${mins}m | Games: ${this.data.gamesPlayed}`;
  }

  // Reset all data
  resetData(): void {
    this.data = { ...DEFAULT_SAVE };
    this.save();
  }
}

// Singleton instance for easy import
export const saveManager = new SaveManager();