import { describe, it, expect } from 'vitest';
import { GAME_MODES, getGameModeConfig } from '../game/GameMode';

describe('GameMode', () => {
  it('defines all three game modes', () => {
    expect(Object.keys(GAME_MODES)).toEqual(['standard', 'endless', 'boss_rush']);
  });

  it('returns the config for a known mode', () => {
    expect(getGameModeConfig('endless').endlessWaves).toBe(true);
    expect(getGameModeConfig('boss_rush').bossEveryWave).toBe(true);
  });

  it('falls back to standard for unknown modes', () => {
    const config = getGameModeConfig('unknown' as 'standard');
    expect(config).toEqual(GAME_MODES.standard);
    expect(config.endlessWaves).toBe(false);
  });

  it('escalates wave scale bonus across modes', () => {
    expect(GAME_MODES.standard.waveScaleBonus).toBeLessThan(GAME_MODES.endless.waveScaleBonus);
    expect(GAME_MODES.endless.waveScaleBonus).toBeLessThan(GAME_MODES.boss_rush.waveScaleBonus);
  });
});
