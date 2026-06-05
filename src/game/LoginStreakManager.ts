/**
 * LoginStreakManager — Daily login streak tracking with escalating rewards
 *
 * Industry standard retention mechanic (+30% D7 retention).
 * Tracks consecutive daily logins, resets on missed day.
 * Rewards escalate: Day 1: 50, Day 2: 75, Day 3: 100, Day 5: 200, Day 7: 500
 *
 * Storage: localStorage (key: bugsmasher_login_streak)
 */

export interface LoginStreakState {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
  claimedRewards: number[];
}

export interface StreakReward {
  day: number;
  crystals: number;
  label: string;
  icon: string;
}

const STORAGE_KEY = 'bugsmasher_login_streak';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1, crystals: 50, label: 'Daily Bonus', icon: '💎' },
  { day: 2, crystals: 75, label: 'Day 2 Streak', icon: '⚡' },
  { day: 3, crystals: 100, label: '3-Day Streak', icon: '🔥' },
  { day: 4, crystals: 150, label: '4-Day Streak', icon: '✨' },
  { day: 5, crystals: 200, label: '5-Day Streak', icon: '🌟' },
  { day: 6, crystals: 300, label: '6-Day Streak', icon: '💫' },
  { day: 7, crystals: 500, label: 'Weekly Streak!', icon: '🏆' },
];

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.floor((d2 - d1) / ONE_DAY_MS);
}

export class LoginStreakManager {
  static getState(): LoginStreakState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefaultState();
      return JSON.parse(raw) as LoginStreakState;
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
      claimedRewards: [],
    };
  }

  private static saveState(state: LoginStreakState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  static checkIn(): {
    isNewDay: boolean;
    streak: number;
    reward: StreakReward | null;
    isMilestone: boolean;
  } {
    const state = this.getState();
    const today = getTodayString();

    if (state.lastLoginDate === today) {
      return { isNewDay: false, streak: state.currentStreak, reward: null, isMilestone: false };
    }

    let newStreak: number;
    if (!state.lastLoginDate) {
      newStreak = 1;
    } else {
      const daysSince = getDaysBetween(state.lastLoginDate, today);
      newStreak = daysSince === 1 ? state.currentStreak + 1 : 1;
    }

    const rewardIndex = (newStreak - 1) % STREAK_REWARDS.length;
    const reward = STREAK_REWARDS[rewardIndex];
    const isMilestone = newStreak % 7 === 0;

    const newState: LoginStreakState = {
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastLoginDate: today,
      totalLogins: state.totalLogins + 1,
      claimedRewards: [...state.claimedRewards, newStreak],
    };

    this.saveState(newState);
    return { isNewDay: true, streak: newStreak, reward, isMilestone };
  }

  static getNextReward(currentStreak: number): StreakReward {
    const nextDay = currentStreak + 1;
    return STREAK_REWARDS[(nextDay - 1) % STREAK_REWARDS.length];
  }

  static reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getTimeUntilExpiry(): number {
    const state = this.getState();
    if (!state.lastLoginDate) return ONE_DAY_MS;
    const lastLogin = new Date(state.lastLoginDate).getTime();
    const expiry = lastLogin + ONE_DAY_MS * 2;
    return Math.max(0, expiry - Date.now());
  }
}
