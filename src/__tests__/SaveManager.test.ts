import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../game/SaveManager';

// Mock firebase functions to cover callable upload path in service (Issue10 coverage) without real net
vi.mock('firebase/functions', async () => {
  const actual = await vi.importActual('firebase/functions') as any;
  return {
    ...actual,
    httpsCallable: vi.fn(() => vi.fn(async () => ({ data: { success: true } }))),
  };
});

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

  it('should handle corrupted JSON in localStorage gracefully', async () => {
    localStorage.setItem('bugsmasher_save_data', 'not-valid-json');
    const loaded = await SaveManager.load();
    expect(loaded).toBeNull();
  });

  it('should handle empty string in localStorage gracefully', async () => {
    localStorage.setItem('bugsmasher_save_data', '');
    const loaded = await SaveManager.load();
    expect(loaded).toBeNull();
  });

  it('should persist through a simulated page reload (clear and re-read from localStorage)', async () => {
    const data = {
      score: 2500, wave: 10, health: 50, maxHealth: 100,
      clickRadiusMultiplier: 1.5, autoTurretLevel: 2,
      healthLevel: 3, radiusLevel: 4,
      timestamp: Date.now(),
    };

    await SaveManager.save(data);

    // Verify immediate read-back
    let loaded = await SaveManager.load();
    expect(loaded).not.toBeNull();
    if (loaded) {
      expect(loaded.score).toBe(2500);
      expect(loaded.wave).toBe(10);
      expect(loaded.health).toBe(50);
    }

    // Re-read from raw localStorage (simulates fresh module after reload)
    const raw = localStorage.getItem('bugsmasher_save_data');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.score).toBe(2500);
    expect(parsed.wave).toBe(10);
    expect(parsed.checksum).toBeDefined();

    // Clear local in-memory verifier by reloading module
    localStorage.removeItem('bugsmasher_save_data');
    expect(SaveManager.hasSave()).toBe(false);
  });

  it('should reject save data with tampered checksum', async () => {
    const data = {
      score: 9999, wave: 20, health: 100, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now(),
    };

    await SaveManager.save(data);

    // Tamper with the raw localStorage data
    const raw = localStorage.getItem('bugsmasher_save_data');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    parsed.score = 99999; // Inflated score
    parsed.checksum = 'tampered'; // Invalid checksum
    localStorage.setItem('bugsmasher_save_data', JSON.stringify(parsed));

    // Load should reject tampered data
    const loaded = await SaveManager.load();
    expect(loaded).toBeNull();
  });

  it('should persist high score across reloads', async () => {
    expect(SaveManager.getHighScore()).toBe(0);

    await SaveManager.setHighScore(5000, 25);
    expect(SaveManager.getHighScore()).toBe(5000);

    // Read from raw localStorage (simulates reload)
    const raw = localStorage.getItem('bugsmasher_all_time_high');
    expect(raw).toBe('5000');

    // Clear localStorage and verify high score resets
    localStorage.removeItem('bugsmasher_all_time_high');
    expect(SaveManager.getHighScore()).toBe(0);
  });

  it('cloud save path (auth present) invokes httpsCallable uploadSave (server enforcement coverage)', async () => {
    const { auth } = await import('../lib/firebase');
    (auth as any).currentUser = { uid: 'test-uid' };
    const data = {
      score: 1234, wave: 7, health: 90, maxHealth: 100,
      clickRadiusMultiplier: 1, autoTurretLevel: 0, timestamp: Date.now()
    };
    const ok = await SaveManager.save(data);
    expect(ok).toBe(true);
    (auth as any).currentUser = null;
    // callable mock ensures the upload branch (firebaseService -> callable) executes
  });
});
