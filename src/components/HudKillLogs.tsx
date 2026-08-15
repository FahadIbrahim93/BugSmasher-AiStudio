import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface KillLog {
  id: string;
  type: string;
  color: string;
  scoreValue: number;
  streak: number;
  time: number;
}

export function HudKillLogs() {
  const [killLogs, setKillLogs] = useState<KillLog[]>([]);

  useEffect(() => {
    const handleSmashedEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const newLog: KillLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: detail.type,
        color: detail.color,
        scoreValue: detail.scoreValue,
        streak: detail.streak,
        time: Date.now()
      };
      setKillLogs((prev) => [newLog, ...prev].slice(0, 4));
    };

    window.addEventListener('nexus_bug_smashed', handleSmashedEvent);
    return () => { window.removeEventListener('nexus_bug_smashed', handleSmashedEvent); };
  }, []);

  useEffect(() => {
    if (killLogs.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setKillLogs((prev) => prev.filter((log) => now - log.time < 2200));
    }, 200);
    return () => { clearInterval(interval); };
  }, [killLogs]);

  return (
    <div className="fixed top-28 sm:top-32 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none z-20 w-fit max-w-xs sm:max-w-md">
      <AnimatePresence mode="popLayout">
        {killLogs.map((log) => {
          let label: string;
          let bugDisplayName = log.type.toUpperCase();
          let bgClass = "bg-zinc-950 text-white";
          let borderClass = "border-red-500 shadow-[4px_4px_0px_#ef4444]";

          // Map types to clinical catharsis translations
          if (log.type === 'boss') {
            bugDisplayName = 'PANIC ATTACK';
            label = 'CORTICAL BLOCK EXCISED';
            bgClass = "bg-red-600 text-white animate-pulse";
            borderClass = "border-white shadow-[6px_6px_0px_#000000]";
          } else if (log.type === 'tank') {
            bugDisplayName = 'HEAVY GRIEVANCE';
            label = 'DEEP WORRY SMASHED';
            bgClass = "bg-amber-500 text-black";
            borderClass = "border-black shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
          } else if (log.type === 'healer') {
            bugDisplayName = 'WORRY SPIRAL';
            label = 'FEEDBACK LOOP BROKEN';
            bgClass = "bg-emerald-600 text-white";
            borderClass = "border-emerald-300 shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
          } else if (log.type === 'ember') {
            bugDisplayName = 'BURNING ANGER';
            label = 'RAGE ENERGY DISCHARGED';
            bgClass = "bg-orange-600 text-white";
            borderClass = "border-orange-300 shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
          } else if (log.type === 'swarmer') {
            bugDisplayName = 'NAGGING OBLIGATION';
            label = 'MIND SPACE RECLAIMED';
          } else if (log.type === 'scout') {
            bugDisplayName = 'FLEETING INSECURITY';
            label = 'DOUBT DISPELLED';
          } else if (log.type === 'mini') {
            bugDisplayName = 'PETTY ANNOYANCE';
            label = 'IRRITANT FLUSHED';
          } else {
            // Dynamic default
            const charSum = log.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const options = [
              'CORTISOL FLUSH SUCCESS',
              'DOPAMINE DELIVERED',
              'ANGER VENT SUCCESSFUL',
              'PSYCHE STABILIZED'
            ];
            label = options[charSum % options.length];
          }

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, scale: 0.6, y: -35, rotateX: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15, filter: "blur(2px)", transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 480, damping: 20 }}
              className={`flex items-center shrink-0 space-x-3 border-2 px-3 py-1.5 md:px-4 md:py-2 select-none pointer-events-none ${bgClass} ${borderClass}`}
              style={{ fontFamily: 'monospace' }}
            >
              <div className="flex flex-col tracking-tight uppercase">
                <div className="flex items-center gap-1">
                  <span className="bg-rose-950 text-rose-400 text-[8px] tracking-widest font-mono font-extrabold px-1 py-0.5 mr-1 border border-rose-500/30">
                    VENTED
                  </span>
                  <span className="text-[10px] md:text-sm tracking-tighter font-black font-mono">
                    {bugDisplayName}
                  </span>
                </div>
                <span className="text-[6.5px] opacity-75 font-mono leading-none tracking-widest mt-1">
                  {label}
                </span>
              </div>

              <div className="h-5 w-[1px] bg-white/20 select-none block" />

              <div className="flex flex-col text-right font-mono">
                <span className="text-[10px] md:text-xs font-black tracking-widest text-[#22c55e]">
                  +{log.scoreValue}
                </span>
                {log.streak >= 5 ? (
                  <span className="text-[7px] tracking-widest font-black text-rose-400 font-mono animate-pulse">
                    X{log.streak}_BURST
                  </span>
                ) : (
                  <span className="text-[6px] tracking-widest text-zinc-400">
                    RELEASED
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
