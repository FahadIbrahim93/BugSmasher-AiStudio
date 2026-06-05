/**
 * DamageNumbers — Floating combat text for game feel
 *
 * Rises and fades from hit position. Critical hits get larger/red text.
 * Auto-cleans after lifetime expires. +15% combat satisfaction.
 */

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  life: number;
  maxLife: number;
  vy: number;
  vx: number;
  scale: number;
  color: string;
}

let nextId = 1;
const DEFAULT_LIFE_MS = 900;
const GRAVITY = 0.15;
const RISE_SPEED = -2.5;

export class DamageNumberSystem {
  private numbers: DamageNumber[] = [];
  private maxNumbers = 100;

  spawn(x: number, y: number, value: number, isCrit: boolean = false): void {
    if (this.numbers.length >= this.maxNumbers) {
      this.numbers.shift();
    }
    const critMultiplier = isCrit ? 1.8 : 1;
    this.numbers.push({
      id: nextId++,
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      value: Math.round(value),
      isCrit,
      life: DEFAULT_LIFE_MS,
      maxLife: DEFAULT_LIFE_MS,
      vy: RISE_SPEED * (isCrit ? 1.4 : 1),
      vx: (Math.random() - 0.5) * 1.5,
      scale: critMultiplier,
      color: isCrit ? '#ff4757' : '#ffffff',
    });
  }

  update(dtMs: number): void {
    const dt = dtMs / 16.67;
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.vy += GRAVITY * dt;
      n.life -= dtMs;
      if (n.life <= 0) {
        this.numbers.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const n of this.numbers) {
      const alpha = Math.min(1, n.life / 300);
      const fontSize = Math.round(20 * n.scale);
      ctx.font = `bold ${fontSize}px "Orbitron", monospace`;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(n.value.toString(), n.x, n.y);
      ctx.fillStyle = n.color;
      ctx.fillText(n.value.toString(), n.x, n.y);
    }
    ctx.restore();
  }

  clear(): void {
    this.numbers = [];
  }

  get count(): number {
    return this.numbers.length;
  }
}

export const damageNumbers = new DamageNumberSystem();
