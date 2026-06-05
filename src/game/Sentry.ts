import { GameEngine } from './GameEngine';

export interface Sentry {
  active: boolean;
  angle: number;
  fireTimer: number;
  level: number;      // 1-3: determines damage and fire rate
  x: number;         // Fixed position around core
  y: number;
}

const MAX_SENTRIES = 6;

export class SentryManager {
  sentries: Sentry[] = [];
  activeCount: number = 0;
  
  addSentry(level: number = 1) {
    if (this.activeCount >= MAX_SENTRIES) return false;
    // Position sentries in a circle around the core
    const angle = (this.activeCount / MAX_SENTRIES) * Math.PI * 2;
    const radius = 90;
    this.sentries.push({
      active: true,
      angle,
      fireTimer: 0,
      level,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
    this.activeCount++;
    return true;
  }
  
  removeSentry() {
    if (this.activeCount > 0) {
      this.sentries.pop();
      this.activeCount--;
    }
  }
  
  update(dt: number, engine: GameEngine) {
    const fireRates = [1.5, 1.0, 0.6];
    for (const sentry of this.sentries) {
      if (!sentry.active) continue;
      sentry.fireTimer -= dt;
      
      // Find target ONCE per sentry per frame (was called TWICE — major perf fix)
      const target = this.findTarget(engine, sentry);
      
      if (sentry.fireTimer <= 0 && target) {
        this.fireSentry(sentry, target, engine);
        sentry.fireTimer = fireRates[sentry.level - 1] ?? 1.0;
      }
      // Rotate toward nearest bug slowly
      if (target) {
        const dx = target.x - (engine.width / 2 + sentry.x);
        const dy = target.y - (engine.height / 2 + sentry.y);
        const targetAngle = Math.atan2(dy, dx);
        sentry.angle = this.lerpAngle(sentry.angle, targetAngle, dt * 2);
      }
    }
  }
  
  findTarget(engine: GameEngine, sentry: Sentry): any | null {
    let closest: any | null = null;
    let minDist = 300; // Range cap — squared comparison (no sqrt needed)
    const sx = engine.width / 2 + sentry.x;
    const sy = engine.height / 2 + sentry.y;
    const rangeSq = 90000; // 300^2
    for (const bug of engine.bugs) {
      if (!bug.active) continue;
      const dx = bug.x - sx;
      const dy = bug.y - sy;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDist) {
        minDist = distSq;
        closest = bug;
      }
    }
    return minDist < rangeSq ? closest : null;
  }
  
  fireSentry(sentry: Sentry, target: any, engine: GameEngine) {
    const sx = engine.width / 2 + sentry.x;
    const sy = engine.height / 2 + sentry.y;
    // Damage scales with level: 2, 5, 10
    const damages = [2, 5, 10];
    let damage = damages[sentry.level - 1] ?? 2;
    // Wave 17: crystal web reduces sentry effectiveness by 50%
    if (engine.waveCrystalWeb) {
      damage = Math.max(1, Math.floor(damage * 0.5));
    }
    // Wave 19: last stand protocol gives +20% sentry damage
    if (engine.waveLastStand) {
      damage = Math.max(1, Math.round(damage * 1.2));
    }
    engine.damageBug(target, damage);
    // Visual: laser line
    const colors = ['#00ffcc', '#ffaa00', '#ff4444'];
    engine.particleSystem.spawnLaser(sx, sy, target.x, target.y, colors[sentry.level - 1] ?? '#00ffcc');
    // Small shake
    engine.shake(0.05, 3);
  }
  
  lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * Math.min(t, 1);
  }
  
  reset() {
    this.sentries = [];
    this.activeCount = 0;
  }
  
  // Get count of sentries
  getCount(): number {
    return this.activeCount;
  }
  
  // Get sentry level distribution
  getLevelCounts(): { 1: number; 2: number; 3: number } {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const sentry of this.sentries) {
      if (sentry.active && sentry.level >= 1 && sentry.level <= 3) {
        counts[sentry.level as 1 | 2 | 3]++;
      }
    }
    return counts;
  }
}