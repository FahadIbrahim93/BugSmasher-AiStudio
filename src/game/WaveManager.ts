import { GameConfig } from './GameConfig';
import { GameEngine, Bug } from './GameEngine';
import { biomeManager } from './BiomeManager';

export class WaveManager {
  engine: GameEngine;
  bugsToSpawn: number = 0;
  spawnTimer: number = 0;
  waveActive: boolean = false;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  startWave() {
    this.waveActive = true;
    this.bugsToSpawn = GameConfig.waves.baseBugs + this.engine.wave * GameConfig.waves.bugsPerWave;
    this.spawnTimer = 0;
  }

  update(dt: number) {
    if (!this.waveActive) return;

    if (this.bugsToSpawn > 0) {
      this.spawnTimer += dt;
      const spawnRate = Math.max(
        GameConfig.waves.minSpawnRate, 
        GameConfig.waves.baseSpawnRate - this.engine.wave * GameConfig.waves.spawnRateReduction
      );
      
      if (this.spawnTimer > spawnRate) {
        this.spawnTimer = 0;
        this.spawnBug();
      }
    } else if (this.engine.bugs.length === 0) {
      this.waveActive = false;
      const completedWave = this.engine.wave;
      this.engine.saveManager.setHighestWave(completedWave);
      
      const newlyUnlocked = biomeManager.checkUnlocks(
        completedWave,
        this.engine.saveManager.getHighScore(),
        this.engine.saveManager.getPrestigeLevel()
      );
      
      for (const biomeId of newlyUnlocked) {
        this.engine.saveManager.unlockBiome(biomeId);
      }
      
      this.engine.wave++;
      this.engine.stop();
      this.engine.onWaveComplete?.(completedWave);
    }
  }

  private spawnBug() {
    if (this.bugsToSpawn <= 0) return;
    this.bugsToSpawn--;
    
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * this.engine.width; y = -50; }
    else if (edge === 1) { x = this.engine.width + 50; y = Math.random() * this.engine.height; }
    else if (edge === 2) { x = Math.random() * this.engine.width; y = this.engine.height + 50; }
    else { x = -50; y = Math.random() * this.engine.height; }
    
    const wave = this.engine.wave;
    
    const types = [
      { type: 'basic', color: GameConfig.bugs.basic.color, speed: GameConfig.bugs.basic.baseSpeed + wave * GameConfig.bugs.basic.speedPerWave, size: GameConfig.bugs.basic.size, score: GameConfig.bugs.basic.score, hp: GameConfig.bugs.basic.baseHp + Math.floor(wave * GameConfig.bugs.basic.hpPerWave) },
      { type: 'scout', color: GameConfig.bugs.scout.color, speed: GameConfig.bugs.scout.baseSpeed + wave * GameConfig.bugs.scout.speedPerWave, size: GameConfig.bugs.scout.size, score: GameConfig.bugs.scout.score, hp: GameConfig.bugs.scout.baseHp + Math.floor(wave * GameConfig.bugs.scout.hpPerWave) },
      { type: 'tank', color: GameConfig.bugs.tank.color, speed: GameConfig.bugs.tank.baseSpeed + wave * GameConfig.bugs.tank.speedPerWave, size: GameConfig.bugs.tank.size, score: GameConfig.bugs.tank.score, hp: GameConfig.bugs.tank.baseHp + Math.floor(wave * GameConfig.bugs.tank.hpPerWave) }
    ];
    
    let type;
    const r = Math.random();
    if (wave < 3) {
      type = types[0];
    } else if (wave < 6) {
      type = r < 0.7 ? types[0] : types[1];
    } else {
      if (r < 0.5) type = types[0];
      else if (r < 0.8) type = types[1];
      else type = types[2];
    }
    
    this.engine.bugs.push({
      active: true,
      x, y,
      type: type.type,
      speed: type.speed,
      color: type.color,
      size: type.size,
      scoreValue: type.score,
      hp: type.hp,
      maxHp: type.hp,
      walkCycle: Math.random() * Math.PI * 2,
      rotation: 0,
      offsetTime: Math.random() * 100
    });
  }
}
