// Leaderboard system using localStorage
// Stores top 10 scores with timestamps

interface LeaderboardEntry {
  score: number;
  waves: number;
  kills: number;
  date: string; // ISO timestamp
  name: string;
}

const LEADERBOARD_KEY = 'bugsmasher_leaderboard';
const MAX_ENTRIES = 10;

export class Leaderboard {
  private entries: LeaderboardEntry[];

  constructor() {
    this.entries = this.load();
  }

  private load(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
    }
    return [];
  }

  private save(): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }

  getEntries(): LeaderboardEntry[] {
    return [...this.entries];
  }

  addEntry(score: number, waves: number, kills: number, name: string = 'Player'): boolean {
    const entry: LeaderboardEntry = {
      score,
      waves,
      kills,
      date: new Date().toISOString(),
      name: name.substring(0, 12) // Limit name length
    };

    // Find position
    let position = this.entries.findIndex(e => score > e.score);
    if (position === -1) position = this.entries.length;

    // Only add if it makes top 10
    if (position < MAX_ENTRIES) {
      this.entries.splice(position, 0, entry);
      this.entries = this.entries.slice(0, MAX_ENTRIES);
      this.save();
      return true;
    }
    return false;
  }

  isHighScore(score: number): boolean {
    if (this.entries.length < MAX_ENTRIES) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  getRank(score: number): number {
    const position = this.entries.findIndex(e => score > e.score);
    return position === -1 ? this.entries.length + 1 : position + 1;
  }

  clear(): void {
    this.entries = [];
    this.save();
  }

  getFormattedDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Singleton export
export const leaderboard = new Leaderboard();
