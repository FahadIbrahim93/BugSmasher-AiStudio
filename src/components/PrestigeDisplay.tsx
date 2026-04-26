import { Award, Star, Trophy } from 'lucide-react';
import { saveManager } from '../game/SaveManager';
import { dailyChallengeManager } from '../game/DailyChallenge';

export function PrestigeDisplay() {
  const level = saveManager.getPrestigeLevel();
  const points = saveManager.getPrestigePoints();
  const multiplier = 1 + (level * 0.1);
  
  return (
    <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-amber-500/30 shadow-[0_4_20px_rgba(245,158,11,0.15)]">
      <Star className="w-4 h-4 text-amber-400" />
      <div className="flex flex-col">
        <span className="text-xs text-amber-300 font-medium uppercase tracking-wider">Prestige</span>
        <span className="text-sm font-bold text-amber-100 font-mono">
          Level {level} <span className="text-amber-500/70">•</span> {multiplier.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}

export function DailyChallengeBadge() {
  const challenge = dailyChallengeManager.getTodayChallenge();
  const completed = saveManager.hasCompletedDailyChallenge();
  const bonus = saveManager.getDailyChallengeBonus();
  
  return (
    <div className={`flex items-center space-x-3 backdrop-blur-xl px-4 py-2 rounded-full border shadow-[0_4_20px_rgba(0,0,0,0.5)] ${
      completed 
        ? 'bg-emerald-900/30 border-emerald-500/30' 
        : 'bg-black/40 border-cyan-500/30'
    }`}>
      <Trophy className={`w-4 h-4 ${completed ? 'text-emerald-400' : 'text-cyan-400'}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium uppercase tracking-wider ${completed ? 'text-emerald-300' : 'text-cyan-300'}`}>
          {completed ? 'COMPLETED' : 'Daily'}
        </span>
        <span className={`text-xs font-mono ${completed ? 'text-emerald-100/70' : 'text-cyan-100'}`}>
          {challenge.description}
        </span>
        {bonus > 1 && (
          <span className="text-xs text-purple-400">+{Math.floor((bonus - 1) * 100)}% bonus</span>
        )}
      </div>
    </div>
  );
}