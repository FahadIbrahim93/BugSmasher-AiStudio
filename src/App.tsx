import { useState, useEffect, lazy, Suspense } from 'react';
import { MainMenu } from './components/MainMenu';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Preloader } from './components/Preloader';
import { AchievementToast } from './components/AchievementToast';
import { CustomCursor } from './components/CustomCursor';
import type { ChallengeModifierId } from './game/DailyChallengeManager';
import type { GameModeId } from './game/GameMode';

const Game = lazy(() => import('./components/Game').then(m => ({ default: m.Game })));
const SettingsMenu = lazy(() => import('./components/SettingsMenu').then(m => ({ default: m.SettingsMenu })));
const IntelHub = lazy(() => import('./components/IntelHub').then(m => ({ default: m.IntelHub })));

export default function App() {
  const [gameState, setGameState] = useState<'preloading' | 'menu' | 'playing'>('preloading');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [challengeModifiers, setChallengeModifiers] = useState<ChallengeModifierId[] | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameModeId>('standard');
  const [friendChallenge, setFriendChallenge] = useState<{ score: number; wave: number } | null>(null);
  const [customBiome, setCustomBiome] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const score = parseInt(params.get('challengeScore') || '', 10);
    const wave = parseInt(params.get('challengeWave') || '', 10);
    if (!isNaN(score) && !isNaN(wave)) {
      setFriendChallenge({ score, wave });
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-black text-white overflow-hidden font-sans">
        <CustomCursor />
        <AchievementToast />
        {gameState === 'preloading' && (
          <Preloader onComplete={() => { setGameState('menu'); }} />
        )}
        {gameState === 'menu' && (
          <>
            <MainMenu
              friendChallenge={friendChallenge}
              onStart={(challengeMods?: ChallengeModifierId[], mode?: GameModeId, biome?: string) => {
                setChallengeModifiers(challengeMods);
                setGameMode(mode ?? 'standard');
                setCustomBiome(biome);
                setGameState('playing');
              }}
              onSettings={() => { setIsSettingsOpen(true); }}
              onIntel={() => { setIsIntelOpen(true); }}
            />
            <Suspense fallback={null}>
              {isSettingsOpen && (
                <SettingsMenu 
                  onBack={() => { setIsSettingsOpen(false); }} 
                  onOpenArmory={() => {
                    setIsSettingsOpen(false);
                  }}
                />
              )}
              {isIntelOpen && (
                <IntelHub onBack={() => { setIsIntelOpen(false); }} />
              )}
            </Suspense>
          </>
        )}
        {gameState === 'playing' && (
          <Suspense fallback={null}>
            <Game 
              onMainMenu={() => {
                setChallengeModifiers(undefined);
                setCustomBiome(undefined);
                setGameState('menu');
              }} 
              challengeModifiers={challengeModifiers}
              gameMode={gameMode}
              startBiome={customBiome}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}
