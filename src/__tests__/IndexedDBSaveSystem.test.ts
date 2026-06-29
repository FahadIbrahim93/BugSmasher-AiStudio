import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDBSaveSystem } from '../game/IndexedDBSaveSystem';
import { SaveManager } from '../game/SaveManager';

describe('IndexedDBSaveSystem', () => {
  beforeEach(async () => {
    localStorage.clear();
    IndexedDBSaveSystem.resetForTests();
    await IndexedDBSaveSystem.init();
  });

  it('initializes real IndexedDB when available', async () => {
    const success = await IndexedDBSaveSystem.init();
    expect(success).toBe(true);
  });

  it('persists save slots through IndexedDB', async () => {
    const slotId = 'slot_test_1';
    const testSlot = {
      id: slotId,
      name: 'Alpha Sector Save',
      timestamp: Date.now(),
      biome: 'quantum_void',
      data: {
        score: 500,
        wave: 2,
        health: 100,
        maxHealth: 100,
        clickRadiusMultiplier: 1.0,
        autoTurretLevel: 0,
        timestamp: Date.now(),
      },
    };

    expect(await IndexedDBSaveSystem.saveSlot(testSlot)).toBe(true);

    const loadedSlot = await IndexedDBSaveSystem.getSlot(slotId);
    expect(loadedSlot?.name).toBe('Alpha Sector Save');
    expect(loadedSlot?.data.score).toBe(500);

    const allSlots = await IndexedDBSaveSystem.getAllSlots();
    expect(allSlots).toHaveLength(1);

    expect(await IndexedDBSaveSystem.deleteSlot(slotId)).toBe(true);
    expect(await IndexedDBSaveSystem.getSlot(slotId)).toBeNull();
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    IndexedDBSaveSystem.resetForTests();
    (IndexedDBSaveSystem as unknown as { useFallback: boolean }).useFallback = true;

    const slot = {
      id: 'fallback-slot',
      name: 'Fallback Save',
      timestamp: Date.now(),
      biome: 'neon_core',
      data: {
        score: 10,
        wave: 1,
        health: 100,
        maxHealth: 100,
        clickRadiusMultiplier: 1,
        autoTurretLevel: 0,
        timestamp: Date.now(),
      },
    };

    expect(await IndexedDBSaveSystem.saveSlot(slot)).toBe(true);
    expect(await IndexedDBSaveSystem.getSlot('fallback-slot')).toMatchObject({ id: 'fallback-slot' });
  });
});

describe('SaveManager - Multi Slot integration', () => {
  beforeEach(async () => {
    localStorage.clear();
    IndexedDBSaveSystem.resetForTests();
    await IndexedDBSaveSystem.init();
  });

  it('should correctly store, activate, and read the active slot', () => {
    expect(SaveManager.getActiveSlotId()).toBeNull();

    SaveManager.setActiveSlotId('slot_2');
    expect(SaveManager.getActiveSlotId()).toBe('slot_2');

    SaveManager.setActiveSlotId(null);
    expect(SaveManager.getActiveSlotId()).toBeNull();
  });

  it('should correctly save and load via structured saveToSlot & loadFromSlot', async () => {
    const data = {
      score: 15400,
      wave: 14,
      health: 60,
      maxHealth: 100,
      clickRadiusMultiplier: 1.3,
      autoTurretLevel: 2,
      timestamp: Date.now(),
      biome: 'ember_depths',
    };

    expect(await SaveManager.saveToSlot('slot_1', data, 'Neural Ember Core')).toBe(true);
    expect(SaveManager.getActiveSlotId()).toBe('slot_1');

    const loaded = await SaveManager.loadFromSlot('slot_1');
    expect(loaded?.score).toBe(15400);
    expect(loaded?.wave).toBe(14);
    expect(loaded?.biome).toBe('ember_depths');
  });
});
