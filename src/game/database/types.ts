// Supabase-ready Database Schema Types
// These match PostgreSQL schema for seamless migration

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  avatar_id: string;
  is_guest: boolean;
  level: number;
  xp: number;
  crystals: number;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  profile_id: string;
  total_playtime: number;
  total_kills: number;
  total_score: number;
  highest_wave: number;
  games_played: number;
  bugs_smashed: number;
  enemies_killed: number;
  powerups_collected: number;
  upgrades_purchased: number;
  achievements_unlocked: string[];
  current_streak: number;
  longest_streak: number;
  last_played_at: string;
}

export interface UserSettings {
  profile_id: string;
  sound_volume: number;
  music_volume: number;
  graphics_quality: 'low' | 'medium' | 'high';
  haptics_enabled: boolean;
  show_damage_numbers: boolean;
  show_fps: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface CloudSave {
  profile_id: string;
  game_state: GameStateSnapshot;
  timestamp: string;
  version: string;
}

export interface GameStateSnapshot {
  score: number;
  wave: number;
  health: number;
  upgrades: {
    health: number;
    radius: number;
    turret: number;
  };
  unlocked_biomes: string[];
  equipped_cosmetics: {
    core: string;
    bug: string;
    trail: string;
    ui: string;
  };
  prestige_level: number;
  achievement_unlocks: string[];
  daily_challenge_date: string;
  daily_challenge_completed: boolean;
}

export interface FriendRecord {
  id: string;
  profile_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  avatar_id: string;
  level: number;
  last_seen: string;
  online: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  username: string;
  avatar_id: string;
  score: number;
  wave: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_blood', title: 'First Blood', description: 'Smash your first bug', icon: '🎯', xp_reward: 10, unlocked: false, unlocked_at: null },
  { id: 'combo_5', title: 'Combo Hunter', description: 'Reach 5x combo', icon: '🔥', xp_reward: 25, unlocked: false, unlocked_at: null },
  { id: 'combo_10', title: 'Blazing Fast', description: 'Reach 10x combo', icon: '⚡', xp_reward: 50, unlocked: false, unlocked_at: null },
  { id: 'wave_3', title: 'Wave Rider', description: 'Reach wave 3', icon: '🌊', xp_reward: 30, unlocked: false, unlocked_at: null },
  { id: 'wave_5', title: 'Veteran', description: 'Reach wave 5', icon: '🎖️', xp_reward: 75, unlocked: false, unlocked_at: null },
  { id: 'wave_10', title: 'Legend', description: 'Reach wave 10', icon: '👑', xp_reward: 150, unlocked: false, unlocked_at: null },
  { id: 'score_1k', title: 'Getting Started', description: 'Score 1,000 points', icon: '📊', xp_reward: 20, unlocked: false, unlocked_at: null },
  { id: 'score_5k', title: 'Score Master', description: 'Score 5,000 points', icon: '💯', xp_reward: 50, unlocked: false, unlocked_at: null },
  { id: 'score_10k', title: 'Elite', description: 'Score 10,000 points', icon: '🏆', xp_reward: 100, unlocked: false, unlocked_at: null },
  { id: 'bugs_100', title: 'Exterminator', description: 'Smash 100 bugs', icon: '🪲', xp_reward: 25, unlocked: false, unlocked_at: null },
  { id: 'bugs_500', title: 'Pest Control', description: 'Smash 500 bugs', icon: '💥', xp_reward: 75, unlocked: false, unlocked_at: null },
  { id: 'bugs_1000', title: 'Annihilator', description: 'Smash 1,000 bugs', icon: '💣', xp_reward: 150, unlocked: false, unlocked_at: null },
  { id: 'survivor', title: 'Survivor', description: 'Complete a wave', icon: '🛡️', xp_reward: 20, unlocked: false, unlocked_at: null },
  { id: 'streak_3', title: 'Dedicated', description: '3-day streak', icon: '🔥', xp_reward: 30, unlocked: false, unlocked_at: null },
  { id: 'streak_7', title: 'Committed', description: '7-day streak', icon: '⭐', xp_reward: 75, unlocked: false, unlocked_at: null },
  { id: 'perfectionist', title: 'Perfectionist', description: 'No misses in a wave', icon: '💎', xp_reward: 50, unlocked: false, unlocked_at: null },
];

export const AVATARS = [
  { id: 'default', name: 'Bug Hunter', rarity: 'common', color: '#00ffcc' },
  { id: 'warrior', name: 'Cyber Warrior', rarity: 'common', color: '#ff6b6b' },
  { id: 'scout', name: 'Neon Scout', rarity: 'uncommon', color: '#4ecdc4' },
  { id: 'tank', name: 'Heavy Tank', rarity: 'rare', color: '#ffd93d' },
  { id: 'assassin', name: 'Shadow', rarity: 'epic', color: '#a855f7' },
  { id: 'legend', name: 'Legend', rarity: 'legendary', color: '#fbbf24' },
];

export const CORES = [
  { id: 'core_default', name: 'Neon Core', rarity: 'common', color: '#00ffcc', glow: 'rgba(0, 255, 204, 0.5)' },
  { id: 'core_spark', name: 'Spark Core', rarity: 'common', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' },
  { id: 'core_quantum', name: 'Quantum Core', rarity: 'uncommon', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  { id: 'core_ember', name: 'Ember Core', rarity: 'rare', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  { id: 'core_frost', name: 'Frost Core', rarity: 'epic', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
  { id: 'core_golden', name: 'Golden Core', rarity: 'legendary', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)' },
];

export const XP_PER_LEVEL = 100;
export const LEVEL_BONUS_PER_LEVEL = 10;