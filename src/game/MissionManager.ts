/**
 * MissionManager — Daily/weekly mission system for player engagement
 *
 * Generates 3 daily missions + 3 weekly missions with escalating difficulty.
 * Tracks progress during gameplay. Industry standard +25% DAU boost.
 *
 * Storage: localStorage (key: bugsmasher_missions)
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
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

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

function getTodayString(): string {
  return now().toISOString().slice(0, 10);
}

function getWeekId(): string {
  const d = now();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / ONE_DAY_MS + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
}

let _nowOverride: (() => Date) | null = null;
function now(): Date {
  return _nowOverride ? _nowOverride() : new Date();
}

export const __test = {
  setNow(fn: (() => Date) | null): void {
    _nowOverride = fn;
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

export class MissionManager {
  static getState(): MissionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = this.generateNewState();
        this.saveState(fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw) as MissionState;
      const today = getTodayString();
      if (parsed.date !== today) {
        const fresh = this.generateNewState();
        this.saveState(fresh);
        return fresh;
      }
      return parsed;
    } catch {
      const fresh = this.generateNewState();
      this.saveState(fresh);
      return fresh;
    }
  }

  private static generateNewState(): MissionState {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endOfWeek = now + ONE_WEEK_MS;

    return {
      date: getTodayString(),
      weekId: getWeekId(),
      daily: [
        generateMission('easy', endOfDay.getTime()),
        generateMission('medium', endOfDay.getTime()),
        generateMission('hard', endOfDay.getTime()),
      ],
      weekly: [
        generateMission('medium', endOfWeek),
        generateMission('hard', endOfWeek),
        generateMission('hard', endOfWeek),
      ],
    };
  }

  private static saveState(state: MissionState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  static getDaily(): Mission[] {
    return this.getState().daily;
  }

  static getWeekly(): Mission[] {
    return this.getState().weekly;
  }

  static updateProgress(type: MissionType, amount: number = 1): Mission[] {
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

    this.saveState(newState);
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

    this.saveState(newState);
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
    localStorage.removeItem(STORAGE_KEY);
  }
}
