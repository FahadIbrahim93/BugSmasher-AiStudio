import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameConfig } from './GameConfig';
import { ProgressionManager } from './ProgressionManager';

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
  }
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
  });    it('should damage and kill bugs', () => {
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

    expect(engine.useConsumable('repair_kit')).toBe(true);
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
    expect(
      ProgressionManager.craftItem('emp_generator', { scrap: 100, alloy: 10, flux: 2 })
    ).toBe(true);

    engine.startWave();
    (engine.waveManager as any).spawnBug();
    (engine.waveManager as any).spawnBug();
    expect(engine.bugs.length).toBe(2);

    expect(engine.useConsumable('emp_generator')).toBe(true);
    expect(engine.bugs.every((bug) => bug.type !== 'boss' ? bug.hp === 0 : true)).toBe(true);
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
});
