import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Music, Sparkles, Monitor, Gamepad2, ChevronLeft, RotateCcw } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { gameSettings } from '../game/GameSettings';

type Tab = 'audio' | 'graphics' | 'controls';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('audio');
  
  const [audioSettings, setAudioSettings] = useState(gameSettings.getAudioSettings());
  const [graphicsSettings, setGraphicsSettings] = useState(gameSettings.getGraphicsSettings());
  const [controlsSettings, setControlsSettings] = useState(gameSettings.getControlsSettings());

  const [localMasterVol, setLocalMasterVol] = useState(audioSettings.masterVolume);
  const [localSfxVol, setLocalSfxVol] = useState(audioSettings.sfxVolume);
  const [localMusicVol, setLocalMusicVol] = useState(audioSettings.musicVolume);
  const [localMuted, setLocalMuted] = useState(audioSettings.masterMuted);

  useEffect(() => {
    setAudioSettings(gameSettings.getAudioSettings());
    setGraphicsSettings(gameSettings.getGraphicsSettings());
    setControlsSettings(gameSettings.getControlsSettings());
    
    setLocalMasterVol(audioSettings.masterVolume);
    setLocalSfxVol(audioSettings.sfxVolume);
    setLocalMusicVol(audioSettings.musicVolume);
    setLocalMuted(audioSettings.masterMuted);
  }, []);

  const handleMasterVolumeChange = (vol: number) => {
    setLocalMasterVol(vol);
    gameSettings.updateSettings({
      audio: { ...audioSettings, masterVolume: vol }
    });
    soundManager.setVolume(vol);
  };

  const handleSfxVolumeChange = (vol: number) => {
    setLocalSfxVol(vol);
    gameSettings.updateSettings({
      audio: { ...audioSettings, sfxVolume: vol }
    });
    soundManager.setSFXVolume(vol);
  };

  const handleMusicVolumeChange = (vol: number) => {
    setLocalMusicVol(vol);
    gameSettings.updateSettings({
      audio: { ...audioSettings, musicVolume: vol }
    });
    soundManager.setMusicVolume(vol);
  };

  const handleToggleMute = () => {
    const newMuted = !localMuted;
    setLocalMuted(newMuted);
    gameSettings.updateSettings({
      audio: { ...audioSettings, masterMuted: newMuted }
    });
    soundManager.setMuted(newMuted);
  };

  const handleParticleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    gameSettings.updateSettings({
      graphics: { ...graphicsSettings, particleQuality: quality }
    });
    setGraphicsSettings(gameSettings.getGraphicsSettings());
  };

  const handleScreenShakeToggle = () => {
    gameSettings.updateSettings({
      graphics: { ...graphicsSettings, screenShake: !graphicsSettings.screenShake }
    });
    setGraphicsSettings(gameSettings.getGraphicsSettings());
  };

  const handleShowFpsToggle = () => {
    gameSettings.updateSettings({
      graphics: { ...graphicsSettings, showFPS: !graphicsSettings.showFPS }
    });
    setGraphicsSettings(gameSettings.getGraphicsSettings());
  };

  const handleClickRadiusChange = (radius: 'small' | 'medium' | 'large') => {
    gameSettings.updateSettings({
      controls: { ...controlsSettings, clickRadius: radius }
    });
    setControlsSettings(gameSettings.getControlsSettings());
  };

  const handleVibrationToggle = () => {
    gameSettings.updateSettings({
      controls: { ...controlsSettings, vibration: !controlsSettings.vibration }
    });
    setControlsSettings(gameSettings.getControlsSettings());
  };

  const handleBack = () => {
    soundManager.uiClick();
    onBack();
  };

  const handleResetToDefaults = () => {
    soundManager.uiClick();
    gameSettings.resetToDefaults();
    setAudioSettings(gameSettings.getAudioSettings());
    setGraphicsSettings(gameSettings.getGraphicsSettings());
    setControlsSettings(gameSettings.getControlsSettings());
    setLocalMasterVol(gameSettings.settings.audio.masterVolume);
    setLocalSfxVol(gameSettings.settings.audio.sfxVolume);
    setLocalMusicVol(gameSettings.settings.audio.musicVolume);
    setLocalMuted(gameSettings.settings.audio.masterMuted);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'graphics', label: 'Graphics', icon: <Monitor className="w-4 h-4" /> },
    { id: 'controls', label: 'Controls', icon: <Gamepad2 className="w-4 h-4" /> },
  ];

  const renderSlider = (
    label: string,
    value: number,
    onChange: (vol: number) => void,
    disabled: boolean = false
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-zinc-400 font-mono text-sm uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-zinc-500 text-xs">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={disabled ? 0 : value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
      />
    </div>
  );

  const renderToggle = (
    label: string,
    enabled: boolean,
    onToggle: () => void,
    description?: string
  ) => (
    <button
      onClick={() => { soundManager.uiClick(); onToggle(); }}
      className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="text-left">
        <div className="text-white font-mono text-sm uppercase tracking-widest">{label}</div>
        {description && (
          <div className="text-zinc-500 text-xs mt-1">{description}</div>
        )}
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${
          enabled ? 'bg-white' : 'bg-zinc-700'
        }`}
      >
        <div
          className={`w-4 h-4 mt-1 rounded-full transition-transform ${
            enabled ? 'translate-x-5 bg-black' : 'translate-x-1 bg-zinc-400'
          }`}
        />
      </div>
    </button>
  );

  const renderOptionButtons = <T extends string>(
    options: { value: T; label: string }[],
    current: T,
    onSelect: (value: T) => void
  ) => (
    <div className="flex space-x-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { soundManager.uiClick(); onSelect(opt.value); }}
          className={`flex-1 py-3 rounded-xl font-mono text-sm uppercase tracking-widest transition-colors ${
            current === opt.value
              ? 'bg-white text-black'
              : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:border-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-black/40 backdrop-blur-3xl border-[0.5px] border-white/10 p-6 rounded-[2rem] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            onMouseEnter={() => soundManager.uiHover()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest">
            Settings
          </h2>
          <div className="w-10" />
        </div>

        <div className="flex space-x-2 mb-6 bg-zinc-900/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { soundManager.uiClick(); setActiveTab(tab.id); }}
              className={`flex-1 py-3 rounded-lg font-mono text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-sm uppercase tracking-widest">Master Audio</span>
                <button onClick={handleToggleMute} className="hover:text-white transition-colors">
                  {localMuted ? (
                    <VolumeX className="w-5 h-5 text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
              {renderSlider('Master Volume', localMasterVol, handleMasterVolumeChange, localMuted)}
              {renderSlider(
                'Sound Effects',
                localSfxVol,
                handleSfxVolumeChange,
                localMuted
              )}
              {renderSlider(
                'Music',
                localMusicVol,
                handleMusicVolumeChange,
                localMuted
              )}
            </div>
          )}

          {activeTab === 'graphics' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest mb-2">
                  Particle Quality
                </div>
                {renderOptionButtons(
                  [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ],
                  graphicsSettings.particleQuality,
                  handleParticleQualityChange
                )}
              </div>
              {renderToggle(
                'Screen Shake',
                graphicsSettings.screenShake,
                handleScreenShakeToggle,
                'Enable screen shake on impacts'
              )}
              {renderToggle(
                'Show FPS',
                graphicsSettings.showFPS,
                handleShowFpsToggle,
                'Display frames per second'
              )}
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest mb-2">
                  Click Radius
                </div>
                {renderOptionButtons(
                  [
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ],
                  controlsSettings.clickRadius,
                  handleClickRadiusChange
                )}
              </div>
              {renderToggle(
                'Vibration',
                controlsSettings.vibration,
                handleVibrationToggle,
                'Haptic feedback on mobile'
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={handleResetToDefaults}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-3 bg-transparent border border-white/10 hover:bg-white/5 text-zinc-400 rounded-xl font-mono text-sm uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
        </div>
      </motion.div>
    </div>
  );
}