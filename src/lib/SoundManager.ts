export class SoundManager {
  ctx: AudioContext | null = null
  sfxGain: GainNode | null = null
  musicGain: GainNode | null = null
  noiseBuffer: AudioBuffer | null = null
  currentMusicOscs: { osc: OscillatorNode; gain: GainNode }[] = []
  enabled = false

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.sfxGain = this.ctx.createGain()
      this.musicGain = this.ctx.createGain()
      this.sfxGain.connect(this.ctx.destination)
      this.musicGain.connect(this.ctx.destination)
      const bufSize = this.ctx.sampleRate * 2
      this.noiseBuffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      this.enabled = true
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  private tone(freq: number, type: OscillatorType, dur: number, vol = 0.1, slide?: number, music = false) {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.musicGain) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, this.ctx.currentTime + dur)
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur)
      osc.connect(gain); gain.connect(music ? this.musicGain : this.sfxGain)
      osc.start(); osc.stop(this.ctx.currentTime + dur)
    } catch {}
  }

  private noise(dur: number, vol: number, freq = 1000) {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.noiseBuffer) return
    try {
      const src = this.ctx.createBufferSource(); const gain = this.ctx.createGain(); const filter = this.ctx.createBiquadFilter()
      src.buffer = this.noiseBuffer; filter.type = 'lowpass'
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + dur)
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur)
      src.connect(filter); filter.connect(gain); gain.connect(this.sfxGain)
      src.start(); src.stop(this.ctx.currentTime + dur)
    } catch {}
  }

  shoot() { this.tone(800, 'square', 0.1, 0.05, 200); this.noise(0.05, 0.02, 2000) }
  splat() { this.tone(150, 'sawtooth', 0.2, 0.1, 50); this.noise(0.15, 0.08, 1000) }
  hitBase() { this.tone(100, 'square', 0.5, 0.3, 20); this.noise(0.4, 0.2, 500) }
  bossHit() { this.tone(200, 'square', 0.1, 0.15, 50); this.noise(0.08, 0.1, 800) }
  nuke() { this.tone(100, 'sawtooth', 1.0, 0.4, 20); this.noise(1.5, 0.4, 800); setTimeout(() => this.tone(300, 'square', 0.5, 0.3, 50), 50) }
  dash() { this.tone(400, 'sine', 0.12, 0.15, 1200); this.noise(0.12, 0.1, 1500) }
  upgrade() { this.tone(300, 'sine', 0.1, 0.1, 600); setTimeout(() => this.tone(400, 'sine', 0.1, 0.1, 800), 100); setTimeout(() => this.tone(500, 'sine', 0.3, 0.1, 1000), 200) }
  uiHover() { this.tone(600, 'sine', 0.05, 0.01) }
  uiClick() { this.tone(800, 'triangle', 0.05, 0.02) }
  uiError() { this.tone(200, 'sawtooth', 0.15, 0.03, 100) }
  bossWarning() { this.tone(100, 'square', 0.5, 0.2, 80); setTimeout(() => this.tone(100, 'square', 0.5, 0.2, 80), 600); setTimeout(() => this.tone(100, 'square', 0.8, 0.3, 50), 1200) }
  bossDeath() { this.nuke(); setTimeout(() => this.tone(50, 'sawtooth', 1.5, 0.5, 10), 200) }
  bossAbility() { this.tone(800, 'sawtooth', 0.1, 0.1, 400); setTimeout(() => this.tone(600, 'sawtooth', 0.1, 0.1, 300), 100); this.noise(0.2, 0.05, 1500) }
  scoreTick() { this.tone(1200, 'sine', 0.03, 0.01) }

  powerup(type?: string) {
    if (type === 'shield') { this.tone(300, 'sine', 0.1, 0.1, 900); setTimeout(() => this.tone(450, 'sine', 0.3, 0.05, 1200), 50) }
    else if (type === 'rapid_fire') { this.tone(800, 'sawtooth', 0.1, 0.05, 1600); this.tone(1000, 'sawtooth', 0.2, 0.05, 2000) }
    else if (type === 'multiplier') { this.tone(523, 'sine', 0.1, 0.1, 1046); setTimeout(() => this.tone(659, 'sine', 0.1, 0.1, 1318), 100); setTimeout(() => this.tone(784, 'sine', 0.3, 0.1, 1568), 200) }
    else if (type === 'slow_mo') { this.tone(400, 'triangle', 0.5, 0.1, 100) }
    else if (type === 'overdrive') { for (let i = 0; i < 5; i++) setTimeout(() => this.tone(100 + i * 100, 'sawtooth', 0.1, 0.05, 200 + i * 100), i * 50) }
    else { this.tone(400, 'sine', 0.1, 0.1, 800); setTimeout(() => this.tone(600, 'sine', 0.2, 0.1, 1200), 100) }
  }

  resource(type: string) {
    switch (type) {
      case 'scrap': this.tone(1200, 'triangle', 0.05, 0.02, 1800); break
      case 'plasma': this.tone(800, 'sine', 0.1, 0.03, 1200); break
      case 'alloy': this.tone(400, 'square', 0.08, 0.04, 200); break
      case 'flux': this.tone(1500, 'sine', 0.1, 0.03, 500); break
      case 'neural_core': this.tone(2000, 'sine', 0.2, 0.05, 3000); break
      default: this.uiHover()
    }
  }

  stopMusic() {
    this.currentMusicOscs.forEach(o => { o.gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 1); o.osc.stop(this.ctx!.currentTime + 1.1) })
    this.currentMusicOscs = []
  }

  playBiomeMusic(biome: string) {
    if (!this.enabled || !this.ctx || !this.musicGain) return
    this.stopMusic()
    const map: Record<string, { freqs: number[]; type: OscillatorType }> = {
      neon_core: { freqs: [60, 120, 180], type: 'sine' },
      quantum_void: { freqs: [70, 140, 210], type: 'triangle' },
      ember_depths: { freqs: [50, 100, 150], type: 'sawtooth' },
      frostbyte: { freqs: [80, 160, 240], type: 'sine' },
      void_abyss: { freqs: [40, 80, 120], type: 'sine' },
      golden_cache: { freqs: [65, 130, 195], type: 'triangle' },
      golden_spire: { freqs: [55, 110, 165], type: 'sine' },
    }
    const cfg = map[biome] || map.neon_core
    cfg.freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator(); const gain = this.ctx!.createGain()
      osc.type = cfg.type; osc.frequency.setValueAtTime(f, this.ctx!.currentTime)
      gain.gain.setValueAtTime(0, this.ctx!.currentTime); gain.gain.exponentialRampToValueAtTime(0.05 / (i + 1), this.ctx!.currentTime + 2)
      osc.connect(gain); gain.connect(this.musicGain!); osc.start()
      this.currentMusicOscs.push({ osc, gain })
    })
  }
}

export const soundManager = new SoundManager()
