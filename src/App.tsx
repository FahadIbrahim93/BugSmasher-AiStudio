import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Preloader } from './components/Preloader';
import { Settings } from './components/Settings';

export default function App() {
  const [gameState, setGameState] = useState<'preloading' | 'menu' | 'playing' | 'settings'>('preloading');

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-zinc-950 text-white overflow-hidden font-sans">
        {gameState === 'preloading' && (
          <Preloader onComplete={() => setGameState('menu')} />
        )}
        {gameState === 'menu' && (
          <MainMenu 
            onStart={() => setGameState('playing')} 
            onSettings={() => setGameState('settings')}
          />
        )}
        {gameState === 'settings' && (
          <Settings onBack={() => setGameState('menu')} />
        )}
        {gameState === 'playing' && (
          <Game 
            onMainMenu={() => setGameState('menu')} 
            onSettings={() => setGameState('settings')}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
