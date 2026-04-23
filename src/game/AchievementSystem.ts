// AchievementSystem — Tracks player milestones and unlocks achievements
// Stores in localStorage with SaveManager

export type AchievementId = 
  | 'first_blood'        // First bug smashed
  | 'combo_5'           // 5x combo
  | 'combo_10'          // 10x combo
  | 'combo_25'          // 25x combo
  | 'wave_3'           // Reach wave 3
  | 'wave_5'            // Reach wave 5
  | 'wave_10'           // Reach wave 10
  | 'score_1000'        // 1,000 points
  | 'score_5000'        // 5,000 points
  | 'score_10000'       // 10,000 points
  | 'bugs_100'          // 100 total bugs
  | 'bugs_500'         // 500 total bugs
  | 'bugs_1000'        // 1,000 total bugs
  | 'survivor'         // Survive a full wave
  | 'streak_3'         // 3 day streak
  | 'streak_7'         // 7 day streak
  | 'perfectionist'      // No misses in a game
  ;

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string; // ISO date
}

export interface AchievementProgress {
  totalKills: number;
  totalWaves: number;
  maxCombo: number;
  highScore: number;
  perfectGames: number;
  currentStreak: number;
  lastPlayedDate: string;
}

const ACHIEVEMENT_DATA: Record<AchievementId, Omit<Achievement, 'id' | 'unlocked' | 'unlockedAt'>> = {
  first_blood:        { title: 'First Blood',        description: 'Smash your first bug', icon: '🪲' },
  combo_5:           { title: 'Combo Hunter',      description: 'Reach 5x combo', icon: '🔥' },
  combo_10:          { title: 'Blazing Fast',      description: 'Reach 10x combo', icon: '⚡' },
  combo_25:          { title: 'Unstoppable',       description: 'Reach 25x combo', icon: '🌟' },
  wave_3:            { title: 'Wave Rider',       description: 'Survive wave 3', icon: '🌊' },
  wave_5:            { title: 'Veteran',         description: 'Survive wave 5', icon: '🎖️' },
  wave_10:           { title: 'Legend',          description: 'Survive wave 10', icon: '👑' },
  score_1000:        { title: 'Getting Started',   description: 'Score 1,000 points', icon: '📊' },
  score_5000:        { title: 'Score Master',   description: 'Score 5,000 points', icon: '💯' },
  score_10000:       { title: 'Elite',          description: 'Score 10,000 points', icon: '🏆' },
  bugs_100:          { title: 'Exterminator',    description: 'Smash 100 bugs', icon: '🔫' },
  bugs_500:         { title: 'Pest Control',   description: 'Smash 500 bugs', icon: '💥' },
  bugs_1000:        { title: 'Annihilator',     description: 'Smash 1,000 bugs', icon: '💣' },
  survivor:          { title: 'Survivor',        description: 'Complete a wave', icon: '🛡️' },
  streak_3:          { title: 'Dedicated',       description: '3 day streak', icon: '📅' },
  streak_7:          { title: 'Committed',      description: '7 day streak', icon: '💎' },
  perfectionist:       { title: 'Perfectionist',  description: 'No misses in a game', icon: '🎯' },
};

const STORAGE_KEY = 'bugsmasher_achievements';
const PROGRESS_KEY = 'bugsmasher_progress';

export class AchievementSystem {
  private achievements: Map<AchievementId, Achievement> = new Map();
  private progress: AchievementProgress;
  private onUnlock?: (achievement: Achievement) => void;

  constructor(onUnlock?: (achievement: Achievement) => void) {
    this.onUnlock = onUnlock;
    this.progress = this.loadProgress();
    this.achievements = this.loadAchievements();
    this.checkDailyStreak();
  }

