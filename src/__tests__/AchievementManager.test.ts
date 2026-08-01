import { describe, it, expect, beforeEach, vi } from 'vitest';
// Type-only import — erased at compile time, does not re-execute the module,
// so it does not interfere with the vi.resetModules() pattern below.
import type { AchievementSession } from '../game/AchievementSession';

// NOTE: AchievementManager is intentionally NOT statically imported — the module
// caches `unlockedIds` in a static field, so each test dynamically re-imports it
// after vi.resetModules() + localStorage.clear() to start from a clean state.

describe('AchievementManager venting achievements', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  const session = (overrides: Partial<AchievementSession> = {}): AchievementSession => ({
    swarmerKills: 0,
    healerKills: 0,
    kills: 0,
    perfectSequence: false,
    furyTriggers: 0,
    slamsUsed: 0,
    gooSweeps: 0,
    ...overrides,
  });

  it('unlocks Venting 101 on the first FURY trigger', async () => {
    const { AchievementManager } = await import('../game/AchievementManager');
    AchievementManager.checkAchievements(session({ furyTriggers: 1 }));
    expect(AchievementManager.isUnlocked('first_fury')).toBe(true);
  });

  it('unlocks Fury Master after 5 FURY triggers', async () => {
    const { AchievementManager } = await import('../game/AchievementManager');
    AchievementManager.checkAchievements(session({ furyTriggers: 5 }));
    expect(AchievementManager.isUnlocked('fury_master')).toBe(true);
    expect(AchievementManager.isUnlocked('first_fury')).toBe(true);
  });

  it('does not unlock Fury Master below the threshold', async () => {
    const { AchievementManager } = await import('../game/AchievementManager');
    AchievementManager.checkAchievements(session({ furyTriggers: 4 }));
    expect(AchievementManager.isUnlocked('fury_master')).toBe(false);
  });

  it('unlocks Ground Slammer after 10 slams', async () => {
    const { AchievementManager } = await import('../game/AchievementManager');
    AchievementManager.checkAchievements(session({ slamsUsed: 10 }));
    expect(AchievementManager.isUnlocked('ground_slammer')).toBe(true);
  });

  it('unlocks Clean Sweep after recycling 25 goo chunks', async () => {
    const { AchievementManager } = await import('../game/AchievementManager');
    AchievementManager.checkAchievements(session({ gooSweeps: 25 }));
    expect(AchievementManager.isUnlocked('clean_sweep')).toBe(true);
  });

  it('new achievements are exposed in getAll()', async () => {
    const { AchievementManager, ACHIEVEMENTS_DATA } = await import('../game/AchievementManager');
    const ids = ACHIEVEMENTS_DATA.map((a) => a.id);
    expect(ids).toContain('first_fury');
    expect(ids).toContain('fury_master');
    expect(ids).toContain('ground_slammer');
    expect(ids).toContain('clean_sweep');
    expect(AchievementManager.getAll().length).toBeGreaterThanOrEqual(14);
  });

  // ---- Unlock event pipeline: the toast fires off 'achievement_unlocked' ----

  it('dispatches achievement_unlocked with flame detail on first FURY', async () => {
    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(session({ furyTriggers: 1 }));
      expect(listener).toHaveBeenCalledTimes(1);
      const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.id).toBe('first_fury');
      expect(detail.title).toBe('Venting 101');
      expect(detail.icon).toBe('flame');
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });

  it('dispatches achievement_unlocked with hammer detail on 10 slams', async () => {
    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(session({ slamsUsed: 10 }));
      expect(listener).toHaveBeenCalledTimes(1);
      const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.id).toBe('ground_slammer');
      expect(detail.icon).toBe('hammer');
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });

  it('dispatches achievement_unlocked with sparkles detail on 25 goo sweeps', async () => {
    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(session({ gooSweeps: 25 }));
      expect(listener).toHaveBeenCalledTimes(1);
      const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.id).toBe('clean_sweep');
      expect(detail.icon).toBe('sparkles');
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });

  it('fires two events when FURY Master also crosses the 5-trigger threshold', async () => {
    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(session({ furyTriggers: 5 }));
      expect(listener).toHaveBeenCalledTimes(2);
      const ids = listener.mock.calls.map((c) => (c[0] as CustomEvent).detail.id);
      expect(ids).toContain('first_fury');
      expect(ids).toContain('fury_master');
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });

  it('does not re-dispatch an already-unlocked achievement', async () => {
    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(session({ furyTriggers: 1 }));
      AchievementManager.checkAchievements(session({ furyTriggers: 3 }));
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });

  it('Game.tsx wiring contract: session built from engine counters unlocks all 4 venting achievements', async () => {
    // Mirrors the exact session construction in Game.tsx handleWaveComplete
    const engineLike = { furyTriggers: 5, slamsUsed: 10, gooSweeps: 25 };
    const sessionData: AchievementSession = {
      swarmerKills: 0,
      healerKills: 0,
      kills: 0,
      perfectSequence: false,
      furyTriggers: engineLike.furyTriggers || 0,
      slamsUsed: engineLike.slamsUsed || 0,
      gooSweeps: engineLike.gooSweeps || 0,
    };

    const listener = vi.fn((e: Event) => e);
    window.addEventListener('achievement_unlocked', listener);
    try {
      const { AchievementManager } = await import('../game/AchievementManager');
      AchievementManager.checkAchievements(sessionData);
      const ids = listener.mock.calls.map((c) => (c[0] as CustomEvent).detail.id);
      expect(ids).toContain('first_fury');
      expect(ids).toContain('fury_master');
      expect(ids).toContain('ground_slammer');
      expect(ids).toContain('clean_sweep');
    } finally {
      window.removeEventListener('achievement_unlocked', listener);
    }
  });
});
