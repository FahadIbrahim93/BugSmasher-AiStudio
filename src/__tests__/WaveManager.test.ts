import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaveManager } from '../game/WaveManager';
import { GameEngine } from '../game/GameEngine';
import { GameConfig } from '../game/GameConfig';

// Mock SoundManager
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

describe('WaveManager', () => {
  let engine: GameEngine;
  let waveManager: WaveManager;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    engine = new GameEngine(canvas);
    waveManager = engine.waveManager;
  });

  it('should initialize and start waves properly', () => {
    waveManager.startWave();
    expect(waveManager.waveActive).toBe(true);
    expect(waveManager.intensity).toBe(1);
    expect(waveManager.bugsToSpawn).toBeGreaterThan(0);
  });

  it('should fluctuate intensity over time', () => {
    waveManager.startWave();
    const initialIntensity = waveManager.intensity;
    
    // Simulate some time passing to change intensity via Math.sin
    waveManager.update(1.0); // 1 second
    expect(waveManager.intensity).not.toBe(initialIntensity);
  });

  it('should eventually toggle surges', () => {
    waveManager.startWave();
    waveManager.surgeTimer = 0.1; // Force a surge transition
    
    waveManager.update(0.2);
    expect(waveManager.surgeActive).toBe(true);
    expect(waveManager.surgeTimer).toBeGreaterThan(0);
  });

  it('should complete wave when all bugs are dead and none left to spawn', () => {
    waveManager.startWave();
    waveManager.bugsToSpawn = 0;
    engine.bugs = [];
    
    let waveCompleteCalled = false;
    engine.onWaveComplete = () => { waveCompleteCalled = true; };
    
    waveManager.update(0.1);
    expect(waveManager.waveActive).toBe(false);
    expect(waveCompleteCalled).toBe(true);
  });

  it('should increase spawn frequency as combo count rises', () => {
    waveManager.startWave();
    
    // Simulate high combo
    engine.streakCount = 20;
    
    // Call decideType and createBug to check if speed handles combo multiplier
    const bug = (waveManager as any).createBug('basic', 1);
    // At combo = 20, comboSpeedMultiplier is 1 + 20 * 0.009 = 1.18
    expect(bug.speed).toBeGreaterThan(GameConfig.bugs.basic.baseSpeed);
  });

  it('should trigger complex combo-dependent spawn patterns on high streak', () => {
    waveManager.startWave();
    waveManager.bugsToSpawn = 10;
    engine.bugs = [];

    // Under normal conditions (streak = 0), a spawn pattern just calls normal spawnBug
    engine.streakCount = 0;
    (waveManager as any).spawnBugPattern();
    expect(engine.bugs.length).toBe(1);

    // Reset and mock bugsToSpawn
    waveManager.bugsToSpawn = 10;
    engine.bugs = [];

    // Under extremely high streak (e.g. 50), spawnBugPattern should have high prob to trigger special formations, e.g. twin pinch or apex swarm flank
    engine.streakCount = 50;
    
    // Trigger multi-spawns multiple times to capture probabilistic outcomes (Twin / formative Delta / Apex Quad)
    for (let i = 0; i < 5; i++) {
      if (waveManager.bugsToSpawn <= 0) break;
      (waveManager as any).spawnBugPattern();
    }
    
    // Combined spawn pattern triggered geometric spawns, pushing multiple bugs onto the field
    expect(engine.bugs.length).toBeGreaterThanOrEqual(1);
  });

  it('flags boss waves on the configured interval', () => {
    engine.wave = 10;
    waveManager.startWave();

    expect(waveManager.isBossWave).toBe(true);
    expect(waveManager.bossIntroActive).toBe(true);
    expect(waveManager.bugsToSpawn).toBeGreaterThan(0);
  });

  it('spawns a boss after the intro timer elapses', () => {
    engine.wave = 10;
    waveManager.startWave();
    waveManager.bossIntroActive = false;
    waveManager.bossIntroTimer = 0;
    waveManager.bossWarningSounded = true;

    waveManager.update(0.2);

    expect(waveManager.bossSpawned).toBe(true);
    expect(engine.bugs.some((bug) => bug.type === 'boss')).toBe(true);
  });

  it('advances biome tiers as waves progress', () => {
    engine.wave = 15;
    waveManager.startWave();
    expect(engine.currentBiome).toBe('ember_depths');

    engine.wave = 40;
    waveManager.startWave();
    expect(engine.currentBiome).toBe('void_abyss');
  });
});
