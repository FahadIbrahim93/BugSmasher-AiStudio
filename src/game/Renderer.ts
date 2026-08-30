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
  isGlitching = false;
  fireAlpha = 0;
  clickFlash = 0;
  impactFlash = 0;
  powerupAlpha = 0;
  chromaticOffset = 0;
  /** Computed screen-shake offset for parallax depth layers */
  parallaxOffsetX = 0;
  parallaxOffsetY = 0;

  private scaler: PerformanceScaler;
  private environment: EnvironmentRenderer;
  private bugs: BugRenderer;
  private particles: ParticleRenderer;
  private ui: UIRenderer;

  // Cached gradients to avoid GC pressure (created once, invalidated on resize)
  private cachedVignette: CanvasGradient | null = null;
  private lastVignetteWidth = 0;
  private lastVignetteHeight = 0;
  private lastCrisis = false;
  private lastVOpacity = -1;

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

    // Store offsets for parallax depth layers (EnvironmentRenderer reads these)
    this.parallaxOffsetX = offsetX;
    this.parallaxOffsetY = offsetY;

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
    this.drawGooPools();

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
    const hasEffects = ps.hasActiveEffects;
    
    if (hasEffects) {
      // Heat shimmer rendered below everything else (FPS-gated)
      if (this.currentFps > 28) {
        ctx.globalCompositeOperation = 'screen';
        for (const hs of ps.heatShimmers) {
          if (hs.active) this.particles.drawHeatShimmer(hs);
        }
      }

      ctx.globalCompositeOperation = 'screen';
      for (const s of ps.splatters) {
        if (s.active) this.particles.drawSplatter(s);
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const sw of ps.shockwaves) {
        if (sw.active) this.particles.drawShockwave(sw);
      }
      for (const p of ps.particles) {
        if (p.active) this.particles.drawParticle(p);
      }
      for (const l of ps.lasers) {
        if (l.active) this.particles.drawLaser(l);
      }
      for (const mf of ps.muzzleFlashes) {
        if (mf.active) this.particles.drawMuzzleFlash(mf);
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    const powerups = this.engine.powerups;
    for (const p of powerups) this.particles.drawPowerup(p);

    const resources = this.engine.resources;
    for (const r of resources) {
      if (r.active) this.particles.drawResource(r);
    }

    // Render Procedural Level Structures
    if (this.engine.pcgSystem && this.engine.pcgSystem.activeMap) {
      this.engine.pcgSystem.render(ctx);
    }

    this.bugs.drawBase();

    const hazards = this.engine.hazards;
    for (const hazard of hazards) this.bugs.drawHazard(hazard);

    const bugs = this.engine.bugs;
    for (const bug of bugs) {
      if (bug.active) this.bugs.drawBug(bug);
    }

    // Skip expensive overlay passes when FPS is struggling
    if (this.currentFps > 30) {
      this.environment.drawScanlines();
    }
    if (this.currentFps > 25) {
      this.environment.drawCRTOverlay();
    }

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

    // Cache vignette gradient — recreate only on dimension/state change
    if (this.cachedVignette === null ||
        this.lastVignetteWidth !== width ||
        this.lastVignetteHeight !== height ||
        this.lastCrisis !== isCrisis ||
        this.lastVOpacity !== vOpacity) {
      this.cachedVignette = ctx.createRadialGradient(
        width / 2, height / 2, width / 4,
        width / 2, height / 2, width * 0.8
      );
      this.cachedVignette.addColorStop(0, 'rgba(0,0,0,0)');
      this.cachedVignette.addColorStop(
        1,
        isCrisis ? `rgba(255, 0, 0, ${vOpacity * 0.5})` : `rgba(0, 0, 0, ${vOpacity})`
      );
      this.lastVignetteWidth = width;
      this.lastVignetteHeight = height;
      this.lastCrisis = isCrisis;
      this.lastVOpacity = vOpacity;
    }

    ctx.fillStyle = this.cachedVignette;
    ctx.fillRect(0, 0, width, height);

    // Streak-tier screen reddening — the higher the combo, the hotter the frame
    if (this.engine.streakCount >= 5) {
      const streakHeat = Math.min(0.4, (this.engine.streakCount - 5) * 0.012);
      ctx.fillStyle = `rgba(239, 68, 68, ${streakHeat})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Goo contamination viewport clouding
    const gooPct = this.engine.gooSystem.gooAmount / 100;
    if (gooPct > 0.5) {
      const gooOpacity = (gooPct - 0.5) * 0.7;
      ctx.fillStyle = `rgba(120, 180, 40, ${gooOpacity * 0.5})`;
      ctx.fillRect(0, 0, width, height);
    }

    this.drawFuryOverlay(width, height);

    this.ui.drawActivePowerupUI(width, height);
    this.ui.drawBossHealthBar(width, height);
    this.ui.drawWaveTransition(width, height);
    this.ui.drawSlamCharge(width, height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Persistent goo pools left by smashed bugs — floor contamination that clouds the viewport. */
  private drawGooPools() {
    const ctx = this.engine.ctx;
    const pools = this.engine.gooSystem.gooPools;
    for (const g of pools) {
      if (!g.active) continue;
      const alpha = Math.min(0.5, (g.life / g.maxLife) * 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(g.x + 3, g.y + 3, g.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** FURY MODE: full-screen red heat + banner while the rage meter is maxed. */
  private drawFuryOverlay(width: number, height: number) {
    if (!this.engine.furyActive) return;
    const ctx = this.engine.ctx;
    const pulse = 0.12 + Math.sin(this.engine.globalTime * 6) * 0.04;
    ctx.fillStyle = `rgba(255, 40, 0, ${pulse})`;
    ctx.fillRect(0, 0, width, height);

    // Banner shadow is expensive on mobile GPUs — AGENTS.md: gate shadowBlur behind isMobile
    const useBannerShadow = !this.engine.isMobile && this.currentFps > 35;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 34px "Orbitron", "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ff6a00';
    if (useBannerShadow) {
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 18;
    }
    ctx.fillText('FURY MODE', width / 2, 70);
    ctx.restore();
  }

  // --- Delegation surface (preserves public API for tests & external callers) ---

  drawSlamCharge = (width: number, height: number) => { this.ui.drawSlamCharge(width, height); };
  drawBiomeBackground = () => { this.environment.drawBiomeBackground(); };
  drawGrid = (...args: Parameters<EnvironmentRenderer['drawGrid']>) => { this.environment.drawGrid(...args); };
  drawStarfield = (...args: Parameters<EnvironmentRenderer['drawStarfield']>) =>
    { this.environment.drawStarfield(...args); };
  drawLavaBubbles = () => { this.environment.drawLavaBubbles(); };
  drawSnowflakes = () => { this.environment.drawSnowflakes(); };
  drawDynamicMesh = () => { this.environment.drawDynamicMesh(); };
  drawCRTOverlay = () => { this.environment.drawCRTOverlay(); };
  drawGlitchOverlay = () => { this.environment.drawGlitchOverlay(); };
  drawScanlines = () => { this.environment.drawScanlines(); };
  drawChromaticAberration = () => { this.environment.drawChromaticAberration(); };
  drawBossIntro = () => { this.environment.drawBossIntro(); };
  drawBossWarning = () => { this.environment.drawBossWarning(); };
  drawClouds = () => { this.particles.drawClouds(); };

  drawHazard = (h: Hazard) => { this.bugs.drawHazard(h); };
  drawBase = () => { this.bugs.drawBase(); };
  drawBug = (bug: Bug) => { this.bugs.drawBug(bug); };
  drawBugTrail = (bug: Bug) => { this.bugs.drawBugTrail(bug); };
  drawBugBody = (bug: Bug, legSwing: number) => { this.bugs.drawBugBody(bug, legSwing); };

  drawPowerup = (p: Powerup) => { this.particles.drawPowerup(p); };
  drawResource = (r: ResourcePickup) => { this.particles.drawResource(r); };
  drawSplatter = (s: Splatter) => { this.particles.drawSplatter(s); };
  drawParticle = (p: Particle) => { this.particles.drawParticle(p); };
  drawShockwave = (sw: Shockwave) => { this.particles.drawShockwave(sw); };
  drawLaser = (l: Laser) => { this.particles.drawLaser(l); };
  drawMuzzleFlash = (f: MuzzleFlash) => { this.particles.drawMuzzleFlash(f); };
}