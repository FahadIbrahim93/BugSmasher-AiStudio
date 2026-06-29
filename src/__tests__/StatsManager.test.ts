import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_STATS, StatsManager } from '../game/StatsManager';

describe('StatsManager', () => {
  beforeEach(() => {
    localStorage.clear();
    StatsManager.setStats({ ...INITIAL_STATS });
  });

  it('persists stats through setStats', () => {
    StatsManager.setStats({
      ...INITIAL_STATS,
      totalBugsKilled: 42,
      totalRuns: 3,
    });

    expect(StatsManager.getStats().totalBugsKilled).toBe(42);
    expect(StatsManager.getStats().totalRuns).toBe(3);
    expect(localStorage.getItem('nexus_user_stats')).toContain('"totalBugsKilled":42');
  });

  it('accumulates session stats and persists them', () => {
    StatsManager.updateStats({ totalBugsKilled: 5, totalScore: 900, totalWavesCompleted: 1 });

    const stats = StatsManager.getStats();
    expect(stats.totalBugsKilled).toBe(5);
    expect(stats.totalScore).toBe(900);
    expect(localStorage.getItem('nexus_user_stats')).toContain('"totalBugsKilled":5');
  });

  it('records run lifecycle metrics', () => {
    StatsManager.recordRunStart();
    StatsManager.recordRunEnd(12, 50_000);

    const stats = StatsManager.getStats();
    expect(stats.totalRuns).toBe(1);
    expect(stats.bestWaveReached).toBe(12);
    expect(stats.totalScore).toBe(50_000);
  });
});