  private loadProgress(): AchievementProgress {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load achievement progress:', e);
    }
    return {
      totalKills: 0,
      totalWaves: 0,
      maxCombo: 0,
      highScore: 0,
      perfectGames: 0,
      currentStreak: 0,
      lastPlayedDate: '',
    };
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save achievement progress:', e);
    }
  }

  private loadAchievements(): Map<AchievementId, Achievement> {
    const map = new Map<AchievementId, Achievement>();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: Achievement[] = JSON.parse(stored);
        data.forEach(a => map.set(a.id, a));
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }
    // Initialize missing achievements
    Object.keys(ACHIEVEMENT_DATA).forEach(id => {
      if (!map.has(id as AchievementId)) {
        const data = ACHIEVEMENT_DATA[id as AchievementId];
        map.set(id as AchievementId, {
          id: id as AchievementId,
          title: data.title,
          description: data.description,
          icon: data.icon,
          unlocked: false,
        });
      }
    });
    return map;
  }

  private saveAchievements(): void {
    try {
      const data = Array.from(this.achievements.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }

  private checkDailyStreak(): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (this.progress.lastPlayedDate === today) {
      // Already played today, do nothing
    } else if (this.progress.lastPlayedDate === yesterday) {
      // Continuing streak
      // Streak already tracked
    } else if (this.progress.lastPlayedDate !== '') {
      // Streak broken
      this.progress.currentStreak = 0;
    }
  }

  // Called when player kills a bug
  onKill(): void {
    this.progress.totalKills++;
    this.checkAchievements();
    this.saveProgress();
  }

  // Called when player completes a wave
  onWaveComplete(wave: number): void {
    this.progress.totalWaves++;
    if (wave >= 3) this.unlock('wave_3');
    if (wave >= 5) this.unlock('wave_5');
    if (wave >= 10) this.unlock('wave_10');
    this.unlock('survivor');
    this.saveProgress();
  }

  // Called when player reaches a combo
  onCombo(combo: number): void {
    if (combo > this.progress.maxCombo) {
      this.progress.maxCombo = combo;
    }
    if (combo >= 5) this.unlock('combo_5');
    if (combo >= 10) this.unlock('combo_10');
    if (combo >= 25) this.unlock('combo_25');
    this.saveProgress();
  }

  // Called on game over to record stats
  onGameEnd(score: number, misses: number): void {
    const today = new Date().toDateString();
    
    // Update streak
    if (this.progress.lastPlayedDate !== today) {
      this.progress.currentStreak++;
      this.progress.lastPlayedDate = today;
      
      if (this.progress.currentStreak >= 3) this.unlock('streak_3');
      if (this.progress.currentStreak >= 7) this.unlock('streak_7');
    }
    
    // Check score achievements
    if (score >= 1000) this.unlock('score_1000');
    if (score >= 5000) this.unlock('score_5000');
    if (score >= 10000) this.unlock('score_10000');
    if (score > this.progress.highScore) {
      this.progress.highScore = score;
    }
    
    // Check kill achievements
    if (this.progress.totalKills >= 1) this.unlock('first_blood');
    if (this.progress.totalKills >= 100) this.unlock('bugs_100');
    if (this.progress.totalKills >= 500) this.unlock('bugs_500');
    if (this.progress.totalKills >= 1000) this.unlock('bugs_1000');
    
    // Check perfect game (no misses)
    if (misses === 0 && score > 0) {
      this.progress.perfectGames++;
      this.unlock('perfectionist');
    }
    
    this.saveProgress();
    this.saveAchievements();
  }

  private unlock(id: AchievementId): boolean {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date().toISOString();
      this.onUnlock?.(achievement);
      this.saveAchievements();
      return true;
    }
    return false;
  }

  private checkAchievements(): void {
    // Check kill count achievements
    if (this.progress.totalKills >= 1) this.unlock('first_blood');
    if (this.progress.totalKills >= 100) this.unlock('bugs_100');
    if (this.progress.totalKills >= 500) this.unlock('bugs_500');
    if (this.progress.totalKills >= 1000) this.unlock('bugs_1000');
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getUnlockedCount(): number {
    return Array.from(this.achievements.values()).filter(a => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.size;
  }

  getProgress(): AchievementProgress {
    return { ...this.progress };
  }

  getStreak(): number {
    return this.progress.currentStreak;
  }

  isUnlocked(id: AchievementId): boolean {
    return this.achievements.get(id)?.unlocked ?? false;
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    this.achievements = this.loadAchievements();
    this.progress = {
      totalKills: 0,
      totalWaves: 0,
      maxCombo: 0,
      highScore: 0,
      perfectGames: 0,
      currentStreak: 0,
      lastPlayedDate: '',
    };
    this.saveProgress();
    this.saveAchievements();
  }
}

// Singleton instance
export const achievementSystem = new AchievementSystem();