import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighScoreManager } from '../game/HighScoreManager';

const authMocks = vi.hoisted(() => ({
  currentUser: null as { displayName: string } | null,
}));

// Mock auth from firebase to avoid initialization issues
vi.mock('../lib/firebase', () => ({
  auth: {
    get currentUser() {
      return authMocks.currentUser;
    },
  },
  db: {}
}));

describe('HighScoreManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return empty array when no scores are saved', () => {
    const scores = HighScoreManager.getTopScores();
    expect(scores).toEqual([]);
  });

  it('should submit a score and persist it', () => {
    const qualified = HighScoreManager.submitScore(100, 3, 'Alice');
    expect(qualified).toBe(true);

    const scores = HighScoreManager.getTopScores();
    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBe(100);
    expect(scores[0].wave).toBe(3);
    expect(scores[0].playerName).toBe('ALICE');
  });

  it('should cap scores at top 5 list and maintain sorted order', () => {
    HighScoreManager.submitScore(100, 2, 'P1');
    HighScoreManager.submitScore(500, 5, 'P2');
    HighScoreManager.submitScore(200, 3, 'P3');
    HighScoreManager.submitScore(400, 4, 'P4');
    HighScoreManager.submitScore(50, 1, 'P5');
    
    // This one should be inside, P5 should be booted out
    const qualified = HighScoreManager.submitScore(300, 3, 'P6');
    expect(qualified).toBe(true);

    const scores = HighScoreManager.getTopScores();
    expect(scores).toHaveLength(5);
    
    // Check order
    expect(scores[0].score).toBe(500); // P2
    expect(scores[1].score).toBe(400); // P4
    expect(scores[2].score).toBe(300); // P6
    expect(scores[3].score).toBe(200); // P3
    expect(scores[4].score).toBe(100); // P1
    
    // P5 is not in top 5
    const hasP5 = scores.some(s => s.playerName === 'P5');
    expect(hasP5).toBe(false);
  });

  it('should handle zero or negative scores appropriately', () => {
    const q1 = HighScoreManager.submitScore(0, 5, 'P1');
    expect(q1).toBe(false);

    const q2 = HighScoreManager.submitScore(-10, 5, 'P2');
    expect(q2).toBe(false);

    expect(HighScoreManager.getTopScores()).toHaveLength(0);
  });

  it('should clear high scores when requested', () => {
    HighScoreManager.submitScore(500, 5, 'Dave');
    expect(HighScoreManager.getTopScores()).toHaveLength(1);

    HighScoreManager.clearScores();
    expect(HighScoreManager.getTopScores()).toHaveLength(0);
  });

  it('should fallback to default guest/anonymous names when custom name is omitted', () => {
    HighScoreManager.submitScore(120, 4);
    const scores = HighScoreManager.getTopScores();
    expect(scores[0].playerName).toBe('GUEST');
  });

  it('should robustly handle corruption or malformed stored data', () => {
    localStorage.setItem('bugsmasher_local_high_scores_top5', 'invalid-json');
    const scores = HighScoreManager.getTopScores();
    expect(scores).toEqual([]);
  });

  it('should return false when a score does not make the top 5', () => {
    for (let i = 0; i < 5; i++) {
      HighScoreManager.submitScore(1000 - i * 100, 5, `P${i}`);
    }
    const qualified = HighScoreManager.submitScore(10, 1, 'Low');
    expect(qualified).toBe(false);
    expect(HighScoreManager.getTopScores()).toHaveLength(5);
  });

  it('should use the signed-in user display name when available', () => {
    authMocks.currentUser = { displayName: 'Commander Fox' };
    HighScoreManager.submitScore(250, 6);
    const scores = HighScoreManager.getTopScores();
    expect(scores[0].playerName).toBe('COMMANDER FOX');
    authMocks.currentUser = null;
  });
});
