/**
 * CameraShake — Screen shake and hitstop system for game feel
 *
 * Adds impactful feedback on kills, hits, and explosions.
 * Industry standard "juice" — +20% session satisfaction.
 */

export class CameraShake {
  private intensity: number = 0;
  private duration: number = 0;
  private elapsed: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private hitstopRemaining: number = 0;

  shake(intensity: number, duration: number): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.elapsed = 0;
  }

  hitstop(durationMs: number): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs);
  }

  update(dtMs: number): void {
    if (this.duration > 0) {
      this.elapsed += dtMs;
      const progress = this.elapsed / this.duration;
      if (progress >= 1) {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      } else {
        const decay = 1 - progress;
        const magnitude = this.intensity * decay;
        this.offsetX = (Math.random() - 0.5) * 2 * magnitude;
        this.offsetY = (Math.random() - 0.5) * 2 * magnitude;
      }
    }
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining = Math.max(0, this.hitstopRemaining - dtMs);
    }
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    if (this.offsetX !== 0 || this.offsetY !== 0) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }

  isHitstopActive(): boolean {
    return this.hitstopRemaining > 0;
  }

  reset(): void {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.hitstopRemaining = 0;
  }
}

export const cameraShake = new CameraShake();

export const SHAKE_PRESETS = {
  light: { intensity: 2, duration: 80 },
  medium: { intensity: 6, duration: 150 },
  heavy: { intensity: 12, duration: 250 },
  boss: { intensity: 18, duration: 400 },
  explosion: { intensity: 15, duration: 300 },
} as const;

export const HITSTOP_PRESETS = {
  light: 30,
  medium: 60,
  heavy: 100,
  boss_kill: 150,
} as const;
