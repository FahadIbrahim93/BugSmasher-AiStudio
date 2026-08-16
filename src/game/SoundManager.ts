import { audioAssets } from './AudioAssetLoader';
import { ReverbProcessor, CompressorProcessor } from './AudioGraph';
import { SoundEffects } from './SoundEffects';
import { MusicSystem } from './MusicSystem';
import { VoiceSystem } from './VoiceSystem';

/**
 * BUGSMASHER — Sound System facade (split A-07: audio / voice / music).
 *
 * Owns the WebAudio graph (context, buses, effects chain) and the volume/
 * mute settings; delegates SFX to SoundEffects, the adaptive soundtrack to
 * MusicSystem, and dialogue to VoiceSystem.
 */

export type { VoiceLine } from './VoiceSystem';

// ─── Main SoundManager facade ──────────────────────────────────────────

export class SoundManager {
  ctx: AudioContext | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  voiceGain: GainNode | null = null;
  enabled = false;

  // Audio processing chain
  private compressor: CompressorProcessor | null = null;
  private reverb: ReverbProcessor | null = null;
  private preMaster: GainNode | null = null;

  // Settings
  masterVolume = 1.0;
  sfxVolume = 0.8;
  musicVolume = 0.6;
  voiceVolume = 0.7;
  isMuted = false;
  sfxMuted = false;
  musicMuted = false;

  noiseBuffer: AudioBuffer | null = null;

  // Reduced-motion a11y: read by MusicSystem to flatten adaptive intensity
  reducedMotion = false;

  // Subsystems (A-07 split)
  private sfx: SoundEffects;
  private music: MusicSystem;
  private voice: VoiceSystem;

