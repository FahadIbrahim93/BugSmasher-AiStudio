import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameEngineStatusBus, type GameEngineStatus } from '../game/GameEngineStatusBus';

describe('GameEngineStatusBus', () => {
  it('publishes and returns snapshot', () => {
    const status: GameEngineStatus = {
      health: 50,
      maxHealth: 100,
      currentBiome: 'neon_core',
      intensity: 1.2,
      performanceFactor: 1,
      weaponHeat: 10,
      furyActive: false,
      furyCooldown: 0,
      dashCooldownTimer: 0,
      dashCooldown: 3,
      rapidFireTimer: 0,
      spikeBurstTimer: 0,
      shakeIntensity: 0,
    };
    GameEngineStatusBus.publish(status);
    expect(GameEngineStatusBus.getSnapshot()).toEqual(status);
    GameEngineStatusBus.publish(null);
    expect(GameEngineStatusBus.getSnapshot()).toBeNull();
  });

  it('notifies subscribers', () => {
    const listener = vi.fn();
    const unsub = GameEngineStatusBus.subscribe(listener);
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('subscribers receive published updates', () => {
    const listener = vi.fn();
    const unsub = GameEngineStatusBus.subscribe(listener);
    listener.mockClear();

    const status: GameEngineStatus = {
      health: 90,
      maxHealth: 100,
      currentBiome: 'neon_core',
      intensity: 2.0,
      performanceFactor: 1.2,
      weaponHeat: 0,
      furyActive: true,
      furyCooldown: 0,
      dashCooldownTimer: 0,
      dashCooldown: 3,
      rapidFireTimer: 0,
      spikeBurstTimer: 0,
      shakeIntensity: 0.5,
    };
    GameEngineStatusBus.publish(status);
    expect(listener).toHaveBeenCalledWith(status);
    unsub();
  });

  it('subscriber stops receiving updates after unsubscribe', () => {
    const listener = vi.fn();
    const unsub = GameEngineStatusBus.subscribe(listener);
    listener.mockClear();

    unsub();
    GameEngineStatusBus.publish(null);

    expect(listener).not.toHaveBeenCalled();
  });

  it('behaves safely without a window (SSR)', () => {
    vi.stubGlobal('window', undefined);
    try {
      const listener = vi.fn();
      expect(() => {
        GameEngineStatusBus.publish(null);
      }).not.toThrow();
      const unsub = GameEngineStatusBus.subscribe(listener);
      expect(listener).toHaveBeenCalledWith(null);
      unsub();
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});