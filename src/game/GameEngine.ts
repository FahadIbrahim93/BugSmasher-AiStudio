import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { WaveManager } from './WaveManager';
import { SaveManager } from './SaveManager';
import { achievementSystem } from './AchievementSystem';
import { hapticsManager } from './HapticsManager';
import { statsManager } from './database/StatsManager';
import { authManager } from './database/AuthManager';
import { cloudSaveManager } from './database/CloudSaveManager';
import { leaderboardManager } from './database/LeaderboardManager';

export interface Bug { active: boolean; x: number; y: number; type: string; speed: number; color: string; size: number; scoreValue: number; hp: number; maxHp: number; walkCycle: number; rotation: number; offsetTime: number; }
export interface Powerup { active: boolean; x: number; y: number; type: string; color: string; icon: string; life: number; maxLife: number; size: number; collection: string; }

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number = 1;
  isMobile: boolean = false;
  
  bugs: Bug[] = [];
  
  particleSystem: ParticleSystem;
  waveManager: WaveManager;
  saveManager: SaveManager;
  
  powerups: Powerup[] = [];
  
  score: number = 0;
  highScore: number = 0;
  health: number = GameConfig.player.maxHealth;
  maxHealth: number = GameConfig.player.maxHealth;
  wave: number = 1;
  
  lastTime: number = 0;
  globalTime: number = 0;
  animationFrameId: number = 0;
  
  shakeTime: number = 0;
  shakeMagnitude: number = 0;
  
  isRunning: boolean = false;
  isPaused: boolean = false;
  
  // Upgrades
  clickRadiusMultiplier: number = 1;
  autoTurretLevel: number = 0;
  
  // Active Powerups
  shieldTimer: number = 0;
  multiplierTimer: number = 0;
  rapidFireTimer: number = 0;
  freezeTimer: number = 0;
  slowMoTimer: number = 0;
  autoTurretTimer: number = 0;

  // Session tracking
  missCount: number = 0;
  totalKills: number = 0;
  totalPowerupsCollected: number = 0;
  forceNextPowerup: boolean = false;
  
  // Combo / Chain system
  chainCombo: number = 0;
  chainComboFlash: number = 0;     // seconds remaining for screen flash
  chainComboFlashColor: string = '';
  chainComboFlashAlpha: number = 0;
  
  renderer: Renderer;
  
  onGameOver?: (score: number, waves: number, kills: number) => void;
  onWaveComplete?: (completedWave: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; // Optimize by disabling alpha on root canvas
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    
    this.particleSystem = new ParticleSystem();
    this.waveManager = new WaveManager(this);
    this.saveManager = new SaveManager();
    this.highScore = this.saveManager.getHighScore();
    this.applyPrestigeBonus();
    
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    
    this.renderer = new Renderer(this);
  }
  
  applyPrestigeBonus(): void {
    const prestigeLevel = this.saveManager.getPrestigeLevel();
    const multiplier = 1 + (prestigeLevel * 0.1);
    this.maxHealth = Math.floor(GameConfig.player.maxHealth * multiplier);
    this.health = this.maxHealth;
    this.clickRadiusMultiplier = multiplier;
  }
  
  handleResize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      // Cap DPR on mobile to save fill rate
      this.isMobile = window.innerWidth < 768;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? GameConfig.canvas.mobileDprCap : GameConfig.canvas.desktopDprCap);
      
      const clientWidth = parent.clientWidth || window.innerWidth;
      const clientHeight = parent.clientHeight || window.innerHeight;
      
      this.canvas.width = clientWidth * this.dpr;
      this.canvas.height = clientHeight * this.dpr;
      this.canvas.style.width = `${clientWidth}px`;
      this.canvas.style.height = `${clientHeight}px`;

      // Reset transform before re-scaling to avoid cumulative scaling on resize
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
      this.width = clientWidth;
      this.height = clientHeight;
    }
  }
  
  start() {
    if (this.isRunning) return;
    soundManager.init();
    this.saveManager.recordGamePlayed();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.globalTime = 0;
    this.score = 0;
    this.health = this.maxHealth;
    this.wave = 1;
    this.resetEntities();
    
    this.startWave();
    this.loop(this.lastTime);
  }

  resume() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.startWave();
    this.loop(this.lastTime);
  }

  resetEntities() {
    this.bugs = [];
    this.particleSystem.reset();
    this.powerups = [];
    this.chainCombo = 0;
    this.chainComboFlash = 0;
    this.freezeTimer = 0;
    this.missCount = 0;
  }
  
  startWave() {
    this.waveManager.startWave();
  }
  
  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }
  
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
  }
  
  shake(duration: number, magnitude: number) {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
  }
  
  loop(currentTime: number) {
    if (!this.isRunning) return;
    
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    if (this.isPaused) {
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }
    
    this.globalTime += dt;
    
    this.update(dt);
    this.draw();
    
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
  
  spawnPowerup(x: number, y: number, force: boolean = false) {
    if (!force && Math.random() > GameConfig.powerups.dropChance) return;

    const types = GameConfig.powerups.types;

    // Weighted selection for better gameplay balance
    const totalWeight = types.reduce((sum, t) => sum + (t.weight ?? 1), 0);
    let roll = Math.random() * totalWeight;
    let pType = types[0];
    for (const t of types) {
      roll -= (t.weight ?? 1);
      if (roll <= 0) {
        pType = t;
        break;
      }
    }

    this.powerups.push({
      active: true,
      x, y,
      type: pType.type,
      color: pType.color,
      icon: pType.icon,
      life: GameConfig.powerups.life,
      maxLife: GameConfig.powerups.life,
      size: 15,
      collection: pType.collection
    });
  }
  
  update(dt: number) {
    if (this.health <= 0) {
      this.isRunning = false;
      const prestigePointsEarned = Math.floor(this.score / 100);
      this.saveManager.addPrestigePoints(prestigePointsEarned);
      this.saveManager.addBugsSmashed(this.totalKills);
      this.saveManager.addPlayTime(this.globalTime);
      
      achievementSystem.onGameEnd(this.score, this.missCount);
      
      // New database system integration
      const playTimeSeconds = Math.floor(this.globalTime);
      statsManager.recordGameEnd(this.score, this.wave, this.totalKills, playTimeSeconds);
      
      // Award XP and crystals based on performance
      const xpEarned = Math.floor(this.score / 50) + (this.wave * 5);
      const crystalsEarned = Math.floor(this.score / 500) + (this.wave > 5 ? 5 : 0);
      authManager.addXP(xpEarned);
      authManager.addCrystals(crystalsEarned);
      
      // Submit to leaderboard
      leaderboardManager.submitScore(this.score, this.wave);
      
      // Auto-save cloud state
      this.saveCloudState();
      
      this.onGameOver?.(this.score, this.wave, this.totalKills);
      return;
    }
    
    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.chainComboFlash > 0) {
      this.chainComboFlash -= dt;
      this.chainComboFlashAlpha = Math.max(0, this.chainComboFlash / 0.5);
    }
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.slowMoTimer > 0) this.slowMoTimer -= dt;
    
    this.waveManager.update(dt);
    
    if (this.autoTurretLevel > 0 || this.rapidFireTimer > 0) {
      this.autoTurretTimer += dt;
      let fireRate = Math.max(GameConfig.upgrades.turret.minFireRate, GameConfig.upgrades.turret.baseFireRate - this.autoTurretLevel * GameConfig.upgrades.turret.fireRateReduction);
      let isRapidFire = false;
      if (this.rapidFireTimer > 0) {
        fireRate = 0.05; // Rapid fire strongly overrides normal fire rate
        isRapidFire = true;
      }
      if (this.autoTurretTimer > fireRate && this.bugs.length > 0) {
        this.autoTurretTimer = 0;
        this.fireAutoTurret(isRapidFire);
      }
    }
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const dx = centerX - bug.x;
      const dy = centerY - bug.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        if (this.shieldTimer <= 0) {
          this.health -= GameConfig.player.hitDamage;
          this.shake(0.5, 20);
          soundManager.hitBase();
        } else {
          this.shake(0.2, 5);
          soundManager.splat();
        }
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', 150);
        this.bugs.splice(i, 1);
        continue;
      }
      
      let vx = (dx / dist) * bug.speed;
      let vy = (dy / dist) * bug.speed;

      // Freeze powerup slows all bugs
      if (this.freezeTimer > 0) {
        vx *= 0.35;
        vy *= 0.35;
      } else if (this.slowMoTimer > 0) {
        vx *= GameConfig.powerups.slowMoFactor;
        vy *= GameConfig.powerups.slowMoFactor;
      }
      
      if (bug.type === 'scout') {
        const perpX = -vy;
        const perpY = vx;
        const erratic = Math.sin(this.globalTime * 10 + bug.offsetTime) * 0.5;
        vx += perpX * erratic;
        vy += perpY * erratic;
      }
      
      bug.rotation = Math.atan2(vy, vx) - Math.PI / 2;
      bug.x += vx * dt;
      bug.y += vy * dt;
      bug.walkCycle += bug.speed * dt * 0.2;
    }
    
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life -= dt;
      if (p.life <= 0) this.powerups.splice(i, 1);
    }
    
    this.particleSystem.update(dt);
  }
  
  fireAutoTurret(isRapidFire: boolean = false) {
    let closest = null;
    let minDist = Infinity;
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    for (const bug of this.bugs) {
      const dist = Math.sqrt((bug.x - cx)**2 + (bug.y - cy)**2);
      if (dist < minDist) {
        minDist = dist;
        closest = bug;
      }
    }
    
    if (closest) {
      soundManager.shoot();
      if (isRapidFire) {
        this.shake(0.05, 3);
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#ff00ff');
      } else {
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#00ffcc');
      }
      this.damageBug(closest, 1);
    }
  }
  
  damageBug(bug: Bug, amount: number) {
    bug.hp -= amount;
    if (bug.hp <= 0) {
      const idx = this.bugs.indexOf(bug);
      if (idx > -1) {
        this.totalKills++;
        statsManager.recordKill();
        achievementSystem.onKill();
        this.chainCombo++;
        
        // Track combo achievement
        achievementSystem.onCombo(this.chainCombo);
        
        // Milestone flash effects
        const milestones: Record<number, { color: string; size: number; dur: number }> = {
          3:  { color: '#00ffcc', size: 400, dur: 0.4 },
          5:  { color: '#ffaa00', size: 600, dur: 0.5 },
          10: { color: '#ff4444', size: 900, dur: 0.6 },
        };
        const m = milestones[this.chainCombo];
        if (m) {
          this.chainComboFlash = m.dur;
          this.chainComboFlashColor = m.color;
          this.chainComboFlashAlpha = 1;
          this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, m.color, m.size);
          this.shake(m.dur * 0.3, 15);
        }
        
        const mult = this.multiplierTimer > 0 ? 2 : 1;
        const pointsEarned = bug.scoreValue * mult;
        this.score += pointsEarned;

        // Spawn damage number popup
        this.particleSystem.spawnDamageNumber(bug.x, bug.y - 20, pointsEarned, mult > 1 ? '#ff00ff' : '#ffff00');
        
        // Trigger haptics
        if (this.chainCombo >= 3) {
          hapticsManager.combo();
        } else {
          hapticsManager.hit();
        }
        
        // Update high score
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.saveManager.updateHighScore(this.highScore);
        }
        
        soundManager.splat();
        this.shake(0.15, 8);
        this.particleSystem.spawnSplatter(bug.x, bug.y, bug.color);
        this.particleSystem.spawnGibs(bug.x, bug.y, bug.color);
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 100);
        
        if (this.forceNextPowerup) {
           this.forceNextPowerup = false;
           this.spawnPowerup(bug.x, bug.y, true);
        } else {
           this.spawnPowerup(bug.x, bug.y);
        }
        
        this.bugs.splice(idx, 1);
      }
    } else {
      soundManager.shoot();
      this.particleSystem.spawnGibs(bug.x, bug.y, bug.color, 3);
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 30);
    }
  }
  
  draw() {
    this.renderer.draw();
  }
  
  handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    if (this.isPaused) return;
    soundManager.init();
    this.processClick(e.clientX, e.clientY);
  }
  
  handlePointerMove(e: PointerEvent) {
    if (!this.isRunning || !this.waveManager.waveActive || this.isPaused) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.collection === 'hover') {
        const dist = Math.sqrt((p.x - x)**2 + (p.y - y)**2);
        if (dist < p.size * 3) { // Slightly larger collection radius for hover
          this.activatePowerup(p.type);
          this.powerups.splice(i, 1);
        }
      }
    }
  }

  processClick(clientX: number, clientY: number) {
    if (!this.isRunning || !this.waveManager.waveActive || this.isPaused) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const dist = Math.sqrt((p.x - x)**2 + (p.y - y)**2);
      if (dist < p.size * 2) {
        this.activatePowerup(p.type);
        this.powerups.splice(i, 1);
        return;
      }
    }
    
    let hit = false;
    
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const dx = bug.x - x;
      const dy = bug.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < bug.size * GameConfig.player.baseClickRadiusMultiplier * this.clickRadiusMultiplier) {
        hit = true;
        this.damageBug(bug, 1);
        break;
      }
    }
    
    if (!hit) {
      this.chainCombo = 0;
      this.missCount++;
      hapticsManager.error();
      soundManager.shoot();
      this.particleSystem.spawnMissParticles(x, y);
      this.particleSystem.spawnClickRipple(x, y);
    }
  }
  
  activatePowerup(type: string) {
    this.totalPowerupsCollected++;
    statsManager.recordPowerupCollected();
    if (type === 'nuke') {
      soundManager.nuke();
      this.shake(1.5, 40); // Massive screen shake
      this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffaa00', 1000);
      for (let i = this.bugs.length - 1; i >= 0; i--) {
        this.damageBug(this.bugs[i], 100);
      }
    } else if (type === 'spike_burst') {
      soundManager.powerup();
      this.shake(0.7, 25);
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      this.particleSystem.spawnShockwave(centerX, centerY, '#ff00ff', 450);

      // Burst damages closest bugs instantly
      const targets = [...this.bugs]
        .sort((a, b) => ((a.x - centerX) ** 2 + (a.y - centerY) ** 2) - ((b.x - centerX) ** 2 + (b.y - centerY) ** 2))
        .slice(0, GameConfig.powerups.spikeBurstTargets);
      targets.forEach(b => this.damageBug(b, 2));
    } else {
      soundManager.powerup();
      this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffffff', 300);
      if (type === 'shield') {
        this.shieldTimer = GameConfig.powerups.duration;
      } else if (type === 'multiplier') {
        this.multiplierTimer = GameConfig.powerups.duration;
      } else if (type === 'rapid_fire') {
        this.rapidFireTimer = GameConfig.powerups.duration;
      } else if (type === 'freeze') {
        this.freezeTimer = GameConfig.powerups.freezeDuration;
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#66ccff', 500);
      } else if (type === 'slow_mo') {
        this.slowMoTimer = GameConfig.powerups.slowMoDuration;
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#9966ff', 500);
      }
    }
  }
  
  private saveCloudState(): void {
    const profile = authManager.getProfile();
    if (!profile) return;
    
    const gameState = {
      score: this.score,
      wave: this.wave,
      health: this.health,
      upgrades: {
        health: Math.floor(this.maxHealth / 50 - 1),
        radius: Math.floor(this.clickRadiusMultiplier * 10),
        turret: this.autoTurretLevel,
      },
      unlocked_biomes: this.saveManager.getUnlockedBiomes(),
      equipped_cosmetics: {
        core: 'core_default',
        bug: 'default',
        trail: 'trail_default',
        ui: 'ui_default',
      },
      prestige_level: this.saveManager.getPrestigeLevel(),
      achievement_unlocks: [],
      daily_challenge_date: new Date().toISOString().split('T')[0],
      daily_challenge_completed: this.saveManager.getDailyChallengeCompleted() === new Date().toISOString().split('T')[0],
    };
    
    cloudSaveManager.saveGame(gameState);
  }
}
