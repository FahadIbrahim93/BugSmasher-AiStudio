export interface Particle { 
  active: boolean; 
  x: number; 
  y: number; 
  vx: number; 
  vy: number; 
  size: number; 
  color: string; 
  rotation: number; 
  life: number; 
  maxLife: number; 
  type?: 'circle' | 'spark' | 'smoke' | 'debris' | 'confetti' | 'starburst';
  hueShift?: number;
}
export interface SplatterDrop { x: number; y: number; size: number; active: boolean; }
export interface Splatter { active: boolean; x: number; y: number; rotation: number; size: number; color: string; life: number; maxLife: number; drops: SplatterDrop[]; }
export interface Shockwave { active: boolean; x: number; y: number; radius: number; speed: number; color: string; life: number; maxLife: number; }
export interface Laser { active: boolean; x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number; color: string; width: number; }
export interface MuzzleFlash { active: boolean; x: number; y: number; life: number; maxLife: number; size: number; }

export interface HeatShimmer { 
  active: boolean; 
  x: number; 
  y: number; 
  intensity: number; 
  life: number; 
  maxLife: number;
}

const MAX_PARTICLES = 800;
const MAX_HEAT_SHIMMERS = 30;
const MAX_SPLATTERS = 100;
const MAX_SHOCKWAVES = 50;
const MAX_LASERS = 50;
const MAX_MUZZLE_FLASHES = 20;
const MAX_DROPS_PER_SPLATTER = 16;

import type { ParticleEngineHost } from './ParticleEngineHost';

export class ParticleSystem {
  engine?: ParticleEngineHost;
  
  get vfxCountMultiplier(): number {
    if (!this.engine) return 1.0;
    const renderer = this.engine.renderer;
    if (!renderer) return 1.0;
    return renderer.vfxScalar;
  }

  particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', rotation: 0, life: 0, maxLife: 0 }));
  particleIdx = 0;
  
  splatters: Splatter[] = Array.from({ length: MAX_SPLATTERS }, () => ({ 
    active: false, x: 0, y: 0, rotation: 0, size: 0, color: '', life: 0, maxLife: 0, 
    drops: Array.from({ length: MAX_DROPS_PER_SPLATTER }, () => ({ x: 0, y: 0, size: 0, active: false }))
  }));
  splatterIdx = 0;
  
  shockwaves: Shockwave[] = Array.from({ length: MAX_SHOCKWAVES }, () => ({ active: false, x: 0, y: 0, radius: 0, speed: 0, color: '', life: 0, maxLife: 0 }));
  shockwaveIdx = 0;
  
  lasers: Laser[] = Array.from({ length: MAX_LASERS }, () => ({ active: false, x1: 0, y1: 0, x2: 0, y2: 0, life: 0, maxLife: 0, color: '', width: 0 }));
  laserIdx = 0;

  muzzleFlashes: MuzzleFlash[] = Array.from({ length: MAX_MUZZLE_FLASHES }, () => ({ active: false, x: 0, y: 0, life: 0, maxLife: 0, size: 0 }));
  muzzleFlashIdx = 0;

  heatShimmers: HeatShimmer[] = Array.from({ length: MAX_HEAT_SHIMMERS }, () => ({ active: false, x: 0, y: 0, intensity: 0, life: 0, maxLife: 0 }));
  heatShimmerIdx = 0;

  reset() {
    this.particles.forEach(p => p.active = false);
    this.splatters.forEach(s => s.active = false);
    this.shockwaves.forEach(sw => sw.active = false);
    this.lasers.forEach(l => l.active = false);
    this.muzzleFlashes.forEach(f => f.active = false);
    this.heatShimmers.forEach(h => h.active = false);
  }

  update(dt: number) {
    // Track active count — skip full iteration bursts when nothing is active
    let anyActive = false;
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyActive = true;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
      
    for (let i = 0; i < MAX_SPLATTERS; i++) {
      const s = this.splatters[i];
      if (!s.active) continue;
      anyActive = true;
      s.life -= dt;
      if (s.life <= 0) s.active = false;
    }
      
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = this.shockwaves[i];
      if (!sw.active) continue;
      anyActive = true;
      sw.life -= dt;
      sw.radius += sw.speed * dt;
      if (sw.life <= 0) sw.active = false;
    }
      
