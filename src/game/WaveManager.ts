import { GameEngine } from './GameEngine';
import { Bug } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';
import { MissionManager } from './MissionManager';
import { emitMissionUpdate } from './missionEvents';

export class WaveManager {
  engine: GameEngine;
  bugsToSpawn: number = 0;
  spawnTimer: number = 0;
  waveActive: boolean = false;
  intensity: number = 1;
  intensityTimer: number = 0;
  surgeActive: boolean = false;
  surgeTimer: number = 0;
  isBossWave: boolean = false;
  bossSpawned: boolean = false;
  bossWarningSounded: boolean = false;
  bossIntroActive: boolean = false;
  bossIntroTimer: number = 0;
  difficultySpeedMultiplier: number = 1;
  difficultyHpMultiplier: number = 1;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  startWave() {
    this.waveActive = true;
    const bossInterval = this.engine.challengeModifiers?.bossWaveInterval || 10;
    this.isBossWave = this.engine.gameModeConfig.bossEveryWave
      || (this.engine.wave % bossInterval === 0);
    this.bossSpawned = false;
    this.bossWarningSounded = false;
    this.bossIntroActive = this.isBossWave;
    this.bossIntroTimer = this.isBossWave ? 1.5 : 0; 
    
    this.updateBiome();

    if (this.isBossWave) {
        this.bugsToSpawn = 1 + Math.floor(this.engine.wave * 1.5); // Boss + minions
    } else {
        // Cap performance bonus to prevent feedback loop: more bugs → more kills → higher perfFactor → even more bugs
        const cappedPerf = Math.min(this.engine.performanceFactor, 1.5);
        const perfBonus = Math.floor(cappedPerf * 3);
        this.bugsToSpawn = GameConfig.waves.baseBugs + this.engine.wave * GameConfig.waves.bugsPerWave + perfBonus;
    }
    
    this.spawnTimer = 0;
    this.intensity = 1;
    this.intensityTimer = 0;
    this.surgeActive = false;
    this.surgeTimer = Math.random() * 5 + 5; 
    
    // Performance-adjusted surge frequency
    if (this.engine.performanceFactor > 1.8) {
        this.surgeTimer = 2.0; // Fast surge for power users
    }
  }

  private updateBiome() {
    const oldBiome = this.engine.currentBiome;
    if (oldBiome === 'custom_map') {
      // Keep custom map selection active throughout the session
      return;
    }
    const wave = this.engine.wave;
    const prestige = this.engine.prestigeLevel;
    
    if (prestige >= 3 && wave >= 30) this.engine.currentBiome = 'golden_spire';
    else if (wave >= 40) this.engine.currentBiome = 'void_abyss';
    else if (prestige >= 1 && wave >= 10) this.engine.currentBiome = 'golden_cache';
    else if (wave >= 25) this.engine.currentBiome = 'frostbyte';
    else if (wave >= 15) this.engine.currentBiome = 'ember_depths';
    else if (wave >= 5) this.engine.currentBiome = 'quantum_void';
    else this.engine.currentBiome = 'neon_core';

    if (oldBiome !== this.engine.currentBiome) {
        soundManager.playBiomeMusic(this.engine.currentBiome);
    }
  }

