import React, { useState, useEffect } from 'react'
import { GameEngine } from '@/core/GameEngine'

const TUTORIAL_KEY = 'bugsmasher_tutorial_complete'

interface TutorialStep {
  title: string
  body: string
  highlight: string
  condition: (_engine: GameEngine) => boolean
}

const STEPS: TutorialStep[] = [
  {
    title: 'SMASH BUGS',
    body: 'Click on the glowing bugs to smash them before they reach your core. Each kill earns you points and crystals.',
    highlight: 'Click any bug to destroy it',
    condition: (e) => e.bugsKilledThisRun >= 3,
  },
  {
    title: 'COLLECT POWERUPS',
    body: 'Destroyed bugs sometimes drop powerups. Click them to activate temporary bonuses like shields, nukes, and multipliers.',
    highlight: 'Click powerups to collect them',
    condition: (e) => e.powerups.length === 0 && e.bugsKilledThisRun >= 5,
  },
  {
    title: 'SURVIVE & UPGRADE',
    body: 'After each wave, you can spend crystals on permanent upgrades. Survive as long as you can and climb the leaderboard.',
    highlight: 'Complete wave 1 to unlock upgrades',
    condition: (e) => e.state.wave >= 2,
  },
]

interface TutorialOverlayProps {
  engine: GameEngine
  onComplete: () => void
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ engine, onComplete }) => {
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(TUTORIAL_KEY)) return
    const check = setInterval(() => {
      if (step < STEPS.length && STEPS[step].condition(engine)) {
        if (step === STEPS.length - 1) {
          clearInterval(check)
          localStorage.setItem(TUTORIAL_KEY, 'true')
          onComplete()
        } else {
          setStep(s => s + 1)
        }
      }
    }, 500)
    return () => clearInterval(check)
  }, [step, engine, onComplete])

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true')
    setDismissed(true)
    onComplete()
  }

  if (dismissed || localStorage.getItem(TUTORIAL_KEY)) return null

  const current = STEPS[step]
  if (!current) return null

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto max-w-md w-full p-4">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-6">
          <div className="text-[10px] text-cyan-400/60 font-mono tracking-[0.3em] mb-2">
            TUTORIAL {step + 1}/{STEPS.length}
          </div>
          <div className="text-sm font-mono text-white/80 mb-3">{current.title}</div>
          <p className="text-xs font-mono text-white/50 leading-relaxed mb-4">{current.body}</p>
          <div className="text-[10px] font-mono text-white/30 italic">{current.highlight}</div>
          <button
            onClick={handleSkip}
            className="mt-4 text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors tracking-wider"
          >
            SKIP TUTORIAL
          </button>
        </div>
      </div>
    </div>
  )
}

export function isTutorialComplete(): boolean {
  return !!localStorage.getItem(TUTORIAL_KEY)
}
