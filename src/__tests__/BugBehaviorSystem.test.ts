import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { BugBehaviorSystem } from '../game/BugBehaviorSystem';
import { Bug } from '../game/GameTypes';

vi.mock('../game/SoundManager', () => ({
  soundManager: {
    init: vi.fn(),
    shoot: vi.fn(),
    splat: vi.fn(),
    hitBase: vi.fn(),
    powerup: vi.fn(),
    nuke: vi.fn(),
    upgrade: vi.fn(),
    uiClick: vi.fn(),
    uiHover: vi.fn(),
    scoreTick: vi.fn(),
    resource: vi.fn(),
    bossHit: vi.fn(),
    bossDeath: vi.fn(),
    bossWarning: vi.fn(),
    bossAbility: vi.fn(),
    skillUpgrade: vi.fn(),
    dash: vi.fn(),
    uiError: vi.fn(),
    speak: vi.fn(),
    stopSpeaking: vi.fn(),
    updateGameState: vi.fn(),
    setMasterVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    setVoiceVolume: vi.fn(),
    toggleMute: vi.fn(),
    stopMusic: vi.fn(),
    playBiomeMusic: vi.fn(),
    destroy: vi.fn(),
    critHit: vi.fn(),
    miss: vi.fn(),
    comboBreak: vi.fn(),
    setReducedMotion: vi.fn(),
  }
}));

function createBug(overrides: Partial<Bug> = {}): Bug {
  return {
    active: true,
    x: 700,
    y: 100,
    type: 'normal',
    variantId: undefined,
    rotation: 0,
    walkCycle: 0,
    color: '#ff0000',
    size: 16,
    hp: 50,
    maxHp: 50,
    hitTimer: 0,
    offsetTime: 0,
    webTimer: 0,
    armor: 1.0,
    isHealing: false,
    isShielded: false,
    phase: undefined,
    abilityTimer: undefined,
    speed: 100,
    scoreValue: 10,
    ...overrides,
  };
}