  update(dt: number) {
    if (!this.waveActive) return;

    if (this.bossIntroActive) {
        this.bossIntroTimer -= dt;
        if (this.bossIntroTimer <= 0) {
            this.bossIntroActive = false;
        }
        
        if (this.bossIntroTimer < 2.0 && !this.bossWarningSounded) {
             soundManager.bossWarning();
             this.bossWarningSounded = true;
        }
        return; // Don't spawn anything during intro
    }

    // Intensity pulses over time
    this.intensityTimer += dt;
    this.intensity = 1 + Math.sin(this.intensityTimer * 0.5) * 0.5;

    // Surges (Disabled during boss wave to keep focus on boss)
    if (!this.isBossWave) {
        this.surgeTimer -= dt;
        if (this.surgeTimer <= 0) {
            this.surgeActive = !this.surgeActive;
            this.surgeTimer = this.surgeActive ? (Math.random() * 3 + 2) : (Math.random() * 10 + 10);
        }
    } else {
        this.surgeActive = false;
    }

    if (this.bugsToSpawn > 0) {
      this.spawnTimer += dt;
      let spawnRate = Math.max(
        GameConfig.waves.minSpawnRate, 
        GameConfig.waves.baseSpawnRate - this.engine.wave * GameConfig.waves.spawnRateReduction
      );

      if (this.isBossWave) {
          spawnRate = 1.7; // Slower spawn rate for minions during boss
          if (!this.bossSpawned) {
              this.spawnBoss();
              this.bossSpawned = true;
              this.spawnTimer = -2.0; // Wait a bit after boss spawns
          }
      }

      // Dynamic spawn speed amplification: scaling up to 2.5x speed based on player's current combo count
      const comboSpawnRateFactor = 1 + Math.min(1.5, (this.engine.streakCount * 0.035) * (1 + this.engine.wave * 0.02));
      spawnRate /= (this.intensity * (this.surgeActive ? (1 + this.engine.performanceFactor) : 1) * comboSpawnRateFactor);
    
      if (this.spawnTimer > spawnRate) {
        this.spawnTimer = 0;
        // Group sizes scale with performance and surges
        const baseGroup = this.surgeActive ? 2 : 1;
        
        for (let i = 0; i < baseGroup; i++) {
          if (this.bugsToSpawn > 0) {
            this.spawnBugPattern();
          }
        }
      }
    } else if (this.engine.bugs.length === 0) {
      this.waveActive = false;
      this.engine.wave++;
      MissionManager.updateProgress('survive_waves', 1);
      emitMissionUpdate();
      const mode = this.engine.gameModeConfig;
      if (mode.endlessWaves) {
        this.engine.onWaveComplete?.();
        this.startWave();
      } else {
        this.engine.stop();
        this.engine.onWaveComplete?.();
      }
    }
  }

  private spawnBoss() {
    this.bugsToSpawn--;
    const bug = this.createBug('boss', this.engine.wave);
    
    // Assign a random boss variant
    if (GameConfig.bugs.boss.variants) {
      const variantIdx = Math.floor(Math.random() * GameConfig.bugs.boss.variants.length);
      const variant = GameConfig.bugs.boss.variants[variantIdx];
      bug.variantId = variant.id;
      bug.color = variant.color;
    }

    this.engine.bugs.push(bug);
    if (!this.bossWarningSounded) {
        soundManager.bossWarning();
        this.bossWarningSounded = true;
    }
  }

  private spawnBug() {
    if (this.bugsToSpawn <= 0) return;
    this.bugsToSpawn--;
    
    this.engine.bugs.push(this.createBug(this.decideType(this.engine.wave), this.engine.wave));
  }

