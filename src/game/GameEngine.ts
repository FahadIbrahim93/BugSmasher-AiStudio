import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { assetManager } from './AssetManager';
import { WaveManager } from './WaveManager';

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
  
  powerups: Powerup[] = [];
  
  score: number = 0;
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
  autoTurretTimer: number = 0;

  // Tutorial tracking
  totalKills: number = 0;
  totalPowerupsCollected: number = 0;
  forceNextPowerup: boolean = false;
  
  renderer: Renderer;
  
  onGameOver?: (score: number) => void;
  onWaveComplete?: () => void;

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
    
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    
    this.renderer = new Renderer(this);
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
      
      this.ctx.scale(this.dpr, this.dpr);
      this.width = clientWidth;
      this.height = clientHeight;
    }
  }
  
  start() {
    if (this.isRunning) return;
    soundManager.init();
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
    
    const pType = types[Math.floor(Math.random() * types.length)];
    
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
      this.onGameOver?.(this.score);
      return;
    }
    
    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    
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
        const mult = this.multiplierTimer > 0 ? 2 : 1;
        this.score += bug.scoreValue * mult;
        
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
      soundManager.shoot();
      this.particleSystem.spawnMissParticles(x, y);
    }
  }
  
  activatePowerup(type: string) {
    this.totalPowerupsCollected++;
    if (type === 'nuke') {
      soundManager.nuke();
      this.shake(1.5, 40); // Massive screen shake
      this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffaa00', 1000);
      for (let i = this.bugs.length - 1; i >= 0; i--) {
        this.damageBug(this.bugs[i], 100);
      }
    } else {
      soundManager.powerup();
      this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffffff', 300);
      if (type === 'shield') {
        this.shieldTimer = GameConfig.powerups.duration;
      } else if (type === 'multiplier') {
        this.multiplierTimer = GameConfig.powerups.duration;
      } else if (type === 'rapid_fire') {
        this.rapidFireTimer = GameConfig.powerups.duration;
      }
    }
  }
}
