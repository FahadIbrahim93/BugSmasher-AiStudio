import { GameEngine } from '../GameEngine';

/**
 * Quality presets inspired by professional 2026 browser/3D game engines (e.g. adaptive
 * Ultra/High/Balanced/Mobile with explicit dpr, vfx, post-effect scalars).
 * Our Canvas2D port: controls vfxScalar, mesh, + new crt/heat/emissive/glow hooks
 * that renderers consume. FPS scaler still auto-downgrades; manual preset overrides base.
 */
export const QUALITY_PRESETS = {
  Ultra:    { label: 'Ultra — max neon, full post, high DPR', vfx: 1.0,  mesh: 8,  crt: 0.22, heat: 0.008, emissive: 1.6, glow: 1.0, dprCap: 2.0 },
  High:     { label: 'High — rich VFX, balanced post',       vfx: 0.95, mesh: 10, crt: 0.16, heat: 0.006, emissive: 1.35, glow: 0.9, dprCap: 1.75 },
  Balanced: { label: 'Balanced — 60fps target, lighter FX',  vfx: 0.8,  mesh: 16, crt: 0.10, heat: 0.003, emissive: 1.1,  glow: 0.7, dprCap: 1.25 },
  Mobile:   { label: 'Mobile — 30-60fps, minimal post',      vfx: 0.55, mesh: 32, crt: 0.04, heat: 0.0,   emissive: 0.9,  glow: 0.4, dprCap: 1.0 },
  /** Emergency bare-minimum mode — skips all post-FX, minimal particles */
  Headless: { label: 'Headless — bare minimum, 30fps target', vfx: 0.2,  mesh: 80, crt: 0.0,  heat: 0.0,   emissive: 0.4,  glow: 0.0, dprCap: 0.75 },
} as const;

export type QualityPresetName = keyof typeof QUALITY_PRESETS;

export class PerformanceScaler {
  private engine: GameEngine;
  lastFpsTime: number = 0;
  frameCount: number = 0;
  fpsBuffer: number[] = [];
  currentFps: number = 60;
  vfxScalar: number = 1.0;
  meshComplexityStep: number = 10;

  // New post-effect / material scalars (ported concepts; 0=off, 1=full)
  crtIntensity: number = 0.16;
  heatDistort: number = 0.006;
  emissiveScale: number = 1.35;
  glowScalar: number = 0.9;

  currentPreset: QualityPresetName = 'High';

  /** Force a full quality downgrade when FPS has been critically low for too long */
  private emergencyDowngradeFps: number = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
    // Detect Vercel / cloud-hosted environments (no GPU acceleration) - skip in tests
    const isTest = typeof process !== 'undefined' && (
      process.env?.VITEST === 'true' || 
      process.env?.NODE_ENV === 'test'
    );
    const isCloudHosted = !isTest && typeof navigator !== 'undefined' && (
      navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4
    );
    this.applyPreset('Balanced');
    // Start more conservative in cloud environments
    if (isCloudHosted) {
      this.vfxScalar = Math.min(this.vfxScalar, 0.65);
    }
  }

  /**
   * Apply named preset (manual quality switch). FPS auto-scaler still modulates on top.
   * Exposed for Settings + debug (window or engine hook).
   */
  applyPreset(name: QualityPresetName): void {
    const p = QUALITY_PRESETS[name];
    if (!p) return;
    this.currentPreset = name;
    this.vfxScalar = p.vfx;
    this.meshComplexityStep = p.mesh;
    this.crtIntensity = p.crt;
    this.heatDistort = p.heat;
    this.emissiveScale = p.emissive;
    this.glowScalar = p.glow;
    // Note: DPR clamping happens in GameEngine / highFidelity path using p.dprCap as guide
  }

  get isLowEnd(): boolean {
    return this.engine.isMobile || !this.engine.highFidelityVFX || this.vfxScalar < 0.6;
  }

  tick(): void {
    const now = performance.now();
    if (this.lastFpsTime === 0) {
      this.lastFpsTime = now;
      this.frameCount = 0;
      return;
    }

    this.frameCount++;
    const elapsed = now - this.lastFpsTime;

    if (elapsed >= 500) {
      const calculatedFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;

      this.fpsBuffer.push(calculatedFps);
      if (this.fpsBuffer.length > 6) {
        this.fpsBuffer.shift();
      }

      const sum = this.fpsBuffer.reduce((a, b) => a + b, 0);
      this.currentFps = Math.round(sum / this.fpsBuffer.length);

      // Track consecutive low-FPS readings for emergency downgrade
      if (this.currentFps < 25) {
        this.emergencyDowngradeFps++;
      } else {
        this.emergencyDowngradeFps = Math.max(0, this.emergencyDowngradeFps - 1);
      }

      const base = QUALITY_PRESETS[this.currentPreset];

      // Emergency downgrade: if FPS stays below 25 for 3+ consecutive readings, drop to Headless
      if (this.emergencyDowngradeFps >= 3) {
        this.applyPreset('Headless');
        return;
      }

      if (this.currentFps < 40) {
        const rangePercent = Math.max(0, (this.currentFps - 15) / (40 - 15));
        this.vfxScalar = Math.min(base.vfx, 0.12 + rangePercent * 0.88);

        if (this.currentFps < 20) {
          this.meshComplexityStep = Math.max(base.mesh, 100);
        } else if (this.currentFps < 30) {
          this.meshComplexityStep = Math.max(base.mesh, 60);
        } else {
          this.meshComplexityStep = Math.max(base.mesh, 30);
        }
        // Aggressively dampen post FX when struggling
        const dampFactor = this.currentFps < 30 ? 0.3 : 0.6;
        this.crtIntensity = base.crt * dampFactor;
        this.heatDistort = base.heat * dampFactor;
        this.glowScalar = base.glow * dampFactor;
      } else {
        // Only recover to base preset level, never above
        this.vfxScalar = Math.min(base.vfx, this.vfxScalar + 0.05);
        if (this.vfxScalar >= base.vfx * 0.95) {
          this.vfxScalar = base.vfx;
          this.meshComplexityStep = base.mesh;
          this.crtIntensity = base.crt;
          this.heatDistort = base.heat;
          this.glowScalar = base.glow;
        }
      }
    }

    // Every 5 seconds, check if we recovered enough to restore original preset
    if (this.currentPreset === 'Headless' && this.currentFps > 45) {
      const original = this.engine.isMobile ? 'Mobile' : 'Balanced';
      this.applyPreset(original as QualityPresetName);
      this.emergencyDowngradeFps = 0;
    }
  }
}