describe('BugBehaviorSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let behavior: BugBehaviorSystem;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 800, bottom: 600,
      width: 800, height: 600,
      x: 0, y: 0,
      toJSON: () => undefined,
    });
    engine = new GameEngine(canvas);
    behavior = engine.bugBehaviorSystem;
    engine.isRunning = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('update', () => {
    it('removes bugs that reach the core and reports impact', () => {
      const bug = createBug({ x: engine.coreX + 10, y: engine.coreY });
      engine.bugs = [bug];

      behavior.update(0.1);

      expect(engine.bugs).toHaveLength(0);
    });

    it('moves bugs toward the core', () => {
      const bug = createBug({ x: 700, y: 100, speed: 100 });
      engine.bugs = [bug];

      behavior.update(1);

      const dx = bug.x - 700;
      const dy = bug.y - 100;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(0);
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(101);
    });

    it('applies slow-motion time scale', () => {
      engine.slowMoTimer = 5;
      const bug = createBug({ x: 700, y: 100, speed: 100 });
      const startX = bug.x;
      engine.bugs = [bug];

      behavior.update(1);

      const moved = Math.hypot(bug.x - startX, bug.y - 100);
      expect(moved).toBeLessThan(40); // 100 * 0.3 = 30
    });

    it('freezes bugs entirely during freeze', () => {
      engine.freezeTimer = 5;
      const bug = createBug({ x: 700, y: 100 });
      const startX = bug.x;
      engine.bugs = [bug];

      behavior.update(1);

      expect(bug.x).toBe(startX);
    });

    it('decrements hitTimer and healEffectTimer', () => {
      const bug = createBug({
        x: 700,
        y: 100,
        hitTimer: 1,
        isHealing: true,
        healEffectTimer: 1,
      });
      engine.bugs = [bug];

      behavior.update(0.5);

      expect(bug.hitTimer).toBeCloseTo(0.5);
      expect(bug.healEffectTimer).toBeCloseTo(0.5);
    });

    it('stops healing when the heal effect timer expires', () => {
      const bug = createBug({
        x: 700,
        y: 100,
        isHealing: true,
        healEffectTimer: 0.1,
      });
      engine.bugs = [bug];

      behavior.update(0.5);

      expect(bug.isHealing).toBe(false);
    });
  });

  describe('movement modifiers', () => {
    it('applies the challenge bug speed multiplier', () => {
      engine.challengeModifiers = { bugSpeedMultiplier: 2 } as typeof engine.challengeModifiers;
      const bug = createBug({ x: 700, y: 100, speed: 100 });
      const startX = bug.x;
      engine.bugs = [bug];

      behavior.update(1);

      const moved = Math.hypot(bug.x - startX, bug.y - 100);
      expect(moved).toBeGreaterThan(150); // 100 * 2 = 200
    });

    it('slows bugs near the core during frostbite', () => {
      engine.challengeModifiers = {
        bugSpeedMultiplier: 1,
        frostbiteActive: true,
      } as typeof engine.challengeModifiers;
      const bug = createBug({ x: engine.coreX + 100, y: engine.coreY, speed: 100 });
      const startX = bug.x;
      engine.bugs = [bug];

      behavior.update(1);

      // frostSlow = 0.2 + (100/300)*0.8 ≈ 0.467 → ~46.7px moved (vs 100 unmodified)
      const moved = Math.hypot(bug.x - startX, bug.y - engine.coreY);
      expect(moved).toBeLessThan(60);
      expect(moved).toBeGreaterThan(30);
    });

    it('adds erratic drift to scouts', () => {
      const bug = createBug({ x: 700, y: 100, type: 'scout', speed: 100 });
      engine.bugs = [bug];
      const start = { x: bug.x, y: bug.y };

      behavior.update(0.1);

      // scout moves with erratic perpendicular drift; verify it moved off-axis
      const straightX = start.x - 100 * 0.1; // would move left toward core
      expect(Math.abs(bug.x - straightX)).toBeGreaterThan(0);
      expect(bug.y).not.toBe(start.y);
    });

    it('moves dodging scouts at burst speed along their dodge vector', () => {
      const bug = createBug({
        x: 700,
        y: 100,
        type: 'scout',
        speed: 100,
        dodgeTimer: 0.5,
        dodgeDirX: 1,
        dodgeDirY: 0,
      });
      engine.bugs = [bug];

      behavior.update(0.1);

      expect(bug.x).toBeGreaterThan(700); // burst speed 500 * 0.1 = 50px
      expect(bug.dodgeTimer).toBeCloseTo(0.4);
    });
  });

  describe('biome and type abilities', () => {
    it('teleports void_abyss bugs far from the core', () => {
      engine.currentBiome = 'void_abyss';
      const bug = createBug({ x: 700, y: 100, lastTeleportTime: 4.5 });
      engine.bugs = [bug];

      behavior.update(0.1);

      expect(bug.lastTeleportTime).toBe(0);
      expect(Math.hypot(bug.x - 700, bug.y - 100)).toBeGreaterThan(50);
    });

    it('does not teleport void_abyss bugs too close to the core', () => {
      engine.currentBiome = 'void_abyss';
      const bug = createBug({ x: engine.coreX + 50, y: engine.coreY, lastTeleportTime: 4.5 });
      engine.bugs = [bug];

      behavior.update(0.1);

      expect(bug.lastTeleportTime).toBe(4.5 + 0.1);
    });

    it('regenerates hp in the golden_spire biome', () => {
      engine.currentBiome = 'golden_spire';
      const bug = createBug({ x: 700, y: 100, hp: 40, maxHp: 50 });
      engine.bugs = [bug];

      behavior.update(1);

      expect(bug.hp).toBeGreaterThan(40);
      expect(bug.hp).toBeLessThanOrEqual(50);
    });

    it('healers pulse heals to nearby bugs every 3s', () => {
      const healer = createBug({ x: 700, y: 100, type: 'healer', hp: 100, healCooldown: 3.1 });
      const ally = createBug({ x: 740, y: 100, hp: 10, maxHp: 50 });
      engine.bugs = [healer, ally];

      behavior.update(0.1);

      expect(healer.isHealing).toBe(true);
      expect(healer.healCooldown).toBe(0);
      expect(ally.hp).toBe(20); // +20% of maxHp
    });

    it('delegates boss ability updates to BossSystem', () => {
      const boss = createBug({ x: 700, y: 100, type: 'boss', hp: 100 });
      engine.bugs = [boss];
      const bossSpy = vi.spyOn(engine.bossSystem, 'update').mockImplementation(() => undefined);

      behavior.update(0.1);

      expect(bossSpy).toHaveBeenCalledWith(boss, 0.1, 1);
    });
  });
});
