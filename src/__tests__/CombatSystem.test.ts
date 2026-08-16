import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { CombatSystem } from '../game/CombatSystem';
import { Bug } from '../game/GameTypes';
import { GameConfig } from '../game/GameConfig';
import { soundManager } from '../game/SoundManager';

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
    heal: vi.fn(),
    armoryEquip: vi.fn(),
  }
}));

vi.mock('../lib/analytics', () => ({
  analytics: { track: vi.fn() },
}));

function createBug(overrides: Partial<Bug> = {}): Bug {
  return {
    active: true,
    x: 400,
    y: 300,
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
    speed: 50,
    scoreValue: 10,
    ...overrides,
  };
}

describe('CombatSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let combat: CombatSystem;

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
    combat = engine.combatSystem;
    engine.isRunning = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reset', () => {
    it('resets all combat-side session state', () => {
      engine.weaponHeat = 77;
      engine.furyActive = true;
      engine.furyTimer = 2;
      engine.furyCooldownTimer = 3;
      engine.slamCharging = true;
      engine.slamCharge = 0.5;
      engine.furyTriggers = 4;
      engine.slamsUsed = 2;

      combat.reset();

      expect(engine.weaponHeat).toBe(0);
      expect(engine.furyActive).toBe(false);
      expect(engine.furyTimer).toBe(0);
      expect(engine.furyCooldownTimer).toBe(0);
      expect(engine.slamCharging).toBe(false);
      expect(engine.slamCharge).toBe(0);
      expect(engine.furyTriggers).toBe(0);
      expect(engine.slamsUsed).toBe(0);
    });
  });

  describe('rage meter / FURY', () => {
    it('adds rage up to the per-second budget cap', () => {
      engine.rageGainBudget = 5;
      combat.addRage(15);
      expect(engine.weaponHeat).toBe(5);
      expect(engine.rageGainBudget).toBe(0);
    });

    it('ignores rage while FURY is already active', () => {
      engine.furyActive = true;
      combat.addRage(GameConfig.rage.perHit);
      expect(engine.weaponHeat).toBe(0);
    });

    it('triggers FURY when the meter fills and the cooldown is clear', () => {
      engine.furyCooldownTimer = 0;
      engine.weaponHeat = GameConfig.rage.maxHeat - 1;
      combat.addRage(1);
      expect(engine.furyActive).toBe(true);
      expect(engine.furyTriggers).toBe(1);
    });

    it('does not trigger FURY during the post-ignition cooldown even at full meter', () => {
      engine.furyCooldownTimer = 10;
      engine.weaponHeat = GameConfig.rage.maxHeat - 1;
      combat.addRage(1);
      expect(engine.furyActive).toBe(false);
      expect(engine.weaponHeat).toBe(GameConfig.rage.maxHeat);
    });

    it('triggerFury ignites, dispatches the event, and shakes', () => {
      const spy = vi.spyOn(window, 'dispatchEvent');
      combat.triggerFury();
      expect(engine.furyActive).toBe(true);
      expect(engine.furyTimer).toBe(engine.furyDuration);
      expect(engine.weaponHeat).toBe(GameConfig.rage.maxHeat);
      expect(engine.furyTriggers).toBe(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'nexus_fury_active' }));
    });

    it('triggerFury is a no-op when already active', () => {
      engine.furyActive = true;
      combat.triggerFury();
      expect(engine.furyTriggers).toBe(0);
    });
  });

  describe('applyFurySplash', () => {
    it('damages bugs within the splash radius when FURY is active', () => {
      engine.furyActive = true;
      const near = createBug({ x: 400, y: 300, hp: 10 });
      const far = createBug({ x: 790, y: 590, hp: 10 });
      engine.bugs = [near, far];

      combat.applyFurySplash(400, 300);

      expect(near.hp).toBeLessThan(10);
      expect(far.hp).toBe(10);
    });

    it('does nothing when FURY is not active', () => {
      engine.furyActive = false;
      const bug = createBug({ x: 400, y: 300, hp: 10 });
      engine.bugs = [bug];

      combat.applyFurySplash(400, 300);

      expect(bug.hp).toBe(10);
    });
  });

  describe('triggerGroundSlam', () => {
    it('damages bugs in the radius, clears charge, and feeds rage', () => {
      const bug = createBug({ x: 400, y: 300, hp: 100 });
      engine.bugs = [bug];
      engine.slamCharging = true;
      engine.slamCharge = 0.5;

      combat.triggerGroundSlam(400, 300, 0.5);

      expect(engine.slamCharging).toBe(false);
      expect(engine.slamCharge).toBe(0);
      expect(engine.slamsUsed).toBe(1);
      expect(bug.hp).toBeLessThan(100);
      expect(engine.weaponHeat).toBe(GameConfig.rage.perSlam);
    });
  });

  describe('fireAutoTurret', () => {
    it('fires at the closest bug and damages it', () => {
      const near = createBug({ x: 410, y: 300, hp: 10 });
      const far = createBug({ x: 700, y: 500, hp: 10 });
      engine.bugs = [near, far];

      combat.fireAutoTurret();

      expect(near.hp).toBeLessThan(10);
      expect(far.hp).toBe(10);
    });

    it('does nothing when there are no bugs', () => {
      engine.bugs = [];
      expect(() => {
        combat.fireAutoTurret();
      }).not.toThrow();
    });
  });

  describe('damageBug', () => {
    it('applies base damage and kills the bug at zero hp', () => {
      const bug = createBug({ hp: 1 });
      engine.bugs = [bug];
      engine.damageMultiplier = 1;

      combat.damageBug(bug, 1);

      expect(bug.hp).toBeLessThanOrEqual(0);
      expect(engine.bugs).toHaveLength(0);
      expect(engine.totalKills).toBe(1);
      expect(engine.score).toBeGreaterThan(0);
    });

    it('returns early for shielded bosses without damage', () => {
      const bug = createBug({ type: 'boss', isShielded: true, hp: 100 });
      engine.bugs = [bug];

      combat.damageBug(bug, 50);

      expect(bug.hp).toBe(100);
    });

    it('deals exactly 2x damage in FURY mode, not 4x (regression: duplicated multiplier)', () => {
      const bug = createBug({ hp: 100 });
      engine.bugs = [bug];
      engine.damageMultiplier = 1;
      engine.furyActive = true;
      vi.spyOn(Math, 'random').mockReturnValue(1.0); // no non-FURY crit

      combat.damageBug(bug, 10);

      // 10 * 1 (mult) * 2 (FURY) = 20 → hp 80
      expect(bug.hp).toBe(80);
      vi.restoreAllMocks();
    });

    it('applies armor reduction', () => {
      const bug = createBug({ hp: 100, armor: 0.5 });
      engine.bugs = [bug];
      engine.damageMultiplier = 1;
      engine.furyActive = false;
      vi.spyOn(Math, 'random').mockReturnValue(1.0);

      combat.damageBug(bug, 10);

      expect(bug.hp).toBe(95); // 10 * 0.5 = 5
      vi.restoreAllMocks();
    });

    it('grants scouts a dodge window when they survive', () => {
      const bug = createBug({ type: 'scout', hp: 100 });
      engine.bugs = [bug];
      engine.damageMultiplier = 1;
      engine.furyActive = false;
      vi.spyOn(Math, 'random').mockReturnValue(1.0);
      engine.inputSystem.lastMouseX = 0;
      engine.inputSystem.lastMouseY = 0;

      combat.damageBug(bug, 1);

      expect(bug.dodgeTimer).toBe(0.35);
      expect(bug.dodgeDirX).toBeDefined();
      vi.restoreAllMocks();
    });

    it('splits swarmers on kill when FPS permits', () => {
      const bug = createBug({ type: 'swarmer', hp: 1 });
      engine.bugs = [bug];
      engine.renderer.currentFps = 60;
      engine.damageMultiplier = 1;

      combat.damageBug(bug, 1);

      expect(engine.swarmerKills).toBe(1);
      expect(engine.bugs.filter((b) => b.type === 'mini').length).toBe(3);
    });
  });

  describe('consumeConsumable', () => {
    it('returns false when the consumable is not owned', () => {
      vi.spyOn(engine.progressionManager, 'consumeConsumable').mockReturnValue(false);
      expect(combat.consumeConsumable('repair_kit')).toBe(false);
    });

    it('repair kit heals 25% of max health', () => {
      vi.spyOn(engine.progressionManager, 'consumeConsumable').mockReturnValue(true);
      engine.health = 10;
      engine.maxHealth = 100;
      expect(combat.consumeConsumable('repair_kit')).toBe(true);
      expect(engine.health).toBe(35);
    });

    it('emp generator zeroes non-boss bug hp', () => {
      vi.spyOn(engine.progressionManager, 'consumeConsumable').mockReturnValue(true);
      const boss = createBug({ type: 'boss', hp: 100 });
      const normal = createBug({ type: 'normal', hp: 100 });
      engine.bugs = [boss, normal];

      expect(combat.consumeConsumable('emp_generator')).toBe(true);

      expect(boss.hp).toBe(100);
      expect(normal.hp).toBe(0);
    });

    it('overdrive chip sets the overdrive timer', () => {
      vi.spyOn(engine.progressionManager, 'consumeConsumable').mockReturnValue(true);
      engine.overdriveTimer = 0;
      expect(combat.consumeConsumable('overdrive_chip')).toBe(true);
      expect(engine.overdriveTimer).toBe(20);
    });
  });

  describe('updateTimers', () => {
    it('drains FURY and starts the post-ignition cooldown at expiry', () => {
      engine.furyActive = true;
      engine.furyTimer = 0.1;
      engine.weaponHeat = 5;

      combat.updateTimers(0.5);

      expect(engine.furyActive).toBe(false);
      expect(engine.weaponHeat).toBe(0);
      expect(engine.furyCooldownTimer).toBe(GameConfig.rage.furyCooldown);
    });

    it('auto-ignites FURY when the cooldown clears with a full meter', () => {
      engine.furyCooldownTimer = 0.1;
      engine.weaponHeat = GameConfig.rage.maxHeat;

      combat.updateTimers(0.5);

      expect(engine.furyActive).toBe(true);
      expect(engine.furyCooldownTimer).toBe(0);
    });

    it('decays weapon heat when not in FURY', () => {
      engine.weaponHeat = 20;
      combat.updateTimers(1);
      expect(engine.weaponHeat).toBeLessThan(20);
    });

    it('accumulates ground slam charge while charging', () => {
      engine.slamCharging = true;
      engine.slamCharge = 0;
      combat.updateTimers(1);
      expect(engine.slamCharge).toBeGreaterThan(0);
    });

    it('ticks down misc game timers', () => {
      engine.multiplierTimer = 1;
      engine.rapidFireTimer = 1;
      engine.slowMoTimer = 1;
      engine.shieldTimer = 1;
      engine.waveTransitionTimer = 2;

      combat.updateTimers(0.5);

      expect(engine.multiplierTimer).toBe(0.5);
      expect(engine.rapidFireTimer).toBe(0.5);
      expect(engine.slowMoTimer).toBe(0.5);
      expect(engine.shieldTimer).toBe(0.5);
      expect(engine.waveTransitionTimer).toBe(1.5);
    });

    it('clears the glitch flag when the glitch timer expires', () => {
      engine.glitchTimer = 0.1;
      engine.renderer.isGlitching = true;
      combat.updateTimers(0.5);
      expect(engine.renderer.isGlitching).toBe(false);
    });
  });

  describe('updateMetrics', () => {
    it('breaks the streak and refunds rage on streak timer expiry', () => {
      engine.streakTimer = 0.1;
      engine.streakCount = 5;
      engine.lastHitTime = engine.globalTime;

      combat.updateMetrics(0.5);

      expect(engine.streakCount).toBe(0);
      expect(soundManager.comboBreak).toHaveBeenCalled();
    });

    it('accumulates play time in 10s chunks', () => {
      const spy = vi.spyOn(engine.statsManager, 'updateStats').mockImplementation(() => undefined);
      engine.playTimeAccumulator = 9.5;
      combat.updateMetrics(1);
      expect(engine.playTimeAccumulator).toBeCloseTo(0.5);
      expect(spy).toHaveBeenCalledWith({ totalPlayTime: 10 });
    });

    it('recomputes the performance factor and decays visuals', () => {
      engine.baseScale = 2;
      engine.baseRecoil = 10;
      engine.upgradeFlash = 1;
      engine.impactFrame = 1;

      combat.updateMetrics(0.1);

      expect(engine.performanceFactor).toBeGreaterThanOrEqual(0.8);
      expect(engine.baseScale).toBeLessThan(2);
      expect(engine.baseRecoil).toBeLessThan(10);
      expect(engine.upgradeFlash).toBeLessThan(1);
    });
  });

  describe('updateTurrets', () => {
    it('fires the auto turret at a bug when the fire rate elapses', () => {
      engine.autoTurretLevel = 1;
      engine.autoTurretTimer = 99;
      const bug = createBug({ x: 410, y: 300, hp: 10 });
      engine.bugs = [bug];

      combat.updateTurrets(0.1);

      expect(engine.autoTurretTimer).toBe(0);
      expect(bug.hp).toBeLessThan(10);
    });

    it('skips everything when the turret is not active', () => {
      engine.autoTurretLevel = 0;
      engine.rapidFireTimer = 0;
      engine.overdriveTimer = 0;
      engine.overdriveActiveTime = 0;
      engine.autoTurretTimer = 0;

      expect(() => {
        combat.updateTurrets(0.1);
      }).not.toThrow();
      expect(engine.autoTurretTimer).toBe(0);
    });
  });

  describe('triggerActiveAbility', () => {
    it('returns false for an un-unlocked ability', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(0);
      expect(combat.triggerActiveAbility('nanite_bioshield')).toBe(false);
    });

    it('activates nanite_bioshield when unlocked and off cooldown', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(1);
      engine.bioshieldCooldown = 0;
      engine.health = 50;
      engine.maxHealth = 100;

      expect(combat.triggerActiveAbility('nanite_bioshield')).toBe(true);
      expect(engine.bioshieldActiveTime).toBe(4);
      expect(engine.health).toBe(75);
    });

    it('refuses nanite_bioshield while on cooldown', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(1);
      engine.bioshieldCooldown = 5;
      expect(combat.triggerActiveAbility('nanite_bioshield')).toBe(false);
    });

    it('activates turret_overdrive', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(1);
      expect(combat.triggerActiveAbility('turret_overdrive')).toBe(true);
      expect(engine.overdriveCooldown).toBe(45);
      expect(engine.overdriveActiveTime).toBe(8);
    });

    it('activates chrono_emp_shatter and decays all bugs', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(1);
      vi.spyOn(Math, 'random').mockReturnValue(1.0); // no random crits
      const bug = createBug({ hp: 100 });
      engine.bugs = [bug];

      expect(combat.triggerActiveAbility('chrono_emp_shatter')).toBe(true);
      expect(engine.empShatterCooldown).toBe(50);
      expect(bug.hp).toBe(70); // 30% decay
    });

    it('returns false for an unknown ability id', () => {
      vi.spyOn(engine.progressionManager, 'getSkillLevel').mockReturnValue(1);
      expect(combat.triggerActiveAbility('not_a_real_ability')).toBe(false);
    });
  });
});
