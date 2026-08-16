import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceSystem, type VoiceLine } from '../game/VoiceSystem';

function mockSpeechSynthesis() {
  const speak = vi.fn();
  const cancel = vi.fn();
  const getVoices = vi.fn().mockReturnValue([]);
  const addEventListener = vi.fn();
  const speechSynthesis = { speak, cancel, getVoices, addEventListener };
  // @ts-expect-error - test stub
  window.speechSynthesis = speechSynthesis;
  // @ts-expect-error - test stub for the global constructor
  globalThis.SpeechSynthesisUtterance = class {
    text: string;
    rate = 1;
    pitch = 1;
    volume = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  };
  return speechSynthesis;
}

describe('VoiceSystem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  function makeHost(overrides: Partial<{ isMuted: boolean; voiceVolume: number; masterVolume: number }> = {}) {
    return {
      isMuted: false,
      voiceVolume: 0.8,
      masterVolume: 1.0,
      ...overrides,
    };
  }

  function lastSpoken(speak: ReturnType<typeof vi.fn>): {
    rate: number;
    pitch: number;
    volume: number;
    onend: () => void;
    onerror: () => void;
  } {
    return speak.mock.calls[0][0];
  }

  it('speaks a line through the synthesizer at computed volume', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());

    const promise = system.speak({ text: 'hello', speaker: 'SYSTEM' });

    expect(ss.cancel).toHaveBeenCalled();
    expect(ss.speak).toHaveBeenCalledTimes(1);
    const utterance = lastSpoken(ss.speak);
    expect(utterance.rate).toBe(0.7);
    expect(utterance.volume).toBe(0.8);
    expect(system.isVoicePlaying).toBe(true);

    utterance.onend();
    await promise;
    expect(system.isVoicePlaying).toBe(false);
    vi.useRealTimers();
  });

  it('speaks at zero volume when muted', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost({ isMuted: true }));

    const promise = system.speak({ text: 'quiet', speaker: 'STATION AI' });
    expect(lastSpoken(ss.speak).volume).toBe(0);

    lastSpoken(ss.speak).onend();
    await promise;
    vi.useRealTimers();
  });

  it('applies glitch mood effects', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());
    const line: VoiceLine = { text: 'err', speaker: '???', mood: 'glitch' };

    const promise = system.speak(line);
    expect(lastSpoken(ss.speak).rate).toBe(Math.min(2, 1.2 * 1.5));

    lastSpoken(ss.speak).onend();
    await promise;
    vi.useRealTimers();
  });

  it('applies shiver mood effects', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());
    const line: VoiceLine = { text: 'brr', speaker: 'SYSTEM', mood: 'shiver' };

    const promise = system.speak(line);
    expect(lastSpoken(ss.speak).rate).toBeCloseTo(0.7 * 0.8);

    lastSpoken(ss.speak).onend();
    await promise;
    vi.useRealTimers();
  });

  it('applies alert mood effects', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());
    const line: VoiceLine = { text: 'warn', speaker: 'STATION AI', mood: 'alert' };

    const promise = system.speak(line);
    expect(lastSpoken(ss.speak).rate).toBeCloseTo(0.9 * 1.3);

    lastSpoken(ss.speak).onend();
    await promise;
    vi.useRealTimers();
  });

  it('resolves via fallback timeout when speech never ends', async () => {
    mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());

    const promise = system.speak({ text: 'slow', speaker: 'SYSTEM' });
    vi.advanceTimersByTime(10000);
    await promise;
    expect(system.isVoicePlaying).toBe(false);
    vi.useRealTimers();
  });

  it('resolves on speech error', async () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());

    const promise = system.speak({ text: 'fail', speaker: 'SYSTEM' });
    lastSpoken(ss.speak).onerror();
    await promise;
    expect(system.isVoicePlaying).toBe(false);
    vi.useRealTimers();
  });

  it('stopSpeaking cancels synthesis and clears the speaking flag', () => {
    const ss = mockSpeechSynthesis();
    const system = new VoiceSystem(makeHost());
    system.speak({ text: 'stop', speaker: 'SYSTEM' });
    expect(system.isVoicePlaying).toBe(true);

    system.stopSpeaking();
    expect(ss.cancel).toHaveBeenCalled();
    expect(system.isVoicePlaying).toBe(false);
    vi.useRealTimers();
  });

  it('handles missing speechSynthesis gracefully', async () => {
    // @ts-expect-error - test stub
    window.speechSynthesis = undefined;
    const system = new VoiceSystem(makeHost());

    await system.speak({ text: 'none', speaker: 'SYSTEM' });
    expect(system.isVoicePlaying).toBe(false);
    vi.useRealTimers();
  });
});
