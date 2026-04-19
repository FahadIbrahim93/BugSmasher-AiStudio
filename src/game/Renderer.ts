import { GameEngine, Bug, Powerup } from './GameEngine';
import { Splatter, Particle, Shockwave, Laser } from './ParticleSystem';

export class Renderer {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  draw() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;

    ctx.save();
    
    if (this.engine.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      const dy = (Math.random() - 0.5) * this.engine.shakeMagnitude;
      ctx.translate(dx, dy);
    }
    
    // Fill with solid black first (since alpha is false)
    ctx.fillStyle = '#050505'; // Deep near-black
    ctx.fillRect(0, 0, width, height);
    
    this.drawGrokBackground();
    
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.engine.particleSystem.splatters.length; i++) {
      if (this.engine.particleSystem.splatters[i].active) this.drawSplatter(this.engine.particleSystem.splatters[i]);
    }
    for (let i = 0; i < this.engine.particleSystem.shockwaves.length; i++) {
      if (this.engine.particleSystem.shockwaves[i].active) this.drawShockwave(this.engine.particleSystem.shockwaves[i]);
    }
    for (let i = 0; i < this.engine.particleSystem.particles.length; i++) {
      if (this.engine.particleSystem.particles[i].active) this.drawParticle(this.engine.particleSystem.particles[i]);
    }
    this.engine.particleSystem.lasers.forEach((l: Laser) => this.drawLaser(l));
    ctx.globalCompositeOperation = 'source-over';
    
    this.engine.powerups.forEach(p => this.drawPowerup(p));
    this.drawBase();
    this.engine.bugs.forEach(b => this.drawBug(b));
    
    if (this.engine.multiplierTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SYSTEM: 2X UPLINK (${Math.ceil(this.engine.multiplierTimer)}s)`, width / 2, 40);
    }

    if (this.engine.rapidFireTimer > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SYSTEM: OVERRIDE (${Math.ceil(this.engine.rapidFireTimer)}s)`, width / 2, this.engine.multiplierTimer > 0 ? 70 : 40);
    }
    
    ctx.restore();
  }

  drawGrokBackground() {
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;
    
    // Minimalist radial gradient (barely visible glow)
    const cx = width / 2;
    const cy = height / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.8);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.03)'); // Extremely faint center glow
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Simplify background on mobile to save fill rate
    if (this.engine.isMobile) return;
    
    // Draw a subtle, slowly shifting topographical mesh
    ctx.lineWidth = 1;
    const gridSize = 80; // Large, spaced out grid
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      for (let y = 0; y <= height; y += 10) {
        // Create organic wave displacement using dual sine waves
        const waveX = Math.sin((y * 0.005) + (t * 0.2)) * 20;
        const waveY = Math.cos((x * 0.005) + (t * 0.15)) * 15;
        
        if (y === 0) {
          ctx.moveTo(x + waveX, y + waveY);
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }

    for (let y = 0; y <= height; y += gridSize) {
      for (let x = 0; x <= width; x += 10) {
        const waveX = Math.sin((y * 0.005) + (t * 0.2)) * 20;
        const waveY = Math.cos((x * 0.005) + (t * 0.15)) * 15;
        
        if (x === 0) {
          ctx.moveTo(x + waveX, y + waveY);
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }
    
    // Draw lines with a very faint, technical grey
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.stroke();
  }

  drawBase() {
    const ctx = this.engine.ctx;
    const cx = this.engine.width / 2;
    const cy = this.engine.height / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    const pulse = Math.sin(this.engine.globalTime * 5) * 5;
    
    if (this.engine.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 60 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 204, 255, 0.1)`;
      ctx.strokeStyle = `rgba(0, 204, 255, 0.8)`;
      ctx.lineWidth = 2; // Sharp wireframe
      ctx.fill();
      ctx.stroke();
    }
    
    // Outer core container
    ctx.beginPath();
    ctx.arc(0, 0, 40 + (pulse * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, (this.engine.health / this.engine.maxHealth) * 0.2)})`;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    
    // Inner active core
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    if (!this.engine.isMobile) {
      // Glow shifts to red if critically damaged, otherwise stark white/cyan
      const isCritical = (this.engine.health / this.engine.maxHealth) < 0.3;
      ctx.shadowColor = isCritical ? '#ff3333' : '#ffffff';
      ctx.shadowBlur = 25;
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
    ctx.rotate(bug.rotation);
    
    const legSwing = Math.sin(bug.walkCycle) * 0.8;
    
    ctx.fillStyle = bug.color;
    // Remove the aggressive white outline for bugs to make them sleek flat vectors
    ctx.strokeStyle = bug.color;
    ctx.lineWidth = 1;
    
    const scale = bug.size / 15;
    ctx.scale(scale, scale);
    
    if (!this.engine.isMobile) {
      ctx.shadowColor = bug.color;
      ctx.shadowBlur = 10;
    }
    
    for (let i = 0; i < 3; i++) {
      const yOffset = (i - 1) * 8;
      const swing = i % 2 === 0 ? legSwing : -legSwing;
      
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(-15, yOffset - 10 + swing * 10);
      ctx.lineTo(-25, yOffset + swing * 15);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.lineTo(15, yOffset - 10 - swing * 10);
      ctx.lineTo(25, yOffset - swing * 15);
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.ellipse(0, 5, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(0, -10, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, -20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#050505'; // Dark inner core for bugs
    ctx.beginPath(); ctx.arc(-3, -22, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -22, 2, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
    
    if (bug.maxHp > 1) {
      ctx.fillStyle = '#f00';
      ctx.fillRect(bug.x - 15, bug.y - bug.size - 10, 30, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(bug.x - 15, bug.y - bug.size - 10, 30 * (bug.hp / bug.maxHp), 4);
    }
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
      ctx.arc(0, 0, p.size + 8, 0, Math.PI * 2);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1; // Sleeker line
      ctx.stroke();
      ctx.restore();
    } else {
      // Click collection: solid pulsing outer ring
      ctx.beginPath();
      ctx.arc(0, 0, p.size + 6 + pulse, 0, Math.PI * 2);
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
    if (!this.engine.isMobile) {
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

  drawSplatter(s: Splatter) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    
    const alpha = Math.min(1, s.life / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    if (!this.engine.isMobile) {
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, s.size, 0, Math.PI * 2);
    ctx.fill();
    
    s.drops.forEach((drop: any) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(drop.x * 0.5, drop.y * 0.5 + 10, drop.x, drop.y);
      ctx.lineWidth = drop.size;
      ctx.strokeStyle = s.color;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  drawParticle(p: Particle) {
    const ctx = this.engine.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (!this.engine.isMobile) {
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
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 10 * alpha;
    if (!this.engine.isMobile) {
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
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = l.color;
    ctx.lineWidth = 4 * alpha;
    if (!this.engine.isMobile) {
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.restore();
  }
}
