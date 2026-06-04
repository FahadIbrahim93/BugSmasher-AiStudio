import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { EngineHandle } from '../game/EngineHandle';
import type { GameModeId } from '../game/GameMode';
import type { ChallengeModifierId } from '../game/DailyChallengeManager';
import { StatsManager } from '../game/StatsManager';

interface GameCanvasProps {
  gameMode?: GameModeId;
  onGameOver: (score: number) => void;
  onWaveComplete: () => void;
  onStoryTrigger?: (type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => void;
  challengeModifiers?: ChallengeModifierId[];
}

export const GameCanvas = forwardRef<EngineHandle, GameCanvasProps>(({
  gameMode = 'standard',
  onGameOver,
  onWaveComplete,
  onStoryTrigger,
  challengeModifiers,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useImperativeHandle(ref, (): EngineHandle => {
    return new Proxy({} as EngineHandle, {
      get: (_, prop) => {
        if (!engineRef.current) return undefined;
        const key = prop as keyof GameEngine;
        const value = engineRef.current[key];
        if (typeof value === 'function') {
          return (value as Function).bind(engineRef.current);
        }
        return value;
      },
      set: (_, prop, value) => {
        if (engineRef.current) {
          // Intentionally allow mutation through EngineHandle for HUD/upgrade flows
          // (e.g. score, isPaused, killsInSubwave, missedClicksInSubwave).
          // Narrow cast to declared handle surface (no broad unknown).
          (engineRef.current as unknown as Record<keyof EngineHandle, unknown>)[prop as keyof EngineHandle] = value;
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

    engine.setGameMode(gameMode);
    engine.onGameOver = onGameOver;
    engine.onWaveComplete = onWaveComplete;
    engine.onStoryTrigger = onStoryTrigger;

    StatsManager.recordRunStart();
    engine.start();

    // Apply daily challenge modifiers at engine creation (avoids race on ref in parent)
    if (challengeModifiers && challengeModifiers.length > 0) {
      engine.setChallengeModifiers(challengeModifiers);
    }

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
