import { GameEngine } from './GameEngine';
import { Bug, Powerup, Hazard } from './GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from './ParticleSystem';
import { assetManager } from './AssetManager';
import { GameConfig } from './GameConfig';

export class Renderer {
  engine: GameEngine;
  isGlitching: boolean = false;
  fireAlpha: number = 0;
  clickFlash: number = 0;
  impactFlash: number = 0;
  powerupAlpha: number = 0;
  chromaticOffset: number = 0;

  // Performance Scaler state variables
  private lastFpsTime: number = 0;
  private frameCount: number = 0;
  private fpsBuffer: number[] = [];
  currentFps: number = 60;
  vfxScalar: number = 1.0;          // Dynamic scaling multiplier [0.15 - 1.0]
  meshComplexityStep: number = 10;  // Dynamic mesh step [10 - 80]

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  get isLowEnd(): boolean {
    return this.engine.isMobile || !this.engine.highFidelityVFX || this.vfxScalar < 0.6;
  }

  private updatePerformanceScaler() {
    const now = performance.now();
    if (this.lastFpsTime === 0) {
      this.lastFpsTime = now;
      this.frameCount = 0;
      return;
    }

    this.frameCount++;
    const elapsed = now - this.lastFpsTime;

    // Standard interval: update scaling parameters every 500ms
    if (elapsed >= 500) {
      const calculatedFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;

      // Maintain a sliding window of the last 6 entries (representing 3 seconds) for robust smoothing
      this.fpsBuffer.push(calculatedFps);
      if (this.fpsBuffer.length > 6) {
        this.fpsBuffer.shift();
      }

      // Calculate sliding average FPS
      const sum = this.fpsBuffer.reduce((a, b) => a + b, 0);
      this.currentFps = Math.round(sum / this.fpsBuffer.length);

      // Apply thresholds to determine dynamic scaling and complexity reduction
      if (this.currentFps < 40) {
        // Linear scale factor from 1.0 (at 40 FPS) down to 0.15 (at 15 FPS)
        const rangePercent = Math.max(0, (this.currentFps - 15) / (40 - 15)); // between 0 and 1
        this.vfxScalar = 0.15 + rangePercent * 0.85;

        // Stepwise mesh line complexity optimization in real-time
        if (this.currentFps < 20) {
          this.meshComplexityStep = 80; // Grid spacing bounds (minimum vertices)
        } else if (this.currentFps < 30) {
          this.meshComplexityStep = 40; // Extremely low vertex count
        } else {
          this.meshComplexityStep = 20; // Halved vertex count
        }
      } else {
        // Restore full quality smoothly if performance recovered
        this.vfxScalar = Math.min(1.0, this.vfxScalar + 0.1);
        if (this.vfxScalar >= 0.95) {
          this.vfxScalar = 1.0;
          this.meshComplexityStep = 10; // Full fidelity original complexity
        } else if (this.vfxScalar > 0.6) {
          this.meshComplexityStep = 20;
        }
      }
    }
  }

  draw() {
    this.updatePerformanceScaler();
    
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;

    // Background and environmental systems
    let offsetX = 0;
    let offsetY = 0;
    
    // Subtle ambient camera vibrate based on threat density
    const ambientShake = this.engine.threatShakeIntensity;
    if (ambientShake > 0) {
      offsetX = (Math.random() - 0.5) * ambientShake;
      offsetY = (Math.random() - 0.5) * ambientShake;
    }
    
    if (this.engine.shakeTime > 0) {
      const intensity = this.engine.shakeTime / 0.5;
      const rx = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      const ry = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      offsetX += rx + this.engine.shakeX * this.engine.shakeMagnitude * intensity;
      offsetY += ry + this.engine.shakeY * this.engine.shakeMagnitude * intensity;
    }
    
    // Set transform once
    ctx.setTransform(this.engine.dpr, 0, 0, this.engine.dpr, offsetX * this.engine.dpr, offsetY * this.engine.dpr);

    // Wave-based background
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
        ctx.fillRect((Math.random()-0.5)*100, (Math.random()-0.5)*100, width, height);
    }
    
    this.drawBiomeBackground();
    this.drawClouds();
    
    if (this.engine.wave > 15 || this.engine.waveManager.isBossWave) {
      this.drawGlitchOverlay();
    }

    if (this.engine.waveManager.bossIntroActive) {
      this.drawBossIntro();
    }

    if (this.engine.performanceFactor > 2.0 && Math.random() < 0.05) {
      this.drawGlitchOverlay();
    }

    if (this.engine.wave % 10 === 0 && this.engine.waveManager.waveActive) {
        const activeBoss = this.engine.bugs.find(b => b.type === 'boss');
        if (activeBoss && activeBoss.hp === activeBoss.maxHp) {
            this.drawBossWarning();
        }
    }
    
