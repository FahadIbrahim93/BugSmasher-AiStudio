import { describe, expect, it } from 'vitest';
import { parseSaveData, saveDataSchema } from '../src/saveSchema';

describe('saveDataSchema', () => {
  const valid = {
    score: 100,
    wave: 2,
    health: 90,
    maxHealth: 100,
    clickRadiusMultiplier: 1,
    autoTurretLevel: 0,
    timestamp: 1_700_000_000_000,
  };

  it('accepts valid save payloads', () => {
    expect(parseSaveData(valid)).toEqual(valid);
  });

  it('rejects out-of-range wave values', () => {
    expect(() => parseSaveData({ ...valid, wave: 10_000 })).toThrow(/Save data failed validation/);
  });

  it('rejects extra fields', () => {
    expect(() => parseSaveData({ ...valid, injected: true })).toThrow(
      /Save data failed validation/,
    );
  });

  it('allows optional stats', () => {
    const withStats = {
      ...valid,
      stats: { totalKills: 42, totalWaves: 3 },
    };
    expect(saveDataSchema.safeParse(withStats).success).toBe(true);
  });

  it('allows optional rage meter fields (mid-run save/load)', () => {
    const withRage = {
      ...valid,
      weaponHeat: 64,
      furyCooldownTimer: 9,
    };
    expect(saveDataSchema.safeParse(withRage).success).toBe(true);
  });

  it('rejects out-of-range rage values', () => {
    expect(() => parseSaveData({ ...valid, weaponHeat: 101 })).toThrow(
      /Save data failed validation/,
    );
  });
});
