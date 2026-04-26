import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Preloader } from './components/Preloader';
import { initializeDatabase, statsManager } from './game/database';

export default function App() {
  const [gameState, setGameState] = useState<'preloading' | 'menu' | 'playing'>('preloading');
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase();
    statsManager.initialize();
    setDbReady(true);
  }, []);

  if (!dbReady) return null;

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-zinc-950 text-white overflow-hidden font-sans">
        {gameState === 'preloading' && (
          <Preloader onComplete={() => setGameState('menu')} />
        )}
        {gameState === 'menu' && (
          <MainMenu onStart={() => setGameState('playing')} />
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
