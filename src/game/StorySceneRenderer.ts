// ============================================================================
// StorySceneRenderer.ts — Cinematic lore/cutscene overlay renderer
//
// Renders story scenes on top of the paused game canvas.
// Integrates with the existing GameEngine pause system.
//
// Cinematic effects supported via scene.effect:
//   - screen_flicker: white flash + scan distortion
//   - last_stand: red pulsing banner
//   - crystal_bonus: gold shimmer overlay
//   - screen_pulse: concentric ring pulse
//   - overseer_manifest: screen goes dark before reveal
//   - final_stand: red/black dramatic overlay
//   - rift_sealed: golden particle burst
//
// Animation enhancements (v2):
//   - Speaker name typewriter: speaker types out char-by-char with cursor
//   - Enhanced glitch: RGB split + random char substitution + displacement
//   - Scan line scroll: variable opacity with subtle flicker
// ============================================================================

import type { StoryScene } from './GamePhase';

export interface StorySceneRendererOptions {
  onComplete: () => void;   // called when scene is dismissed / auto-advances
  onSkip?: () => void;       // optional skip callback
}

const TYPEWRITER_SPEED = 40; // ms per character
const SPEAKER_TYPEWRITER_SPEED = 60; // ms per character for speaker name
const SLIDE_DURATION = 500; // ms for slide-up entrance
const FLICKER_DURATION = 800; // ms for screen flicker effect

// Glitch character pool for boss corruption effect
const GLITCH_CHARS = '█▓▒░╔╗╚╝║═╬╣╠╩╦┼─│┌┐└┘├┤┬┴▀▄■□▪▫●○◆◇★☆';

export class StorySceneRenderer {
  private scene: StoryScene;
  private options: StorySceneRendererOptions;
  private displayedText = '';
  private currentIndex = 0;
  private displayedSpeaker = '';
  private speakerIndex = 0;
  private speakerComplete = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private speakerTimer: ReturnType<typeof setInterval> | null = null;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;
  private completed = false;
  private startTime = 0;
  private fadeAlpha = 0; // 0 = invisible, 1 = fully visible
  private slideOffset = 0; // 0 = off-screen below, 1 = final position

  constructor(scene: StoryScene, options: StorySceneRendererOptions) {
    this.scene = scene;
    this.options = options;
    this.startTime = performance.now();
    this.beginTypewriter();
    this.beginSpeakerTypewriter();
    this.scheduleAutoAdvance();
  }

  // ── Speaker name typewriter ──────────────────────────────────────────────────

  private beginSpeakerTypewriter() {
    if (!this.scene.speaker) {
      this.speakerComplete = true;
      return;
    }
    const speakerName = this.scene.speaker;
    this.speakerTimer = setInterval(() => {
      if (this.speakerIndex < speakerName.length) {
        this.speakerIndex++;
        this.displayedSpeaker = speakerName.slice(0, this.speakerIndex);
      } else {
        this.speakerComplete = true;
        if (this.speakerTimer) {
          clearInterval(this.speakerTimer);
          this.speakerTimer = null;
        }
      }
    }, SPEAKER_TYPEWRITER_SPEED);
  }

  // ── Body text typewriter engine ──────────────────────────────────────────────

  private beginTypewriter() {
    this.timer = setInterval(() => {
      if (this.currentIndex < this.scene.body.length) {
        this.currentIndex++;
        this.displayedText = this.scene.body.slice(0, this.currentIndex);
      } else {
        this.finishTypewriter();
      }
    }, TYPEWRITER_SPEED);
  }

