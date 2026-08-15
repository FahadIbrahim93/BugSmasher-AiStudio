// @ts-nocheck
/**
 * MusicSystem — adaptive soundtrack: biome themes, intensity layering,
 * reduced-motion flattening. Split out of SoundManager (A-07): audio /
 * voice / music. Hosted by the SoundManager facade, which owns the
 * AudioContext and the musicGain bus.
 */

// ─── Adaptive Music Engine ──────────────────────────────────────────────

interface MusicLayer {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  targetGain: number;
  currentGain: number;
  frequency: number;
  type: OscillatorType;
  detune: number;
}

interface BiomeMusicConfig {
  rootFreq: number;
  scale: number[];
  layers: { freq: number; type: OscillatorType; gain: number; detune: number }[];
  texture: 'drone' | 'pulse' | 'arpeggio' | 'chaos';
}

const BIOME_MUSIC: Record<string, BiomeMusicConfig> = {
  neon_core: {
    rootFreq: 55, // A1
    scale: [0, 3, 7, 12],
    layers: [
      { freq: 1, type: 'sine', gain: 0.08, detune: 0 },
      { freq: 2, type: 'triangle', gain: 0.04, detune: 3 },
      { freq: 3, type: 'sawtooth', gain: 0.015, detune: -2 },
    ],
    texture: 'drone',
  },
  quantum_void: {
    rootFreq: 65.41, // C2
    scale: [0, 2, 5, 7, 10],
    layers: [
      { freq: 1, type: 'triangle', gain: 0.06, detune: 5 },
      { freq: 1.5, type: 'sine', gain: 0.04, detune: -5 },
      { freq: 3, type: 'sawtooth', gain: 0.02, detune: 7 },
    ],
    texture: 'pulse',
  },
  ember_depths: {
    rootFreq: 49, // G1
    scale: [0, 3, 7, 10, 14],
    layers: [
      { freq: 1, type: 'sawtooth', gain: 0.07, detune: -10 },
      { freq: 2.01, type: 'square', gain: 0.03, detune: 0 },
      { freq: 4, type: 'sine', gain: 0.02, detune: 3 },
    ],
    texture: 'arpeggio',
  },
  frostbyte: {
    rootFreq: 73.42, // D2
    scale: [0, 2, 5, 9, 12],
    layers: [
      { freq: 1, type: 'sine', gain: 0.05, detune: 0 },
      { freq: 2, type: 'sine', gain: 0.03, detune: 2 },
      { freq: 5, type: 'triangle', gain: 0.015, detune: -3 },
    ],
    texture: 'drone',
  },
  void_abyss: {
    rootFreq: 41.2, // E1
    scale: [0, 4, 7, 11],
    layers: [
      { freq: 0.5, type: 'sine', gain: 0.1, detune: -5 },
      { freq: 1.5, type: 'triangle', gain: 0.03, detune: 0 },
      { freq: 3, type: 'sawtooth', gain: 0.01, detune: -7 },
    ],
    texture: 'drone',
  },
  golden_cache: {
    rootFreq: 58.27, // B1
    scale: [0, 4, 7, 12],
    layers: [
      { freq: 1, type: 'triangle', gain: 0.06, detune: 3 },
      { freq: 2, type: 'sine', gain: 0.04, detune: -2 },
      { freq: 4, type: 'square', gain: 0.01, detune: 5 },
    ],
    texture: 'arpeggio',
  },
  golden_spire: {
    rootFreq: 58.27, // B1
    scale: [0, 4, 7, 12],
    layers: [
      { freq: 1, type: 'square', gain: 0.05, detune: 7 },
      { freq: 2, type: 'sawtooth', gain: 0.03, detune: -5 },
      { freq: 3, type: 'sine', gain: 0.02, detune: 0 },
    ],
    texture: 'chaos',
  },
};

// ─── Music System (hosted by SoundManager facade) ───────────────────────

export class MusicSystem {
  host: {
    ctx: AudioContext | null;
    musicGain: GainNode | null;
    enabled: boolean;
    reducedMotion: boolean;
  };

  private musicLayers: MusicLayer[] = [];
  private currentBiome = 'neon_core';
  private targetIntensity = 1.0;
  private currentIntensity = 1.0;
  private isBossActive = false;
  private isLowHealth = false;
  private isSurgeActive = false;
  private musicUpdateTimer = 0;
  private arpeggioTimer = 0;
  private arpeggioIndex = 0;
  private beatTimer = 0;
  private _beatPhase = false;
  private musicUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(host: { ctx: AudioContext | null; musicGain: GainNode | null; enabled: boolean; reducedMotion: boolean }) {
    this.host = host;
  }

