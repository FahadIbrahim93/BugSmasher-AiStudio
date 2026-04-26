export class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  enabled: boolean = false;
  volume: number = 1.0;
  isMuted: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedVol = localStorage.getItem('bugsmasher_volume');
      const savedMute = localStorage.getItem('bugsmasher_muted');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch (e) {
      console.warn("Could not load audio settings", e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('bugsmasher_volume', this.volume.toString());
      localStorage.setItem('bugsmasher_muted', this.isMuted.toString());
    } catch (e) {
      console.warn("Could not save audio settings", e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.saveSettings();
    // Play a tiny sound for feedback if we just unmuted
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
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slideFreq?: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
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
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors if context is in a weird state
    }
  }

  shoot() {
    this.playTone(800, 'square', 0.1, 0.05, 200);
  }

  splat() {
    this.playTone(150, 'sawtooth', 0.2, 0.1, 50);
  }

  hitBase() {
    this.playTone(100, 'square', 0.5, 0.3, 20);
  }

  powerup() {
    this.playTone(400, 'sine', 0.1, 0.1, 800);
    setTimeout(() => this.playTone(600, 'sine', 0.2, 0.1, 1200), 100);
  }
  
  nuke() {
    this.playTone(100, 'sawtooth', 1.0, 0.4, 20); // Deep explosive rumble
    setTimeout(() => this.playTone(300, 'square', 0.5, 0.3, 50), 50); // Sharp crack
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

  comboMilestone(combo: number) {
    if (combo >= 10) {
      this.playTone(600, 'sine', 0.15, 0.15, 1200);
      setTimeout(() => this.playTone(800, 'sine', 0.15, 0.15, 1400), 100);
      setTimeout(() => this.playTone(1000, 'sine', 0.3, 0.15, 1600), 200);
    } else if (combo >= 5) {
      this.playTone(500, 'sine', 0.1, 0.12, 900);
      setTimeout(() => this.playTone(700, 'sine', 0.2, 0.12, 1100), 80);
    }
  }

  waveComplete() {
    this.playTone(300, 'sine', 0.2, 0.15, 600);
    setTimeout(() => this.playTone(400, 'sine', 0.2, 0.15, 800), 150);
    setTimeout(() => this.playTone(600, 'sine', 0.4, 0.15, 1000), 300);
  }
}

export const soundManager = new SoundManager();
