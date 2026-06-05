import {
  Settings2, Trophy, User, BookOpen, ListOrdered, Zap, Calendar, Gem,
  Play, Flame, Swords, ChevronRight, Sparkles,
} from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { useState, lazy, Suspense } from 'react';
import { AccountMenu } from './AccountMenu';
import { IntelHub } from './IntelHub';
import { DailyChallengeModal } from './DailyChallengeModal';
import { isTodaysChallengeCompleted, getStreakInfo } from '../game/DailyChallengeManager';
import { isSupporter } from '../game/CosmeticsManager';
import type { ChallengeModifierId } from '../game/DailyChallengeManager';
import type { GameModeId } from '../game/GameMode';
import { AchievementGallery } from './AchievementGallery';
import { Brand } from './Brand';
import { motion } from 'motion/react';
import { t, type TranslationKey } from '../i18n';

const Leaderboard = lazy(() => import('./Leaderboard').then(m => ({ default: m.Leaderboard })));
const Armory = lazy(() => import('./Armory').then(m => ({ default: m.Armory })));

const MODES: Array<{ id: GameModeId; icon: typeof Swords; titleKey: TranslationKey; descKey: TranslationKey; accent: string; }> = [
  { id: 'standard', icon: Swords, titleKey: 'mode.standard', descKey: 'mode.standardDesc',
    accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-400' },
  { id: 'endless', icon: Flame, titleKey: 'mode.endless', descKey: 'mode.endlessDesc',
    accent: 'from-red-500/20 to-red-500/5 border-red-500/30 hover:border-red-400' },
  { id: 'boss_rush', icon: Zap, titleKey: 'mode.bossRush', descKey: 'mode.bossRushDesc',
    accent: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-400' },
];

export function MainMenu({
  onStart, onSettings, onIntel, friendChallenge,
}: {
  onStart: (mods?: ChallengeModifierId[], mode?: GameModeId) => void;
  onSettings: () => void;
  onIntel?: () => void;
  friendChallenge?: { score: number; wave: number } | null;
}) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameModeId>('standard');
  const supporter = isSupporter();
  const highScore = SaveManager.getHighScore();
  const prestige = ProgressionManager.getData().prestigeLevel;
  const challengeCompleted = isTodaysChallengeCompleted();
  const streak = getStreakInfo();
  const play = (m?: GameModeId) => {
    soundManager.init(); soundManager.uiClick();
    onStart(undefined, m || selectedMode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-[#050505] relative p-4 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 opacity-[0.10] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-amber-500/30 pointer-events-none hidden sm:block" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-amber-500/30 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-amber-500/30 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-amber-500/30 pointer-events-none hidden sm:block" />

      <Suspense fallback={null}>
        {isArmoryOpen && <Armory onClose={() => setIsArmoryOpen(false)} />}
      </Suspense>
      {isAchievementsOpen && <AchievementGallery onClose={() => setIsAchievementsOpen(false)} />}
      {isAccountOpen && <AccountMenu onClose={() => setIsAccountOpen(false)} />}
      <Suspense fallback={null}>
        {isLeaderboardOpen && <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />}
      </Suspense>
      {isDailyChallengeOpen && (
        <DailyChallengeModal
          onStart={() => {
            setIsDailyChallengeOpen(false);
            import('../game/DailyChallengeManager').then(({ generateDailyChallenge }) => {
              onStart(generateDailyChallenge().modifiers);
            });
          }}
          onClose={() => setIsDailyChallengeOpen(false)}
        />
      )}

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-8 sm:gap-10 py-6">
        <Brand size="lg" tagline={t('app.tagline')} />

        {friendChallenge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 font-mono text-xs text-cyan-300 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('menu.friendChallenge', { score: friendChallenge.score, wave: friendChallenge.wave })}
          </motion.div>
        )}

        {/* Stats strip */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
          <StatChip label={t('menu.archiveBest')} value={highScore.toString().padStart(6, '0')} icon={<Trophy className="w-3.5 h-3.5" />} accent="amber" />
          <StatChip label={t('hud.streak')} value={`${streak.currentStreak}d`} icon={<Flame className="w-3.5 h-3.5" />} accent={streak.currentStreak >= 3 ? 'red' : 'zinc'} />
          <StatChip label={t('menu.prestigeRank')} value={prestige > 0 ? t('menu.prestigeRankValue', { level: prestige }) : '—'} icon={<Zap className="w-3.5 h-3.5" />} accent={prestige > 0 ? 'cyan' : 'zinc'} />
        </div>

        {/* Daily challenge feature card */}
        <button
          onClick={() => { soundManager.init(); soundManager.uiClick(); setIsDailyChallengeOpen(true); }}
          className="group w-full max-w-xl relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent p-4 sm:p-5 flex items-center gap-4 hover:border-cyan-400/60 transition-colors text-left"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-cyan-400/10 blur-2xl group-hover:bg-cyan-400/20 transition-colors" />
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70 font-bold">{t('menu.daily')}</p>
            <p className="font-black text-lg text-white tracking-tight truncate">{t('menu.daily')}</p>
            <p className="text-xs text-white/60 mt-0.5">{challengeCompleted ? t('menu.challengeDone') : t('menu.daily')}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {challengeCompleted ? (
              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('menu.challengeDone')}
              </span>
            ) : streak.currentStreak >= 3 ? (
              <span className="font-mono text-[9px] uppercase tracking-widest font-black text-amber-400">{streak.currentStreak}d 🔥</span>
            ) : null}
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Mode selector */}
        <div className="w-full max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-black mb-2.5 ml-1">{t('menu.start')}</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const active = selectedMode === mode.id;
              return (
                <button key={mode.id} onClick={() => { soundManager.uiHover(); setSelectedMode(mode.id); }}
                  className={`relative rounded-xl border p-3 sm:p-4 flex flex-col items-start gap-1.5 text-left transition-all bg-gradient-to-br ${mode.accent} ${active ? 'ring-2 ring-white/40 scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}>
                  {active && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
                  <Icon className="w-4 h-4 text-white" />
                  <p className="font-black text-xs uppercase tracking-wide text-white leading-tight">{t(mode.titleKey as TranslationKey)}</p>
                  <p className="text-[10px] text-white/50 leading-tight">{t(mode.descKey as TranslationKey)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big primary play button */}
        <button
          onClick={() => play()}
          onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
          aria-label="Start Game" data-testid="main-start"
          className="group relative w-full max-w-xl h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-xl sm:text-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Play className="w-6 h-6 fill-current" />{t('menu.start')}
          </span>
        </button>

        {/* Secondary action grid */}
        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2">
          <SecondaryAction icon={<Gem className="w-4 h-4" />} label={t('menu.armory')} accent={supporter ? 'purple' : 'default'} badge={supporter ? t('menu.supporterUnlocked') : undefined}
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsArmoryOpen(true); }} />
          <SecondaryAction icon={<Trophy className="w-4 h-4" />} label={t('menu.achievements')}
            onClick={() => { soundManager.uiClick(); setIsAchievementsOpen(true); }} />
          <SecondaryAction icon={<ListOrdered className="w-4 h-4" />} label={t('menu.leaderboard')}
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsLeaderboardOpen(true); }} />
          <SecondaryAction icon={<User className="w-4 h-4" />} label={t('menu.terminal')}
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsAccountOpen(true); }} />
          <SecondaryAction icon={<BookOpen className="w-4 h-4" />} label={t('menu.systemIntel')}
            onClick={() => { soundManager.init(); soundManager.uiClick(); onIntel?.(); }} />
          <SecondaryAction icon={<Settings2 className="w-4 h-4" />} label={t('menu.settings')}
            onClick={() => { soundManager.init(); soundManager.uiClick(); onSettings(); }} />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">v2.5.0 · Build Hope</p>
      </div>
    </div>
  );
}

function StatChip({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: 'amber' | 'cyan' | 'red' | 'zinc' }) {
  const colors: Record<string, string> = { amber: 'text-amber-400', cyan: 'text-cyan-400', red: 'text-red-400', zinc: 'text-zinc-400' };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex flex-col gap-0.5">
      <div className={`flex items-center gap-1.5 ${colors[accent]}`}>
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-widest font-black opacity-70">{label}</span>
      </div>
      <span className="font-mono text-base font-black text-white tracking-wider tabular-nums truncate">{value}</span>
    </div>
  );
}

function SecondaryAction({ icon, label, badge, accent, onClick }: {
  icon: React.ReactNode; label: string; badge?: string; accent?: 'purple' | 'default'; onClick: () => void;
}) {
  return (
    <button onClick={onClick} onMouseEnter={() => soundManager.uiHover()}
      className={`group flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all text-left ${
        accent === 'purple' ? 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/60'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20'}`}>
      <div className={`shrink-0 ${accent === 'purple' ? 'text-purple-300' : 'text-white/70 group-hover:text-white'}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs uppercase tracking-wider text-white truncate">{label}</p>
        {badge && <span className="font-mono text-[8px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded ml-1">{badge}</span>}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
