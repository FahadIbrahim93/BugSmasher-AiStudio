import React from 'react'
import { saveManager } from '@/lib'

interface MainMenuProps {
  onStartGame: () => void
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const highScore = saveManager.getHighScore()
  const gamesPlayed = saveManager.getGamesPlayed()

  return (
    <div className="flex flex-col items-center justify-center space-y-10 max-w-md w-full p-10">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold font-mono tracking-[0.2em] text-white cyber-text-glow">
          BUGSMASHER
        </div>
        <div className="text-xs text-white/40 font-mono tracking-[0.3em] uppercase">
          Tactical QA Protocol
        </div>
        <div className="border-t border-white/10 w-24 mx-auto pt-4 mt-4">
          <div className="text-[10px] text-white/20 font-mono tracking-wider">
            SYSTEM READY // v2.3.0
          </div>
        </div>
      </div>

      {gamesPlayed > 0 && (
        <div className="border border-white/10 w-full p-4 text-center">
          <div className="text-[10px] text-white/30 font-mono tracking-wider">HIGH SCORE</div>
          <div className="text-xl font-bold font-mono tracking-wider text-white/70">{highScore.toLocaleString()}</div>
          <div className="text-[10px] text-white/20 font-mono mt-1">{gamesPlayed} games played</div>
        </div>
      )}

      <button
        onClick={onStartGame}
        className="w-full py-4 bg-transparent border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-mono font-bold tracking-widest text-sm transition-all duration-300 active:scale-95"
      >
        INITIALIZE COMBAT
      </button>

      <div className="text-[10px] text-white/10 font-mono tracking-wider">
        HOPE THEORY © 2026
      </div>
    </div>
  )
}
