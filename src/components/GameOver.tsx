import { Skull, RotateCcw, Home, Trophy, Zap, Gift, Play, Share2 } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { useEffect, useState } from 'react';
import { isTodaysChallengeCompleted, getStreakInfo } from '../game/DailyChallengeManager';
import { generateShareCardImage, downloadShareCard } from '../lib/shareCard';
import { Brand } from './Brand';
import { motion } from 'motion/react';
import { t } from '../i18n';

function rankFromScore(s: number) {
  if (s >= 250000) return { label: 'APEX PREDATOR', accent: 'from-amber-300 via-amber-500 to-amber-700', icon: Trophy };
  if (s >= 100000) return { label: 'ELITE EXTERMINATOR', accent: 'from-rose-400 via-rose-500 to-rose-700', icon: Zap };
  if (s >= 40000) return { label: 'FIELD OPERATIVE', accent: 'from-cyan-400 via-cyan-500 to-cyan-700', icon: Shield };
  if (s >= 10000) return { label: 'JUNIOR ANALYST', accent: 'from-emerald-400 via-emerald-500 to-emerald-700', icon: Gift };
  return { label: 'RECRUIT', accent: 'from-zinc-400 via-zinc-500 to-zinc-700', icon: Play };
}
function Shield(_p: { size?: number; className?: string }) { return <Play className={_p.className} />; }

export function GameOver({ score, wave, onRetry, onMainMenu, onContinueAd, continueAdPending }: {
  score: number; wave: number; onRetry: () => void; onMainMenu: () => void;
  onContinueAd?: () => Promise<void>; continueAdPending?: boolean;
}) {
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPrestigeAnimation, setIsPrestigeAnimation] = useState(false);
  const canPrestige = wave >= 15;
  const challengeCompleted = isTodaysChallengeCompleted();
  const streak = getStreakInfo();
  const rank = rankFromScore(score);

  const handlePrestige = () => {
    setIsPrestigeAnimation(true);
    setTimeout(() => { ProgressionManager.prestige(score); onRetry(); }, 1800);
  };

  useEffect(() => {
    const trackHigh = async () => {
      setIsSyncing(true);
      const currentHigh = SaveManager.getHighScore();
      if (score > currentHigh) { await SaveManager.setHighScore(score, wave); setIsNewHigh(true); }
      setIsSyncing(false);
    };
    trackHigh();
  }, [score, wave]);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
      {isPrestigeAnimation && (
        <div className="absolute inset-0 z-[100] bg-cyan-950/80 backdrop-blur-2xl flex flex-col items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
            <Zap className="w-16 h-16 text-cyan-300 mb-6" />
          </motion.div>
          <h2 className="text-4xl font-black cyber-text-glow text-cyan-200 font-display">NORMALIZING TIMELINE</h2>
          <p className="font-mono text-cyan-300/40 text-xs mt-4 tracking-[0.5em]">PRESTIGE COLLISION DETECTED</p>
        </div>
      )}

      {isSyncing && (
        <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span>{t('game.syncing')}</span>
        </div>
      )}

      <div className="max-w-md w-full text-center space-y-8 my-4">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 18 }} className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-300/30">
            <Skull className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-300/70 font-black">Operation Terminated</p>
            <h2 className="text-5xl sm:text-6xl font-black text-white font-display tracking-tight cyber-text-glow">{t('game.over')}</h2>
          </div>
        </motion.div>

        {/* Rank + Stats card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* Rank banner */}
          <div className={`bg-gradient-to-r ${rank.accent} p-4 flex items-center justify-between`}>
            <div className="text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/70 font-black">Rank Unlocked</p>
              <p className="text-2xl font-black text-black font-display tracking-tight">{rank.label}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
              <rank.icon className="w-6 h-6 text-black" />
            </div>
          </div>
          {/* Stats */}
          <div className="p-5 grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-black">{t('game.archiveScore')}</p>
              <p className="font-mono text-3xl font-black text-white tracking-wider tabular-nums">{score.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-black">{t('game.wave')}</p>
              <p className="font-mono text-3xl font-black text-white tracking-wider tabular-nums">{wave.toString().padStart(2, '0')}</p>
            </div>
          </div>
          {isNewHigh && (
            <div className="px-5 pb-4">
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-black text-[10px] uppercase tracking-widest text-amber-300">{t('game.newHigh')}</span>
              </div>
            </div>
          )}
          {challengeCompleted && (
            <div className="px-5 pb-5">
              <div className="px-3 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-300">{t('game.dailyComplete')}</p>
                  <p className="text-[10px] text-emerald-400/60 font-mono">{t('game.dailyRewards', { streak: streak.currentStreak })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {onContinueAd && (
            <button onClick={() => { soundManager.uiClick(); void onContinueAd(); }} disabled={continueAdPending}
              onMouseEnter={() => soundManager.uiHover()}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                continueAdPending ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}>
              <Play className="w-4 h-4" />
              <span>{continueAdPending ? t('game.continueAdPending') : t('game.continueAd')}</span>
            </button>
          )}
          <button onClick={async () => {
            soundManager.uiClick();
            try { const blob = await generateShareCardImage({ score, wave }); downloadShareCard(blob); } catch (e) { console.warn('Share card failed', e); }
          }} onMouseEnter={() => soundManager.uiHover()}
            className="w-full py-3 rounded-xl border border-white/10 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:bg-white/5 flex items-center justify-center gap-2">
            <Share2 className="w-3.5 h-3.5" />
            {t('game.share')}
          </button>
          <button onClick={() => { soundManager.init(); soundManager.uiClick(); onRetry(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Retry" data-testid="gameover-retry"
            className="group relative w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <RotateCcw className="w-4 h-4" />
            {t('app.retry')}
          </button>
          {canPrestige && (
            <button onClick={() => { soundManager.init(); soundManager.uiClick(); handlePrestige(); }}
              onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
              className="group relative w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Zap className="w-4 h-4" />
              {t('game.prestigeAction')}
            </button>
          )}
          <button onClick={() => { soundManager.init(); soundManager.uiClick(); onMainMenu(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Main Menu" data-testid="gameover-mainmenu"
            className="w-full py-3 text-zinc-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <Home className="w-3.5 h-3.5 opacity-70" />
            {t('app.back')}
          </button>
        </div>

        <Brand size="sm" showIcon={false} />
      </div>
    </div>
  );
}
