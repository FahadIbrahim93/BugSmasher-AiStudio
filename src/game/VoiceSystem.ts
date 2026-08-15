/**
 * VoiceSystem — speech-synthesis dialogue lines for cutscenes.
 * Split out of SoundManager (A-07): audio / voice / music.
 */

export interface VoiceLine {
  text: string;
  speaker: string;
  mood?: 'normal' | 'glitch' | 'shiver' | 'alert';
}

// ─── Voice Synthesis Engine ─────────────────────────────────────────────

class VoiceSynthesizer {
  private static VOICE_CONFIGS: Record<string, { rate: number; pitch: number; voiceName?: string }> = {
    'SYSTEM': { rate: 0.7, pitch: 0.3 },
    'STATION AI': { rate: 0.9, pitch: 1.0 },
    '???': { rate: 1.2, pitch: 0.2 },
  };

  static speak(line: VoiceLine, volume = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(line.text);
      const config = this.VOICE_CONFIGS[line.speaker] || { rate: 1.0, pitch: 1.0 };
      
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = volume;

      // Apply mood effects
      if (line.mood === 'glitch') {
        utterance.rate = Math.min(2, config.rate * 1.5);
        utterance.pitch = config.pitch + 0.3;
      } else if (line.mood === 'shiver') {
        utterance.rate = config.rate * 0.8;
        utterance.pitch = config.pitch * 0.7;
      } else if (line.mood === 'alert') {
        utterance.rate = config.rate * 1.3;
        utterance.pitch = config.pitch * 1.2;
      }

      // Find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Microsoft') || v.name.includes('Google') || v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => { resolve(); };
      utterance.onerror = () => { resolve(); };

      // Chrome requires a small delay for SpeechSynthesis to work after page load
      window.speechSynthesis.speak(utterance);
      
      // Fallback resolve if speech takes too long
      setTimeout(resolve, 10000);
    });
  }

  static preloadVoices(): void {
    if (!window.speechSynthesis) return;
    // Trigger voice loading
    window.speechSynthesis.getVoices();
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', () => undefined, { once: true });
    }
  }
}

// ─── Voice System (hosted by SoundManager facade) ───────────────────────

export class VoiceSystem {
  host: { isMuted: boolean; voiceVolume: number; masterVolume: number };
  private isSpeaking = false;

  constructor(host: { isMuted: boolean; voiceVolume: number; masterVolume: number }) {
    this.host = host;
    VoiceSynthesizer.preloadVoices();
  }

  /** Speak a dialogue line for cutscenes using Speech Synthesis */
  async speak(line: VoiceLine): Promise<void> {
    this.isSpeaking = true;
    try {
      const vol = this.host.isMuted ? 0 : this.host.voiceVolume * this.host.masterVolume;
      await VoiceSynthesizer.speak(line, vol);
    } catch (e) {
      console.warn('Voice synthesis failed:', e);
    }
    this.isSpeaking = false;
  }

  /** Stop any ongoing voice playback */
  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  get isVoicePlaying(): boolean {
    return this.isSpeaking;
  }
}
