// @ts-nocheck
/**
 * SoundEffects — procedural SFX synthesis and the oscillator budget.
 * Split out of SoundManager (A-07): audio / voice / music. Hosted by the
 * SoundManager facade, which owns the AudioContext, buses, noise buffer,
 * and volume settings.
 */

import { audioAssets } from './AudioAssetLoader';

// ─── Sound Effects (hosted by SoundManager facade) ──────────────────────

export class SoundEffects {
  host: {
    ctx: AudioContext | null;
    enabled: boolean;
    sfxGain: GainNode | null;
    musicGain: GainNode | null;
    noiseBuffer: AudioBuffer | null;
    sfxVolume: number;
  };

  // SFX burst protection (P0 benchmark): cap synthesis node allocation per 100ms window
  private static readonly OSC_BUDGET_PER_WINDOW = 48;
  private static readonly OSC_WINDOW_MS = 100;
  private oscWindowStart = 0;
  private oscSpawnsInWindow = 0;
  private totalOscillatorSpawns = 0;
  private throttledSfxEvents = 0;

  constructor(host: { ctx: AudioContext | null; enabled: boolean; sfxGain: GainNode | null; musicGain: GainNode | null; noiseBuffer: AudioBuffer | null; sfxVolume: number }) {
    this.host = host;
  }

  // ─── Advanced Synthesis Utilities ──────────────────────────────────

  /** Create a rich tone with multiple oscillator layers and effects */
  private playRichTone(
    config: {
      frequencies: number[];
      types: OscillatorType[];
      durations: number[];
      volumes: number[];
      slideTo?: number[];
      filterFreq?: number;
      filterType?: BiquadFilterType;
      filterQ?: number;
    },
    isMusic = false
  ): { oscillators: OscillatorNode[] } {
    if (!this.host.enabled || !this.host.ctx || !this.host.sfxGain || !this.host.musicGain) return { oscillators: [] };

    const targetGain = isMusic ? this.host.musicGain : this.host.sfxGain;
    const oscs: OscillatorNode[] = [];
    const count = Math.min(config.frequencies.length, config.types.length, config.durations.length, config.volumes.length);

    for (let i = 0; i < count; i++) {
      try {
        if (!this.canSpawnOscillator()) break;
        const osc = this.host.ctx.createOscillator();
        const gain = this.host.ctx.createGain();
        const filter = this.host.ctx.createBiquadFilter();

        osc.type = config.types[i];
        osc.frequency.setValueAtTime(config.frequencies[i], this.host.ctx.currentTime);

        if (config.slideTo && i < config.slideTo.length) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(20, config.slideTo[i]),
            this.host.ctx.currentTime + config.durations[i]
          );
        }

        filter.type = config.filterType || 'lowpass';
        filter.frequency.setValueAtTime(config.filterFreq || 20000, this.host.ctx.currentTime);
        if (config.filterQ) {
          filter.Q.setValueAtTime(config.filterQ, this.host.ctx.currentTime);
        }
        // Auto filter sweep
        if (config.filterFreq && config.filterFreq < 20000) {
          filter.frequency.exponentialRampToValueAtTime(
            20, this.host.ctx.currentTime + config.durations[i]
          );
        }

        gain.gain.setValueAtTime(config.volumes[i], this.host.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.host.ctx.currentTime + config.durations[i]);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);

