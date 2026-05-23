export interface Bug {
  id: string
  x: number
  y: number
  active: boolean
  hp: number
  maxHp: number
  type: string
  isBoss: boolean
  velocity: { x: number; y: number }
  speed: number
  color: string
  size: number
  scoreValue: number
  walkCycle: number
  rotation: number
  offsetTime: number
  hitTimer: number
  variantId?: string
  armor?: number
  isHealing?: boolean
  healCooldown?: number
  healEffectTimer?: number
  lastTeleportTime?: number
  abilityTimer?: number
  isShielded?: boolean
  phase?: number
  webTimer?: number
}

export interface Hazard {
  id: string
  x: number
  y: number
  radius: number
  type: 'barrage' | 'shockwave' | 'lava' | 'web'
  timer: number
  duration: number
  active: boolean
}

export interface Powerup {
  active: boolean
  x: number
  y: number
  type: string
  color: string
  icon: string
  life: number
  maxLife: number
  size: number
  collection: string
}

export interface GameState {
  score: number
  health: number
  maxHealth: number
  wave: number
  gameOver: boolean
  isPaused: boolean
  isPlaying: boolean
  currentBiome: string
  performanceFactor: number
  shieldTimer: number
  multiplierTimer: number
  rapidFireTimer: number
  slowMoTimer: number
  overdriveTimer: number
  freezeTimer: number
  magnetTimer: number
  upgradeData: Record<string, number>
  bugsKilled: number
  combo: number
  crystals: number
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'upgrade' | 'gameOver' | 'story' | 'intro'

export interface StoryScene {
  id: string
  wave: number
  title: string
  body: string
  speaker: string | null
  effect?: string
}
