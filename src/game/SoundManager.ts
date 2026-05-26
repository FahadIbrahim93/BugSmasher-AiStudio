export class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  enabled: boolean = false;
  
  // Settings
  masterVolume: number = 1.0;
  sfxVolume: number = 0.8;
  musicVolume: number = 0.5;
  isMuted: boolean = false;
  
  noiseBuffer: AudioBuffer | null = null;
  currentMusicOscs: { osc: OscillatorNode, gain: GainNode }[] = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedMasterVol = localStorage.getItem('bugsmasher_master_volume');
      const savedSfxVol = localStorage.getItem('bugsmasher_sfx_volume');
      const savedMusicVol = localStorage.getItem('bugsmasher_music_volume');
      const savedMute = localStorage.getItem('bugsmasher_muted');
      
      if (savedMasterVol !== null) this.masterVolume = parseFloat(savedMasterVol);
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch (e) {
      console.warn("Could not load audio settings", e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('bugsmasher_master_volume', this.masterVolume.toString());
      localStorage.setItem('bugsmasher_sfx_volume', this.sfxVolume.toString());
      localStorage.setItem('bugsmasher_music_volume', this.musicVolume.toString());
      localStorage.setItem('bugsmasher_muted', this.isMuted.toString());
    } catch (e) {
      console.warn("Could not save audio settings", e);
    }
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  private updateGains() {
    if (this.ctx && this.masterGain && this.sfxGain && this.musicGain) {
      const time = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, time, 0.05);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, time, 0.05);
      this.musicGain.gain.setTargetAtTime(this.musicVolume, time, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateGains();
    this.saveSettings();
    if (!this.isMuted) {
      this.init();
      this.uiClick();
    }
    return this.isMuted;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        
        // Generate noise buffer
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        this.updateGains();
        this.enabled = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideFreq?: number, isMusic: boolean = false) {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(isMusic ? this.musicGain : this.sfxGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  private playNoise(duration: number, vol: number, filterFreq: number = 1000) {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      source.buffer = this.noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      
      source.start();
      source.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  shoot() {
    this.playTone(800, 'square', 0.1, 0.05, 200);
    this.playNoise(0.05, 0.02, 2000);
  }

  splat() {
    this.playTone(150, 'sawtooth', 0.2, 0.1, 50);
    this.playNoise(0.15, 0.08, 1000);
  }

  hitBase() {
    this.playTone(100, 'square', 0.5, 0.3, 20);
    this.playNoise(0.4, 0.2, 500);
  }

  powerup(type?: string) {
    if (type === 'shield') {
      this.playTone(300, 'sine', 0.1, 0.1, 900);
      setTimeout(() => this.playTone(450, 'sine', 0.3, 0.05, 1200), 50);
    } else if (type === 'rapid_fire') {
      this.playTone(800, 'sawtooth', 0.1, 0.05, 1600);
      this.playTone(1000, 'sawtooth', 0.2, 0.05, 2000);
    } else if (type === 'multiplier') {
      this.playTone(523.25, 'sine', 0.1, 0.1, 1046.5); // C5 to C6
      setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1, 1318.5), 100); // E5 to E6
      setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.1, 1568), 200); // G5 to G6
    } else if (type === 'slow_mo') {
      this.playTone(400, 'triangle', 0.5, 0.1, 100);
    } else if (type === 'overdrive') {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.playTone(100 + i * 100, 'sawtooth', 0.1, 0.05, 200 + i * 100), i * 50);
      }
    } else {
      this.playTone(400, 'sine', 0.1, 0.1, 800);
      setTimeout(() => this.playTone(600, 'sine', 0.2, 0.1, 1200), 100);
    }
  }

  resource(type: string) {
    switch(type) {
      case 'scrap':
        this.playTone(1200, 'triangle', 0.05, 0.02, 1800);
        break;
      case 'plasma':
        this.playTone(800, 'sine', 0.1, 0.03, 1200);
        break;
      case 'alloy':
        this.playTone(400, 'square', 0.08, 0.04, 200);
        break;
      case 'flux':
        this.playTone(1500, 'sine', 0.1, 0.03, 500);
        break;
      case 'neural_core':
        this.playTone(2000, 'sine', 0.2, 0.05, 3000);
        this.playTone(2500, 'sine', 0.3, 0.02);
        break;
      default:
        this.uiHover();
    }
  }

  bossHit() {
    this.playTone(200, 'square', 0.1, 0.15, 50);
    this.playNoise(0.08, 0.1, 800);
  }

  skillUpgrade() {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            this.playTone(400 + i * 200, 'sine', 0.1, 0.08, 600 + i * 200);
        }, i * 80);
    }
    setTimeout(() => {
        this.playTone(1200, 'sine', 0.4, 0.1, 1500);
    }, 400);
  }
  
  nuke() {
    this.playTone(100, 'sawtooth', 1.0, 0.4, 20); // Deep explosive rumble
    this.playNoise(1.5, 0.4, 800);
    setTimeout(() => this.playTone(300, 'square', 0.5, 0.3, 50), 50); // Sharp crack
  }

  dash() {
    this.playTone(400, 'sine', 0.12, 0.15, 1200);
    this.playNoise(0.12, 0.1, 1500);
  }
  
  upgrade() {
    this.playTone(300, 'sine', 0.1, 0.1, 600);
    setTimeout(() => this.playTone(400, 'sine', 0.1, 0.1, 800), 100);
    setTimeout(() => this.playTone(500, 'sine', 0.3, 0.1, 1000), 200);
  }

  uiHover() {
    this.playTone(600, 'sine', 0.05, 0.01);
  }

  uiClick() {
    this.playTone(800, 'triangle', 0.05, 0.02);
  }

  uiError() {
    this.playTone(200, 'sawtooth', 0.15, 0.03, 100);
  }

  scoreTick() {
    this.playTone(1200, 'sine', 0.03, 0.01);
  }

  bossWarning() {
    this.playTone(100, 'square', 0.5, 0.2, 80);
    setTimeout(() => this.playTone(100, 'square', 0.5, 0.2, 80), 600);
    setTimeout(() => this.playTone(100, 'square', 0.8, 0.3, 50), 1200);
  }

  bossDeath() {
    this.nuke();
    setTimeout(() => this.playTone(50, 'sawtooth', 1.5, 0.5, 10), 200);
  }

  bossAbility() {
    this.playTone(800, 'sawtooth', 0.1, 0.1, 400);
    setTimeout(() => this.playTone(600, 'sawtooth', 0.1, 0.1, 300), 100);
    this.playNoise(0.2, 0.05, 1500);
  }

  stopMusic() {
    this.currentMusicOscs.forEach(o => {
      o.gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 1);
      o.osc.stop(this.ctx!.currentTime + 1.1);
    });
    this.currentMusicOscs = [];
  }

  playBiomeMusic(biome: string) {
    if (!this.enabled || !this.ctx || !this.musicGain) return;
    this.stopMusic();

    let freqs = [60, 120, 180]; // Bass drone
    let type: OscillatorType = 'sine';

    switch(biome) {
      case 'quantum_void': freqs = [70, 140, 210]; type = 'triangle'; break;
      case 'ember_depths': freqs = [50, 100, 150]; type = 'sawtooth'; break;
      case 'frostbyte': freqs = [80, 160, 240]; type = 'sine'; break;
      case 'void_abyss': freqs = [40, 80, 120]; type = 'sine'; break;
    }

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05 / (i + 1), this.ctx!.currentTime + 2);
      
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start();
      this.currentMusicOscs.push({ osc, gain });
    });
  }
}

export const soundManager = new SoundManager();