        osc.start();
        osc.stop(this.host.ctx.currentTime + config.durations[i]);
        oscs.push(osc);
    } catch {
      // Silently skip failed oscillators
    }
    }

    return { oscillators: oscs };
  }

  /** Create a shaped noise burst with filter envelope */
  private playShapedNoise(
    duration: number,
    volume: number,
    filterStart = 2000,
    filterEnd = 20,
    filterType: BiquadFilterType = 'lowpass'
  ) {
    if (!this.host.enabled || !this.host.ctx || !this.host.sfxGain || !this.host.noiseBuffer) return;

    try {
      const source = this.host.ctx.createBufferSource();
      const gain = this.host.ctx.createGain();
      const filter = this.host.ctx.createBiquadFilter();
      const filter2 = this.host.ctx.createBiquadFilter();

      source.buffer = this.host.noiseBuffer;

      filter.type = filterType;
      filter.frequency.setValueAtTime(filterStart, this.host.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(filterEnd, this.host.ctx.currentTime + duration);

      // Secondary filter for resonance
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(filterStart * 0.5, this.host.ctx.currentTime);
      filter2.Q.setValueAtTime(1.5, this.host.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.host.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.host.ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(filter2);
      filter2.connect(gain);
      gain.connect(this.host.sfxGain);

      source.start();
      source.stop(this.host.ctx.currentTime + duration);
    } catch { /* ignore */ }
  }

  /** Apply amplitude modulation to create rich textures */
  private playModulatedTone(
    freq: number,
    modFreq: number,
    type: OscillatorType,
    duration: number,
    volume = 0.1
  ) {
    if (!this.host.enabled || !this.host.ctx || !this.host.sfxGain) return;

    try {
      if (!this.canSpawnOscillator()) return;
      const carrier = this.host.ctx.createOscillator();
      if (!this.canSpawnOscillator()) return;
      const modulator = this.host.ctx.createOscillator();
      const modGain = this.host.ctx.createGain();
      const gain = this.host.ctx.createGain();

      carrier.type = type;
      carrier.frequency.setValueAtTime(freq, this.host.ctx.currentTime);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, this.host.ctx.currentTime);
      modGain.gain.setValueAtTime(0.5, this.host.ctx.currentTime);

      // Modulator modulates carrier amplitude
      modulator.connect(modGain);
      modGain.connect(gain.gain);

      gain.gain.setValueAtTime(volume, this.host.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.host.ctx.currentTime + duration);

      carrier.connect(gain);
      gain.connect(this.host.sfxGain);

      carrier.start();
      modulator.start();
      carrier.stop(this.host.ctx.currentTime + duration);
      modulator.stop(this.host.ctx.currentTime + duration);
    } catch { /* ignore */ }
  }

  /** Generate a subsonic bass hit with impact transient */
  private playImpact(
    freq = 60,
    duration = 0.5,
    volume = 0.3,
    punch = true
  ) {
    if (!this.host.enabled || !this.host.ctx || !this.host.sfxGain) return;

    try {
      if (!this.canSpawnOscillator()) return;
      // Sub bass layer
      const sub = this.host.ctx.createOscillator();
      const subGain = this.host.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq, this.host.ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(20, this.host.ctx.currentTime + duration);
      subGain.gain.setValueAtTime(volume, this.host.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.host.ctx.currentTime + duration);
      sub.connect(subGain);
      subGain.connect(this.host.sfxGain);
      sub.start();
      sub.stop(this.host.ctx.currentTime + duration);

      if (punch) {
        if (!this.canSpawnOscillator()) return;
        // Transient click for impact
        const trans = this.host.ctx.createOscillator();
        const transGain = this.host.ctx.createGain();
        trans.type = 'square';
        trans.frequency.setValueAtTime(200, this.host.ctx.currentTime);
        trans.frequency.exponentialRampToValueAtTime(20, this.host.ctx.currentTime + 0.05);
        transGain.gain.setValueAtTime(volume * 0.5, this.host.ctx.currentTime);
        transGain.gain.exponentialRampToValueAtTime(0.001, this.host.ctx.currentTime + 0.05);
        trans.connect(transGain);
        transGain.connect(this.host.sfxGain);
        trans.start();
        trans.stop(this.host.ctx.currentTime + 0.05);

        // Noise burst
        this.playShapedNoise(0.08, volume * 0.3, 5000, 50, 'lowpass');
      }
    } catch { /* ignore */ }
  }

  /** Play a musical note with harmonics for richer tone */
  private playNote(
    baseFreq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    harmonics: number[] = [1, 2, 3],
    harmonicVolumes: number[] = [1, 0.3, 0.15],
    isMusic = false
  ) {
    return this.playRichTone({
      frequencies: harmonics.map((h, _i) => baseFreq * h),
      types: harmonics.map(() => type),
      durations: harmonics.map(() => duration),
      volumes: harmonics.map((_, _i) => volume * (harmonicVolumes[_i] || 0.1)),
      slideTo: undefined,
      filterFreq: baseFreq * 8,
      filterType: 'lowpass',
    }, isMusic);
  }

  // ─── Audio Load Budget & A11y ─────────────────────────────────────

  /**
   * Cap synthesis node allocation per 100ms window so dense SFX bursts
   * (swarmer swarms, rapid-fire, nuke chain reactions) can never drop
   * frames on mid-tier mobile (P0 benchmark requirement).
   *
   * NOTE: SFX-only — the adaptive music engine (MusicSystem.playBiomeMusic)
   * creates its oscillators directly via ctx.createOscillator() and
   * intentionally bypasses this throttle so continuous music is never
   * burst-capped.
   */
  private canSpawnOscillator(): boolean {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.oscWindowStart > SoundEffects.OSC_WINDOW_MS) {
      this.oscWindowStart = now;
      this.oscSpawnsInWindow = 0;
    }
    if (this.oscSpawnsInWindow >= SoundEffects.OSC_BUDGET_PER_WINDOW) {
      this.throttledSfxEvents++;
      return false;
    }
    this.oscSpawnsInWindow++;
    this.totalOscillatorSpawns++;
    return true;
  }

  /**
   * Measurable audio-load telemetry for the P0 benchmark (no frame drops from
   * audio). Consumed by tests and by the HUD SYS_DIAGNOSTICS overlay
   * (see src/components/HUD.tsx) which surfaces audio pressure during gameplay.
   */
  getAudioStats() {
    return {
      oscillatorsSpawned: this.totalOscillatorSpawns,
      throttledEvents: this.throttledSfxEvents,
      budgetPerWindow: SoundEffects.OSC_BUDGET_PER_WINDOW,
    };
  }

  // ─── SFX Methods ──────────────────────────────────────────────────

  shoot() {
    if (this.host.ctx && this.host.sfxGain && audioAssets.play('shoot', this.host.sfxGain, this.host.sfxVolume * 0.5))
      return;
    // Visceral damp "thwack" of a heavy wet smash
    // High impact decay click
    this.playImpact(100, 0.12, 0.4, true);
    // Lower frequency blunt body sound (decays quickly)
    this.playRichTone({
      frequencies: [140, 90],
      types: ['triangle', 'sine'],
      durations: [0.08, 0.12],
      volumes: [0.15, 0.08],
      slideTo: [50, 40],
      filterFreq: 800,
      filterType: 'lowpass',
    });
    // Tiny wet release noise
    this.playShapedNoise(0.08, 0.03, 300, 10, 'lowpass');
  }

  splat(bugType?: string) {
    if (this.host.ctx && this.host.sfxGain) {
      // Vary playback rate dynamically for extra organic crunchiness
      let rate: number;
      if (bugType === 'swarmer' || bugType === 'mini') {
        rate = 1.35 + Math.random() * 0.2; // faster, higher popping sounds
      } else if (bugType === 'tank' || bugType === 'beetle') {
        rate = 0.72 + Math.random() * 0.1; // heavier, chunkier wet impact
      } else if (bugType === 'boss') {
        rate = 0.55 + Math.random() * 0.05; // extremely low-pitched structural explosion
      } else if (bugType === 'healer') {
        rate = 1.1 + Math.random() * 0.15; // fluid bubble pop
      } else {
        rate = 0.9 + Math.random() * 0.25; // normal variation 
      }
      
      if (audioAssets.play('splat', this.host.sfxGain, this.host.sfxVolume * 0.6, rate)) {
        // Organic WAV asset successfully loaded and played. 
        // No metallic or synth overlays are injected, allowing pristine, juicy sound.
        return;
      }
    }

    // Procedural synthesis fallback (completely rewritten to be purely organic/noise-based if WAV is missing)
    if (bugType === 'swarmer' || bugType === 'mini') {
      // Organic wet biological pop using filtered noise & extremely fast low-end thud
      this.playShapedNoise(0.08, 0.04, 1800, 80, 'bandpass');
      this.playShapedNoise(0.12, 0.08, 600, 30, 'lowpass');
      // Bass core body (short sine)
      this.playRichTone({
        frequencies: [120],
        types: ['sine'],
        durations: [0.06],
        volumes: [0.12],
        slideTo: undefined,
        filterFreq: 300,
        filterType: 'lowpass'
      });

    } else if (bugType === 'healer') {
      // Fluid medicine sac rupture (pulsing gas decompression + heavy wet decay)
      this.playShapedNoise(0.18, 0.12, 1000, 40, 'bandpass');
      this.playShapedNoise(0.24, 0.18, 450, 15, 'lowpass');
      this.playRichTone({
        frequencies: [90, 150],
        types: ['sine', 'triangle'],
        durations: [0.12, 0.08],
        volumes: [0.15, 0.08],
        slideTo: undefined,
        filterFreq: 500,
        filterType: 'lowpass'
      });

    } else if (bugType === 'tank' || bugType === 'beetle') {
      // Mighty wet crunch & chitin shatter
      this.playImpact(55, 0.25, 0.5, true);
      this.playShapedNoise(0.25, 0.2, 280, 20, 'lowpass');
      this.playShapedNoise(0.15, 0.08, 1200, 100, 'bandpass');
      this.playRichTone({
        frequencies: [85, 55],
        types: ['sine', 'triangle'],
        durations: [0.18, 0.25],
        volumes: [0.18, 0.1],
        slideTo: undefined,
        filterFreq: 400,
        filterType: 'lowpass'
      });

    } else if (bugType === 'boss') {
      // Colossal wet biological collapse / massive organic squelch explosion
      this.playImpact(45, 0.6, 0.8, true);
      this.playShapedNoise(0.55, 0.35, 800, 15, 'lowpass');
      this.playShapedNoise(0.35, 0.2, 1500, 60, 'bandpass');
      this.playRichTone({
        frequencies: [70, 50, 90],
        types: ['sine', 'triangle', 'sine'],
        durations: [0.4, 0.5, 0.3],
        volumes: [0.22, 0.15, 0.1],
        slideTo: undefined,
        filterFreq: 300,
        filterType: 'lowpass'
      });

    } else {
      // General scout/other bug squishy pop falling back to organic noises
      this.playShapedNoise(0.12, 0.08, 1500, 50, 'bandpass');
      this.playShapedNoise(0.22, 0.15, 450, 20, 'lowpass');
      this.playRichTone({
        frequencies: [140, 90],
        types: ['sine', 'triangle'],
        durations: [0.08, 0.12],
        volumes: [0.12, 0.06],
        slideTo: undefined,
        filterFreq: 600,
        filterType: 'lowpass'
      });
    }
  }

  hitBase() {
    // Wet heavy splash/crash on the core base structure
    this.playImpact(60, 0.5, 0.4, true);
    this.playShapedNoise(0.4, 0.15, 600, 10, 'lowpass');
    this.playRichTone({
      frequencies: [120, 220],
      types: ['sawtooth', 'triangle'],
      durations: [0.25, 0.35],
      volumes: [0.12, 0.06],
      slideTo: [30, 60],
      filterFreq: 800,
      filterType: 'lowpass',
    });
  }

  powerup(type?: string) {
    if (type === 'shield') {
      // Sci-fi shield hum
      this.playRichTone({
        frequencies: [200, 400, 800],
        types: ['sine', 'triangle', 'sine'],
        durations: [0.3, 0.4, 0.6],
        volumes: [0.08, 0.05, 0.03],
        slideTo: [800, 1200, 1600],
        filterFreq: 4000,
      });
    } else if (type === 'rapid_fire') {
      // Machine gun spin up
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.04;
        setTimeout(() => {
          this.playRichTone({
            frequencies: [400 + i * 200, 800 + i * 300],
            types: ['square', 'sawtooth'],
            durations: [0.03, 0.05],
            volumes: [0.04, 0.02],
            slideTo: [200 + i * 100, 400 + i * 200],
            filterFreq: 4000 + i * 1000,
            filterType: 'highpass',
          });
        }, delay * 1000);
      }
    } else if (type === 'multiplier') {
      // Ascending arpeggio with sparkle
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playNote(freq, 'triangle', 0.2, 0.06, [1, 3, 5], [1, 0.2, 0.1]);
        }, i * 80);
      });
      // Sparkly top
      setTimeout(() => {
        this.playRichTone({
          frequencies: [1568, 2093],
          types: ['sine', 'sine'],
          durations: [0.4, 0.3],
          volumes: [0.04, 0.02],
          slideTo: [2093, 2637],
          filterFreq: 8000,
          filterType: 'highpass',
        });
      }, 320);
    } else if (type === 'slow_mo') {
      // Descending time vortex
      this.playRichTone({
        frequencies: [600, 400, 200, 100],
        types: ['triangle', 'sawtooth', 'sine', 'sine'],
        durations: [0.2, 0.3, 0.5, 0.8],
        volumes: [0.06, 0.04, 0.03, 0.02],
        slideTo: [200, 100, 50, 20],
        filterFreq: 3000,
      });
      this.playShapedNoise(0.6, 0.04, 2000, 10, 'lowpass');
    } else if (type === 'overdrive') {
      // Overdrive power surge
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          this.playRichTone({
            frequencies: [100 + i * 80, 200 + i * 100, 300 + i * 120],
            types: ['sawtooth', 'square', 'sine'],
            durations: [0.08, 0.1, 0.12],
            volumes: [0.05, 0.03, 0.02],
            slideTo: [200 + i * 120, 400 + i * 150, 600 + i * 200],
            filterFreq: 3000 + i * 500,
            filterType: 'highpass',
          });
        }, i * 40);
      }
    } else {
      // Default powerup: classic ascending tone
      this.playNote(440, 'triangle', 0.15, 0.08);
      setTimeout(() => this.playNote(660, 'triangle', 0.2, 0.06), 80);
      setTimeout(() => this.playNote(880, 'sine', 0.3, 0.05, [1, 2], [1, 0.3]), 160);
    }
  }

  resource(type: string) {
    switch(type) {
      case 'scrap':
        // Metallic ping
        this.playRichTone({
          frequencies: [1200, 1800],
          types: ['triangle', 'sine'],
          durations: [0.05, 0.08],
          volumes: [0.03, 0.015],
          slideTo: [1800, 2400],
          filterFreq: 6000,
          filterType: 'bandpass',
          filterQ: 8,
        });
        break;
      case 'plasma':
        // Energy crackle
        this.playRichTone({
          frequencies: [800, 1200],
          types: ['sine', 'triangle'],
          durations: [0.1, 0.15],
          volumes: [0.04, 0.02],
          slideTo: [1200, 1600],
        });
        this.playShapedNoise(0.08, 0.02, 3000, 500, 'bandpass');
        break;
      case 'alloy':
        // Heavy clank
        this.playImpact(200, 0.12, 0.06, true);
        break;
      case 'flux':
        // Ethereal shimmer
        this.playRichTone({
          frequencies: [1500, 2000, 2500],
          types: ['sine', 'triangle', 'sine'],
          durations: [0.15, 0.2, 0.25],
          volumes: [0.04, 0.02, 0.01],
          slideTo: [500, 800, 1000],
          filterFreq: 4000,
        });
        break;
      case 'neural_core':
        // Legendary chime - slow, resonant, layered
        this.playNote(300, 'sine', 0.4, 0.06, [1, 2, 3, 5], [1, 0.5, 0.3, 0.15]);
        setTimeout(() => this.playNote(450, 'sine', 0.5, 0.04, [1, 2, 3], [1, 0.4, 0.2]), 200);
        setTimeout(() => this.playNote(600, 'triangle', 0.6, 0.03, [1, 3], [1, 0.3]), 400);
        break;
      default:
        this.uiHover();
    }
  }

  bossHit() {
    // Heavy armor-breaking shell crack sound
    // Initial high-impact snap
    this.playImpact(120, 0.2, 0.45, true);
    // Heavy crunch noise
    this.playShapedNoise(0.15, 0.1, 1500, 50, 'bandpass');
    // Low blunt pitch
    this.playRichTone({
      frequencies: [220, 110],
      types: ['square', 'sine'],
      durations: [0.15, 0.25],
      volumes: [0.12, 0.08],
      slideTo: [70, 40],
      filterFreq: 1200,
      filterType: 'lowpass'
    });
  }

  bossDeath() {
    // Epic boss death: massive explosion + metal screech + fade
    this.playImpact(40, 1.5, 0.5, true);
    this.playShapedNoise(2.0, 0.35, 2000, 5, 'lowpass');
    
    // Ascending metallic screech
    this.playRichTone({
      frequencies: [100, 200, 400, 800],
      types: ['sawtooth', 'square', 'sawtooth', 'square'],
      durations: [0.5, 0.6, 0.8, 1.0],
      volumes: [0.15, 0.1, 0.06, 0.03],
      slideTo: [2000, 3000, 4000, 5000],
      filterFreq: 8000,
      filterType: 'highpass',
    });
    
    // Deep sub-bass rumble
    setTimeout(() => {
      this.playImpact(30, 1.0, 0.3, false);
    }, 500);
  }

  bossWarning() {
    // Ominous alarm: pulsing low tone with glitch
    this.playRichTone({
      frequencies: [80, 80],
      types: ['square', 'sawtooth'],
      durations: [0.6, 0.6],
      volumes: [0.15, 0.08],
      slideTo: [60, 50],
      filterFreq: 500,
      filterType: 'lowpass',
    });
    setTimeout(() => {
      this.playRichTone({
        frequencies: [80, 80],
        types: ['square', 'sawtooth'],
        durations: [0.6, 0.6],
        volumes: [0.18, 0.1],
        slideTo: [60, 50],
        filterFreq: 500,
      });
    }, 700);
    setTimeout(() => {
      this.playRichTone({
        frequencies: [60, 40],
        types: ['square', 'sawtooth'],
        durations: [0.8, 1.0],
        volumes: [0.25, 0.12],
        slideTo: [40, 20],
        filterFreq: 300,
      });
    }, 1400);
    // Alert siren overlay
    setTimeout(() => {
      this.playModulatedTone(400, 8, 'square', 1.2, 0.04);
    }, 200);
  }

  bossAbility() {
    // Charging energy sound
    this.playRichTone({
      frequencies: [200, 300, 500],
      types: ['sawtooth', 'square', 'sawtooth'],
      durations: [0.3, 0.4, 0.5],
      volumes: [0.08, 0.05, 0.03],
      slideTo: [800, 1200, 1600],
      filterFreq: 3000,
      filterType: 'bandpass',
      filterQ: 3,
    });
    this.playShapedNoise(0.3, 0.05, 5000, 100, 'bandpass');
  }

  skillUpgrade() {
    // Satisfying upgrade: ascending arpeggio with sparkle
    const notes = [400, 500, 600, 800, 1200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 'triangle', 0.12, 0.06, [1, 2, 3], [1, 0.3, 0.1]);
      }, i * 60);
    });
    // Final chime
    setTimeout(() => {
      this.playRichTone({
        frequencies: [1200, 1500, 1800],
        types: ['sine', 'sine', 'sine'],
        durations: [0.5, 0.4, 0.3],
        volumes: [0.08, 0.04, 0.02],
        slideTo: [1500, 1800, 2400],
        filterFreq: 8000,
        filterType: 'highpass',
      });
    }, 300);

    // Sub bass impact
    setTimeout(() => {
      this.playImpact(60, 0.3, 0.15, false);
    }, 320);
  }

  nuke() {
    // Massive nuclear explosion
    // Phase 1: initial impact
    this.playImpact(40, 1.5, 0.6, true);
    
    // Phase 2: shockwave rumble
    this.playShapedNoise(2.5, 0.4, 1500, 5, 'lowpass');
    
    // Phase 3: debris crackle
    setTimeout(() => {
      this.playShapedNoise(1.5, 0.15, 5000, 100, 'highpass');
    }, 300);
    
    // Phase 4: low end resonance
    setTimeout(() => {
      this.playImpact(25, 2.0, 0.25, false);
    }, 600);

    // Metallic ring
    this.playRichTone({
      frequencies: [150, 300],
      types: ['square', 'sawtooth'],
      durations: [0.8, 1.0],
      volumes: [0.15, 0.08],
      slideTo: [30, 50],
      filterFreq: 2000,
      filterType: 'bandpass',
      filterQ: 3,
    });
  }

  dash() {
    // Whoosh: fast frequency sweep with air
    this.playRichTone({
      frequencies: [300, 600, 1200],
      types: ['triangle', 'sine', 'sine'],
      durations: [0.12, 0.15, 0.18],
      volumes: [0.1, 0.06, 0.03],
      slideTo: [1200, 1800, 2400],
      filterFreq: 8000,
      filterType: 'highpass',
    });
    this.playShapedNoise(0.15, 0.08, 3000, 50, 'bandpass');
    // Subsonic push
    this.playImpact(80, 0.15, 0.1, false);
  }

  upgrade() {
    // Tech upgrade: mechanical clicks + power up
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playRichTone({
          frequencies: [500 + i * 200, 400 + i * 300],
          types: ['square', 'triangle'],
          durations: [0.06, 0.1],
          volumes: [0.04, 0.02],
          slideTo: [400 + i * 200, 300 + i * 300],
          filterFreq: 4000 + i * 1000,
          filterType: 'bandpass',
          filterQ: 5,
        });
      }, i * 120);
    }
    // Final power hum
    setTimeout(() => {
      this.playRichTone({
        frequencies: [800, 1000],
        types: ['sine', 'triangle'],
        durations: [0.4, 0.5],
        volumes: [0.06, 0.03],
        slideTo: [1000, 1200],
        filterFreq: 5000,
      });
    }, 360);
  }

  heal() {
    // Healing synth sound
    this.playRichTone({
      frequencies: [600, 900],
      types: ['sine', 'triangle'],
      durations: [0.3, 0.45],
      volumes: [0.07, 0.035],
      slideTo: [900, 1350],
      filterFreq: 4500,
    });
  }

  uiHover() {
    // Subtle click
    this.playRichTone({
      frequencies: [800, 1200],
      types: ['sine', 'triangle'],
      durations: [0.04, 0.03],
      volumes: [0.015, 0.008],
      filterFreq: 6000,
      filterType: 'bandpass',
      filterQ: 10,
    });
  }

  uiClick() {
    if (this.host.ctx && this.host.sfxGain && audioAssets.play('ui_click', this.host.sfxGain, this.host.sfxVolume * 0.4))
      return;
    // Satisfying click: transient + body
    this.playRichTone({
      frequencies: [1000, 1500],
      types: ['triangle', 'sine'],
      durations: [0.05, 0.04],
      volumes: [0.025, 0.012],
      filterFreq: 5000,
      filterType: 'bandpass',
      filterQ: 8,
    });
  }

  uiError() {
    // Error buzz
    this.playRichTone({
      frequencies: [200, 150],
      types: ['sawtooth', 'square'],
      durations: [0.2, 0.15],
      volumes: [0.04, 0.02],
      slideTo: [100, 80],
      filterFreq: 800,
      filterType: 'lowpass',
    });
  }

  scoreTick() {
    // Quick percussive tick
    this.playRichTone({
      frequencies: [2000, 3000],
      types: ['square', 'sine'],
      durations: [0.02, 0.015],
      volumes: [0.015, 0.008],
      filterFreq: 8000,
      filterType: 'bandpass',
      filterQ: 15,
    });
  }

  critHit() {
    if (this.host.ctx && this.host.sfxGain && audioAssets.play('crit_hit', this.host.sfxGain, this.host.sfxVolume * 0.6))
      return;
    // Bright, high-pitched "crit sparkle": fast rising ping with metallic harmonics.
    // Distinct from the bassy shoot() thwack — highpass filtered, very short.
    this.playRichTone({
      frequencies: [1200, 1800, 2400],
      types: ['triangle', 'sine', 'sine'],
      durations: [0.06, 0.09, 0.12],
      volumes: [0.07, 0.04, 0.02],
      slideTo: [2400, 3200, 4000],
      filterFreq: 5000,
      filterType: 'highpass',
    });
    this.playShapedNoise(0.05, 0.02, 6000, 800, 'highpass');
  }

  miss() {
    if (this.host.ctx && this.host.sfxGain && audioAssets.play('miss', this.host.sfxGain, this.host.sfxVolume * 0.3))
      return;
    // Dull, airy "whiff": descending slide with a soft low body.
    // Intentionally quieter and flatter than shoot() so misses read as negative feedback.
    this.playRichTone({
      frequencies: [500, 300],
      types: ['triangle', 'sine'],
      durations: [0.09, 0.14],
      volumes: [0.03, 0.015],
      slideTo: [180, 120],
      filterFreq: 1200,
      filterType: 'lowpass',
    });
    this.playShapedNoise(0.12, 0.03, 1500, 100, 'bandpass');
  }

  comboBreak() {
    if (this.host.ctx && this.host.sfxGain && audioAssets.play('combo_break', this.host.sfxGain, this.host.sfxVolume * 0.5))
      return;
    // Combo lost sting: two descending notes with a slight dissonant wobble.
    this.playRichTone({
      frequencies: [440, 330],
      types: ['square', 'triangle'],
      durations: [0.18, 0.25],
      volumes: [0.05, 0.03],
      slideTo: [330, 220],
      filterFreq: 2000,
      filterType: 'lowpass',
    });
  }

  // ─── Armory UI Sounds ────────────────────────────────────────────

  /** Equip/apply sound for selecting skins and themes — satisfying magnetic snap */
  armoryEquip() {
    // Metallic snap: brief resonant ping with magnetic pull
    this.playRichTone({
      frequencies: [1200, 1800, 2400],
      types: ['triangle', 'sine', 'sine'],
      durations: [0.06, 0.1, 0.08],
      volumes: [0.04, 0.025, 0.015],
      slideTo: [1800, 2400, 3000],
      filterFreq: 6000,
      filterType: 'bandpass',
      filterQ: 12,
    });
    // Sub bass confirmation thump
    this.playImpact(100, 0.08, 0.04, false);
  }

  /** Tab switch sound — quick airy swoosh */
  armoryTabSwitch() {
    // Fast sweep: swoosh with slight pitch bend
    this.playRichTone({
      frequencies: [400, 800, 1200],
      types: ['sine', 'triangle', 'sine'],
      durations: [0.06, 0.08, 0.06],
      volumes: [0.02, 0.015, 0.008],
      slideTo: [1200, 1600, 2000],
      filterFreq: 5000,
      filterType: 'highpass',
    });
    // Air noise
    this.playShapedNoise(0.06, 0.015, 3000, 500, 'bandpass');
  }

  /** Premium unlock fanfare for redeeming a supporter key */
  armoryUnlockTier() {
    // Stage 1: Ascending chime sequence (triumphant)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 'triangle', 0.25, 0.07, [1, 2, 3], [1, 0.4, 0.2]);
      }, i * 90);
    });

    // Stage 2: Sparkly shimmer on top
    setTimeout(() => {
      this.playRichTone({
        frequencies: [1568, 2093, 2637],
        types: ['sine', 'sine', 'sine'],
        durations: [0.6, 0.5, 0.4],
        volumes: [0.06, 0.04, 0.02],
        slideTo: [2093, 2637, 3136],
        filterFreq: 10000,
        filterType: 'highpass',
      });
    }, 450);

    // Stage 3: Deep bass impact for weight
    setTimeout(() => {
      this.playImpact(50, 0.6, 0.25, true);
    }, 480);

    // Stage 4: Resonant pad swell
    setTimeout(() => {
      this.playRichTone({
        frequencies: [261.63, 392, 523.25], // C4 G4 C5
        types: ['sine', 'triangle', 'sine'],
        durations: [1.2, 1.0, 0.8],
        volumes: [0.04, 0.025, 0.015],
        slideTo: [392, 523.25, 659.25],
        filterFreq: 3000,
      });
    }, 500);

    // Stage 5: Golden sparkle dust
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.playRichTone({
            frequencies: [2000 + i * 400, 2500 + i * 500],
            types: ['sine', 'triangle'],
            durations: [0.15, 0.12],
            volumes: [0.02, 0.01],
            slideTo: [1500 + i * 300, 2000 + i * 400],
            filterFreq: 8000,
            filterType: 'bandpass',
            filterQ: 10,
          });
        }, i * 100);
      }
    }, 600);
  }
}
