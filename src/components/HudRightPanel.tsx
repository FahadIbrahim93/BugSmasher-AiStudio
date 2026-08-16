import type { RefObject } from 'react';
import { Shield, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import type { SaveSyncStatus } from '../game/SaveManager';
import type { GameEngine } from '../game/GameEngine';
import { ActivePowerups } from './HudActivePowerups';
import { ConsumableBar } from './HudConsumableBar';
import { ActiveSkillsBar } from './HudActiveSkillsBar';

interface HudRightPanelProps {
  engineRef: RefObject<GameEngine | null>;
  syncStatus: SaveSyncStatus;
  streakRef: RefObject<HTMLDivElement | null>;
  streakCountRef: RefObject<HTMLSpanElement | null>;
  shieldIconRef: RefObject<SVGSVGElement | null>;
  healthBarRef: RefObject<HTMLDivElement | null>;
  healthTextRef: RefObject<HTMLSpanElement | null>;
  isPaused: boolean;
  onPauseToggle?: () => void;
}

export function HudRightPanel({
  engineRef,
  syncStatus,
  streakRef,
  streakCountRef,
  shieldIconRef,
  healthBarRef,
  healthTextRef,
  isPaused,
  onPauseToggle,
}: HudRightPanelProps) {
  return (
    <div className="flex flex-col items-end space-y-3 pointer-events-none">
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-3">
          {/* Cloud Sync Status Indicator */}
          <AnimatePresence mode="popLayout">
            {syncStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 15 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="flex items-center space-x-2 bg-black/65 border border-white/10 px-3 py-1.5 rounded-full select-none pointer-events-none shadow-lg font-mono"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncStatus === 'syncing' ? 'bg-cyan-400' : syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-red-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncStatus === 'syncing' ? 'bg-cyan-500' : syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></span>
                </span>
                <span className={`tracking-widest uppercase font-black text-[8px] sm:text-[9px] ${
                  syncStatus === 'syncing' ? 'text-cyan-400 font-bold' : syncStatus === 'synced' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                }`}>
                  {syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'synced' ? 'CLOUD_SECURED' : 'SYNC_FAILED'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streak Indicator - Repositioned to top-right corner */}
          <div ref={streakRef} className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 py-1.5 rounded-full border border-white/20 shadow-xl opacity-0 transition-opacity duration-300">
             <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Streak</span>
             <span ref={streakCountRef} className="text-white font-mono font-black italic scale-125 px-1 leading-none text-sm">0</span>
          </div>

          <button
            onClick={() => { soundManager.uiClick(); onPauseToggle?.(); }}
            className="flex items-center justify-center glass-panel p-2 sm:p-2.5 rounded-full border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-[0_4_20px_rgba(0,0,0,0.5)] pointer-events-auto"
            aria-label={isPaused ? "Resume Game" : "Pause Game"}
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />}
          </button>
        </div>

        {/* Active Powerups Display */}
        <ActivePowerups engineRef={engineRef} />
      </div>

      <div className="flex flex-col items-end space-y-4">
        <div className="flex items-center space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] pointer-events-none hover:border-white/20 transition-all">
          <Shield ref={shieldIconRef} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
          <div className="w-20 sm:w-32 h-1.5 sm:h-2 bg-zinc-900 rounded-full overflow-hidden ring-1 ring-white/5">
            <div
              ref={healthBarRef}
              className="h-full transition-all duration-300 bg-gradient-to-r from-emerald-400 via-emerald-300 to-white"
              style={{ width: '100%' }}
            />
          </div>
          <span ref={healthTextRef} className="text-sm sm:text-lg font-bold text-white font-mono w-8 text-right cyber-text-glow">100</span>
        </div>

        {/* Consumable Bar */}
        <ConsumableBar engineRef={engineRef} />

        {/* Active Skills Bar */}
        <ActiveSkillsBar engineRef={engineRef} />
      </div>
    </div>
  );
}
