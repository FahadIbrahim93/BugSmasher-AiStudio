import { GameEngine } from '../GameEngine';

export class PerformanceScaler {
  private engine: GameEngine;
  lastFpsTime: number = 0;
  frameCount: number = 0;
  fpsBuffer: number[] = [];
  currentFps: number = 60;
  vfxScalar: number = 1.0;
  meshComplexityStep: number = 10;

  constructor(engine: GameEngine) {
    this.engine = engine;
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

      if (this.currentFps < 40) {
        const rangePercent = Math.max(0, (this.currentFps - 15) / (40 - 15));
        this.vfxScalar = 0.15 + rangePercent * 0.85;

        if (this.currentFps < 20) {
          this.meshComplexityStep = 80;
        } else if (this.currentFps < 30) {
          this.meshComplexityStep = 40;
        } else {
          this.meshComplexityStep = 20;
        }
      } else {
        this.vfxScalar = Math.min(1.0, this.vfxScalar + 0.1);
        if (this.vfxScalar >= 0.95) {
          this.vfxScalar = 1.0;
          this.meshComplexityStep = 10;
        } else if (this.vfxScalar > 0.6) {
          this.meshComplexityStep = 20;
        }
      }
    }
  }
}