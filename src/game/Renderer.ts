import { GameEngine } from './GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from './GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from './ParticleSystem';
import { PerformanceScaler } from './rendering/PerformanceScaler';
import { EnvironmentRenderer } from './rendering/EnvironmentRenderer';
import { BugRenderer } from './rendering/BugRenderer';
import { ParticleRenderer } from './rendering/ParticleRenderer';
import { UIRenderer } from './rendering/UIRenderer';

/**
 * Canvas orchestrator — delegates drawing to focused sub-renderers.
 * @see EnvironmentRenderer, BugRenderer, ParticleRenderer, UIRenderer
 */
export class Renderer {
  engine: GameEngine;
  isGlitching: boolean = false;
  fireAlpha: number = 0;
  clickFlash: number = 0;
  impactFlash: number = 0;
  powerupAlpha: number = 0;
  chromaticOffset: number = 0;

  private scaler: PerformanceScaler;
  private environment: EnvironmentRenderer;
  private bugs: BugRenderer;
  private particles: ParticleRenderer;
  private ui: UIRenderer;

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.scaler = new PerformanceScaler(engine);
    this.environment = new EnvironmentRenderer(engine, this, this.scaler);
    this.bugs = new BugRenderer(engine, this, this.scaler);
    this.particles = new ParticleRenderer(engine, this, this.scaler);
    this.ui = new UIRenderer(engine, this, this.scaler);
  }

  get isLowEnd(): boolean {
    return this.scaler.isLowEnd;
  }

  get vfxScalar(): number {
    return this.scaler.vfxScalar;
  }

  set vfxScalar(value: number) {
    this.scaler.vfxScalar = value;
  }

  get meshComplexityStep(): number {
    return this.scaler.meshComplexityStep;
  }

  get currentFps(): number {
    return this.scaler.currentFps;
  }

  set currentFps(value: number) {
    this.scaler.currentFps = value;
  }

  // New quality/post tunables (from extended presets)
  get crtIntensity(): number { return this.scaler.crtIntensity; }
  get heatDistort(): number { return this.scaler.heatDistort; }
  get emissiveScale(): number { return this.scaler.emissiveScale; }
  get glowScalar(): number { return this.scaler.glowScalar; }
  get currentQualityPreset(): string { return this.scaler.currentPreset; }

  applyQualityPreset(name: import('./rendering/PerformanceScaler').QualityPresetName): void {
    this.scaler.applyPreset(name);
  }

  /** @deprecated Prefer draw() which calls scaler.tick() — kept for unit tests */
  updatePerformanceScaler(): void {
    this.scaler.tick();
  }

  drawLightingPass(width: number, height: number): void {
    this.ui.drawLightingPass(width, height);
  }

  drawActivePowerupUI(width: number, height: number): void {
    this.ui.drawActivePowerupUI(width, height);
  }

  drawBossHealthBar(width: number, height: number): void {
    this.ui.drawBossHealthBar(width, height);
  }

  draw(): void {
    this.updatePerformanceScaler();

    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;

    let offsetX = 0;
    let offsetY = 0;

    const reducedMotion = this.engine.accessibility?.reducedMotion ?? false;
    const ambientShake = reducedMotion ? 0 : this.engine.threatShakeIntensity;
    if (ambientShake > 0) {
      offsetX = (Math.random() - 0.5) * ambientShake;
      offsetY = (Math.random() - 0.5) * ambientShake;
    }

    if (!reducedMotion && this.engine.shakeTime > 0) {
      const intensity = this.engine.shakeTime / 0.5;
      const rx = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      const ry = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      offsetX += rx + this.engine.shakeX * this.engine.shakeMagnitude * intensity;
      offsetY += ry + this.engine.shakeY * this.engine.shakeMagnitude * intensity;
    }

    ctx.setTransform(
      this.engine.dpr,
      0,
      0,
      this.engine.dpr,
      offsetX * this.engine.dpr,
      offsetY * this.engine.dpr
    );

    const waveMilestone = Math.floor(this.engine.wave / 10);
    let bgColor = '#050505';
    if (waveMilestone === 1) bgColor = '#0a0508';
    else if (waveMilestone === 2) bgColor = '#0d0505';
    else if (waveMilestone === 3) bgColor = '#050a0d';
    else if (waveMilestone === 4) bgColor = '#10050a';
    else if (waveMilestone >= 5) bgColor = '#1a0d05';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (this.isGlitching) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 255, 0.1)';
      ctx.fillRect((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, width, height);
    }

    this.environment.drawBiomeBackground();
    this.particles.drawClouds();

    if (this.engine.wave > 15 || this.engine.waveManager.isBossWave) {
      if (this.currentFps > 35) {
        this.environment.drawGlitchOverlay();
      }
    }

    if (this.engine.waveManager.bossIntroActive) {
      this.environment.drawBossIntro();
    }

    if (this.engine.performanceFactor > 2.0 && Math.random() < 0.05 && this.currentFps > 40) {
      this.environment.drawGlitchOverlay();
    }

    if (this.engine.wave % 10 === 0 && this.engine.waveManager.waveActive && this.currentFps > 30) {
      const activeBoss = this.engine.bugs.find((b) => b.type === 'boss');
      if (activeBoss && activeBoss.hp === activeBoss.maxHp) {
        this.environment.drawBossWarning();
      }
    }

    const ps = this.engine.particleSystem;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < ps.splatters.length; i++) {
      const s = ps.splatters[i];
      if (s.active) this.particles.drawSplatter(s);
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ps.shockwaves.length; i++) {
      const sw = ps.shockwaves[i];
      if (sw.active) this.particles.drawShockwave(sw);
    }
    for (let i = 0; i < ps.particles.length; i++) {
      const p = ps.particles[i];
      if (p.active) this.particles.drawParticle(p);
    }
    for (let i = 0; i < ps.lasers.length; i++) {
      const l = ps.lasers[i];
      if (l.active) this.particles.drawLaser(l);
    }
    for (let i = 0; i < ps.muzzleFlashes.length; i++) {
      const mf = ps.muzzleFlashes[i];
      if (mf.active) this.particles.drawMuzzleFlash(mf);
    }

    ctx.globalCompositeOperation = 'source-over';

    const powerups = this.engine.powerups;
    for (let i = 0; i < powerups.length; i++) this.particles.drawPowerup(powerups[i]);

    const resources = this.engine.resources;
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      if (r.active) this.particles.drawResource(r);
    }

    this.bugs.drawBase();

    const hazards = this.engine.hazards;
    for (let i = 0; i < hazards.length; i++) this.bugs.drawHazard(hazards[i]);

    const bugs = this.engine.bugs;
    for (let i = 0; i < bugs.length; i++) this.bugs.drawBug(bugs[i]);

    this.environment.drawScanlines();
    this.environment.drawCRTOverlay();

    if (this.chromaticOffset > 0) {
      this.environment.drawChromaticAberration();
      this.chromaticOffset *= 0.9;
      if (this.chromaticOffset < 0.1) this.chromaticOffset = 0;
    }

    if (this.clickFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.clickFlash * 0.05})`;
      ctx.fillRect(0, 0, width, height);
      this.clickFlash *= 0.85;
      if (this.clickFlash < 0.01) this.clickFlash = 0;
    }

    if (this.engine.impactFrame > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.engine.impactFrame * 0.8})`;
      ctx.fillRect(0, 0, width, height);
    }

    this.ui.drawLightingPass(width, height);

    const healthRatio = this.engine.health / this.engine.maxHealth;
    const isCrisis = healthRatio < 0.3;
    const vOpacity = isCrisis
      ? 0.5 + Math.sin(this.engine.globalTime * 8) * 0.2
      : Math.min(0.25, (this.engine.wave / 50) * 0.25);

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width / 4,
      width / 2,
      height / 2,
      width * 0.8
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(
      1,
      isCrisis ? `rgba(255, 0, 0, ${vOpacity * 0.5})` : `rgba(0, 0, 0, ${vOpacity})`
    );

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    this.ui.drawActivePowerupUI(width, height);
    this.ui.drawBossHealthBar(width, height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // --- Delegation surface (preserves public API for tests & external callers) ---

  drawBiomeBackground = () => this.environment.drawBiomeBackground();
  drawGrid = (...args: Parameters<EnvironmentRenderer['drawGrid']>) => this.environment.drawGrid(...args);
  drawStarfield = (...args: Parameters<EnvironmentRenderer['drawStarfield']>) =>
    this.environment.drawStarfield(...args);
  drawLavaBubbles = () => this.environment.drawLavaBubbles();
  drawSnowflakes = () => this.environment.drawSnowflakes();
  drawDynamicMesh = () => this.environment.drawDynamicMesh();
  drawCRTOverlay = () => this.environment.drawCRTOverlay();
  drawGlitchOverlay = () => this.environment.drawGlitchOverlay();
  drawScanlines = () => this.environment.drawScanlines();
  drawChromaticAberration = () => this.environment.drawChromaticAberration();
  drawBossIntro = () => this.environment.drawBossIntro();
  drawBossWarning = () => this.environment.drawBossWarning();
  drawClouds = () => this.particles.drawClouds();

  drawHazard = (h: Hazard) => this.bugs.drawHazard(h);
  drawBase = () => this.bugs.drawBase();
  drawBug = (bug: Bug) => this.bugs.drawBug(bug);
  drawBugTrail = (bug: Bug) => this.bugs.drawBugTrail(bug);
  drawBugBody = (bug: Bug, legSwing: number) => this.bugs.drawBugBody(bug, legSwing);

  drawPowerup = (p: Powerup) => this.particles.drawPowerup(p);
  drawResource = (r: ResourcePickup) => this.particles.drawResource(r);
  drawSplatter = (s: Splatter) => this.particles.drawSplatter(s);
  drawParticle = (p: Particle) => this.particles.drawParticle(p);
  drawShockwave = (sw: Shockwave) => this.particles.drawShockwave(sw);
  drawLaser = (l: Laser) => this.particles.drawLaser(l);
  drawMuzzleFlash = (f: MuzzleFlash) => this.particles.drawMuzzleFlash(f);
}