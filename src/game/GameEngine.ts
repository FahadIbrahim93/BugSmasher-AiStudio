import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { analytics } from '../lib/analytics';
import { ParticleSystem } from './ParticleSystem';
import { WaveManager } from './WaveManager';
import { GameSaveData } from './SaveManager';
import { StatsManager } from './StatsManager';
import { ProgressionManager } from './ProgressionManager';
import { InputSystem } from './InputSystem';
import { Bug, Hazard, Powerup, ResourcePickup } from './GameTypes';
import { CollisionSystem } from './CollisionSystem';
import { BossSystem } from './BossSystem';
import { PowerupSystem } from './PowerupSystem';
import { HazardSystem } from './HazardSystem';
import { PCGSystem } from './PCGSystem';
import { GooSystem } from './GooSystem';
import { CustomMapManager } from './CustomMapManager';
import {
  computeModifierState,
  type ChallengeModifierId,
  type ChallengeModifierState,
} from './DailyChallengeManager';
import { GameEngineStatusBus } from './GameEngineStatusBus';
import {
  loadAccessibilitySettings,
  DIFFICULTY_PRESETS,
  subscribeAccessibility,
  type AccessibilitySettings,
} from './AccessibilitySettings';
import { getGameModeConfig, type GameModeId, type GameModeConfig } from './GameMode';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr = 1;
  isMobile = false;
  highFidelityVFX = true;

  bugs: Bug[] = [];
  hazards: Hazard[] = [];

  particleSystem: ParticleSystem;
  waveManager: WaveManager;

  // Extracted Systems
  collisionSystem: CollisionSystem;
  bossSystem: BossSystem;
  powerupSystem: PowerupSystem;
  hazardSystem: HazardSystem;
  pcgSystem: PCGSystem;
  gooSystem: GooSystem;

  powerups: Powerup[] = [];
  resources: ResourcePickup[] = [];

  score = 0;
  health: number = GameConfig.player.maxHealth;
  maxHealth: number = GameConfig.player.maxHealth;
  wave = 1;
  waveCrystalWeb = false;
  waveLastStand = false;

  lastTime = 0;
  globalTime = 0;
  animationFrameId = 0;

  shakeTime = 0;
  shakeMagnitude = 0;
  shakeX = 0;
  shakeY = 0;

  hitStopTimer = 0;

  isRunning = false;
  isPaused = false;

  currentBiome = 'neon_core';
  prestigeLevel = 0;

  // Upgrades
  clickRadiusMultiplier = 1;
  autoTurretLevel = 0;
  healthLevel = 0;
  radiusLevel = 0;

  damageMultiplier = 1.0;

  clickCooldown = 0;
  weaponHeat = 0;
  // RAGE METER — fills from clicks/misses; at 100 it ignites FURY MODE instead of locking out
  furyActive = false;
  furyTimer = 0;
  /** Seconds remaining in the post-FURY ignition cooldown (once-per-wave cadence) */
  furyCooldownTimer = 0;
  /** Per-second rage intake budget — spend in addRage, refilled at maxGainPerSecond/s */
  private rageGainBudget = GameConfig.rage.maxGainPerSecond;
  readonly rageGainBudgetMax: number = GameConfig.rage.maxGainPerSecond;
  readonly furyDuration: number = GameConfig.rage.furyDuration;

  // Ground Slam (hold-to-charge) state
  slamCharging = false;
  slamCharge = 0;
  readonly slamChargeMax = 1.0;

  // Session counters for achievements/telemetry
  furyTriggers = 0;
  slamsUsed = 0;

  // Powerups (timers maintained here for external access)
  shieldTimer = 0;
  multiplierTimer = 0;
  rapidFireTimer = 0;
  autoTurretTimer = 0;
  slowMoTimer = 0;
  overdriveTimer = 0;
  freezeTimer = 0;
  magnetTimer = 0;
  spikeBurstTimer = 0;
  controlDistortionTimer = 0;
  hazardSlowdown = 1.0;

  // Active abilities cooldowns and durations (Progression Skill Tree)
  bioshieldCooldown = 0;
  bioshieldActiveTime = 0;
  overdriveCooldown = 0;
  overdriveActiveTime = 0;
  empShatterCooldown = 0;
  empShatterActiveTime = 0;
  missileSentryTimer = 0;

  isInvulnerable(): boolean {
    return this.shieldTimer > 0 || this.bioshieldActiveTime > 0;
  }

  // Session Stats for Achievements
  swarmerKills = 0;
  healerKills = 0;
  killsInSubwave = 0;
  missedClicksInSubwave = 0;

  // Performance Scaling Metrics
  streakCount = 0;
  streakTimer = 0;
  lastHitTime = 0;
  performanceFactor = 1.0;

  playTimeAccumulator = 0;
  accessibility: AccessibilitySettings = loadAccessibilitySettings();
  private unsubscribeAccessibility?: () => void;
  gameMode: GameModeId = 'standard';
  gameModeConfig: GameModeConfig = getGameModeConfig('standard');

  baseScale = 1.0;
  baseRecoil = 0;
  baseRecoilAngle = 0;

  glitchTimer = 0;
  waveTransitionTimer = 0;
  readonly waveTransitionDuration: number = 1.5;
  upgradeFlash = 0;
  impactFrame = 0;

  // Core Position
  coreX = 0;
  coreY = 0;

  // Dash Mechanics
  dashTimer = 0;
  dashCooldownTimer = 0;
  readonly dashDuration: number = 0.15;
  readonly dashCooldown: number = GameConfig.abilities.dashCooldown;
  readonly dashDistance: number = GameConfig.abilities.dashDistance;
  dashStartX = 0;
  dashStartY = 0;
  dashTargetX = 0;
  dashTargetY = 0;

  // Tutorial tracking
  totalKills = 0;
  totalPowerupsCollected = 0;
  forceNextPowerup = false;

  // Challenge Mode
  isChallengeMode = false;
  challengeModifiers: ChallengeModifierState | null = null;
  challengeBugSpeedBonus = 0; // For speed_demon modifier

  renderer: Renderer;
  inputSystem: InputSystem;

  onGameOver?: (score: number) => void;
  onWaveComplete?: () => void;
  onStoryTrigger?: (
    type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige',
    value: number,
  ) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
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

    // Initialize extracted systems
    this.collisionSystem = new CollisionSystem(this);
    this.bossSystem = new BossSystem(this);
    this.powerupSystem = new PowerupSystem(this);
    this.hazardSystem = new HazardSystem(this);
    this.pcgSystem = new PCGSystem(this);
    this.gooSystem = new GooSystem(this);
    const activeCustom: any = CustomMapManager.getActiveConfiguration();
    if (activeCustom?.obstacles && activeCustom.seed) {
      this.pcgSystem.activeMap = activeCustom;
    }
    this.applyAccessibility();
    this.unsubscribeAccessibility = subscribeAccessibility((settings) => {
      this.accessibility = settings;
      this.applyAccessibility();
    });
  }

  setGameMode(mode: GameModeId): void {
    this.gameMode = mode;
    this.gameModeConfig = getGameModeConfig(mode);
  }

  applyAccessibility(): void {
    const preset = DIFFICULTY_PRESETS[this.accessibility.difficulty];
    const baseMax = GameConfig.player.maxHealth * preset.playerMaxHealth;
    this.maxHealth = baseMax;
    if (!this.isRunning) {
      this.health = this.maxHealth;
    }
    if (this.waveManager) {
      this.waveManager.difficultySpeedMultiplier = preset.enemySpeed;
      this.waveManager.difficultyHpMultiplier = preset.enemyHp;
    }
    if (this.powerupSystem) {
      this.powerupSystem.dropBonusMultiplier = preset.dropBonus;
    }
    // Reduced-motion a11y: flatten adaptive music intensity when requested
    soundManager.setReducedMotion(this.accessibility.reducedMotion);
  }

  syncVfxSettings() {
    this.isMobile =
      window.innerWidth < 768 ||
      (typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        )) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      'ontouchstart' in window;

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
      let maxDpr = this.isMobile ? GameConfig.canvas.mobileDprCap : GameConfig.canvas.desktopDprCap;
      if (!this.highFidelityVFX) {
        maxDpr = 1.0;
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
    this.applyAccessibility();
    this.health = this.maxHealth;
    this.wave = 1;
    this.resetEntities();

    this.inputSystem.startGamepadPolling();
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
    this.furyActive = false;
    this.furyTimer = 0;
    this.furyCooldownTimer = 0;
    this.rageGainBudget = GameConfig.rage.maxGainPerSecond;
    this.slamCharging = false;
    this.slamCharge = 0;
    this.furyTriggers = 0;
    this.slamsUsed = 0;
    this.gooSystem.reset();
  }

  startWave() {
    this.waveManager.startWave();
    this.waveTransitionTimer = this.waveTransitionDuration;
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.inputSystem.stopGamepadPolling();
    GameEngineStatusBus.publish(null);
    GameEngineStatusBus.syncLegacyWindowGlobal(null);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('nexus_vfx_settings_changed', this.handleVfxSettingsChange);
    this.inputSystem.destroy();
    this.unsubscribeAccessibility?.();
  }

  shake(duration: number, magnitude: number, dx = 0, dy = 0) {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
    this.shakeX = dx;
    this.shakeY = dy;
  }

  triggerHitStop(duration: number) {
    this.hitStopTimer = duration;
  }

  /**
   * RAGE METER — every click/miss feeds the vent. At 100 the player erupts
   * into FURY MODE (guaranteed crits, AoE smashes, ×2 damage) instead of
   * being punished with a lockout. No cooling-down penalty for venting.
   */
  addRage(amount: number) {
    if (this.furyActive) return; // already raging
    // Per-second gain cap: rage intake is budgeted so even max-APM play can't
    // insta-fill the meter — it refills over roughly the cooldown window.
    const applied = Math.min(amount, this.rageGainBudget);
    this.rageGainBudget -= applied;
    this.weaponHeat = Math.min(GameConfig.rage.maxHeat, this.weaponHeat + applied);
    // Post-FURY ignition cooldown: the meter keeps refilling, but FURY waits
    // until the cooldown clears so eruptions land roughly once per wave.
    if (this.weaponHeat >= GameConfig.rage.maxHeat && this.furyCooldownTimer <= 0) {
      this.triggerFury();
    }
  }

  /** Ignite FURY MODE — the venting power fantasy. */
  triggerFury() {
    if (this.furyActive) return;
    this.furyActive = true;
    this.furyTimer = this.furyDuration;
    this.weaponHeat = GameConfig.rage.maxHeat;
    this.furyTriggers++;
    soundManager.nuke();
    this.shake(0.6, 30);
    this.renderer.clickFlash = 0.8;
    this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#ff4400', 400);
    this.particleSystem.spawnStarburst(this.width / 2, this.height / 2, '#ff6a00');
    analytics.track('fury_triggered', { trigger: this.furyTriggers, wave: this.wave });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_fury_active'));
    }
  }

  /** AoE smash on a click while FURY MODE is active. */
  applyFurySplash(x: number, y: number) {
    if (!this.furyActive) return;
    const radius = 150;
    const radiusSq = radius * radius;
    this.particleSystem.spawnShockwave(x, y, '#ff4400', radius);
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const b = this.bugs[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < radiusSq) {
        this.damageBug(b, 1);
      }
    }
  }

  /** Hold-to-charge Ground Slam — release for a crushing AoE. */
  triggerGroundSlam(x: number, y: number, charge: number) {
    this.slamCharging = false;
    this.slamCharge = 0;
    this.slamsUsed++;
    analytics.track('slam_used', { charge: Math.round(charge * 100), wave: this.wave });
    const radius = 90 + charge * 180;
    const radiusSq = radius * radius;
    const dmg = 1 + Math.round(charge * 3);

    this.particleSystem.spawnShockwave(x, y, '#ff8800', radius);
    this.particleSystem.spawnShockwave(x, y, '#ffffff', radius * 0.6);
    this.particleSystem.spawnGibs(x, y, '#ff8800', 12);
    this.shake(0.35, 20);
    this.triggerHitStop(0.1);
    soundManager.bossDeath();
    this.renderer.clickFlash = 0.6;

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const b = this.bugs[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < radiusSq) {
        this.damageBug(b, dmg);
      }
    }

    // Slamming is cathartic — the impact itself feeds the rage meter a little
    this.addRage(GameConfig.rage.perSlam);
  }

  /** Rage-refund pickup: when a streak breaks, drop a consolation powerup near the core. */
  spawnRageRefund() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const x = this.coreX + Math.cos(angle) * dist;
    const y = this.coreY + Math.sin(angle) * dist;
    this.powerupSystem.spawn(x, y, true);
    this.particleSystem.spawnShockwave(x, y, '#22c55e', 60);
  }

  get threatShakeIntensity(): number {
    const bugCount = this.bugs.length;
    return Math.min(3.5, bugCount * 0.12);
  }

  loop(currentTime: number) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    const status = {
      health: this.health,
      maxHealth: this.maxHealth,
      currentBiome: this.currentBiome,
      intensity: this.waveManager ? this.waveManager.intensity : 1,
      performanceFactor: this.performanceFactor || 1.0,
      weaponHeat: this.weaponHeat,
      furyActive: this.furyActive,
      furyCooldown: this.furyCooldownTimer,
      dashCooldownTimer: this.dashCooldownTimer,
      dashCooldown: this.dashCooldown,
      rapidFireTimer: this.rapidFireTimer,
      spikeBurstTimer: this.spikeBurstTimer,
      shakeIntensity:
        this.threatShakeIntensity +
        (this.shakeTime > 0 ? this.shakeMagnitude * (this.shakeTime / 0.5) * 0.5 : 0),
    };
    GameEngineStatusBus.publish(status);
    GameEngineStatusBus.syncLegacyWindowGlobal(status);

    if (this.isPaused) {
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
      return;
    }

    this.globalTime += dt;

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

  /** Delegates to PowerupSystem. */
  spawnPowerup(x: number, y: number, force = false) {
    this.powerupSystem.spawn(x, y, force);
  }

  /** Delegates to PowerupSystem. */
  spawnResource(x: number, y: number, bugType: string) {
    this.powerupSystem.spawnResource(x, y, bugType);
  }

  private musicUpdateTimer = 0;

  update(dt: number) {
    if (this.health <= 0) {
      this.isRunning = false;
      this.onGameOver?.(this.score);
      return;
    }

    // Update speed_demon modifier: bug speed increases per kill
    if (this.challengeModifiers?.speedDemonActive && this.totalKills > 0) {
      this.challengeBugSpeedBonus = Math.min(
        this.challengeModifiers.speedDemonMax,
        this.totalKills * this.challengeModifiers.speedDemonPerKill,
      );
    }

    // Core Logic Systems
    this.updateTimers(dt);
    this.updateCorePhysics(dt);
    this.updateMetrics(dt);
    this.waveManager.update(dt);

    // Entity Systems
    this.updateTurrets(dt);
    this.updateBugs(dt);
    this.hazardSystem.update(dt);

    // Environmental Systems
    this.particleSystem.update(dt);
    this.powerupSystem.updatePowerups(dt);
    this.powerupSystem.updateResources(dt);
    this.gooSystem.update(dt);
    if (this.pcgSystem) {
      this.pcgSystem.update(dt);
    }

    // Ground Slam charge accumulation (charged while held, released on pointerup)
    if (this.slamCharging) {
      this.slamCharge = Math.min(this.slamChargeMax, this.slamCharge + dt * 1.4);
    }

    // Adaptive Music State Sync (every 500ms) — FURY MODE surges the soundtrack
    this.musicUpdateTimer += dt;
    if (this.musicUpdateTimer >= 0.5) {
      this.musicUpdateTimer = 0;
      soundManager.updateGameState({
        intensity: this.performanceFactor * (this.furyActive ? 1.6 : 1),
        healthPercent: this.health / this.maxHealth,
        isBossWave: this.waveManager.isBossWave,
        isSurgeActive: this.waveManager.surgeActive || this.furyActive,
      });
    }
  }

  fireAutoTurret(isRapidFire = false) {
    let closest = null;
    let minDistSq = Infinity;
    const cx = this.coreX;
    const cy = this.coreY;

    for (const bug of this.bugs) {
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
      this.renderer.clickFlash = 0.3;
      this.particleSystem.spawnMuzzleFlash(cx, cy, 30);

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
        return;
      }
      soundManager.bossHit();
      const pulse = Math.sin(this.globalTime * 10);
      if (pulse > 0.8) {
        isCrit = true;
        finalAmount *= 2;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 60);
        this.triggerHitStop(0.05);
        this.renderer.chromaticOffset = 10;
      } else if (pulse < -0.8) {
        finalAmount *= 0.5;
      }
    } else {
      const critChance = 0.05 + ProgressionManager.getSkillBonus('crit_hit');
      if (Math.random() < critChance) {
        isCrit = true;
        finalAmount *= 2.0;
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffd700', 80);
        this.renderer.chromaticOffset = 12;
      }
    }

    // FURY MODE: every hit is a guaranteed crit at ×2 damage — the venting reward
    const furyCrit = this.furyActive;
    if (furyCrit) {
      isCrit = true;
      finalAmount *= 2.0;
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff6a00', 90);
    }

    if (isCrit) {
      soundManager.critHit();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_crit_hit'));
      }
    }

    if (bug.armor && bug.armor < 1.0 && bug.armor > 0) {
      finalAmount *= bug.armor;
    }

    bug.hp -= finalAmount;
    bug.hitTimer = 0.1;

    if (finalAmount >= 1) {
      this.triggerHitStop(0.05);
      this.shake(isCrit ? 0.09 : 0.05, isCrit ? 7 : 2);
    }

    // Reactive bug: scouts dive away from the strike point when they survive
    if (bug.type === 'scout' && bug.hp > 0 && !bug.dodgeTimer) {
      const fromX = this.inputSystem?.lastMouseX ?? bug.x + 1;
      const fromY = this.inputSystem?.lastMouseY ?? bug.y;
      const dx = bug.x - fromX;
      const dy = bug.y - fromY;
      const dist = Math.hypot(dx, dy) || 1;
      bug.dodgeTimer = 0.35;
      bug.dodgeDirX = dx / dist;
      bug.dodgeDirY = dy / dist;
      this.particleSystem.spawnSmoke(bug.x, bug.y, 'rgba(200, 200, 255, 0.4)');
    }

    if (bug.hp <= 0) {
      this.killBug(bug);
    } else {
      // Crits already announce via critHit() above — avoid double-firing the plain shot
      if (!isCrit) soundManager.shoot();
      this.particleSystem.spawnGibs(bug.x, bug.y, bug.color, 3);
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 30);
    }
  }

  private killBug(bug: Bug) {
    const idx = this.bugs.indexOf(bug);
    if (idx < 0) return;

    if (bug.type === 'swarmer') this.swarmerKills++;
    if (bug.type === 'healer') this.healerKills++;
    this.killsInSubwave++;

    this.totalKills++;
    this.streakCount++;
    this.streakTimer = 2.0;

    const isBossKill = bug.type === 'boss';

    StatsManager.updateStats({ totalBugsKilled: 1, bossesKilled: isBossKill ? 1 : 0 });

    const mult = this.multiplierTimer > 0 ? 2 : 1;
    this.score += bug.scoreValue * mult;

    // Dispatch smashed event for large bugs (size >= 20 or specific large types)
    if (
      bug.size >= 20 ||
      bug.type === 'boss' ||
      bug.type === 'tank' ||
      bug.type === 'healer' ||
      bug.type === 'ember'
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nexus_bug_smashed', {
            detail: {
              type: bug.type,
              color: bug.color,
              size: bug.size,
              scoreValue: bug.scoreValue * mult,
              streak: this.streakCount,
            },
          }),
        );
      }
    }

    soundManager.splat(bug.type);

    this.triggerHitStop(0.04);

    const isBoss = bug.type === 'boss';
    const intensity = isBoss
      ? 4.0
      : bug.type === 'tank' || bug.type === 'swarmer'
        ? 1.4
        : bug.type === 'scout'
          ? 0.7
          : 0.9;
    this.shake(isBoss ? 0.6 : 0.15 * intensity, isBoss ? 40 : 8 * intensity);

    // Reduce particle count on low-end or during surge — skip splatters (most expensive)
    if (this.renderer.currentFps > 30) {
      this.particleSystem.spawnSplatter(bug.x, bug.y, bug.color);
    }
    this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color, bug.type);

    // Splatter accumulation loop — every smash leaves persistent goo on the field
    this.gooSystem.addGoo(bug.x, bug.y, bug.size, bug.color);

    this.spawnResource(bug.x, bug.y, bug.type);

    if (isBoss) {
      soundManager.bossDeath();
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', 800);

      this.onStoryTrigger?.('boss_kill', this.wave);

      const dx = (bug.x - this.coreX) / (this.width / 2);
      const dy = (bug.y - this.coreY) / (this.height / 2);
      this.shake(1.5, 60, dx, dy);
      this.triggerHitStop(0.2);
      this.renderer.chromaticOffset = 40;
      this.impactFrame = 1.0;

      for (let i = 0; i < 3; i++) {
        this.spawnPowerup(
          bug.x + (Math.random() - 0.5) * 50,
          bug.y + (Math.random() - 0.5) * 50,
          true,
        );
      }

      // Cap boss death particles based on current FPS
      const bossParticleCount = this.renderer.currentFps > 30 ? 40 : 15;
      for (let i = 0; i < bossParticleCount; i++) {
        this.particleSystem.spawnParticle(bug.x, bug.y, bug.color);
      }
    }

    // Swarmer splitting logic — skip on low FPS to prevent entity explosion
    const shouldSplit = this.renderer.currentFps >= 25;
    if (shouldSplit && (bug.type === 'swarmer' || this.currentBiome === 'golden_cache')) {
      const splitCount = this.currentBiome === 'golden_cache' ? 2 : 3;
      for (let i = 0; i < splitCount; i++) {
        const angle = ((Math.PI * 2) / splitCount) * i;
        const dist = 20;
        const miniConf = GameConfig.bugs.mini;
        this.bugs.push({
          active: true,
          x: bug.x + Math.cos(angle) * dist,
          y: bug.y + Math.sin(angle) * dist,
          type: 'mini',
          speed: miniConf.baseSpeed + this.wave * miniConf.speedPerWave,
          color: miniConf.color,
          size: miniConf.size,
          scoreValue: miniConf.score,
          hp: miniConf.baseHp,
          maxHp: miniConf.baseHp,
          walkCycle: Math.random() * 10,
          rotation: 0,
          offsetTime: Math.random() * 100,
          hitTimer: 0,
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

  draw() {
    this.renderer.draw();
  }

  /** Delegates to PowerupSystem. */
  activatePowerup(type: string, px?: number, py?: number) {
    this.powerupSystem.activate(type, px, py);
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
      timestamp: Date.now(),
      biome: this.currentBiome,
      // Persist the rage meter + FURY cooldown so a saved run restores the vent state.
      weaponHeat: this.weaponHeat,
      furyCooldownTimer: this.furyCooldownTimer,
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
    if (data.biome) {
      this.currentBiome = data.biome;
    }

    this.resetEntities();
    // Restore the rage meter + FURY ignition cooldown AFTER resetEntities()
    // (which zeroes them) so a mid-run save/load carries the vent state forward.
    this.weaponHeat = Math.min(GameConfig.rage.maxHeat, Math.max(0, data.weaponHeat ?? 0));
    this.furyCooldownTimer = Math.max(0, data.furyCooldownTimer ?? 0);
    this.waveManager.waveActive = false;
  }

  syncSkills() {
    const data = ProgressionManager.getData();
    this.maxHealth =
      GameConfig.player.maxHealth + ProgressionManager.getSkillBonus('hardened_hull');
    this.clickRadiusMultiplier = 1 + ProgressionManager.getSkillBonus('amplified_pulse');
    this.damageMultiplier = 1 + ProgressionManager.getSkillBonus('kinetic_amplifier');
    this.prestigeLevel = data.prestigeLevel;

    // Apply challenge modifier overrides
    if (this.challengeModifiers) {
      this.maxHealth *= this.challengeModifiers.maxHealthMultiplier;
      this.damageMultiplier *= this.challengeModifiers.playerDamageMultiplier;
    }
  }

  /** Configure challenge modifiers for this run. */
  setChallengeModifiers(modifiers: ChallengeModifierId[]) {
    this.isChallengeMode = true;
    this.challengeModifiers = computeModifierState(modifiers);
    this.syncSkills(); // Apply glass_cannon health/damage multipliers immediately
  }

  consumeConsumable(id: string): boolean {
    if (!ProgressionManager.consumeConsumable(id)) return false;

    switch (id) {
      case 'repair_kit':
        this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.25);
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#00ffaa', 300);
        soundManager.skillUpgrade();
        break;
      case 'emp_generator':
        this.bugs.forEach((b) => {
          if (b.type !== 'boss') {
            b.hp = 0;
            this.particleSystem.spawnExplosion(b.x, b.y, b.color);
          }
        });
        this.shake(1.5, 40);
        this.particleSystem.spawnShockwave(this.width / 2, this.height / 2, '#ffffff', 1000);
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

    // RAGE METER — FURY MODE drains the meter over its full duration;
    // otherwise it cools down slowly so the player can vent again
    if (this.furyActive) {
      this.furyTimer -= dt;
      // Drain the meter to match the advertised duration: 100 / 4s = 25/s
      this.weaponHeat = Math.max(
        0,
        this.weaponHeat - (GameConfig.rage.maxHeat / this.furyDuration) * dt,
      );
      if (this.furyTimer <= 0 || this.weaponHeat <= 0) {
        this.furyActive = false;
        this.furyTimer = 0;
        this.weaponHeat = 0;
        // Start the post-FURY ignition cooldown (once-per-wave cadence)
        this.furyCooldownTimer = GameConfig.rage.furyCooldown;
      }
    } else {
      // Post-FURY cooldown: meter refills but FURY waits; auto-ignites the
      // moment the cooldown clears if the meter is already full
      if (this.furyCooldownTimer > 0) {
        this.furyCooldownTimer -= dt;
        if (this.furyCooldownTimer <= 0) {
          this.furyCooldownTimer = 0;
          if (this.weaponHeat >= GameConfig.rage.maxHeat) this.triggerFury();
        }
      }
      if (!this.furyActive && this.weaponHeat > 0) {
        this.weaponHeat -= GameConfig.rage.decayPerSecond * dt;
        if (this.weaponHeat < 0) this.weaponHeat = 0;
      }
    }

    // Refill the per-second rage gain budget (both during FURY and after, so
    // the meter is ready to charge the moment an eruption ends)
    this.rageGainBudget = Math.min(
      this.rageGainBudgetMax,
      this.rageGainBudget + this.rageGainBudgetMax * dt,
    );

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
    if (this.waveTransitionTimer > 0) {
      this.waveTransitionTimer = Math.max(0, this.waveTransitionTimer - dt);
    }

    // Decrement active ability cooldowns and durations
    if (this.bioshieldCooldown > 0)
      this.bioshieldCooldown = Math.max(0, this.bioshieldCooldown - dt);
    if (this.bioshieldActiveTime > 0)
      this.bioshieldActiveTime = Math.max(0, this.bioshieldActiveTime - dt);
    if (this.overdriveCooldown > 0)
      this.overdriveCooldown = Math.max(0, this.overdriveCooldown - dt);
    if (this.overdriveActiveTime > 0)
      this.overdriveActiveTime = Math.max(0, this.overdriveActiveTime - dt);
    if (this.empShatterCooldown > 0)
      this.empShatterCooldown = Math.max(0, this.empShatterCooldown - dt);
    if (this.empShatterActiveTime > 0)
      this.empShatterActiveTime = Math.max(0, this.empShatterActiveTime - dt);
  }

  private updateMetrics(dt: number) {
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0 && this.streakCount > 0) {
        soundManager.comboBreak();
        // Rage refund: the streak death drops a consolation powerup near the core
        this.spawnRageRefund();
        this.streakCount = 0;
      }
    }
    const safetyBonus = Math.min(1.0, (this.globalTime - this.lastHitTime) / 20);
    const streakBonus = Math.min(1.0, this.streakCount / 50);
    this.performanceFactor = 0.8 + safetyBonus * 0.7 + streakBonus * 1.0;
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
    if (
      this.autoTurretLevel > 0 ||
      this.rapidFireTimer > 0 ||
      this.overdriveTimer > 0 ||
      this.overdriveActiveTime > 0
    ) {
      this.autoTurretTimer += dt * this.hazardSlowdown;
      const baseFireRate = GameConfig.upgrades.turret.baseFireRate;
      let fireRate = Math.max(
        GameConfig.upgrades.turret.minFireRate,
        baseFireRate -
          this.autoTurretLevel * GameConfig.upgrades.turret.fireRateReduction -
          ProgressionManager.getSkillBonus('sentry_optimization'),
      );
      if (this.overdriveTimer > 0 || this.overdriveActiveTime > 0) fireRate *= 0.2;
      if (this.rapidFireTimer > 0) fireRate = 0.05;

      if (this.autoTurretTimer > fireRate && this.bugs.length > 0) {
        this.autoTurretTimer = 0;
        this.fireAutoTurret(this.rapidFireTimer > 0 || this.overdriveActiveTime > 0);
      }

      // Tactical Missile Sentry
      const missileLevel = ProgressionManager.getSkillLevel('missile_sentry');
      if (missileLevel > 0) {
        this.missileSentryTimer += dt;
        if (this.missileSentryTimer >= 10.0) {
          this.missileSentryTimer = 0;
          const threatTargets = this.bugs.filter((b) => b.active && b.hp > 0);
          if (threatTargets.length > 0) {
            const target = threatTargets[0];
            this.particleSystem.spawnLaser(this.coreX, this.coreY, target.x, target.y, '#fd8432');
            this.particleSystem.spawnShockwave(target.x, target.y, '#f97316', 70);
            this.damageBug(target, 15 * missileLevel);
            soundManager.bossWarning();
          }
        }
      }
    }
  }

  // Active skills trigger (Progression Skill Tree)
  triggerActiveAbility(id: string): boolean {
    const level = ProgressionManager.getSkillLevel(id);
    if (level <= 0) {
      console.warn(`Ability ${id} is not unlocked!`);
      return false;
    }

    if (id === 'nanite_bioshield') {
      if (this.bioshieldCooldown > 0) return false;
      this.bioshieldCooldown = GameConfig.abilities.bioshieldCooldown; // from config per audit
      this.bioshieldActiveTime = 4; // 4s invincibility
      this.health = Math.min(this.maxHealth, this.health + 25);
      this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#10b981', 250);
      soundManager.heal();
      return true;
    }

    if (id === 'turret_overdrive') {
      if (this.overdriveCooldown > 0) return false;
      this.overdriveCooldown = 45; // 45s cooldown
      this.overdriveActiveTime = 8; // 8s duration
      this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#fbbf24', 200);
      soundManager.armoryEquip();
      return true;
    }

    if (id === 'chrono_emp_shatter') {
      if (this.empShatterCooldown > 0) return false;
      this.empShatterCooldown = 50; // 50s cooldown
      this.empShatterActiveTime = 5; // 5s duration
      this.activatePowerup('freeze', this.coreX, this.coreY);
      this.bugs.forEach((b) => {
        this.damageBug(b, b.hp * 0.3); // decay 30% of bug's current health
      });
      this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#a855f7', 350);
      soundManager.bossWarning();
      return true;
    }

    return false;
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

      if (distSq < 900) {
        this.collisionSystem.handleBugImpact(bug, centerX, centerY);
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

  private moveBug(bug: Bug, dx: number, dy: number, dist: number, dt: number, timeScale: number) {
    // Reactive dodge — scouts burst away from the last strike for a short window
    if (bug.dodgeTimer && bug.dodgeTimer > 0) {
      bug.dodgeTimer -= dt;
      const dodgeSpeed = bug.speed * 5 * timeScale;
      bug.x += (bug.dodgeDirX ?? 0) * dodgeSpeed * dt;
      bug.y += (bug.dodgeDirY ?? 0) * dodgeSpeed * dt;
      bug.walkCycle += dodgeSpeed * dt * 0.2;
      return;
    }

    let speed = bug.speed * timeScale;

    // Apply challenge modifiers
    if (this.challengeModifiers) {
      speed *= this.challengeModifiers.bugSpeedMultiplier;
      if (this.challengeModifiers.speedDemonActive) {
        speed *= 1 + this.challengeBugSpeedBonus;
      }
      if (this.challengeModifiers.frostbiteActive) {
        // Slow to 20% speed when close to core, speed up over time
        const distFactor = Math.min(1, dist / 300);
        const frostSlow = 0.2 + distFactor * 0.8;
        speed *= frostSlow;
      }
    }
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;
    if (bug.type === 'scout' || bug.type === 'swarmer') {
      const erratic =
        Math.sin(this.globalTime * 10 + bug.offsetTime) * (bug.type === 'swarmer' ? 1.2 : 0.5);
      vx += -vy * erratic;
      vy += (dx / dist) * speed * erratic;
    }
    bug.rotation = Math.atan2(vy, vx) - Math.PI / 2;
    bug.x += vx * dt;
    bug.y += vy * dt;
    bug.walkCycle += speed * dt * 0.2;
  }

  private updateBugAbilities(bug: Bug, dt: number, timeScale: number, distSq: number) {
    // Biome-specific and type-specific abilities
    if (this.currentBiome === 'void_abyss' || bug.type === 'phase') {
      bug.lastTeleportTime = (bug.lastTeleportTime || 0) + dt * timeScale;
      if (bug.lastTeleportTime > (bug.type === 'phase' ? 2.0 : 4.0) && distSq > 10000) {
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

        const HEAL_RADIUS_SQ = 22500;
        for (const o of this.bugs) {
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
    // Delegate boss ability updates to BossSystem
    if (bug.type === 'boss') {
      this.bossSystem.update(bug, dt, timeScale);
    }
  }

  updateCorePhysics(dt: number) {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;

      const t = 1 - this.dashTimer / this.dashDuration;
      const ease = t * (2 - t);
      this.coreX = this.dashStartX + (this.dashTargetX - this.dashStartX) * ease;
      this.coreY = this.dashStartY + (this.dashTargetY - this.dashStartY) * ease;

      const trailColor = this.shieldTimer > 0 ? '#00e1ff' : '#00ffcc';
      this.particleSystem.spawnSparkExplosion(this.coreX, this.coreY, trailColor);

      // Delegate dash push/damage to CollisionSystem
      this.collisionSystem.handleDashPush(dt);

      if (this.dashTimer <= 0) {
        this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', 160);
      }
    } else {
      const targetCenterX = this.width / 2;
      const targetCenterY = this.height / 2;

      const dx = targetCenterX - this.coreX;
      const dy = targetCenterY - this.coreY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        const slideSpeed = 240;
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

    const margin = 50;
    this.dashTargetX = Math.max(margin, Math.min(this.width - margin, this.dashTargetX));
    this.dashTargetY = Math.max(margin, Math.min(this.height - margin, this.dashTargetY));

    this.renderer.chromaticOffset = 25;
    this.impactFrame = 0.35;
    this.shake(0.4, 12);

    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ffffff', 80);
  }
}