  /** Update the music system's intensity based on current game state (calm → combat → surge → boss) */
  updateGameState(state: { intensity: number; healthPercent: number; isBossWave: boolean; isSurgeActive?: boolean }) {
    this.targetIntensity = Math.max(0.3, Math.min(2.0, state.intensity));
    this.isBossActive = state.isBossWave;
    this.isLowHealth = state.healthPercent < 0.3;
    this.isSurgeActive = state.isSurgeActive ?? false;
  }

  stopMusic() {
    // Clear any pending music update
    if (this.musicUpdateTimeoutId !== null) {
      clearTimeout(this.musicUpdateTimeoutId);
      this.musicUpdateTimeoutId = null;
    }

    this.musicLayers.forEach(layer => {
      layer.oscillators.forEach((osc, i) => {
        if (this.host.ctx) {
          // Instant volume kill to prevent overlap
          layer.gains[i].gain.setValueAtTime(0, this.host.ctx.currentTime);
          setTimeout(() => {
            try { osc.stop(); } catch { /* already stopped */ }
          }, 10);
        }
      });
    });
    this.musicLayers = [];
    this.currentIntensity = 1.0;
    this.arpeggioIndex = 0;
    this._beatPhase = false;
  }

  playBiomeMusic(biome: string) {
    if (!this.host.enabled || !this.host.ctx || !this.host.musicGain) return;
    
    // Fade out current music
    this.stopMusic();
    this.currentBiome = biome;

    const config = BIOME_MUSIC[biome] || BIOME_MUSIC.neon_core;
    const now = this.host.ctx.currentTime;

    // Create music layers based on biome config
    config.layers.forEach((layerConfig) => {
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      const oscCount = config.texture === 'arpeggio' ? 3 : (config.texture === 'chaos' ? 4 : 2);

      for (let i = 0; i < oscCount; i++) {
        try {
          const osc = this.host.ctx!.createOscillator();
          const gain = this.host.ctx!.createGain();

          osc.type = layerConfig.type;
          const freqMult = 1 + i * (1 + layerConfig.freq);
          osc.frequency.setValueAtTime(config.rootFreq * freqMult, now);
          
          // Add slight detune for richness
          osc.detune.setValueAtTime(layerConfig.detune + (Math.random() - 0.5) * 3, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.exponentialRampToValueAtTime(layerConfig.gain, now + 2);

          osc.connect(gain);
          gain.connect(this.host.musicGain!);
          osc.start();

          oscs.push(osc);
          gains.push(gain);
        } catch { /* ignore */ }
      }

      this.musicLayers.push({
        oscillators: oscs,
        gains,
        targetGain: layerConfig.gain,
        currentGain: layerConfig.gain,
        frequency: config.rootFreq,
        type: layerConfig.type,
        detune: layerConfig.detune,
      });
    });

    // Start periodic modulation timer
    this.musicUpdateTimer = 0;
    this.arpeggioTimer = 0;
    
    // Start music update loop
    this.scheduleMusicUpdate();
  }

  private scheduleMusicUpdate() {
    if (!this.host.ctx) return;
    const updateInterval = 0.1; // 100ms intervals
    this.musicUpdateTimer += updateInterval;

    // Update all layer frequencies and gains based on intensity
    const intensityFactor = this.targetIntensity;
    const bossFactor = this.isBossActive ? 0.7 : 1.0;
    const healthCrisis = this.isLowHealth ? 1.5 : 1.0;
    const surgeFactor = this.isSurgeActive ? 1.3 : 1.0;
    let combinedFactor = intensityFactor * bossFactor * healthCrisis * surgeFactor;
    // Reduced-motion a11y: flatten adaptive intensity so the soundtrack stays calm
    if (this.host.reducedMotion) combinedFactor = Math.min(combinedFactor, 1.0);

    this.musicLayers.forEach((layer) => {
      const now = this.host.ctx!.currentTime;
      
      layer.gains.forEach((gain) => {
        const baseGain = layer.currentGain * Math.min(2, combinedFactor);
        gain.gain.setTargetAtTime(
          Math.min(0.3, baseGain),
          now,
          0.3
        );
      });

      layer.oscillators.forEach((osc, i) => {
        const pitchShift = 1 + (combinedFactor - 1) * 0.2;
        const baseFreq = layer.frequency * (1 + i * 2);
        osc.frequency.setTargetAtTime(
          baseFreq * Math.min(2, pitchShift),
          now,
          0.5
        );
      });
    });

    // Schedule next update if still playing
    if (this.musicLayers.length > 0) {
      this.musicUpdateTimeoutId = setTimeout(() => { this.scheduleMusicUpdate(); }, updateInterval * 1000);
    }
  }
}
