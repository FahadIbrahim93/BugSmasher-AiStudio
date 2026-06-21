import { describe, expect, it, vi } from 'vitest';
import { OffscreenEnvironmentCache } from '../game/rendering/OffscreenEnvironmentCache';

function createEngine() {
  return {
    width: 320,
    height: 180,
    globalTime: 1.5,
    ctx: { drawImage: vi.fn() }
  };
}

describe('OffscreenEnvironmentCache', () => {
  it('keeps static and periodic layers on separate backing canvases', () => {
    const cache = new OffscreenEnvironmentCache();
    const engine = createEngine();
    const drawStatic = vi.fn();
    const drawPeriodic = vi.fn();

    expect(cache.blitStaticLayer(engine as never, 'grid', drawStatic)).toBe(true);
    cache.blitPeriodicLayer(engine as never, 'lava', 1000, drawPeriodic);
    expect(cache.blitStaticLayer(engine as never, 'grid', drawStatic)).toBe(true);

    expect(drawStatic).toHaveBeenCalledTimes(1);
    expect(drawPeriodic).toHaveBeenCalledTimes(1);

    const drawnCanvases = (engine.ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls.map(call => call[0]);
    expect(drawnCanvases[0]).toBe(drawnCanvases[2]);
    expect(drawnCanvases[0]).not.toBe(drawnCanvases[1]);
  });

  it('invalidates static cache when dimensions change', () => {
    const cache = new OffscreenEnvironmentCache();
    const engine = createEngine();
    const drawStatic = vi.fn();

    cache.blitStaticLayer(engine as never, 'grid', drawStatic);
    cache.blitStaticLayer(engine as never, 'grid', drawStatic);
    engine.height = 240;
    cache.blitStaticLayer(engine as never, 'grid', drawStatic);

    expect(drawStatic).toHaveBeenCalledTimes(2);
  });
});
