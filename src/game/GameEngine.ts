import { soundManager } from './SoundManager';
import { GameConfig } from './GameConfig';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { WaveManager } from './WaveManager';
import { GameSaveData } from './SaveManager';
import { StatsManager, statsManager } from './StatsManager';
import { ProgressionManager, progressionManager } from './ProgressionManager';
import { InputSystem } from './InputSystem';
import { Bug, Hazard, Powerup, ResourcePickup } from './GameTypes';
import { CollisionSystem } from './CollisionSystem';
import { CombatSystem } from './CombatSystem';
import { BugBehaviorSystem } from './BugBehaviorSystem';
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
  combatSystem: CombatSystem;
  collisionSystem: CollisionSystem;
  bossSystem: BossSystem;
  bugBehaviorSystem: BugBehaviorSystem;
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
  rageGainBudget = GameConfig.rage.maxGainPerSecond;
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

  // Injected dependencies (A-03) — default to app singletons
  statsManager: StatsManager;
  progressionManager: ProgressionManager;

  onGameOver?: (score: number) => void;
  onWaveComplete?: () => void;
  onStoryTrigger?: (
    type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige',
    value: number,
  ) => void;

  constructor(
    canvas: HTMLCanvasElement,
    deps: { statsManager?: StatsManager; progressionManager?: ProgressionManager } = {},
  ) {
    this.canvas = canvas;
    this.statsManager = deps.statsManager ?? statsManager;
    this.progressionManager = deps.progressionManager ?? progressionManager;
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
    this.combatSystem = new CombatSystem(this);
    this.collisionSystem = new CollisionSystem(this);
    this.bossSystem = new BossSystem(this);
    this.bugBehaviorSystem = new BugBehaviorSystem(this);
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
    this.combatSystem.reset();
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

  // Combat delegation — logic lives in CombatSystem (A-01)
  addRage(amount: number) {
    this.combatSystem.addRage(amount);
  }
  triggerFury() {
    this.combatSystem.triggerFury();
  }
  applyFurySplash(x: number, y: number) {
    this.combatSystem.applyFurySplash(x, y);
  }
  triggerGroundSlam(x: number, y: number, charge: number) {
    this.combatSystem.triggerGroundSlam(x, y, charge);
  }
  spawnRageRefund() {
    this.combatSystem.spawnRageRefund();
  }
  fireAutoTurret(isRapidFire = false) {
    this.combatSystem.fireAutoTurret(isRapidFire);
  }
  triggerUpgradeEffect() {
    this.combatSystem.triggerUpgradeEffect();
  }
  damageBug(bug: Bug, amount: number) {
    this.combatSystem.damageBug(bug, amount);
  }
  consumeConsumable(id: string): boolean {
    return this.combatSystem.consumeConsumable(id);
  }
  triggerActiveAbility(id: string): boolean {
    return this.combatSystem.triggerActiveAbility(id);
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
    this.combatSystem.updateTimers(dt);
    this.updateCorePhysics(dt);
    this.combatSystem.updateMetrics(dt);
    this.waveManager.update(dt);

    // Entity Systems
    this.combatSystem.updateTurrets(dt);
    this.bugBehaviorSystem.update(dt);
    this.hazardSystem.update(dt);

    // Environmental Systems
    this.particleSystem.update(dt);
    this.powerupSystem.updatePowerups(dt);
    this.powerupSystem.updateResources(dt);
    this.gooSystem.update(dt);
    if (this.pcgSystem) {
      this.pcgSystem.update(dt);
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
    const data = this.progressionManager.getData();
    this.maxHealth =
      GameConfig.player.maxHealth + this.progressionManager.getSkillBonus('hardened_hull');
    this.clickRadiusMultiplier = 1 + this.progressionManager.getSkillBonus('amplified_pulse');
    this.damageMultiplier = 1 + this.progressionManager.getSkillBonus('kinetic_amplifier');
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
