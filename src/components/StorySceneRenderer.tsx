import React, { useState, useEffect } from 'react'
import { StoryScene } from '@/types'

interface StorySceneRendererProps {
  scene: StoryScene
  onContinue: () => void
}

export const StorySceneRenderer: React.FC<StorySceneRendererProps> = ({ scene, onContinue }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText(''); setIsComplete(false); let i = 0
    const typer = setInterval(() => {
      if (i <= scene.body.length) { setDisplayedText(scene.body.slice(0, i)); i++ }
      else { clearInterval(typer); setIsComplete(true) }
    }, 20)
    return () => clearInterval(typer)
  }, [scene.body])

  return (
    <div className="flex flex-col items-center max-w-xl w-full p-8 space-y-6">
      <div className="text-center border-b border-white/10 pb-4 w-full">
        <div className="text-[10px] text-white/30 font-mono tracking-[0.3em]">TRANSMISSION</div>
        <div className="text-lg font-mono tracking-wider text-white/80 mt-1">{scene.title}</div>
      </div>
      <div className="flex flex-col space-y-4 py-4 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border border-white/20 flex items-center justify-center font-mono text-xs text-white/60">
            {scene.speaker ? scene.speaker[0].toUpperCase() : 'U'}
          </div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            {scene.speaker === 'elara' && 'Dr. Elara'}
            {scene.speaker === 'vance' && 'Agent Vance'}
            {scene.speaker === 'overseer' && 'Unknown Signal'}
            {!scene.speaker && 'System'}
          </div>
        </div>
        <p className="text-white/60 font-mono leading-relaxed text-xs bg-black/40 p-4 border border-white/5 min-h-[80px] whitespace-pre-wrap">
          {displayedText}
          {!isComplete && <span className="animate-pulse text-white/40">|</span>}
        </p>
      </div>
      <button
        onClick={onContinue}
        disabled={!isComplete}
        className={`w-full py-4 border font-mono text-sm tracking-[0.3em] transition-all ${
          isComplete ? 'border-white/30 hover:border-white/60 text-white/80' : 'border-white/5 text-white/20'
        }`}
      >
        {isComplete ? 'ACKNOWLEDGE' : 'RECEIVING...'}
      </button>
    </div>
  )
}
