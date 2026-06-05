import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginStreakManager, STREAK_REWARDS } from '../game/LoginStreakManager';

describe('LoginStreakManager', () => {
  let dateMock: Date = new Date('2026-06-05T10:00:00Z');
  const originalDate = global.Date;

  beforeEach(() => {
    localStorage.clear();
    dateMock = new Date('2026-06-05T10:00:00Z');
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  function advanceDay(days: number): void {
    dateMock = new Date(dateMock.getTime() + days * 24 * 60 * 60 * 1000);
  }

  it('starts with zero streak on first login', () => {
    const result = LoginStreakManager.checkIn();
    expect(result.isNewDay).toBe(true);
    expect(result.streak).toBe(1);
    expect(result.reward).toBeDefined();
    expect(result.reward?.crystals).toBe(50);
  });

  it('does not double-count same-day logins', () => {
    LoginStreakManager.checkIn();
    const second = LoginStreakManager.checkIn();
    expect(second.isNewDay).toBe(false);
    expect(second.streak).toBe(1);
  });

  it('exposes 7 reward tiers', () => {
    expect(STREAK_REWARDS).toHaveLength(7);
    expect(STREAK_REWARDS[0].crystals).toBe(50);
    expect(STREAK_REWARDS[6].crystals).toBe(500);
  });

  it('can be reset', () => {
    LoginStreakManager.checkIn();
    LoginStreakManager.reset();
    const state = LoginStreakManager.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.totalLogins).toBe(0);
  });

  it('returns next reward preview', () => {
    const next = LoginStreakManager.getNextReward(3);
    expect(next.day).toBe(4);
    expect(next.crystals).toBe(150);
  });

  it('tracks total logins', () => {
    LoginStreakManager.checkIn();
    const state = LoginStreakManager.getState();
    expect(state.totalLogins).toBe(1);
  });

  it('returns default state when storage is empty', () => {
    const state = LoginStreakManager.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.longestStreak).toBe(0);
  });

  it('handles corrupted storage gracefully', () => {
    localStorage.setItem('bugsmasher_login_streak', 'invalid-json');
    const state = LoginStreakManager.getState();
    expect(state.currentStreak).toBe(0);
  });
});
