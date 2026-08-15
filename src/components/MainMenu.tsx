import { Bug, Settings2, Trophy, User, BookOpen, ListOrdered, Zap, Calendar, Gem, Sparkles, Download, Database } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { SaveSlotsModal } from './SaveSlotsModal';
import { progressionManager } from '../game/ProgressionManager';
import { useState } from 'react';
import { AccountMenu } from './AccountMenu';
// import { IntelHub } from './IntelHub'; // kept for future lazy use if needed
import { Leaderboard } from './Leaderboard';
import { Armory } from './Armory';
import { DailyChallengeModal } from './DailyChallengeModal';
import { generateDailyChallenge, isTodaysChallengeCompleted, getStreakInfo } from '../game/DailyChallengeManager';
import { isSupporter } from '../game/CosmeticsManager';
import { type ChallengeModifierId } from '../game/DailyChallengeManager';
import type { GameModeId } from '../game/GameMode';
import { AchievementGallery } from './AchievementGallery';
import { BattlegroundGenerator } from './BattlegroundGenerator';
import { WorkspaceConsole } from './WorkspaceConsole';

export function MainMenu({
  onStart,
  onSettings,
  onIntel,
  friendChallenge,
}: {
  onStart: (challengeMods?: ChallengeModifierId[], mode?: GameModeId, biome?: string) => void;
  onSettings: () => void;
  onIntel?: () => void;
  friendChallenge?: { score: number; wave: number } | null;
}) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSaveSlotsOpen, setIsSaveSlotsOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const supporter = isSupporter();
  const highScore = SaveManager.getHighScore();
  const challengeCompleted = isTodaysChallengeCompleted();
  const streak = getStreakInfo();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#030303] relative p-4 overflow-hidden">
      {/* Cinematic High-Fidelity Background Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <img 
          src="/src/assets/images/game_lobby_background_1780523376207.png" 
          alt="Game Lobby Background" 
          className="w-full h-full object-cover opacity-25 scale-105 filter saturate-125 contrast-125 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Soft dark vignette overlays for extreme text visibility and contrast */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#030303]/85 to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/40 via-transparent to-[#030303]" />
        
        {/* Floating particle field overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.2), transparent), radial-gradient(2px 2px at 10% 80%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 70% 90%, rgba(255,255,255,0.2), transparent), radial-gradient(2px 2px at 90% 10%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.4), transparent)',
            backgroundSize: '200px 200px',
            animation: 'drift 12s ease-in-out infinite'
          }} />
        </div>
      </div>

      {isArmoryOpen && <Armory onClose={() => { setIsArmoryOpen(false); }} />}
      {isAchievementsOpen && <AchievementGallery onClose={() => { setIsAchievementsOpen(false); }} />}
      {isAccountOpen && <AccountMenu onClose={() => { setIsAccountOpen(false); }} />}
      {isLeaderboardOpen && <Leaderboard onClose={() => { setIsLeaderboardOpen(false); }} />}
      {isGeneratorOpen && (
        <BattlegroundGenerator
          onClose={() => { setIsGeneratorOpen(false); }}
          onLaunch={() => {
            setIsGeneratorOpen(false);
            onStart(undefined, 'standard', 'custom_map');
          }}
        />
      )}
      {isDailyChallengeOpen && (
        <DailyChallengeModal 
          onStart={() => {
            setIsDailyChallengeOpen(false);
            const challenge = generateDailyChallenge();
            onStart(challenge.modifiers);
          }}
          onClose={() => { setIsDailyChallengeOpen(false); }}
        />
      )}

      <div className="z-10 flex flex-col items-center space-y-12 sm:space-y-16 w-full max-w-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6">
            <Bug className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500 opacity-90 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white font-display uppercase heading-xl relative">
            BUGSMASHER
            <span className="absolute -inset-1 bg-gradient-to-r from-rose-500/10 via-transparent to-rose-500/10 blur-xl opacity-50 animate-pulse" />
          </h1>
          <p className="text-[10px] text-red-500 font-mono font-black tracking-[0.3em] uppercase mt-1 animate-pulse">
            ANGER VENT PROTOCOL ACTIVE
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent mx-auto mt-4 mb-6" />

          {highScore > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 mx-auto w-fit">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center space-x-3">
                <Trophy className="w-4 h-4 text-rose-500 opacity-80" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-black">Peak Catharsis</span>
                  <span className="text-sm font-mono text-white tracking-widest">{highScore.toString().padStart(6, '0')}</span>
                </div>
              </div>
              
              {progressionManager.getData().prestigeLevel > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-rose-400 opacity-80" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] text-rose-500/60 uppercase font-mono tracking-widest font-black">Detox Level</span>
                    <span className="text-sm font-mono text-rose-400 tracking-widest">RANK {progressionManager.getData().prestigeLevel}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm sm:text-base md:text-lg text-zinc-400 font-medium tracking-[0.2em] font-mono leading-relaxed">
            CRUSH THE INTRUSIVE THOUGHTS.<br />
            <span className="text-rose-500 font-bold">RELEASE THE AGGRESSION.</span>
          </p>
          {friendChallenge && (
            <p className="text-xs font-mono text-cyan-400 border border-cyan-500/30 rounded-lg px-4 py-2">
              Friend challenge: beat {friendChallenge.score} pts / wave {friendChallenge.wave}
            </p>
          )}
        </div>
        
        <div className="w-full flex flex-col items-center space-y-6 mt-12">
          <div className="flex flex-wrap gap-2 justify-center w-full">
            {(['endless', 'boss_rush'] as GameModeId[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { soundManager.uiClick(); onStart(undefined, mode); }}
                className="px-4 py-2 rounded-full border border-rose-500/20 text-[10px] font-mono uppercase text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20"
              >
                {mode === 'endless' ? 'Endless Venting' : 'Boss Catharsis Rush'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { SaveManager.setActiveSlotId(null); soundManager.init(); soundManager.uiClick(); onStart(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            aria-label="Start Game"
            className="group relative px-12 py-5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white rounded-full font-bold text-sm sm:text-base uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-3 overflow-hidden w-full sm:w-auto shadow-[0_4px_25px_rgba(239,68,68,0.4)] hover:shadow-[0_8px_40px_rgba(239,68,68,0.6)]"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative z-10 font-black tracking-[0.15em]">Begin Stress Vent</span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </button>

          {/* Load Save Slot Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsSaveSlotsOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="group relative w-full sm:w-auto px-6 py-3 bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 overflow-hidden flex items-center justify-center space-x-2.5"
          >
            <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            <span>Load Memory Slate</span>
          </button>

          {/* Armory Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsArmoryOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className={`group relative w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 overflow-hidden flex items-center justify-center space-x-2.5 ${
              supporter 
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Gem className="w-4 h-4" />
            <span>Anger Armory</span>
            {supporter && (
              <span className="text-[8px] bg-purple-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Unlocked</span>
            )}
          </button>

          {/* Daily Challenge Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsDailyChallengeOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className={`group relative w-full sm:w-auto px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center space-x-2.5 ${
              challengeCompleted 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Directive</span>
            {challengeCompleted ? (
              <span className="text-[8px] bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Done</span>
            ) : streak.currentStreak >= 3 ? (
              <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">{streak.currentStreak}d</span>
            ) : null}
          </button>

          {/* Battleground Generator Button */}
          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsGeneratorOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="group relative w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 text-cyan-400 hover:from-cyan-600/20 hover:to-blue-600/20 rounded-full font-bold text-xs uppercase tracking-widest transition-all overflow-hidden flex items-center justify-center space-x-2.5 animate-pulse"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Tactical Forge</span>
            <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">AI_POWERED</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onSettings(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Settings2 className="w-4 h-4" />
            <span>Hardware Tuning</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsLeaderboardOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Nexus Rankings</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsAccountOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <User className="w-4 h-4" />
            <span>Terminal Access</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); setIsWorkspaceOpen(true); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-cyan-500 hover:text-cyan-300 transition-colors font-mono text-xs uppercase tracking-widest font-black"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Workspace Core Sync</span>
          </button>

          <button
            onClick={() => { soundManager.uiClick(); setIsAchievementsOpen(true); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
          </button>

          <button 
            onClick={() => { soundManager.init(); soundManager.uiClick(); onIntel?.(); }}
            onMouseEnter={() => { soundManager.init(); soundManager.uiHover(); }}
            className="flex items-center space-x-3 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <BookOpen className="w-4 h-4" />
            <span>Stress & Somatic Intel</span>
          </button>
        </div>
      </div>

      {isSaveSlotsOpen && (
        <SaveSlotsModal
          mode="load"
          onClose={() => { setIsSaveSlotsOpen(false); }}
          onSlotLoaded={() => {
            setIsSaveSlotsOpen(false);
            onStart();
          }}
        />
      )}
      {isWorkspaceOpen && (
        <WorkspaceConsole 
          onClose={() => { setIsWorkspaceOpen(false); }}
        />
      )}
    </div>
  );
}
