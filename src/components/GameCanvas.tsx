import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onWaveComplete: () => void;
}

export const GameCanvas = forwardRef<GameEngine | null, GameCanvasProps>(({ 
  onGameOver,
  onWaveComplete
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useImperativeHandle(ref, () => {
    return {
      get score() { return engineRef.current?.score || 0; },
      set score(val) { if (engineRef.current) engineRef.current.score = val; },
      get health() { return engineRef.current?.health || 0; },
      set health(val) { if (engineRef.current) engineRef.current.health = val; },
      get maxHealth() { return engineRef.current?.maxHealth || 100; },
      set maxHealth(val) { if (engineRef.current) engineRef.current.maxHealth = val; },
      get wave() { return engineRef.current?.wave || 1; },
      get clickRadiusMultiplier() { return engineRef.current?.clickRadiusMultiplier || 1; },
      set clickRadiusMultiplier(val) { if (engineRef.current) engineRef.current.clickRadiusMultiplier = val; },
      get autoTurretLevel() { return engineRef.current?.autoTurretLevel || 0; },
      set autoTurretLevel(val) { if (engineRef.current) engineRef.current.autoTurretLevel = val; },
      resume: () => engineRef.current?.resume()
    } as any;
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onGameOver = onGameOver;
    engine.onWaveComplete = onWaveComplete;

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
