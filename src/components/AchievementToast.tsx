import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Achievement } from '../game/AchievementManager';
import { AchievementIcon } from './AchievementIcon';

// Accent colors per icon so the toast badge matches the achievement type
const ICON_ACCENTS: Record<string, { text: string; bg: string; border: string }> = {
  flame: { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  hammer: { text: 'text-amber-300', bg: 'bg-amber-400/15', border: 'border-amber-400/30' },
  sparkles: { text: 'text-emerald-300', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30' },
  skull: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  zap: { text: 'text-yellow-300', bg: 'bg-yellow-400/15', border: 'border-yellow-400/30' },
  'heart-off': { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  aim: { text: 'text-cyan-300', bg: 'bg-cyan-400/15', border: 'border-cyan-400/30' },
  shield: { text: 'text-sky-300', bg: 'bg-sky-400/15', border: 'border-sky-400/30' },
  star: { text: 'text-amber-300', bg: 'bg-amber-400/15', border: 'border-amber-400/30' },
  target: { text: 'text-red-300', bg: 'bg-red-400/15', border: 'border-red-400/30' },
  award: { text: 'text-yellow-300', bg: 'bg-yellow-400/15', border: 'border-yellow-400/30' },
};

export function AchievementToast() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievement = (e: CustomEvent<Achievement>) => {
      setAchievement(e.detail);
      setTimeout(() => { setAchievement(null); }, 5000);
    };

    window.addEventListener('achievement_unlocked', handleAchievement as EventListener);
    return () => { window.removeEventListener('achievement_unlocked', handleAchievement as EventListener); };
  }, []);

  const accent = achievement ? ICON_ACCENTS[achievement.icon] : undefined;

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className={`fixed top-20 right-4 z-[100] bg-zinc-900/90 backdrop-blur-xl border p-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-sm ${accent?.border || 'border-yellow-500/30'}`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center border ${accent?.bg || 'bg-yellow-500/10'} ${accent?.border || 'border-yellow-500/30'}`}
          >
            <AchievementIcon icon={achievement.icon} className={`w-6 h-6 ${accent?.text || 'text-yellow-500'}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-1">Achievement Unlocked</p>
            <h4 className="text-white font-bold leading-tight">{achievement.title}</h4>
            <p className="text-zinc-400 text-xs">{achievement.description}</p>
          </div>
          <button 
            onClick={() => { setAchievement(null); }}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
