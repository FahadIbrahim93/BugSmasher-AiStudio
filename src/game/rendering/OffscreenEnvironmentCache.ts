import { GameEngine } from '../GameEngine';

type CacheCanvas = OffscreenCanvas | HTMLCanvasElement;
type CacheContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface CanvasLayer {
  canvas: CacheCanvas;
  ctx: CacheContext;
  width: number;
  height: number;
}

interface PeriodicLayer extends CanvasLayer {
  lastRedraw: number;
  interval: number;
}

/**
 * Caches static and semi-static environment layers to offscreen canvases.
 * Static and periodic layers deliberately use separate backing canvases; sharing one
 * canvas corrupts the static cache after a periodic redraw.
 */
export class OffscreenEnvironmentCache {
  private staticLayer: CanvasLayer | null = null;
  private staticCacheKey = '';
  private periodicLayers = new Map<string, PeriodicLayer>();

  // Separate canvas for scanlines (fully static between resizes)
  private scanlineCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private scanlineCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private scanlineKey = '';

  invalidate(): void {
    this.staticCacheKey = '';
    this.staticLayer = null;
    this.scanlineKey = '';
    this.periodicLayers.clear();
  }

  private createLayer(width: number, height: number): CanvasLayer | null {
    let canvas: CacheCanvas;
    let ctx: CacheContext | null;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
    }

    return ctx ? { canvas, ctx, width, height } : null;
  }

  private ensureStaticLayer(width: number, height: number): CanvasLayer | null {
    if (!this.staticLayer || this.staticLayer.width !== width || this.staticLayer.height !== height) {
      this.staticLayer = this.createLayer(width, height);
      this.staticCacheKey = '';
    }
    return this.staticLayer;
  }

  private ensurePeriodicLayer(key: string, width: number, height: number, intervalMs: number): PeriodicLayer | null {
    const existing = this.periodicLayers.get(key);
    if (existing && existing.width === width && existing.height === height) {
      existing.interval = intervalMs;
      return existing;
    }

    const created = this.createLayer(width, height);
    if (!created) return null;

    const layer: PeriodicLayer = {
      ...created,
      lastRedraw: 0,
      interval: intervalMs,
    };
    this.periodicLayers.set(key, layer);
    return layer;
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
    const layer = this.ensureStaticLayer(engine.width, engine.height);
    if (!layer) return false;

    if (this.staticCacheKey !== key) {
      layer.ctx.clearRect(0, 0, engine.width, engine.height);
      drawStatic(layer.ctx);
      this.staticCacheKey = key;
    }

    engine.ctx.drawImage(layer.canvas as CanvasImageSource, 0, 0);
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
    const layer = this.ensurePeriodicLayer(key, engine.width, engine.height, intervalMs);
    if (!layer) return;

    const now = performance.now();
    if (layer.lastRedraw === 0 || (now - layer.lastRedraw) >= layer.interval) {
      layer.ctx.clearRect(0, 0, engine.width, engine.height);
      drawAnimated(layer.ctx, engine.globalTime);
      layer.lastRedraw = now;
    }

    engine.ctx.drawImage(layer.canvas as CanvasImageSource, 0, 0);
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
    for (let y = 0; y < height; y += lineSpacing) {
      this.scanlineCtx.fillRect(0, y, width, 1);
    }

    this.scanlineKey = key;
    engine.ctx.drawImage(this.scanlineCanvas as CanvasImageSource, 0, 0);
    return true;
  }
}
