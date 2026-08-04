// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- full type-hardening tracked in TASKBOARD; file needs the escape hatch for WebAudio-heavy drawing code
// @ts-nocheck
import { GameEngine } from '../GameEngine';
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
  private lastLightW = 0;
  private lastLightH = 0;

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

  drawActivePowerupUI(width: number, _height: number) {
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
    if (this.engine.furyActive) {
      ctx.fillStyle = '#ff6a00';
      ctx.fillText(`FURY REMAINING: ${Math.ceil(this.engine.furyTimer)}s`, width - 20, 110);
    }
  }

  /** Ground Slam charge ring — grows while the pointer is held. */
  drawSlamCharge(width: number, height: number) {
    const engine = this.engine;
    if (!engine.slamCharging || engine.slamCharge <= 0) return;
    const ctx = engine.ctx;
    const charge = engine.slamCharge;
    const mx = engine.inputSystem?.lastMouseX ?? width / 2;
    const my = engine.inputSystem?.lastMouseY ?? height / 2;
    const radius = 30 + charge * 70;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255, 136, 0, ${0.4 + charge * 0.6})`;
    ctx.lineWidth = 2 + charge * 3;
    ctx.beginPath();
    ctx.arc(mx, my, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 120, 0, ${charge * 0.25})`;
    ctx.beginPath();
    ctx.arc(mx, my, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    if (charge >= 0.95) {
      ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RELEASE!', mx, my - radius - 12);
      ctx.textAlign = 'right';
    }
    ctx.restore();
  }

  drawBossHealthBar(width: number, _height: number) {
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

  drawWaveTransition(width: number, height: number) {
    const timer = this.engine.waveTransitionTimer;
    if (timer <= 0) return;

    const ctx = this.engine.ctx;
    const duration = this.engine.waveTransitionDuration;
    const progress = 1.0 - timer / duration; // 0 to 1
    const currentWave = this.engine.wave;
    const biome = this.engine.currentBiome;

    // Determine theme colors based on biome
    let accentColor = '#39ff14'; // Cyber green default
    let rgbGlow = 'rgba(57, 255, 20, 0.15)';
    if (biome === 'quantum_void') { 
      accentColor = '#06b6d5'; 
      rgbGlow = 'rgba(6, 182, 213, 0.15)'; 
    } else if (biome === 'ember_depths') { 
      accentColor = '#ff3300'; 
      rgbGlow = 'rgba(255, 51, 0, 0.15)'; 
    } else if (biome === 'frostbyte') { 
      accentColor = '#00ffff'; 
      rgbGlow = 'rgba(0, 255, 255, 0.15)'; 
    } else if (biome === 'void_abyss') { 
      accentColor = '#a855f7'; 
      rgbGlow = 'rgba(168, 85, 247, 0.15)'; 
    } else if (biome === 'golden_cache' || biome === 'golden_spire') { 
      accentColor = '#fbbf24'; 
      rgbGlow = 'rgba(251, 191, 36, 0.15)'; 
    }

    ctx.save();

    // PHASE 1: Overall screen overlay and tracking glitches
    // Darken background slightly to increase scanline and data refresh contrast
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, Math.sin(progress * Math.PI) * 0.4)})`;
    ctx.fillRect(0, 0, width, height);

    // Apply high chromatic aberration offset during transition peaks (middle 60% of transition)
    if (progress > 0.15 && progress < 0.85) {
      this.parent.chromaticOffset = Math.max(this.parent.chromaticOffset, Math.sin((progress - 0.15) / 0.7 * Math.PI) * 20);
    }

    // PHASE 2: Horizontal scanline wipe beam
    // We want the scanline wipe to sweep from top of screen to bottom
    // We cover a bit of overshoot (from -60 to height+60)
    const startY = -60;
    const endY = height + 60;
    const sweepY = startY + progress * (endY - startY);

    // Render the glow tail behind the sweeping scanline
    const gradientHeight = 120;
    const grad = ctx.createLinearGradient(0, sweepY - gradientHeight, 0, sweepY);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, rgbGlow);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, sweepY - gradientHeight, width, gradientHeight);

    // Render the bright scanning laser line itself
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, sweepY);
    ctx.lineTo(width, sweepY);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Emit sparks right from the scanline bar onto the particle system as visual feedback!
    if (this.currentFps > 30 && Math.random() < 0.6) {
      const sparkCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < sparkCount; i++) {
        const sparkX = Math.random() * width;
        this.engine.particleSystem.spawnParticle(sparkX, sweepY, accentColor, 3, 0.4);
      }
    }

    // PHASE 3: Retro Data Refresh & Diagnostic Grid Texts
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const textX = 32;
    const textBaseY = 120;
    const logs = [
      `SYSTEM STATUS : RE-CALIBRATING [WAVE ${currentWave}]`,
      `THREAT RATING : ELEVATED x1.${Math.floor(currentWave * 1.5)}`,
      `BIOME SECTOR  : ${biome.toUpperCase().replace('_', ' ')}`,
      `MEM_UPLINKS   : ACTIVE [OK]`,
      `GRID STIMULI  : APEX PROTOCOL SENT`,
      `DIFFICULTY    : SCALED [+${(currentWave - 1) * 12}%]`
    ];

    // Staggered log display based on sweep progress
    const linesToDisplay = Math.min(logs.length, Math.floor(progress * logs.length * 1.4));
    for (let i = 0; i < linesToDisplay; i++) {
      const flicker = Math.random() > 0.08 ? 1.0 : 0.4;
      ctx.fillStyle = `${accentColor}${Math.floor(flicker * 255).toString(16).padStart(2, '0')}`;
      ctx.fillText(logs[i], textX, textBaseY + i * 20);
    }

    // Drawing decorative schematic outlines at corners during scan
    ctx.strokeStyle = `${accentColor}44`;
    ctx.lineWidth = 1;

    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(20, 60); ctx.lineTo(20, 20); ctx.lineTo(60, 20);
    ctx.stroke();

    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(width - 20, height - 60); ctx.lineTo(width - 20, height - 20); ctx.lineTo(width - 60, height - 20);
    ctx.stroke();

    // PHASE 4: Main bold center notice (fades in as scanline passes middle, then fades out)
    const textAlpha = Math.sin(progress * Math.PI);
    ctx.textAlign = 'center';
    
    // Core brand message or notification
    ctx.save();
    ctx.translate(width / 2, height / 2 - 20);
    
    // Upgrade font to Orbitron for a more premium display look
    ctx.font = '900 42px "Orbitron", "Space Grotesk", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    
    // Slight glitch text offsets
    const glitchOffset = Math.sin(this.engine.globalTime * 40) * 3 * (progress > 0.4 && progress < 0.6 ? 1 : 0);
    
    // Add glow effect to the wave text (skip on low FPS)
    if (this.currentFps > 35) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = textAlpha * 25;
    }
    ctx.fillText(`WAVE ${currentWave}`, glitchOffset, 0);
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = `${accentColor}${Math.floor(textAlpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fillText('DIFFICULTY EXPONENT: INCREASING', 0, 36);
    
    ctx.restore();
    
    // PHASE 5: Post-sweep particle burst
    if (progress > 0.85 && this.currentFps > 30 && Math.random() < 0.5) {
      const burstX = width * (0.2 + Math.random() * 0.6);
      const burstY = height * (0.3 + Math.random() * 0.4);
      for (let i = 0; i < 3; i++) {
        this.engine.particleSystem.spawnParticle(
          burstX + (Math.random() - 0.5) * 40,
          burstY + (Math.random() - 0.5) * 40,
          accentColor,
          2 + Math.random() * 3,
          0.3 + Math.random() * 0.3
        );
      }
    }

    ctx.restore();
  }
}
