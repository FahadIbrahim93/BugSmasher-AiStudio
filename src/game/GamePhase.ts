// ============================================================================
// GamePhase.ts — Story/Lore integration layer
// Maps the game's binary isPaused state to a proper phase state machine.
// All new story/lore/cutscene logic routes through this.
// ============================================================================

export enum GamePhase {
  /** Title screen, main menu, settings — engine is NOT running */
  MENU = 'menu',
  /** Intro cutscene / lore card before game starts */
  INTRO = 'intro',
  /** Main gameplay — engine loop active, bugs spawning */
  PLAYING = 'playing',
  /** Overlay scene between waves or boss encounters — engine IS paused */
  SCENE = 'scene',
  /** In-game pause menu — ESC or tap */
  PAUSED = 'paused',
  /** Wave-complete reward screen */
  WAVE_END = 'wave_end',
  /** Game over screen — engine is NOT running */
  GAME_OVER = 'game_over',
}

/** A single story scene with optional typewriter text */
export interface StoryScene {
  id: string;
  title: string;
  body: string;
  speaker?: string;       // e.g. "Dr. Elara — Lead Entomologist"
  speakerColor?: string;  // hex color for speaker name
  bossType?: string;      // set for boss scenes (armored_beetle, shadow_moth, etc.)
  illustration?: string;  // placeholder: boss name or biome name
  /** Time in ms before auto-advancing (0 = must click) */
  autoAdvanceMs?: number;
  /** Cinematic effect type when this scene displays */
  effect?: 'screen_flicker' | 'last_stand' | 'crystal_bonus' | 'screen_pulse' | 'overseer_manifest' | 'final_stand' | 'rift_sealed';
}

/** Scene data tied to a specific wave or event */
export interface SceneTrigger {
  /** e.g. 'wave_5', 'boss_armored_beetle', 'biome_glitch' */
  triggerId: string;
  scene: StoryScene;
  /** true = scene plays BEFORE the wave starts / boss spawns */
  preTrigger?: boolean;
}