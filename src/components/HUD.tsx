import React from 'react'
import { GameState } from '@/types'
import { GameConfig } from '@/lib'

interface HUDProps {
  state: GameState
  onPauseToggle: () => void
}

export const HUD: React.FC<HUDProps> = ({ state, onPauseToggle }) => {
  const biome = GameConfig.biomes[state.currentBiome as keyof typeof GameConfig.biomes]

  return (
    <div className="flex items-center justify-between w-[700px] max-w-[95vw] bg-black/60 backdrop-blur-md border border-white/10 px-5 py-3">
      <div className="flex items-center gap-4 font-mono text-xs tracking-wider text-white/60">
        <span><span className="text-white/80">HP</span> {Math.ceil(state.health)}/{state.maxHealth}</span>
        <span className="text-white/30">|</span>
        <span className="text-white/40">{biome?.name ?? state.currentBiome}</span>
        {state.combo > 0 && (
          <>
            <span className="text-white/30">|</span>
            <span className="text-orange-400/80">🔥 {state.combo}x</span>
          </>
        )}
      </div>
      <div className="font-mono text-sm tracking-[0.3em] font-bold text-white/80">
        WAVE {state.wave}
      </div>
      <div className="flex items-center gap-4 font-mono text-xs tracking-wider text-white/60">
        {state.crystals > 0 && <span className="text-cyan-400/70">💎{state.crystals}</span>}
        <span><span className="text-white/80">SCORE</span> {state.score}</span>
        <button
          onClick={onPauseToggle}
          className="px-3 py-1 border border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 font-mono text-[10px] tracking-widest transition-colors"
        >
          {state.isPaused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>
    </div>
  )
}