  /**
   * Coordinated spawning configurations that scale with combo count.
   * Leverages geometric clusters, flank operations, and pinch arrays.
   */
  private spawnBugPattern() {
    if (this.bugsToSpawn <= 0) return;
    const combo = this.engine.streakCount;
    const r = Math.random();

    // Decide if we should execute a special spatial spawn pattern based on combo levels
    if (combo >= 40 && r < 0.40) {
      // Apex Swarm flank assault: 4 bugs spawning simultaneously from all four sides of the screen
      const count = Math.min(4, this.bugsToSpawn);
      if (count <= 0) return;

      const bugType = this.decideType(this.engine.wave);
      const width = this.engine.width;
      const height = this.engine.height;
      const margin = 100;
      
      const positions = [
        { x: width / 2, y: -margin }, // Top
        { x: width + margin, y: height / 2 }, // Right
        { x: width / 2, y: height + margin }, // Bottom
        { x: -margin, y: height / 2 } // Left
      ];

      for (let i = 0; i < count; i++) {
        if (this.bugsToSpawn <= 0) break;
        this.bugsToSpawn--;
        const pos = positions[i];
        this.engine.bugs.push(this.createBug(bugType, this.engine.wave, pos.x, pos.y));
      }
      
      // Dramatic visual pulse to accompany full flank raid
      this.engine.particleSystem.spawnShockwave(width / 2, height / 2, '#06b6d5', 50);

    } else if (combo >= 25 && r < 0.35) {
      // Delta-Formation / Triangle wedge: 3 bugs in precise spatial alignment
      const count = Math.min(3, this.bugsToSpawn);
      if (count <= 0) return;

      const bugType = this.decideType(this.engine.wave);
      const edge = Math.floor(Math.random() * 4);
      const width = this.engine.width;
      const height = this.engine.height;
      const margin = 100;

      let bx = 0, by = 0;
      let ox = 0, oy = 0;
      
      if (edge === 0) { // Top
        bx = Math.random() * (width - 200) + 100;
        by = -margin;
        ox = 70; oy = -30;
      } else if (edge === 1) { // Right
        bx = width + margin;
        by = Math.random() * (height - 200) + 100;
        ox = 30; oy = 70;
      } else if (edge === 2) { // Bottom
        bx = Math.random() * (width - 200) + 100;
        by = height + margin;
        ox = 70; oy = 30;
      } else { // Left
        bx = -margin;
        by = Math.random() * (height - 200) + 100;
        ox = -30; oy = 70;
      }

      const offsets = [
        { dx: 0, dy: 0 },
        { dx: -ox, dy: -oy },
        { dx: ox, dy: oy }
      ];

      for (let i = 0; i < count; i++) {
        if (this.bugsToSpawn <= 0) break;
        this.bugsToSpawn--;
        this.engine.bugs.push(this.createBug(bugType, this.engine.wave, bx + offsets[i].dx, by + offsets[i].dy));
      }

    } else if (combo >= 10 && r < 0.30) {
      // Twin Pinch: 2 bugs attacking from completely opposing screen boundaries
      const count = Math.min(2, this.bugsToSpawn);
      if (count <= 0) return;

      const bugType1 = this.decideType(this.engine.wave);
      const bugType2 = this.decideType(this.engine.wave);
      const width = this.engine.width;
      const height = this.engine.height;
      const margin = 100;

      const isHorizontal = Math.random() > 0.5;
      if (isHorizontal) {
        const ly = Math.random() * (height - 120) + 60;
        const ry = Math.random() * (height - 120) + 60;
        
        if (this.bugsToSpawn > 0) {
          this.bugsToSpawn--;
          this.engine.bugs.push(this.createBug(bugType1, this.engine.wave, -margin, ly));
        }
        if (this.bugsToSpawn > 0) {
          this.bugsToSpawn--;
          this.engine.bugs.push(this.createBug(bugType2, this.engine.wave, width + margin, ry));
        }
      } else {
        const tx = Math.random() * (width - 120) + 60;
        const bx = Math.random() * (width - 120) + 60;
        
        if (this.bugsToSpawn > 0) {
          this.bugsToSpawn--;
          this.engine.bugs.push(this.createBug(bugType1, this.engine.wave, tx, -margin));
        }
        if (this.bugsToSpawn > 0) {
          this.bugsToSpawn--;
          this.engine.bugs.push(this.createBug(bugType2, this.engine.wave, bx, height + margin));
        }
      }

    } else {
      // Standard spawn behavior for calm combo periods
      this.spawnBug();
    }
  }

  public spawnSpecificMinion(x: number, y: number) {
      const type = Math.random() > 0.5 ? 'mini' : 'scout';
      const bug = this.createBug(type, this.engine.wave, x, y);
      this.engine.bugs.push(bug);
      this.engine.particleSystem.spawnShockwave(x, y, '#ff0000', 40);
  }