    // Draw splatters
    const ps = this.engine.particleSystem;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < ps.splatters.length; i++) {
      const s = ps.splatters[i];
      if (s.active) this.drawSplatter(s);
    }
    
    // Draw high-intensity effects
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ps.shockwaves.length; i++) {
      const sw = ps.shockwaves[i];
      if (sw.active) this.drawShockwave(sw);
    }
    for (let i = 0; i < ps.particles.length; i++) {
      const p = ps.particles[i];
      if (p.active) this.drawParticle(p);
    }
    for (let i = 0; i < ps.lasers.length; i++) {
      const l = ps.lasers[i];
      if (l.active) this.drawLaser(l);
    }
    for (let i = 0; i < ps.muzzleFlashes.length; i++) {
      const mf = ps.muzzleFlashes[i];
      if (mf.active) this.drawMuzzleFlash(mf);
    }
    
    ctx.globalCompositeOperation = 'source-over';
    
    const powerups = this.engine.powerups;
    for (let i = 0; i < powerups.length; i++) this.drawPowerup(powerups[i]);
    
    const resources = this.engine.resources;
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      if (r.active) this.drawResource(r);
    }
    
    this.drawBase();
    
    const hazards = this.engine.hazards;
    for (let i = 0; i < hazards.length; i++) this.drawHazard(hazards[i]);
    
    const bugs = this.engine.bugs;
    for (let i = 0; i < bugs.length; i++) this.drawBug(bugs[i]);

    this.drawScanlines();
    this.drawCRTOverlay();
    
    if (this.chromaticOffset > 0) {
      this.drawChromaticAberration();
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

    this.drawLightingPass(width, height);
    
    // Dynamic Vignette
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const isCrisis = healthRatio < 0.3;
    const vOpacity = isCrisis ? (0.5 + Math.sin(this.engine.globalTime * 8) * 0.2) : Math.min(0.25, (this.engine.wave / 50) * 0.25);
    
    const vignette = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, isCrisis ? `rgba(255, 0, 0, ${vOpacity * 0.5})` : `rgba(0, 0, 0, ${vOpacity})`);
    
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    
    this.drawActivePowerupUI(width, height);
    this.drawBossHealthBar(width, height);
    
    // Reset transform for UI elements if needed or for next frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawLightingPass(width: number, height: number) {
    const ctx = this.engine.ctx;
    const bugs = this.engine.bugs;
    const time = this.engine.globalTime;

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    
    // Ambient darkness
    const nightIntensity = 0.4 + Math.sin(time * 0.1) * 0.1; 
    ctx.fillStyle = `rgba(0, 0, 10, ${nightIntensity})`;
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalCompositeOperation = 'screen';
    
    // Core light
    const coreGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 200);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, width, height);

    // Light for each bug (glowing eyes/parts)
    bugs.forEach(bug => {
      if (!bug.active) return;
      const grad = ctx.createRadialGradient(bug.x, bug.y, 0, bug.x, bug.y, bug.size * 3);
      grad.addColorStop(0, `${bug.color}66`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.restore();
  }

  private drawActivePowerupUI(width: number, height: number) {
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

  private drawBossHealthBar(width: number, height: number) {
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

  drawBiomeBackground() {
    const ctx = this.engine.ctx;
    const biomeId = this.engine.currentBiome;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;

    ctx.save();
    
    // Base colors per biome
    let colorA = '#050505';
    let colorB = '#0a0a0a';
    
    switch(biomeId) {
      case 'quantum_void': colorA = '#08001a'; colorB = '#1a0033'; break;
      case 'ember_depths': colorA = '#1a0500'; colorB = '#330a00'; break;
      case 'frostbyte': colorA = '#001a1a'; colorB = '#003344'; break;
      case 'void_abyss': colorA = '#000000'; colorB = '#111111'; break;
      case 'golden_cache': colorA = '#1a1a00'; colorB = '#333300'; break;
      case 'golden_spire': colorA = '#0a0a05'; colorB = '#1a1a10'; break;
    }

    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    
    // Dynamic shift based on intensity/health
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const intensity = Math.min(1, this.engine.performanceFactor * 0.1);
    
    if (healthRatio < 0.3) {
      // Emergency red shift
      const pulse = Math.sin(t * 8) * 0.2 + 0.2;
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`); 
    } else if (intensity > 0.4) {
      // High intensity pulse
      const pulse = Math.sin(t * 4) * 0.1;
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, colorA);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + pulse})`; // Global flash
    } else {
      grad.addColorStop(0, colorB);
      grad.addColorStop(1, colorA);
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Biome specific background particles/grid
    if (biomeId === 'neon_core' || biomeId === 'golden_cache') {
      this.drawGrid(200, 'rgba(255, 255, 255, 0.01)');
    } else if (biomeId === 'quantum_void' || biomeId === 'void_abyss') {
      this.drawStarfield(biomeId === 'void_abyss' ? 100 : 50);
    } else if (biomeId === 'ember_depths') {
      this.drawLavaBubbles();
    } else if (biomeId === 'frostbyte') {
      this.drawSnowflakes();
    }

    ctx.restore();
    
    if (this.isLowEnd) return;
    this.drawDynamicMesh();
  }

  drawGrid(size: number, color: string) {
    const ctx = this.engine.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = 0; x < this.engine.width; x += size) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.engine.height); ctx.stroke();
    }
    for (let y = 0; y < this.engine.height; y += size) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.engine.width, y); ctx.stroke();
    }
  }

  drawStarfield(count: number) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.engine.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * this.engine.height;
        const s = (Math.sin(t + i) * 0.5 + 0.5) * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(t * 2 + i) * 0.5 + 0.5})`;
        ctx.fillRect(x, y, s, s);
    }
  }

  drawLavaBubbles() {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    for (let i = 0; i < 20; i++) {
        const x = (Math.sin(i * 500) * 0.5 + 0.5) * this.engine.width;
        const y = (this.engine.height - (t * 50 + i * 40) % (this.engine.height + 100));
        const r = (Math.sin(t + i) * 0.5 + 0.5) * 10 + 5;
        ctx.fillStyle = `rgba(255, 50, 0, 0.1)`;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
    }
  }

  drawSnowflakes() {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    for (let i = 0; i < 40; i++) {
        const x = (Math.sin(i * 1000 + t * 0.5) * 0.5 + 0.5) * this.engine.width;
        const y = (t * 80 + i * 30) % (this.engine.height + 50);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawDynamicMesh() {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;
    
    // Determine dynamic state
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const isLowHealth = healthRatio < 0.3;
    const isIntense = this.engine.performanceFactor > 1.5 || this.engine.bugs.length > 20 || this.engine.waveManager.isBossWave;
    
    let waveMultX = 20;
    let waveMultY = 15;
    let speedMult = 1;
    
    if (isLowHealth) {
      waveMultX = 30 + Math.sin(t * 10) * 10;
      waveMultY = 25 + Math.cos(t * 12) * 10;
      speedMult = 2; // Frantic movement
    } else if (isIntense) {
      waveMultX = 25;
      waveMultY = 20;
      speedMult = 1.5;
    }

    ctx.lineWidth = 1;
    const gridSize = 80;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      let first = true;
      for (let y = 0; ; y += this.meshComplexityStep) {
        const currentY = Math.min(y, height);
        const waveX = Math.sin((currentY * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((x * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(x + waveX, currentY + waveY);
          first = false;
        } else {
          ctx.lineTo(x + waveX, currentY + waveY);
        }
        if (y >= height) break;
      }
    }
    for (let y = 0; y <= height; y += gridSize) {
      let first = true;
      for (let x = 0; ; x += this.meshComplexityStep) {
        const currentX = Math.min(x, width);
        const waveX = Math.sin((y * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((currentX * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(currentX + waveX, y + waveY);
          first = false;
        } else {
          ctx.lineTo(currentX + waveX, y + waveY);
        }
        if (x >= width) break;
      }
    }
    
    let strokeColor = 'rgba(255, 255, 255, 0.01)';
    if (isLowHealth) strokeColor = `rgba(255, 0, 0, ${0.05 + Math.abs(Math.sin(t * 5)) * 0.15})`;
    else if (isIntense) strokeColor = `rgba(255, 150, 0, 0.08)`;
    
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }

  drawCRTOverlay() {
    const ctx = this.engine.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    
    ctx.save();
    // Scanlines
    ctx.fillStyle = 'rgba(18, 16, 16, 0.03)';
    for (let i = 0; i < h; i += 4) {
      ctx.fillRect(0, i, w, 1);
    }
    
    // Flicker
    if (Math.random() > 0.995) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(0, 0, w, h);
    }
    
    // Static noise
    ctx.globalAlpha = 0.01;
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    ctx.restore();
  }

  drawGlitchOverlay() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const isBoss = this.engine.waveManager.isBossWave;
    
    // Intensity factor combining wave progression, boss flag, and performance surge
    const performanceFactor = Math.max(1, this.engine.performanceFactor);
    const intensity = (isBoss ? 0.6 : Math.min(0.3, (this.engine.wave - 15) * 0.01)) * (performanceFactor * 0.5 + 0.5);
    
    // Random scanline flicker
    if (Math.random() < intensity) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * Math.random()})`;
      ctx.fillRect(0, Math.random() * height, width, Math.random() * 5);
    }

    if (isBoss && Math.random() < 0.1 * performanceFactor) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(0, Math.random() * height, width, 2);
    }
    
    // Subtle RGB split feel through shifting horizontal bands
    if (Math.random() < intensity * 0.5) {
      const sliceY = Math.random() * height;
      const sliceH = Math.random() * 20 + 5;
      const offset = (Math.random() - 0.5) * 10 * performanceFactor;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sliceY, width, sliceH);
      ctx.clip();
      ctx.translate(offset, 0);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 255, 0.08)' : 'rgba(0, 255, 255, 0.08)';
      ctx.fillRect(0, sliceY, width, sliceH);
      ctx.restore();
    }
  }

  drawScanlines() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < height; i += 5) {
      ctx.fillRect(0, i, width, 1);
    }
    
    // Moving scanline pulse
    const y = (this.engine.globalTime * 100) % height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, y, width, 50);
    ctx.restore();
  }

  drawChromaticAberration() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const offset = this.chromaticOffset;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Intermittent flicker based on offset intensity
    const flicker = Math.random() > 0.7 ? 1 : 0.5;
    ctx.globalAlpha = 0.2 * flicker;
    
    // Offset horizontal bands to simulate channel shift
    const bands = 5;
    for (let i = 0; i < bands; i++) {
        const h = height / bands;
        const y = i * h;
        const jitter = (Math.random() - 0.5) * offset * 0.5;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-offset + jitter, y, width, h);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(offset - jitter, y, width, h);
    }
    
    ctx.restore();
  }

  drawBossIntro() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const timer = this.engine.waveManager.bossIntroTimer;
    const t = this.engine.globalTime;

    // Darken and glitch
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, (4 - timer) * 0.5)})`;
    ctx.fillRect(0, 0, width, height);

    if (Math.random() < 0.1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, Math.random() * height, width, 10);
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Scanlines
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Lore / Narrative Text
    ctx.textAlign = 'left';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    
    const logs = [
        "[ ALERT ] : PROJECT NEXUS INTEGRITY BREACHED",
        "[ LOG ]   : ANOMALY CLASS 'OVERSEER' DETECTED IN SECTOR 7",
        "[ LOG ]   : KINETIC SUPPRESSION PROTOCOLS: [ INACTIVE ]",
        "[ ERROR ] : SYSTEM CORRUPTION AT 84.3%",
        "[ LOG ]   : INITIATING EMERGENCY DATA PURGE...",
        "[ ALERT ] : SENTIENCE DETECTED WITHIN THE CORE"
    ];

    const displayCount = Math.floor((4 - timer) * 4);
    for (let i = 0; i < Math.min(logs.length, displayCount); i++) {
        const flicker = Math.random() > 0.1 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 50, 50, ${flicker})`;
        ctx.fillText(logs[i], 40, height - 100 - (i * 20));
    }

    // Central Warning
    if (timer < 3) {
        const scale = 1 + Math.sin(t * 15) * 0.05;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        ctx.font = '900 64px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Glitch split
        const off = Math.sin(t * 40) * 4;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.fillText('CORE BREACH', off, 0);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillText('CORE BREACH', -off, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CORE BREACH', 0, 0);
        
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('SYSTEM OVERRIDE IN PROGRESS', 0, 50);
        
        // Progress bar for "override"
        const barW = 300;
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(-barW/2, 70, barW, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-barW/2, 70, barW * (1 - timer / 3), 4);
        
        ctx.restore();
    }
  }

  drawBossWarning() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const t = this.engine.globalTime;
    
    const alpha = Math.abs(Math.sin(t * 8));
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * alpha})`;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.font = '900 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! WARNING: CRITICAL SYSTEM THREAT !', width / 2, height / 2 - 100);
    
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('OVERSEER CLASS ANOMALY DETECTED', width / 2, height / 2 - 60);
    ctx.restore();
  }

  drawHazard(h: Hazard) {
    const ctx = this.engine.ctx;
    const progress = h.timer / h.duration;
    
    ctx.save();
    ctx.translate(h.x, h.y);
    
    if (h.type === 'barrage') {
        const pulse = Math.sin(this.engine.globalTime * 15) * 5;
        
        // Target Reticle
        ctx.strokeStyle = `rgba(255, 50, 0, ${0.5 + Math.sin(this.engine.globalTime * 20) * 0.3})`;
        ctx.lineWidth = 2;
        
        // Outer segments
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + this.engine.globalTime;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0, h.radius + pulse), angle, angle + Math.PI / 4);
            ctx.stroke();
        }
        
        // Filling Progress
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, h.radius * progress), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + progress * 0.2})`;
        ctx.fill();
        
        // Text
        ctx.fillStyle = '#ff0000';
        ctx.font = '800 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! DANGER !', 0, h.radius + 20);
        ctx.fillText(`${Math.ceil((h.duration - h.timer)*10)/10}s`, 0, -h.radius - 10);
    } else if (h.type === 'web') {
        const alpha = Math.min(1, (h.duration - h.timer) * 0.5);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Octagonal pattern
        for (let j = 1; j <= 3; j++) {
            const r = h.radius * (j / 3);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
        }
        // Radiating lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * h.radius, Math.sin(angle) * h.radius);
            ctx.stroke();
        }
    }
    
    ctx.restore();
  }

  drawBase() {
    const ctx = this.engine.ctx;
    const cx = this.engine.coreX;
    const cy = this.engine.coreY;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Apply Recoil displacement
    if (this.engine.baseRecoil > 0) {
      const rx = Math.cos(this.engine.baseRecoilAngle) * this.engine.baseRecoil;
      const ry = Math.sin(this.engine.baseRecoilAngle) * this.engine.baseRecoil;
      ctx.translate(-rx, -ry); // Recoil is opposite to click direction
    }

    // Apply scale for "kick"
    ctx.scale(this.engine.baseScale, this.engine.baseScale);
    
    const time = this.engine.globalTime;
    const upgradePulse = this.engine.upgradeFlash;
    const pulse = Math.sin(time * 5) * 5;
    
    if (upgradePulse > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        const r = 20 + upgradePulse * 200;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, `rgba(0, 255, 255, ${upgradePulse * 0.8})`);
        grad.addColorStop(0.5, `rgba(0, 255, 255, ${upgradePulse * 0.3})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${upgradePulse})`;
        ctx.lineWidth = 4 * upgradePulse;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, 30 + upgradePulse * 150), 0, Math.PI * 2);
        if (!this.isLowEnd) {
            ctx.shadowBlur = 20 * upgradePulse;
            ctx.shadowColor = '#fff';
        }
        ctx.stroke();
        ctx.restore();
    }
    
    if (this.engine.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, 60 + pulse), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 204, 255, 0.1)`;
      ctx.strokeStyle = `rgba(0, 204, 255, 0.8)`;
      ctx.lineWidth = 2; // Sharp wireframe
      ctx.fill();
      ctx.stroke();
    }
    
    // Technical structural plates (Mechanical feel)
    const t = this.engine.globalTime;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + t * 0.2;
        // Plates "kick" back during recoil
        const recoilOffset = -(this.engine.baseRecoil * 0.5);
        const floatOffset = Math.sin(t * 3 + i) * 2;
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(35 + recoilOffset + floatOffset, 0);
        
        // Plate shape
        ctx.fillStyle = '#111';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-4, -12, 12, 24);
        ctx.fill();
        ctx.stroke();

        // Technical details on plates
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        ctx.restore();
    }

    // Outer containment ring
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([5, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // The primary core
    const healthFactor = this.engine.health / this.engine.maxHealth;
    const bugIntensity = Math.min(1, this.engine.bugs.length / 20);
    const pulseFactor = 1 + Math.sin(time * (5 + bugIntensity * 10)) * (0.05 + bugIntensity * 0.1);
    
    // Core color shifts with damage and powerups
    let coreColor = healthFactor < 0.3 ? '#ff3333' : '#ffffff';
    if (this.powerupAlpha > 0) {
        // Blend towards cyan/gold when powerup is active
        coreColor = healthFactor < 0.3 ? '#ff6633' : '#00ffff';
    }
    
    const coreRadius = (20 + this.fireAlpha * 10) * pulseFactor;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    
    if (!this.isLowEnd) {
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = (20 + this.fireAlpha * 40 + this.impactFlash * 60 + this.powerupAlpha * 40) * pulseFactor;
    }
    ctx.fill();

    // Impact flash overlay (red pulse when hit)
    if (this.impactFlash > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 1.5, 0, Math.PI * 2);
        const hitGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 1.5);
        hitGrad.addColorStop(0, `rgba(255, 0, 0, ${this.impactFlash * 0.8})`);
        hitGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = hitGrad;
        ctx.fill();
        ctx.restore();
    }

    // Animated surface texture
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, coreRadius), 0, Math.PI * 2);
    ctx.clip();
    
    // Rotating tech pattern
    ctx.save();
    ctx.rotate(time * (0.3 + bugIntensity * 2)); // Speeds up with intensity
    ctx.strokeStyle = healthFactor < 0.3 ? 'rgba(255, 255, 255, 0.2)' : (this.powerupAlpha > 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 255, 255, 0.2)');
    ctx.lineWidth = 1.5 + this.powerupAlpha * 2;
    for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(coreRadius * 0.3, 0);
        ctx.lineTo(coreRadius * 0.9, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, coreRadius * 0.6), 0.2, Math.PI * 0.3);
        ctx.stroke();
    }
    ctx.restore();

    // Subtle moving "energy" noise
    ctx.globalAlpha = 0.2 + this.powerupAlpha * 0.3;
    for (let i = 0; i < 3; i++) {
        const speedMult = 1 + bugIntensity * 3;
        const x = Math.cos(time * (0.4 + i * 0.2) * speedMult + i) * coreRadius * 0.6;
        const y = Math.sin(time * (0.5 + i * 0.1) * speedMult + i * 2) * coreRadius * 0.6;
        const r = (4 + Math.sin(time + i) * 2) * (1 + this.powerupAlpha);
        ctx.fillStyle = healthFactor < 0.3 ? '#f00' : (this.powerupAlpha > 0 ? '#fff' : (i % 2 === 0 ? '#0ff' : '#fff'));
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Scanning pulse line
    const scanSpeed = 1.5 + bugIntensity * 4;
    const scanPos = (Math.sin(time * scanSpeed) * 0.5 + 0.5) * coreRadius * 2 - coreRadius;
    const scanGrad = ctx.createLinearGradient(0, scanPos - 4, 0, scanPos + 4);
    const scanColor = healthFactor < 0.3 ? '255, 50, 50' : (this.powerupAlpha > 0 ? '255, 255, 255' : '0, 255, 255');
    scanGrad.addColorStop(0, `rgba(${scanColor}, 0)`);
    scanGrad.addColorStop(0.5, `rgba(${scanColor}, ${0.4 + this.powerupAlpha * 0.4})`);
    scanGrad.addColorStop(1, `rgba(${scanColor}, 0)`);
    ctx.fillStyle = scanGrad;
    ctx.fillRect(-coreRadius, scanPos - 4, coreRadius * 2, 8);
    
    ctx.restore();

    // Decay animation variables
    this.impactFlash = Math.max(0, this.impactFlash - 0.05);
    this.powerupAlpha = Math.max(0, this.powerupAlpha - 0.02);

    // Core "Energy" Gradient
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 + pulse + this.fireAlpha * 20 + this.powerupAlpha * 30);
    grd.addColorStop(0, coreColor);
    grd.addColorStop(0.3, `${coreColor}66`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fill();

    // Core fire pulse overlay
    if (this.fireAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Secondary expanding ring
        const ringSize = 40 + (1 - this.fireAlpha) * 100;
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.fireAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, ringSize), 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100 * this.fireAlpha);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.fireAlpha})`);
        gradient.addColorStop(0.4, `rgba(0, 255, 255, ${this.fireAlpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0, 100 * this.fireAlpha), 0, Math.PI * 2);
        ctx.fill();
        
        this.fireAlpha *= (1 - 6 * 0.016); // Faster decay
        if (this.fireAlpha < 0.01) this.fireAlpha = 0;
        ctx.restore();
    }

    ctx.fill();
    
    ctx.fillStyle = '#050505'; // Dark text on white core
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.engine.health)}`, 0, 1);
    
    ctx.restore();
  }

  drawBug(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(bug.x, bug.y);
    
    // Draw glow trail (subtle persistent path)
    if (!this.isLowEnd && bug.active) {
      this.drawBugTrail(bug);
    }

    ctx.rotate(bug.rotation);
    
    const legSwing = Math.sin(bug.walkCycle) * 0.8;
    
    ctx.fillStyle = bug.color;
    ctx.strokeStyle = bug.color;
    ctx.lineWidth = 1;
    
    const scale = bug.size / 15;
    ctx.scale(scale, scale);

    // Damage flash
    if (bug.hitTimer > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Simplified hitbox-based flash
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = bug.color;
    }

    // Ghost bug flickering effect
    if (bug.type === 'ghost') {
      const flicker = Math.sin(this.engine.globalTime * 20) * 0.5 + 0.5;
      if (flicker < 0.3) {
        ctx.restore();
        return;
      }
      ctx.globalAlpha = 0.4 + flicker * 0.4;
    }
    
    if (!this.isLowEnd) {
      ctx.shadowColor = bug.color;
      ctx.shadowBlur = 15;
    }

    // Body Detailing
    this.drawBugBody(bug, legSwing);
    
    // Eyes (Global for all types)
    ctx.fillStyle = '#050505'; 
    ctx.beginPath();
    ctx.arc(-6, -18, 3, 0, Math.PI * 2);
    ctx.arc(6, -18, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner Glow/Pupil
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(-6, -19, 1, 0, Math.PI * 2);
    ctx.arc(6, -19, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Technical overlay (circuit patterns)
    if (bug.type === 'boss' || bug.type === 'tank') {
        this.drawTechnicalDetails(bug);
    }

    // Mandible boss special armor visualization
    if (bug.variantId === 'mandible' && bug.armor && bug.armor < 1.0) {
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 3;
      const angleShift = Math.sin(this.engine.globalTime * 15) * 0.2;
      
      // Visual feedback for hardened armor
      ctx.save();
      // Left Mandible
      ctx.beginPath();
      ctx.arc(-10, -15, 25, Math.PI * 1.1 + angleShift, Math.PI * 1.6 + angleShift);
      ctx.stroke();
      
      // Right Mandible
      ctx.beginPath();
      ctx.arc(10, -15, 25, Math.PI * 1.4 - angleShift, Math.PI * 1.9 - angleShift);
      ctx.stroke();
      ctx.restore();

      // Armor glow pulse
      const armorPulse = Math.abs(Math.sin(this.engine.globalTime * 10)) * 0.2;
      ctx.fillStyle = `rgba(255, 100, 0, ${0.1 + armorPulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health Bar for tougher bugs
    if (bug.maxHp > 1 && bug.type !== 'boss') {
      const barW = Math.max(30, bug.size * scale);
      const barH = 2.5;
      const bx = bug.x - barW / 2;
      const by = bug.y - (bug.size * scale) - 12;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(bx, by, barW, barH);
      
      // Progress
      const hpRatio = bug.hp / bug.maxHp;
      ctx.fillStyle = bug.color;
      ctx.fillRect(bx, by, barW * hpRatio, barH);
      
      // Critical Flash
      if (hpRatio < 0.25 && Math.sin(this.engine.globalTime * 15) > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, barW * hpRatio, barH);
      }
    }
  }

  drawBugTrail(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bug.size * 2);
    grad.addColorStop(0, `${bug.color}33`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, bug.size * 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBugBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;

    if (bug.type === 'scout') {
      this.drawScoutBody(bug, legSwing);
    } else if (bug.type === 'tank') {
      this.drawTankBody(bug, legSwing);
    } else if (bug.type === 'healer') {
      this.drawHealerBody(bug);
    } else if (bug.type === 'boss') {
      this.drawBossBody(bug);
    } else if (bug.type === 'swarmer' || bug.type === 'mini') {
      this.drawSwarmerBody(bug);
    } else if (bug.type === 'phase') {
      this.drawPhaseBody(bug);
    } else if (bug.type === 'ember') {
      this.drawEmberBody(bug);
    } else if (bug.type === 'frost') {
      this.drawFrostBody(bug);
    } else {
      this.drawBeetleBody(bug, legSwing);
    }
  }

  private drawLegSegment(x: number, y: number, side: number, swing: number, joint1: number, joint2: number) {
    const ctx = this.engine.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    const midX = x + side * joint1;
    const midY = y + swing * 15;
    const endX = x + side * (joint1 + joint2);
    const endY = y + swing * 5;
    
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
    
    // Joint dot
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath(); ctx.arc(midX, midY, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  private drawBeetleBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    ctx.lineWidth = 2;
    ctx.strokeStyle = bug.color;

    // Legs
    for (let i = 0; i < 3; i++) {
      const y = -10 + i * 15;
      const swing = (i % 2 === 0 ? legSwing : -legSwing);
      this.drawLegSegment(-10, y, -1, swing, 15, 10);
      this.drawLegSegment(10, y, 1, -swing, 15, 10);
    }

    // Body segments with AAA shading
    const grad = ctx.createRadialGradient(-5, -5, 0, 0, 0, 30);
    grad.addColorStop(0, '#ffffff'); // Highlight
    grad.addColorStop(0.2, bug.color);
    grad.addColorStop(1, '#000000'); // Shadow

    ctx.fillStyle = grad;
    
    // Abdomen (Large back)
    ctx.beginPath();
    ctx.ellipse(0, 15, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();

    // Thorax (Middle)
    ctx.beginPath();
    ctx.ellipse(0, -5, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(0, -22, 11, 0, Math.PI * 2);
    ctx.fill();

    // Wings/Shell line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 35); ctx.stroke();
  }

  private drawScoutBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const wingVibe = Math.sin(t * 40) * 10;
    
    // Wings (Translucent layered)
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 2; i++) {
        const offset = i * 5;
        ctx.fillStyle = bug.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-20, -10 + wingVibe, -40, 10 + offset, -10, 20);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(20, -10 + wingVibe, 40, 10 + offset, 10, 20);
        ctx.fill();
    }
    ctx.restore();

    // High-tech body
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(12, 5);
    ctx.lineTo(0, 15);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();

    // Glowing thruster
    const thrusterGlow = Math.abs(Math.sin(t * 20)) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${thrusterGlow})`;
    ctx.beginPath(); ctx.arc(0, 15, 4, 0, Math.PI * 2); ctx.fill();
  }

  private drawTankBody(bug: Bug, legSwing: number) {
    const ctx = this.engine.ctx;
    ctx.lineWidth = 3;
    ctx.strokeStyle = bug.color;

    // Heavy segmented legs
    for (let i = 0; i < 3; i++) {
        const y = -15 + i * 20;
        const swing = (i % 2 === 0 ? legSwing : -legSwing) * 0.5;
        this.drawLegSegment(-25, y, -1, swing, 20, 15);
        this.drawLegSegment(25, y, 1, -swing, 20, 15);
    }

    // Armor Plates
    ctx.fillStyle = bug.color;
    for (let i = 0; i < 4; i++) {
        const y = -30 + i * 18;
        const width = 25 - Math.abs(i - 1.5) * 4;
        ctx.beginPath();
        ctx.roundRect(-width, y, width * 2, 15, 4);
        ctx.fill();
        
        // Highlight on each plate
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(-width + 2, y + 2, width * 2 - 4, 3);
        ctx.fillStyle = bug.color;
    }

    // Side Turrets/Shields
    this.drawSidePlates(bug);
  }

  private drawHealerBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;

    // Healing Aura
    const auraAlpha = 0.15 + Math.sin(t * 5) * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 150, ${auraAlpha})`;
    ctx.fill();

    // Mechanical Chassis
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.roundRect(-8, -28, 16, 56, 8); // Vertical
    ctx.roundRect(-28, -8, 56, 16, 8); // Horizontal
    ctx.fill();

    // Central Core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Floating panels
    for (let i = 0; i < 4; i++) {
        const angle = t + (i * Math.PI / 2);
        const dist = 35 + Math.sin(t * 4 + i) * 5;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = bug.color;
        ctx.fillRect(dist, -5, 10, 10);
        ctx.restore();
    }

    if (bug.isHealing) {
      this.drawHealingPulses(bug);
    }
  }

  private drawHealingPulses(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const pulse = (t % 0.8) / 0.8;
    ctx.strokeStyle = `rgba(100, 255, 200, ${1 - pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + pulse * 80, 0, Math.PI * 2);
    ctx.stroke();

    const healerScale = bug.size / 15;
    this.engine.bugs.forEach(other => {
      if (other !== bug && other.active) {
          const dx = other.x - bug.x;
          const dy = other.y - bug.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 150 * 150) {
            this.drawHealingBeam(0, 0, dx / healerScale, dy / healerScale, bug.color);
          }
      }
    });
  }

  private drawSwarmerBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const spines = bug.type === 'mini' ? 4 : 8;
    
    ctx.fillStyle = bug.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < spines * 2; i++) {
        const isSpike = i % 2 === 0;
        const r = isSpike ? 28 : 14;
        const angle = (i / (spines * 2)) * Math.PI * 2 + (t * 4);
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner core
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  }

  private drawPhaseBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const alpha = 0.5 + Math.sin(t * 12) * 0.4;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = bug.color;
    
    // Shifting geometric shards
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(t * 2 + i);
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(15, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  private drawEmberBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // Inner Glow
    const glow = 20 + Math.sin(t * 15) * 10;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glow);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(0, glow), 0, Math.PI * 2); ctx.fill();

    // Magma Shell
    ctx.fillStyle = '#441100';
    ctx.beginPath();
    ctx.roundRect(-18, -18, 36, 36, 6);
    ctx.fill();
    
    // Glowing Cracks
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
    ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
    ctx.stroke();
  }

  private drawFrostBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // Ice Lattice
    ctx.strokeStyle = '#8bd8ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + (t * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
        ctx.stroke();
    }

    // Crystalline Core
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(10, 0); ctx.lineTo(0, 5); ctx.closePath();
    ctx.fill();
  }


  drawSidePlates(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.fillStyle = '#00000033';
    ctx.fillRect(-30, -15, 10, 30);
    ctx.fillRect(20, -15, 10, 30);
  }

  drawTankLegs(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.strokeStyle = bug.color;
    for (let i = 0; i < 3; i++) {
      const y = -15 + i * 15;
      ctx.beginPath();
      ctx.moveTo(-25, y); ctx.lineTo(-40, y + (i-1)*5);
      ctx.moveTo(25, y); ctx.lineTo(40, y + (i-1)*5);
      ctx.stroke();
    }
  }

  drawBossBody(bug: Bug) {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    // VARIANT: Arachne Spindly Legs
    if (bug.variantId === 'arachne') {
      const pulse = Math.sin(t * 8) * 0.5 + 0.5;
      ctx.strokeStyle = bug.color;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.shadowBlur = 10 + pulse * 10;
      ctx.shadowColor = bug.color;
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.sin(t * 5 + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const r1 = 35; 
        const r2 = 110 + Math.sin(t * 12 + i) * 15;
        // Jointed leg look
        const midX = Math.cos(angle - 0.2) * r1 * 1.5;
        const midY = Math.sin(angle - 0.2) * r1 * 1.5;
        ctx.lineTo(midX, midY);
        ctx.lineTo(Math.cos(angle + 0.1) * r2, Math.sin(angle + 0.1) * r2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // VARIANT: Steel Mandible
    if (bug.variantId === 'mandible') {
      const open = bug.armor === 1.0; 
      const angle = open ? 0.9 : 0.15;
      const vibrato = !open ? Math.sin(t * 50) * 2 : 0;
      
      // Armored shell look
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = bug.color;
      ctx.lineWidth = 3;
      
      // Mandibles
      for (let side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * angle + vibrato * 0.01);
        
        ctx.fillStyle = bug.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(side * 50, -50, side * 30, -110);
        ctx.lineTo(side * 10, -40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner "teeth"
        ctx.fillStyle = '#fff';
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(side * (15 + j * 5), -40 - j * 15, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      }
    }

    // VARIANT: Moth Wings
    if (bug.variantId === 'moth') {
      const wingVibe = Math.sin(t * 45) * 35;
      const shift = Math.sin(t * 2) * 20;
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = bug.color;
      
      // Layered ethereal wings with patterns
      for (let layer = 0; layer < 2; layer++) {
        ctx.globalAlpha = layer === 0 ? 0.2 : 0.5;
        const sizeMod = layer === 0 ? 1.3 : 1.0;
        ctx.fillStyle = bug.color;
        
        // Top Wings
        ctx.beginPath();
        ctx.ellipse(-55, -15 + shift, (100 + wingVibe) * sizeMod, 45 * sizeMod, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(55, -15 + shift, (100 + wingVibe) * sizeMod, 45 * sizeMod, -0.4, 0, Math.PI * 2); ctx.fill();
        
        // Wing Eye Patterns
        if (layer === 1) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-70, -20 + shift, 10, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(70, -20 + shift, 10, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = bug.color;
    ctx.setLineDash([5, 12]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 85, t * 0.5, t * 0.5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    for (let i = 0; i < 3; i++) {
        const offset = t * 2 + (i * Math.PI * 2 / 3);
        ctx.save();
        ctx.rotate(offset);
        ctx.fillStyle = bug.isShielded ? '#00ffff44' : '#ffffff22';
        ctx.fillRect(90, -8, 4, 16);
        ctx.restore();
    }

    // Main Chassis
    ctx.fillStyle = bug.color;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.bezierCurveTo(60, -20, 40, 70, 0, 50);
    ctx.bezierCurveTo(-40, 70, -60, -20, 0, -70);
    ctx.fill();
    
    // Core Glow
    const pulse = Math.abs(Math.sin(t * 5)) * 0.5 + 0.5;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, bug.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Ability Charging Indicators
    const conf = GameConfig.bugs.boss;
    const barrageCharge = bug.phase >= 2 ? Math.min(1, bug.abilityTimer! / conf.barrageRate) : 0;
    
    if (barrageCharge > 0.7) {
        const warningAlpha = (barrageCharge - 0.7) / 0.3;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${warningAlpha * (Math.sin(t * 20) * 0.5 + 0.5)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 95, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ff0000';
        ctx.font = '900 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BARRAGE_IMMINENT', 0, -110);
        ctx.restore();
    }

    if (bug.isShielded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 105, 0, Math.PI * 2);
        
        const sPulse = Math.sin(t * 10) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 * sPulse})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 * sPulse})`;
        for(let i=0; i<6; i++) {
            const ang = i * Math.PI / 3 + t;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 105, Math.sin(ang) * 105);
            ctx.lineTo(Math.cos(ang + Math.PI/3) * 105, Math.sin(ang + Math.PI/3) * 105);
            ctx.stroke();
        }
        ctx.restore();
    }
  }

  drawHealingBeam(x1: number, y1: number, x2: number, y2: number, color: string) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -this.engine.globalTime * 20;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    
    // Add small particles along the beam
    const t = this.engine.globalTime;
    for (let i = 0; i < 3; i++) {
        const p = (t * 2 + i / 3) % 1;
        const px = x1 + (x2 - x1) * p;
        const py = y1 + (y2 - y1) * p;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }

  drawTechnicalDetails(bug: Bug) {
    const ctx = this.engine.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(10, -10);
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(-10, 10); ctx.lineTo(10, 10);
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(this.engine.globalTime * 5) * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
  }


  drawPowerup(p: Powerup) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    
    const pulse = Math.sin(this.engine.globalTime * 10) * 2;
    
    if (p.life < 2 && Math.floor(this.engine.globalTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }
    
    if (p.collection === 'hover') {
      // Hover collection: spinning dashed outer ring
      ctx.save();
      ctx.rotate(this.engine.globalTime * 2);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size + 8), 0, Math.PI * 2);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1; // Sleeker line
      ctx.stroke();
      ctx.restore();
    } else {
      // Click collection: solid pulsing outer ring
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size + 6 + pulse), 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1; // Sleeker line
      ctx.stroke();
    }
    
    ctx.rotate(this.engine.globalTime);
    ctx.beginPath();
    ctx.moveTo(0, -(p.size + pulse));
    ctx.lineTo(p.size + pulse, 0);
    ctx.lineTo(0, p.size + pulse);
    ctx.lineTo(-(p.size + pulse), 0);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(5, 5, 5, 0.9)'; // Dark center
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2; // Strong border
    if (!this.isLowEnd) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    
    ctx.rotate(-this.engine.globalTime);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(p.icon, 0, 1);
    
    ctx.restore();
  }

  drawResource(r: any) {
    if (!r.active) return;
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    
    ctx.save();
    ctx.translate(r.x, r.y);
    
    const lifeFactor = Math.min(1, r.life / 2);
    const scale = (0.8 + Math.cos(t * 12 + r.x) * 0.1) * lifeFactor;
    ctx.scale(scale, scale);
    
    // Draw resource shape (diamond for technical feel)
    ctx.rotate(t * 2 + r.y);
    ctx.fillStyle = r.color;
    if (!this.isLowEnd) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = r.color;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -r.size);
    ctx.lineTo(r.size * 0.7, 0);
    ctx.lineTo(0, r.size);
    ctx.lineTo(-r.size * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  drawSplatter(s: Splatter) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    
    // Splatters are very persistent but become transparent to not obscure UI
    const lifeRatio = s.life / s.maxLife;
    const alpha = Math.min(0.6, lifeRatio * 1.5);
    const scale = 1.0; 
    ctx.globalAlpha = alpha;
    ctx.scale(scale, scale);
    ctx.fillStyle = s.color;
    
    // Digital noise/glitch effect on splatter
    if (Math.random() > 0.95) {
        ctx.translate((Math.random() - 0.5) * 5, 0);
    }

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, s.size), 0, Math.PI * 2);
    ctx.fill();
    
    s.drops.forEach((drop: any, index: number) => {
      ctx.beginPath();
      // Every 3rd drop is a square for that digital glitch look
      if (index % 3 === 0) {
        ctx.rect(drop.x - drop.size, drop.y - drop.size, drop.size * 2, drop.size * 2);
      } else {
        ctx.arc(drop.x, drop.y, Math.max(0, drop.size), 0, Math.PI * 2);
      }
      ctx.fill();
    });
    
    ctx.restore();
  }

  drawParticle(p: Particle) {
    const ctx = this.engine.ctx;
    const alpha = p.life / p.maxLife;
    
    if (p.type === 'spark') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
      
      if (!this.isLowEnd) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.5;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (p.type === 'smoke') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, p.size * (2 - alpha)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (!this.isLowEnd) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.lineTo(p.size/3, -p.size/3);
    ctx.lineTo(p.size, 0);
    ctx.lineTo(p.size/3, p.size/3);
    ctx.lineTo(0, p.size);
    ctx.lineTo(-p.size/3, p.size/3);
    ctx.lineTo(-p.size, 0);
    ctx.lineTo(-p.size/3, -p.size/3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  drawShockwave(sw: Shockwave) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = sw.life / sw.maxLife;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, Math.max(0, sw.radius), 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 10 * alpha;
    if (!this.isLowEnd) {
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20;
    }
    ctx.stroke();
    ctx.restore();
  }

  drawLaser(l: Laser) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = l.life / l.maxLife;
    ctx.globalAlpha = alpha;
    
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = l.color;
    ctx.lineWidth = l.width * 5 * alpha;
    ctx.lineCap = 'round';
    if (!this.isLowEnd) {
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 15;
    }
    ctx.stroke();

    // Inner core
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = l.width * alpha;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Impact sparks at target point (handled by ParticleSystem during spawnLaser)
    
    ctx.restore();
  }

  drawClouds() {
    if (this.isLowEnd) return;
    const ctx = this.engine.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    const t = this.engine.globalTime;
    const isBoss = this.engine.waveManager.isBossWave;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Pulsing intensity based on game surge and boss presence
    const surge = Math.min(1, this.engine.performanceFactor * 0.2 + this.fireAlpha * 0.5);
    const bossFactor = isBoss ? 1.5 : 1.0;
    
    // Create 3 large moving atmospheric clouds that react to combat
    const clouds = [
        { x: Math.sin(t * 0.1) * 200 + w * 0.5, y: Math.cos(t * 0.15) * 150 + h * 0.5, r: 400 * bossFactor, color: isBoss ? 'rgba(255, 50, 50, 0.03)' : 'rgba(50, 100, 255, 0.02)' },
        { x: Math.cos(t * 0.08) * 300 + w * 0.5, y: Math.sin(t * 0.12) * 200 + h * 0.5, r: 500 * bossFactor, color: isBoss ? 'rgba(255, 50, 150, 0.02)' : 'rgba(255, 50, 150, 0.015)' },
        { x: Math.sin(t * 0.05 + 2) * 250 + w * 0.5, y: Math.cos(t * 0.07 + 1) * 180 + h * 0.5, r: 600 * bossFactor, color: isBoss ? 'rgba(200, 0, 255, 0.015)' : 'rgba(50, 255, 200, 0.01)' }
    ];

    clouds.forEach(c => {
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * (1 + surge * 0.3));
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });

    ctx.restore();
  }

  drawMuzzleFlash(f: MuzzleFlash) {
    const ctx = this.engine.ctx;
    ctx.save();
    const alpha = f.life / f.maxLife;
    
    const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.3, `rgba(255, 255, 100, ${alpha * 0.8})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(f.x, f.y, Math.max(0, f.size), 0, Math.PI * 2);
    ctx.fill();
    
    // Spiky flash bits
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const len = f.size * (1 + Math.random() * 1.5);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(angle) * len, f.y + Math.sin(angle) * len);
        ctx.stroke();
    }
    
    ctx.restore();
  }
}
