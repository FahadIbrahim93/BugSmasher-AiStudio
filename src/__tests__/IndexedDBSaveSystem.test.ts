import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDBSaveSystem } from '../game/IndexedDBSaveSystem';
import { SaveManager } from '../game/SaveManager';

describe('IndexedDBSaveSystem', () => {
  beforeEach(async () => {
    localStorage.clear();
    // Re-initialize to clear memory state
    await IndexedDBSaveSystem.init();
  });

  it('should initialize and fallback correctly when IndexedDB is missing', async () => {
    const success = await IndexedDBSaveSystem.init();
    // In vitest environment with jsdom, indexedDB is often not supported, so fallback should engage
    expect(success).toBe(false);
  });

  it('should save, read, list, and delete custom save slots using the fallback system', async () => {
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
        timestamp: Date.now()
      }
    };

    // Save slot
    const saveSuccess = await IndexedDBSaveSystem.saveSlot(testSlot);
    expect(saveSuccess).toBe(true);

    // Load slot
    const loadedSlot = await IndexedDBSaveSystem.getSlot(slotId);
    expect(loadedSlot).not.toBeNull();
    expect(loadedSlot?.name).toBe('Alpha Sector Save');
    expect(loadedSlot?.biome).toBe('quantum_void');
    expect(loadedSlot?.data.score).toBe(500);

    // List slots
    const allSlots = await IndexedDBSaveSystem.getAllSlots();
    expect(allSlots.length).toBe(1);
    expect(allSlots[0].id).toBe(slotId);

    // Delete slot
    const deleteSuccess = await IndexedDBSaveSystem.deleteSlot(slotId);
    expect(deleteSuccess).toBe(true);

    // Get deleted slot
    const deletedSlot = await IndexedDBSaveSystem.getSlot(slotId);
    expect(deletedSlot).toBeNull();
  });
});

describe('SaveManager - Multi Slot integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should correctly store, activate, and read the active slot', async () => {
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
      biome: 'ember_depths'
    };

    const saveSuccess = await SaveManager.saveToSlot('slot_1', data, 'Neural Ember Core');
    expect(saveSuccess).toBe(true);
    expect(SaveManager.getActiveSlotId()).toBe('slot_1');

    const loaded = await SaveManager.loadFromSlot('slot_1');
    expect(loaded).not.toBeNull();
    expect(loaded?.score).toBe(15400);
    expect(loaded?.wave).toBe(14);
    expect(loaded?.biome).toBe('ember_depths');
  });
});
