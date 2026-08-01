import { GameEngine } from './GameEngine';
import { GooPool } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';
import { analytics } from '../lib/analytics';

/**
 * GooSystem — persistent splatter contamination loop.
 *
 * Smashed bugs leave glowing goo pools on the field. As contamination builds
 * (gooAmount 0–100) the viewport clouds and clicking slows; holding Q performs
 * "manual garbage collection", sweeping the goo away and recycling it into
 * resources. (Smash → clean up the mess. The therapy loop.)
 */
export class GooSystem {
  engine: GameEngine;

  gooPools: GooPool[] = [];
  gooAmount = 0;
  isCollecting = false;

  /** Slowdown applied to click cadence while heavily contaminated (1.0 = none). */
  get slowdownFactor(): number {
    if (this.gooAmount <= 50) return 1.0;
    return 1 - ((this.gooAmount - 50) / 50) * 0.35; // down to 0.65
  }

  private collectTimer = 0;
  private poolIdx = 0;
  gooSweeps = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /** Bug smashed — drop a goo pool and raise contamination (bigger bugs = more goo). */
  addGoo(x: number, y: number, size: number, color: string) {
    const pool: GooPool = {
      active: true,
      x,
      y,
      size: Math.min(60, 10 + size * 1.6),
      color,
      life: GameConfig.goo.poolLife,
      maxLife: GameConfig.goo.poolLife,
    };

    // Reuse oldest slot when the pool is full to avoid unbounded growth
    if (this.gooPools.length < GameConfig.goo.maxPools) {
      this.gooPools.push(pool);
    } else {
      this.gooPools[this.poolIdx % this.gooPools.length] = pool;
    }
    this.poolIdx++;

    this.gooAmount = Math.min(100, this.gooAmount + Math.min(GameConfig.goo.maxAddPerPool, size * GameConfig.goo.addPerSize));
  }

  /** Clean sweep: consume goo and convert it into recycled scrap pickups. */
  private collect(dt: number) {
    this.gooAmount = Math.max(0, this.gooAmount - GameConfig.goo.collectPerSecond * dt);
    this.collectTimer += dt;

    // Every 0.4s while sweeping, recycle a chunk of goo into a resource pickup
    if (this.collectTimer >= 0.4 && this.gooPools.length > 0) {
      this.collectTimer = 0;
      const pool = this.gooPools[Math.floor(Math.random() * this.gooPools.length)];
      this.engine.powerupSystem.spawnResource(pool.x, pool.y, 'basic');
      this.engine.particleSystem.spawnShockwave(pool.x, pool.y, '#39ff14', 30);
      soundManager.scoreTick();
      this.gooSweeps++;
      analytics.track('goo_swept', { chunks: this.gooSweeps });
    }
  }

  update(dt: number) {
    // Pools decay over time
    for (let i = this.gooPools.length - 1; i >= 0; i--) {
      const p = this.gooPools[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.gooPools.splice(i, 1);
        continue;
      }
      // Collection quickly dissolves nearby pools
      if (this.isCollecting) {
        p.life -= dt * GameConfig.goo.poolLifeCollectMultiplier;
      }
    }

    if (this.isCollecting && this.gooAmount > 0) {
      this.collect(dt);
    } else if (!this.isCollecting) {
      // Gentle natural evaporation so contamination never soft-locks a run
      this.gooAmount = Math.max(0, this.gooAmount - GameConfig.goo.evaporationPerSecond * dt);
    }
  }

  reset() {
    this.gooPools = [];
    this.gooAmount = 0;
    this.isCollecting = false;
    this.collectTimer = 0;
    this.poolIdx = 0;
    this.gooSweeps = 0;
  }
}
