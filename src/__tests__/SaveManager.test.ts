import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../game/SaveManager';

const firebaseMocks = vi.hoisted(() => ({
  currentUser: null as { uid: string; displayName: string } | null,
  submitScore: vi.fn(() => Promise.resolve(true)),
  startSession: vi.fn(() => Promise.resolve({ sessionId: 'test-session-123', expiresAt: Date.now() + 600_000 })),
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
      // Core game data fields should match
      expect(loaded.score).toBe(data.score);
      expect(loaded.wave).toBe(data.wave);
      expect(loaded.health).toBe(data.health);
      expect(loaded.maxHealth).toBe(data.maxHealth);
      expect(loaded.clickRadiusMultiplier).toBe(data.clickRadiusMultiplier);
      expect(loaded.autoTurretLevel).toBe(data.autoTurretLevel);
      // Checksum will be present (added by save system)
      expect(loaded).toHaveProperty('checksum');
    }
  });

  it('should handle high scores correctly', async () => {
    expect(SaveManager.getHighScore()).toBe(0);

    await SaveManager.setHighScore(500, 5);
    expect(SaveManager.getHighScore()).toBe(500);

    await SaveManager.setHighScore(300, 3); // Lower shouldn't overwrite
    expect(SaveManager.getHighScore()).toBe(500);

    await SaveManager.setHighScore(1000, 10); // Higher should overwrite
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
});
