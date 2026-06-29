import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PCGSystem, type PCGTheme } from '../game/PCGSystem';
import type { GameEngine } from '../game/GameEngine';

vi.mock('../game/SoundManager', () => ({
  soundManager: {
    heal: vi.fn(),
    shoot: vi.fn(),
    uiClick: vi.fn(),
    uiError: vi.fn(),
    armoryEquip: vi.fn(),
    bossWarning: vi.fn(),
  },
}));

function createMockEngine(overrides: Partial<GameEngine> = {}): GameEngine {
  return {
    width: 800,
    height: 600,
    wave: 3,
    globalTime: 10,
    score: 0,
    health: 100,
    maxHealth: 100,
    streakCount: 0,
    currentBiome: 'neon_core',
    bugs: [],
    resources: [],
    hazards: [],
    waveManager: { waveActive: true },
    particleSystem: {
      spawnShockwave: vi.fn(),
      spawnLaser: vi.fn(),
      spawnSmoke: vi.fn(),
      spawnClickPulse: vi.fn(),
    },
    damageBug: vi.fn(),
    activatePowerup: vi.fn(),
    ...overrides,
  } as unknown as GameEngine;
}

describe('PCGSystem', () => {
  let engine: GameEngine;
  let pcg: PCGSystem;

  beforeEach(() => {
    engine = createMockEngine();
    pcg = new PCGSystem(engine);
  });

  it('generates deterministic maps for the same seed and theme', () => {
    const first = pcg.generateMap('ALPHA-99', 'cyberspace_node');
    const second = pcg.generateMap('ALPHA-99', 'cyberspace_node');

    expect(first).toEqual(second);
    expect(first.theme).toBe('cyberspace_node');
    expect(first.seed).toBe('ALPHA-99');
  });

  it('generates different maps for different seeds', () => {
    const a = pcg.generateMap('SEED-A', 'magma_core');
    const b = pcg.generateMap('SEED-B', 'magma_core');

    expect(a.obstacles[0]?.x).not.toBe(b.obstacles[0]?.x);
  });

  it.each<PCGTheme>([
    'nuclear_melt',
    'cyberspace_node',
    'void_rift',
    'glacier_ice',
    'magma_core',
  ])('builds valid config for theme %s', (theme) => {
    const map = pcg.generateMap(`TEST-${theme}`, theme);

    expect(map.theme).toBe(theme);
    expect(map.obstacles.length).toBeGreaterThanOrEqual(3);
    expect(map.objectives).toHaveLength(1);
    expect(map.challengeInfo.length).toBeGreaterThan(10);
    expect(map.spawnMultiplier).toBeGreaterThan(0);
  });

  it('uses CORE when seed is blank', () => {
    const map = pcg.generateMap('   ', 'glacier_ice');
    expect(map.seed).toBe('CORE');
  });

  it('activates generated map in the engine', () => {
    const map = pcg.generateMap('ACTIVATE-1', 'void_rift');
    pcg.activateMapInEngine(map);

    expect(pcg.activeMap).toBe(map);
    expect(engine.currentBiome).toBe('custom_map');
  });

  it('returns stable PRNG output for a wave salt', () => {
    pcg.currentSeed = 'PRNG-TEST';
    const a = pcg.getPRNGForWave(4, 'resources');
    const b = pcg.getPRNGForWave(4, 'resources');

    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('spawns procedural resources once per wave', () => {
    const map = pcg.generateMap('RESOURCE-1', 'cyberspace_node');
    pcg.activeMap = map;

    pcg.update(0.1);
    expect(engine.resources.length).toBeGreaterThan(0);
    const firstCount = engine.resources.length;

    pcg.update(0.1);
    expect(engine.resources.length).toBe(firstCount);
  });

  it('intercepts clicks on procedural obstacles', () => {
    const map = pcg.generateMap('HIT-1', 'magma_core');
    pcg.activeMap = map;
    const obstacle = map.obstacles[0];
    const initialHp = obstacle.hp;

    const hit = pcg.checkNodeHit(obstacle.x, obstacle.y);

    expect(hit).toBe(true);
    expect(obstacle.hp).toBe(initialHp - 1);
  });

  it('boosts objective charge when beacon is clicked', () => {
    const map = pcg.generateMap('BEACON-1', 'glacier_ice');
    pcg.activeMap = map;
    const objective = map.objectives[0];
    objective.charge = 0;

    const hit = pcg.checkNodeHit(objective.x, objective.y);

    expect(hit).toBe(true);
    expect(objective.charge).toBe(5);
  });

  it('destroys obstacle and triggers explosion effects at zero hp', () => {
    const map = pcg.generateMap('BOOM-1', 'magma_core');
    pcg.activeMap = map;
    const obstacle = map.obstacles[0];
    obstacle.hp = 1;

    pcg.checkNodeHit(obstacle.x, obstacle.y);

    expect(obstacle.active).toBe(false);
  });

  it('spawns procedural hazards on a timer during active waves', () => {
    const map = pcg.generateMap('HAZARD-1', 'void_rift');
    pcg.activeMap = map;
    pcg.hazardSpawnTimer = 11.9;

    pcg.update(0.2);

    expect(engine.hazards.length).toBeGreaterThan(0);
  });

  it('renders objectives and obstacles when map is active', () => {
    const map = pcg.generateMap('RENDER-1', 'cyberspace_node');
    pcg.activeMap = map;

    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowBlur: 0,
      shadowColor: '',
      font: '',
      textAlign: 'left' as CanvasTextAlign,
    } as unknown as CanvasRenderingContext2D;

    pcg.render(ctx);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
