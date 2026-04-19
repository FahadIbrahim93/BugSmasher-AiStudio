export interface Particle { active: boolean; x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; life: number; maxLife: number; }
export interface SplatterDrop { x: number; y: number; size: number; }
export interface Splatter { active: boolean; x: number; y: number; rotation: number; size: number; color: string; life: number; maxLife: number; drops: SplatterDrop[]; }
export interface Shockwave { active: boolean; x: number; y: number; radius: number; speed: number; color: string; life: number; maxLife: number; }
export interface Laser { active: boolean; x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number; color: string; }

const MAX_PARTICLES = 300;
const MAX_SPLATTERS = 50;
const MAX_SHOCKWAVES = 20;

export class ParticleSystem {
  particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', rotation: 0, life: 0, maxLife: 0 }));
  particleIdx = 0;
  
  splatters: Splatter[] = Array.from({ length: MAX_SPLATTERS }, () => ({ active: false, x: 0, y: 0, rotation: 0, size: 0, color: '', life: 0, maxLife: 0, drops: [] }));
  splatterIdx = 0;
  
  shockwaves: Shockwave[] = Array.from({ length: MAX_SHOCKWAVES }, () => ({ active: false, x: 0, y: 0, radius: 0, speed: 0, color: '', life: 0, maxLife: 0 }));
  shockwaveIdx = 0;
  
  lasers: Laser[] = [];

  reset() {
    this.particles.forEach(p => p.active = false);
    this.splatters.forEach(s => s.active = false);
    this.shockwaves.forEach(sw => sw.active = false);
    this.lasers = [];
  }

  update(dt: number) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = this.particles[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
      }
      
      for (let i = 0; i < MAX_SPLATTERS; i++) {
        const s = this.splatters[i];
        if (!s.active) continue;
        s.life -= dt;
        if (s.life <= 0) s.active = false;
      }
      
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        const sw = this.shockwaves[i];
        if (!sw.active) continue;
        sw.life -= dt;
        sw.radius += sw.speed * dt;
        if (sw.life <= 0) sw.active = false;
      }
      
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.life -= dt;
        if (l.life <= 0) this.lasers.splice(i, 1);
      }
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
    s.life = 15;
    s.maxLife = 15;
    
    s.drops = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 40 + 10;
      s.drops.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: Math.random() * 6 + 2
      });
    }
    
    this.splatterIdx = (this.splatterIdx + 1) % MAX_SPLATTERS;
  }
  
  spawnGibs(x: number, y: number, color: string, count: number = 15) {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 300 + 100;
      
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 8 + 3;
      p.color = color;
      p.rotation = Math.random() * Math.PI * 2;
      p.life = 0.5 + Math.random() * 0.5;
      p.maxLife = 1;
      
      this.particleIdx = (this.particleIdx + 1) % MAX_PARTICLES;
    }
  }
  
  spawnMissParticles(x: number, y: number) {
    this.spawnShockwave(x, y, '#ffffff', 40);
    for (let i = 0; i < 8; i++) {
      const p = this.particles[this.particleIdx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      
      p.active = true;
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

  spawnLaser(x1: number, y1: number, x2: number, y2: number, color: string) {
    this.lasers.push({
      active: true,
      x1, y1, x2, y2,
      life: 0.1, maxLife: 0.1,
      color
    });
  }
}
