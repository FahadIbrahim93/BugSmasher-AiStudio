// DailyChallenge - Generates daily challenges for players to complete

export interface DailyChallenge {
  id: string;
  type: 'score' | 'kills' | 'waves' | 'nob misses' | 'time';
  target: number;
  description: string;
  points: number;
}

const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  { type: 'score', target: 1000, description: 'Score 1,000 points', points: 50 },
  { type: 'score', target: 2500, description: 'Score 2,500 points', points: 100 },
  { type: 'score', target: 5000, description: 'Score 5,000 points', points: 200 },
  { type: 'kills', target: 25, description: 'Smash 25 bugs', points: 75 },
  { type: 'kills', target: 50, description: 'Smash 50 bugs', points: 150 },
  { type: 'kills', target: 100, description: 'Smash 100 bugs', points: 250 },
  { type: 'waves', target: 3, description: 'Survive 3 waves', points: 100 },
  { type: 'waves', target: 5, description: 'Survive 5 waves', points: 200 },
  { type: 'waves', target: 10, description: 'Survive 10 waves', points: 400 },
  { type: 'nob misses', target: 1, description: 'Complete a wave with no misses', points: 150 },
  { type: 'nob misses', target: 2, description: 'Complete 2 waves with no misses', points: 300 },
  { type: 'time', target: 120, description: 'Play for 2 minutes', points: 100 },
  { type: 'time', target: 300, description: 'Play for 5 minutes', points: 200 },
];

export class DailyChallengeManager {
  private today: string;
  private cachedChallenge: DailyChallenge | null = null;

  constructor() {
    this.today = new Date().toISOString().split('T')[0];
  }

  getTodayChallenge(): DailyChallenge {
    if (this.cachedChallenge && this.cachedChallenge.id === this.today) {
      return this.cachedChallenge;
    }

    const seed = this.hashCode(this.today);
    const index = Math.abs(seed) % CHALLENGE_TEMPLATES.length;
    const template = CHALLENGE_TEMPLATES[index];

    this.cachedChallenge = {
      id: this.today,
      ...template
    };

    return this.cachedChallenge;
  }

  checkCompletion(challenge: DailyChallenge, score: number, kills: number, waves: number, missCount: number, playTime: number): boolean {
    switch (challenge.type) {
      case 'score':
        return score >= challenge.target;
      case 'kills':
        return kills >= challenge.target;
      case 'waves':
        return waves >= challenge.target;
      case 'nob misses':
        return missCount === 0;
      case 'time':
        return playTime >= challenge.target;
      default:
        return false;
    }
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
}

export const dailyChallengeManager = new DailyChallengeManager();