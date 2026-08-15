import { GameEngine } from './GameEngine';
import { Bug } from './GameTypes';

/**
 * BugBehaviorSystem — enemy AI: movement, reactive dodge, erratic behavior,
 * challenge modifiers, and biome/type abilities. Follows the BossSystem
 * pattern: receives a GameEngine reference and reads/writes engine state
 * directly.
 */
export class BugBehaviorSystem {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  update(dt: number) {
    const engine = this.engine;
    const centerX = engine.coreX;
    const centerY = engine.coreY;
    let timeScale = engine.slowMoTimer > 0 ? 0.3 : 1.0;
    if (engine.freezeTimer > 0) timeScale = 0;

    for (let i = engine.bugs.length - 1; i >= 0; i--) {
      const bug = engine.bugs[i];
      const dx = centerX - bug.x;
      const dy = centerY - bug.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 900) {
        engine.collisionSystem.handleBugImpact(bug, centerX, centerY);
        engine.bugs.splice(i, 1);
        continue;
      }

      const dist = Math.sqrt(distSq);
      this.moveBug(bug, dx, dy, dist, dt, timeScale);
      this.updateBugAbilities(bug, dt, timeScale, distSq);
      if (bug.hitTimer > 0) bug.hitTimer -= dt;
      if (bug.healEffectTimer && bug.healEffectTimer > 0) {
        bug.healEffectTimer -= dt * timeScale;
        if (bug.healEffectTimer <= 0) bug.isHealing = false;
      }
    }
  }

  private moveBug(bug: Bug, dx: number, dy: number, dist: number, dt: number, timeScale: number) {
    const engine = this.engine;
    // Reactive dodge — scouts burst away from the last strike for a short window
    if (bug.dodgeTimer && bug.dodgeTimer > 0) {
      bug.dodgeTimer -= dt;
      const dodgeSpeed = bug.speed * 5 * timeScale;
      bug.x += (bug.dodgeDirX ?? 0) * dodgeSpeed * dt;
      bug.y += (bug.dodgeDirY ?? 0) * dodgeSpeed * dt;
      bug.walkCycle += dodgeSpeed * dt * 0.2;
      return;
    }

    let speed = bug.speed * timeScale;

    // Apply challenge modifiers
    if (engine.challengeModifiers) {
      speed *= engine.challengeModifiers.bugSpeedMultiplier;
      if (engine.challengeModifiers.speedDemonActive) {
        speed *= 1 + engine.challengeBugSpeedBonus;
      }
      if (engine.challengeModifiers.frostbiteActive) {
        // Slow to 20% speed when close to core, speed up over time
        const distFactor = Math.min(1, dist / 300);
        const frostSlow = 0.2 + distFactor * 0.8;
        speed *= frostSlow;
      }
    }
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;
    if (bug.type === 'scout' || bug.type === 'swarmer') {
      const erratic =
        Math.sin(engine.globalTime * 10 + bug.offsetTime) * (bug.type === 'swarmer' ? 1.2 : 0.5);
      vx += -vy * erratic;
      vy += (dx / dist) * speed * erratic;
    }
    bug.rotation = Math.atan2(vy, vx) - Math.PI / 2;
    bug.x += vx * dt;
    bug.y += vy * dt;
    bug.walkCycle += speed * dt * 0.2;
  }

  private updateBugAbilities(bug: Bug, dt: number, timeScale: number, distSq: number) {
    const engine = this.engine;
    // Biome-specific and type-specific abilities
    if (engine.currentBiome === 'void_abyss' || bug.type === 'phase') {
      bug.lastTeleportTime = (bug.lastTeleportTime || 0) + dt * timeScale;
      if (bug.lastTeleportTime > (bug.type === 'phase' ? 2.0 : 4.0) && distSq > 10000) {
        bug.lastTeleportTime = 0;
        engine.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 40);
        const angle = Math.random() * Math.PI * 2;
        bug.x += Math.cos(angle) * 100;
        bug.y += Math.sin(angle) * 100;
        engine.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 30);
      }
    }
    if (engine.currentBiome === 'golden_spire') {
      bug.hp = Math.min(bug.maxHp, Math.max(0, bug.hp + dt * 0.5));
    }
    if (bug.type === 'healer') {
      bug.healCooldown = (bug.healCooldown || 0) + dt * timeScale;
      if (bug.healCooldown > 3.0) {
        bug.healCooldown = 0;
        bug.isHealing = true;
        bug.healEffectTimer = 0.5;
        engine.particleSystem.spawnShockwave(bug.x, bug.y, '#00ff66', 150);

        const HEAL_RADIUS_SQ = 22500;
        for (const o of engine.bugs) {
          if (o !== bug && o.active) {
            const odx = o.x - bug.x;
            const ody = o.y - bug.y;
            if (odx * odx + ody * ody < HEAL_RADIUS_SQ) {
              o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.2);
            }
          }
        }
      }
    }
    // Delegate boss ability updates to BossSystem
    if (bug.type === 'boss') {
      engine.bossSystem.update(bug, dt, timeScale);
    }
  }
}
