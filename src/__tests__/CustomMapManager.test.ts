import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomMapManager, HANDCRAFTED_BATTLEGROUNDS } from '../game/CustomMapManager';

describe('CustomMapManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns handcrafted battlegrounds by id', () => {
    const map = CustomMapManager.activateMapById('digital_matrix');
    expect(map.id).toBe('digital_matrix');
    expect(CustomMapManager.getActiveConfiguration().id).toBe('digital_matrix');
  });

  it('falls back to the first map for unknown ids', () => {
    const map = CustomMapManager.activateMapById('missing-map');
    expect(map.id).toBe(HANDCRAFTED_BATTLEGROUNDS[0].id);
  });

  it('rotates maps every five waves when rotation is enabled', () => {
    CustomMapManager.setRotationEnabled(true);

    expect(CustomMapManager.getCustomMap(1)?.id).toBe(HANDCRAFTED_BATTLEGROUNDS[0].id);
    expect(CustomMapManager.getCustomMap(6)?.id).toBe(HANDCRAFTED_BATTLEGROUNDS[1].id);
  });

  it('rotates maps over time when rotation is enabled without wave input', () => {
    CustomMapManager.setRotationEnabled(true);
    const first = CustomMapManager.getCustomMap()?.id;

    vi.setSystemTime(new Date('2026-06-15T12:02:00Z'));
    const second = CustomMapManager.getCustomMap()?.id;

    expect(first).not.toBe(second);
  });
});
