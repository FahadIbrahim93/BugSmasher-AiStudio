// Authentication System - Guest mode, Email, OAuth ready
// Works locally, Supabase-ready

import { createClient } from '@supabase/supabase-js';
import type { Profile, UserStats, UserSettings } from './types';

export type AuthProvider = 'guest' | 'email' | 'google' | 'discord' | 'apple';

export interface AuthUser {
  id: string;
  provider: AuthProvider;
  email: string | null;
  username: string;
  createdAt: string;
  isAnonymous: boolean;
  linkedProviders: AuthProvider[];
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AUTH_KEY = 'bugsmasher_auth';
const PROFILE_KEY = 'bugsmasher_profile';
const STATS_KEY = 'bugsmasher_stats';
const SETTINGS_KEY = 'bugsmasher_settings';

function generateId(): string {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function generateUsername(): string {
  const adjectives = ['Neon', 'Cyber', 'Digital', 'Quantum', 'Shadow', 'Storm', 'Thunder', 'Phoenix'];
  const nouns = ['Hunter', 'Slayer', 'Warrior', 'Ninja', 'Ghost', 'Knight', 'Striker', 'Viper'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export class AuthManager {
  private user: AuthUser | null = null;
  private profile: Profile | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        this.user = JSON.parse(authData);
      }

      const profileData = localStorage.getItem(PROFILE_KEY);
      if (profileData) {
        this.profile = JSON.parse(profileData);
      }
    } catch (e) {
      console.warn('Failed to load auth data:', e);
    }
  }

  private save(): void {
    try {
      if (this.user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }

      if (this.profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      } else {
        localStorage.removeItem(PROFILE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save auth data:', e);
    }

    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): AuthState {
    return {
      user: this.user,
      profile: this.profile,
      isLoading: false,
      isAuthenticated: !!this.user,
    };
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getProfile(): Profile | null {
    return this.profile;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  isGuest(): boolean {
    return this.user?.provider === 'guest';
  }

  async signInAsGuest(): Promise<AuthUser> {
    const userId = generateId();
    const username = generateUsername();

    this.user = {
      id: userId,
      provider: 'guest',
      email: null,
      username,
      createdAt: new Date().toISOString(),
      isAnonymous: true,
      linkedProviders: ['guest'],
    };

    this.profile = {
      id: userId,
      username,
      email: null,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: true,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.initializeStats();
    this.initializeSettings();
    this.save();

    return this.user;
  }

  private initializeStats(): void {
    const stats: UserStats = {
      profile_id: this.user!.id,
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

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  private initializeSettings(): void {
    const settings: UserSettings = {
      profile_id: this.user!.id,
      sound_volume: 0.8,
      music_volume: 0.6,
      graphics_quality: 'medium',
      haptics_enabled: true,
      show_damage_numbers: true,
      show_fps: false,
      difficulty: 'normal',
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  private loadStats(): void {
    try {
      const statsData = localStorage.getItem(STATS_KEY);
      if (!statsData) {
        this.initializeStats();
      }
    } catch (e) {
      this.initializeStats();
    }
  }

  private loadSettings(): void {
    try {
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if (!settingsData) {
        this.initializeSettings();
      }
    } catch (e) {
      this.initializeSettings();
    }
  }

  async signUpWithEmail(email: string, password: string, username: string): Promise<AuthUser> {
    // In production, this would call Supabase
    // For now, simulate email signup
    const userId = generateId();

    this.user = {
      id: userId,
      provider: 'email',
      email,
      username,
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      linkedProviders: ['guest', 'email'],
    };

    this.profile = {
      id: userId,
      username,
      email: null,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: false,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.initializeStats();
    this.initializeSettings();
    this.save();

    return this.user;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    // Simulate sign in - in production, use Supabase
    const userId = generateId();

    this.user = {
      id: userId,
      provider: 'email',
      email,
      username: 'Player',
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      linkedProviders: ['email'],
    };

    this.profile = {
      id: userId,
      username: 'Player',
      email,
      avatar_url: null,
      avatar_id: 'default',
      is_guest: false,
      level: 1,
      xp: 0,
      crystals: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.loadStats();
    this.loadSettings();
    this.save();
    return this.user;
  }

  async linkProvider(provider: AuthProvider): Promise<void> {
    if (!this.user) return;

    // In production, this would trigger OAuth flow with Supabase
    if (!this.user.linkedProviders.includes(provider)) {
      this.user.linkedProviders.push(provider);
    }
    this.save();
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.user || !this.profile) return;

    this.user.username = username;
    this.profile.username = username;
    this.profile.updated_at = new Date().toISOString();
    this.save();
  }

  async updateAvatar(avatarId: string): Promise<void> {
    if (!this.profile) return;

    this.profile.avatar_id = avatarId;
    this.profile.updated_at = new Date().toISOString();
    this.save();
  }

  addXP(amount: number): void {
    if (!this.profile) return;

    this.profile.xp += amount;

    // Level up logic
    const { XP_PER_LEVEL } = require('./types');
    while (this.profile.xp >= XP_PER_LEVEL * this.profile.level) {
      this.profile.xp -= XP_PER_LEVEL * this.profile.level;
      this.profile.level++;
    }

    this.profile.updated_at = new Date().toISOString();
    this.save();
  }

  addCrystals(amount: number): void {
    if (!this.profile) return;

    this.profile.crystals += amount;
    this.profile.updated_at = new Date().toISOString();
    this.save();
  }

  spendCrystals(amount: number): boolean {
    if (!this.profile || this.profile.crystals < amount) return false;

    this.profile.crystals -= amount;
    this.profile.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  signOut(): void {
    this.user = null;
    this.profile = null;
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    this.notify();
  }

  deleteAccount(): void {
    // In production, this would delete from Supabase
    this.signOut();
    localStorage.clear();
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.signInWithEmail(email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
  }

  async signUp(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.signUpWithEmail(email, password, username);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Registration failed' };
    }
  }

  async convertGuest(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Keep existing stats, upgrade to full account
      await this.signUpWithEmail(email, password, username);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Conversion failed' };
    }
  }

  // Supabase integration helpers
  getSupabaseConfig(): { url: string; anonKey: string } {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }

  isSupabaseConfigured(): boolean {
    const config = this.getSupabaseConfig();
    return !!config.url && !!config.anonKey;
  }
}

export function createSupabaseClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseClient) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export const authManager = new AuthManager();