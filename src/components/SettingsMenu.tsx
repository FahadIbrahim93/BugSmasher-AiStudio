import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Settings2, ArrowLeft, MousePointer2, Monitor, Gem, Accessibility, Keyboard, Plus, Minus, Music, Activity, Sliders } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useState, useEffect, useCallback } from 'react';
import {
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
  type ColorblindMode,
  type DifficultyId,
} from '../game/AccessibilitySettings';
import {
  loadControlBindings,
  saveControlBindings,
  type ControlBindings,
} from '../game/ControlBindings';

export function SettingsMenu({ onBack, onOpenArmory }: { onBack: () => void; onOpenArmory?: () => void }) {
  const [masterVol, setMasterVol] = useState(soundManager.masterVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);
  const [musicVol, setMusicVol] = useState(soundManager.musicVolume);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [sfxMuted, setSfxMuted] = useState(soundManager.sfxMuted);
  const [musicMuted, setMusicMuted] = useState(soundManager.musicMuted);
  const [a11y, setA11y] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  const [prevMasterVol, setPrevMasterVol] = useState(soundManager.masterVolume || 1.0);
  const [prevSfxVol, setPrevSfxVol] = useState(soundManager.sfxVolume || 0.8);
  const [prevMusicVol, setPrevMusicVol] = useState(soundManager.musicVolume || 0.6);

  const updateA11y = (patch: Partial<AccessibilitySettings>) => {
    const next = { ...a11y, ...patch };
    setA11y(next);
    saveAccessibilitySettings(next);
  };

  const handleMasterVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMasterVolume(val);
    setMasterVol(val);
    if (val > 0) {
      setPrevMasterVol(val);
      if (isMuted) {
        soundManager.toggleMute();
        setIsMuted(false);
      }
    }
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSfxVolume(val);
    setSfxVol(val);
    if (val > 0) setPrevSfxVol(val);
  };

  const handleMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMusicVolume(val);
    setMusicVol(val);
    if (val > 0) setPrevMusicVol(val);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleSfxMute = () => {
    soundManager.uiClick();
    const muted = soundManager.toggleSfxMute();
    setSfxMuted(muted);
  };

  const toggleMusicMute = () => {
    soundManager.uiClick();
    const muted = soundManager.toggleMusicMute();
    setMusicMuted(muted);
  };

  const adjustVolume = (type: 'master' | 'sfx' | 'music', delta: number) => {
    soundManager.uiClick();
    if (type === 'master') {
      const next = Math.max(0, Math.min(1, parseFloat((masterVol + delta).toFixed(2))));
      soundManager.setMasterVolume(next);
      setMasterVol(next);
      if (next > 0) {
        setPrevMasterVol(next);
        if (isMuted) {
          soundManager.toggleMute();
          setIsMuted(false);
        }
      }
    } else if (type === 'sfx') {
      const next = Math.max(0, Math.min(1, parseFloat((sfxVol + delta).toFixed(2))));
      soundManager.setSfxVolume(next);
      setSfxVol(next);
      if (next > 0) setPrevSfxVol(next);
    } else if (type === 'music') {
      const next = Math.max(0, Math.min(1, parseFloat((musicVol + delta).toFixed(2))));
      soundManager.setMusicVolume(next);
      setMusicVol(next);
      if (next > 0) setPrevMusicVol(next);
    }
  };

  const applyPreset = (preset: 'brutal' | 'tactical' | 'ambient' | 'stealth') => {
    soundManager.uiClick();
    if (preset === 'brutal') {
      soundManager.setMasterVolume(1.0);
      soundManager.setSfxVolume(1.0);
      soundManager.setMusicVolume(0.85);
      soundManager.sfxMuted = false;
      soundManager.musicMuted = false;
      soundManager.isMuted = false;
      setMasterVol(1.0);
      setSfxVol(1.0);
      setMusicVol(0.85);
      setIsMuted(false);
      setSfxMuted(false);
      setMusicMuted(false);
    } else if (preset === 'tactical') {
      soundManager.setMasterVolume(0.8);
      soundManager.setSfxVolume(0.95);
      soundManager.setMusicVolume(0.25);
      soundManager.sfxMuted = false;
      soundManager.musicMuted = false;
      soundManager.isMuted = false;
      setMasterVol(0.8);
      setSfxVol(0.95);
      setMusicVol(0.25);
      setIsMuted(false);
      setSfxMuted(false);
      setMusicMuted(false);
    } else if (preset === 'ambient') {
      soundManager.setMasterVolume(0.7);
      soundManager.setSfxVolume(0.15);
      soundManager.setMusicVolume(0.9);
      soundManager.sfxMuted = false;
      soundManager.musicMuted = false;
      soundManager.isMuted = false;
      setMasterVol(0.7);
      setSfxVol(0.15);
      setMusicVol(0.9);
      setIsMuted(false);
      setSfxMuted(false);
      setMusicMuted(false);
    } else if (preset === 'stealth') {
      soundManager.setMasterVolume(0.0);
      soundManager.setSfxVolume(0.0);
      soundManager.setMusicVolume(0.0);
      if (!soundManager.isMuted) soundManager.toggleMute();
      if (!soundManager.sfxMuted) soundManager.toggleSfxMute();
      if (!soundManager.musicMuted) soundManager.toggleMusicMute();
      setMasterVol(0.0);
      setSfxVol(0.0);
      setMusicVol(0.0);
      setIsMuted(soundManager.isMuted);
      setSfxMuted(soundManager.sfxMuted);
      setMusicMuted(soundManager.musicMuted);
    }
  };

  const [bindings, setBindings] = useState<ControlBindings>(loadControlBindings);
  const [listeningFor, setListeningFor] = useState<string | null>(null);

  const handleKeyCapture = useCallback((e: KeyboardEvent) => {
    if (!listeningFor) return;
    e.preventDefault();
    e.stopPropagation();
    const newBindings = { ...bindings, [listeningFor]: e.code };
    setBindings(newBindings);
    saveControlBindings(newBindings);
    setListeningFor(null);
    soundManager.uiClick();
  }, [listeningFor, bindings]);

  useEffect(() => {
    if (listeningFor) {
      window.addEventListener('keydown', handleKeyCapture, true);
      return () => window.removeEventListener('keydown', handleKeyCapture, true);
    }
  }, [listeningFor, handleKeyCapture]);

  const [showPerformance, setShowPerformance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

  const [perfDebugEnabled, setPerfDebugEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_perf_debug_enabled') === 'true';
    }
    return false;
  });

  const [clickCount, setClickCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_debug_unlocked') === 'true';
    }
    return false;
  });

  const handleHeaderClick = () => {
    if (isUnlocked) return;
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    soundManager.uiClick();
    
    if (nextCount >= 5) {
      setIsUnlocked(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_debug_unlocked', 'true');
      }
      soundManager.powerup('multiplier');
    }
  };

  const togglePerfDebug = () => {
    const newValue = !perfDebugEnabled;
    setPerfDebugEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_perf_debug_enabled', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_perf_debug_changed', { detail: newValue }));
    }
  };

  const [highFidelityVFX, setHighFidelityVFX] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_high_fidelity_vfx');
      if (saved !== null) {
        return saved === 'true';
      }
      // Detect mobile device
      const isMobileDevice = (window.innerWidth < 768) || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0) ||
        ('ontouchstart' in window);
      return !isMobileDevice;
    }
    return true;
  });

  const toggleVFX = () => {
    const newValue = !highFidelityVFX;
    setHighFidelityVFX(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_high_fidelity_vfx', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_vfx_settings_changed', { detail: newValue }));
    }
  };

  const togglePerformanceStats = () => {
    const newValue = !showPerformance;
    setShowPerformance(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_show_perf_stats', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_perf_stats_changed', { detail: newValue }));
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center z-[60] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={() => { soundManager.uiClick(); onBack(); }}
          className="absolute top-8 left-8 p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div 
          onClick={handleHeaderClick}
          className="flex flex-col items-center mb-12 cursor-pointer select-none group"
          title="Click structure to probe diagnostics"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-white/20 group-active:scale-95 transition-all">
            <Settings2 className="w-8 h-8 text-white group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] font-display transition-colors group-hover:text-zinc-200">System Settings</h2>
          {clickCount > 0 && clickCount < 5 && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest mt-1.5"
            >
              Signal probe response: {5 - clickCount} cycles remaining
            </motion.p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Audio Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
              <Volume2 className="w-4 h-4" />
              <span>Audio Modules</span>
            </div>

            <div className="space-y-6">
              {/* Master Gain Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <label className="text-white font-mono text-xs uppercase tracking-widest">
                      Master Gain <span className="text-emerald-400 font-bold ml-1">{Math.round((isMuted ? 0 : masterVol) * 100)}%</span>
                    </label>
                  </div>
                  <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors p-1" title="Mute/Unmute Master">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => adjustVolume('master', -0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={isMuted ? 0 : masterVol} 
                    onChange={handleMasterVolume}
                    className="flex-1 accent-white opacity-80 hover:opacity-100 transition-opacity"
                  />
                  <button 
                    onClick={() => adjustVolume('master', 0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* SFX Intensity Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    <label className="text-white font-mono text-xs uppercase tracking-widest">
                      SFX Intensity <span className={`${sfxMuted ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'} ml-1`}>{sfxMuted ? 'MUTED' : `${Math.round(sfxVol * 100)}%`}</span>
                    </label>
                  </div>
                  <button onClick={toggleSfxMute} className="text-zinc-500 hover:text-white transition-colors p-1" title="Mute/Unmute SFX">
                    {sfxMuted || sfxVol === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
                <div className={`flex items-center space-x-3 transition-opacity ${sfxMuted ? 'opacity-40' : 'opacity-100'}`}>
                  <button 
                    onClick={() => adjustVolume('sfx', -0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    disabled={sfxMuted}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={sfxMuted ? 0 : sfxVol} 
                    onChange={handleSfxVolume}
                    className="flex-1 accent-zinc-400"
                    disabled={sfxMuted}
                  />
                  <button 
                    onClick={() => adjustVolume('sfx', 0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    disabled={sfxMuted}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Music Volume Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <Music className="w-3.5 h-3.5 text-zinc-400" />
                    <label className="text-white font-mono text-xs uppercase tracking-widest">
                      Ambient Stream <span className={`${musicMuted ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'} ml-1`}>{musicMuted ? 'MUTED' : `${Math.round(musicVol * 100)}%`}</span>
                    </label>
                  </div>
                  <button onClick={toggleMusicMute} className="text-zinc-500 hover:text-white transition-colors p-1" title="Mute/Unmute Music">
                    {musicMuted || musicVol === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
                <div className={`flex items-center space-x-3 transition-opacity ${musicMuted ? 'opacity-40' : 'opacity-100'}`}>
                  <button 
                    onClick={() => adjustVolume('music', -0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    disabled={musicMuted}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={musicMuted ? 0 : musicVol} 
                    onChange={handleMusicVolume}
                    className="flex-1 accent-zinc-400"
                    disabled={musicMuted}
                  />
                  <button 
                    onClick={() => adjustVolume('music', 0.05)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    disabled={musicMuted}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tactical Equalizer/Spectral Balance Display */}
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-zinc-500 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="uppercase tracking-widest text-[8px] text-zinc-500">Spectral Balance / Oscilloscope</span>
                  <span className="text-emerald-500 animate-pulse text-[8px] font-bold">ANALYZER ON</span>
                </div>
                <div className="h-14 flex items-end justify-between px-1 gap-1 pt-1">
                  {Array.from({ length: 16 }).map((_, i) => {
                    let targetVolume = masterVol;
                    let colorClass = "from-emerald-500/80 to-teal-400/80";
                    if (isMuted) {
                      targetVolume = 0;
                    } else if (i % 3 === 0) {
                      targetVolume = masterVol;
                      colorClass = "from-emerald-500/80 to-teal-400/80 shadow-[0_0_6px_rgba(16,185,129,0.2)]";
                    } else if (i % 3 === 1) {
                      targetVolume = sfxMuted ? 0 : sfxVol;
                      colorClass = "from-amber-500/80 to-orange-400/80 shadow-[0_0_6px_rgba(245,158,11,0.2)]";
                    } else {
                      targetVolume = musicMuted ? 0 : musicVol;
                      colorClass = "from-cyan-500/80 to-blue-400/80 shadow-[0_0_6px_rgba(6,182,212,0.2)]";
                    }

                    // Dynamic math-based bounce height simulation
                    const offset = i * 0.4;
                    const speed = 2.0;
                    const activeTime = typeof window !== 'undefined' ? (Date.now() / 1000) * speed : 1.0;
                    const bounceFactor = targetVolume > 0 ? (25 + Math.sin(activeTime + offset) * 20 + targetVolume * 55) : 0;
                    const finalHeight = `${Math.min(100, Math.max(3, bounceFactor))}%`;

                    return (
                      <div key={i} className="flex-1 h-full bg-zinc-950/60 rounded-sm flex items-end overflow-hidden">
                        <motion.div
                          animate={{ height: finalHeight }}
                          transition={{ type: "spring", stiffness: 220, damping: 15 }}
                          className={`w-full bg-gradient-to-t ${colorClass} rounded-t-xs`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[7px] uppercase tracking-wider select-none px-1 text-zinc-600">
                  <span>[MASTER_FREQ]</span>
                  <span>[SFX_SPECTRUM]</span>
                  <span>[AMBIENT_STREAM]</span>
                </div>
              </div>

              {/* Tactical Audio Presets */}
              <div className="space-y-2">
                <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Soundscape Presets</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'brutal', label: 'Max Brutal', hint: 'MSTR 100, SFX 100, MUS 85' },
                    { id: 'tactical', label: 'Tactical', hint: 'MSTR 80, SFX 95, MUS 25' },
                    { id: 'ambient', label: 'Ambient', hint: 'MSTR 70, SFX 15, MUS 90' },
                    { id: 'stealth', label: 'Pure Silent', hint: 'MSTR 0, SFX 0, MUS 0' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id as 'brutal' | 'tactical' | 'ambient' | 'stealth')}
                      className="px-1 py-2 text-[8px] font-mono uppercase tracking-wider border border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all text-center flex flex-col items-center justify-center leading-tight gap-0.5"
                      title={preset.hint}
                    >
                      <span className="font-bold">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Preview Button */}
              {(masterVol > 0 || sfxVol > 0 || musicVol > 0) && !isMuted && (
                <button
                  onClick={() => {
                    soundManager.init();
                    soundManager.powerup('multiplier');
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white hover:border-white/15 transition-all text-zinc-400 font-mono text-[9px] uppercase tracking-widest cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview SFX Amplitude</span>
                </button>
              )}
            </div>
          </section>

          {/* Graphics & Controls */}
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <Monitor className="w-4 h-4" />
                <span>Visuals</span>
              </div>
              <div 
                onClick={() => { soundManager.uiClick(); toggleVFX(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group animate-fade-in"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">High Fidelity VFX</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Glows, heavy shadow blurs & complex particles</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${highFidelityVFX ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${highFidelityVFX ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              <div 
                onClick={() => { soundManager.uiClick(); togglePerformanceStats(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">Show Performance Stats</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Monitor FPS & Engine diagnostics</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showPerformance ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showPerformance ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <MousePointer2 className="w-4 h-4" />
                <span>Input Method</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Left Click / Tap</span>
                  <span className="text-white uppercase">Eliminate</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Hover / Collect</span>
                  <span className="text-white uppercase">Powerups</span>
                </div>
              </div>
            </section>

            {/* Control Remapping */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <Keyboard className="w-4 h-4" />
                <span>Key Bindings</span>
              </div>
              {(['fire', 'dash', 'pause'] as const).map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono text-xs uppercase">{action}</span>
                  <button
                    onClick={() => {
                      soundManager.uiClick();
                      setListeningFor(listeningFor === action ? null : action);
                    }}
                    className={`relative px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all ${
                      listeningFor === action
                        ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 animate-pulse shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {listeningFor === action ? 'Press key...' : bindings[action]}
                  </button>
                </div>
              ))}
              <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-wider">
                Click a binding, then press the desired key
              </p>
            </section>
          </div>
        </div>

        {/* Accessibility */}
        <section className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
            <Accessibility className="w-4 h-4" />
            <span>Accessibility</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              Difficulty
              <select
                value={a11y.difficulty}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ difficulty: e.target.value as DifficultyId }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              Colorblind Assist
              <select
                value={a11y.colorblindMode}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ colorblindMode: e.target.value as ColorblindMode, showEnemyShapes: e.target.value !== 'off' }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="off">Off</option>
                <option value="protanopia">Protanopia</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </label>
          </div>
          {[
            { key: 'reducedMotion' as const, label: 'Reduced Motion', hint: 'Disables screen shake' },
            { key: 'showEnemyShapes' as const, label: 'Enemy Shape Icons', hint: 'Shape markers on bugs' },
            { key: 'gamepadEnabled' as const, label: 'Gamepad Support', hint: 'Left stick aim, A / RT fire' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => { soundManager.uiClick(); updateA11y({ [item.key]: !a11y[item.key] }); }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-zinc-400 font-mono text-xs uppercase">{item.label}</span>
                <p className="text-[9px] text-zinc-500 font-mono">{item.hint}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative ${a11y[item.key] ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${a11y[item.key] ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </section>

        {/* Developer Diagnostics (Hidden Easter Egg) */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.section 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="pt-8 border-t border-cyan-500/20 space-y-6 overflow-hidden"
            >
              <div className="flex items-center space-x-3 text-cyan-400 font-mono text-xs uppercase tracking-widest border-b border-cyan-500/10 pb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span>Architect Console / System Diagnostics</span>
                <span className="ml-auto text-[8px] bg-cyan-950/65 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded uppercase tracking-[0.2em]">DEV_LEVEL_ACCESS</span>
              </div>

              <div
                onClick={togglePerfDebug}
                className="flex items-center justify-between p-4 bg-cyan-950/10 rounded-2xl border border-cyan-500/15 hover:bg-cyan-950/20 hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-cyan-300 group-hover:text-cyan-200 transition-colors font-mono text-xs uppercase flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    Real-Time Performance Diagnostics HUD
                  </span>
                  <p className="text-[9px] text-cyan-500/80 font-mono mt-1 leading-normal">
                    Renders precise high-frequency telemetry including FPS and active JS heap utilization overlay.
                  </p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${perfDebugEnabled ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${perfDebugEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Cosmetics Shortcut */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <button
            onClick={() => {
              soundManager.uiClick();
              onOpenArmory?.();
            }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <Gem className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Armory</span>
                <p className="text-[10px] font-mono text-zinc-500">Cursor skins, core themes & cosmetics</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => { soundManager.uiClick(); onBack(); }}
            className="px-12 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
          >
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
