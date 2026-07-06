/**
 * MissionManager — Daily/weekly mission system for player engagement
 *
 * Generates 3 daily missions + 3 weekly missions with escalating difficulty.
 * Tracks progress during gameplay. Industry standard +25% DAU boost.
 *
 * Storage: localStorage (key: bugsmasher_missions)
 * Performance: localStorage writes are batched (debounced) to avoid thrashing
 * on rapid-fire events like bug kills.
 */

export type MissionType =
  | 'kill_bugs'
  | 'survive_waves'
  | 'collect_powerups'
  | 'reach_score'
  | 'combo_streak'
  | 'use_specific_powerup'
  | 'defeat_bosses'
  | 'play_sessions';

export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export interface Mission {
  id: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  target: number;
  current: number;
  reward: { crystals: number; xp: number };
  description: string;
  expiresAt: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface MissionState {
  date: string;
  weekId: string;
  daily: Mission[];
  weekly: Mission[];
}

const STORAGE_KEY = 'bugsmasher_missions';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FLUSH_DEBOUNCE_MS = 500;

const MISSION_TEMPLATES: Record<MissionType, { descriptions: string[]; icons: string; baseTargets: Record<MissionDifficulty, number> }> = {
  kill_bugs: {
    descriptions: ['Smash {target} bugs', 'Eliminate {target} enemies', 'Crush {target} bugs'],
    icons: '🪲',
    baseTargets: { easy: 50, medium: 150, hard: 500 },
  },
  survive_waves: {
    descriptions: ['Survive {target} waves', 'Reach wave {target}', 'Endure {target} waves'],
    icons: '🌊',
    baseTargets: { easy: 5, medium: 10, hard: 20 },
  },
  collect_powerups: {
    descriptions: ['Collect {target} powerups', 'Grab {target} power-ups', 'Acquire {target} powerups'],
    icons: '⚡',
    baseTargets: { easy: 5, medium: 15, hard: 30 },
  },
  reach_score: {
    descriptions: ['Score {target} points', 'Reach {target} points', 'Achieve {target} score'],
    icons: '🏆',
    baseTargets: { easy: 5000, medium: 25000, hard: 100000 },
  },
  combo_streak: {
    descriptions: ['Get a {target}x combo', 'Achieve {target} combo', 'Hit {target}x multiplier'],
    icons: '🔥',
    baseTargets: { easy: 10, medium: 25, hard: 50 },
  },
  use_specific_powerup: {
    descriptions: ['Use Nuke {target} times', 'Activate Shield {target} times', 'Trigger Freeze {target} times'],
    icons: '💥',
    baseTargets: { easy: 1, medium: 3, hard: 5 },
  },
  defeat_bosses: {
    descriptions: ['Defeat {target} bosses', 'Slay {target} bosses', 'Destroy {target} bosses'],
    icons: '👑',
    baseTargets: { easy: 1, medium: 3, hard: 7 },
  },
  play_sessions: {
    descriptions: ['Play {target} games today', 'Complete {target} sessions'],
    icons: '🎮',
    baseTargets: { easy: 2, medium: 4, hard: 7 },
  },
};

const REWARDS: Record<MissionDifficulty, { crystals: number; xp: number }> = {
  easy: { crystals: 50, xp: 100 },
  medium: { crystals: 150, xp: 300 },
  hard: { crystals: 400, xp: 800 },
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getTodayString(): string {
  const d = now();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * ISO 8601 week number. Week 1 is the week containing Jan 4. Weeks start Monday.
 * Returns format like "2026-W23".
 */
function getWeekId(): string {
  const d = now();
  // Copy date to avoid mutating
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Shift to Thursday of current week: ISO uses Thursday to determine the week
  const dayNum = target.getDay() || 7; // Mon=1, Sun=7
  target.setDate(target.getDate() + 4 - dayNum);
  const yearStart = new Date(target.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / ONE_DAY_MS + 1) / 7);
  return `${target.getFullYear()}-W${pad2(weekNum)}`;
}

function getEndOfDay(): number {
  const d = now();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * End of the current ISO week (Sunday 23:59:59.999 local time).
 */
function getEndOfWeek(): number {
  const d = now();
  const dayNum = d.getDay() || 7; // Mon=1, Sun=7
  const daysUntilSunday = 7 - dayNum;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

let _nowOverride: (() => Date) | null = null;
function now(): Date {
  return _nowOverride ? _nowOverride() : new Date();
}

export const __test = {
  setNow(fn: (() => Date) | null): void {
    _nowOverride = fn;
  },
  resetFlushTimer(): void {
    if (pendingFlush) {
      clearTimeout(pendingFlush);
      pendingFlush = null;
    }
  },
  resetCache(): void {
    flushSync();
    cachedState = null;
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMission(difficulty: MissionDifficulty, expiresAt: number): Mission {
  const types: MissionType[] = ['kill_bugs', 'survive_waves', 'collect_powerups', 'reach_score', 'combo_streak', 'defeat_bosses'];
  const type = pickRandom(types);
  const template = MISSION_TEMPLATES[type];
  const target = template.baseTargets[difficulty];
  const description = pickRandom(template.descriptions).replace('{target}', target.toString());
  const reward = REWARDS[difficulty];

  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    difficulty,
    target,
    current: 0,
    reward: { crystals: reward.crystals, xp: reward.xp },
    description,
    expiresAt,
    completed: false,
    claimed: false,
    icon: template.icons,
  };
}

// --- Batched localStorage writes with in-memory cache ---
let cachedState: MissionState | null = null;
let pendingFlush: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (pendingFlush) return;
  pendingFlush = setTimeout(() => {
    if (cachedState) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
      } catch (e) {
        console.warn('MissionManager: failed to persist state', e);
      }
    }
    pendingFlush = null;
  }, FLUSH_DEBOUNCE_MS);
}

function flushSync(): void {
  if (pendingFlush) {
    clearTimeout(pendingFlush);
    pendingFlush = null;
  }
  if (cachedState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
    } catch {
      // ignore
    }
  }
}

function readFromStorage(): MissionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MissionState;
  } catch {
    return null;
  }
}

