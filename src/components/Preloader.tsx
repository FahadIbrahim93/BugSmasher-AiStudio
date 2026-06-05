import { useEffect, useState } from 'react';
import { assetManager } from '../game/AssetManager';
import { Brand } from './Brand';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Radio, Database, Cpu, ShieldCheck, Crosshair, Volume2 } from 'lucide-react';
import { t } from '../i18n';

const SYSTEM_TICKERS = [
  { icon: Radio, key: 'preloader.readout1' },
  { icon: Database, key: 'preloader.readout2' },
  { icon: Cpu, key: 'preloader.readout3' },
  { icon: ShieldCheck, key: 'preloader.readout4' },
  { icon: Crosshair, key: 'preloader.readout5' },
  { icon: Zap, key: 'preloader.readout6' },
  { icon: Volume2, key: 'preloader.readout7' },
] as const;

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [readoutIdx, setReadoutIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = setInterval(() => {
      if (!mounted) return;
      setReadoutIdx((i) => Math.min(i + 1, SYSTEM_TICKERS.length));
    }, 380);

    assetManager.preloadAll((p) => {
      if (mounted) setProgress(p);
    }).then(() => {
      if (mounted) {
        setTimeout(() => onComplete(), 1200);
      }
    });

    return () => {
      mounted = false;
      clearInterval(tick);
    };
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#080806] via-[#0a0a08] to-black text-white overflow-hidden">
      {/* Ambient grid backdrop */}
      <div className="absolute inset-0 opacity-[0.18] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>
      {/* Soft top/bottom fade */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Ambient corner brackets */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-amber-500/40" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-amber-500/40" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-amber-500/40" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-amber-500/40" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
        <Brand size="lg" tagline="Initializing Combat Systems" />

        {/* System tickers / readouts */}
        <div className="w-full mt-10 mb-6 h-40 overflow-hidden font-mono">
          <AnimatePresence mode="popLayout">
            {SYSTEM_TICKERS.slice(0, readoutIdx).map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2.5 text-[10px] text-amber-200/60 uppercase tracking-widest py-1"
                >
                  <Icon className="w-3 h-3 text-amber-400/70" />
                  <span className="text-amber-500/40">[{String(i + 1).padStart(2, '0')}]</span>
                  <span>{t(r.key)}</span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: 12 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="inline-block h-px bg-gradient-to-r from-amber-500/60 to-transparent"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress bar with segmented look */}
        <div className="w-full space-y-2">
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Scanning highlight */}
            <motion.div
              className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '1200%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="flex justify-between items-center w-full">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-300/60 font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              {t('preloader.uplink')}
            </span>
            <span className="font-mono text-sm text-amber-300 font-black tracking-wider tabular-nums">
              {String(Math.floor(progress)).padStart(3, '0')}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
