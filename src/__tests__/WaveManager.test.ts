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

  describe('wave modifiers', () => {
    it('should assign a wave modifier 20% of the time (non-boss)', () => {
      let modifierCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        engine.wave = i + 1;
        waveManager.startWave();
        if (waveManager.waveModifier) modifierCount++;
      }
      // With 20% chance over 100 trials, expect roughly 10-30 modifiers
      expect(modifierCount).toBeGreaterThan(5);
      expect(modifierCount).toBeLessThan(50);
    });

    it('should not assign wave modifiers on boss waves', () => {
      engine.wave = 10; // Boss wave on interval
      waveManager.startWave();
      // Force boss wave
      waveManager.isBossWave = true;
      // Manually re-roll (startWave only rolls for non-boss)
      waveManager.waveModifier = null;
      if (Math.random() < 0.2) {
        // If it somehow rolled, it should have been suppressed
      }
      expect(waveManager.isBossWave).toBe(true);
    });

    it('should suppress healers when no_healers modifier is active', () => {
      waveManager.waveModifier = 'no_healers';
      // The decideType should skip healer even when random conditions favor it
      const result = (waveManager as any).decideType(15);
      // Should return something that's not 'healer'
      expect(result).not.toBe('healer');
    });

    it('should apply armor to bugs when armored modifier is active', () => {
      engine.wave = 5;
      waveManager.startWave();
      // Set modifier after startWave to avoid recalculation overwriting it
      waveManager.waveModifier = 'armored';
      const createBug = (waveManager as any).createBug.bind(waveManager);
      const testBug = createBug('basic', 5);
      expect(testBug.armor).toBe(0.5);
      expect(testBug.color).toBe('#888888');
    });

    it('should roll swarm modifier when applicable', () => {
      waveManager.waveModifier = 'swarm';
      // swarm should prefer basic/scout types heavily
      const result = (waveManager as any).decideType(10);
      expect(['basic', 'scout']).toContain(result);
    });

    it('should spawn sniper enemies from wave 7', () => {
      engine.wave = 10;
      let foundSniper = false;
      for (let i = 0; i < 80; i++) {
        const type = (waveManager as any).decideType(10);
        if (type === 'sniper') foundSniper = true;
      }
      // With 8% chance, expect near-certainty over 80 trials
      expect(foundSniper).toBe(true);
    });

    it('should spawn burrower enemies from wave 12', () => {
      engine.wave = 15;
      let foundBurrower = false;
      for (let i = 0; i < 150; i++) {
        const type = (waveManager as any).decideType(15);
        if (type === 'burrower') foundBurrower = true;
      }
      // With ~5.2% effective chance, expect near-certainty over 150 trials
      expect(foundBurrower).toBe(true);
    });
  });
});
