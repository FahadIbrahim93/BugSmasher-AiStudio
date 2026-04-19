import { Bug, Settings2 } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

export function MainMenu({ onStart, onSettings }: { onStart: () => void; onSettings: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#050505] relative p-4">
      {/* Remove previous gradient backgrounds as we want absolute minimalist black */}
      <div className="z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6">
            <Bug className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-80" />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-display">
            BUGSMASHER
          </h1>
          <div className="h-px w-24 bg-white/20 mx-auto mt-4 mb-6" />
          <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-medium tracking-[0.2em] font-mono">
            DEFEND THE CORE. SMASH THE SWARM.
          </p>
        </div>
        
        <div className="w-full flex flex-col space-y-4 justify-center mt-12">
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onStart(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Start Game"
            className="group relative px-12 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden"
          >
            <span className="relative z-10">Initialize Sequence</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
          
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onSettings(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Settings"
            className="px-12 py-4 bg-transparent border border-white/20 hover:bg-white/5 text-zinc-300 rounded-full font-medium text-sm sm:text-base font-mono uppercase tracking-widest transition-colors flex items-center justify-center space-x-3"
          >
            <Settings2 className="w-4 h-4" />
            <span>System Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
