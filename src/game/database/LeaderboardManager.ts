// Leaderboard - Global and friends leaderboards
// Local-first with Supabase sync ready

import type { LeaderboardEntry, FriendProfile } from './types';
import { authManager } from './AuthManager';

const LEADERBOARD_KEY = 'bugsmasher_leaderboard';
const FRIENDS_KEY = 'bugsmasher_friends';

interface LeaderboardData {
  entries: LeaderboardEntry[];
  lastUpdated: string;
}

// Mock players for global leaderboard
const MOCK_PLAYERS: Omit<LeaderboardEntry, 'rank'>[] = [
  { profile_id: 'cpu_1', username: 'NeonSlayer', avatar_id: 'legend', score: 125000, wave: 45, updated_at: '2026-04-26' },
  { profile_id: 'cpu_2', username: 'CyberHunter', avatar_id: 'assassin', score: 98500, wave: 38, updated_at: '2026-04-25' },
  { profile_id: 'cpu_3', username: 'QuantumBug', avatar_id: 'scout', score: 87200, wave: 35, updated_at: '2026-04-25' },
  { profile_id: 'cpu_4', username: 'VoidWalker', avatar_id: 'tank', score: 75800, wave: 32, updated_at: '2026-04-24' },
  { profile_id: 'cpu_5', username: 'DataBreaker', avatar_id: 'warrior', score: 65400, wave: 28, updated_at: '2026-04-24' },
  { profile_id: 'cpu_6', username: 'BugExterminator', avatar_id: 'default', score: 58200, wave: 25, updated_at: '2026-04-23' },
  { profile_id: 'cpu_7', username: 'SwarmDestroyer', avatar_id: 'scout', score: 52100, wave: 22, updated_at: '2026-04-23' },
  { profile_id: 'cpu_8', username: 'CoreGuardian', avatar_id: 'tank', score: 45600, wave: 20, updated_at: '2026-04-22' },
  { profile_id: 'cpu_9', username: 'DigitalNinja', avatar_id: 'assassin', score: 38900, wave: 18, updated_at: '2026-04-22' },
  { profile_id: 'cpu_10', username: 'PixelHunter', avatar_id: 'warrior', score: 32500, wave: 15, updated_at: '2026-04-21' },
];

export class LeaderboardManager {
  private data: LeaderboardData = { entries: [], lastUpdated: '' };

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }

  getGlobalLeaderboard(limit: number = 25): LeaderboardEntry[] {
    const entries = MOCK_PLAYERS.map((player, idx) => ({
      ...player,
      rank: idx + 1,
    }));

    // Add current player's score if authenticated
    const profile = authManager.getProfile();
    const stats = this.getMyStats();

    if (profile && stats) {
      const playerEntry: LeaderboardEntry = {
        rank: 0,
        profile_id: profile.id,
        username: profile.username,
        avatar_id: profile.avatar_id,
        score: stats.total_score,
        wave: stats.highest_wave,
        updated_at: new Date().toISOString(),
      };

      // Find insertion point
      let insertIndex = entries.findIndex(e => stats.total_score > e.score);
      if (insertIndex === -1) insertIndex = entries.length;

      entries.splice(insertIndex, 0, playerEntry);

      // Recalculate ranks
      entries.forEach((e, i) => e.rank = i + 1);
    }

    return entries.slice(0, limit);
  }

  private getMyStats(): { total_score: number; highest_wave: number } | null {
    try {
      const stored = localStorage.getItem('bugsmasher_stats');
      if (stored) {
        const stats = JSON.parse(stored);
        return {
          total_score: stats.total_score || 0,
          highest_wave: stats.highest_wave || 0,
        };
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  submitScore(score: number, wave: number): number {
    const profile = authManager.getProfile();
    if (!profile) return 0;

    const leaderboard = this.getGlobalLeaderboard(100);
    const myEntry = leaderboard.find(e => e.profile_id === profile.id);

    if (!myEntry) return 0;

    return myEntry.rank;
  }

  getMyRank(): number {
    const profile = authManager.getProfile();
    if (!profile) return 0;

    const leaderboard = this.getGlobalLeaderboard(100);
    const myEntry = leaderboard.find(e => e.profile_id === profile.id);

    return myEntry?.rank || 0;
  }

  getTopScore(): number {
    return MOCK_PLAYERS[0]?.score || 0;
  }

  getPercentile(rank: number): string {
    const totalPlayers = MOCK_PLAYERS.length + 1;
    const p = ((totalPlayers - rank + 1) / totalPlayers) * 100;

    if (p >= 99) return 'Top 1%';
    if (p >= 95) return 'Top 5%';
    if (p >= 90) return 'Top 10%';
    if (p >= 75) return 'Top 25%';
    if (p >= 50) return 'Top 50%';
    return 'Top 75%';
  }

  // Friends functionality
  getFriends(): FriendProfile[] {
    try {
      const stored = localStorage.getItem(FRIENDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load friends:', e);
    }
    return [];
  }

  addFriend(friendId: string): void {
    const friends = this.getFriends();
    // In production, this would call Supabase
    // For now, just mock it
    console.log('Friend request sent to:', friendId);
  }

  removeFriend(friendId: string): void {
    const friends = this.getFriends().filter(f => f.id !== friendId);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  }
}

export const leaderboardManager = new LeaderboardManager();