import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { assetManager } from './AssetManager';
import { WaveManager } from './WaveManager';
import { GameSaveData, SaveManager } from './SaveManager';
import { StatsManager } from './StatsManager';
import { ProgressionManager } from './ProgressionManager';
import { ResourceType, RESOURCES } from './ResourceTypes';
import { AchievementManager } from './AchievementManager';
import { InputSystem } from './InputSystem';
import { Bug, Hazard, Powerup, ResourcePickup } from './GameTypes';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number = 1;
  isMobile: boolean = false;
  highFidelityVFX: boolean = true;
  
  bugs: Bug[] = [];
  hazards: Hazard[] = [];
  
  particleSystem: ParticleSystem;
  waveManager: WaveManager;
  
  powerups: Powerup[] = [];
  resources: ResourcePickup[] = [];
  
  score: number = 0;
  health: number = GameConfig.player.maxHealth;
  maxHealth: number = GameConfig.player.maxHealth;
  wave: number = 1;
  
  lastTime: number = 0;
  globalTime: number = 0;
  animationFrameId: number = 0;
  
  shakeTime: number = 0;
  shakeMagnitude: number = 0;
  shakeX: number = 0;
  shakeY: number = 0;
  
  hitStopTimer: number = 0;
  
  isRunning: boolean = false;
  isPaused: boolean = false;
  
  currentBiome: string = 'neon_core';
  prestigeLevel: number = 0;
  
  // Upgrades
  clickRadiusMultiplier: number = 1;
  autoTurretLevel: number = 0;
  healthLevel: number = 0;
  radiusLevel: number = 0;
  
  damageMultiplier: number = 1.0;
  
  clickCooldown: number = 0;
  weaponHeat: number = 0;
  isOverheated: boolean = false;
  
  // Powerups
  shieldTimer: number = 0;
  multiplierTimer: number = 0;
  rapidFireTimer: number = 0;
  autoTurretTimer: number = 0;
  slowMoTimer: number = 0;
  overdriveTimer: number = 0;
  freezeTimer: number = 0;
  magnetTimer: number = 0;
  spikeBurstTimer: number = 0;
  controlDistortionTimer: number = 0; // New mechanic for moth boss
  hazardSlowdown: number = 1.0;
  
  // Session Stats for Achievements
  swarmerKills: number = 0;
  healerKills: number = 0;
  killsInSubwave: number = 0;
  missedClicksInSubwave: number = 0;
  
  // Performance Scaling Metrics
  streakCount: number = 0;
  streakTimer: number = 0;
  lastHitTime: number = 0;
  performanceFactor: number = 1.0; // 0.5 to 2.5

  playTimeAccumulator: number = 0;
  
  baseScale: number = 1.0;
  baseRecoil: number = 0;
  baseRecoilAngle: number = 0;
  
  glitchTimer: number = 0;
  upgradeFlash: number = 0;
  impactFrame: number = 0;

  // Core Position
  coreX: number = 0;
  coreY: number = 0;

  // Dash Mechanics
  dashTimer: number = 0;
  dashCooldownTimer: number = 0;
  readonly dashDuration: number = 0.15; // 150ms duration
  readonly dashCooldown: number = 3.0; // 3 seconds cooldown
  readonly dashDistance: number = 180; // Distance in pixels
  dashStartX: number = 0;
  dashStartY: number = 0;
  dashTargetX: number = 0;
  dashTargetY: number = 0;
  
  // Tutorial tracking
  totalKills: number = 0;
  totalPowerupsCollected: number = 0;
  forceNextPowerup: boolean = false;
  
  renderer: Renderer;
  inputSystem: InputSystem;
  
  onGameOver?: (score: number) => void;
  onWaveComplete?: () => void;
  onStoryTrigger?: (type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; // Optimize by disabling alpha on root canvas
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.handleVfxSettingsChange = this.handleVfxSettingsChange.bind(this);
    window.addEventListener('nexus_vfx_settings_changed', this.handleVfxSettingsChange);
    
    this.syncVfxSettings();
    this.handleResize();
    
    this.particleSystem = new ParticleSystem();
    this.particleSystem.engine = this;
    this.waveManager = new WaveManager(this);
    this.renderer = new Renderer(this);
    this.inputSystem = new InputSystem(this);
  }
  
  syncVfxSettings() {
    this.isMobile = (window.innerWidth < 768) || 
      (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      ('ontouchstart' in window);

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_high_fidelity_vfx');
      if (saved !== null) {
        this.highFidelityVFX = saved === 'true';
        return;
      }
    }
    this.highFidelityVFX = !this.isMobile;
  }

  handleVfxSettingsChange() {
    this.syncVfxSettings();
    this.handleResize();
  }

  handleResize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.syncVfxSettings();
      // Cap DPR on mobile / lower specs to save fill rate & prevent freezes
      let maxDpr = this.isMobile ? GameConfig.canvas.mobileDprCap : GameConfig.canvas.desktopDprCap;
      if (!this.highFidelityVFX) {
        maxDpr = 1.0; // Restrict DPR on standard specs or mobile standard quality to 1x to avoid GPU layout rendering lag completely
      }
      this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      
      const clientWidth = parent.clientWidth || window.innerWidth;
      const clientHeight = parent.clientHeight || window.innerHeight;
      
      this.canvas.width = clientWidth * this.dpr;
      this.canvas.height = clientHeight * this.dpr;
      this.canvas.style.width = `${clientWidth}px`;
      this.canvas.style.height = `${clientHeight}px`;
      
      this.ctx.scale(this.dpr, this.dpr);
      
      const oldWidth = this.width || clientWidth;
      const oldHeight = this.height || clientHeight;
      this.width = clientWidth;
      this.height = clientHeight;

      if (this.coreX === 0 || this.coreY === 0) {
        this.coreX = this.width / 2;
        this.coreY = this.height / 2;
      } else {
        this.coreX = (this.coreX / oldWidth) * this.width;
        this.coreY = (this.coreY / oldHeight) * this.height;
      }
    }
  }
  
  start() {
    if (this.isRunning) return;
    soundManager.init();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.globalTime = 0;
    this.score = 0;
    this.coreX = this.width / 2;
    this.coreY = this.height / 2;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.syncSkills();
    this.health = this.maxHealth;
    this.wave = 1;
    this.resetEntities();
    
    this.startWave();
    this.loop(this.lastTime);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      return;
    }
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.startWave();
    this.loop(this.lastTime);
  }
  
  resetEntities() {
    this.bugs = [];
    this.hazards = [];
    this.particleSystem.reset();
    this.powerups = [];
    this.weaponHeat = 0;
    this.isOverheated = false;
  }
  
  startWave() {
    this.waveManager.startWave();
  }
  
  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    if (typeof window !== 'undefined') {
      (window as any).__gameEngineStatus = null;
    }
  }
  
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('nexus_vfx_settings_changed', this.handleVfxSettingsChange);
    this.inputSystem.destroy();
  }
  
  shake(duration: number, magnitude: number, dx: number = 0, dy: number = 0) {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
    this.shakeX = dx;
    this.shakeY = dy;
  }
  
  // Add hit-stop function
  triggerHitStop(duration: number) {
    this.hitStopTimer = duration;
  }
  
  get threatShakeIntensity(): number {
    const bugCount = this.bugs.length;
    // Scale ambient vibration subtly based on active threat bugs
    return Math.min(3.5, bugCount * 0.12);
  }
  
  loop(currentTime: number) {
    if (!this.isRunning) return;
    
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (typeof window !== 'undefined') {
      (window as any).__gameEngineStatus = {
        health: this.health,
        maxHealth: this.maxHealth,
        currentBiome: this.currentBiome,
        intensity: this.waveManager ? this.waveManager.intensity : 1,
        performanceFactor: this.performanceFactor || 1.0,
        weaponHeat: this.weaponHeat,
        isOverheated: this.isOverheated,
        dashCooldownTimer: this.dashCooldownTimer,
        dashCooldown: this.dashCooldown,
        rapidFireTimer: this.rapidFireTimer,
        spikeBurstTimer: this.spikeBurstTimer,
      };
    }
    
    if (this.isPaused) {
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }
    
    this.globalTime += dt;
    
    // Hit-stop logic: pause logic updates while allowing rendering to continue
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    this.update(dt);
    this.draw();
    
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
  
  spawnPowerup(x: number, y: number, force: boolean = false) {
    let dropChance = GameConfig.powerups.dropChance;
    if (this.wave >= 4) {
      dropChance += Math.min(0.20, (this.wave - 3) * 0.05);
    }
    if (!force && Math.random() > dropChance) return;
    
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

  spawnResource(x: number, y: number, bugType: string) {
    let type: ResourceType = 'scrap';
    let count = 1;

    switch(bugType) {
      case 'basic': type = 'scrap'; count = 1 + ProgressionManager.getSkillBonus('scavenger_protocol'); break;
      case 'scout': type = 'plasma'; break;
      case 'tank': type = 'alloy'; break;
      case 'ghost': type = 'flux'; break;
      case 'boss': type = 'neural_core'; count = 1; break;
      case 'swarmer': type = 'plasma'; break;
      case 'mini': type = 'scrap'; count = 1; break;
      default: type = 'scrap';
    }

    // Small chance for random extra resources
    if (Math.random() < 0.1 && (bugType === 'tank' || bugType === 'swarmer')) {
      type = 'plasma';
    }

    for (let i = 0; i < count; i++) {
        const res = RESOURCES[type];
        this.resources.push({
          active: true,
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          type: type,
          color: res.color,
          life: 20,
          maxLife: 20,
          size: 8
        });
    }
  }
  
  update(dt: number) {
    if (this.health <= 0) {
      this.isRunning = false;
      this.onGameOver?.(this.score);
      return;
    }
    
    // Core Logic Systems
    this.updateTimers(dt);
    this.updateCorePhysics(dt);
    this.updateMetrics(dt);
    this.waveManager.update(dt);
    
    // Entity Systems
    this.updateTurrets(dt);
    this.updateBugs(dt);
    this.updateHazards(dt);
    
    // Environmental Systems
    this.particleSystem.update(dt);
    this.updatePowerups(dt);
    this.updateResources(dt);
  }

  
  fireAutoTurret(isRapidFire: boolean = false) {
    let closest = null;
    let minHealth = Infinity;
    let minDistSq = Infinity;
    const cx = this.coreX;
    const cy = this.coreY;
    
    // Multi-criteria targeting: Prefer closest, then highest priority
    for (let i = 0; i < this.bugs.length; i++) {
      const bug = this.bugs[i];
      const dx = bug.x - cx;
      const dy = bug.y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = bug;
      }
    }
    
    if (closest) {
      soundManager.shoot();
      this.renderer.fireAlpha = 1.0;
      this.renderer.clickFlash = 0.3; // Subtle flash for auto firing
      this.particleSystem.spawnMuzzleFlash(cx, cy, 30);

      // Add feedback for auto-turret
      this.baseScale = 1.1;
      this.baseRecoil = 5;
      this.baseRecoilAngle = Math.atan2(closest.y - cy, closest.x - cx);

      if (isRapidFire) {
        this.shake(0.05, 3);
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#ff00ff', 4);
      } else {
        this.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#00ffcc', 2);
      }
      this.damageBug(closest, 1);
    }
  }
  
  triggerUpgradeEffect() {
    this.upgradeFlash = 1.0;
    this.shake(0.2, 10);
    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', 400);
    soundManager.skillUpgrade();
  }

  damageBug(bug: Bug, amount: number) {
    let finalAmount = amount * this.damageMultiplier;
    
    let isCrit = false;
    // Boss Vulnerability Strategy: Core Exposure
    if (bug.type === 'boss') {
      if (bug.isShielded) {
          this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ffff', 40);
          soundManager.uiError();
          return; // No damage while shielded
      }
      soundManager.bossHit();
      const pulse = Math.sin(this.globalTime * 10);
      if (pulse > 0.8) {
          isCrit = true;
          finalAmount *= 2; // Critical hit while core is exposed
          this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 60);
          this.triggerHitStop(0.05); // Tiny freeze on critical core hit
          this.renderer.chromaticOffset = 10;
      } else if (pulse < -0.8) {
          finalAmount *= 0.5; // Defensive phase
      }
    } else {
      // Standard critical hit mechanism utilizing real Progression values (5% + 5% per level)
      const critChance = 0.05 + ProgressionManager.getSkillBonus('crit_hit');
      if (Math.random() < critChance) {
        isCrit = true;
        finalAmount *= 2.0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffd700', 80);
        this.renderer.chromaticOffset = 12;
      }
    }

    if (isCrit && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_crit_hit'));
    }

    // Apply Armor reduction
    if (bug.armor && bug.armor < 1.0 && bug.armor > 0) {
      finalAmount *= bug.armor;
    }

    bug.hp -= finalAmount;
    bug.hitTimer = 0.1;
    
    // Small freeze and shake on every hit to feel the impact
    if (finalAmount >= 1) {
        this.triggerHitStop(0.05);
        this.shake(0.05, 2);
    }

    if (bug.hp <= 0) {
      const idx = this.bugs.indexOf(bug);
      if (idx > -1) {
        if (bug.type === 'swarmer') this.swarmerKills++;
        if (bug.type === 'healer') this.healerKills++;
        this.killsInSubwave++;
        
        this.totalKills++;
        this.streakCount++;
        this.streakTimer = 2.0; // 2 seconds to keep streak alive
        
        const isBossKill = bug.type === 'boss';
        
        StatsManager.updateStats({ 
          totalBugsKilled: 1, 
          bossesKilled: isBossKill ? 1 : 0 
        });

        const mult = this.multiplierTimer > 0 ? 2 : 1;
        this.score += bug.scoreValue * mult;
        
        soundManager.splat();
        
        // Kill-Stop: Tiny freeze on every kill to make them feel impactful
        this.triggerHitStop(0.04);
        
        // Intensity scales slightly with bug size/type
        const isBoss = bug.type === 'boss';
        const intensity = isBoss ? 4.0 : ((bug.type === 'tank' || bug.type === 'swarmer') ? 1.4 : (bug.type === 'scout' ? 0.7 : 0.9));
        this.shake(isBoss ? 0.6 : 0.15 * intensity, isBoss ? 40 : 8 * intensity);
        
        this.particleSystem.spawnSplatter(bug.x, bug.y, bug.color);
        this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color);
        
        this.spawnResource(bug.x, bug.y, bug.type);

        if (isBoss) {
            soundManager.bossDeath();
            this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', 800);
            
            this.onStoryTrigger?.('boss_kill', this.wave);
            
            const dx = (bug.x - this.coreX) / (this.width / 2);
            const dy = (bug.y - this.coreY) / (this.height / 2);
            this.shake(1.5, 60, dx, dy);
            this.triggerHitStop(0.2); // Significant freeze on boss death
            this.renderer.chromaticOffset = 40;
            this.impactFrame = 1.0;
            
            // Critical Rewards: Spawn multiple powerups
            for (let i = 0; i < 3; i++) {
                this.spawnPowerup(bug.x + (Math.random()-0.5)*50, bug.y + (Math.random()-0.5)*50, true);
            }
            
            for (let i = 0; i < 40; i++) {
                this.particleSystem.spawnParticle(bug.x, bug.y, bug.color);
            }
        }
        
        // Swarmer splitting logic
        if (bug.type === 'swarmer' || this.currentBiome === 'golden_cache') {
          const splitCount = this.currentBiome === 'golden_cache' ? 2 : 3;
          for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 / splitCount) * i;
            const dist = 20;
            const miniConf = GameConfig.bugs.mini;
            this.bugs.push({
              active: true,
              x: bug.x + Math.cos(angle) * dist,
              y: bug.y + Math.sin(angle) * dist,
              type: 'mini',
              speed: miniConf.baseSpeed + (this.wave * miniConf.speedPerWave),
              color: miniConf.color,
              size: miniConf.size,
              scoreValue: miniConf.score,
              hp: miniConf.baseHp,
              maxHp: miniConf.baseHp,
              walkCycle: Math.random() * 10,
              rotation: 0,
              offsetTime: Math.random() * 100,
              hitTimer: 0
            });
          }
        }
        
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
  
  activatePowerup(type: string, px?: number, py?: number) {
    this.renderer.powerupAlpha = 1.0;
    this.totalPowerupsCollected++;
    StatsManager.updateStats({ totalPowerupsCollected: 1 });
    soundManager.powerup(type as any);
    this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffffff', 300);

    // Wave 4+ satisfying collection shockwave blaster
    if (this.wave >= 4 && px !== undefined && py !== undefined) {
      this.particleSystem.spawnShockwave(px, py, '#ffffff', 140);
      this.particleSystem.spawnShockwave(px, py, '#ffaa00', 100);
      
      const DAMAGE_RADIUS_SQ = 140 * 140;
      this.bugs.forEach(bug => {
        const dx = bug.x - px;
        const dy = bug.y - py;
        if (dx * dx + dy * dy < DAMAGE_RADIUS_SQ) {
          this.damageBug(bug, 1.5); // Satisfying local bug-splat on grab!
        }
      });
    }

    switch(type) {
      case 'shield':
        this.shieldTimer = GameConfig.powerups.duration;
        break;
      case 'multiplier':
        this.multiplierTimer = GameConfig.powerups.duration;
        break;
      case 'rapid_fire':
        this.rapidFireTimer = GameConfig.powerups.duration;
        break;
      case 'slow_mo':
        this.slowMoTimer = GameConfig.powerups.duration;
        break;
      case 'freeze':
        this.freezeTimer = GameConfig.powerups.duration;
        break;
      case 'magnet':
        this.magnetTimer = GameConfig.powerups.duration;
        break;
      case 'spike_burst':
        this.spikeBurstTimer = GameConfig.powerups.duration;
        break;
      case 'nuke':
        soundManager.nuke();
        this.shake(1.5, 40, 0, 1);
        this.renderer.chromaticOffset = 30;
        this.triggerHitStop(0.15);
        this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffaa00', 1000);
        this.impactFrame = 1.0;
        for (let i = this.bugs.length - 1; i >= 0; i--) {
          this.damageBug(this.bugs[i], 9999);
        }
        break;
      case 'overdrive':
        this.overdriveTimer = GameConfig.powerups.duration;
        break;
      case 'repair_cell':
        // Restore 15 health on active grab or auto-magnet pull
        this.health = Math.min(this.maxHealth, this.health + 15);
        this.particleSystem.spawnShockwave(px !== undefined ? px : this.width/2, py !== undefined ? py : this.height/2, '#00ffaa', 180);
        soundManager.skillUpgrade(); // healing positive chime sound surrogate
        break;
    }
  }

  exportState(): GameSaveData {
    return {
      score: this.score,
      wave: this.wave,
      health: this.health,
      maxHealth: this.maxHealth,
      clickRadiusMultiplier: this.clickRadiusMultiplier,
      autoTurretLevel: this.autoTurretLevel,
      healthLevel: this.healthLevel,
      radiusLevel: this.radiusLevel,
      timestamp: Date.now()
    };
  }

  importState(data: GameSaveData) {
    this.score = data.score;
    this.wave = data.wave;
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.clickRadiusMultiplier = data.clickRadiusMultiplier;
    this.autoTurretLevel = data.autoTurretLevel || 0;
    this.healthLevel = data.healthLevel || 0;
    this.radiusLevel = data.radiusLevel || 0;
    
    this.resetEntities();
    this.waveManager.waveActive = false;
  }

  syncSkills() {
    const data = ProgressionManager.getData();
    this.maxHealth = GameConfig.player.maxHealth + ProgressionManager.getSkillBonus('hardened_hull');
    this.clickRadiusMultiplier = 1 + ProgressionManager.getSkillBonus('amplified_pulse');
    this.damageMultiplier = 1 + ProgressionManager.getSkillBonus('kinetic_amplifier');
    this.prestigeLevel = data.prestigeLevel;
  }

  useConsumable(id: string): boolean {
    if (!ProgressionManager.useConsumable(id)) return false;

    switch(id) {
      case 'repair_kit':
        this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.25);
        this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#00ffaa', 300);
        soundManager.skillUpgrade();
        break;
      case 'emp_generator':
        this.bugs.forEach(b => {
          if (b.type !== 'boss') {
            b.hp = 0;
            this.particleSystem.spawnExplosion(b.x, b.y, b.color);
          }
        });
        this.shake(1.5, 40);
        this.particleSystem.spawnShockwave(this.width/2, this.height/2, '#ffffff', 1000);
        soundManager.bossDeath();
        break;
      case 'overdrive_chip':
        this.overdriveTimer = 20;
        soundManager.powerup('overdrive');
        break;
    }
    return true;
  }

  private updateTimers(dt: number) {
    if (this.clickCooldown > 0) this.clickCooldown -= dt;

    if (this.isOverheated) {
      this.weaponHeat -= 45 * dt;
      if (this.weaponHeat <= 0) {
        this.weaponHeat = 0;
        this.isOverheated = false;
      }
    } else if (this.weaponHeat > 0) {
      this.weaponHeat -= 50 * dt;
      if (this.weaponHeat < 0) this.weaponHeat = 0;
    }

    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.slowMoTimer > 0) this.slowMoTimer -= dt;
    if (this.overdriveTimer > 0) this.overdriveTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.magnetTimer > 0) this.magnetTimer -= dt;
    if (this.spikeBurstTimer > 0) this.spikeBurstTimer -= dt;
    if (this.controlDistortionTimer > 0) this.controlDistortionTimer -= dt;
    if (this.glitchTimer > 0) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) this.renderer.isGlitching = false;
    }
  }

  private updateMetrics(dt: number) {
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) this.streakCount = 0;
    }
    const safetyBonus = Math.min(1.0, (this.globalTime - this.lastHitTime) / 20);
    const streakBonus = Math.min(1.0, this.streakCount / 50);
    this.performanceFactor = 0.8 + (safetyBonus * 0.7) + (streakBonus * 1.0);
    this.playTimeAccumulator += dt;
    if (this.playTimeAccumulator >= 10) {
      StatsManager.updateStats({ totalPlayTime: 10 });
      this.playTimeAccumulator -= 10;
    }
    this.baseScale += (1.0 - this.baseScale) * 0.15;
    this.baseRecoil *= 0.85;
    this.upgradeFlash *= 0.92;
    this.impactFrame = Math.max(0, this.impactFrame - dt * 6);
  }

  private updateTurrets(dt: number) {
    if (this.autoTurretLevel > 0 || this.rapidFireTimer > 0 || this.overdriveTimer > 0) {
      // Use hazardSlowdown to reduce the rate at which the autoTurretTimer advances
      this.autoTurretTimer += dt * this.hazardSlowdown;
      const baseFireRate = GameConfig.upgrades.turret.baseFireRate;
      let fireRate = Math.max(GameConfig.upgrades.turret.minFireRate, 
        baseFireRate - this.autoTurretLevel * GameConfig.upgrades.turret.fireRateReduction - ProgressionManager.getSkillBonus('sentry_optimization')
      );
      if (this.overdriveTimer > 0) fireRate *= 0.3;
      if (this.rapidFireTimer > 0) fireRate = 0.05;

      if (this.autoTurretTimer > fireRate && this.bugs.length > 0) {
        this.autoTurretTimer = 0;
        this.fireAutoTurret(this.rapidFireTimer > 0);
      }
    }
  }

  private updateBugs(dt: number) {
    const centerX = this.coreX;
    const centerY = this.coreY;
    let timeScale = this.slowMoTimer > 0 ? 0.3 : 1.0;
    if (this.freezeTimer > 0) timeScale = 0;

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i];
      const dx = centerX - bug.x;
      const dy = centerY - bug.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 900) { // 30^2
        this.handleBugImpact(bug, centerX, centerY);
        this.bugs.splice(i, 1);
        continue;
      }

      const dist = Math.sqrt(distSq);
      this.moveBug(bug, dx, dy, dist, dt, timeScale);
      this.updateBugAbilities(bug, dt, timeScale, distSq);
      if (bug.hitTimer > 0) bug.hitTimer -= dt;
      if (bug.healEffectTimer && bug.healEffectTimer > 0) {
        bug.healEffectTimer -= dt * timeScale;
        if (bug.healEffectTimer <= 0) bug.isHealing = false;
      }
    }
  }

  private handleBugImpact(bug: Bug, cx: number, cy: number) {
    if (this.shieldTimer <= 0) {
      this.health -= GameConfig.player.hitDamage;
      this.renderer.impactFlash = 1.0;
      this.lastHitTime = this.globalTime;
      this.streakCount = 0;
      this.shake(0.3, 10, -(bug.x - cx) / 100, -(bug.y - cy) / 100);
      this.renderer.chromaticOffset = 15;
      this.triggerHitStop(0.1);
      soundManager.hitBase();
    } else {
      this.shake(0.2, 5);
      soundManager.splat();
    }
    this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color);
  }

  private moveBug(bug: Bug, dx: number, dy: number, dist: number, dt: number, timeScale: number) {
    let speed = bug.speed * timeScale;
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;
    if (bug.type === 'scout' || bug.type === 'swarmer') {
      const erratic = Math.sin(this.globalTime * 10 + bug.offsetTime) * (bug.type === 'swarmer' ? 1.2 : 0.5);
      vx += -vy * erratic;
      vy += (dx / dist) * speed * erratic;
    }
    bug.rotation = Math.atan2(vy, vx) - Math.PI / 2;
    bug.x += vx * dt;
    bug.y += vy * dt;
    bug.walkCycle += speed * dt * 0.2;
  }

  private updateBugAbilities(bug: Bug, dt: number, timeScale: number, distSq: number) {
    if (this.currentBiome === 'void_abyss' || bug.type === 'phase') {
      bug.lastTeleportTime = (bug.lastTeleportTime || 0) + dt * timeScale;
      if (bug.lastTeleportTime > (bug.type === 'phase' ? 2.0 : 4.0) && distSq > 10000) { // 100^2
        bug.lastTeleportTime = 0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 40);
        const angle = Math.random() * Math.PI * 2;
        bug.x += Math.cos(angle) * 100;
        bug.y += Math.sin(angle) * 100;
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 30);
      }
    }
    if (this.currentBiome === 'golden_spire') {
      bug.hp = Math.min(bug.maxHp, Math.max(0, bug.hp + dt * 0.5));
    }
    if (bug.type === 'healer') {
      bug.healCooldown = (bug.healCooldown || 0) + dt * timeScale;
      if (bug.healCooldown > 3.0) {
        bug.healCooldown = 0;
        bug.isHealing = true;
        bug.healEffectTimer = 0.5;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ff66', 150);
        
        const HEAL_RADIUS_SQ = 22500; // 150^2
        for (let j = 0; j < this.bugs.length; j++) {
          const o = this.bugs[j];
          if (o !== bug && o.active) {
            const odx = o.x - bug.x;
            const ody = o.y - bug.y;
            if (odx * odx + ody * ody < HEAL_RADIUS_SQ) {
              o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.2);
            }
          }
        }
      }
    }
    if (bug.type === 'boss') this.updateBossAbilities(bug, dt, timeScale);
  }

  private updateBossAbilities(bug: Bug, dt: number, timeScale: number) {
    if (bug.phase === undefined) { 
      bug.phase = 1; 
      bug.abilityTimer = 0; 
      bug.isShielded = false; 
    }
    bug.offsetTime += dt;
    bug.abilityTimer = (bug.abilityTimer || 0) + dt;
    const conf = GameConfig.bugs.boss;
    const hpPercent = bug.hp / bug.maxHp;

    // Boss Phase Transitions
    if (bug.phase === 1 && hpPercent < 0.66) { 
      bug.phase = 2; 
      this.shake(1.0, 30); 
      soundManager.powerup('overdrive'); 
    } else if (bug.phase === 2 && hpPercent < 0.33) { 
      bug.phase = 3; 
      bug.isShielded = true; 
      bug.abilityTimer = 0; 
      this.shake(1.5, 40); 
      this.renderer.chromaticOffset = 20;
    }

    // Ability 1: Minion Spawn
    if (bug.offsetTime > conf.attackRate) {
        bug.offsetTime = 0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 120);
        const spawnCount = bug.phase === 3 ? conf.minionSpawnCount * 1.5 : conf.minionSpawnCount;
        for (let j = 0; j < spawnCount; j++) this.waveManager.spawnSpecificMinion(bug.x, bug.y);
    }

    // Ability 2: Barrier / Shield Loop
    if (bug.phase === 3 && !bug.isShielded && bug.abilityTimer > 10) { bug.isShielded = true; bug.abilityTimer = 0; }
    if (bug.phase === 3 && bug.isShielded && bug.abilityTimer > conf.shieldDuration) { bug.isShielded = false; bug.abilityTimer = 0; }

    // VARIANT SPECIFIC LOGIC
    if (bug.variantId === 'arachne') {
      bug.webTimer = (bug.webTimer || 0) + dt * timeScale;
      if (bug.webTimer > 4.0) {
        bug.webTimer = 0;
        this.hazards.push({
          id: `web_${this.globalTime}`,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: 50, type: 'web', timer: 0, duration: 8.0, active: true
        });
        soundManager.uiHover(); // Web spin sound surrogate
      }
    } else if (bug.variantId === 'moth') {
      if (Math.random() < 0.05 * dt * (bug.phase || 1)) {
        this.controlDistortionTimer = 2.0;
        this.renderer.isGlitching = true;
        this.glitchTimer = 0.5;
      }
    } else if (bug.variantId === 'mandible') {
      // Mandibles close up
      const armored = Math.sin(this.globalTime * Math.PI) > 0; // 2s cycle
      bug.armor = armored ? 0.8 : 1.0;
    }

    // Global Barrage
    if (bug.phase >= 2 && bug.abilityTimer > conf.barrageRate) {
        bug.abilityTimer = 0;
        soundManager.bossAbility();
        for (let j = 0; j < conf.barrageCount; j++) {
            this.hazards.push({
                id: `barrage_${this.globalTime}_${j}`, x: Math.random()*this.width, y: Math.random()*this.height,
                radius: conf.barrageRadius, type: 'barrage', timer: 0, duration: conf.barrageWarningTime, active: true
            });
        }
    }

    if (Math.random() < conf.glitchChance * dt) { 
      this.shake(0.3, 15); 
      this.renderer.isGlitching = true; 
      this.glitchTimer = 0.5;
    }
  }

  private updateHazards(dt: number) {
    let isInLava = false;
    let isInWeb = false;
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.timer += dt;
      
      // Handle expiration
      if (h.timer >= h.duration) {
        this.triggerHazard(h);
        this.hazards.splice(i, 1);
        continue;
      }

      // Proximity check (Player is centered)
      const dx = h.x - centerX;
      const dy = h.y - centerY;
      const distSq = dx * dx + dy * dy;
      const playerRadius = 20;
      const touchRadius = h.radius + playerRadius;
      const isTouchingPlayer = distSq < touchRadius * touchRadius;

      if (isTouchingPlayer) {
        if (h.type === 'lava') {
          isInLava = true;
        } else if (h.type === 'web') {
          isInWeb = true;
        }
      }
    }

    // Apply cumulative or singular effects for overlapping persistent hazards
    if (isInLava && this.shieldTimer <= 0) {
      // Lava damage (non-stacking if overlapping, but persistent)
      this.health -= dt * 8; 
      if (Math.random() < 0.1) {
        this.shake(0.1, 2);
        this.renderer.impactFlash = Math.max(this.renderer.impactFlash, 0.4);
      }
    }

    // Web effect Slacker (Slows fire rate and rotation potential)
    this.hazardSlowdown = isInWeb ? 0.4 : 1.0;
  }

  private triggerHazard(h: Hazard) {
    if (h.type === 'barrage') {
      this.particleSystem.spawnExplosion(h.x, h.y, '#ff3300');
      this.particleSystem.spawnShockwave(h.x, h.y, '#ff6600', h.radius * 2);
      soundManager.splat();
      const distSq = (h.x - this.width/2)**2 + (h.y - this.height/2)**2;
      const damageRadius = h.radius + 30;
      if (distSq < damageRadius * damageRadius && this.shieldTimer <= 0) {
        this.health -= GameConfig.player.hitDamage * 1.5;
        this.renderer.impactFlash = 1.5;
        this.shake(0.5, 25);
        soundManager.hitBase();
      }
    }
  }

  private updatePowerups(dt: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.life -= dt;
      if (p.life <= 0) { this.powerups.splice(i, 1); continue; }
      if (this.magnetTimer > 0) {
        const dx = this.coreX - p.x;
        const dy = this.coreY - p.y;
        const distSq = dx * dx + dy * dy;
        const d = Math.sqrt(distSq);
        p.x += (dx / d) * 400 * dt;
        p.y += (dy / d) * 400 * dt;
      }
    }
  }

  private updateResources(dt: number) {
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const r = this.resources[i];
      if (!r.active) continue;
      r.life -= dt;
      if (r.life <= 0) r.active = false;
      const dx = r.x - this.coreX;
      const dy = r.y - this.coreY;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < 40000 || this.magnetTimer > 0) { // 200^2
        const dist = Math.sqrt(distSq);
        const factor = this.magnetTimer > 0 ? 1 : (1 - (dist / 200));
        const angle = Math.atan2(dy, dx);
        r.x -= Math.cos(angle) * 500 * factor * dt;
        r.y -= Math.sin(angle) * 500 * factor * dt;
      }
      if (distSq < 900) { // 30^2
        ProgressionManager.addResource(r.type, 1);
        r.active = false;
        soundManager.resource(r.type);
      }
    }
  }

  updateCorePhysics(dt: number) {
    // Reduce cooldown
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }

    // Handle active dash
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      
      const t = 1 - (this.dashTimer / this.dashDuration);
      const ease = t * (2 - t); // Ease out quad
      this.coreX = this.dashStartX + (this.dashTargetX - this.dashStartX) * ease;
      this.coreY = this.dashStartY + (this.dashTargetY - this.dashStartY) * ease;
      
      // Spawn intense, glowing trail particles from core
      const trailColor = this.shieldTimer > 0 ? '#00e1ff' : '#00ffcc';
      this.particleSystem.spawnSparkExplosion(this.coreX, this.coreY, trailColor);
      
      // Push/damage bugs during dash
      const pushRadiusSq = 120 * 120;
      this.bugs.forEach(bug => {
        const dx = bug.x - this.coreX;
        const dy = bug.y - this.coreY;
        const distSq = dx * dx + dy * dy;
        if (distSq < pushRadiusSq) {
          const dist = Math.sqrt(distSq) || 1;
          bug.x += (dx / dist) * 450 * dt;
          bug.y += (dy / dist) * 450 * dt;
          this.damageBug(bug, 0.4);
        }
      });

      if (this.dashTimer <= 0) {
        this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', 160);
      }
    } else {
      // Smoothly drift back to true center (this.width / 2, this.height / 2)
      const targetCenterX = this.width / 2;
      const targetCenterY = this.height / 2;
      
      const dx = targetCenterX - this.coreX;
      const dy = targetCenterY - this.coreY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        const slideSpeed = 240; // Pixels per second drift recovery
        this.coreX += (dx / dist) * Math.min(dist, slideSpeed * dt);
        this.coreY += (dy / dist) * Math.min(dist, slideSpeed * dt);
      } else {
        this.coreX = targetCenterX;
        this.coreY = targetCenterY;
      }
    }
  }

  triggerDash(targetX: number, targetY: number) {
    if (this.dashCooldownTimer > 0 || this.isPaused || !this.isRunning) return;
    
    this.dashCooldownTimer = this.dashCooldown;
    this.dashTimer = this.dashDuration;
    
    soundManager.dash();
    
    this.dashStartX = this.coreX;
    this.dashStartY = this.coreY;
    
    const dx = targetX - this.coreX;
    const dy = targetY - this.coreY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const actualDist = Math.min(dist, this.dashDistance);
    this.dashTargetX = this.coreX + (dx / dist) * actualDist;
    this.dashTargetY = this.coreY + (dy / dist) * actualDist;
    
    // Boundary clamping with margin
    const margin = 50;
    this.dashTargetX = Math.max(margin, Math.min(this.width - margin, this.dashTargetX));
    this.dashTargetY = Math.max(margin, Math.min(this.height - margin, this.dashTargetY));
    
    // Screenshake and chromatic aberration kick
    this.renderer.chromaticOffset = 25;
    this.impactFrame = 0.35;
    this.shake(0.4, 12);
    
    // Spawn starting trail shockwave
    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ffffff', 80);
  }
}