  constructor() {
    this.loadSettings();
    this.sfx = new SoundEffects(this);
    this.music = new MusicSystem(this);
    this.voice = new VoiceSystem(this);
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('bugsmasher_master_volume');
      if (saved !== null) this.masterVolume = parseFloat(saved);
      const savedSfx = localStorage.getItem('bugsmasher_sfx_volume');
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
      const savedMusic = localStorage.getItem('bugsmasher_music_volume');
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
      const savedVoice = localStorage.getItem('bugsmasher_voice_volume');
      if (savedVoice !== null) this.voiceVolume = parseFloat(savedVoice);
      const savedMute = localStorage.getItem('bugsmasher_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedSfxMute = localStorage.getItem('bugsmasher_sfx_muted');
      if (savedSfxMute !== null) this.sfxMuted = savedSfxMute === 'true';
      const savedMusicMute = localStorage.getItem('bugsmasher_music_muted');
      if (savedMusicMute !== null) this.musicMuted = savedMusicMute === 'true';
    } catch (e) {
      console.warn("Could not load audio settings", e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('bugsmasher_master_volume', this.masterVolume.toString());
      localStorage.setItem('bugsmasher_sfx_volume', this.sfxVolume.toString());
      localStorage.setItem('bugsmasher_music_volume', this.musicVolume.toString());
      localStorage.setItem('bugsmasher_voice_volume', this.voiceVolume.toString());
      localStorage.setItem('bugsmasher_muted', this.isMuted.toString());
      localStorage.setItem('bugsmasher_sfx_muted', this.sfxMuted.toString());
      localStorage.setItem('bugsmasher_music_muted', this.musicMuted.toString());
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

  setVoiceVolume(vol: number) {
    this.voiceVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  private updateGains() {
    if (!this.ctx || !this.preMaster) return;
    const time = this.ctx.currentTime;
    const masterTarget = this.isMuted ? 0 : this.masterVolume;
    this.preMaster.gain.setTargetAtTime(masterTarget, time, 0.05);
    
    const sfxTarget = this.sfxMuted ? 0 : this.sfxVolume;
    const musicTarget = this.musicMuted ? 0 : this.musicVolume;
    
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfxTarget, time, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(musicTarget, time, 0.05);
    if (this.voiceGain) this.voiceGain.gain.setTargetAtTime(this.voiceVolume, time, 0.05);
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

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted;
    this.updateGains();
    this.saveSettings();
    if (!this.sfxMuted) {
      this.init();
      this.uiClick();
    }
    return this.sfxMuted;
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    this.updateGains();
    this.saveSettings();
    return this.musicMuted;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Build audio processing chain:
      // Source → SFXBus/MusicBus → Reverb → Compressor → Master
      
      this.preMaster = this.ctx.createGain();
      this.preMaster.gain.value = this.masterVolume;
      this.preMaster.connect(this.ctx.destination);

      // Compressor (master bus)
      this.compressor = new CompressorProcessor(this.ctx, this.preMaster);

      // Reverb (send/return)
      this.reverb = new ReverbProcessor(this.ctx, this.preMaster);

      // Main mix bus
      const mixBus = this.ctx.createGain();
      mixBus.connect(this.compressor.getInput());

      // Dry signal goes through compressor directly
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(mixBus);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(mixBus);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.voiceVolume;
      this.voiceGain.connect(mixBus);

      // Reverb send from SFX
      const reverbSend = this.ctx.createGain();
      reverbSend.gain.value = 0.25;
      this.sfxGain.connect(reverbSend);
      reverbSend.connect(this.reverb.getWetInput());
      
      // Reverb send from music (smaller)
      const musicReverb = this.ctx.createGain();
      musicReverb.gain.value = 0.15;
      this.musicGain.connect(musicReverb);
      musicReverb.connect(this.reverb.getWetInput());

      // Generate noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.updateGains();
      this.enabled = true;
      void audioAssets.init(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** Respect a11y reduced-motion: flatten adaptive music intensity so the soundtrack stays calm. */
  setReducedMotion(enabled: boolean) {
    this.reducedMotion = enabled;
  }

  /**
   * Measurable audio-load telemetry for the P0 benchmark (no frame drops from
   * audio). Consumed by tests and by the HUD SYS_DIAGNOSTICS overlay
   * (see src/components/HUD.tsx) which surfaces audio pressure during gameplay.
   */
  getAudioStats() {
    return this.sfx.getAudioStats();
  }

  // ─── SFX delegates (SoundEffects) ────────────────────────────────

  shoot() { this.sfx.shoot(); }
  splat(bugType?: string) { this.sfx.splat(bugType); }
  hitBase() { this.sfx.hitBase(); }
  powerup(type?: string) { this.sfx.powerup(type); }
  resource(type: string) { this.sfx.resource(type); }
  bossHit() { this.sfx.bossHit(); }
  bossDeath() { this.sfx.bossDeath(); }
  bossWarning() { this.sfx.bossWarning(); }
  bossAbility() { this.sfx.bossAbility(); }
  skillUpgrade() { this.sfx.skillUpgrade(); }
  nuke() { this.sfx.nuke(); }
  dash() { this.sfx.dash(); }
  upgrade() { this.sfx.upgrade(); }
  heal() { this.sfx.heal(); }
  uiHover() { this.sfx.uiHover(); }
  uiClick() { this.sfx.uiClick(); }
  uiError() { this.sfx.uiError(); }
  scoreTick() { this.sfx.scoreTick(); }
  critHit() { this.sfx.critHit(); }
  miss() { this.sfx.miss(); }
  comboBreak() { this.sfx.comboBreak(); }
  armoryEquip() { this.sfx.armoryEquip(); }
  armoryTabSwitch() { this.sfx.armoryTabSwitch(); }
  armoryUnlockTier() { this.sfx.armoryUnlockTier(); }

  // ─── Music delegates (MusicSystem) ───────────────────────────────

  /** Update the music system's intensity based on current game state (calm → combat → surge → boss) */
  updateGameState(state: { intensity: number; healthPercent: number; isBossWave: boolean; isSurgeActive?: boolean }) {
    this.music.updateGameState(state);
  }

  stopMusic() { this.music.stopMusic(); }
  playBiomeMusic(biome: string) { this.music.playBiomeMusic(biome); }

  // ─── Voice delegates (VoiceSystem) ───────────────────────────────

  /** Speak a dialogue line for cutscenes using Speech Synthesis */
  speak(line: import('./VoiceSystem').VoiceLine): Promise<void> {
    return this.voice.speak(line);
  }

  /** Stop any ongoing voice playback */
  stopSpeaking() { this.voice.stopSpeaking(); }

  get isVoicePlaying(): boolean {
    return this.voice.isVoicePlaying;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────

  destroy() {
    this.music.stopMusic();
    this.voice.stopSpeaking();
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.enabled = false;
  }
}

export const soundManager = new SoundManager();
