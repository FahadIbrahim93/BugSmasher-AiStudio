// StatsManager - Player statistics and achievements
// Tracks all game metrics and achievements

import type { UserStats, Achievement } from './types';
import { ACHIEVEMENTS_LIST } from './types';
import { authManager } from './AuthManager';

const STATS_KEY = 'bugsmasher_stats';

export class StatsManager {
  private stats: UserStats | null = null;
  private achievements: Achievement[] = [...ACHIEVEMENTS_LIST];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const statsData = localStorage.getItem(STATS_KEY);
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }

      const achievementsData = localStorage.getItem('bugsmasher_achievements');
      if (achievementsData) {
        const saved = JSON.parse(achievementsData);
        this.achievements = ACHIEVEMENTS_LIST.map(a => {
          const savedAch = saved.find((s: Achievement) => s.id === a.id);
          return savedAch || a;
        });
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }

  private save(): void {
    try {
      if (this.stats) {
        localStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
      }
      localStorage.setItem('bugsmasher_achievements', JSON.stringify(this.achievements));
      this.notify();
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStats(): UserStats | null {
    return this.stats;
  }

  initialize(): void {
    const user = authManager.getUser();
    if (!user) return;

    this.stats = {
      profile_id: user.id,
      total_playtime: 0,
      total_kills: 0,
      total_score: 0,
      highest_wave: 0,
      games_played: 0,
      bugs_smashed: 0,
      enemies_killed: 0,
      powerups_collected: 0,
      upgrades_purchased: 0,
      achievements_unlocked: [],
      current_streak: 0,
      longest_streak: 0,
      last_played_at: new Date().toISOString(),
    };

    this.save();
  }

  private ensureStats(): UserStats {
    if (!this.stats) {
      this.initialize();
    }
    return this.stats!;
  }

  recordGameEnd(score: number, wave: number, kills: number, playTimeSeconds: number): void {
    const stats = this.ensureStats();

    stats.games_played++;
    stats.total_score = Math.max(stats.total_score, score);
    stats.highest_wave = Math.max(stats.highest_wave, wave);
    stats.total_kills += kills;
    stats.bugs_smashed += kills;
    stats.enemies_killed += kills;
    stats.total_playtime += playTimeSeconds;
    stats.last_played_at = new Date().toISOString();

    this.updateStreak();
    this.checkAchievements(score, wave, kills);
    this.save();
  }

  recordKill(): void {
    const stats = this.ensureStats();
    stats.total_kills++;
    stats.bugs_smashed++;
  }

  recordPowerupCollected(): void {
    const stats = this.ensureStats();
    stats.powerups_collected++;
  }

  recordUpgradePurchased(): void {
    const stats = this.ensureStats();
    stats.upgrades_purchased++;
  }

  private updateStreak(): void {
    const stats = this.ensureStats();
    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = stats.last_played_at?.split('T')[0];

    if (lastPlayed === today) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastPlayed === yesterdayStr) {
      stats.current_streak++;
      stats.longest_streak = Math.max(stats.longest_streak, stats.current_streak);
    } else {
      stats.current_streak = 1;
    }
  }

  private checkAchievements(score: number, wave: number, kills: number): void {
    const stats = this.ensureStats();
    const { XP_PER_LEVEL } = require('./types');

    for (const achievement of this.achievements) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_blood':
          shouldUnlock = stats.bugs_smashed >= 1;
          break;
        case 'wave_3':
          shouldUnlock = wave >= 3;
          break;
        case 'wave_5':
          shouldUnlock = wave >= 5;
          break;
        case 'wave_10':
          shouldUnlock = wave >= 10;
          break;
        case 'score_1k':
          shouldUnlock = score >= 1000;
          break;
        case 'score_5k':
          shouldUnlock = score >= 5000;
          break;
        case 'score_10k':
          shouldUnlock = score >= 10000;
          break;
        case 'bugs_100':
          shouldUnlock = stats.bugs_smashed >= 100;
          break;
        case 'bugs_500':
          shouldUnlock = stats.bugs_smashed >= 500;
          break;
        case 'bugs_1000':
          shouldUnlock = stats.bugs_smashed >= 1000;
          break;
        case 'streak_3':
          shouldUnlock = stats.current_streak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = stats.current_streak >= 7;
          break;
        case 'survivor':
          shouldUnlock = wave >= 1;
          break;
      }

      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlocked_at = new Date().toISOString();
        authManager.addXP(achievement.xp_reward);
      }
    }
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.length;
  }

  getStreak(): number {
    return this.stats?.current_streak || 0;
  }

  getFormattedPlayTime(): string {
    if (!this.stats) return '0h 0m';
    const hours = Math.floor(this.stats.total_playtime / 3600);
    const mins = Math.floor((this.stats.total_playtime % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

export const statsManager = new StatsManager();