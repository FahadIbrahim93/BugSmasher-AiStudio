import { motion, type Variants } from 'motion/react';
import { Target, Timer, Activity, ChevronRight, Award } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { StatsManager } from '../game/StatsManager';

interface WaveSummaryModalProps {
  wave: number;
  hits: number;
  misses: number;
  duration: number;
  accuracy: number;
  onClose: () => void;
}

export function WaveSummaryModal({
  wave,
  hits,
  misses,
  duration,
  accuracy,
  onClose
}: WaveSummaryModalProps) {
  const lifetimeStats = StatsManager.getStats();

  const handleProceed = () => {
    soundManager.uiClick();
    onClose();
  };

  const handleHover = () => {
    soundManager.uiHover();
  };

  // Glitch text block variant setup
  const titleGlitchVariants: Variants = {
    animate: {
      x: [0, -3, 3, -1, 1, 0],
      skewX: [0, 5, -5, 2, -2, 0],
      filter: [
        'hue-rotate(0deg)',
        'hue-rotate(90deg)',
        'hue-rotate(-45deg)',
        'hue-rotate(0deg)',
      ],
      transition: {
        duration: 0.45,
        ease: 'easeInOut',
        repeat: 3,
        repeatDelay: 2,
      },
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scaleY: 0.1, scaleX: 1.4, skewX: 25, rotateX: 45 }}
        animate={{ 
          opacity: [0, 1, 0.85, 1], 
          scaleY: [0.1, 1.15, 0.92, 1.03, 1], 
          scaleX: [1.4, 0.85, 1.05, 0.98, 1], 
          skewX: [25, -12, 6, -2, 0],
          rotateX: [45, -5, 2, 0]
        }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-zinc-950 border-2 border-cyan-500/35 rounded-3xl p-6 sm:p-8 text-zinc-300 shadow-[0_0_60px_rgba(6,182,212,0.22)] font-mono flex flex-col relative overflow-hidden"
      >
        {/* Tech scanline grid backdrop overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50 z-10" />

        {/* Dynamic Sweeping Matrix Scanline Indicator */}
        <motion.div
          initial={{ y: '-10%', opacity: 1 }}
          animate={{ y: '110%', opacity: [1, 1, 0.8, 0] }}
          transition={{
            duration: 2.2,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.8
          }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] z-20 pointer-events-none"
        />

        {/* Tech Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl" />
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8 z-20">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center px-3 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-bold uppercase tracking-widest animate-pulse"
          >
            NEURAL SECTOR SECURED
          </motion.div>
          
          <motion.h2 
            variants={titleGlitchVariants}
            animate="animate"
            className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none glitch-title"
          >
            INTEGRITY METRICS W{wave}
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none"
          >
            Combat diagnostics successfully compiled
          </motion.p>
        </div>

        {/* Diagnostic Metrics Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8 z-20">
          {/* Wave Accuracy Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30, skewY: 2 }}
            animate={{ opacity: 1, x: 0, skewY: 0 }}
            transition={{ delay: 0.35, type: 'spring', damping: 15 }}
            className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-2 relative group hover:border-cyan-500/20 transition-colors"
          >
            <div className="flex justify-between items-center text-zinc-500">
              <span className="text-[9px] font-bold tracking-wider uppercase">Sector Accuracy</span>
              <Target className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                {accuracy.toFixed(1)}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-white/5 pt-2 mt-1 flex justify-between">
              <span>HITS / MISSES</span>
              <span className="font-bold text-zinc-300">{hits} / {misses}</span>
            </div>
          </motion.div>

          {/* Wave Clear Time Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30, skewY: -2 }}
            animate={{ opacity: 1, x: 0, skewY: 0 }}
            transition={{ delay: 0.45, type: 'spring', damping: 15 }}
            className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-2 relative group hover:border-emerald-500/20 transition-colors"
          >
            <div className="flex justify-between items-center text-zinc-500">
              <span className="text-[9px] font-bold tracking-wider uppercase">Time To Clear</span>
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {duration.toFixed(1)}s
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-white/5 pt-2 mt-1 flex justify-between">
              <span>TARGET SPEED</span>
              <span className="font-bold text-zinc-300">{(hits / Math.max(1, duration)).toFixed(1)} H/s</span>
            </div>
          </motion.div>
        </div>

        {/* Global Lifetime Dashboard with glitch-like flicker entrance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 0.4, 0.2, 1], y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 mb-6 sm:mb-8 z-20"
        >
          <div className="flex items-center space-x-2 text-zinc-400 pb-2 border-b border-white/5">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" strokeWidth={2.5} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">
              HISTORIC COGNITIVE COMPARISON
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Accuracy Comparison */}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-500 uppercase">Avg Combat Accuracy</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-cyan-400">{(lifetimeStats.averageHitAccuracy || 0).toFixed(1)}%</span>
                <span className="text-[9px] text-zinc-600 uppercase">lifetime</span>
              </div>
            </div>

            {/* Clear Time Comparison */}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-500 uppercase">Avg Clear Time</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-400">{(lifetimeStats.averageTimeToClear || 0).toFixed(1)}s</span>
                <span className="text-[9px] text-zinc-600 uppercase">lifetime</span>
              </div>
            </div>

            {/* Total Sector Completions */}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-500 uppercase">Sectors Restored</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{lifetimeStats.totalWavesCompleted || 0}</span>
                <span className="text-[9px] text-zinc-600 uppercase">sectors</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          onClick={handleProceed}
          onMouseEnter={handleHover}
          className="relative w-full bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/30 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-150 flex items-center justify-center space-x-2 group active:scale-98 z-20"
        >
          <span>PROCEED TO NEXT SECTOR</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={3} />
        </motion.button>
      </motion.div>
    </div>
  );
}
