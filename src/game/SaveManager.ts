import { FirebaseService } from '../lib/firebaseService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChecksumSystem } from '../lib/checksum';
import { IndexedDBSaveSystem, SaveSlot } from './IndexedDBSaveSystem';

import { UserStats, StatsManager } from './StatsManager';

export interface GameSaveData {
  score: number;
  wave: number;
  health: number;
  maxHealth: number;
  clickRadiusMultiplier: number;
  autoTurretLevel: number;
  healthLevel?: number;
  radiusLevel?: number;
  timestamp: number;
  stats?: UserStats;
  playedStoryBeats?: string[];
  checksum?: string;
  biome?: string;
}

export type SaveSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';
export type SaveSyncListener = (status: SaveSyncStatus) => void;

export class SaveManager {
  private static STORAGE_KEY = 'bugsmasher_save_data';
  private static HIGH_SCORE_KEY = 'bugsmasher_all_time_high';

  private static syncListeners: Set<SaveSyncListener> = new Set();
  private static currentStatus: SaveSyncStatus = 'idle';

  static addSyncListener(listener: SaveSyncListener) {
    this.syncListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private static notifySync(status: SaveSyncStatus) {
    this.currentStatus = status;
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error notifying save sync listener:', err);
      }
    });
  }

  static getActiveSlotId(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('bugsmasher_active_slot_id');
    } catch (e) {
      console.warn('localStorage is blocked or not available:', e);
      return null;
    }
  }

  static setActiveSlotId(slotId: string | null): void {
    try {
      if (typeof window === 'undefined') return;
      if (slotId) {
        localStorage.setItem('bugsmasher_active_slot_id', slotId);
      } else {
        localStorage.removeItem('bugsmasher_active_slot_id');
      }
    } catch (e) {
      console.warn('localStorage is blocked or not available:', e);
    }
  }

  static async listSlots(): Promise<SaveSlot[]> {
    return await IndexedDBSaveSystem.getAllSlots();
  }

  static async saveToSlot(slotId: string, data: GameSaveData, slotName: string): Promise<boolean> {
    this.notifySync('syncing');
    try {
      const stats = StatsManager.getStats();
      const rawData = { ...data, stats };
      // @ts-ignore
      delete rawData.checksum;

      const checksum = await ChecksumSystem.generate(rawData);
      const fullData = { ...rawData, checksum };

      const biome = data.biome || 'neon_core';

      // Save to IndexedDB
      const success = await IndexedDBSaveSystem.saveSlot({
        id: slotId,
        name: slotName,
        timestamp: Date.now(),
        data: fullData,
        biome
      });

      if (!success) {
        throw new Error('IndexedDB save failed');
      }

      // Sync active slot and storage backups
      this.setActiveSlotId(slotId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullData));
        }
      } catch (e) {
        console.warn('localStorage backup write failed:', e);
      }

      const user = auth.currentUser;
      if (user) {
        try {
          await FirebaseService.uploadSave(user.uid, fullData);
        } catch (uploadError) {
          console.warn('Cloud save sync failed during slot save', uploadError);
        }
      }

      this.notifySync('synced');
      setTimeout(() => this.notifySync('idle'), 3000);
      return true;
    } catch (e) {
      console.error(`Failed to save to slot ${slotId}`, e);
      this.notifySync('error');
      setTimeout(() => this.notifySync('idle'), 3000);
      return false;
    }
  }

  static async loadFromSlot(slotId: string): Promise<GameSaveData | null> {
    try {
      const slot = await IndexedDBSaveSystem.getSlot(slotId);
      if (!slot) return null;

      const parsed = slot.data;
      const { checksum, ...pureData } = parsed;

      if (checksum) {
        const isValid = await ChecksumSystem.verify(pureData, checksum);
        if (!isValid) {
          console.error(`Save validation failed for slot ${slotId}`);
          return null;
        }
      }

      if (parsed.stats) StatsManager.setStats(parsed.stats);

      // Set active slot
      this.setActiveSlotId(slotId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn('localStorage backup update failed:', e);
      }

      return parsed;
    } catch (e) {
      console.error(`Failed to load from slot ${slotId}`, e);
      return null;
    }
  }

  static async deleteSlot(slotId: string): Promise<boolean> {
    const success = await IndexedDBSaveSystem.deleteSlot(slotId);
    if (success && this.getActiveSlotId() === slotId) {
      this.setActiveSlotId(null);
    }
    return success;
  }

  static async save(data: GameSaveData): Promise<boolean> {
    this.notifySync('syncing');
    try {
      const stats = StatsManager.getStats();
      const rawData = { ...data, stats };
      // @ts-ignore
      delete rawData.checksum; // Ensure we don't hash the previous checksum

      const checksum = await ChecksumSystem.generate(rawData);
      const fullData = { ...rawData, checksum };

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullData));
        }
      } catch (e) {
        console.warn('localStorage write failed in save:', e);
      }
      
      // Also save to currently active slot in IndexedDB
      const activeSlotId = this.getActiveSlotId() || 'slot_default';
      const slotName = activeSlotId === 'slot_default' ? 'Quick Save' : `Save Slot ${activeSlotId.split('_')[1] || activeSlotId}`;
      const biome = data.biome || 'neon_core';
      await IndexedDBSaveSystem.saveSlot({
        id: activeSlotId,
        name: slotName,
        timestamp: Date.now(),
        data: fullData,
        biome
      });

      const user = auth.currentUser;
      if (user) {
        try {
          await FirebaseService.uploadSave(user.uid, fullData);
          this.notifySync('synced');
        } catch (uploadError) {
          console.warn('Could not sync save data to cloud, saved locally:', uploadError);
          this.notifySync('error');
        }
      } else {
        // No user logged in, but save is successful locally
        this.notifySync('synced');
      }
      
      // Auto return to idle after some delay
      setTimeout(() => this.notifySync('idle'), 3000);
      return true;
    } catch (e) {
      console.error('Failed to save game data', e);
      this.notifySync('error');
      setTimeout(() => this.notifySync('idle'), 3000);
      return false;
    }
  }

  static async load(): Promise<GameSaveData | null> {
    try {
      const activeSlotId = this.getActiveSlotId();
      if (activeSlotId) {
        const slotData = await this.loadFromSlot(activeSlotId);
        if (slotData) return slotData;
      }

      // Try Cloud Save first if logged in
      const user = auth.currentUser;
      let dataStr: string | null = null;
      let isCloud = false;

      if (user) {
        try {
          const cloudData = await FirebaseService.downloadSave(user.uid);
          if (cloudData) {
            dataStr = JSON.stringify(cloudData);
            isCloud = true;
          }
        } catch (cloudError) {
          console.warn('Could not download save from cloud, falling back to local storage:', cloudError);
        }
      }

      if (!dataStr) {
        try {
          if (typeof window !== 'undefined') {
            dataStr = localStorage.getItem(this.STORAGE_KEY);
          }
        } catch (e) {
          console.warn('localStorage read failed:', e);
        }
      }

      if (!dataStr) return null;
      
      const parsed = JSON.parse(dataStr) as GameSaveData;
      const { checksum, ...pureData } = parsed;

      if (checksum) {
        const isValid = await ChecksumSystem.verify(pureData, checksum);
        if (!isValid) {
          console.error('Save data integrity check failed! Potential tampering detected.');
          // On failure, we could either reject or proceed with a warning
          // For a game, rejection is safer to prevent leaderboard pollution
          return null;
        }
      } else {
        console.warn('Save data lacks a checksum. This might be an old save or tampered.');
      }

      if (parsed.stats) StatsManager.setStats(parsed.stats);
      
      // If we loaded from cloud and it was valid, sync local
      if (isCloud) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, dataStr);
          }
        } catch (e) {
          console.warn('localStorage write failed during cloud sync:', e);
        }
      }

      return parsed;
    } catch (e) {
      console.error('Failed to load game data', e);
      return null;
    }
  }

  static hasSave(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem(this.STORAGE_KEY) !== null || localStorage.getItem('bugsmasher_active_slot_id') !== null;
    } catch (e) {
      return false;
    }
  }

  static clear(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('bugsmasher_active_slot_id');
      }
    } catch (e) {
      console.warn('localStorage clear failed:', e);
    }
  }

  static getHighScore(): number {
    try {
      if (typeof window === 'undefined') return 0;
      const val = localStorage.getItem(this.HIGH_SCORE_KEY);
      return val ? parseInt(val) : 0;
    } catch (e) {
      return 0;
    }
  }

  static async setHighScore(score: number, wave: number): Promise<void> {
    const current = this.getHighScore();
    if (score > current) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
        }
      } catch (e) {
        console.warn('localStorage write failed for high score:', e);
      }
      
      const user = auth.currentUser;
      if (user) {
        try {
          // Get username from profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const username = userSnap.exists() ? userSnap.data().username : (user.displayName || 'Anonymous User');
          await FirebaseService.submitScore(user.uid, username, score, wave);
        } catch (fsError) {
          console.warn('Could not submit high score online. Stored locally.', fsError);
        }
      }
    }
  }
}
