import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getTodaysChallenge,
  getStreakInfo,
  generateDailyChallenge,
  CHALLENGE_MODIFIERS,
  type DailyChallenge,
  type ChallengeModifierId,
} from '../game/DailyChallengeManager';
import { soundManager } from '../game/SoundManager';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../i18n';
import type { TranslationKey } from '../i18n/en';
import { analytics } from '../lib/analytics';
import {
  Zap,
  Flame,
  Snowflake,
  Shield,
  Crosshair,
  Moon,
  Heart,
  Skull,
  Ban,
  Package,
  Gift,
  Trophy,
  X,
  Play,
  Clock,
  Info,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface DailyChallengeModalProps {
  onStart: () => void;
  onClose: () => void;
}

const MODIFIER_ICONS: Record<ChallengeModifierId, React.ReactNode> = {
  fast_bugs: <Zap className="w-4 h-4" />,
  tank_wave: <Shield className="w-4 h-4" />,
  glass_cannon: <Crosshair className="w-4 h-4" />,
  darkness: <Moon className="w-4 h-4" />,
  speed_demon: <Flame className="w-4 h-4" />,
  scrap_hunger: <Package className="w-4 h-4" />,
  healer_horde: <Heart className="w-4 h-4" />,
  boss_rush: <Skull className="w-4 h-4" />,
  no_shield: <Ban className="w-4 h-4" />,
  frostbite: <Snowflake className="w-4 h-4" />,
};

interface ModifierEffect {
  label: string;
  value: string;
  type: 'buff' | 'nerf' | 'neutral';
}

interface ModifierDetails {
  difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
  effects: ModifierEffect[];
}

const MODIFIER_DETAILS: Record<ChallengeModifierId, ModifierDetails> = {
  fast_bugs: {
    difficulty: 2,
    effects: [
      { label: 'Bug Speed', value: '+40%', type: 'nerf' },
    ],
  },
  tank_wave: {
    difficulty: 2,
    effects: [
      { label: 'Tank Spawn Rate', value: '3x', type: 'nerf' },
    ],
  },
  glass_cannon: {
    difficulty: 3,
    effects: [
      { label: 'Player Damage', value: '2x', type: 'buff' },
      { label: 'Core Health', value: '-50%', type: 'nerf' },
    ],
  },
  darkness: {
    difficulty: 2,
    effects: [
      { label: 'Visibility Radius', value: '-50%', type: 'nerf' },
    ],
  },
  speed_demon: {
    difficulty: 3,
    effects: [
      { label: 'Bug Speed per Kill', value: '+2%', type: 'nerf' },
      { label: 'Max Speed Bonus', value: '+80%', type: 'nerf' },
    ],
  },
  scrap_hunger: {
    difficulty: 1,
    effects: [
      { label: 'Resource Drop Rate', value: '-60%', type: 'nerf' },
      { label: 'Resource Value', value: '3x', type: 'buff' },
    ],
  },
  healer_horde: {
    difficulty: 2,
    effects: [
      { label: 'Healer Spawn Rate', value: '4x', type: 'nerf' },
    ],
  },
  boss_rush: {
    difficulty: 3,
    effects: [
      { label: 'Boss Wave Interval', value: 'Every 5 waves', type: 'nerf' },
    ],
  },
  no_shield: {
    difficulty: 1,
    effects: [
      { label: 'Shield Powerups', value: 'Disabled', type: 'nerf' },
    ],
  },
  frostbite: {
    difficulty: 2,
    effects: [
      { label: 'Near-Core Speed', value: '-80%', type: 'buff' },
      { label: 'Speed Ramp', value: 'Grows over time', type: 'neutral' },
    ],
  },
};

const DIFFICULTY_LABELS: Record<1 | 2 | 3, TranslationKey> = {
  1: 'challenge.difficultyEasy',
  2: 'challenge.difficultyMedium',
  3: 'challenge.difficultyHard',
};

const DIFFICULTY_COLORS: Record<1 | 2 | 3, string> = {
  1: 'bg-emerald-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
};

function ModifierCard({
  modId,
  isTooltipOpen,
  onHover,
}: {
  modId: ChallengeModifierId;
  isTooltipOpen: boolean;
  onHover: (id: ChallengeModifierId | null) => void;
}) {
  const mod = CHALLENGE_MODIFIERS[modId];
  const details = MODIFIER_DETAILS[modId];
  const diffLabel: TranslationKey = DIFFICULTY_LABELS[details.difficulty];
  const diffColor = DIFFICULTY_COLORS[details.difficulty];
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onHover(modId);
  };
  const closeDelayed = () => {
    closeTimer.current = setTimeout(() => onHover(null), 150);
  };
  const closeImmediate = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onHover(null);
  };
  const toggle = () => onHover(isTooltipOpen ? null : modId);

  return (
    <div
      className="relative"
      onMouseEnter={open}
      onMouseLeave={closeDelayed}
      onFocus={open}
      onBlur={closeDelayed}
    >
      {/* Modifier card */}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Escape') closeImmediate(); }}
        className={`w-full text-left bg-white/5 border rounded-xl px-4 py-3 flex items-start space-x-3 transition-all duration-200 ${
          isTooltipOpen
            ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            : 'border-white/10 hover:bg-white/[0.07] hover:border-white/20'
        }`}
        aria-expanded={isTooltipOpen}
        aria-describedby={isTooltipOpen ? `modifier-tooltip-${modId}` : undefined}
      >
        <div className="mt-0.5 w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 shrink-0 border border-red-500/10">
          {MODIFIER_ICONS[modId]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-bold text-white">{mod.name}</p>
            {/* Difficulty badge */}
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-white/5 text-zinc-500 border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${diffColor}`} />
              <span>{t(diffLabel)}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{mod.description}</p>
        </div>
        {/* Info indicator */}
        <div className={`shrink-0 transition-all duration-200 ${isTooltipOpen ? 'text-cyan-400' : 'text-zinc-600'}`}>
          <Info className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Tooltip panel */}
      <AnimatePresence>
        {isTooltipOpen && (
          <motion.div
            id={`modifier-tooltip-${modId}`}
            role="tooltip"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50"
            onMouseEnter={open}
            onMouseLeave={closeDelayed}
          >
            <div className="bg-zinc-900 border border-cyan-500/20 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/10">
              {/* Effects list */}
              <div className="px-4 pt-3 pb-2">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1.5" />
                  {t('challenge.modifierEffects')}
                </p>
                <div className="space-y-1.5">
                  {details.effects.map((effect, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                    >
                      <span className="text-[10px] font-mono text-zinc-400">{effect.label}</span>
                      <span
                        className={`text-[10px] font-mono font-bold flex items-center space-x-1 ${
                          effect.type === 'buff'
                            ? 'text-emerald-400'
                            : effect.type === 'nerf'
                              ? 'text-red-400'
                              : 'text-cyan-400'
                        }`}
                      >
                        {effect.type === 'buff' && <TrendingUp className="w-2.5 h-2.5" />}
                        {effect.type === 'nerf' && <TrendingDown className="w-2.5 h-2.5" />}
                        {effect.type === 'neutral' && <AlertTriangle className="w-2.5 h-2.5" />}
                        <span>{effect.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty bar */}
              <div className="px-4 pb-1">
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    {t('challenge.difficulty')}
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase ${
                    details.difficulty === 3 ? 'text-red-400' : details.difficulty === 2 ? 'text-yellow-400' : 'text-emerald-400'
                  }`}>
                    {t(diffLabel)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 mx-[1px] first:ml-0 last:mr-0 rounded-full transition-all duration-500 ${
                        level <= details.difficulty
                          ? details.difficulty === 3
                            ? 'bg-red-500'
                            : details.difficulty === 2
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          : 'bg-white/5'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Flavor text */}
              <div className="px-4 pt-2 pb-3">
                <div className="bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                  <p className="text-[10px] text-zinc-600 font-mono italic leading-relaxed">
                    {mod.flavor}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getCountdown(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DailyChallengeModal({ onStart, onClose }: DailyChallengeModalProps) {
  const challenge = getTodaysChallenge();
  const streak = getStreakInfo();
  const [timeLeft, setTimeLeft] = useState(getCountdown());
  const [starting, setStarting] = useState(false);
  const [tooltipModifier, setTooltipModifier] = useState<ChallengeModifierId | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(() => {
    soundManager.init();
    soundManager.uiClick();
    setStarting(true);
    analytics.track('daily_challenge_start');
    // Small delay for audio + visual feedback
    setTimeout(() => onStart(), 300);
  }, [onStart]);

  const handleClose = useCallback(() => {
    soundManager.init();
    soundManager.uiClick();
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display tracking-tight">
                {t('challenge.title')}
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Streak Display */}
          {streak.currentStreak > 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {streak.currentStreak >= 3 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-yellow-400">
                    {streak.currentStreak}-day streak
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Best: {streak.highestStreak} days
                  </p>
                </div>
              </div>
              {streak.currentStreak >= 3 && (
                <span className="text-[10px] text-yellow-500/60 font-mono uppercase tracking-widest border border-yellow-500/20 rounded-lg px-2 py-1">
                  Streak Active
                </span>
              )}
            </div>
          )}

          {/* Win Condition */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Trophy className="w-3 h-3 mr-1.5" />
              {t('challenge.primaryObjective')}
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-white">{challenge.winCondition.label}</p>
            </div>
          </div>

          {/* Modifiers */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Flame className="w-3 h-3 mr-1.5" />
              {t('challenge.systemModifiers')}
            </p>
            <div className="space-y-2">
              {challenge.modifiers.map((modId) => (
                <ModifierCard
                  key={modId}
                  modId={modId}
                  isTooltipOpen={tooltipModifier === modId}
                  onHover={setTooltipModifier}
                />
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center">
              <Gift className="w-3 h-3 mr-1.5" />
              {t('challenge.missionRewards')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {challenge.rewards.map((reward, i) => (
                <div
                  key={`${reward.id}_${i}`}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center space-x-2.5"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      reward.type === 'cursor_skin'
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {reward.type === 'cursor_skin' ? (
                      <Crosshair className="w-3.5 h-3.5" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{reward.name}</p>
                    {reward.description && (
                      <p className="text-[9px] text-zinc-500 font-mono truncate">
                        {reward.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {challenge.streakReward && (
              <div className="mt-2 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/10 rounded-xl px-3 py-2 flex items-center space-x-2.5">
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <p className="text-[10px] text-yellow-400 font-mono">
                  Streak bonus (3+ days): <span className="font-bold">{challenge.streakReward.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono tracking-wider">{timeLeft}</span>
          </div>

          <button
            onClick={handleStart}
            disabled={challenge.completed || starting}
            className={`group relative px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center space-x-2.5 transition-all overflow-hidden ${
              challenge.completed
                ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                : starting
                  ? 'bg-cyan-500/50 text-white cursor-wait'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black hover:scale-105 active:scale-95'
            }`}
          >
            <span className="relative z-10 flex items-center">
              {starting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  INITIALIZING
                </>
              ) : challenge.completed ? (
                <>
                  <Trophy className="w-3.5 h-3.5 mr-2" />
                  COMPLETED
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2" />
                  DEPLOY
                </>
              )}
            </span>
            {!challenge.completed && !starting && (
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