  private decideType(wave: number): string {
    const biome = this.engine.currentBiome;
    const r = Math.random();
    const combo = this.engine.streakCount;
    
    // Skill-based boost: high combos push effective wave complexity higher
    const comboWaveBoost = Math.floor(combo / 5);
    const effectiveWave = wave + comboWaveBoost;

    // Biome specific weighting
    if (biome === 'quantum_void' && (r < 0.3 || (combo > 15 && r < 0.5))) return 'phase';
    if (biome === 'ember_depths') {
      if (r < 0.4 || (combo > 15 && r < 0.6)) return 'tank';
      if (r < 0.2 || (combo > 10 && r < 0.35)) return 'ember';
    }
    if (biome === 'frostbyte') {
      if (r < 0.4) return 'scout';
      if (r < 0.2 || (combo > 12 && r < 0.40)) return 'frost';
    }
    if (biome === 'void_abyss') {
      if (r < 0.4 || (combo > 15 && r < 0.55)) return 'ghost';
      if (r < 0.2 || (combo > 10 && r < 0.35)) return 'phase';
    }
    
    // Healer chance with combo weighting
    const healerWeight = this.engine.challengeModifiers?.healerSpawnMultiplier || 1;
    const healerCutoff = 0.05 * healerWeight + (combo > 20 ? 0.08 : 0);
    if (effectiveWave > 8 && r < healerCutoff) return 'healer';

    const types = ['basic', 'scout', 'tank', 'swarmer', 'ghost', 'phase', 'ember', 'frost'];
    
    // Early wave scaling with combo challenge overrides
    if (wave < 3) {
      if (combo > 8 && r < 0.4) {
        return r < 0.2 ? 'swarmer' : 'scout';
      }
      return 'basic';
    }
    
    if (effectiveWave < 6) {
      return r < 0.5 ? 'basic' : (r < 0.85 ? 'scout' : 'swarmer');
    }
    
    const tankWeight = this.engine.challengeModifiers?.tankSpawnMultiplier || 1;
    if (effectiveWave < 12) {
        if (r < 0.25) return 'basic';
        if (r < 0.45) return 'scout';
        if (r < 0.65) return 'swarmer';
        if (r < 0.65 + 0.2 * tankWeight + (combo > 15 ? 0.1 : 0)) return 'tank';
        return 'ghost';
    }
    
    // High combo Apex mix
    if (combo > 30 && r < 0.7) {
      const eliteTypes = ['tank', 'swarmer', 'ghost', 'phase', 'ember', 'frost', 'healer'];
      return eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
    }

    const idx = Math.floor(Math.random() * types.length);
    return types[idx];
  }

  private createBug(typeName: string, wave: number, xOverride?: number, yOverride?: number): Bug {
    let x = 0, y = 0;
    const margin = 100;
    
    if (xOverride !== undefined && yOverride !== undefined) {
      x = xOverride;
      y = yOverride;
    } else {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = Math.random() * this.engine.width; y = -margin; }
      else if (edge === 1) { x = this.engine.width + margin; y = Math.random() * this.engine.height; }
      else if (edge === 2) { x = Math.random() * this.engine.width; y = this.engine.height + margin; }
      else { x = -margin; y = Math.random() * this.engine.height; }
    }

    const bugsConfig = GameConfig.bugs as unknown as Record<string, { color: string; size: number; baseHp: number; hpPerWave: number; baseSpeed: number; speedPerWave: number; score: number }>;
    const conf = bugsConfig[typeName];
    
    // Scale stats by both Wave, Performance Factor and Combo Count
    const hp = Math.floor(
      (conf.baseHp + Math.floor(wave * conf.hpPerWave)) *
        (1 + (this.engine.performanceFactor - 1) * 0.5) *
        this.difficultyHpMultiplier
    );

    // Highly responsive bug movement speed: escalates with player combo up to an extra 45% speedup at 50 hit streak
    const comboSpeedMultiplier = 1 + Math.min(0.45, this.engine.streakCount * 0.009);
    const speed =
      (conf.baseSpeed + wave * conf.speedPerWave) *
      (1 + (this.engine.performanceFactor - 1) * 0.2) *
      this.difficultySpeedMultiplier *
      comboSpeedMultiplier;

    return {
      active: true,
      x, y,
      type: typeName,
      speed: speed,
      color: conf.color,
      size: conf.size,
      scoreValue: Math.floor(conf.score * this.engine.performanceFactor),
      hp: hp,
      maxHp: hp,
      walkCycle: Math.random() * Math.PI * 2,
      rotation: 0,
      offsetTime: Math.random() * 100,
      hitTimer: 0
    };
  }
}
