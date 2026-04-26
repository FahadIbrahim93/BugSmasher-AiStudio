// CloudSave - Game state persistence
// Local-first with Supabase sync ready

import type { CloudSave, GameStateSnapshot } from './types';
import { authManager } from './AuthManager';

const CLOUD_SAVE_KEY = 'bugsmasher_cloud_save';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export class CloudSaveManager {
  private autoSaveTimer: number | null = null;
  private lastSave: string | null = null;

  getCurrentSave(): CloudSave | null {
    try {
      const data = localStorage.getItem(CLOUD_SAVE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load save:', e);
    }
    return null;
  }

  saveGame(state: GameStateSnapshot): void {
    const profile = authManager.getProfile();
    if (!profile) return;

    const save: CloudSave = {
      profile_id: profile.id,
      game_state: state,
      timestamp: new Date().toISOString(),
      version: '1.4.0',
    };

    try {
      localStorage.setItem(CLOUD_SAVE_KEY, JSON.stringify(save));
      this.lastSave = save.timestamp;

      // In production: sync to Supabase here
      // this.syncToSupabase(save);
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  }

  loadGame(): GameStateSnapshot | null {
    const save = this.getCurrentSave();
    return save?.game_state || null;
  }

  hasSave(): boolean {
    return !!this.getCurrentSave();
  }

  getLastSaveTime(): string | null {
    return this.lastSave;
  }

  deleteSave(): void {
    localStorage.removeItem(CLOUD_SAVE_KEY);
    this.lastSave = null;
  }

  startAutoSave(getState: () => GameStateSnapshot): void {
    if (this.autoSaveTimer) return;

    this.autoSaveTimer = window.setInterval(() => {
      if (authManager.isAuthenticated()) {
        this.saveGame(getState());
      }
    }, AUTO_SAVE_INTERVAL);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Supabase sync methods (implement when connected)
  // async syncToSupabase(save: CloudSave): Promise<void> { ... }
  // async loadFromSupabase(): Promise<CloudSave | null> { ... }
}

export const cloudSaveManager = new CloudSaveManager();