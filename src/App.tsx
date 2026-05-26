import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { SettingsMenu } from './components/SettingsMenu';
import { IntelHub } from './components/IntelHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Preloader } from './components/Preloader';

import { AchievementToast } from './components/AchievementToast';
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  const [gameState, setGameState] = useState<'preloading' | 'menu' | 'playing'>('preloading');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-black text-white overflow-hidden font-sans">
        <CustomCursor />
        <AchievementToast />
        {gameState === 'preloading' && (
          <Preloader onComplete={() => setGameState('menu')} />
        )}
        {gameState === 'menu' && (
          <>
            <MainMenu 
              onStart={() => setGameState('playing')} 
              onSettings={() => setIsSettingsOpen(true)}
              onIntel={() => setIsIntelOpen(true)}
            />
            {isSettingsOpen && (
              <SettingsMenu onBack={() => setIsSettingsOpen(false)} />
            )}
            {isIntelOpen && (
              <IntelHub onBack={() => setIsIntelOpen(false)} />
            )}
          </>
        )}
        {gameState === 'playing' && (
          <Game 
            onMainMenu={() => setGameState('menu')} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
