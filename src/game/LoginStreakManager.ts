/**
 * LoginStreakManager — Daily login streak tracking with escalating rewards
 *
 * Industry standard retention mechanic (+30% D7 retention).
 * Tracks consecutive daily logins, resets on missed day (with 1-day grace).
 * Rewards escalate: Day 1: 50, Day 2: 75, Day 3: 100, Day 5: 200, Day 7: 500
 *
 * Storage: localStorage (key: bugsmasher_login_streak)
 */

export interface LoginStreakState {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
  freezeTokens: number;
}

export interface StreakReward {
  day: number;
  crystals: number;
  label: string;
  icon: string;
}

const STORAGE_KEY = 'bugsmasher_login_streak';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FREEZE_TOKENS = 2;
const FREEZE_TOKEN_PER_MILESTONE = 1;
const MILESTONE_DAYS = 7;
const CLAIMED_HISTORY_LIMIT = 30;

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1, crystals: 50, label: 'Daily Bonus', icon: '💎' },
  { day: 2, crystals: 75, label: 'Day 2 Streak', icon: '⚡' },
  { day: 3, crystals: 100, label: '3-Day Streak', icon: '🔥' },
  { day: 4, crystals: 150, label: '4-Day Streak', icon: '✨' },
  { day: 5, crystals: 200, label: '5-Day Streak', icon: '🌟' },
  { day: 6, crystals: 300, label: '6-Day Streak', icon: '💫' },
  { day: 7, crystals: 500, label: 'Weekly Streak!', icon: '🏆' },
];

let _nowOverride: (() => Date) | null = null;
function now(): Date {
  return _nowOverride ? _nowOverride() : new Date();
}

export const __test = {
  setNow(fn: (() => Date) | null): void {
    _nowOverride = fn;
  },
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getTodayString(): string {
  const d = now();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00').getTime();
  const d2 = new Date(date2 + 'T00:00:00').getTime();
  return Math.round((d2 - d1) / ONE_DAY_MS);
}

function getRewardForDay(streakDay: number): StreakReward {
  const cycleDay = ((streakDay - 1) % STREAK_REWARDS.length) + 1;
  return STREAK_REWARDS[cycleDay - 1];
}

export class LoginStreakManager {
  static getState(): LoginStreakState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefaultState();
      const parsed = JSON.parse(raw) as LoginStreakState;
      return {
        currentStreak: parsed.currentStreak ?? 0,
        longestStreak: parsed.longestStreak ?? 0,
        lastLoginDate: parsed.lastLoginDate ?? '',
        totalLogins: parsed.totalLogins ?? 0,
        freezeTokens: parsed.freezeTokens ?? 0,
      };
    } catch {
      return this.getDefaultState();
    }
  }

  private static getDefaultState(): LoginStreakState {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: '',
      totalLogins: 0,
      freezeTokens: MAX_FREEZE_TOKENS,
    };
  }

  private static saveState(state: LoginStreakState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LoginStreakManager: failed to persist state', e);
    }
  }

  static checkIn(): {
    isNewDay: boolean;
    streak: number;
    reward: StreakReward | null;
    isMilestone: boolean;
    usedFreeze: boolean;
  } {
    const state = this.getState();
    const today = getTodayString();

    if (state.lastLoginDate === today) {
      return {
        isNewDay: false,
        streak: state.currentStreak,
        reward: null,
        isMilestone: false,
        usedFreeze: false,
      };
    }

    let newStreak: number;
    let usedFreeze = false;
    let freezeTokensAfter = state.freezeTokens;

    if (!state.lastLoginDate) {
      newStreak = 1;
    } else {
      const daysSince = getDaysBetween(state.lastLoginDate, today);
      if (daysSince === 1) {
        newStreak = state.currentStreak + 1;
      } else if (daysSince === 2 && state.freezeTokens > 0) {
        newStreak = state.currentStreak + 1;
        usedFreeze = true;
        freezeTokensAfter = state.freezeTokens - 1;
      } else {
        newStreak = 1;
      }
    }

    const reward = getRewardForDay(newStreak);
    const isMilestone = newStreak % MILESTONE_DAYS === 0;
    const newFreezeTokens = isMilestone
      ? Math.min(MAX_FREEZE_TOKENS, freezeTokensAfter + FREEZE_TOKEN_PER_MILESTONE)
      : freezeTokensAfter;

    const newState: LoginStreakState = {
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastLoginDate: today,
      totalLogins: state.totalLogins + 1,
      freezeTokens: newFreezeTokens,
    };

    this.saveState(newState);
    return { isNewDay: true, streak: newStreak, reward, isMilestone, usedFreeze };
  }

  static getNextReward(currentStreak: number): StreakReward {
    return getRewardForDay(currentStreak + 1);
  }

  static getTimeUntilStreakBreak(): number {
    const state = this.getState();
    if (!state.lastLoginDate) return ONE_DAY_MS;
    const lastLoginMidnight = new Date(state.lastLoginDate + 'T00:00:00').getTime();
    const expiry = getEndOfDay(new Date(lastLoginMidnight + ONE_DAY_MS)).getTime();
    return Math.max(0, expiry - now().getTime());
  }

  static getTimeUntilExpiry(): number {
    return this.getTimeUntilStreakBreak();
  }

  static reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Internal: cap claimedRewards history length (used by UI). Not stored long-term.
export const _internal = { CLAIMED_HISTORY_LIMIT, MILESTONE_DAYS, MAX_FREEZE_TOKENS };
