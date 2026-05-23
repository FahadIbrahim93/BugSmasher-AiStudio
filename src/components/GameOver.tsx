import React, { useState } from 'react'
import { saveManager, achievementSystem, shareDeathCard } from '@/lib'

interface GameOverProps {
  score: number
  wave: number
  onRestart: () => void
}

export const GameOver: React.FC<GameOverProps> = ({ score, wave, onRestart }) => {
  const isNewHighScore = score > 0 && score >= saveManager.getHighScore()
  const unlockedCount = achievementSystem.getUnlockCount()
  const totalAchievements = achievementSystem.getTotalCount()
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    try {
      await shareDeathCard({
        score,
        wave,
        bugsKilled: saveManager.getTotalBugsKilled(),
        combo: 0,
        prestigeLevel: saveManager.getPrestigeLevel(),
        biome: 'neon_core',
        highestWave: saveManager.getHighestWave(),
      })
    } catch { /* user cancelled share */ }
    setSharing(false)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 max-w-md w-full p-10">
      <div className="text-center space-y-4">
        <div className="text-4xl font-bold font-mono tracking-[0.2em] text-white/60">
          CONNECTION LOST
        </div>
        <div className="text-xs text-white/20 font-mono tracking-[0.3em]">
          CORE INTEGRITY BREACHED
        </div>
      </div>

      <div className="border border-white/10 w-full p-6 text-center space-y-3">
        <div className="text-[10px] text-white/30 font-mono tracking-wider">FINAL SCORE</div>
        <div className="text-3xl font-bold font-mono tracking-wider text-white/80">{score}</div>
        {isNewHighScore && <div className="text-[10px] text-yellow-400/60 font-mono tracking-widest">NEW HIGH SCORE</div>}

        <div className="border-t border-white/10 pt-3 mt-3 grid grid-cols-2 gap-3 text-left">
          <div>
            <div className="text-[9px] text-white/20 font-mono">WAVE</div>
            <div className="text-sm text-white/60 font-mono">{wave}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/20 font-mono">BEST WAVE</div>
            <div className="text-sm text-white/60 font-mono">{saveManager.getHighestWave()}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/20 font-mono">TOTAL KILLS</div>
            <div className="text-sm text-white/60 font-mono">{saveManager.getTotalBugsKilled().toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/20 font-mono">ACHIEVEMENTS</div>
            <div className="text-sm text-white/60 font-mono">{unlockedCount}/{totalAchievements}</div>
          </div>
        </div>
      </div>

      <div className="w-full flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-4 border border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 font-mono text-sm tracking-[0.3em] transition-all"
        >
          RETRY
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 py-4 border border-white/10 hover:border-white/30 text-white/40 hover:text-white/60 font-mono text-xs tracking-[0.3em] transition-all"
        >
          {sharing ? 'GENERATING...' : 'SHARE CARD'}
        </button>
      </div>
    </div>
  )
}
