import { describe, it, expect, beforeEach } from 'vitest';
import { MissionManager, __test } from '../game/MissionManager';

describe('MissionManager', () => {
  let currentDate = new Date('2026-06-05T10:00:00Z');

  beforeEach(() => {
    localStorage.clear();
    currentDate = new Date('2026-06-05T10:00:00Z');
    __test.setNow(() => currentDate);
  });

  it('generates 3 daily missions on first call', () => {
    const daily = MissionManager.getDaily();
    expect(daily).toHaveLength(3);
    const difficulties = daily.map(m => m.difficulty);
    expect(difficulties).toContain('easy');
    expect(difficulties).toContain('medium');
    expect(difficulties).toContain('hard');
  });

  it('generates 3 weekly missions', () => {
    const weekly = MissionManager.getWeekly();
    expect(weekly).toHaveLength(3);
  });

  it('all missions start with zero progress', () => {
    const daily = MissionManager.getDaily();
    for (const m of daily) {
      expect(m.current).toBe(0);
      expect(m.completed).toBe(false);
      expect(m.claimed).toBe(false);
    }
  });

  it('updates progress for matching mission type', () => {
    const daily = MissionManager.getDaily();
    const targetType = daily[0].type;
    MissionManager.updateProgress(targetType, 5);
    const updated = MissionManager.getDaily().find(m => m.id === daily[0].id);
    expect(updated?.current).toBe(5);
  });

  it('completes mission when target is reached', () => {
    const daily = MissionManager.getDaily();
    const mission = daily[0];
    MissionManager.updateProgress(mission.type, mission.target);
    const updated = MissionManager.getDaily().find(m => m.id === mission.id);
    expect(updated?.completed).toBe(true);
  });

  it('does not exceed target value', () => {
    const daily = MissionManager.getDaily();
    const mission = daily[0];
    MissionManager.updateProgress(mission.type, mission.target * 2);
    const updated = MissionManager.getDaily().find(m => m.id === mission.id);
    expect(updated?.current).toBe(mission.target);
  });

  it('allows claiming a completed mission', () => {
    const daily = MissionManager.getDaily();
    const mission = daily[0];
    MissionManager.updateProgress(mission.type, mission.target);
    const result = MissionManager.claimReward(mission.id);
    expect(result.success).toBe(true);
  });

  it('prevents claiming incomplete missions', () => {
    const daily = MissionManager.getDaily();
    const mission = daily[0];
    const result = MissionManager.claimReward(mission.id);
    expect(result.success).toBe(false);
  });

  it('prevents double-claiming', () => {
    const daily = MissionManager.getDaily();
    const mission = daily[0];
    MissionManager.updateProgress(mission.type, mission.target);
    MissionManager.claimReward(mission.id);
    const second = MissionManager.claimReward(mission.id);
    expect(second.success).toBe(false);
  });

  it('returns completion stats correctly', () => {
    const daily = MissionManager.getDaily();
    MissionManager.updateProgress(daily[0].type, daily[0].target);
    const stats = MissionManager.getCompletionStats();
    expect(stats.dailyCompleted).toBe(1);
    expect(stats.dailyTotal).toBe(3);
  });

  it('regenerates missions on new day', () => {
    const first = MissionManager.getDaily();
    const firstId = first[0].id;
    currentDate = new Date('2026-06-06T10:00:00Z');
    const next = MissionManager.getDaily();
    expect(next[0].id).not.toBe(firstId);
  });
});
