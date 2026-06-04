/**
 * Loads optional WAV assets from /audio/*. Falls back to synthesis in SoundManager.
 */
export type SfxId =
  | 'shoot'
  | 'splat'
  | 'ui_click'
  | 'ui_hover'
  | 'powerup'
  | 'hit_base'
  | 'boss_warning';

const PATHS: Record<SfxId, string> = {
  shoot: '/audio/shoot.wav',
  splat: '/audio/splat.wav',
  ui_click: '/audio/ui_click.wav',
  ui_hover: '/audio/ui_hover.wav',
  powerup: '/audio/powerup.wav',
  hit_base: '/audio/hit_base.wav',
  boss_warning: '/audio/boss_warning.wav',
};

export class AudioAssetLoader {
  private buffers = new Map<SfxId, AudioBuffer>();
  private preFetched = new Map<SfxId, ArrayBuffer>();
  private ctx: AudioContext | null = null;
  private loadPromise: Promise<void> | null = null;
  private prefetchPromise: Promise<void> | null = null;

  /**
   * Pre-fetch audio files into ArrayBuffers as early as possible,
   * before the AudioContext is created. Call this on app startup
   * (e.g., from Preloader) to eliminate cold-load latency.
   */
  async prefetch(): Promise<void> {
    if (this.prefetchPromise) return this.prefetchPromise;
    this.prefetchPromise = Promise.all(
      (Object.keys(PATHS) as SfxId[]).map(async (id) => {
        try {
          const res = await fetch(PATHS[id]);
          if (!res.ok) return;
          const ab = await res.arrayBuffer();
          this.preFetched.set(id, ab);
        } catch {
          /* file may not exist on first load; synthesis fallback applies later */
        }
      })
    ).then(() => {});
    return this.prefetchPromise;
  }

  get isPreFetched(): boolean {
    return this.prefetchPromise !== null;
  }

  async init(ctx: AudioContext): Promise<void> {
    this.ctx = ctx;
    if (!this.loadPromise) {
      this.loadPromise = this.loadAll();
    }
    await this.loadPromise;
  }

  private async loadAll(): Promise<void> {
    if (!this.ctx) return;
    await Promise.all(
      (Object.keys(PATHS) as SfxId[]).map(async (id) => {
        try {
          // Use pre-fetched ArrayBuffer if available, otherwise fetch now
          let ab = this.preFetched.get(id);
          if (!ab) {
            const res = await fetch(PATHS[id]);
            if (!res.ok) return;
            ab = await res.arrayBuffer();
          }
          const buf = await this.ctx!.decodeAudioData(ab.slice(0));
          this.buffers.set(id, buf);
        } catch {
          /* synthesis fallback */
        }
      })
    );
    // Release pre-fetched data to free memory
    this.preFetched.clear();
  }

  has(id: SfxId): boolean {
    return this.buffers.has(id);
  }

  play(id: SfxId, dest: AudioNode, volume = 1, playbackRate = 1): boolean {
    if (!this.ctx || !this.buffers.has(id)) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(id)!;
    src.playbackRate.value = playbackRate;
    const g = this.ctx.createGain();
    g.gain.value = volume;
    src.connect(g);
    g.connect(dest);
    src.start();
    return true;
  }
}

export const audioAssets = new AudioAssetLoader();