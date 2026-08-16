import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../game/SaveManager';
import { IndexedDBSaveSystem } from '../game/IndexedDBSaveSystem';

const firebaseMocks = vi.hoisted(() => ({
  currentUser: null as { uid: string; displayName: string } | null,
  submitScore: vi.fn(() => Promise.resolve(true)),
  startSession: vi.fn(() => Promise.resolve({ sessionId: 'test-session-123', expiresAt: Date.now() + 600_000 })),
  uploadSave: vi.fn(() => Promise.resolve(true)),
  downloadSave: vi.fn(() => Promise.resolve(null)),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => false,
    data: () => ({}),
  })),
}));

vi.mock('../lib/firebase', () => ({
  auth: {
    get currentUser() {
      return firebaseMocks.currentUser;
    },
  },
  db: {},
}));

vi.mock('../lib/firebaseService', () => ({
  FirebaseService: {
    submitScore: firebaseMocks.submitScore,
    startSession: firebaseMocks.startSession,
    uploadSave: firebaseMocks.uploadSave,
    downloadSave: firebaseMocks.downloadSave,
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...parts: string[]) => parts.join('/')),
  getDoc: firebaseMocks.getDoc,
}));

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    firebaseMocks.currentUser = null;
    IndexedDBSaveSystem.resetForTests();
  });

  it('should save and load game data', async () => {
    const data = {
      score: 1000,
      wave: 5,
      health: 80,
      maxHealth: 100,
      clickRadiusMultiplier: 1.2,
      autoTurretLevel: 1,
      timestamp: Date.now()
    };

    const success = await SaveManager.save(data);
    expect(success).toBe(true);

    const loaded = await SaveManager.load();
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.score).toBe(data.score);
      expect(loaded.wave).toBe(data.wave);
      expect(loaded.health).toBe(data.health);
      expect(loaded.maxHealth).toBe(data.maxHealth);
      expect(loaded.clickRadiusMultiplier).toBe(data.clickRadiusMultiplier);
      expect(loaded.autoTurretLevel).toBe(data.autoTurretLevel);
      expect(loaded).toHaveProperty('checksum');
    }
  });

  it('should handle high scores correctly', async () => {
    expect(SaveManager.getHighScore()).toBe(0);

    await SaveManager.setHighScore(500, 5);
    expect(SaveManager.getHighScore()).toBe(500);

    await SaveManager.setHighScore(300, 3);
    expect(SaveManager.getHighScore()).toBe(500);

    await SaveManager.setHighScore(1000, 10);
    expect(SaveManager.getHighScore()).toBe(1000);
  });

  it('should identify if a save exists', async () => {
    expect(SaveManager.hasSave()).toBe(false);

    await SaveManager.save({
        score: 0, wave: 1, health: 100, maxHealth: 100,
        clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: 0
    });

    expect(SaveManager.hasSave()).toBe(true);
  });

  it('notifies sync listeners when save status changes', async () => {
    const statuses: string[] = [];
    const unsubscribe = SaveManager.addSyncListener((status) => statuses.push(status));

    await SaveManager.save({
      score: 10,
      wave: 1,
      health: 100,
      maxHealth: 100,
      clickRadiusMultiplier: 1,
      autoTurretLevel: 0,
      timestamp: Date.now(),
    });

    unsubscribe();
    expect(statuses).toContain('syncing');
    expect(statuses).toContain('synced');
  });

  it('submits high scores through Firebase when authenticated', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    (firebaseMocks.getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ username: 'Operator' }),
    });

    await SaveManager.setHighScore(5000, 12);

    expect(SaveManager.getHighScore()).toBe(5000);
    expect(firebaseMocks.startSession).toHaveBeenCalledOnce();
    expect(firebaseMocks.submitScore).toHaveBeenCalledWith('user-1', 'Operator', 5000, 12, 'test-session-123');
  });

  it('does not submit a high score when the new score is not higher', async () => {
    await SaveManager.setHighScore(500, 5);
    expect(SaveManager.getHighScore()).toBe(500);

    await SaveManager.setHighScore(300, 3);
    expect(SaveManager.getHighScore()).toBe(500);
    expect(firebaseMocks.startSession).not.toHaveBeenCalled();
  });

  it('clears the save data', async () => {
    await SaveManager.save({
      score: 100, wave: 1, health: 100, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    });
    expect(SaveManager.hasSave()).toBe(true);

    SaveManager.clear();
    expect(SaveManager.hasSave()).toBe(false);
  });

  it('returns true when saving to a slot succeeds', async () => {
    const success = await SaveManager.saveToSlot('slot_test', {
      score: 100, wave: 1, health: 100, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    }, 'Test Slot');
    expect(success).toBe(true);
  });

  it('returns null when loading a non-existent slot', async () => {
    const loaded = await SaveManager.loadFromSlot('nonexistent-slot');
    expect(loaded).toBeNull();
  });

  it('returns null when loading a slot with an invalid checksum', async () => {
    await SaveManager.saveToSlot('slot_test', {
      score: 100, wave: 1, health: 100, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    }, 'Test Slot');
    const slotId = SaveManager.getActiveSlotId();
    expect(slotId).not.toBeNull();

    // loadFromSlot reads slot.data from IndexedDB (memoryStorage), so tamper
    // the slot stored there rather than the localStorage backup.
    // memoryStorage is private static — bracket access is required here.
    // eslint-disable-next-line @typescript-eslint/dot-notation -- deliberate private-member access in a tamper test
    const slot = IndexedDBSaveSystem['memoryStorage'][slotId!];
    slot.data.checksum = 'tampered-checksum';
    // eslint-disable-next-line @typescript-eslint/dot-notation -- deliberate private-member access in a tamper test
    IndexedDBSaveSystem['memoryStorage'][slotId!] = slot;

    const loaded = await SaveManager.loadFromSlot(slotId!);
    expect(loaded).toBeNull();
  });

  it('deletes a slot', async () => {
    await SaveManager.saveToSlot('slot_test', {
      score: 100, wave: 1, health: 100, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    }, 'Test Slot');
    const slotId = SaveManager.getActiveSlotId();
    expect(slotId).not.toBeNull();

    const deleted = await SaveManager.deleteSlot(slotId!);
    expect(deleted).toBe(true);
  });

  it('returns the high score from localStorage', () => {
    localStorage.setItem('bugsmasher_all_time_high', '9999');
    expect(SaveManager.getHighScore()).toBe(9999);
  });

  it('returns 0 for a missing high score', () => {
    localStorage.removeItem('bugsmasher_all_time_high');
    expect(SaveManager.getHighScore()).toBe(0);
  });

  it('syncs saves to the cloud when a user is signed in', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    const data = {
      score: 900, wave: 4, health: 70, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 1, timestamp: Date.now(),
    };

    const success = await SaveManager.save(data);

    expect(success).toBe(true);
    expect(firebaseMocks.uploadSave).toHaveBeenCalledWith('user-1', expect.anything());
  });

  it('still saves locally when cloud upload fails', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    (firebaseMocks.uploadSave as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    const data = {
      score: 900, wave: 4, health: 70, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 1, timestamp: Date.now(),
    };

    const success = await SaveManager.save(data);

    expect(success).toBe(true);
    expect(localStorage.getItem('bugsmasher_save_data')).not.toBeNull();
  });

  it('loads from the cloud when a user has a cloud save', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    (firebaseMocks.downloadSave as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      score: 777, wave: 8, health: 60, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 2, timestamp: Date.now(),
    });

    const loaded = await SaveManager.load();

    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.score).toBe(777);
    }
  });

  it('falls back to local storage when the cloud download fails', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    (firebaseMocks.downloadSave as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    localStorage.setItem('bugsmasher_save_data', JSON.stringify({
      score: 555, wave: 6, health: 90, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    }));

    const loaded = await SaveManager.load();

    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.score).toBe(555);
    }
  });

  it('skips cloud submission when no session token is available', async () => {
    firebaseMocks.currentUser = { uid: 'user-1', displayName: 'Operator' };
    (firebaseMocks.startSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await SaveManager.setHighScore(6000, 15);

    expect(SaveManager.getHighScore()).toBe(6000);
    expect(firebaseMocks.submitScore).not.toHaveBeenCalled();
  });

  it('persists the rage meter and fury cooldown in save data', async () => {
    const data = {
      score: 1000, wave: 5, health: 80, maxHealth: 100,
      clickRadiusMultiplier: 1.2, autoTurretLevel: 1, timestamp: Date.now(),
      weaponHeat: 64, furyCooldownTimer: 9,
    };
    const success = await SaveManager.save(data);
    expect(success).toBe(true);

    const loaded = await SaveManager.load();
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.weaponHeat).toBe(64);
      expect(loaded.furyCooldownTimer).toBe(9);
    }
  });
});