function writeToStorage(state: MissionState): void {
  cachedState = state;
  scheduleFlush();
}

export class MissionManager {
  static getState(): MissionState {
    // Pending in-memory write takes priority (avoids stale localStorage reads)
    if (cachedState) return cachedState;
    const stored = readFromStorage();
    if (stored) {
      cachedState = stored;
      return stored;
    }
    const fresh = this.generateNewState();
    cachedState = fresh;
    flushSync();
    return fresh;
  }

  /**
   * Call this on app start / date boundary to regenerate missions if the
   * stored state is from a previous day. Explicit, not implicit in getState.
   */
  static refreshIfNewDay(): void {
    const today = getTodayString();
    if (cachedState && cachedState.date !== today) {
      const fresh = this.generateNewState();
      cachedState = fresh;
      flushSync();
      return;
    }
    const stored = readFromStorage();
    if (stored && stored.date !== today) {
      const fresh = this.generateNewState();
      cachedState = fresh;
      flushSync();
    }
  }

  private static generateNewState(): MissionState {
    const today = getTodayString();
    const weekId = getWeekId();
    const endOfDay = getEndOfDay();
    const endOfWeek = getEndOfWeek();

    return {
      date: today,
      weekId,
      daily: [
        generateMission('easy', endOfDay),
        generateMission('medium', endOfDay),
        generateMission('hard', endOfDay),
      ],
      weekly: [
        generateMission('medium', endOfWeek),
        generateMission('hard', endOfWeek),
        generateMission('hard', endOfWeek),
      ],
    };
  }

  static getDaily(): Mission[] {
    this.refreshIfNewDay();
    return this.getState().daily;
  }

  static getWeekly(): Mission[] {
    this.refreshIfNewDay();
    return this.getState().weekly;
  }

  static updateProgress(type: MissionType, amount = 1): Mission[] {
    const state = this.getState();
    const completedMissions: Mission[] = [];

    const updateMission = (mission: Mission): Mission => {
      if (mission.completed || mission.type !== type) return mission;
      const newCurrent = Math.min(mission.target, mission.current + amount);
      const completed = newCurrent >= mission.target;
      if (completed) completedMissions.push(mission);
      return { ...mission, current: newCurrent, completed };
    };

    const newState: MissionState = {
      ...state,
      daily: state.daily.map(updateMission),
      weekly: state.weekly.map(updateMission),
    };

    writeToStorage(newState);
    return completedMissions;
  }

  static claimReward(missionId: string): { success: boolean; reward?: { crystals: number; xp: number } } {
    const state = this.getState();
    const allMissions = [...state.daily, ...state.weekly];
    const mission = allMissions.find(m => m.id === missionId);

    if (!mission || !mission.completed || mission.claimed) {
      return { success: false };
    }

    const updated = { ...mission, claimed: true };
    const newState: MissionState = {
      ...state,
      daily: state.daily.map(m => (m.id === missionId ? updated : m)),
      weekly: state.weekly.map(m => (m.id === missionId ? updated : m)),
    };

    writeToStorage(newState);
    flushSync();
    return { success: true, reward: mission.reward };
  }

  static getCompletionStats(): { dailyCompleted: number; dailyTotal: number; weeklyCompleted: number; weeklyTotal: number } {
    const state = this.getState();
    return {
      dailyCompleted: state.daily.filter(m => m.completed).length,
      dailyTotal: state.daily.length,
      weeklyCompleted: state.weekly.filter(m => m.completed).length,
      weeklyTotal: state.weekly.length,
    };
  }

  static reset(): void {
    flushSync();
    cachedState = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}
