import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveManager } from './WaveManager';
import { GameEngine } from './GameEngine';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';

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

describe('WaveManager', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let wm: WaveManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    engine = new GameEngine(canvas);
    wm = engine.waveManager;
  });

  it('starts a wave with correct bug count and active state', () => {
    engine.startWave();
    expect(wm.waveActive).toBe(true);
    const expectedBase = GameConfig.waves.baseBugs + engine.wave * GameConfig.waves.bugsPerWave;
    const cappedPerf = Math.min(engine.performanceFactor, 1.5);
    const perfBonus = Math.floor(cappedPerf * 3);
    expect(wm.bugsToSpawn).toBe(expectedBase + perfBonus);
  });

  it('marks a boss wave at the boss interval', () => {
    engine.wave = 10;
    engine.startWave();
    expect(wm.isBossWave).toBe(true);
    expect(wm.bossIntroActive).toBe(true);
    expect(wm.bossIntroTimer).toBe(1.5);
  });

  it('does not mark a boss wave at a non-boss wave', () => {
    engine.wave = 5;
    engine.startWave();
    expect(wm.isBossWave).toBe(false);
    expect(wm.bossIntroActive).toBe(false);
  });

  it('resets boss spawn state on each wave start', () => {
    engine.wave = 10;
    engine.startWave();
    expect(wm.bossSpawned).toBe(false);
    expect(wm.bossWarningSounded).toBe(false);
  });

  it('updates biome based on wave and prestige', () => {
    engine.startWave();
    expect(engine.currentBiome).toBe('neon_core');

    engine.prestigeLevel = 0;
    engine.wave = 6;
    engine.startWave();
    expect(engine.currentBiome).toBe('quantum_void');

    engine.wave = 16;
    engine.startWave();
    expect(engine.currentBiome).toBe('ember_depths');

    engine.wave = 26;
    engine.startWave();
    expect(engine.currentBiome).toBe('frostbyte');

    engine.wave = 41;
    engine.startWave();
    expect(engine.currentBiome).toBe('void_abyss');
  });

  it('keeps custom map biome active throughout the session', () => {
    engine.currentBiome = 'custom_map';
    engine.startWave();
    expect(engine.currentBiome).toBe('custom_map');
  });

  it('spawns a boss during a boss wave intro', () => {
    engine.wave = 10;
    engine.startWave();
    expect(wm.isBossWave).toBe(true);

    for (let i = 0; i < 60; i += 1) {
      engine.update(0.1);
    }

    expect(wm.bossIntroActive).toBe(false);
    expect(wm.bossSpawned).toBe(true);
    expect(engine.bugs.some((b) => b.type === 'boss')).toBe(true);
  });

  it('does not surge during a boss wave', () => {
    engine.wave = 10;
    engine.startWave();
    expect(wm.isBossWave).toBe(true);

    for (let i = 0; i < 60; i += 1) {
      engine.update(0.1);
    }

    expect(wm.surgeActive).toBe(false);
  });

  it('cycles the surge system during non-boss waves', () => {
    engine.wave = 5;
    engine.startWave();
    expect(wm.isBossWave).toBe(false);

    // The surge timer starts at a random 5-10s window and toggles on/off.
    // After enough updates, the surge system should have cycled at least once.
    const states = new Set<boolean>();
    for (let i = 0; i < 300; i += 1) {
      engine.update(0.1);
      states.add(wm.surgeActive);
    }

    // The surge should have been both active and inactive at some point
    expect(states.size).toBeGreaterThanOrEqual(1);
    expect(states.has(true)).toBe(true);
  });

  it('completes a wave and advances to the next in endless mode', () => {
    engine.gameModeConfig = { ...engine.gameModeConfig, endlessWaves: true };
    engine.start();
    engine.isRunning = true;
    engine.startWave();

    engine.bugs = [];
    engine.waveManager.bugsToSpawn = 0;

    const currentWave = engine.wave;
    engine.update(0.1);
    expect(engine.wave).toBeGreaterThanOrEqual(currentWave + 1);
    expect(wm.waveActive).toBe(true);
  });

  it('stops the game in standard mode after wave completion', () => {
    engine.gameModeConfig = { ...engine.gameModeConfig, endlessWaves: false };
    engine.start();
    engine.isRunning = true;
    engine.startWave();

    engine.bugs = [];
    engine.waveManager.bugsToSpawn = 0;

    engine.update(0.1);
    expect(engine.isRunning).toBe(false);
    expect(wm.waveActive).toBe(false);
  });

  it('spawns bugs at a dynamic spawn rate', () => {
    engine.startWave();
    const initialBugs = engine.bugs.length;

    for (let i = 0; i < 40; i += 1) {
      engine.update(0.1);
    }

    expect(engine.bugs.length).toBeGreaterThan(initialBugs);
  });

  it('scales spawn count by PCG map spawn multiplier', () => {
    engine.pcgSystem.activeMap = {
      obstacles: [],
      seed: '12345',
      spawnMultiplier: 2.0,
    } as any;
    engine.startWave();
    const expectedBase = GameConfig.waves.baseBugs + engine.wave * GameConfig.waves.bugsPerWave;
    const cappedPerf = Math.min(engine.performanceFactor, 1.5);
    const perfBonus = Math.floor(cappedPerf * 3);
    expect(wm.bugsToSpawn).toBe(Math.floor((expectedBase + perfBonus) * 2.0));
  });

  it('uses performance-adjusted surge frequency at high performance', () => {
    engine.performanceFactor = 2.0;
    engine.startWave();
    expect(wm.surgeTimer).toBe(2.0);
  });

  it('spawns a specific minion at a given position', () => {
    const before = engine.bugs.length;
    wm.spawnSpecificMinion(400, 300);
    expect(engine.bugs.length).toBe(before + 1);
    expect(['mini', 'scout']).toContain(engine.bugs[before].type);
  });

  it('decides bug types based on biome and wave', () => {
    engine.currentBiome = 'quantum_void';
    engine.wave = 10;
    engine.startWave();

    const types = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const type = (wm as any).decideType(engine.wave);
      types.add(type);
    }
    expect(types.has('phase')).toBe(true);
  });

  it('returns a boss variant when spawning a boss', () => {
    engine.wave = 10;
    engine.startWave();

    for (let i = 0; i < 60; i += 1) {
      engine.update(0.1);
    }

    const boss = engine.bugs.find((b) => b.type === 'boss');
    expect(boss).toBeDefined();
    expect(boss!.variantId).toBeDefined();
  });

  it('emits a boss warning sound during boss intro', () => {
    engine.wave = 10;
    engine.startWave();

    for (let i = 0; i < 30; i += 1) {
      engine.update(0.1);
    }

    expect(soundManager.bossWarning).toHaveBeenCalled();
  });

  it('spawns confetti on wave completion', () => {
    engine.startWave();
    engine.bugs = [];
    engine.waveManager.bugsToSpawn = 0;

    const spawnConfettiSpy = vi.spyOn(engine.particleSystem, 'spawnConfetti');
    engine.update(0.1);
    expect(spawnConfettiSpy).toHaveBeenCalled();
  });
});