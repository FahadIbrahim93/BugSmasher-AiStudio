import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { GameModeId } from '../game/GameMode';
import { StatsManager } from '../game/StatsManager';

interface GameCanvasProps {
  gameMode?: GameModeId;
  onGameOver: (score: number) => void;
  onWaveComplete: () => void;
  onStoryTrigger?: (type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => void;
  startBiome?: string;
}

export const GameCanvas = forwardRef<GameEngine | null, GameCanvasProps>(({
  gameMode = 'standard',
  onGameOver,
  onWaveComplete,
  onStoryTrigger,
  startBiome,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useImperativeHandle(ref, (): GameEngine => {
    return new Proxy({} as GameEngine, {
      get: (_, prop) => {
        if (!engineRef.current) return undefined;
        const value = (engineRef.current as unknown as Record<string, unknown>)[prop as string];
        if (typeof value === 'function') {
          return (value as Function).bind(engineRef.current);
        }
        return value;
      },
      set: (_, prop, value) => {
        if (engineRef.current) {
          (engineRef.current as unknown as Record<string, unknown>)[prop as string] = value;
          return true;
        }
        return false;
      }
    });
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    if (startBiome) {
      engine.currentBiome = startBiome;
    }

    engine.setGameMode(gameMode);
    engine.onGameOver = onGameOver;
    engine.onWaveComplete = onWaveComplete;
    engine.onStoryTrigger = onStoryTrigger;

    StatsManager.recordRunStart();
    engine.start();

    return () => {
      engine.destroy();
    };
  }, [onGameOver, onWaveComplete]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block touch-none"
      style={{ cursor: 'crosshair' }}
    />
  );
});
