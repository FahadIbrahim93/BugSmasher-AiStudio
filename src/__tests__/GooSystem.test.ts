import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { GooSystem } from '../game/GooSystem';
import { GameConfig } from '../game/GameConfig';

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

describe('GooSystem', () => {
  let canvas: HTMLCanvasElement;
  let engine: GameEngine;
  let goo: GooSystem;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    engine = new GameEngine(canvas);
    goo = engine.gooSystem;
  });

  it('starts empty and clean', () => {
    expect(goo.gooPools.length).toBe(0);
    expect(goo.gooAmount).toBe(0);
    expect(goo.isCollecting).toBe(false);
    expect(goo.slowdownFactor).toBe(1.0);
  });

  it('accumulates goo pools and contamination when bugs are smashed', () => {
    goo.addGoo(100, 100, 15, '#4CAF50');
    expect(goo.gooPools.length).toBe(1);
    expect(goo.gooAmount).toBeGreaterThan(0);
    expect(goo.gooPools[0].x).toBe(100);
    expect(goo.gooPools[0].y).toBe(100);
    expect(goo.gooPools[0].active).toBe(true);
  });

  it('larger bugs contribute more contamination', () => {
    goo.addGoo(0, 0, 8, '#ffaa00');
    const small = goo.gooAmount;
    goo.reset();
    goo.addGoo(0, 0, 40, '#ff00ff');
    expect(goo.gooAmount).toBeGreaterThan(small);
  });

  it('caps contamination at 100', () => {
    for (let i = 0; i < 100; i++) {
      goo.addGoo(i * 3, i * 3, 40, '#ffffff');
    }
    expect(goo.gooAmount).toBeLessThanOrEqual(100);
  });

  it('decays slowly when not collecting', () => {
    goo.addGoo(0, 0, 30, '#ff3300');
    const before = goo.gooAmount;
    goo.update(1.0);
    expect(goo.gooAmount).toBeLessThan(before);
  });

  it('collects quickly and recycles into resources when Q is held', () => {
    goo.addGoo(100, 100, 30, '#ff3300');
    const before = goo.gooAmount;
    goo.isCollecting = true;
    // Long sweep should drain a chunk and spawn resource pickups
    for (let i = 0; i < 10; i++) {
      goo.update(0.5);
    }
    expect(goo.gooAmount).toBeLessThan(before);
    expect(engine.resources.length).toBeGreaterThan(0);
  });

  it('slows click cadence when heavily contaminated', () => {
    goo.addGoo(0, 0, 50, '#ffffff');
    goo.gooAmount = 90;
    expect(goo.slowdownFactor).toBeLessThan(1.0);
    expect(goo.slowdownFactor).toBeGreaterThanOrEqual(0.65);
  });

  it('dissolves pools when sweeping', () => {
    goo.addGoo(0, 0, 20, '#00ff66');
    const poolCount = goo.gooPools.length;
    goo.isCollecting = true;
    goo.update(2.0);
    expect(goo.gooPools.length).toBeLessThanOrEqual(poolCount);
  });

  it('resets to a clean field', () => {
    goo.addGoo(0, 0, 30, '#ff3300');
    goo.isCollecting = true;
    goo.reset();
    expect(goo.gooPools.length).toBe(0);
    expect(goo.gooAmount).toBe(0);
    expect(goo.isCollecting).toBe(false);
  });

  it('counts recycled chunks as gooSweeps and resets them', () => {
    goo.addGoo(0, 0, 30, '#ff3300');
    goo.isCollecting = true;
    for (let i = 0; i < 5; i++) {
      goo.update(0.5);
    }
    expect(goo.gooSweeps).toBeGreaterThan(0);

    goo.reset();
    expect(goo.gooSweeps).toBe(0);
  });

  // ---- Balance pins: goo decay rates live in GameConfig ----

  it('pins goo balance values in GameConfig', () => {
    expect(GameConfig.goo.evaporationPerSecond).toBe(0.4);
    expect(GameConfig.goo.collectPerSecond).toBe(30);
    expect(GameConfig.goo.poolLife).toBe(30);
    expect(GameConfig.goo.maxAddPerPool).toBe(6);
    expect(GameConfig.goo.addPerSize).toBe(0.1);
  });

  it('evaporates exactly evaporationPerSecond while idle', () => {
    goo.gooAmount = 50;
    goo.update(1.0);
    expect(goo.gooAmount).toBeCloseTo(50 - GameConfig.goo.evaporationPerSecond, 5);
  });

  it('collects exactly collectPerSecond while sweeping', () => {
    goo.gooAmount = 60;
    goo.isCollecting = true;
    goo.update(1.0);
    expect(goo.gooAmount).toBeCloseTo(60 - GameConfig.goo.collectPerSecond, 5);
  });

  it('adds goo proportional to size capped at maxAddPerPool', () => {
    goo.addGoo(0, 0, 100, '#ffffff'); // size 100 → would be 10, capped at 6
    expect(goo.gooAmount).toBe(GameConfig.goo.maxAddPerPool);

    goo.reset();
    goo.addGoo(0, 0, 20, '#ffffff'); // size 20 → exactly 2
    expect(goo.gooAmount).toBeCloseTo(20 * GameConfig.goo.addPerSize, 5);
  });

  it('dissolves pools at poolLifeCollectMultiplier speed while sweeping', () => {
    goo.addGoo(0, 0, 20, '#00ff66');
    const lifeBefore = goo.gooPools[0].life;
    goo.isCollecting = true;
    goo.update(1.0);
    const drained = lifeBefore - goo.gooPools[0].life;
    expect(drained).toBeCloseTo(1 + GameConfig.goo.poolLifeCollectMultiplier, 5);
  });
});
