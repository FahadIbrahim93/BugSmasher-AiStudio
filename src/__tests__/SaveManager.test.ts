import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../game/SaveManager';

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
    expect(loaded).toEqual(data);
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
});
