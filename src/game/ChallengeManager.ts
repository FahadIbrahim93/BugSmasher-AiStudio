// DailyChallenge - Enhanced with weekly challenges for retention

export interface DailyChallenge {
  id: string;
  type: 'score' | 'kills' | 'waves' | 'no_misses' | 'time' | 'biome';
  target: number;
  description: string;
  points: number;
  category: 'daily' | 'weekly';
}

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  completed: boolean;
}

const DAILY_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  { type: 'score', target: 1000, description: 'Score 1,000 points', points: 50, category: 'daily' },
  { type: 'score', target: 2500, description: 'Score 2,500 points', points: 100, category: 'daily' },
  { type: 'score', target: 5000, description: 'Score 5,000 points', points: 200, category: 'daily' },
  { type: 'kills', target: 25, description: 'Smash 25 bugs', points: 75, category: 'daily' },
  { type: 'kills', target: 50, description: 'Smash 50 bugs', points: 150, category: 'daily' },
  { type: 'kills', target: 100, description: 'Smash 100 bugs', points: 250, category: 'daily' },
  { type: 'waves', target: 3, description: 'Reach Wave 3', points: 100, category: 'daily' },
  { type: 'waves', target: 5, description: 'Reach Wave 5', points: 200, category: 'daily' },
  { type: 'no_misses', target: 1, description: 'Perfect wave (no misses)', points: 150, category: 'daily' },
  { type: 'time', target: 120, description: 'Play for 2 minutes', points: 100, category: 'daily' },
];

const WEEKLY_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  { type: 'score', target: 25000, description: 'Score 25,000 this week', points: 500, category: 'weekly' },
  { type: 'score', target: 50000, description: 'Score 50,000 this week', points: 1000, category: 'weekly' },
  { type: 'kills', target: 500, description: 'Smash 500 bugs this week', points: 750, category: 'weekly' },
  { type: 'kills', target: 1000, description: 'Smash 1,000 bugs this week', points: 1500, category: 'weekly' },
  { type: 'waves', target: 15, description: 'Reach Wave 15 this week', points: 1000, category: 'weekly' },
  { type: 'biome', target: 3, description: 'Play 3 different biomes', points: 500, category: 'weekly' },
  { type: 'no_misses', target: 5, description: 'Complete 5 perfect waves', points: 750, category: 'weekly' },
];

const CHALLENGE_KEY = 'bugsmasher_challenges';

export class ChallengeManager {
  private today: string;
  private weekStart: string;
  private dailyChallenge: DailyChallenge | null = null;
  private weeklyChallenge: DailyChallenge | null = null;
  private progress: Map<string, ChallengeProgress> = new Map();

  constructor() {
    this.today = new Date().toISOString().split('T')[0];
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - weekDate.getDay());
    this.weekStart = weekDate.toISOString().split('T')[0];
    this.load();
    this.generateChallenges();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(CHALLENGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date !== this.today) {
          this.progress.clear();
        } else {
          this.progress = new Map(Object.entries(data.progress || {}));
        }
      }
    } catch (e) {
      console.warn('Failed to load challenge progress:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(CHALLENGE_KEY, JSON.stringify({
        date: this.today,
        progress: Object.fromEntries(this.progress),
      }));
    } catch (e) {
      console.warn('Failed to save challenge progress:', e);
    }
  }

  private generateChallenges(): void {
    const dailySeed = this.hashCode(this.today);
    const dailyIndex = Math.abs(dailySeed) % DAILY_TEMPLATES.length;
    this.dailyChallenge = {
      id: `daily_${this.today}`,
      ...DAILY_TEMPLATES[dailyIndex]
    };

    const weeklySeed = this.hashCode(this.weekStart);
    const weeklyIndex = Math.abs(weeklySeed) % WEEKLY_TEMPLATES.length;
    this.weeklyChallenge = {
      id: `weekly_${this.weekStart}`,
      ...WEEKLY_TEMPLATES[weeklyIndex]
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  getDailyChallenge(): DailyChallenge | null {
    return this.dailyChallenge;
  }

  getWeeklyChallenge(): DailyChallenge | null {
    return this.weeklyChallenge;
  }

  updateProgress(type: 'score' | 'kills' | 'waves' | 'no_misses' | 'time' | 'biome', value: number): void {
    if (!this.dailyChallenge || this.dailyChallenge.type === type) {
      const dailyKey = this.dailyChallenge?.id || 'daily';
      const dailyProg = this.progress.get(dailyKey) || { challengeId: dailyKey, current: 0, completed: false };
      dailyProg.current = Math.max(dailyProg.current, value);
      
      if (this.dailyChallenge && dailyProg.current >= this.dailyChallenge.target) {
        dailyProg.completed = true;
      }
      this.progress.set(dailyKey, dailyProg);
    }

    if (!this.weeklyChallenge || this.weeklyChallenge.type === type) {
      const weeklyKey = this.weeklyChallenge?.id || 'weekly';
      const weeklyProg = this.progress.get(weeklyKey) || { challengeId: weeklyKey, current: 0, completed: false };
      weeklyProg.current = Math.max(weeklyProg.current, value);
      
      if (this.weeklyChallenge && weeklyProg.current >= this.weeklyChallenge.target) {
        weeklyProg.completed = true;
      }
      this.progress.set(weeklyKey, weeklyProg);
    }

    this.save();
  }

  isCompleted(challengeId: string): boolean {
    return this.progress.get(challengeId)?.completed || false;
  }

  getProgress(challengeId: string): number {
    return this.progress.get(challengeId)?.current || 0;
  }

  getPointsEarned(): number {
    let points = 0;
    for (const [, prog] of this.progress) {
      if (prog.completed) {
        if (prog.challengeId.startsWith('daily')) {
          const challenge = DAILY_TEMPLATES.find(t => t.description.includes(prog.challengeId));
          points += challenge?.points || 0;
        } else {
          const challenge = WEEKLY_TEMPLATES.find(t => t.description.includes(prog.challengeId));
          points += challenge?.points || 0;
        }
      }
    }
    return points;
  }

  checkCompletion(challenge: DailyChallenge, score: number, kills: number, waves: number, misses: number, time: number): boolean {
    switch (challenge.type) {
      case 'score': return score >= challenge.target;
      case 'kills': return kills >= challenge.target;
      case 'waves': return waves >= challenge.target;
      case 'no_misses': return misses === 0 && waves >= challenge.target;
      case 'time': return time >= challenge.target;
      default: return false;
    }
  }
}

export const challengeManager = new ChallengeManager();