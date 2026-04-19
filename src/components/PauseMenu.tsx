import { motion } from 'motion/react';
import { Volume2, VolumeX, Home, Play, Settings2 } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useEffect, useState } from 'react';

export function PauseMenu({ 
  onResume, 
  onMainMenu 
}: { 
  onResume: () => void, 
  onMainMenu: () => void 
}) {
  const [volTracker, setVolTracker] = useState(soundManager.volume);
  const [muteTracker, setMuteTracker] = useState(soundManager.isMuted);

  // Sync state if it was changed externally
  useEffect(() => {
    setVolTracker(soundManager.volume);
    setMuteTracker(soundManager.isMuted);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    soundManager.setVolume(newVol);
    setVolTracker(newVol);
  };

  const handleToggleMute = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuteTracker(isNowMuted);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full bg-black/40 backdrop-blur-3xl border-[0.5px] border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-white/5">
          <Settings2 className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-white font-display mb-2 uppercase tracking-widest">
          System Paused
        </h2>
        <p className="text-zinc-500 font-mono tracking-widest text-sm uppercase mb-10 text-center">
          Operations Suspended
        </p>
        
        <div className="w-full space-y-8 mb-10">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-zinc-400 font-mono text-sm uppercase tracking-widest">
              <span>Master Audio</span>
              <button onClick={handleToggleMute} className="hover:text-white transition-colors">
                {muteTracker ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={muteTracker ? 0 : volTracker}
              onChange={handleVolumeChange}
              disabled={muteTracker}
              className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        <div className="w-full flex flex-col space-y-4">
          <button 
            onClick={() => { soundManager.uiClick(); onResume(); }}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest transition-all"
          >
            <span className="flex items-center justify-center">
              <Play className="w-4 h-4 mr-3" />
              Resume Operations
            </span>
          </button>
          
          <button 
            onClick={() => { soundManager.uiClick(); onMainMenu(); }}
            onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-4 bg-transparent border-[0.5px] border-white/20 hover:bg-white/5 text-zinc-300 rounded-full font-medium text-sm font-mono uppercase tracking-widest transition-colors flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-3 opacity-70" />
            Abort Run
          </button>
        </div>
      </motion.div>
    </div>
  );
}
