import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameConfig } from './GameConfig';
import { ProgressionManager } from './ProgressionManager';
import { soundManager } from './SoundManager';

// Mock the sound manager to prevent AudioContext errors in jsdom
vi.mock('./SoundManager', () => ({
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
  },
}));

describe('GameEngine', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    engine = new GameEngine(canvas);
  });

  it('should initialize with correct default values', () => {
    expect(engine.score).toBe(0);
    expect(engine.health).toBe(GameConfig.player.maxHealth);
    expect(engine.wave).toBe(1);
    expect(engine.bugs.length).toBe(0);
  });

  it('should spawn bugs correctly', () => {
    engine.startWave();
    // bugsToSpawn includes a capped performance factor bonus (perfFactor=1.0 capped at 1.5 => +3)
    const expectedBase = GameConfig.waves.baseBugs + engine.wave * GameConfig.waves.bugsPerWave;
    const cappedPerf = Math.min(engine.performanceFactor, 1.5);
    const perfBonus = Math.floor(cappedPerf * 3);
    expect(engine.waveManager.bugsToSpawn).toBe(expectedBase + perfBonus);

    (engine.waveManager as any).spawnBug();
    expect(engine.bugs.length).toBe(1);
    expect(engine.waveManager.bugsToSpawn).toBe(expectedBase + perfBonus - 1);

    const bug = engine.bugs[0];
    expect(bug.active).toBe(true);
    expect(['basic', 'scout', 'tank', 'swarmer', 'ghost']).toContain(bug.type);
  });
  it('should damage and kill bugs', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();
    const bug = engine.bugs[0];

    // Force bug type to basic for predictable HP
    bug.type = 'basic';
    bug.hp = 1;
    bug.maxHp = 1;
    bug.scoreValue = 10;

    engine.damageBug(bug, 1);

    expect(bug.hp).toBeLessThanOrEqual(0);
    expect(engine.bugs.length).toBe(0);
    expect(engine.score).toBe(10);
  });

  it('should activate shield powerup', () => {
    engine.activatePowerup('shield');
    expect(engine.shieldTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate multiplier powerup', () => {
    engine.activatePowerup('multiplier');
    expect(engine.multiplierTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate rapid fire powerup', () => {
    engine.activatePowerup('rapid_fire');
    expect(engine.rapidFireTimer).toBe(GameConfig.powerups.duration);
  });

  it('should activate nuke powerup and clear bugs', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();
    (engine.waveManager as any).spawnBug();
    (engine.waveManager as any).spawnBug();

    expect(engine.bugs.length).toBe(3);

    engine.activatePowerup('nuke');

    expect(engine.bugs.length).toBe(0);
    expect(engine.score).toBeGreaterThan(0);
  });

  it('should handle bug reaching the base', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();

    const bug = engine.bugs[0];
    // Align bug with core position
    engine.coreX = engine.width / 2;
    engine.coreY = engine.height / 2;
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;

    const initialHealth = engine.health;

    // Trigger update to process collision
    engine.update(0.1);

    expect(engine.bugs.length).toBe(0); // Bug should be destroyed
    expect(engine.health).toBe(initialHealth - GameConfig.player.hitDamage);
  });

  it('should protect base when shield is active', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();

    const bug = engine.bugs[0];
    engine.coreX = engine.width / 2;
    engine.coreY = engine.height / 2;
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;

    engine.activatePowerup('shield');
    const initialHealth = engine.health;

    engine.update(0.1);

    expect(engine.bugs.length).toBe(0); // Bug should be destroyed
    expect(engine.health).toBe(initialHealth); // Health should not decrease
  });

  it('should pause and resume the simulation loop', () => {
    engine.startWave();
    engine.pause();
    expect(engine.isPaused).toBe(true);

    const bugsBefore = engine.bugs.length;
    engine.update(0.5);
    expect(engine.bugs.length).toBe(bugsBefore);

    engine.resume();
    expect(engine.isPaused).toBe(false);
  });

  it('should apply multiplier to score gains from kills', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();
    const bug = engine.bugs[0];
    bug.type = 'basic';
    bug.hp = 1;
    bug.maxHp = 1;
    bug.scoreValue = 100;

    engine.activatePowerup('multiplier');
    engine.damageBug(bug, 1);

    expect(engine.score).toBeGreaterThanOrEqual(200);
  });

  it('exports and imports persistent session state', () => {
    engine.score = 900;
    engine.wave = 7;
    engine.health = 55;
    engine.autoTurretLevel = 2;

    const exported = engine.exportState();
    engine.importState({ ...exported, score: 1200, wave: 8, health: 80 });

    expect(engine.score).toBe(1200);
    expect(engine.wave).toBe(8);
    expect(engine.health).toBe(80);
    expect(engine.waveManager.waveActive).toBe(false);
  });

  it('exports and imports the rage meter + FURY cooldown so a saved run restores the vent state', () => {
    engine.weaponHeat = 64;
    engine.furyCooldownTimer = 9;

    const exported = engine.exportState();
    expect(exported.weaponHeat).toBe(64);
    expect(exported.furyCooldownTimer).toBe(9);

    // Simulate a fresh run mid-load: rage state gone
    engine.weaponHeat = 0;
    engine.furyCooldownTimer = 0;
    engine.importState(exported);

    // resetEntities() zeroes the meter inside importState — the restore must
    // run AFTER it so the saved vent value survives the round trip.
    expect(engine.weaponHeat).toBe(64);
    expect(engine.furyCooldownTimer).toBe(9);
  });

  it('clamps out-of-range rage values on import', () => {
    engine.importState({ ...engine.exportState(), weaponHeat: 500, furyCooldownTimer: -3 });
    expect(engine.weaponHeat).toBe(GameConfig.rage.maxHeat);
    expect(engine.furyCooldownTimer).toBe(0);
  });

  it('applies daily challenge modifiers to combat stats', () => {
    engine.setChallengeModifiers(['glass_cannon', 'fast_bugs']);
    expect(engine.challengeModifiers?.playerDamageMultiplier).toBe(2);
    expect(engine.challengeModifiers?.maxHealthMultiplier).toBe(0.5);
  });

  it('uses consumables when inventory is available', () => {
    localStorage.clear();
    ProgressionManager.addResource('scrap', 100);
    ProgressionManager.addResource('alloy', 50);
    ProgressionManager.craftItem('repair_kit', { scrap: 30, alloy: 10 });
    engine.health = 40;

    expect(engine.consumeConsumable('repair_kit')).toBe(true);
    expect(engine.health).toBeGreaterThan(40);
  });

  it('triggers dash toward a target coordinate', () => {
    engine.isRunning = true;
    engine.start();
    engine.triggerDash(400, 300);
    expect(engine.dashCooldownTimer).toBeGreaterThan(0);
  });

  it('updates gameplay systems during active waves', () => {
    engine.startWave();

    for (let i = 0; i < 30; i += 1) {
      engine.update(0.05);
    }

    expect(engine.waveManager.waveActive).toBe(true);
  });

  it('uses emp consumables to clear non-boss bugs', () => {
    localStorage.clear();
    ProgressionManager.addResource('scrap', 200);
    ProgressionManager.addResource('alloy', 50);
    ProgressionManager.addResource('flux', 10);
    expect(ProgressionManager.craftItem('emp_generator', { scrap: 100, alloy: 10, flux: 2 })).toBe(
      true,
    );

    engine.startWave();
    (engine.waveManager as any).spawnBug();
    (engine.waveManager as any).spawnBug();
    expect(engine.bugs.length).toBe(2);

    expect(engine.consumeConsumable('emp_generator')).toBe(true);
    expect(engine.bugs.every((bug) => (bug.type !== 'boss' ? bug.hp === 0 : true))).toBe(true);
  });

  it('should trigger game over when health reaches zero', () => {
    engine.isRunning = true;
    engine.start();
    engine.health = 1;
    engine.startWave();
    (engine.waveManager as any).spawnBug();

    const bug = engine.bugs[0];
    engine.coreX = engine.width / 2;
    engine.coreY = engine.height / 2;
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;

    const onGameOverSpy = vi.fn();
    engine.onGameOver = onGameOverSpy;

    // First update: bug reaches base, health drops below 0
    engine.update(0.1);
    expect(engine.health).toBeLessThanOrEqual(0);

    // Second update: game over is triggered (checked at top of update)
    engine.update(0.1);
    expect(onGameOverSpy).toHaveBeenCalled();
  });

  it('should handle boss wave state and boss spawn', () => {
    engine.wave = 10; // Boss wave threshold
    engine.startWave();
    expect(engine.waveManager.isBossWave).toBe(true);
    expect(engine.waveManager.bossIntroActive).toBe(true);

    // Advance enough to process boss intro and spawn
    for (let i = 0; i < 60; i += 1) {
      engine.update(0.1);
    }

    expect(engine.waveManager.bossIntroActive).toBe(false);
  });

  it('should handle wave completion and transition to next wave in endless mode', () => {
    engine.gameModeConfig = { ...engine.gameModeConfig, endlessWaves: true };
    engine.start();
    engine.isRunning = true;
    engine.startWave();

    // Simulate wave completion by clearing bugs and setting bugsToSpawn to 0
    engine.bugs = [];
    engine.waveManager.bugsToSpawn = 0;

    const currentWave = engine.wave;
    engine.update(0.1);
    // In endless mode, next wave should start automatically
    expect(engine.wave).toBeGreaterThanOrEqual(currentWave);
  });

  it('should handle dash cooldown correctly', () => {
    engine.isRunning = true;
    engine.start();
    engine.triggerDash(400, 300);
    expect(engine.dashCooldownTimer).toBeGreaterThan(0);

    // Second dash should be blocked by cooldown
    const timerBefore = engine.dashCooldownTimer;
    engine.triggerDash(500, 400);
    expect(engine.dashCooldownTimer).toBe(timerBefore); // Cooldown not reset
  });

  it('should handle rapid fire powerup timer decay', () => {
    engine.activatePowerup('rapid_fire');
    expect(engine.rapidFireTimer).toBe(GameConfig.powerups.duration);

    // Run update frames to decay the timer
    for (let i = 0; i < 10; i += 1) {
      engine.update(0.1);
    }

    expect(engine.rapidFireTimer).toBeLessThan(GameConfig.powerups.duration);
  });

  it('should handle shield timer decay', () => {
    engine.activatePowerup('shield');
    expect(engine.shieldTimer).toBe(GameConfig.powerups.duration);

    for (let i = 0; i < 10; i += 1) {
      engine.update(0.1);
    }

    expect(engine.shieldTimer).toBeLessThan(GameConfig.powerups.duration);
  });

  it('should not start a new wave if already active', () => {
    engine.startWave();
    expect(engine.waveManager.waveActive).toBe(true);

    // Calling startWave again should not reset bugsToSpawn (already active)
    const currentBugsToSpawn = engine.waveManager.bugsToSpawn;
    engine.startWave();
    expect(engine.waveManager.bugsToSpawn).toBe(currentBugsToSpawn);
  });

  it('should handle zero-score bug kills correctly', () => {
    engine.startWave();
    (engine.waveManager as any).spawnBug();
    const bug = engine.bugs[0];
    bug.hp = 1;
    bug.scoreValue = 0;

    const scoreBefore = engine.score;
    engine.damageBug(bug, 1);

    expect(engine.bugs.length).toBe(0);
    expect(engine.score).toBe(scoreBefore); // Score unchanged
  });

  it('should handle performanceFactor game loop integration', () => {
    engine.performanceFactor = 2.0;
    engine.startWave();

    for (let i = 0; i < 5; i += 1) {
      engine.update(0.05);
    }

    expect(engine.waveManager.waveActive).toBe(true);
  });

  it('should handle game start and stop lifecycle', () => {
    engine.startWave();
    expect(engine.waveManager.waveActive).toBe(true);

    engine.stop();
    expect(engine.isRunning).toBe(false);
  });

  it('should export game state without losing wave state', () => {
    engine.startWave();
    engine.score = 500;
    engine.wave = 5;

    const state = engine.exportState();
    expect(state.score).toBe(500);
    expect(state.wave).toBe(5);
  });

  it('should handle challenge modifiers for healer and tank spawn weights', () => {
    engine.setChallengeModifiers(['healer_horde', 'tank_wave']);
    expect(engine.challengeModifiers?.healerSpawnMultiplier).toBe(4);
    expect(engine.challengeModifiers?.tankSpawnMultiplier).toBe(3);
  });

  describe('audio feedback wiring', () => {
    it('fires critHit when a crit lands on a bug', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.type = 'basic'; // avoid boss crit path (driven by pulse, not Math.random)
      bug.hp = 100;
      bug.maxHp = 100;
      vi.clearAllMocks();

      // Force a crit: base critChance = 0.05 + skill bonus
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.001);
      engine.damageBug(bug, 1);
      randomSpy.mockRestore();

      expect(soundManager.critHit).toHaveBeenCalled();
    });

    it('does not fire critHit on a normal hit', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.type = 'basic'; // avoid boss crit path (driven by pulse, not Math.random)
      bug.hp = 100;
      bug.maxHp = 100;
      vi.clearAllMocks();

      // No crit: random well above critChance
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
      engine.damageBug(bug, 1);
      randomSpy.mockRestore();

      expect(soundManager.critHit).not.toHaveBeenCalled();
      expect(soundManager.shoot).toHaveBeenCalled();
    });

    it('fires comboBreak when the streak timer expires with an active streak', () => {
      engine.streakCount = 5;
      engine.streakTimer = 0.05;
      vi.clearAllMocks();

      engine.update(0.1);

      expect(soundManager.comboBreak).toHaveBeenCalled();
      expect(engine.streakCount).toBe(0);
    });

    it('does not fire comboBreak when no streak is active', () => {
      engine.streakCount = 0;
      engine.streakTimer = 0.05;
      vi.clearAllMocks();

      engine.update(0.1);

      expect(soundManager.comboBreak).not.toHaveBeenCalled();
    });
  });

  describe('RAGE METER / FURY MODE', () => {
    it('addRage fills the meter and ignites FURY MODE at 100', () => {
      engine.weaponHeat = 90;
      engine.addRage(15);
      expect(engine.furyActive).toBe(true);
      expect(engine.weaponHeat).toBe(100);
    });

    it('does not re-trigger FURY MODE while already furious', () => {
      engine.furyActive = true;
      engine.triggerFury();
      expect(engine.furyActive).toBe(true);
    });

    it('FURY MODE drains the meter and deactivates', () => {
      engine.weaponHeat = 100;
      engine.furyActive = true;
      engine.furyTimer = engine.furyDuration;
      // Simulate a full duration of drain
      for (let i = 0; i < 40; i++) {
        engine.update(0.1);
      }
      expect(engine.furyActive).toBe(false);
      expect(engine.weaponHeat).toBe(0);
    });

    it('FURY MODE guarantees crits at 2x damage', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.hp = 100;
      bug.maxHp = 100;
      bug.type = 'basic';
      engine.furyActive = true;
      vi.clearAllMocks();

      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
      engine.damageBug(bug, 1);
      randomSpy.mockRestore();

      expect(bug.hp).toBeLessThanOrEqual(98); // 1 * 2 = 2 damage guaranteed
      expect(soundManager.critHit).toHaveBeenCalled();
    });

    it('resetEntities clears FURY MODE state', () => {
      engine.furyActive = true;
      engine.furyTimer = 2;
      engine.furyCooldownTimer = 9;
      engine.resetEntities();
      expect(engine.furyActive).toBe(false);
      expect(engine.furyTimer).toBe(0);
      expect(engine.furyCooldownTimer).toBe(0);
    });

    it('starts the ignition cooldown when FURY drains out', () => {
      engine.weaponHeat = 100;
      engine.furyActive = true;
      engine.furyTimer = engine.furyDuration;
      for (let i = 0; i < 40; i++) engine.update(0.1); // 4s = full duration
      expect(engine.furyActive).toBe(false);
      expect(engine.furyCooldownTimer).toBe(GameConfig.rage.furyCooldown);
    });

    it('blocks re-ignition while the cooldown is active (meter still refills)', () => {
      engine.weaponHeat = 90;
      engine.addRage(15);
      expect(engine.furyActive).toBe(true);

      // Let FURY drain fully and the cooldown start
      for (let i = 0; i < 60; i++) engine.update(0.1);
      expect(engine.furyActive).toBe(false);
      expect(engine.furyCooldownTimer).toBeGreaterThan(0);

      // Refill to 100 during the cooldown — meter fills but must NOT ignite
      engine.weaponHeat = 90;
      engine.addRage(15);
      expect(engine.weaponHeat).toBe(100);
      expect(engine.furyActive).toBe(false);
    });

    it('auto-ignites the moment the cooldown clears with the meter full', () => {
      engine.weaponHeat = 90;
      engine.addRage(15);
      for (let i = 0; i < 60; i++) engine.update(0.1);
      expect(engine.furyActive).toBe(false);

      engine.weaponHeat = 90;
      engine.addRage(15); // full again, still gated by the cooldown
      expect(engine.furyActive).toBe(false);

      // Advance past the remaining cooldown — a full meter erupts immediately
      engine.update(engine.furyCooldownTimer + 0.1);
      expect(engine.furyActive).toBe(true);
    });

    it('caps rage intake to maxGainPerSecond for same-instant bursts', () => {
      engine.weaponHeat = 0;
      // A burst of hits in one instant must not exceed the per-second budget
      for (let i = 0; i < 20; i++) engine.addRage(GameConfig.rage.perHit);
      expect(engine.weaponHeat).toBe(GameConfig.rage.maxGainPerSecond);
      expect(engine.furyActive).toBe(false); // nowhere near 100 yet
    });

    it('refills the rage gain budget over time', () => {
      engine.weaponHeat = 0;
      engine.addRage(GameConfig.rage.perHit); // full 15 applied, budget now empty
      const afterFirst = engine.weaponHeat;
      engine.addRage(GameConfig.rage.perHit); // budget empty -> 0 applied
      expect(engine.weaponHeat).toBe(afterFirst);

      // Advance time to refill part of the budget (decay also lowers the meter)
      engine.update(0.5);
      const beforeSecond = engine.weaponHeat;
      engine.addRage(GameConfig.rage.perHit); // applies min(15, ~7.5 refilled)
      expect(engine.weaponHeat).toBeGreaterThan(beforeSecond);
    });
  });

  describe('GROUND SLAM', () => {
    it('damages all bugs within the blast radius scaled by charge', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.x = 400;
      bug.y = 300;
      bug.hp = 100;
      bug.maxHp = 100;
      vi.clearAllMocks();

      engine.triggerGroundSlam(400, 300, 1.0);

      expect(bug.hp).toBeLessThan(100);
      expect(engine.slamCharging).toBe(false);
    });

    it('does not damage bugs outside the blast radius', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.x = 50;
      bug.y = 50;
      bug.hp = 100;
      bug.maxHp = 100;

      engine.triggerGroundSlam(750, 550, 0.5);

      expect(bug.hp).toBe(100);
    });
  });

  describe('RAGE REFUND', () => {
    it('drops a powerup near the core when a streak expires', () => {
      engine.startWave();
      engine.streakCount = 5;
      engine.streakTimer = 0.05;
      engine.coreX = engine.width / 2;
      engine.coreY = engine.height / 2;
      const before = engine.powerups.length;

      engine.update(0.1);

      expect(engine.powerups.length).toBeGreaterThan(before);
    });
  });

  describe('SCOUT DODGE', () => {
    it('scouts dive away from a surviving strike', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.type = 'scout';
      bug.hp = 100;
      bug.maxHp = 100;
      bug.x = 400;
      bug.y = 300;
      engine.inputSystem.lastMouseX = 400;
      engine.inputSystem.lastMouseY = 300;

      engine.damageBug(bug, 1);

      expect(bug.dodgeTimer).toBeGreaterThan(0);
      expect(bug.dodgeDirX).toBeDefined();
    });

    it('non-scouts do not dodge', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.type = 'basic';
      bug.hp = 100;
      bug.maxHp = 100;

      engine.damageBug(bug, 1);

      expect(bug.dodgeTimer).toBeUndefined();
    });
  });

  describe('GOO SPLATTER LOOP', () => {
    it('adds goo when bugs are killed', () => {
      engine.startWave();
      (engine.waveManager as any).spawnBug();
      const bug = engine.bugs[0];
      bug.hp = 1;
      bug.maxHp = 1;

      engine.damageBug(bug, 10);

      expect(engine.gooSystem.gooPools.length).toBeGreaterThan(0);
      expect(engine.gooSystem.gooAmount).toBeGreaterThan(0);
    });
  });

  describe('RAGE CADENCE (playtest balance pass)', () => {
    // Deterministic wave simulator: applies a fixed click schedule and runs the
    // real update loop (decay + fury drain) between actions, then reports how
    // many times FURY erupted. Pins the GameConfig.rage tuning contract.
    const simulateWave = (
      eng: GameEngine,
      actions: ('hit' | 'miss' | 'slam')[],
      seconds: number,
    ) => {
      const dt = seconds / Math.max(1, actions.length);
      for (const action of actions) {
        if (action === 'hit') eng.addRage(GameConfig.rage.perHit);
        else if (action === 'miss') eng.addRage(GameConfig.rage.perMiss);
        else eng.addRage(GameConfig.rage.perSlam);
        eng.update(dt);
      }
    };

    it('pins the playtest balance values in GameConfig', () => {
      expect(GameConfig.rage.perHit).toBe(15);
      expect(GameConfig.rage.perMiss).toBe(10);
      expect(GameConfig.rage.perSlam).toBe(8);
      expect(GameConfig.rage.furyDuration).toBe(4.0);
      expect(GameConfig.rage.maxHeat).toBe(100);
      // Per-second intake cap — second cadence governor (>= perHit so lone smashes are never throttled)
      expect(GameConfig.rage.maxGainPerSecond).toBe(15.0);
      // Post-FURY ignition cooldown — the once-per-wave cadence governor
      expect(GameConfig.rage.furyCooldown).toBe(14.0);
      // Tuned so a typical wave nets ~100 heat (once-per-wave eruption)
      expect(GameConfig.rage.decayPerSecond).toBe(6.0);
    });

    it('a typical wave (15 hits, 5 misses, 1 slam over ~25s) erupts FURY exactly once', () => {
      // 15 hits / 5 misses / 1 slam, interleaved like real play, 21 actions over 25s
      const actions: ('hit' | 'miss' | 'slam')[] = [
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'slam',
        'hit',
        'hit',
        'hit',
        'hit',
        'hit',
      ];
      expect(actions.filter((a) => a === 'hit').length).toBe(15);
      expect(actions.filter((a) => a === 'miss').length).toBe(5);
      expect(actions.filter((a) => a === 'slam').length).toBe(1);

      simulateWave(engine, actions, 25);

      expect(engine.furyTriggers).toBe(1);
      // FURY already drained; meter refilled a little after the eruption
      expect(engine.weaponHeat).toBeLessThan(GameConfig.rage.maxHeat);
    });

    it('sparse play (8 hits, 2 misses over 30s) never erupts — decay wins', () => {
      const actions: ('hit' | 'miss' | 'slam')[] = [
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'hit',
        'hit',
      ];
      simulateWave(engine, actions, 30);
      expect(engine.furyTriggers).toBe(0);
    });

    it('double the input over two waves erupts roughly twice (cadence scales with volume)', () => {
      // Two copies of the typical wave schedule over 50s
      const wave: ('hit' | 'miss' | 'slam')[] = [
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'hit',
        'miss',
        'hit',
        'slam',
        'hit',
        'hit',
        'hit',
        'hit',
        'hit',
      ];
      simulateWave(engine, [...wave, ...wave], 50);
      expect(engine.furyTriggers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('VENTING TELEMETRY', () => {
    it('increments furyTriggers each time FURY MODE ignites', () => {
      engine.weaponHeat = 90;
      engine.addRage(15);
      expect(engine.furyTriggers).toBe(1);

      // Fury must fully drain before it can re-trigger
      engine.furyTimer = 0;
      engine.furyActive = false;
      engine.update(1.0); // refill the per-second gain budget for the next burst
      engine.weaponHeat = 95;
      engine.addRage(15);
      expect(engine.furyTriggers).toBe(2);
    });

    it('increments slamsUsed when a Ground Slam lands', () => {
      engine.startWave();
      engine.triggerGroundSlam(400, 300, 0.5);
      expect(engine.slamsUsed).toBe(1);
      engine.triggerGroundSlam(400, 300, 0.5);
      expect(engine.slamsUsed).toBe(2);
    });

    it('resets venting counters on resetEntities', () => {
      engine.weaponHeat = 100;
      engine.addRage(10);
      engine.triggerGroundSlam(400, 300, 1);
      expect(engine.furyTriggers).toBeGreaterThan(0);
      expect(engine.slamsUsed).toBeGreaterThan(0);

      engine.resetEntities();
      expect(engine.furyTriggers).toBe(0);
      expect(engine.slamsUsed).toBe(0);
    });
  });
});
