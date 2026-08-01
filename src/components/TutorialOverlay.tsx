import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameEngine } from '../game/GameEngine';
import { MousePointer2, Zap, ShieldAlert, Flame, Droplets } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

export function TutorialOverlay({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
  const [step, setStep] = useState(0);
  // Lazy init from localStorage so a completed tutorial never flashes in and
  // we avoid calling setState synchronously inside the effect (lint gate).
  // Guard matches the HUD.tsx lazy-init pattern for SSR safety.
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('bugsmasher_tutorial') !== 'true'
  );
  // Timestamp per step so fallback advancement never soft-locks the tutorial.
  // Kept as a plain ref (reset in the effect when the step changes) to avoid
  // calling impure Date.now() during render.
  const stepEnteredAt = useRef(0);

  // Reset the per-step timer whenever the step changes. Memoized: only touches
  // a ref + the stable setter, so the tutorial effect's exhaustive-deps is
  // satisfied without the effect re-running (and re-stamping the timer) each render.
  const advanceTo = useCallback((next: number) => {
    stepEnteredAt.current = Date.now();
    setStep(next);
  }, []);

  const dismiss = () => {
    soundManager.uiClick();
    localStorage.setItem('bugsmasher_tutorial', 'true');
    setIsVisible(false);
  };

  useEffect(() => {
    // Stamp the start of this step (mount or step change)
    stepEnteredAt.current = Date.now();

    let animationFrameId: number;
    let forcedPowerup = false;

    const checkTutorialState = () => {
      const engine = engineRef.current;
      if (engine) {
        const elapsedInStep = Date.now() - stepEnteredAt.current;
        if (step === 0) {
          // Progress when player gets their first kill (or 15s fallback)
          if (engine.totalKills >= 1 || elapsedInStep > 15000) {
            soundManager.uiClick();
            advanceTo(1);
          }
        } else if (step === 1) {
          // Force a powerup drop on the first kill after advancing to step 1
          if (engine.powerups.length === 0 && engine.totalPowerupsCollected === 0 && !forcedPowerup && engine.bugs.length > 0) {
             engine.forceNextPowerup = true;
             forcedPowerup = true;
          }

          // Progress when player collects their first powerup (or 15s fallback)
          if (engine.totalPowerupsCollected >= 1 || elapsedInStep > 15000) {
            soundManager.uiClick();
            advanceTo(2);
          }
        } else if (step === 2) {
          // RAGE tutorial — progress when the player is visibly building rage (or 20s fallback)
          if (engine.weaponHeat >= 40 || engine.furyActive || elapsedInStep > 20000) {
            soundManager.uiClick();
            advanceTo(3);
          }
        } else if (step === 3) {
          // GOO tutorial — progress once contamination starts appearing (or 20s fallback)
          if (engine.gooSystem.gooAmount >= 10 || elapsedInStep > 20000) {
            soundManager.uiClick();
            advanceTo(4);
          }
        }
      }
      if (isVisible) {
        animationFrameId = requestAnimationFrame(checkTutorialState);
      }
    };

    if (isVisible) {
      animationFrameId = requestAnimationFrame(checkTutorialState);
    }
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [engineRef, step, isVisible, advanceTo]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-[90%] max-w-md">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-red-500/30 flex items-center justify-center animate-pulse bg-red-500/5">
              <MousePointer2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-500 font-mono text-xs uppercase tracking-widest mb-1">Catharsis Directive</p>
              <p className="text-white font-mono text-sm leading-snug">Slam your cursor onto stressful bugs to crush them and vent your anger physically.</p>
            </div>
          </motion.div>
        )}
        
        {step === 1 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-cyan-400/50 flex items-center justify-center animate-pulse bg-cyan-400/10">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-cyan-500 font-mono text-xs uppercase tracking-widest mb-1">Dopamine Shard</p>
              <p className="text-white font-mono text-sm leading-snug">Hover or tap on dropped cores to absorb them and boost your sensory feedback speeds.</p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-orange-500/50 flex items-center justify-center animate-pulse bg-orange-500/10">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-1">The Rage Meter</p>
              <p className="text-white font-mono text-sm leading-snug">Every smash and miss fills your RAGE. Fill it to 100 to erupt into FURY MODE — guaranteed crits, double damage, and explosive AoE smashes.</p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex items-center space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          >
            <div className="w-10 h-10 min-w-10 rounded-full border border-lime-500/50 flex items-center justify-center animate-pulse bg-lime-500/10">
              <Droplets className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-lime-500 font-mono text-xs uppercase tracking-widest mb-1">Goo Contamination</p>
              <p className="text-white font-mono text-sm leading-snug">Smashed bugs leave goo that clouds your viewport. <span className="text-lime-300 font-bold">Hold Q</span> to sweep it up and recycle it into scrap.</p>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/60 backdrop-blur-xl border border-white/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center sm:space-x-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-auto space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-4 flex-grow">
              <div className="w-10 h-10 min-w-10 rounded-full border border-pink-500/50 flex items-center justify-center bg-pink-500/10">
                <ShieldAlert className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-pink-500 font-mono text-xs uppercase tracking-widest mb-1">Sensory Expanders</p>
                <p className="text-white font-mono text-sm leading-snug">Survive the wave to unlock more dramatic explosions, weapons, and cathartic systems. Also try holding a click to charge a Ground Slam!</p>
              </div>
            </div>
            <button 
              onClick={dismiss}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white font-bold font-mono text-xs rounded-full uppercase tracking-widest hover:bg-rose-500 transition-colors flex-shrink-0"
            >
              Let&apos;s Vent
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
