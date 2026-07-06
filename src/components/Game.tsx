import { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { GameOver } from './GameOver';
import { UpgradeMenu } from './UpgradeMenu';
import { PauseMenu } from './PauseMenu';
import { SettingsMenu } from './SettingsMenu';
import { TutorialOverlay } from './TutorialOverlay';
import { ProgressionCenter } from './ProgressionCenter';
import { GameEngine } from '../game/GameEngine';
import { GameConfig } from '../game/GameConfig';
import type { GameSaveData } from '../game/SaveManager';
import { SaveSlotsModal } from './SaveSlotsModal';

import { StatsManager } from '../game/StatsManager';
import type { GameModeId } from '../game/GameMode';
import { AchievementManager } from '../game/AchievementManager';
import { useAuth } from '../contexts/AuthContext';
import { pushPerformanceRow } from '../lib/workspaceService';

import { StoryCutscene } from './StoryCutscene';
import { StoryManager } from '../game/StoryManager';
import { StoryBeat } from '../data/lore';
import { TerminalLog } from './TerminalLog';
import type { ResourceType } from '../game/ResourceTypes';
import {
  completeChallenge,
  getTodaysChallenge,
  type ChallengeModifierId,
  type WinCondition,
} from '../game/DailyChallengeManager';
import {
  loadAccessibilitySettings,
  subscribeAccessibility,
  getColorblindCanvasStyle,
  type AccessibilitySettings,
} from '../game/AccessibilitySettings';
import { analytics } from '../lib/analytics';
import { GameEngineStatusBus } from '../game/GameEngineStatusBus';
import { CustomMapManager } from '../game/CustomMapManager';
import { BiomeBackgroundGallery } from './BiomeBackgroundGallery';

function checkWinCondition(engine: GameEngine, condition: WinCondition): boolean {
  switch (condition.type) {
    case 'wave':
      return engine.wave >= condition.value;
    case 'score':
      return engine.score >= condition.value;
    case 'kills':
      return engine.totalKills >= condition.value;
  }
}

export function Game({
  onMainMenu,
  challengeModifiers,
  gameMode = 'standard',
  startBiome,
}: {
  onMainMenu: () => void;
  challengeModifiers?: ChallengeModifierId[];
  gameMode?: GameModeId;
  startBiome?: string;
}) {
  const { accessToken } = useAuth();
  const [isGameOver, setIsGameOver] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saveSlotMode, setSaveSlotMode] = useState<'save' | 'load' | null>(null);
  const [gameStateToSave, setGameStateToSave] = useState<GameSaveData | undefined>(undefined);
  const [activeStoryBeat, setActiveStoryBeat] = useState<StoryBeat | null>(null);
  const [unlockedLogs, setUnlockedLogs] = useState<string[]>(StoryManager.getUnlockedLogs());
  const [gameId, setGameId] = useState(0);
  
  // We strictly manage these here ONLY for the menus that need them when paused
  const [finalScore, setFinalScore] = useState(0);
  const [currentWave, setCurrentWave] = useState(1);
  
  const [currentBiome, setCurrentBiome] = useState<string>(startBiome || 'neon_core');
  
  const engineRef = useRef<GameEngine | null>(null);
  const [a11y, setA11y] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  useEffect(() => {
    let lastBiome = startBiome || 'neon_core';
    const unsub = GameEngineStatusBus.subscribe((status) => {
      if (status && status.currentBiome !== lastBiome) {
        lastBiome = status.currentBiome;
        setCurrentBiome(status.currentBiome);
      }
    });
    return unsub;
  }, [startBiome]);

  useEffect(() => {
    analytics.track('session_start', { mode: challengeModifiers ? 'daily' : 'standard' });
    return () => { analytics.track('session_end'); };
  }, [gameId, challengeModifiers]);

  useEffect(() => subscribeAccessibility(setA11y), []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setIsGameOver(true);
    const wave = engineRef.current?.wave ?? 0;
    StatsManager.recordRunEnd(wave, score);
    analytics.track('game_over', { score, wave });

    // Check challenge completion
    if (engineRef.current?.isChallengeMode) {
      const challenge = getTodaysChallenge();
      const met = checkWinCondition(engineRef.current, challenge.winCondition);
      if (met) {
        completeChallenge({
          completed: true,
          score: score,
          wave: engineRef.current.wave,
          modifierConditions: {},
        });
      }
    }
    
    // Final stats push
    if (engineRef.current) {
      StatsManager.updateStats({ 
        totalScore: score,
        totalPlayTime: engineRef.current.playTimeAccumulator
      });
    }

    // Auto-update spreadsheet in real-time if Google Sheets are connected
    if (accessToken) {
      pushPerformanceRow(accessToken, StatsManager.getStats())
        .then(() => { console.log('Real-time Google Sheets update complete on run end.'); })
        .catch(err => { console.warn('Background spreadsheet sync failed:', err); });
    }
  }, [accessToken]);

  const handleWaveComplete = useCallback(() => {
    if (engineRef.current) {
      setFinalScore(engineRef.current.score);
      setCurrentWave(engineRef.current.wave);
      analytics.track('wave_complete', {
        wave: engineRef.current.wave,
        score: engineRef.current.score,
      });
      
      StatsManager.updateStats({
        totalWavesCompleted: 1
      });

      // Achievement processing
      AchievementManager.checkAchievements({
        swarmerKills: engineRef.current.swarmerKills,
        healerKills: engineRef.current.healerKills,
        kills: engineRef.current.killsInSubwave,
        perfectSequence: engineRef.current.missedClicksInSubwave === 0
      });

      // Reset subwave stats
      engineRef.current.killsInSubwave = 0;
      engineRef.current.missedClicksInSubwave = 0;

      // Check for story beats on wave completion or start of next
      const beat = StoryManager.getTriggeredBeat('wave_start', engineRef.current.wave + 1);
      if (beat) {
        engineRef.current.pause();
        setActiveStoryBeat(beat);
      }

      // Check for lore logs
      const updatedLogs = StoryManager.checkLogs(engineRef.current.wave + 1);
      setUnlockedLogs(updatedLogs);
    }
    setIsUpgrading(true);
  }, []);

  const handleUpgrade = (type: 'health' | 'radius' | 'turret', cost: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Deduct score
    engine.score -= cost;
    setFinalScore(engine.score);
    engine.triggerUpgradeEffect();

    // Apply upgrade
    if (type === 'health') {
      engine.healthLevel += 1;
      engine.maxHealth += GameConfig.upgrades.health.healAmount;
      engine.health = engine.maxHealth;
    } else if (type === 'radius') {
      engine.radiusLevel += 1;
      engine.clickRadiusMultiplier *= GameConfig.upgrades.radius.radiusMultiplier;
    } else if (type === 'turret') {
      engine.autoTurretLevel += 1;
    }
  };

  const handleNextWave = () => {
    setIsUpgrading(false);
    const engine = engineRef.current;
    if (engine) {
      engine.syncSkills(); // Apply any new neural upgrades
      engine.resume();
    }
  };

  const togglePause = useCallback(() => {
    if (isGameOver || isUpgrading || isSettingsOpen) return;
    const engine = engineRef.current;
    if (engine) {
      engine.isPaused = !engine.isPaused;
      setIsPaused(engine.isPaused);
    }
  }, [isGameOver, isUpgrading, isSettingsOpen]);

  const handleSave = useCallback(async () => {
    if (engineRef.current) {
      const state = engineRef.current.exportState();
      setGameStateToSave(state);
      setSaveSlotMode('save');
    }
  }, []);

  const handleLoad = useCallback(async () => {
    setSaveSlotMode('load');
  }, []);

  useEffect(() => {
    // Check for game start story beat
    const introBeat = StoryManager.getTriggeredBeat('game_start', 0);
    if (introBeat) {
      setActiveStoryBeat(introBeat);
      // We don't pause yet because engine might not be ready, 
      // but the cutscene overlay will block input
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [togglePause, isSettingsOpen]);

  const handleStoryTrigger = useCallback((type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige', value: number) => {
    const beat = StoryManager.getTriggeredBeat(type, value);
    if (beat) {
      if (engineRef.current) engineRef.current.pause();
      setActiveStoryBeat(beat);
    }
  }, []);

    // Apply challenge modifiers to engine when canvas ref is set
  useEffect(() => {
    if (engineRef.current && challengeModifiers && !engineRef.current.isChallengeMode) {
      engineRef.current.setChallengeModifiers(challengeModifiers);
    }
  }, [engineRef.current, challengeModifiers]);

  // Listen for challenge reward events to grant progression
  useEffect(() => {
    const handleReward = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.type === 'resources') {
        // Defer to ProgressionManager via dynamic import to avoid circular deps
        import('../game/ProgressionManager').then(({ ProgressionManager }) => {
          ProgressionManager.addResource(detail.id as ResourceType, detail.id === 'crystals' ? 25 : 500);
        });
      }
    };
    window.addEventListener('challenge_reward', handleReward);
    return () => { window.removeEventListener('challenge_reward', handleReward); };
  }, []);

  const canvasA11yStyle = getColorblindCanvasStyle(a11y.colorblindMode);

  const resolvedBiome = (() => {
    if (currentBiome === 'custom_map') {
      const map = CustomMapManager.getCustomMap(currentWave);
      return map ? map.id : 'toxic_reactor';
    }
    return currentBiome;
  })();

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* High-resolution predefined background gallery with seamless transition */}
      <BiomeBackgroundGallery biome={resolvedBiome} />

      <div
        className="absolute inset-0 w-full h-full z-10"
        style={canvasA11yStyle}
        aria-label="Game battlefield"
      >
        <GameCanvas
          ref={engineRef}
          key={gameId}
          gameMode={gameMode}
          onGameOver={handleGameOver}
          onWaveComplete={handleWaveComplete}
          onStoryTrigger={handleStoryTrigger}
          startBiome={startBiome}
        />
      </div>
      
      {!isGameOver && <HUD engineRef={engineRef} onPauseToggle={togglePause} isPaused={isPaused} />}
      
      {isPaused && !isGameOver && !isUpgrading && !isSettingsOpen && (
        <PauseMenu 
          onResume={togglePause}
          onSave={handleSave}
          onLoad={handleLoad}
          onSettings={() => { setIsSettingsOpen(true); }}
          onMainMenu={onMainMenu}
        />
      )}

      {isSettingsOpen && (
        <SettingsMenu onBack={() => { setIsSettingsOpen(false); }} />
      )}
      
      {isUpgrading && !isGameOver && (
        <UpgradeMenu 
          score={finalScore} 
          initialLevels={{
            health: engineRef.current?.healthLevel || 0,
            radius: engineRef.current?.radiusLevel || 0,
            turret: engineRef.current?.autoTurretLevel || 0
          }}
          onUpgrade={handleUpgrade} 
          onOpenProgression={() => { setIsProgressionOpen(true); }}
          onNextWave={handleNextWave} 
          wave={currentWave} 
        />
      )}

      {isProgressionOpen && (
        <ProgressionCenter onClose={() => {
          setIsProgressionOpen(false);
          if (engineRef.current) engineRef.current.syncSkills();
        }} />
      )}

      {!isGameOver && !isUpgrading && (
        <TutorialOverlay engineRef={engineRef} />
      )}
      
      {isGameOver && (
        <GameOver 
          score={finalScore} 
          wave={currentWave}
          onRetry={() => {
            // Reset state thoroughly
            setIsGameOver(false);
            setIsUpgrading(false);
            setIsPaused(false);
            setActiveStoryBeat(null);
            setFinalScore(0);
            setCurrentWave(1);
            setGameId(id => id + 1);
          }} 
          onMainMenu={onMainMenu} 
        />
      )}

      {activeStoryBeat && (
        <StoryCutscene 
          lines={activeStoryBeat.lines} 
          onComplete={() => {
            setActiveStoryBeat(null);
            if (engineRef.current && !isPaused && !isUpgrading) {
              engineRef.current.resume();
            }
          }}
        />
      )}

      {saveSlotMode !== null && (
        <SaveSlotsModal
          mode={saveSlotMode}
          gameStateToSave={gameStateToSave}
          onClose={() => { setSaveSlotMode(null); }}
          onSlotSaved={() => { setSaveSlotMode(null); }}
          onSlotLoaded={(data) => {
            if (engineRef.current) {
              engineRef.current.importState(data);
              setFinalScore(data.score);
              setCurrentWave(data.wave);
              togglePause();
            }
            setSaveSlotMode(null);
          }}
        />
      )}

      <TerminalLog unlockedLogs={unlockedLogs} />
    </div>
  );
}
