import { motion, AnimatePresence } from 'motion/react';

interface HudPerfOverlayProps {
  showPerf: boolean;
  perfData: {
    fps: number;
    frameTime: number;
    bugs: number;
    powerups: number;
    hazards: number;
    particles: number;
  };
  audioStats: {
    oscillatorsSpawned: number;
    throttledEvents: number;
    budgetPerWindow: number;
  };
}

export function HudPerfOverlay({ showPerf, perfData, audioStats }: HudPerfOverlayProps) {
  return (
    <AnimatePresence>
      {showPerf && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 left-6 z-20 bg-black/60 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-md border border-white/10 rounded-2xl p-4 font-mono text-[9px] tracking-wider text-zinc-400 space-y-1.5 select-none pointer-events-auto transition-all"
        >
          <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-1.5 font-bold text-zinc-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-[0.2em] text-[8px]">SYS_DIAGNOSTICS</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex justify-between space-x-4">
              <span className="text-zinc-600 uppercase">FPS:</span>
              <span className="text-emerald-400 font-bold">{perfData.fps}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-zinc-600 uppercase">FTM:</span>
              <span className="text-white font-medium">{perfData.frameTime}ms</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-zinc-600 uppercase">BUGS:</span>
              <span className="text-white font-medium">{perfData.bugs}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-zinc-600 uppercase">ITEMS:</span>
              <span className="text-white font-medium">{perfData.powerups + perfData.hazards}</span>
            </div>
            <div className="col-span-2 flex justify-between border-t border-white/5 pt-1 mt-0.5">
              <span className="text-zinc-600 uppercase">PARTICLES:</span>
              <span className="text-cyan-400 font-medium">{perfData.particles}</span>
            </div>
            <div className="col-span-2 flex justify-between border-t border-white/5 pt-1 mt-0.5">
              <span className="text-zinc-600 uppercase">AUDIO_OSC:</span>
              <span className="text-cyan-400 font-medium">{audioStats.oscillatorsSpawned}</span>
            </div>
            <div className="col-span-2 flex justify-between">
              <span className="text-zinc-600 uppercase">AUDIO_THROT:</span>
              <span className={`font-bold ${audioStats.throttledEvents > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {audioStats.throttledEvents}
              </span>
            </div>
            {audioStats.throttledEvents > 0 && (
              <div className="col-span-2 flex justify-between">
                <span className="text-zinc-600 uppercase">AUDIO_DROPS:</span>
                <span className="text-amber-400 font-bold animate-pulse">THROTTLING</span>
              </div>
            )}
            {audioStats.budgetPerWindow > 0 && (
              <div className="col-span-2 flex justify-between border-t border-white/5 pt-1 mt-0.5">
                <span className="text-zinc-600 uppercase">AUDIO_BUDGET:</span>
                <span className="text-zinc-500 font-medium">{audioStats.budgetPerWindow}/100ms</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
