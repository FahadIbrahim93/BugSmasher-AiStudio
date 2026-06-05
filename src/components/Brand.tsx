import { Bug } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Brand mark + lockup for BugSmasher.
 *
 * Three sizes:
 * - <Brand size="sm" /> — 1 line lockup for HUD chips
 * - <Brand size="md" /> — 2 line lockup for menus
 * - <Brand size="lg" /> — full hero lockup for splash & marketing
 */
export function Brand({
  size = 'md',
  tagline = 'Tactical Base Defense',
  showIcon = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  tagline?: string;
  showIcon?: boolean;
}) {
  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1.5">
        {showIcon && <Bug className="w-3 h-3 text-amber-400" strokeWidth={2.5} />}
        <span className="font-black tracking-tighter text-xs uppercase">
          <span className="text-amber-400">BUG</span>
          <span className="text-white">SMASHER</span>
        </span>
      </div>
    );
  }
  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center select-none">
        <motion.div
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.7 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-3xl bg-amber-500/30 rounded-full" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.45)] border-2 border-amber-200/40">
            <Bug className="w-14 h-14 sm:w-16 sm:h-16 text-black" strokeWidth={2.5} />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center text-[8px] font-black text-white">
              ✕
            </div>
          </div>
        </motion.div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[-0.05em] leading-[0.85] uppercase text-center font-display">
          <span className="block text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
            BUG
          </span>
          <span className="block text-white -mt-2">SMASHER</span>
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/60" />
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-300/80 font-bold">
            {tagline}
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/60" />
        </div>
      </div>
    );
  }
  return (
    <div className="inline-flex flex-col items-start select-none">
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 to-amber-700 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-200/30">
            <Bug className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] uppercase font-display leading-none">
          <span className="text-amber-400">BUG</span>
          <span className="text-white">SMASHER</span>
        </h1>
      </div>
      <p className="mt-2 ml-[3.25rem] font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/60 font-bold">
        {tagline}
      </p>
    </div>
  );
}

/**
 * A reusable section header with a small label and big title.
 * Optionally with a status dot (live/active/disabled).
 */
export function SectionHeader({
  label,
  title,
  status,
}: {
  label: string;
  title: string;
  status?: { label: string; color: 'green' | 'red' | 'amber' | 'cyan' };
}) {
  const colorMap = {
    green: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]',
    red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
  };
  return (
    <div className="flex items-end justify-between border-b border-white/10 pb-3 mb-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/70 font-bold mb-1">
          {label}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-white">
          {title}
        </h2>
      </div>
      {status && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorMap[status.color]} animate-pulse`} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 font-bold">
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
}
