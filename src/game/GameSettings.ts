import { soundManager } from './SoundManager';

export interface GameSettings {
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    masterMuted: boolean;
  };
  graphics: {
    particleQuality: 'low' | 'medium' | 'high';
    screenShake: boolean;
    showFPS: boolean;
  };
  controls: {
    clickRadius: 'small' | 'medium' | 'large';
    vibration: boolean;
  };
}

const defaultSettings: GameSettings = {
  audio: {
    masterVolume: 1.0,
    sfxVolume: 1.0,
    musicVolume: 1.0,
    masterMuted: false,
  },
  graphics: {
    particleQuality: 'high',
    screenShake: true,
    showFPS: false,
  },
  controls: {
    clickRadius: 'medium',
    vibration: true,
  },
};

class GameSettingsManager {
  settings: GameSettings = { ...defaultSettings };

  constructor() {
    this.loadSettings();
    this.applySettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('bugsmasher_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load game settings", e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('bugsmasher_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn("Could not save game settings", e);
    }
  }

  private applySettings() {
    if (soundManager) {
      soundManager.setVolume(this.settings.audio.masterVolume);
      if (this.settings.audio.masterMuted) {
        soundManager.setMuted(true);
      }
    }
  }

  updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = {
      ...this.settings,
      audio: { ...this.settings.audio, ...newSettings.audio },
      graphics: { ...this.settings.graphics, ...newSettings.graphics },
      controls: { ...this.settings.controls, ...newSettings.controls },
    };
    this.applySettings();
    this.saveSettings();
  }

  getAudioSettings() {
    return this.settings.audio;
  }

  getGraphicsSettings() {
    return this.settings.graphics;
  }

  getControlsSettings() {
    return this.settings.controls;
  }

  resetToDefaults() {
    this.settings = { ...defaultSettings };
    this.applySettings();
    this.saveSettings();
  }
}

export const gameSettings = new GameSettingsManager();