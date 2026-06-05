import { describe, it, expect, vi } from 'vitest';
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
      isOverheated: false,
      dashCooldownTimer: 0,
      dashCooldown: 3,
      rapidFireTimer: 0,
      spikeBurstTimer: 0,
      shieldTimer: 0,
      multiplierTimer: 0,
      slowMoTimer: 0,
      overdriveTimer: 0,
      waveModifier: null,
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

  it('delivers publishes after subscribe and stops after unsub (expanded for #10/#12)', () => {
    const listener = vi.fn();
    const unsub = GameEngineStatusBus.subscribe(listener);
    listener.mockClear();
    const s2: GameEngineStatus = { ... (GameEngineStatusBus.getSnapshot() || {} as any), health: 77 };
    GameEngineStatusBus.publish(s2);
    expect(listener).toHaveBeenCalledWith(s2);
    unsub();
    listener.mockClear();
    GameEngineStatusBus.publish({ ...s2, health: 1 } as any);
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple listeners and nulls', () => {
    const l1 = vi.fn(); const l2 = vi.fn();
    const u1 = GameEngineStatusBus.subscribe(l1);
    const u2 = GameEngineStatusBus.subscribe(l2);
    const s: GameEngineStatus = { ...(GameEngineStatusBus.getSnapshot() || {} as any), health: 42 };
    GameEngineStatusBus.publish(s);
    expect(l1).toHaveBeenCalledWith(s);
    expect(l2).toHaveBeenCalledWith(s);
    u1(); u2();
  });
});