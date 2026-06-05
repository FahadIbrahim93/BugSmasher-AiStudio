/**
 * DeathCardGenerator — Canvas-based shareable death card for BugSmasher
 *
 * Generates a 1200x630 Open Graph / Twitter card image with:
 * - Biome-themed background gradient (stronger radial gradient)
 * - Score, wave, kills, time, rank stats (more prominent)
 * - Decorative border using biome accent color
 * - BugSmasher branding + watermark
 * - HopeTheory branding (more visible)
 *
 * Usage:
 *   const blob = await generateDeathCardBlob({ score, waves, kills, playTime, biomeId, rank });
 *   // then share via navigator.share() or download
 */

import { BIOMES } from './BiomeConfig';
import { getBiomeVisualProfile } from '../rendering/BiomeVisualProfiles';

export interface DeathCardData {
  score: number;
  waves: number;
  kills: number;
  playTimeSeconds: number;
  biomeId: string;
  rank?: number;
}

interface BiomeTheme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  bgGradientEnd: string;
}

function getBiomeTheme(biomeId: string): BiomeTheme {
  const biome = BIOMES.find(b => b.id === biomeId) ?? BIOMES[0];
  const c = biome.theme.coreColor;
  const base = biome.theme.background;
  return {
    primary: c,
    secondary: `${c}cc`,
    accent: '#ffffff',
    bg: base,
    bgGradientEnd: `${c}22`,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Generate a shareable death card image blob.
 * Returns PNG blob — pass to navigator.share() or create object URL.
 */
export async function generateDeathCardBlob(data: DeathCardData): Promise<Blob> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const theme = getBiomeTheme(data.biomeId);
  const biomeProfile = getBiomeVisualProfile(data.biomeId);

  // ── Stronger Radial Gradient Background ─────────────────────────────────────
  const radialGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  radialGrad.addColorStop(0, hexToRgba(theme.primary, 0.25));
  radialGrad.addColorStop(0.4, hexToRgba(theme.primary, 0.12));
  radialGrad.addColorStop(0.7, hexToRgba(theme.primary, 0.05));
  radialGrad.addColorStop(1, theme.bg);
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Biome Lighting — Edge Vignette ─────────────────────────────────────────
  const vigGrad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  vigGrad.addColorStop(0, 'transparent');
  vigGrad.addColorStop(1, biomeProfile.lighting.edgeVignette);
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);

  // Add subtle linear overlay for depth
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, H);
  overlayGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  overlayGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
  overlayGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, W, H);

  // Grid lines (subtle)
  ctx.strokeStyle = hexToRgba(theme.primary, 0.05);
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ── Ambient Particles (biome-profile driven) ─────────────────────────────────
  const budget = biomeProfile.ambientParticleBudget;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < budget; i++) {
    const px = (Math.sin(i * 137.5 + 1) * 0.5 + 0.5) * W;
    const py = (Math.cos(i * 137.5 + 2) * 0.5 + 0.5) * H;
    const pr = 1 + (Math.sin(i * 97.3) * 0.5 + 0.5) * 3;
    const layer = biomeProfile.backgroundLayers[i % biomeProfile.backgroundLayers.length];
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha * 0.25;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Biome Transition Effect ──────────────────────────────────────────────────
  // Subtle biome-specific decorative overlay
  const transition = biomeProfile.transition;
  if (transition === 'void-fold') {
    // Void abyss — deep scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, y, W, 1);
    }
  } else if (transition === 'heat-haze') {
    // Ember depths — warm vignette
    const warmGrad = ctx.createRadialGradient(W / 2, H * 0.8, 0, W / 2, H * 0.8, H * 0.6);
    warmGrad.addColorStop(0, 'rgba(255, 80, 0, 0.06)');
    warmGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, W, H);
  } else if (transition === 'cryo-bloom') {
    // Frostbyte — cold highlights at edges
    ctx.fillStyle = 'rgba(56, 217, 255, 0.04)';
    ctx.fillRect(0, 0, W, 80);
    ctx.fillRect(0, H - 60, W, 60);
  } else if (transition === 'gold-flare') {
    // Golden — shimmer streak
    const shimmer = ctx.createLinearGradient(0, 0, W, H);
    shimmer.addColorStop(0, 'transparent');
    shimmer.addColorStop(0.4, 'rgba(255, 215, 0, 0.04)');
    shimmer.addColorStop(0.6, 'rgba(255, 215, 0, 0.04)');
    shimmer.addColorStop(1, 'transparent');
    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, W, H);
  }
  // 'glitch' — no extra effect (already has grid + radial gradient)

  // ── Decorative Border Using Biome Accent Color ───────────────────────────────
  const borderWidth = 4;
  const borderInset = 16;
  
  // Outer glow
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = hexToRgba(theme.primary, 0.3);
  ctx.lineWidth = borderWidth;
  roundRect(ctx, borderInset, borderInset, W - borderInset * 2, H - borderInset * 2, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner border
  ctx.strokeStyle = hexToRgba(theme.primary, 0.6);
  ctx.lineWidth = 2;
  roundRect(ctx, borderInset + 6, borderInset + 6, W - (borderInset + 6) * 2, H - (borderInset + 6) * 2, 10);
  ctx.stroke();

  // ── Header bar ───────────────────────────────────────────────────────────────
  ctx.fillStyle = hexToRgba(theme.primary, 0.2);
  ctx.fillRect(0, 0, W, 80);

  // BugSmasher logo text (more prominent)
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillStyle = theme.primary;
  ctx.textAlign = 'left';
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 15;
  ctx.fillText('BUGSMASHER', 50, 54);
  ctx.shadowBlur = 0;

  // HopeTheory branding (more visible with accent styling)
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'right';
  ctx.fillText('by HopeTheory', W - 50, 48);
  
  // Subtitle
  ctx.font = '11px "Courier New", monospace';
  ctx.fillStyle = hexToRgba(theme.primary, 0.7);
  ctx.fillText('A HOPE THEORY GAME', W - 50, 64);

  // Divider with gradient
  const dividerGrad = ctx.createLinearGradient(40, 0, W - 40, 0);
  dividerGrad.addColorStop(0, 'transparent');
  dividerGrad.addColorStop(0.2, theme.primary);
  dividerGrad.addColorStop(0.8, theme.primary);
  dividerGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.lineTo(W - 40, 80);
  ctx.stroke();

  // ── Score ──────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillStyle = hexToRgba(theme.primary, 0.8);
  ctx.fillText('FINAL SCORE', W / 2, 135);

  ctx.font = 'bold 96px "Courier New", monospace';
  ctx.fillStyle = theme.accent;
  // Enhanced glow
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 40;
  ctx.fillText(data.score.toLocaleString(), W / 2, 230);
  ctx.shadowBlur = 0;

  // ── Biome badge ──────────────────────────────────────────────────────────────
  const biome = BIOMES.find(b => b.id === data.biomeId) ?? BIOMES[0];
  const badgeW = 220;
  const badgeH = 36;
  const badgeX = (W - badgeW) / 2;
  const badgeY = 250;
  
  // Badge background with glow
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 15;
  ctx.fillStyle = hexToRgba(theme.primary, 0.25);
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.stroke();
  
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillStyle = theme.primary;
  ctx.textAlign = 'center';
  ctx.fillText(biome.name.toUpperCase(), W / 2, badgeY + 24);

  // ── Stats grid (more visually prominent) ────────────────────────────────────
  const stats = [
    { label: 'WAVE', value: String(data.waves) },
    { label: 'BUGS SMASHED', value: data.kills.toLocaleString() },
    { label: 'TIME', value: formatTime(data.playTimeSeconds) },
    ...(data.rank ? [{ label: 'RANK', value: `#${data.rank}` }] : []),
  ];

  const colW = W / (stats.length + 1);
  const statY = 340;
  const statBoxW = 180;
  const statBoxH = 90;

  stats.forEach((stat, i) => {
    const x = colW * (i + 0.5);
    const boxX = x - statBoxW / 2;
    
    // Stat box background
    ctx.fillStyle = hexToRgba(theme.primary, 0.1);
    roundRect(ctx, boxX, statY, statBoxW, statBoxH, 8);
    ctx.fill();
    
    // Stat box border
    ctx.strokeStyle = hexToRgba(theme.primary, 0.3);
    ctx.lineWidth = 1;
    roundRect(ctx, boxX, statY, statBoxW, statBoxH, 8);
    ctx.stroke();
    
    // Accent line at top of box
    ctx.fillStyle = theme.primary;
    roundRect(ctx, boxX + 20, statY, statBoxW - 40, 3, 2);
    ctx.fill();
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = hexToRgba(theme.primary, 0.8);
    ctx.fillText(stat.label, x, statY + 28);

    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 10;
    ctx.fillText(stat.value, x, statY + 72);
    ctx.shadowBlur = 0;
  });

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footerGrad = ctx.createLinearGradient(40, 0, W - 40, 0);
  footerGrad.addColorStop(0, 'transparent');
  footerGrad.addColorStop(0.3, hexToRgba(theme.primary, 0.3));
  footerGrad.addColorStop(0.7, hexToRgba(theme.primary, 0.3));
  footerGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = footerGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, H - 70);
  ctx.lineTo(W - 40, H - 70);
  ctx.stroke();

  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = hexToRgba(theme.primary, 0.6);
  ctx.textAlign = 'center';
  ctx.fillText('bugsmasher-ten.vercel.app', W / 2, H - 45);
  ctx.fillText('#BugSmasher #HighScore', W / 2, H - 25);

  // ── BugSmasher Watermark at bottom right ────────────────────────────────────
  ctx.save();
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillStyle = hexToRgba(theme.primary, 0.25);
  ctx.textAlign = 'right';
  ctx.translate(W - 30, H - 30);
  ctx.rotate(-Math.PI / 12); // Slight angle for subtle effect
  ctx.fillText('BUGSMASHER', 0, 0);
  ctx.restore();

  // ── Side accents ────────────────────────────────────────────────────────────
  // Left vertical bar with gradient
  const leftGrad = ctx.createLinearGradient(0, 0, 0, H);
  leftGrad.addColorStop(0, 'transparent');
  leftGrad.addColorStop(0.2, theme.primary);
  leftGrad.addColorStop(0.8, theme.primary);
  leftGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(24, 0, 4, H);

  // Right vertical bar
  ctx.fillRect(W - 28, 0, 4, H);

  // Corner glow dots (enhanced)
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(40, 40, 8, 0, Math.PI * 2);
  ctx.fillStyle = theme.primary;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(W - 40, 40, 8, 0, Math.PI * 2);
  ctx.fill();

  // Bottom corner dots
  ctx.beginPath();
  ctx.arc(40, H - 40, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(W - 40, H - 40, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate canvas blob'));
    }, 'image/png');
  });
}

/** Download the death card as a PNG file */
export async function downloadDeathCard(data: DeathCardData): Promise<void> {
  const blob = await generateDeathCardBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bugsmasher-death-card-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Share the death card via Web Share API (falls back to download) */
export async function shareDeathCard(data: DeathCardData): Promise<boolean> {
  const blob = await generateDeathCardBlob(data);
  const file = new File([blob], 'bugsmasher-death-card.png', { type: 'image/png' });

  const text = `I scored ${data.score.toLocaleString()} points and reached Wave ${data.waves} in BugSmasher by HopeTheory! #BugSmasher #HighScore`;

  // Try native share with image
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return true;
    } catch {
      // fall through
    }
  }

  // Try text-only share
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // fall through
    }
  }

  // Last resort: download
  await downloadDeathCard(data);
  return false;
}

// Helper: rounded rectangle path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
