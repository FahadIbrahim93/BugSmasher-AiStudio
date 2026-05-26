import { motion } from 'motion/react';
import { Volume2, VolumeX, Settings2, ArrowLeft, MousePointer2, Monitor } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useState } from 'react';

export function SettingsMenu({ onBack }: { onBack: () => void }) {
  const [masterVol, setMasterVol] = useState(soundManager.masterVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);
  const [musicVol, setMusicVol] = useState(soundManager.musicVolume);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  const handleMasterVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMasterVolume(val);
    setMasterVol(val);
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSfxVolume(val);
    setSfxVol(val);
  };

  const handleMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMusicVolume(val);
    setMusicVol(val);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const [showPerformance, setShowPerformance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

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
      return !isMobileDevice; // default off on mobile, on on desktop
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

        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Settings2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] font-display">System Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Audio Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
              <Volume2 className="w-4 h-4" />
              <span>Audio Modules</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-white font-mono text-xs uppercase tracking-widest">Master Gain</label>
                  <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={isMuted ? 0 : masterVol} 
                  onChange={handleMasterVolume}
                  className="w-full accent-white opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">SFX Intensity</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={sfxVol} 
                  onChange={handleSfxVolume}
                  className="w-full accent-zinc-500"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">Ambient Stream</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={musicVol} 
                  onChange={handleMusicVolume}
                  className="w-full accent-zinc-500"
                />
              </div>
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
          </div>
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
