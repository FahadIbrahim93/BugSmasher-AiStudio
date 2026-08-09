import type { Bug } from '../GameTypes';

type SpriteCanvas = OffscreenCanvas | HTMLCanvasElement;
type SpriteContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
type CanvasFactory = (width: number, height: number) => SpriteCanvas;

interface BugSpriteStyle {
  legs: number;
  bodyScaleX: number;
  bodyScaleY: number;
  headScale: number;
  winged?: boolean;
  armored?: boolean;
  mandible?: boolean;
  glow?: string;
}

export class BugSpriteCache {
  private readonly sprites = new Map<string, SpriteCanvas>();

  constructor(private readonly createCanvas: CanvasFactory = createDefaultCanvas) {}

  invalidate(): void {
    this.sprites.clear();
  }

  getSprite(bug: Pick<Bug, 'type' | 'variantId' | 'color' | 'size'>): SpriteCanvas {
    const key = this.getKey(bug);
    const existing = this.sprites.get(key);
    if (existing) return existing;

    const sprite = this.renderSprite(bug);
    this.sprites.set(key, sprite);
    return sprite;
  }

  private getKey(bug: Pick<Bug, 'type' | 'variantId' | 'color' | 'size'>): string {
    return [bug.type, bug.variantId ?? 'base', bug.color, Math.round(bug.size)].join('|');
  }

  private renderSprite(bug: Pick<Bug, 'type' | 'variantId' | 'color' | 'size'>): SpriteCanvas {
    const spriteSize = Math.max(96, Math.ceil(bug.size * 5.2));
    const canvas = this.createCanvas(spriteSize, spriteSize);
    canvas.width = spriteSize;
    canvas.height = spriteSize;
    const ctx = getCanvasContext(canvas);
    if (!ctx) return canvas;

    const style = getSpriteStyle(bug.type, bug.variantId);
    const unit = spriteSize / 4.6;

    ctx.save();
    ctx.translate(spriteSize / 2, spriteSize / 2);
    this.drawLegs(ctx, style, unit, bug.color);
    this.drawWings(ctx, style, unit, bug.color);
    this.drawBody(ctx, style, unit, bug.color);
    this.drawEyes(ctx, style, unit);
    ctx.restore();

    return canvas;
  }

