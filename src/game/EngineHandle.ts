import type { Bug, Hazard, Powerup } from './GameTypes';
import type { ParticleSystem } from './ParticleSystem';
import type { GameModeId } from './GameMode';
import type { GameSaveData } from './SaveManager';
import type { ChallengeModifierId } from './DailyChallengeManager';

/**
 * Typed handle exposed to React components via GameCanvas's ref.
 *
 * This is a subset of GameEngine's public API — only the properties and
 * methods consumed by HUD, Game, TutorialOverlay, etc. are listed here.
 * The Proxy in GameCanvas forwards all property access to the real engine
 * instance at runtime, but consumers are type-checked against this surface.
 */
export interface EngineHandle {
  // ── Game state ──
  score: number;
  wave: number;
  health: number;
  maxHealth: number;
  isPaused: boolean;
  isChallengeMode: boolean;
  waveModifier: string | null;
  performanceFactor: number;
  streakCount: number;
  dashCooldownTimer: number;
  dashCooldown: number;
  width: number;
  height: number;

  // ── Progression / upgrades ──
  healthLevel: number;
  radiusLevel: number;
  autoTurretLevel: number;
  clickRadiusMultiplier: number;

  // ── Tutorial tracking ──
  totalKills: number;
  totalPowerupsCollected: number;
  forceNextPowerup: boolean;

  // ── Session stats ──
  swarmerKills: number;
  healerKills: number;
  killsInSubwave: number;
  missedClicksInSubwave: number;
  playTimeAccumulator: number;

  // ── Powerup timers (read by HUD ActivePowerups display) ──
  shieldTimer: number;
  multiplierTimer: number;
  rapidFireTimer: number;
  slowMoTimer: number;
  overdriveTimer: number;

  // ── Entity collections (for diagnostics / HUD) ──
  bugs: Bug[];
  powerups: Powerup[];
  hazards: Hazard[];
  particleSystem: ParticleSystem;

  // ── Methods ──
  setGameMode(mode: GameModeId): void;
  start(): void;
  destroy(): void;
  pause(): void;
  resume(): void;
  triggerUpgradeEffect(): void;
  syncSkills(): void;
  exportState(): GameSaveData;
  importState(data: GameSaveData): void;
  setChallengeModifiers(modifiers: ChallengeModifierId[]): void;
  triggerDash(targetX: number, targetY: number): void;
  useConsumable(id: string): boolean;
}
