import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';

export class UIRenderer {
  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }

  private cachedCoreLightGrad: CanvasGradient | null = null;
  private lastLightW: number = 0;
  private lastLightH: number = 0;

  drawLightingPass(width: number, height: number) {
    const ctx = this.engine.ctx;
    const bugs = this.engine.bugs;
    const time = this.engine.globalTime;
    
    // Skip detailed lighting on low FPS
    if (this.currentFps < 30) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const nightIntensity = 0.4 + Math.sin(time * 0.1) * 0.1; 
      ctx.fillStyle = `rgba(0, 0, 10, ${nightIntensity})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    
    // Ambient darkness
    const nightIntensity = 0.4 + Math.sin(time * 0.1) * 0.1; 
    ctx.fillStyle = `rgba(0, 0, 10, ${nightIntensity})`;
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalCompositeOperation = 'screen';
    
    // Cache core light gradient — recreate only on dimension change
    if (this.cachedCoreLightGrad === null || this.lastLightW !== width || this.lastLightH !== height) {
      this.cachedCoreLightGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 200);
      this.cachedCoreLightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      this.cachedCoreLightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.lastLightW = width;
      this.lastLightH = height;
    }
    ctx.fillStyle = this.cachedCoreLightGrad;
    ctx.fillRect(0, 0, width, height);

    // Skip per-bug lights entirely on low FPS — they add many gradient creations per frame
    if (this.currentFps < 45 || bugs.length > 15) {
      ctx.restore();
      return;
    }

    // Light for each bug — limited to nearest 5
    let lightCount = 0;
    for (let i = 0; i < bugs.length && lightCount < 5; i++) {
      const bug = bugs[i];
      if (!bug.active) continue;
      const dx = bug.x - width/2;
      const dy = bug.y - height/2;
      const distSq = dx * dx + dy * dy;
      if (distSq > 300 * 300) continue;
      
      const grad = ctx.createRadialGradient(bug.x, bug.y, 0, bug.x, bug.y, bug.size * 3);
      grad.addColorStop(0, `${bug.color}66`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      lightCount++;
    }

    ctx.restore();
  }

  drawActivePowerupUI(width: number, height: number) {
    const ctx = this.engine.ctx;
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';

    if (this.engine.multiplierTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`2X UPLINK: ${Math.ceil(this.engine.multiplierTimer)}s`, width - 20, 30);
    }
    if (this.engine.rapidFireTimer > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`OVERRIDE: ${Math.ceil(this.engine.rapidFireTimer)}s`, width - 20, 50);
    }
    if (this.engine.slowMoTimer > 0) {
      ctx.fillStyle = '#33ff99';
      ctx.fillText(`TIME DILATION: ${Math.ceil(this.engine.slowMoTimer)}s`, width - 20, 70);
    }
    if (this.engine.overdriveTimer > 0) {
      ctx.fillStyle = '#ff6600';
      ctx.fillText(`CRITICAL OVERDRIVE: ${Math.ceil(this.engine.overdriveTimer)}s`, width - 20, 90);
    }
  }

  drawBossHealthBar(width: number, height: number) {
    const ctx = this.engine.ctx;
    const boss = this.engine.bugs.find(b => b.type === 'boss');
    if (!boss) return;

    const barWidth = 500;
    const barHeight = 6;
    const bx = (width - barWidth) / 2;
    const by = 100;

    const glitch = Math.random() > 0.9 ? (Math.random() > 0.5 ? '_' : '!') : '';
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ANOMALY DETECTED: OVERSEER_TYPE_V${Math.floor(this.engine.wave/10)}${glitch}`, width / 2, by - 15);

    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(bx, by, barWidth, barHeight);
    
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(bx, by, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by - 5); ctx.lineTo(bx - 10, by + barHeight + 5);
    ctx.moveTo(bx + barWidth + 10, by - 5); ctx.lineTo(bx + barWidth + 10, by + barHeight + 5);
    ctx.stroke();
  }
}
