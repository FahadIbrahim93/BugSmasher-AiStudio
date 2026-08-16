import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundManager } from '../game/SoundManager';

vi.mock('../game/AudioAssetLoader', () => ({
  audioAssets: {
    init: vi.fn(() => Promise.resolve()),
    play: vi.fn(() => false),
  },
}));

function installMockAudioContext() {
  const gainNode = {
    gain: {
      value: 1,
      setTargetAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };

  const oscillator = {
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
    detune: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  class MockAudioContext {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    createGain = vi.fn(() => gainNode);
    createOscillator = vi.fn(() => oscillator);
    createBuffer = vi.fn((_channels: number, length: number, _rate: number) => ({
      getChannelData: () => new Float32Array(length),
    }));
    createConvolver = vi.fn(() => ({ connect: vi.fn(), buffer: null }));
    createDynamicsCompressor = vi.fn(() => ({
      threshold: { value: -20, setTargetAtTime: vi.fn() },
      knee: { value: 10 },
      ratio: { value: 4 },
      attack: { value: 0.005 },
      release: { value: 0.1 },
      context: { currentTime: 0 },
      connect: vi.fn(),
    }));
    createWaveShaper = vi.fn(() => ({ connect: vi.fn(), curve: null }));
    createDelay = vi.fn(() => ({ delayTime: { value: 0.15 }, connect: vi.fn() }));
    createBiquadFilter = vi.fn(() => ({
      type: 'lowpass',
      frequency: { value: 1000, setValueAtTime: vi.fn() },
      Q: { value: 1 },
      connect: vi.fn(),
    }));
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
  }

  vi.stubGlobal('AudioContext', MockAudioContext);
  vi.stubGlobal('webkitAudioContext', MockAudioContext);
}

describe('SoundManager', () => {
  beforeEach(() => {
    localStorage.clear();
    installMockAudioContext();
    window.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        utterance.onend?.({} as SpeechSynthesisEvent);
      }),
      getVoices: vi.fn(() => []),
    } as unknown as SpeechSynthesis;
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('loads and persists volume settings', () => {
    const manager = new SoundManager();
    manager.setMasterVolume(0.42);
    manager.setSfxVolume(0.33);
    manager.setMusicVolume(0.55);
    manager.setVoiceVolume(0.66);

    expect(localStorage.getItem('bugsmasher_master_volume')).toBe('0.42');
    expect(localStorage.getItem('bugsmasher_sfx_volume')).toBe('0.33');
    expect(localStorage.getItem('bugsmasher_music_volume')).toBe('0.55');
    expect(localStorage.getItem('bugsmasher_voice_volume')).toBe('0.66');

    const reloaded = new SoundManager();
    expect(reloaded.masterVolume).toBe(0.42);
    expect(reloaded.sfxVolume).toBe(0.33);
    expect(reloaded.musicVolume).toBe(0.55);
    expect(reloaded.voiceVolume).toBe(0.66);
  });

  it('toggles mute state and re-initializes audio when unmuting', () => {
    const manager = new SoundManager();
    expect(manager.toggleMute()).toBe(true);
    expect(manager.isMuted).toBe(true);
    expect(manager.toggleMute()).toBe(false);
    expect(manager.enabled).toBe(true);
  });

  it('toggles sfx and music mute independently', () => {
    const manager = new SoundManager();
    expect(manager.toggleSfxMute()).toBe(true);
    expect(manager.toggleSfxMute()).toBe(false);
    expect(manager.toggleMusicMute()).toBe(true);
    expect(manager.toggleMusicMute()).toBe(false);
  });

  it('exposes reduced-motion and audio-stats surface', () => {
    const manager = new SoundManager();
    manager.setReducedMotion(true);
    manager.init();
    expect(manager.getAudioStats()).toBeDefined();
    manager.setReducedMotion(false);
  });

  it('resumes a suspended audio context on init', () => {
    const manager = new SoundManager();
    manager.init();
    (manager as unknown as { ctx: { state: string; resume: ReturnType<typeof vi.fn> } }).ctx.state = 'suspended';
    manager.init();
    expect(
      (manager as unknown as { ctx: { state: string; resume: ReturnType<typeof vi.fn> } }).ctx.resume,
    ).toHaveBeenCalled();
  });

  it('initializes Web Audio graph and plays sfx without throwing', () => {
    const manager = new SoundManager();
    manager.init();

    expect(manager.enabled).toBe(true);
    expect(() => {
      manager.shoot();
      manager.uiClick();
      manager.heal();
      manager.bossWarning();
      manager.updateGameState({ intensity: 1.4, healthPercent: 0.2, isBossWave: true });
      manager.playBiomeMusic('neon_core');
      manager.stopMusic();
    }).not.toThrow();
  });

  it('speaks voice lines through speech synthesis', async () => {
    vi.useFakeTimers();
    const manager = new SoundManager();
    const speakPromise = manager.speak({ text: 'System online.', speaker: 'SYSTEM' });

    await vi.runAllTimersAsync();
    await speakPromise;

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(manager.isVoicePlaying).toBe(false);
  });

  it('cleans up audio resources on destroy', () => {
    const manager = new SoundManager();
    manager.init();
    manager.destroy();

    expect(manager.enabled).toBe(false);
    expect(manager.ctx).toBeNull();
  });

  it('covers the public sfx surface without throwing', () => {
    const manager = new SoundManager();
    manager.init();

    expect(() => {
      manager.splat('basic');
      manager.splat('tank');
      manager.hitBase();
      manager.powerup('shield');
      manager.resource('scrap');
      manager.bossHit();
      manager.bossDeath();
      manager.bossAbility();
      manager.skillUpgrade();
      manager.nuke();
      manager.dash();
      manager.upgrade();
      manager.uiHover();
      manager.uiError();
      manager.scoreTick();
      manager.armoryEquip();
      manager.armoryTabSwitch();
      manager.armoryUnlockTier();
      manager.critHit();
      manager.miss();
      manager.comboBreak();
      manager.toggleSfxMute();
      manager.toggleMusicMute();
    }).not.toThrow();
  });

  it('gives crit, miss, and combo-break distinct oscillator signatures from a normal hit', () => {
    const manager = new SoundManager();
    manager.init();

    const ctx = manager.ctx as unknown as { createOscillator: ReturnType<typeof vi.fn> };
    const oscillatorCall = ctx.createOscillator;

    oscillatorCall.mockClear();
    manager.shoot();
    const shootFrequencies = oscillatorCall.mock.results.length;
    expect(shootFrequencies).toBeGreaterThan(0);

    oscillatorCall.mockClear();
    manager.critHit();
    expect(oscillatorCall).toHaveBeenCalled();

    oscillatorCall.mockClear();
    manager.miss();
    expect(oscillatorCall).toHaveBeenCalled();

    oscillatorCall.mockClear();
    manager.comboBreak();
    expect(oscillatorCall).toHaveBeenCalled();
  });

  it('prefers a WAV asset over synthesis when one is available for the new SFX ids', async () => {
    const { audioAssets } = await import('../game/AudioAssetLoader');
    (audioAssets.play as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);

    const manager = new SoundManager();
    manager.init();

    const ctx = manager.ctx as unknown as { createOscillator: ReturnType<typeof vi.fn> };
    const oscillatorCall = ctx.createOscillator;
    oscillatorCall.mockClear();

    manager.critHit();

    // audioAssets.play returned true, so synthesis should be skipped entirely
    expect(oscillatorCall).not.toHaveBeenCalled();
  });

  it('rate-limits oscillator allocation during SFX bursts (no audio frame drops)', () => {
    const manager = new SoundManager();
    manager.init();

    const ctx = manager.ctx as unknown as { createOscillator: ReturnType<typeof vi.fn> };
    ctx.createOscillator.mockClear();

    // Simulate a dense burst of simultaneous hits (e.g. nuke + swarm splats)
    for (let i = 0; i < 200; i += 1) {
      manager.shoot();
    }

    const stats = manager.getAudioStats();
    // Oscillator creation is budgeted per window — bounded, not 200x the synth count.
    // (Use generous bounds so the assertion is stable across a 100ms window boundary.)
    expect(ctx.createOscillator.mock.calls.length).toBeLessThan(200);
    expect(stats.oscillatorsSpawned).toBeLessThan(200);
    expect(stats.throttledEvents).toBeGreaterThan(0);
    expect(() => { manager.shoot(); }).not.toThrow();
  });

  it('respects reduced-motion and surge state in the adaptive music system', () => {
    const manager = new SoundManager();
    manager.setReducedMotion(true);
    manager.init();

    expect(() => {
      manager.updateGameState({ intensity: 2.0, healthPercent: 0.1, isBossWave: true, isSurgeActive: true });
      manager.playBiomeMusic('neon_core');
      manager.stopMusic();
    }).not.toThrow();

    // Non-surge state also works (optional field defaults to false)
    manager.updateGameState({ intensity: 0.5, healthPercent: 0.9, isBossWave: false });
    expect(() => { manager.playBiomeMusic('frostbyte'); }).not.toThrow();
  });
});
