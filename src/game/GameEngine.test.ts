import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { GameConfig } from './GameConfig';

// Mock the sound manager to prevent AudioContext errors in jsdom
vi.mock('./SoundManager', () => ({
  soundManager: {
    init: vi.fn(),
    shoot: vi.fn(),
    splat: vi.fn(),
    hitBase: vi.fn(),
    powerup: vi.fn(),
    upgrade: vi.fn(),
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
    expect(engine.waveManager.bugsToSpawn).toBe(GameConfig.waves.baseBugs + 1 * GameConfig.waves.bugsPerWave);
    
    (engine.waveManager as any).spawnBug();
    expect(engine.bugs.length).toBe(1);
    expect(engine.waveManager.bugsToSpawn).toBe(GameConfig.waves.baseBugs + 1 * GameConfig.waves.bugsPerWave - 1);
    
    const bug = engine.bugs[0];
    expect(bug.active).toBe(true);
    expect(['basic', 'scout', 'tank']).toContain(bug.type);
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
    
    expect(bug.hp).toBe(0);
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
    // Move bug to center (base)
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
    bug.x = engine.width / 2;
    bug.y = engine.height / 2;
    
    engine.activatePowerup('shield');
    const initialHealth = engine.health;
    
    engine.update(0.1);
    
    expect(engine.bugs.length).toBe(0); // Bug should be destroyed
    expect(engine.health).toBe(initialHealth); // Health should not decrease
  });
});
