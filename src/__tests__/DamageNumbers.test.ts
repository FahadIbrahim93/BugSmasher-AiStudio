import { describe, it, expect, beforeEach } from 'vitest';
import { DamageNumberSystem } from '../game/DamageNumbers';

function makeCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    save: () => {},
    restore: () => {},
    fillText: () => {},
    strokeText: () => {},
    translate: () => {},
    fillRect: () => {},
  } as unknown as CanvasRenderingContext2D;
}

describe('DamageNumberSystem', () => {
  let system: DamageNumberSystem;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    system = new DamageNumberSystem();
    ctx = makeCtx();
  });

  it('starts with zero active numbers', () => {
    expect(system.activeCount).toBe(0);
  });

  it('spawns a damage number', () => {
    system.spawn(100, 200, 42);
    expect(system.activeCount).toBe(1);
  });

  it('marks crit damage numbers', () => {
    system.spawn(100, 200, 100, true);
    expect(system.activeCount).toBe(1);
  });

  it('removes expired numbers after update', () => {
    system.spawn(100, 200, 50);
    system.update(2000);
    expect(system.activeCount).toBe(0);
  });

  it('keeps numbers alive during their lifetime', () => {
    system.spawn(100, 200, 50);
    system.update(500);
    expect(system.activeCount).toBe(1);
  });

  it('renders without throwing on empty state', () => {
    expect(() => system.render(ctx)).not.toThrow();
  });

  it('renders active numbers without throwing', () => {
    system.spawn(100, 200, 25);
    system.spawn(150, 250, 99, true);
    expect(() => system.render(ctx)).not.toThrow();
  });

  it('can be cleared', () => {
    system.spawn(100, 200, 10);
    system.spawn(150, 250, 20);
    system.clear();
    expect(system.activeCount).toBe(0);
  });

  it('handles many concurrent numbers', () => {
    for (let i = 0; i < 50; i++) {
      system.spawn(i * 10, i * 10, i + 1);
    }
    expect(system.activeCount).toBe(50);
  });

  it('exposes singleton instance', async () => {
    const mod = await import('../game/DamageNumbers');
    expect(mod.damageNumbers).toBeDefined();
  });
});
