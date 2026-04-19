import { Skull, RotateCcw, Home } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

export function GameOver({ score, onRetry, onMainMenu }: { score: number, onRetry: () => void, onMainMenu: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
      <div className="max-w-md w-full text-center space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <Skull className="w-8 h-8 text-red-500 opacity-90" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight mb-2">CRITICAL FAILURE</h2>
            <div className="h-px w-12 bg-red-500/50 mx-auto my-4" />
            <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">Defense Array Compromised</p>
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-2">Final Score Registration</p>
          <p className="text-5xl sm:text-6xl font-medium font-mono text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{score.toString().padStart(6, '0')}</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onRetry(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Play Again"
            className="group relative w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center transition-all overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              <RotateCcw className="w-4 h-4 mr-3" />
              Reboot System
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
          
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onMainMenu(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Return to Main Menu"
            className="w-full py-4 bg-transparent border-[0.5px] border-white/20 hover:bg-white/5 text-zinc-300 rounded-full font-medium text-sm font-mono uppercase tracking-widest flex items-center justify-center transition-colors"
          >
            <Home className="w-4 h-4 mr-3 opacity-70" />
            Abort Sequence
          </button>
        </div>
      </div>
    </div>
  );
}
