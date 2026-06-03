import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_ACCESSIBILITY,
  DIFFICULTY_PRESETS,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
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

  it('has sane difficulty presets', () => {
    expect(DIFFICULTY_PRESETS.easy.enemySpeed).toBeLessThan(DIFFICULTY_PRESETS.hard.enemySpeed);
    expect(DIFFICULTY_PRESETS.hard.enemyHp).toBeGreaterThan(DIFFICULTY_PRESETS.easy.enemyHp);
  });
});