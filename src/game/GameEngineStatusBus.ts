/**
 * Typed replacement for `(window as any).__gameEngineStatus`.
 * React/UI layers subscribe via events; GameEngine publishes each frame while running.
 */

export interface GameEngineStatus {
  health: number;
  maxHealth: number;
  currentBiome: string;
  intensity: number;
  performanceFactor: number;
  weaponHeat: number;
  /** FURY MODE active — rage meter filled; smashes become guaranteed crits + AoE */
  furyActive: boolean;
  /** Seconds remaining in the post-FURY ignition cooldown (0 = can ignite) */
  furyCooldown: number;
  dashCooldownTimer: number;
  dashCooldown: number;
  rapidFireTimer: number;
  spikeBurstTimer: number;
  /** Combined screen shake intensity for parallax backgrounds */
  shakeIntensity: number;
}

export type GameEngineStatusListener = (status: GameEngineStatus | null) => void;

const STATUS_EVENT = 'bugsmasher:engine-status';

export class GameEngineStatusBus {
  private static current: GameEngineStatus | null = null;

  static publish(status: GameEngineStatus | null): void {
    this.current = status;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<GameEngineStatus | null>(STATUS_EVENT, { detail: status })
    );
  }

  static getSnapshot(): GameEngineStatus | null {
    return this.current;
  }

  static subscribe(listener: GameEngineStatusListener): () => void {
    if (typeof window === 'undefined') {
      listener(this.current);
      return () => undefined;
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<GameEngineStatus | null>).detail ?? null;
      listener(detail);
    };

    window.addEventListener(STATUS_EVENT, handler);
    listener(this.current);

    return () => { window.removeEventListener(STATUS_EVENT, handler); };
  }

  /** @deprecated Use subscribe() — kept for one release to ease migration */
  static syncLegacyWindowGlobal(status: GameEngineStatus | null): void {
    if (typeof window === 'undefined') return;
    (window as Window & { __gameEngineStatus?: GameEngineStatus | null }).__gameEngineStatus =
      status;
  }
}