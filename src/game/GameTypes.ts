import { ResourceType } from './ResourceTypes';

export interface Bug { 
  active: boolean; 
  x: number; 
  y: number; 
  type: string; 
  variantId?: string; // New field for boss variety
  speed: number; 
  color: string; 
  size: number; 
  scoreValue: number; 
  hp: number; 
  maxHp: number; 
  walkCycle: number; 
  rotation: number; 
  offsetTime: number; 
  hitTimer: number;
  // Bug specific fields
  lastTeleportTime?: number;
  armor?: number;
  isHealing?: boolean;
  healCooldown?: number;
  healEffectTimer?: number;
  lavaTimer?: number;
  webTimer?: number; // New mechanic for spider boss
  // Reactive dodge (scout dive-away)
  dodgeTimer?: number;
  dodgeDirX?: number;
  dodgeDirY?: number;
  // Boss fields
  phase?: number;
  abilityTimer?: number;
  isShielded?: boolean;
}

export interface Hazard {
    id: string;
    x: number;
    y: number;
    radius: number;
    type: 'barrage' | 'shockwave' | 'lava' | 'web';
    timer: number;
    duration: number;
    active: boolean;
}

export interface Powerup { active: boolean; x: number; y: number; type: string; color: string; icon: string; life: number; maxLife: number; size: number; collection: string; }
export interface ResourcePickup { active: boolean; x: number; y: number; type: ResourceType; color: string; life: number; maxLife: number; size: number; }

/** Persistent goo splatter left by smashed bugs (garbage-collectable contamination). */
export interface GooPool {
  active: boolean;
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}
