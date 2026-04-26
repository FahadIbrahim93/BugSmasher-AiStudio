// CloudLeaderboard - Simulated global leaderboard for competition

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  wave: number;
  date: string;
  biome: string;
  isLocal?: boolean;
}

const MOCK_PLAYERS: LeaderboardEntry[] = [
  { rank: 1, name: 'XenoCide', score: 28500, wave: 18, date: '2026-04-26', biome: 'quantum_void' },
  { rank: 2, name: 'BugSlayer99', score: 24200, wave: 15, date: '2026-04-25', biome: 'neon_core' },
  { rank: 3, name: 'CoreDefender', score: 19800, wave: 12, date: '2026-04-25', biome: 'neon_core' },
  { rank: 4, name: 'CyberPest', score: 17500, wave: 11, date: '2026-04-24', biome: 'ember_depths' },
  { rank: 5, name: 'VoidWalker', score: 15200, wave: 10, date: '2026-04-24', biome: 'quantum_void' },
  { rank: 6, name: 'NeonHunter', score: 12800, wave: 9, date: '2026-04-23', biome: 'neon_core' },
  { rank: 7, name: 'SmashKing', score: 11500, wave: 8, date: '2026-04-23', biome: 'frostbyte' },
  { rank: 8, name: 'DataDrifter', score: 9200, wave: 7, date: '2026-04-22', biome: 'frostbyte' },
  { rank: 9, name: 'BitCrusher', score: 7500, wave: 6, date: '2026-04-22', biome: 'neon_core' },
  { rank: 10, name: 'ZeroCool', score: 6100, wave: 5, date: '2026-04-21', biome: 'neon_core' },
];

export class CloudLeaderboard {
  getGlobalLeaderboard(): LeaderboardEntry[] {
    return MOCK_PLAYERS;
  }

  getWithLocalPlayer(topLocal: number): LeaderboardEntry[] {
    const all = [...MOCK_PLAYERS];
    
    if (topLocal > 0) {
      let insertIndex = all.length;
      for (let i = 0; i < all.length; i++) {
        if (topLocal > all[i].score) {
          insertIndex = i;
          break;
        }
      }
      
      const yourRank = insertIndex + 1;
      const localEntry: LeaderboardEntry = {
        rank: yourRank,
        name: 'You',
        score: topLocal,
        wave: 1,
        date: '2026-04-26',
        biome: 'neon_core',
        isLocal: true,
      };
      
      all.splice(insertIndex, 0, localEntry);
      
      for (let i = insertIndex; i < all.length; i++) {
        all[i].rank = i + 1;
      }
    }
    
    return all.slice(0, 25);
  }

  submitScore(score: number, wave: number, name: string, biome: string): number {
    const all = [...MOCK_PLAYERS];
    let insertIndex = all.length;
    
    for (let i = 0; i < all.length; i++) {
      if (score > all[i].score) {
        insertIndex = i;
        break;
      }
    }
    
    return insertIndex + 1;
  }

  getPlayerCount(): number {
    return MOCK_PLAYERS.length + 1;
  }

  getTopScore(): number {
    return MOCK_PLAYERS[0]?.score || 0;
  }

  getPercentile(rank: number): string {
    const totalPlayers = this.getPlayerCount();
    const p = ((totalPlayers - rank + 1) / totalPlayers) * 100;
    if (p >= 99) return 'Top 1%';
    if (p >= 95) return 'Top 5%';
    if (p >= 90) return 'Top 10%';
    if (p >= 75) return 'Top 25%';
    if (p >= 50) return 'Top 50%';
    return 'Top 75%';
  }
}

export const cloudLeaderboard = new CloudLeaderboard();