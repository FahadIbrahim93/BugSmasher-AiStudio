import { auth } from '../lib/firebase';

export interface HighScoreEntry {
  id: string;
  score: number;
  wave: number;
  timestamp: number;
  playerName: string;
}

export class HighScoreManager {
  private static LOCAL_HIGH_SCORES_KEY = 'bugsmasher_local_high_scores_top5';

  /**
   * Retrieves the top 5 high scores from LocalStorage, sorted by score desc, then wave desc, then timestamp desc.
   */
  static getTopScores(): HighScoreEntry[] {
    try {
      const dataStr = localStorage.getItem(this.LOCAL_HIGH_SCORES_KEY);
      if (!dataStr) return [];
      
      const parsed = JSON.parse(dataStr) as HighScoreEntry[];
      if (!Array.isArray(parsed)) return [];
      
      return parsed.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.wave !== a.wave) return b.wave - a.wave;
        return b.timestamp - a.timestamp;
      });
    } catch (e) {
      console.error('Failed to parse local high scores', e);
      return [];
    }
  }

  /**
   * Submits a score. If it qualifies for the top 5, inserts it and persists.
   * Returns true if it successfully made it into the top 5.
   */
  static submitScore(score: number, wave: number, customName?: string): boolean {
    if (score <= 0) return false;

    const scores = this.getTopScores();
    
    // Resolve player name
    let resolvedName = customName || 'GUEST';
    if (!customName) {
      try {
        if (auth && auth.currentUser) {
          resolvedName = auth.currentUser.displayName || 'ANONYMOUS';
        }
      } catch (err) {
        console.warn('Firebase Auth is not fully ready or configured. Slipped back to offline defaults.', err);
      }
    }

    const newEntry: HighScoreEntry = {
      id: Math.random().toString(36).substring(2, 9),
      score,
      wave,
      timestamp: Date.now(),
      playerName: resolvedName.toUpperCase()
    };

    scores.push(newEntry);
    
    // Sort
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.wave !== a.wave) return b.wave - a.wave;
      return b.timestamp - a.timestamp;
    });

    // Take top 5
    const top5 = scores.slice(0, 5);
    localStorage.setItem(this.LOCAL_HIGH_SCORES_KEY, JSON.stringify(top5));

    // Check if the newly added entry is inside the top 5
    return top5.some(entry => entry.id === newEntry.id);
  }

  /**
   * Clears the local high scores.
   */
  static clearScores(): void {
    localStorage.removeItem(this.LOCAL_HIGH_SCORES_KEY);
  }
}
