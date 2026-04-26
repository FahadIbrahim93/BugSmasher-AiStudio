// SocialChallenges - Weekly community challenges for social engagement and streaming

export interface SocialChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  participants: number;
  reward: string;
  starts: string;
  ends: string;
}

export interface SocialChallengeTemplate {
  type: 'score' | 'kills' | 'waves' | 'combo' | 'streak';
  target: number;
  name: string;
  description: string;
  reward: string;
}

const ACTIVE_TEMPLATES: SocialChallengeTemplate[] = [
  { type: 'score', target: 10000, name: 'Point Master', description: 'Highest score this week', reward: 'Point Master badge' },
  { type: 'kills', target: 500, name: 'Exterminator', description: 'Most bugs smashed', reward: 'Exterminator badge' },
  { type: 'waves', target: 10, name: 'Wave Champion', description: 'Reach the highest wave', reward: 'Wave Champion badge' },
  { type: 'combo', target: 50, name: 'Combo King', description: 'Highest combo chain', reward: 'Combo King badge' },
  { type: 'streak', target: 7, name: 'Dedicated', description: '7-day streak', reward: 'Dedicated badge' },
];

export class SocialChallengeManager {
  private activeChallenges: SocialChallenge[] = [];
  private weekStart: string;

  constructor() {
    const now = new Date();
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - weekDate.getDay());
    this.weekStart = weekDate.toISOString().split('T')[0];
    this.generateWeeklyChallenges();
  }

  private generateWeeklyChallenges(): void {
    const weekEnd = new Date(this.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const endStr = weekEnd.toISOString().split('T')[0];

    this.activeChallenges = ACTIVE_TEMPLATES.map((template, idx) => ({
      id: `challenge_${idx}_${this.weekStart}`,
      name: template.name,
      description: template.description,
      target: template.target,
      progress: Math.floor(Math.random() * 5000 + 1000),
      participants: Math.floor(Math.random() * 100 + 10),
      reward: template.reward,
      starts: this.weekStart,
      ends: endStr,
    }));
  }

  getActiveChallenges(): SocialChallenge[] {
    return this.activeChallenges;
  }

  getChallengeById(id: string): SocialChallenge | undefined {
    return this.activeChallenges.find(c => c.id === id);
  }

  submitScore(challengeType: string, value: number): { rank: number; completed: boolean } {
    const challenge = this.activeChallenges.find(c => c.name.toLowerCase().includes(challengeType));
    if (!challenge) return { rank: -1, completed: false };

    let rank = 1;
    for (const c of this.activeChallenges) {
      if (c.progress > challenge.progress) rank++;
    }

    challenge.progress = Math.max(challenge.progress, value);
    const completed = challenge.progress >= challenge.target;

    return { rank, completed };
  }

  getLeaderboard(challengeId: string): { name: string; score: number; isLocal: boolean }[] {
    const challenge = this.activeChallenges.find(c => c.id === challengeId);
    if (!challenge) return [];

    return [
      { name: 'ProGamer42', score: challenge.target, isLocal: false },
      { name: 'BugSlayer', score: Math.floor(challenge.target * 0.8), isLocal: false },
      { name: 'CoreDefender', score: Math.floor(challenge.target * 0.6), isLocal: false },
      { name: 'WaveRider', score: Math.floor(challenge.target * 0.4), isLocal: false },
      { name: 'NeonHunter', score: Math.floor(challenge.target * 0.2), isLocal: false },
    ];
  }

  getTimeRemaining(): string {
    const now = new Date();
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 7);
    const diff = end.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  }
}

export const socialChallengeManager = new SocialChallengeManager();