import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DEFAULT_ACCESSIBILITY,
  DIFFICULTY_PRESETS,
  getColorblindCanvasStyle,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  subscribeAccessibility,
} from '../game/AccessibilitySettings';

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when storage empty', () => {
    expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY);
  });

  it('persists settings', () => {
    saveAccessibilitySettings({ ...DEFAULT_ACCESSIBILITY, difficulty: 'hard' });
    expect(loadAccessibilitySettings().difficulty).toBe('hard');
  });

  it('returns CSS filter for colorblind modes', () => {
    expect(getColorblindCanvasStyle('off')).toBeUndefined();
    expect(getColorblindCanvasStyle('protanopia')?.filter).toContain('hue-rotate');
  });

  it('has sane difficulty presets', () => {
    expect(DIFFICULTY_PRESETS.easy.enemySpeed).toBeLessThan(DIFFICULTY_PRESETS.hard.enemySpeed);
    expect(DIFFICULTY_PRESETS.hard.enemyHp).toBeGreaterThan(DIFFICULTY_PRESETS.easy.enemyHp);
  });

  it('returns defaults when stored JSON is corrupted', () => {
    localStorage.setItem('bugsmasher_accessibility', '{broken');
    expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY);
  });

  it('deep-clones defaults so callers cannot mutate them', () => {
    const a = loadAccessibilitySettings();
    a.difficulty = 'hard';
    expect(loadAccessibilitySettings().difficulty).toBe('normal');
  });

  it('returns undefined style for off mode and filter for all colorblind modes', () => {
    expect(getColorblindCanvasStyle('off')).toBeUndefined();
    expect(getColorblindCanvasStyle('protanopia')?.filter).toContain('sepia');
    expect(getColorblindCanvasStyle('deuteranopia')?.filter).toContain('sepia');
    expect(getColorblindCanvasStyle('tritanopia')?.filter).toContain('hue-rotate');
  });

  it('notifies subscribers of changes', () => {
    const listener = vi.fn();
    const unsub = subscribeAccessibility(listener);
    listener.mockClear();

    saveAccessibilitySettings({ ...DEFAULT_ACCESSIBILITY, reducedMotion: true });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMotion: true }),
    );
    unsub();
  });

  describe('SSR safety', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('loads defaults without a window', () => {
      vi.stubGlobal('window', undefined);
      expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY);
    });

    it('save is a no-op without a window', () => {
      vi.stubGlobal('window', undefined);
      expect(() => {
        saveAccessibilitySettings(DEFAULT_ACCESSIBILITY);
      }).not.toThrow();
    });

    it('subscribe calls listener once without a window', () => {
      vi.stubGlobal('window', undefined);
      const listener = vi.fn();
      const unsub = subscribeAccessibility(listener);
      expect(listener).toHaveBeenCalledWith(DEFAULT_ACCESSIBILITY);
      unsub();
    });
  });
});