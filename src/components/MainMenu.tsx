import { Bug, Settings2, Trophy, User, BookOpen, ListOrdered, Zap } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { IntelHub } from './IntelHub';
import { Leaderboard } from './Leaderboard';

export function MainMenu({ onStart, onSettings, onIntel }: { onStart: () => void, onSettings: () => void, onIntel?: () => void }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const highScore = SaveManager.getHighScore();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#050505] relative p-4">
      {isAccountOpen && <AccountMenu onClose={() => setIsAccountOpen(false)} />}
      {isLeaderboardOpen && <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />}
      
      {/* Remove previous gradient backgrounds as we want absolute minimalist black */}
      <div className="z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6">
            <Bug className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-80" />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-display uppercase">
            BUGSMASHER
          </h1>
          <div className="h-px w-24 bg-white/20 mx-auto mt-4 mb-6" />

          {highScore > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 mx-auto w-fit">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center space-x-3">
                <Trophy className="w-4 h-4 text-yellow-500 opacity-80" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-black">Archive Best</span>
                  <span className="text-sm font-mono text-white tracking-widest">{highScore.toString().padStart(6, '0')}</span>
                </div>
              </div>
              
              {ProgressionManager.getData().prestigeLevel > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-cyan-400 opacity-80" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] text-cyan-500/60 uppercase font-mono tracking-widest font-black">Prestige Rank</span>
                    <span className="text-sm font-mono text-cyan-400 tracking-widest">RANK {ProgressionManager.getData().prestigeLevel}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-medium tracking-[0.2em] font-mono">
            DEFEND THE CORE. SMASH THE SWARM.
          </p>
        </div>
        
        <div className="w-full flex flex-col items-center space-y-6 mt-12">
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onStart(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Start Game"
            className="group relative px-12 py-4 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 font-bold">Initialize Sequence</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onSettings(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Settings2 className="w-4 h-4" />
            <span>Hardware Tuning</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsLeaderboardOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Nexus Rankings</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsAccountOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <User className="w-4 h-4" />
            <span>Terminal Access</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onIntel?.(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <BookOpen className="w-4 h-4" />
            <span>System Intel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