    for (let i = 0; i < MAX_LASERS; i++) {
      const l = this.lasers[i];
      if (!l.active) continue;
      anyActive = true;
      l.life -= dt;
      if (l.life <= 0) l.active = false;
    }

    for (let i = 0; i < MAX_MUZZLE_FLASHES; i++) {
      const f = this.muzzleFlashes[i];
      if (!f.active) continue;
      anyActive = true;
      f.life -= dt;
      if (f.life <= 0) f.active = false;
    }

    for (let i = 0; i < MAX_HEAT_SHIMMERS; i++) {
      const h = this.heatShimmers[i];
      if (!h.active) continue;
      anyActive = true;
      h.life -= dt;
      if (h.life <= 0) h.active = false;
    }
    
    // Early-out hint: if nothing is active, skip rendering pass overhead
    this.hasActiveEffects = anyActive;
  }

  // Public flag so renderer can skip passes when nothing to draw
  hasActiveEffects = false;

  spawnMuzzleFlash(x: number, y: number, size = 40) {
    const f = this.muzzleFlashes[this.muzzleFlashIdx];
    f.active = true;
    f.x = x;
    f.y = y;
    f.life = 0.05;
    f.maxLife = 0.05;
    f.size = size;
    this.muzzleFlashIdx = (this.muzzleFlashIdx + 1) % MAX_MUZZLE_FLASHES;
  }

  spawnShockwave(x: number, y: number, color: string, maxRadius: number) {
    const sw = this.shockwaves[this.shockwaveIdx];
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 10;
    sw.speed = maxRadius * 3;
    sw.color = color;
    sw.life = 0.3;
    sw.maxLife = 0.3;
    this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
  }
  
  spawnSplatter(x: number, y: number, color: string) {
    const s = this.splatters[this.splatterIdx];
    s.active = true;
    s.x = x;
    s.y = y;
    s.rotation = Math.random() * Math.PI * 2;
    s.size = Math.random() * 15 + 10;
    s.color = color;
    s.life = 5;
    s.maxLife = 5;
    
    for (let i = 0; i < MAX_DROPS_PER_SPLATTER; i++) {
      const drop = s.drops[i];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 50 + 5;
      drop.active = true;
      drop.x = Math.cos(angle) * dist;
      drop.y = Math.sin(angle) * dist;
      drop.size = Math.random() * 8 + 2;
    }
    
    this.splatterIdx = (this.splatterIdx + 1) % MAX_SPLATTERS;
  }
  
  spawnGibs(x: number, y: number, color: string, count = 15) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let finalCount = isLowQuality ? Math.max(1, Math.round(count * 0.4)) : count;
    finalCount = Math.max(1, Math.round(finalCount * this.vfxCountMultiplier));
    for (let i = 0; i < finalCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 90;
      
      p.active = true;
      p.type = 'debris'; // Solid jagged shell fragment
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 7 + 3;
      p.color = color;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.4 + Math.random() * 0.4;
      p.maxLife = p.life;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }
  
  spawnMissParticles(x: number, y: number) {
    this.spawnClickPulse(x, y);
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let finalCount = isLowQuality ? 3 : 8;
    finalCount = Math.max(1, Math.round(finalCount * this.vfxCountMultiplier));
    for (let i = 0; i < finalCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      
      p.active = true;
      p.type = 'spark';
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 4 + 1;
      p.color = '#00ffff';
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.2 + Math.random() * 0.2;
      p.maxLife = 0.4;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnExplosion(x: number, y: number, color: string, bugType?: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    
    // 1. Sleek shockwave ring matching the bug's biological color
    this.spawnShockwave(x, y, color, isLowQuality ? 45 : 75);
    // Secondary bright white flash blow-out shockwave
    this.spawnShockwave(x, y, '#ffffff', isLowQuality ? 20 : 35);
    
    // 2. Visceral sharp chitin/shell debris chunks (rendered as jagged polygons)
    const shellDebrisCount = bugType === 'tank' || bugType === 'beetle' ? (isLowQuality ? 6 : 12) : (isLowQuality ? 3 : 6);
    this.spawnGibs(x, y, color, shellDebrisCount);
    
    // 3. Gooey organic fluid droplets flying outwards with momentum
    let gooCount = bugType === 'swarmer' || bugType === 'mini' ? (isLowQuality ? 4 : 8) : (isLowQuality ? 6 : 13);
    if (bugType === 'healer') gooCount *= 1.6; // Healer's medicine sac has large volume explosion
    gooCount = Math.max(1, Math.round(gooCount * this.vfxCountMultiplier));
    
    for (let i = 0; i < gooCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 70;
      
      p.active = true;
      p.type = 'circle'; // gooey blobs
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 6 + 2;
      p.color = color;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.35 + Math.random() * 0.35;
      p.maxLife = p.life;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
    
    // 4. Biological gasses/particles (cloud of bio-vapor)
    const cloudColor = bugType === 'healer' ? 'rgba(0, 255, 120, 0.22)' 
                     : bugType === 'swarmer' || bugType === 'mini' ? 'rgba(128, 0, 128, 0.18)'
                     : 'rgba(50, 50, 50, 0.35)';
    this.spawnSmoke(x, y, cloudColor);
    
    // 5. Heavy secondary blowouts for big armor cores
    if (bugType === 'boss' || bugType === 'tank' || bugType === 'beetle') {
      this.spawnShockwave(x, y, '#ffffff', isLowQuality ? 70 : 130);
      this.spawnSmoke(x, y, 'rgba(80, 25, 25, 0.4)');
      this.spawnGibs(x, y, color, isLowQuality ? 7 : 14);
    }
  }

  spawnClickPulse(x: number, y: number) {
    const sw = this.shockwaves[this.shockwaveIdx];
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 1;
    sw.speed = 150;
    sw.color = '#ffffff';
    sw.life = 0.15;
    sw.maxLife = 0.15;
    this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
  }

  spawnInputFeedback(x: number, y: number) {
    // Single shockwave instead of 3 — still gives visual feedback without triple overhead
    const sw = this.shockwaves[this.shockwaveIdx];
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 5;
    sw.speed = 300;
    sw.color = '#ffffff';
    sw.life = 0.2;
    sw.maxLife = 0.2;
    this.shockwaveIdx = (this.shockwaveIdx + 1) % MAX_SHOCKWAVES;
  }

  spawnLaser(x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
    const l = this.lasers[this.laserIdx];
    l.active = true;
    l.x1 = x1;
    l.y1 = y1;
    l.x2 = x2;
    l.y2 = y2;
    l.life = 0.12;
    l.maxLife = 0.12;
    l.color = color;
    l.width = width;
    this.laserIdx = (this.laserIdx + 1) % MAX_LASERS;
    
    // Visceral, highly satisfying laser impact sparks and debris (restoring original juice in the best way)
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    const baseCount = isLowQuality ? 6 : 14;
    const finalCount = Math.max(3, Math.round(baseCount * this.vfxCountMultiplier));
    
    for (let i = 0; i < finalCount; i++) {
      // Alternate between high-velocity glowing spiky sparks and smaller circle debris particles
      const isSpark = i % 2 === 0;
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isSpark ? 380 : 200) + 90;
      
      p.active = true;
      p.type = isSpark ? 'spark' : 'circle';
      p.x = x2;
      p.y = y2;
      p.vx = Math.sin(angle) * speed;
      p.vy = Math.cos(angle) * speed;
      p.size = isSpark ? (Math.random() * 8 + 3) : (Math.random() * 4 + 1.5);
      p.color = color;
      p.rotation = isSpark ? angle : Math.random() * Math.PI * 2;
      p.life = isSpark ? (0.15 + Math.random() * 0.18) : (0.2 + Math.random() * 0.25);
      p.maxLife = p.life;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnSparkExplosion(x: number, y: number, color: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let count = isLowQuality ? 4 : 12;
    count = Math.max(1, Math.round(count * this.vfxCountMultiplier));
    for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleIdx];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 600 + 200;
        
        p.active = true;
        p.type = 'spark';
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = Math.random() * 12 + 4;
        p.color = color;
        p.rotation = angle;
        p.life = 0.25 + Math.random() * 0.15;
        p.maxLife = p.life;
        
        this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnSmoke(x: number, y: number, color = 'rgba(100, 100, 100, 0.5)') {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let count = isLowQuality ? 2 : 5;
    count = Math.max(1, Math.round(count * this.vfxCountMultiplier));
    for (let i = 0; i < count; i++) {
        const p = this.particles[this.particleIdx];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 40 + 20;
        
        p.active = true;
        p.type = 'smoke';
        p.x = x + (Math.random() - 0.5) * 20;
        p.y = y + (Math.random() - 0.5) * 20;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = Math.random() * 30 + 20;
        p.color = color;
        p.rotation = Math.random() * Math.PI * 2;
        p.life = 1.0 + Math.random() * 1.0;
        p.maxLife = p.life;
        
        this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnConfetti(x: number, y: number, baseColor?: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    let count = isLowQuality ? 15 : 45;
    count = Math.max(1, Math.round(count * this.vfxCountMultiplier));
    const confettiColors = ['#ff0', '#f0f', '#0ff', '#f44', '#4f4', '#44f', '#ff8', '#fa0', '#fff', '#8ff', '#f8f', '#aaf'];
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleIdx];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2; // Mostly downward spread
      const speed = Math.random() * 200 + 50;
      
      p.active = true;
      p.type = 'confetti';
      p.x = x + (Math.random() - 0.5) * 400;
      p.y = y + (Math.random() - 0.5) * 200;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 6 + 3;
      p.color = baseColor || confettiColors[Math.floor(Math.random() * confettiColors.length)];
      p.hueShift = Math.random() * Math.PI * 2;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 2.5 + Math.random() * 2.5;
      p.maxLife = p.life;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }

  spawnStarburst(x: number, y: number, color: string) {
    const isLowQuality = this.engine && (this.engine.isMobile || !this.engine.highFidelityVFX);
    const rayCount = isLowQuality ? 8 : 18;
    
    for (let i = 0; i < rayCount; i++) {
      const p = this.particles[this.particleIdx];
      const angle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 350 + 150;
      
      p.active = true;
      p.type = 'starburst';
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 8 + 4;
      p.color = i % 2 === 0 ? '#ffffff' : color;
      p.rotation = angle;
      p.life = 0.5 + Math.random() * 0.4;
      p.maxLife = p.life;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
    
    // Central bright flash
    const flash = this.muzzleFlashes[this.muzzleFlashIdx];
    flash.active = true;
    flash.x = x;
    flash.y = y;
    flash.life = 0.15;
    flash.maxLife = 0.15;
    flash.size = 50;
    this.muzzleFlashIdx = (this.muzzleFlashIdx + 1) % MAX_MUZZLE_FLASHES;
  }

  spawnHeatShimmer(x: number, y: number, intensity = 1.0) {
    const h = this.heatShimmers[this.heatShimmerIdx];
    h.active = true;
    h.x = x;
    h.y = y;
    h.intensity = intensity;
    h.life = 0.12;
    h.maxLife = 0.12;
    this.heatShimmerIdx = (this.heatShimmerIdx + 1) % MAX_HEAT_SHIMMERS;
  }

  spawnParticle(x: number, y: number, color: string, size = 5, life = 0.5) {
    const p = this.particles[this.particleIdx];
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 200 + 50;
    
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = size;
    p.color = color;
    p.rotation = Math.random() * Math.PI * 2;
    p.life = life;
    p.maxLife = life;
    
    this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
  }
}
