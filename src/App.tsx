import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '@/core/GameEngine'
import { GameState, GamePhase, StoryScene } from '@/types'
import {
  MainMenu,
  HUD,
  UpgradeMenu,
  GameOver,
  StorySceneRenderer,
  TutorialOverlay,
  isTutorialComplete,
  SettingsMenu,
  AccountMenu,
  ProgressionCenter,
  Leaderboard,
} from '@/components'
import { AuthProvider } from '@/contexts/AuthContext'
import { progressionManager } from '@/lib'

export const App = () => {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: 100,
    maxHealth: 100,
    wave: 1,
    gameOver: false,
    isPaused: false,
    isPlaying: false,
    currentBiome: 'neon_core',
    performanceFactor: 1,
    shieldTimer: 0,
    multiplierTimer: 0,
    rapidFireTimer: 0,
    slowMoTimer: 0,
    overdriveTimer: 0,
    freezeTimer: 0,
    magnetTimer: 0,
    upgradeData: {},
    bugsKilled: 0,
    combo: 0,
    crystals: 0,
  })
  const [currentScene, setCurrentScene] = useState<StoryScene | null>(null)
  const [achievementToast, setAchievementToast] = useState<{ id: string; name: string } | null>(null)
  const [gameOverScore, setGameOverScore] = useState(0)
  const [gameOverWave, setGameOverWave] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showProgression, setShowProgression] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const achievementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  const showAchievementToast = useCallback((id: string, name: string) => {
    setAchievementToast({ id, name })
    if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current)
    achievementTimerRef.current = setTimeout(() => setAchievementToast(null), 3000)
  }, [])

  const handleStartGame = useCallback(() => {
    if (!canvasRef.current) return
    if (engineRef.current) {
      engineRef.current.destroy()
      engineRef.current = null
    }
    const engine = new GameEngine(canvasRef.current)
    engineRef.current = engine

    engine.onStateChange = s => setGameState({ ...s })
    engine.onWaveComplete = () => {
      setPhase('upgrade')
    }
    engine.onGameOver = score => {
      setGameOverScore(score)
      setGameOverWave(engine.state.wave)
      setCurrentScore(score)
      setGameState(prev => ({ ...prev, score, gameOver: true, isPlaying: false }))
      setPhase('gameOver')
    }
    engine.onStoryScene = scene => {
      if (scene) {
        setCurrentScene(scene)
        setPhase('story')
        engine.pause()
      }
    }
    engine.onAchievement = (id, name) => showAchievementToast(id, name)

    engine.start()
    setGameState({ ...engine.state })
    setPhase('playing')
    if (!isTutorialComplete()) setShowTutorial(true)
  }, [showAchievementToast])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!engineRef.current || phase !== 'playing') return
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      engineRef.current.queueClick(e.clientX - rect.left, e.clientY - rect.top)
    },
    [phase],
  )

  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!engineRef.current || phase !== 'playing') return
      const touch = e.touches[0]
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      engineRef.current.handleTouchStart(touch.clientX - rect.left, touch.clientY - rect.top)
    },
    [phase],
  )

  const handleCanvasTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!engineRef.current || phase !== 'playing') return
      const touch = e.changedTouches[0]
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      engineRef.current.handleTouchEnd(touch.clientX - rect.left, touch.clientY - rect.top)
    },
    [phase],
  )

  const handlePauseToggle = useCallback(() => {
    if (!engineRef.current) return
    const eng = engineRef.current
    if (eng.state.isPaused) {
      eng.resume()
      setPhase('playing')
    } else {
      eng.pause()
      setPhase('paused')
    }
    setGameState({ ...eng.state })
  }, [])

  const handleResume = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.resume()
    setPhase('playing')
    setGameState({ ...engineRef.current.state })
  }, [])

  const handleUpgrade = useCallback((type: string) => {
    if (!engineRef.current) return
    engineRef.current.purchaseUpgrade(type)
    setGameState({ ...engineRef.current.state })
  }, [])

  const handleNextWave = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.startNextWave()
    setPhase('playing')
  }, [])

  const handleStoryContinue = useCallback(() => {
    if (!engineRef.current) return
    setPhase('playing')
    engineRef.current.resume()
    setCurrentScene(null)
  }, [])

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false)
  }, [])

  const handleUseConsumable = useCallback((type: string) => {
    if (!engineRef.current) return
    const eng = engineRef.current
    if (!progressionManager.useConsumable(type)) return
    if (type === 'repair_kit') {
      eng.state.health = Math.min(eng.state.maxHealth, eng.state.health + 40)
      eng.shake(0.2, 5)
    } else if (type === 'emp_generator') {
      for (const bug of eng.bugs) eng.damageBug(bug, 10)
      eng.particleSystem.spawnShockwave(eng.coreX, eng.coreY, '#ff00ff', 500)
    } else if (type === 'overdrive_chip') {
      eng.overdriveTimer = 15
    }
    eng.emitState()
    setGameState({ ...eng.state })
  }, [])

  return (
    <AuthProvider>
      <div className="relative w-full h-screen bg-black overflow-hidden select-none">
        {phase === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <MainMenu onStartGame={handleStartGame} />
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] font-mono text-white/20 hover:text-white/40 tracking-widest transition-colors"
                >
                  SETTINGS
                </button>
                <button
                  onClick={() => setShowAccountMenu(true)}
                  className="text-[10px] font-mono text-white/20 hover:text-white/40 tracking-widest transition-colors"
                >
                  ACCOUNT
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="text-[10px] font-mono text-white/20 hover:text-white/40 tracking-widest transition-colors"
                >
                  LEADERBOARD
                </button>
              </div>
            </div>
          </div>
        )}

        {(phase === 'playing' || phase === 'paused') && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <HUD state={gameState} onPauseToggle={handlePauseToggle} />
            {phase === 'playing' && (
              <button
                onClick={() => setShowProgression(true)}
                className="text-[9px] font-mono text-white/20 hover:text-white/40 tracking-widest transition-colors border border-white/5 hover:border-white/20 px-3 py-1"
              >
                PROGRESSION
              </button>
            )}
          </div>
        )}

        {phase === 'playing' && showTutorial && engineRef.current && (
          <TutorialOverlay engine={engineRef.current} onComplete={handleTutorialComplete} />
        )}

        {phase === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-8 p-10">
              <div className="text-2xl font-mono text-white/60 tracking-[0.3em]">PAUSED</div>
              <button
                onClick={handleResume}
                className="px-10 py-4 border border-white/20 hover:border-white/40 text-white/80 font-mono text-sm tracking-widest transition-all"
              >
                RESUME
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-10 py-3 border border-white/10 hover:border-white/20 text-white/40 font-mono text-xs tracking-widest transition-all"
              >
                SETTINGS
              </button>
              <button
                onClick={() => {
                  if (engineRef.current) {
                    engineRef.current.destroy()
                    engineRef.current = null
                  }
                  setPhase('menu')
                }}
                className="px-10 py-3 border border-white/10 hover:border-white/20 text-white/40 font-mono text-xs tracking-widest transition-all"
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        )}

        {phase === 'upgrade' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70 backdrop-blur-sm">
            <UpgradeMenu onUpgrade={handleUpgrade} onNextWave={handleNextWave} />
          </div>
        )}

        {phase === 'story' && currentScene && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
            <StorySceneRenderer scene={currentScene} onContinue={handleStoryContinue} />
          </div>
        )}

        {phase === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
            <GameOver score={gameOverScore} wave={gameOverWave} onRestart={handleStartGame} />
          </div>
        )}

        {showSettings && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm">
            <SettingsMenu onClose={() => setShowSettings(false)} />
          </div>
        )}

        {achievementToast && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
            <div className="px-6 py-3 border border-yellow-400/30 bg-black/80 backdrop-blur-md text-center">
              <div className="text-[10px] text-yellow-400/60 font-mono tracking-[0.2em]">ACHIEVEMENT UNLOCKED</div>
              <div className="text-sm text-yellow-400/80 font-mono mt-1">{achievementToast.name}</div>
            </div>
          </div>
        )}

        {showAccountMenu && <AccountMenu onClose={() => setShowAccountMenu(false)} />}

        {showProgression && (
          <ProgressionCenter
            onClose={() => {
              setShowProgression(false)
              engineRef.current?.resume()
            }}
            onUseConsumable={handleUseConsumable}
          />
        )}

        {showLeaderboard && (
          <Leaderboard currentScore={currentScore} currentWave={gameOverWave} onClose={() => setShowLeaderboard(false)} />
        )}

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </AuthProvider>
  )
}

export default App