  private drawLegs(ctx: SpriteContext, style: BugSpriteStyle, unit: number, color: string): void {
    ctx.save();
    ctx.lineWidth = Math.max(2, unit * 0.08);
    ctx.lineCap = 'round';

    for (let i = 0; i < style.legs; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const y = -unit * 0.55 + row * (unit * 0.38);
      const gradient = ctx.createLinearGradient(side * unit * 0.25, y, side * unit * 1.35, y + unit * 0.12);
      gradient.addColorStop(0, shadeColor(color, -48));
      gradient.addColorStop(1, shadeColor(color, -118));
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(side * unit * 0.28, y);
      ctx.quadraticCurveTo(side * unit * 0.84, y + unit * 0.08, side * unit * 1.24, y + unit * 0.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawWings(ctx: SpriteContext, style: BugSpriteStyle, unit: number, color: string): void {
    if (!style.winged) return;

    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = 'rgba(235, 250, 255, 0.55)';
    ctx.strokeStyle = shadeColor(color, 55);
    ctx.lineWidth = Math.max(1, unit * 0.045);
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.ellipse(side * unit * 0.38, -unit * 0.18, unit * 0.42, unit * 0.9, side * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  private drawBody(ctx: SpriteContext, style: BugSpriteStyle, unit: number, color: string): void {
    ctx.save();
    const bodyGradient = ctx.createRadialGradient(-unit * 0.28, -unit * 0.5, unit * 0.08, 0, 0, unit * 1.18);
    bodyGradient.addColorStop(0, shadeColor(color, 78));
    bodyGradient.addColorStop(0.48, color);
    bodyGradient.addColorStop(1, shadeColor(color, -96));
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = shadeColor(color, -130);
    ctx.lineWidth = Math.max(2, unit * 0.08);

    ctx.beginPath();
    if (style.armored) {
      const points = 10;
      for (let i = 0; i <= points; i += 1) {
        const angle = -Math.PI / 2 + (i / points) * Math.PI * 2;
        const radius = unit * (i % 2 === 0 ? 1.02 : 0.86);
        const x = Math.cos(angle) * radius * style.bodyScaleX;
        const y = Math.sin(angle) * radius * style.bodyScaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      ctx.ellipse(0, unit * 0.1, unit * style.bodyScaleX, unit * style.bodyScaleY, 0, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, unit * 0.06);
    ctx.beginPath();
    ctx.arc(-unit * 0.26, -unit * 0.28, unit * 0.48, Math.PI * 1.08, Math.PI * 1.72);
    ctx.stroke();
    ctx.restore();

    if (style.armored) this.drawArmorPlates(ctx, unit, color);
    if (style.mandible) this.drawMandibles(ctx, unit);

    ctx.restore();
  }

  private drawArmorPlates(ctx: SpriteContext, unit: number, color: string): void {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = shadeColor(color, -74);
    ctx.lineWidth = Math.max(1, unit * 0.035);
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-unit * 0.82, i * unit * 0.26);
      ctx.quadraticCurveTo(0, i * unit * 0.14, unit * 0.82, i * unit * 0.26);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawMandibles(ctx: SpriteContext, unit: number): void {
    ctx.save();
    ctx.strokeStyle = '#ff9a35';
    ctx.lineWidth = Math.max(3, unit * 0.1);
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(side * unit * 0.42, -unit * 0.42, unit * 0.46, side < 0 ? Math.PI * 1.08 : Math.PI * 1.42, side < 0 ? Math.PI * 1.58 : Math.PI * 1.92);
      ctx.stroke();
    });
    ctx.restore();
  }

  private drawEyes(ctx: SpriteContext, style: BugSpriteStyle, unit: number): void {
    const eyeY = -unit * 0.58 * style.headScale;
    ctx.save();
    const glow = ctx.createRadialGradient(0, eyeY, 0, 0, eyeY, unit * 0.36);
    glow.addColorStop(0, style.glow ?? 'rgba(255,255,255,0.9)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-unit * 0.22, eyeY, unit * 0.16, 0, Math.PI * 2);
    ctx.arc(unit * 0.22, eyeY, unit * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#05070a';
    ctx.beginPath();
    ctx.arc(-unit * 0.22, eyeY, unit * 0.08, 0, Math.PI * 2);
    ctx.arc(unit * 0.22, eyeY, unit * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function getCanvasContext(canvas: SpriteCanvas): SpriteContext | null {
  if ('transferToImageBitmap' in canvas) return canvas.getContext('2d');
  return canvas.getContext('2d');
}

function createDefaultCanvas(width: number, height: number): SpriteCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getSpriteStyle(type: string, variantId?: string): BugSpriteStyle {
  if (type === 'scout') return { legs: 6, bodyScaleX: 0.58, bodyScaleY: 1.05, headScale: 1, winged: true, glow: 'rgba(125,245,255,0.95)' };
  if (type === 'tank') return { legs: 8, bodyScaleX: 1.0, bodyScaleY: 0.9, headScale: 0.86, armored: true, glow: 'rgba(255,210,150,0.95)' };
  if (type === 'healer') return { legs: 4, bodyScaleX: 0.86, bodyScaleY: 0.86, headScale: 0.9, glow: 'rgba(125,255,207,0.95)' };
  if (type === 'boss') return { legs: 8, bodyScaleX: 1.12, bodyScaleY: 0.96, headScale: 1.1, armored: true, mandible: variantId === 'mandible', glow: 'rgba(255,91,122,0.95)' };
  if (type === 'swarmer' || type === 'mini') return { legs: 6, bodyScaleX: 0.62, bodyScaleY: 0.72, headScale: 0.8 };
  if (type === 'phase') return { legs: 6, bodyScaleX: 0.72, bodyScaleY: 0.95, headScale: 0.9, glow: 'rgba(190,130,255,0.95)' };
  if (type === 'ember') return { legs: 6, bodyScaleX: 0.8, bodyScaleY: 0.95, headScale: 0.9, armored: true, glow: 'rgba(255,120,45,0.95)' };
  if (type === 'frost') return { legs: 6, bodyScaleX: 0.82, bodyScaleY: 0.88, headScale: 0.9, armored: true, glow: 'rgba(180,245,255,0.95)' };
  return { legs: 6, bodyScaleX: 0.82, bodyScaleY: 1.0, headScale: 0.9 };
}

function shadeColor(hex: string, amount: number): string {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#7dffcf';
  const value = Number.parseInt(normalized.slice(1), 16);
  const clamp = (component: number) => Math.max(0, Math.min(255, component + amount));
  const r = clamp((value >> 16) & 255);
  const g = clamp((value >> 8) & 255);
  const b = clamp(value & 255);
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}
