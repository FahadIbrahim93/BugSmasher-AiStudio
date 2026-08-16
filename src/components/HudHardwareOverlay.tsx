import { motion, AnimatePresence } from 'motion/react';

interface HudHardwareOverlayProps {
  showPerfDebug: boolean;
  perfDebugData: {
    fps: number;
    usedMemory: number;
    totalMemory: number;
    limitMemory: number;
    percent: number;
  };
}

export function HudHardwareOverlay({ showPerfDebug, perfDebugData }: HudHardwareOverlayProps) {
  return (
    <AnimatePresence>
      {showPerfDebug && (
        <motion.div
          initial={{ opacity: 0, x: 15, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 right-6 z-20 bg-black/75 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 font-mono text-[9px] w-64 tracking-wider text-cyan-400 space-y-2 select-none pointer-events-auto transition-all"
        >
          <div className="flex items-center space-x-2 border-b border-cyan-500/10 pb-1.5 mb-1.5 font-bold text-cyan-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span className="uppercase tracking-[0.2em] text-[8px]">SYS_HARDWARE_TELEMETRY</span>
            <span className="ml-auto text-[7px] text-cyan-500/80">[LIVE]</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase">SYS_REFRESH_RATE:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                {perfDebugData.fps} <span className="opacity-40 text-[7px]">FPS</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[8px]">
                <span className="text-zinc-500 uppercase">JS_HEAP_USED:</span>
                <span className="text-white font-medium">{perfDebugData.usedMemory} MB</span>
              </div>

              <div className="flex justify-between items-center text-[7.5px] opacity-85">
                <span className="text-zinc-600 uppercase">ALLOC_MEMORY:</span>
                <span className="text-zinc-400">{perfDebugData.totalMemory} MB</span>
              </div>

              <div className="flex justify-between items-center text-[7.5px] opacity-75">
                <span className="text-zinc-600 uppercase">HARDWARE_CAP:</span>
                <span className="text-zinc-500">{perfDebugData.limitMemory} MB</span>
              </div>

              <div className="pt-1">
                <div className="w-full bg-cyan-950/40 rounded-full h-1 border border-cyan-500/10 overflow-hidden relative">
                  <motion.div
                    className="bg-cyan-400 h-full shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                    animate={{ width: `${Math.min(100, perfDebugData.percent)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[7px] text-cyan-600 mt-1 uppercase">
                  <span>PRESSURE:</span>
                  <span>{perfDebugData.percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