  private finishTypewriter() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.displayedText = this.scene.body;
    this.completed = true;
  }

  private scheduleAutoAdvance() {
    if (this.scene.autoAdvanceMs && this.scene.autoAdvanceMs > 0) {
      this.autoTimer = setTimeout(() => {
        this.options.onComplete();
      }, this.scene.autoAdvanceMs);
    }
  }

  // ── Input handling ───────────────────────────────────────────────────────────

  /** Skip to end of typewriter immediately */
  skipToEnd() {
    if (!this.completed) {
      this.finishTypewriter();
    }
  }

  /** Cleanup all timers — call when unmounting or changing scenes */
  cleanup() {
    if (this.timer) clearInterval(this.timer);
    if (this.speakerTimer) clearInterval(this.speakerTimer);
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.timer = null;
    this.speakerTimer = null;
    this.autoTimer = null;
  }

  handleClick() {
    if (!this.completed) {
      this.finishTypewriter();
    } else {
      this.cleanup();
      this.options.onComplete();
    }
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const now = performance.now();
    const elapsed = now - this.startTime;

    // Fade in (0-400ms)
    this.fadeAlpha = Math.min(1, elapsed / 400);

    // Slide-up entrance (0-500ms)
    const slideElapsed = elapsed - 100; // 100ms delay before sliding
    if (slideElapsed < SLIDE_DURATION) {
      const t = slideElapsed / SLIDE_DURATION;
      // Ease-out cubic
      this.slideOffset = 1 - Math.pow(1 - t, 3);
    } else {
      this.slideOffset = 1;
    }

    const a = this.fadeAlpha;
    const slideY = (1 - this.slideOffset) * 80; // Slide up from 80px below

    ctx.save();

    // ── Cinematic background effects ───────────────────────────────────────
    this.drawBackgroundEffect(ctx, width, height, elapsed, now);

    // ── Dark overlay ────────────────────────────────────────────────────────
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(0, 0, width, height);

    // ── Moving scanlines (variable opacity + flicker) ──────────────────────
    const scanFlicker = 0.7 + 0.3 * Math.sin(now * 0.01);
    ctx.globalAlpha = a * 0.05 * scanFlicker;
    const scanOffset = (now * 0.03) % 4;
    for (let y = -scanOffset; y < height; y += 4) {
      // Vary opacity per line for organic feel
      const lineAlpha = (y % 12 === 0) ? 1.0 : 0.4 + Math.sin(y * 0.5 + now * 0.002) * 0.3;
      ctx.globalAlpha = a * 0.05 * scanFlicker * lineAlpha;
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(0, y, width, 1);
    }

    // ── Panel — slide-up entrance ──────────────────────────────────────────
    ctx.globalAlpha = a * this.slideOffset;
    const panelW = Math.min(700, width - 48);
    const panelH = 340;
    const panelX = (width - panelW) / 2;
    const panelBaseY = (height - panelH) / 2;
    const panelY = panelBaseY + slideY;

    // Panel border glow
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Panel fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 16, 12, 0.92)';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // ── Title ──────────────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(this.scene.title, width / 2, panelY + 50);

    // ── Divider ────────────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 32, panelY + 72);
    ctx.lineTo(panelX + panelW - 32, panelY + 72);
    ctx.stroke();

    // ── Boss / Illustration badge — enhanced glitch ───────────────────────
    if (this.scene.illustration || this.scene.bossType) {
      const bossLabel: string = this.scene.bossType
        ? `@${this.scene.bossType.replace(/_/g, ' ').toUpperCase()}`
        : this.scene.illustration ?? '';

      // Enhanced glitch for overseer / convergence_queen
      const isLegendaryBoss = this.scene.bossType === 'overseer' || this.scene.bossType === 'convergence_queen';
      const glitchIntensity = isLegendaryBoss
        ? (0.6 + 0.4 * Math.sin(now * 0.008)) // Continuous oscillation for legendary bosses
        : 0;

      let glitchLabel = bossLabel;
      let glitchDisplaceX = 0;
      let glitchDisplaceY = 0;

      if (glitchIntensity > 0.3) {
        // Phase 1: Random character substitution
        glitchLabel = bossLabel.split('').map((c, i) => {
          if (Math.random() < glitchIntensity * 0.3) {
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
          if (Math.random() < glitchIntensity * 0.1 && i % 2 === 0) {
            return '?';
          }
          return c;
        }).join('');

        // Phase 2: Horizontal displacement
        glitchDisplaceX = (Math.random() - 0.5) * glitchIntensity * 6;
        glitchDisplaceY = (Math.random() - 0.5) * glitchIntensity * 3;
      }

      const badgeW = ctx.measureText(bossLabel).width + 32;
      const badgeX = (width - badgeW) / 2 + glitchDisplaceX;
      const badgeY = panelY + 76 + glitchDisplaceY;

      ctx.fillStyle = 'rgba(0, 255, 204, 0.08)';
      ctx.fillRect(badgeX, badgeY, badgeW, 20);
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeW, 20);

      // RGB split for legendary bosses
      if (isLegendaryBoss && glitchIntensity > 0.3) {
        const halfW = (ctx.measureText(glitchLabel).width + 32) / 2;
        const labelCenterX = width / 2;

        // Red channel offset left
        ctx.fillStyle = `rgba(255, 68, 102, ${glitchIntensity * 0.6})`;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(glitchLabel, labelCenterX - 2, badgeY + 14);

        // Blue channel offset right
        ctx.fillStyle = `rgba(68, 102, 255, ${glitchIntensity * 0.6})`;
        ctx.textAlign = 'left';
        ctx.fillText(glitchLabel, labelCenterX + 2, badgeY + 14);
      }

      // Main label color: red for Overseer/Queen, cyan for others
      ctx.fillStyle = isLegendaryBoss ? '#ff4466' : '#00ffcc';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(glitchLabel, width / 2, badgeY + 14);
      ctx.textAlign = 'left';
    }

    // ── Body text (typewriter) ─────────────────────────────────────────────
    ctx.fillStyle = '#e0f7f0';
    ctx.shadowColor = 'rgba(0, 255, 204, 0.3)';
    ctx.shadowBlur = 6;
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const bodyLines = this.wrapText(ctx, this.displayedText, panelW - 64);
    const lineHeight = 26;
    const bodyStartY = this.scene.bossType ? panelY + 130 : panelY + 100;

    bodyLines.forEach((line, i) => {
      ctx.fillText(line, panelX + 32, bodyStartY + i * lineHeight);
    });

    // ── Speaker (typewriter effect) ────────────────────────────────────────
    if (this.scene.speaker) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.scene.speakerColor ?? '#88ffcc';
      ctx.font = 'italic 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';

      const speakerText = `— ${this.displayedSpeaker}`;
      ctx.fillText(speakerText, panelX + panelW - 32, panelY + panelH - 24);

      // Speaker typing cursor
      if (!this.speakerComplete) {
        const cursorBlink = Math.sin(now / 120) > 0;
        if (cursorBlink) {
          const textW = ctx.measureText(speakerText).width;
          ctx.fillStyle = this.scene.speakerColor ?? '#88ffcc';
          ctx.fillRect(panelX + panelW - 32 + textW + 2, panelY + panelH - 24 - 12, 8, 14);
        }
      }
    }

    // ── Continue prompt ────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    if (this.completed) {
      const promptAlpha = 0.5 + 0.5 * Math.sin(now / 300);
      ctx.globalAlpha = a * promptAlpha * this.slideOffset;
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('[ CLICK TO CONTINUE ]', width / 2, panelY + panelH + 32);
    } else {
      // Typing cursor blink
      const cursorAlpha = Math.sin(now / 150) > 0 ? 1 : 0;
      ctx.globalAlpha = a * cursorAlpha * this.slideOffset;
      const lastLine = bodyLines[bodyLines.length - 1] ?? '';
      const cursorX = panelX + 32 + ctx.measureText(lastLine).width;
      const cursorY = bodyStartY + (bodyLines.length - 1) * lineHeight;
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(cursorX + 2, cursorY - 14, 10, 18);
    }

    ctx.restore();
  }

  // ── Cinematic background effects ─────────────────────────────────────────────

  private drawBackgroundEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number,
    now: number
  ) {
    const effect = this.scene.effect;

    if (!effect) return;

    switch (effect) {
      case 'screen_flicker': {
        const flickerPhase = Math.min(1, elapsed / FLICKER_DURATION);
        const flickerIntensity = Math.sin(elapsed / 50) * 0.5 + 0.5;
        if (flickerPhase < 1) {
          ctx.fillStyle = `rgba(255,255,255,${flickerIntensity * 0.15 * (1 - flickerPhase)})`;
          ctx.fillRect(0, 0, width, height);
          // Static noise strips
          if (Math.random() < 0.3) {
            const stripY = Math.random() * height;
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
            ctx.fillRect(0, stripY, width, 2 + Math.random() * 8);
          }
        }
        break;
      }

      case 'screen_pulse': {
        const pulse = Math.sin(elapsed / 400) * 0.5 + 0.5;
        const radius = 50 + elapsed * 0.3;
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius);
        gradient.addColorStop(0, `rgba(0,255,204,${pulse * 0.08})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'last_stand': {
        // Red pulsing top banner
        const pulse = Math.sin(elapsed / 250) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,0,0,${pulse * 0.12})`;
        ctx.fillRect(0, 0, width, 60);
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = pulse * 0.9;
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!! LAST STAND PROTOCOL ACTIVE !!', width / 2, 38);
        break;
      }

      case 'crystal_bonus': {
        // Gold shimmer overlay
        const shimmer = Math.sin(elapsed / 300) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255,215,0,${shimmer * 0.06})`;
        ctx.fillRect(0, 0, width, height);
        // Crystal particles floating
        const numParticles = 12;
        for (let i = 0; i < numParticles; i++) {
          const px = ((now * 0.02 + i * (width / numParticles)) % width);
          const py = ((height - elapsed * 0.05 * (i % 3 + 1)) % height);
          ctx.fillStyle = `rgba(255,215,0,${shimmer * 0.8})`;
          ctx.beginPath();
          ctx.moveTo(px, py - 4);
          ctx.lineTo(px + 3, py);
          ctx.lineTo(px, py + 4);
          ctx.lineTo(px - 3, py);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'overseer_manifest': {
        // Darken progressively then flash
        const darken = Math.min(1, elapsed / 1500);
        const flashPhase = elapsed > 1500 && elapsed < 2200;
        const flashIntensity = flashPhase ? Math.sin((elapsed - 1500) / 100) * 0.8 : 0;
        ctx.fillStyle = `rgba(0,0,0,${darken * 0.95})`;
        ctx.fillRect(0, 0, width, height);
        if (flashPhase) {
          ctx.fillStyle = `rgba(255,68,102,${flashIntensity})`;
          ctx.fillRect(0, 0, width, height);
        }
        // Overseer silhouette (when manifest starts)
        if (elapsed > 2000) {
          const progress = Math.min(1, (elapsed - 2000) / 1000);
          ctx.save();
          ctx.globalAlpha = progress * 0.7;
          ctx.fillStyle = '#ff4466';
          // Draw crystalline humanoid silhouette
          const cx = width / 2;
          const cy = height / 2;
          // Head
          ctx.beginPath();
          ctx.arc(cx, cy - 80, 20, 0, Math.PI * 2);
          ctx.fill();
          // Body
          ctx.fillRect(cx - 15, cy - 60, 30, 60);
          // Arms
          ctx.fillRect(cx - 45, cy - 50, 30, 10);
          ctx.fillRect(cx + 15, cy - 50, 30, 10);
          // Legs
          ctx.fillRect(cx - 12, cy, 10, 40);
          ctx.fillRect(cx + 2, cy, 10, 40);
          ctx.restore();
        }
        break;
      }

      case 'final_stand': {
        // Red/black dramatic
        const t = Math.sin(elapsed / 500) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(139,0,0,${t * 0.3})`;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'rift_sealed': {
        // Golden victory glow
        const t = Math.sin(elapsed / 400) * 0.5 + 0.5;
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, `rgba(255,215,0,${t * 0.2})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
      }
    }
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const paragraphs = text.split('\n');
    const lines: string[] = [];
    for (const para of paragraphs) {
      const words = para.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      if (para !== paragraphs[paragraphs.length - 1]) lines.push('');
    }
    return lines;
  }

  isActive(): boolean {
    return true; // Renderer manages its own lifecycle
  }
}
