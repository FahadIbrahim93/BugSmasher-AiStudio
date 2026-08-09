import { describe, expect, it, vi } from 'vitest';
import { BugSpriteCache } from '../game/rendering/BugSpriteCache';
import type { Bug } from '../game/GameTypes';

const makeBug = (overrides: Partial<Bug> = {}): Bug => ({
  active: true,
  x: 0,
  y: 0,
  size: 15,
  speed: 1,
  hp: 3,
  maxHp: 3,
  color: '#5bd6ff',
  type: 'scout',
  rotation: 0,
  walkCycle: 0,
  hitTimer: 0,
  offsetTime: 0,
  isShielded: false,
  isHealing: false,
  phase: 1,
  abilityTimer: 0,
  armor: 1,
  webTimer: 0,
  ...overrides,
} as Bug);

function stubCanvasFactory() {
  return vi.fn((width: number, height: number) => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      setLineDash: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineCap: 'butt',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
      shadowColor: '',
    };
    return { width, height, getContext: vi.fn(() => ctx) } as unknown as HTMLCanvasElement;
  });
}

describe('BugSpriteCache', () => {
  it('pre-renders each bug archetype once and reuses the cached sprite canvas', () => {
    const factory = stubCanvasFactory();
    const cache = new BugSpriteCache(factory);
    const scout = makeBug({ type: 'scout', color: '#5bd6ff' });

    const first = cache.getSprite(scout);
    const second = cache.getSprite(scout);

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('keys sprites by type, variant, color, and size bucket so roster silhouettes stay distinct', () => {
    const factory = stubCanvasFactory();
    const cache = new BugSpriteCache(factory);

    const scout = cache.getSprite(makeBug({ type: 'scout', variantId: 'alpha', color: '#5bd6ff', size: 15 }));
    const tank = cache.getSprite(makeBug({ type: 'tank', variantId: 'alpha', color: '#ff8a5b', size: 22 }));
    const bossVariant = cache.getSprite(makeBug({ type: 'boss', variantId: 'mandible', color: '#ff5b7a', size: 32 }));

    expect(new Set([scout, tank, bossVariant]).size).toBe(3);
    expect(factory).toHaveBeenCalledTimes(3);
  });
});
