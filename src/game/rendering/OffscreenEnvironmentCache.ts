import { GameEngine } from '../GameEngine';

interface PeriodicCache {
  lastRedraw: number;
  interval: number;
}

/**
 * Caches static and semi-static environment layers to an offscreen canvas.
 * Handles:
 * - Fully static layers (grid, starfield) — drawn once, blitted every frame
 * - Periodic layers (lava bubbles, snowflakes) — redrawn every N ms, blitted in between
 * - Static overlays (scanlines, CRT) — drawn once per resize
 */
export class OffscreenEnvironmentCache {
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  
  // Separate cache keys for static vs periodic layers (they use the same offscreen canvas)
  private staticCacheKey = '';
  private periodicKeys = new Map<string, PeriodicCache>();

  // Separate canvas for scanlines (fully static between resizes)
  private scanlineCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private scanlineCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private scanlineKey = '';

  invalidate(): void {
    this.staticCacheKey = '';
    this.scanlineKey = '';
    this.periodicKeys.clear();
  }

  private ensureCanvas(width: number, height: number): boolean {
    if (typeof OffscreenCanvas !== 'undefined') {
      if (!this.canvas || (this.canvas as OffscreenCanvas).width !== width) {
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
      }
      return !!this.ctx;
    }
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    const c = this.canvas as HTMLCanvasElement;
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
      this.ctx = c.getContext('2d');
    }
    return !!this.ctx;
  }

  /**
   * Renders static layer if cache miss; returns true if blit was performed.
   */
  blitStaticLayer(
    engine: GameEngine,
    layerKey: string,
    drawStatic: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void
  ): boolean {
    const key = `${layerKey}:${engine.width}x${engine.height}`;
    if (!this.ensureCanvas(engine.width, engine.height) || !this.ctx) return false;

    if (this.staticCacheKey !== key) {
      this.ctx.clearRect(0, 0, engine.width, engine.height);
      drawStatic(this.ctx);
      this.staticCacheKey = key;
    }

    engine.ctx.drawImage(this.canvas as CanvasImageSource, 0, 0);
    return true;
  }

  /**
   * Blits a layer that redraws periodically (e.g. animated backgrounds like lava/snow).
   * The draw function is called every `intervalMs` milliseconds instead of every frame.
   */
  blitPeriodicLayer(
    engine: GameEngine,
    layerKey: string,
    intervalMs: number,
    drawAnimated: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, time: number) => void
  ): void {
    const key = `${layerKey}:${engine.width}x${engine.height}`;
    if (!this.ensureCanvas(engine.width, engine.height) || !this.ctx) return;

    const now = performance.now();
    let cache = this.periodicKeys.get(key);

    if (!cache) {
      cache = { lastRedraw: 0, interval: intervalMs };
      this.periodicKeys.set(key, cache);
    }

    // Redraw on resize or when interval has elapsed (uses own key, not shared cacheKey)
    if (this.periodicKeys.get(key)!.lastRedraw === 0 || (now - cache.lastRedraw) >= cache.interval) {
      this.ctx.clearRect(0, 0, engine.width, engine.height);
      drawAnimated(this.ctx, engine.globalTime);
      cache.lastRedraw = now;
    }

    engine.ctx.drawImage(this.canvas as CanvasImageSource, 0, 0);
  }

  /**
   * Caches a fully static overlay (scanlines, CRT pattern) to a dedicated canvas.
   * Redraws only on dimension change.
   */
  blitScanlines(
    engine: GameEngine,
    lineSpacing: number,
    color: string
  ): boolean {
    const width = engine.width;
    const height = engine.height;
    const key = `${width}x${height}_s${lineSpacing}_${color}`;

    if (this.scanlineKey === key && this.scanlineCanvas) {
      engine.ctx.drawImage(this.scanlineCanvas as CanvasImageSource, 0, 0);
      return true;
    }

    // Create or resize scanline canvas
    if (typeof OffscreenCanvas !== 'undefined') {
      this.scanlineCanvas = new OffscreenCanvas(width, height);
      this.scanlineCtx = this.scanlineCanvas.getContext('2d');
    } else {
      if (!this.scanlineCanvas) {
        this.scanlineCanvas = document.createElement('canvas');
      }
      const c = this.scanlineCanvas as HTMLCanvasElement;
      c.width = width;
      c.height = height;
      this.scanlineCtx = c.getContext('2d');
    }

    if (!this.scanlineCtx) return false;

    this.scanlineCtx.fillStyle = color;
    for (let i = 0; i < height; i += lineSpacing) {
      this.scanlineCtx.fillRect(0, i, width, 1);
    }

    this.scanlineKey = key;
    engine.ctx.drawImage(this.scanlineCanvas as CanvasImageSource, 0, 0);
    return true;
  }
}