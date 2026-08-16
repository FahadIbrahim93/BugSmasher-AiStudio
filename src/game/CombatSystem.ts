import { GameEngine } from './GameEngine';
import { Bug } from './GameTypes';
import { GameConfig } from './GameConfig';
import { soundManager } from './SoundManager';
import { analytics } from '../lib/analytics';

/**
 * CombatSystem — player combat: rage/FURY, ground slam, damage routing,
 * kills, auto-turrets, active abilities, consumables, and the combat-side
 * timers/metrics. Follows the BossSystem pattern: receives a GameEngine
 * reference and reads/writes engine state directly.
 */
export class CombatSystem {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /** Reset combat-side session state (called from GameEngine.resetEntities). */
  reset() {
    const engine = this.engine;
    engine.weaponHeat = 0;
    engine.furyActive = false;
    engine.furyTimer = 0;
    engine.furyCooldownTimer = 0;
    engine.rageGainBudget = GameConfig.rage.maxGainPerSecond;
    engine.slamCharging = false;
    engine.slamCharge = 0;
    engine.furyTriggers = 0;
    engine.slamsUsed = 0;
  }

  /**
   * RAGE METER — every click/miss feeds the vent. At 100 the player erupts
   * into FURY MODE (guaranteed crits, AoE smashes, ×2 damage) instead of
   * being punished with a lockout. No cooling-down penalty for venting.
   */
  addRage(amount: number) {
    if (this.engine.furyActive) return; // already raging
    // Per-second gain cap: rage intake is budgeted so even max-APM play can't
    // insta-fill the meter — it refills over roughly the cooldown window.
    const applied = Math.min(amount, this.engine.rageGainBudget);
    this.engine.rageGainBudget -= applied;
    this.engine.weaponHeat = Math.min(GameConfig.rage.maxHeat, this.engine.weaponHeat + applied);
    // Post-FURY ignition cooldown: the meter keeps refilling, but FURY waits
    // until the cooldown clears so eruptions land roughly once per wave.
    if (this.engine.weaponHeat >= GameConfig.rage.maxHeat && this.engine.furyCooldownTimer <= 0) {
      this.triggerFury();
    }
  }

  /** Ignite FURY MODE — the venting power fantasy. */
  triggerFury() {
    if (this.engine.furyActive) return;
    this.engine.furyActive = true;
    this.engine.furyTimer = this.engine.furyDuration;
    this.engine.weaponHeat = GameConfig.rage.maxHeat;
    this.engine.furyTriggers++;
    soundManager.nuke();
    this.engine.shake(0.6, 30);
    this.engine.renderer.clickFlash = 0.8;
    this.engine.particleSystem.spawnShockwave(this.engine.width / 2, this.engine.height / 2, '#ff4400', 400);
    this.engine.particleSystem.spawnStarburst(this.engine.width / 2, this.engine.height / 2, '#ff6a00');
    analytics.track('fury_triggered', { trigger: this.engine.furyTriggers, wave: this.engine.wave });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_fury_active'));
    }
  }

  /** AoE smash on a click while FURY MODE is active. */
  applyFurySplash(x: number, y: number) {
    if (!this.engine.furyActive) return;
    const radius = 150;
    const radiusSq = radius * radius;
    this.engine.particleSystem.spawnShockwave(x, y, '#ff4400', radius);
    for (let i = this.engine.bugs.length - 1; i >= 0; i--) {
      const b = this.engine.bugs[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < radiusSq) {
        this.damageBug(b, 1);
      }
    }
  }

  /** Hold-to-charge Ground Slam — release for a crushing AoE. */
  triggerGroundSlam(x: number, y: number, charge: number) {
    this.engine.slamCharging = false;
    this.engine.slamCharge = 0;
    this.engine.slamsUsed++;
    analytics.track('slam_used', { charge: Math.round(charge * 100), wave: this.engine.wave });
    const radius = 90 + charge * 180;
    const radiusSq = radius * radius;
    const dmg = 1 + Math.round(charge * 3);

    this.engine.particleSystem.spawnShockwave(x, y, '#ff8800', radius);
    this.engine.particleSystem.spawnShockwave(x, y, '#ffffff', radius * 0.6);
    this.engine.particleSystem.spawnGibs(x, y, '#ff8800', 12);
    this.engine.shake(0.35, 20);
    this.engine.triggerHitStop(0.1);
    soundManager.bossDeath();
    this.engine.renderer.clickFlash = 0.6;

    for (let i = this.engine.bugs.length - 1; i >= 0; i--) {
      const b = this.engine.bugs[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < radiusSq) {
        this.damageBug(b, dmg);
      }
    }

    // Slamming is cathartic — the impact itself feeds the rage meter a little
    this.addRage(GameConfig.rage.perSlam);
  }

  /** Rage-refund pickup: when a streak breaks, drop a consolation powerup near the core. */
  spawnRageRefund() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const x = this.engine.coreX + Math.cos(angle) * dist;
    const y = this.engine.coreY + Math.sin(angle) * dist;
    this.engine.powerupSystem.spawn(x, y, true);
    this.engine.particleSystem.spawnShockwave(x, y, '#22c55e', 60);
  }

  fireAutoTurret(isRapidFire = false) {
    let closest = null;
    let minDistSq = Infinity;
    const cx = this.engine.coreX;
    const cy = this.engine.coreY;

    for (const bug of this.engine.bugs) {
      const dx = bug.x - cx;
      const dy = bug.y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = bug;
      }
    }

    if (closest) {
      soundManager.shoot();
      this.engine.renderer.fireAlpha = 1.0;
      this.engine.renderer.clickFlash = 0.3;
      this.engine.particleSystem.spawnMuzzleFlash(cx, cy, 30);

      this.engine.baseScale = 1.1;
      this.engine.baseRecoil = 5;
      this.engine.baseRecoilAngle = Math.atan2(closest.y - cy, closest.x - cx);

      if (isRapidFire) {
        this.engine.shake(0.05, 3);
        this.engine.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#ff00ff', 4);
      } else {
        this.engine.particleSystem.spawnLaser(cx, cy, closest.x, closest.y, '#00ffcc', 2);
      }
      this.damageBug(closest, 1);
    }
  }

  triggerUpgradeEffect() {
    this.engine.upgradeFlash = 1.0;
    this.engine.shake(0.2, 10);
    this.engine.particleSystem.spawnShockwave(this.engine.coreX, this.engine.coreY, '#00ffff', 400);
    soundManager.skillUpgrade();
  }

  damageBug(bug: Bug, amount: number) {
    let finalAmount = amount * this.engine.damageMultiplier;

    let isCrit = false;
    // Boss Vulnerability Strategy: Core Exposure
    if (bug.type === 'boss') {
      if (bug.isShielded) {
        this.engine.particleSystem.spawnShockwave(bug.x, bug.y, '#00ffff', 40);
        soundManager.uiError();
        return;
      }
      soundManager.bossHit();
      const pulse = Math.sin(this.engine.globalTime * 10);
      if (pulse > 0.8) {
        isCrit = true;
        finalAmount *= 2;
        this.engine.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 60);
        this.engine.triggerHitStop(0.05);
        this.engine.renderer.chromaticOffset = 10;
      } else if (pulse < -0.8) {
        finalAmount *= 0.5;
      }
    } else {
      const critChance = 0.05 + this.engine.progressionManager.getSkillBonus('crit_hit');
      if (Math.random() < critChance) {
        isCrit = true;
        finalAmount *= 2.0;
        this.engine.particleSystem.spawnShockwave(bug.x, bug.y, '#ffd700', 80);
        this.engine.renderer.chromaticOffset = 12;
      }
    }

    // FURY MODE: every hit is a guaranteed crit at ×2 damage — the venting reward
    const furyCrit = this.engine.furyActive;
    if (furyCrit) {
      isCrit = true;
      finalAmount *= 2.0;
      this.engine.particleSystem.spawnShockwave(bug.x, bug.y, '#ff6a00', 90);
    }

    if (isCrit) {
      soundManager.critHit();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_crit_hit'));
      }
    }

    if (bug.armor && bug.armor < 1.0 && bug.armor > 0) {
      finalAmount *= bug.armor;
    }

    bug.hp -= finalAmount;
    bug.hitTimer = 0.1;

    if (finalAmount >= 1) {
      this.engine.triggerHitStop(0.05);
      this.engine.shake(isCrit ? 0.09 : 0.05, isCrit ? 7 : 2);
    }

    // Reactive bug: scouts dive away from the strike point when they survive
    if (bug.type === 'scout' && bug.hp > 0 && !bug.dodgeTimer) {
      const fromX = this.engine.inputSystem?.lastMouseX ?? bug.x + 1;
      const fromY = this.engine.inputSystem?.lastMouseY ?? bug.y;
      const dx = bug.x - fromX;
      const dy = bug.y - fromY;
      const dist = Math.hypot(dx, dy) || 1;
      bug.dodgeTimer = 0.35;
      bug.dodgeDirX = dx / dist;
      bug.dodgeDirY = dy / dist;
      this.engine.particleSystem.spawnSmoke(bug.x, bug.y, 'rgba(200, 200, 255, 0.4)');
    }

    if (bug.hp <= 0) {
      this.killBug(bug);
    } else {
      // Crits already announce via critHit() above — avoid double-firing the plain shot
      if (!isCrit) soundManager.shoot();
      this.engine.particleSystem.spawnGibs(bug.x, bug.y, bug.color, 3);
      this.engine.particleSystem.spawnShockwave(bug.x, bug.y, '#ffffff', 30);
    }
  }

  private killBug(bug: Bug) {
    const engine = this.engine;
    const idx = engine.bugs.indexOf(bug);
    if (idx < 0) return;

    if (bug.type === 'swarmer') engine.swarmerKills++;
    if (bug.type === 'healer') engine.healerKills++;
    engine.killsInSubwave++;

    engine.totalKills++;
    engine.streakCount++;
    engine.streakTimer = 2.0;

    const isBossKill = bug.type === 'boss';

    this.engine.statsManager.updateStats({ totalBugsKilled: 1, bossesKilled: isBossKill ? 1 : 0 });

    const mult = engine.multiplierTimer > 0 ? 2 : 1;
    engine.score += bug.scoreValue * mult;

    // Dispatch smashed event for large bugs (size >= 20 or specific large types)
    if (
      bug.size >= 20 ||
      bug.type === 'boss' ||
      bug.type === 'tank' ||
      bug.type === 'healer' ||
      bug.type === 'ember'
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('nexus_bug_smashed', {
            detail: {
              type: bug.type,
              color: bug.color,
              size: bug.size,
              scoreValue: bug.scoreValue * mult,
              streak: engine.streakCount,
            },
          }),
        );
      }
    }

    soundManager.splat(bug.type);

    engine.triggerHitStop(0.04);

    const isBoss = bug.type === 'boss';
    const intensity = isBoss
      ? 4.0
      : bug.type === 'tank' || bug.type === 'swarmer'
        ? 1.4
        : bug.type === 'scout'
          ? 0.7
          : 0.9;
    engine.shake(isBoss ? 0.6 : 0.15 * intensity, isBoss ? 40 : 8 * intensity);

    // Reduce particle count on low-end or during surge — skip splatters (most expensive)
    if (engine.renderer.currentFps > 30) {
      engine.particleSystem.spawnSplatter(bug.x, bug.y, bug.color);
    }
    engine.particleSystem.spawnExplosion(bug.x, bug.y, bug.color, bug.type);

    // Splatter accumulation loop — every smash leaves persistent goo on the field
    engine.gooSystem.addGoo(bug.x, bug.y, bug.size, bug.color);

    engine.spawnResource(bug.x, bug.y, bug.type);

    if (isBoss) {
      soundManager.bossDeath();
      engine.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', 800);

      engine.onStoryTrigger?.('boss_kill', engine.wave);

      const dx = (bug.x - engine.coreX) / (engine.width / 2);
      const dy = (bug.y - engine.coreY) / (engine.height / 2);
      engine.shake(1.5, 60, dx, dy);
      engine.triggerHitStop(0.2);
      engine.renderer.chromaticOffset = 40;
      engine.impactFrame = 1.0;

      for (let i = 0; i < 3; i++) {
        engine.spawnPowerup(
          bug.x + (Math.random() - 0.5) * 50,
          bug.y + (Math.random() - 0.5) * 50,
          true,
        );
      }

      // Cap boss death particles based on current FPS
      const bossParticleCount = engine.renderer.currentFps > 30 ? 40 : 15;
      for (let i = 0; i < bossParticleCount; i++) {
        engine.particleSystem.spawnParticle(bug.x, bug.y, bug.color);
      }
    }

    // Swarmer splitting logic — skip on low FPS to prevent entity explosion
    const shouldSplit = engine.renderer.currentFps >= 25;
    if (shouldSplit && (bug.type === 'swarmer' || engine.currentBiome === 'golden_cache')) {
      const splitCount = engine.currentBiome === 'golden_cache' ? 2 : 3;
      for (let i = 0; i < splitCount; i++) {
        const angle = ((Math.PI * 2) / splitCount) * i;
        const dist = 20;
        const miniConf = GameConfig.bugs.mini;
        engine.bugs.push({
          active: true,
          x: bug.x + Math.cos(angle) * dist,
          y: bug.y + Math.sin(angle) * dist,
          type: 'mini',
          speed: miniConf.baseSpeed + engine.wave * miniConf.speedPerWave,
          color: miniConf.color,
          size: miniConf.size,
          scoreValue: miniConf.score,
          hp: miniConf.baseHp,
          maxHp: miniConf.baseHp,
          walkCycle: Math.random() * 10,
          rotation: 0,
          offsetTime: Math.random() * 100,
          hitTimer: 0,
        });
      }
    }

    if (engine.forceNextPowerup) {
      engine.forceNextPowerup = false;
      engine.spawnPowerup(bug.x, bug.y, true);
    } else {
      engine.spawnPowerup(bug.x, bug.y);
    }

    engine.bugs.splice(idx, 1);
  }

  consumeConsumable(id: string): boolean {
    if (!this.engine.progressionManager.consumeConsumable(id)) return false;

    switch (id) {
      case 'repair_kit':
        this.engine.health = Math.min(this.engine.maxHealth, this.engine.health + this.engine.maxHealth * 0.25);
        this.engine.particleSystem.spawnShockwave(this.engine.width / 2, this.engine.height / 2, '#00ffaa', 300);
        soundManager.skillUpgrade();
        break;
      case 'emp_generator':
        this.engine.bugs.forEach((b) => {
          if (b.type !== 'boss') {
            b.hp = 0;
            this.engine.particleSystem.spawnExplosion(b.x, b.y, b.color);
          }
        });
        this.engine.shake(1.5, 40);
        this.engine.particleSystem.spawnShockwave(this.engine.width / 2, this.engine.height / 2, '#ffffff', 1000);
        soundManager.bossDeath();
        break;
      case 'overdrive_chip':
        this.engine.overdriveTimer = 20;
        soundManager.powerup('overdrive');
        break;
    }
    return true;
  }

  updateTimers(dt: number) {
    const engine = this.engine;
    if (engine.clickCooldown > 0) engine.clickCooldown -= dt;

    // RAGE METER — FURY MODE drains the meter over its full duration;
    // otherwise it cools down slowly so the player can vent again
    if (engine.furyActive) {
      engine.furyTimer -= dt;
      // Drain the meter to match the advertised duration: 100 / 4s = 25/s
      engine.weaponHeat = Math.max(
        0,
        engine.weaponHeat - (GameConfig.rage.maxHeat / engine.furyDuration) * dt,
      );
      if (engine.furyTimer <= 0 || engine.weaponHeat <= 0) {
        engine.furyActive = false;
        engine.furyTimer = 0;
        engine.weaponHeat = 0;
        // Start the post-FURY ignition cooldown (once-per-wave cadence)
        engine.furyCooldownTimer = GameConfig.rage.furyCooldown;
      }
    } else {
      // Post-FURY cooldown: meter refills but FURY waits; auto-ignites the
      // moment the cooldown clears if the meter is already full
      if (engine.furyCooldownTimer > 0) {
        engine.furyCooldownTimer -= dt;
        if (engine.furyCooldownTimer <= 0) {
          engine.furyCooldownTimer = 0;
          if (engine.weaponHeat >= GameConfig.rage.maxHeat) this.triggerFury();
        }
      }
      if (!engine.furyActive && engine.weaponHeat > 0) {
        engine.weaponHeat -= GameConfig.rage.decayPerSecond * dt;
        if (engine.weaponHeat < 0) engine.weaponHeat = 0;
      }
    }

    // Refill the per-second rage gain budget (both during FURY and after, so
    // the meter is ready to charge the moment an eruption ends)
    engine.rageGainBudget = Math.min(
      engine.rageGainBudgetMax,
      engine.rageGainBudget + engine.rageGainBudgetMax * dt,
    );

    if (engine.shakeTime > 0) engine.shakeTime -= dt;
    if (engine.shieldTimer > 0) engine.shieldTimer -= dt;
    if (engine.multiplierTimer > 0) engine.multiplierTimer -= dt;
    if (engine.rapidFireTimer > 0) engine.rapidFireTimer -= dt;
    if (engine.slowMoTimer > 0) engine.slowMoTimer -= dt;
    if (engine.overdriveTimer > 0) engine.overdriveTimer -= dt;
    if (engine.freezeTimer > 0) engine.freezeTimer -= dt;
    if (engine.magnetTimer > 0) engine.magnetTimer -= dt;
    if (engine.spikeBurstTimer > 0) engine.spikeBurstTimer -= dt;
    if (engine.controlDistortionTimer > 0) engine.controlDistortionTimer -= dt;
    if (engine.glitchTimer > 0) {
      engine.glitchTimer -= dt;
      if (engine.glitchTimer <= 0) engine.renderer.isGlitching = false;
    }
    if (engine.waveTransitionTimer > 0) {
      engine.waveTransitionTimer = Math.max(0, engine.waveTransitionTimer - dt);
    }

    // Decrement active ability cooldowns and durations
    if (engine.bioshieldCooldown > 0)
      engine.bioshieldCooldown = Math.max(0, engine.bioshieldCooldown - dt);
    if (engine.bioshieldActiveTime > 0)
      engine.bioshieldActiveTime = Math.max(0, engine.bioshieldActiveTime - dt);
    if (engine.overdriveCooldown > 0)
      engine.overdriveCooldown = Math.max(0, engine.overdriveCooldown - dt);
    if (engine.overdriveActiveTime > 0)
      engine.overdriveActiveTime = Math.max(0, engine.overdriveActiveTime - dt);
    if (engine.empShatterCooldown > 0)
      engine.empShatterCooldown = Math.max(0, engine.empShatterCooldown - dt);
    if (engine.empShatterActiveTime > 0)
      engine.empShatterActiveTime = Math.max(0, engine.empShatterActiveTime - dt);

    // Ground Slam charge accumulation (charged while held, released on pointerup)
    if (engine.slamCharging) {
      engine.slamCharge = Math.min(engine.slamChargeMax, engine.slamCharge + dt * 1.4);
    }
  }

  updateMetrics(dt: number) {
    const engine = this.engine;
    if (engine.streakTimer > 0) {
      engine.streakTimer -= dt;
      if (engine.streakTimer <= 0 && engine.streakCount > 0) {
        soundManager.comboBreak();
        // Rage refund: the streak death drops a consolation powerup near the core
        this.spawnRageRefund();
        engine.streakCount = 0;
      }
    }
    const safetyBonus = Math.min(1.0, (engine.globalTime - engine.lastHitTime) / 20);
    const streakBonus = Math.min(1.0, engine.streakCount / 50);
    engine.performanceFactor = 0.8 + safetyBonus * 0.7 + streakBonus * 1.0;
    engine.playTimeAccumulator += dt;
    if (engine.playTimeAccumulator >= 10) {
      this.engine.statsManager.updateStats({ totalPlayTime: 10 });
      engine.playTimeAccumulator -= 10;
    }
    engine.baseScale += (1.0 - engine.baseScale) * 0.15;
    engine.baseRecoil *= 0.85;
    engine.upgradeFlash *= 0.92;
    engine.impactFrame = Math.max(0, engine.impactFrame - dt * 6);
  }

  updateTurrets(dt: number) {
    const engine = this.engine;
    if (
      engine.autoTurretLevel > 0 ||
      engine.rapidFireTimer > 0 ||
      engine.overdriveTimer > 0 ||
      engine.overdriveActiveTime > 0
    ) {
      engine.autoTurretTimer += dt * engine.hazardSlowdown;
      const baseFireRate = GameConfig.upgrades.turret.baseFireRate;
      let fireRate = Math.max(
        GameConfig.upgrades.turret.minFireRate,
        baseFireRate -
          engine.autoTurretLevel * GameConfig.upgrades.turret.fireRateReduction -
          this.engine.progressionManager.getSkillBonus('sentry_optimization'),
      );
      if (engine.overdriveTimer > 0 || engine.overdriveActiveTime > 0) fireRate *= 0.2;
      if (engine.rapidFireTimer > 0) fireRate = 0.05;

      if (engine.autoTurretTimer > fireRate && engine.bugs.length > 0) {
        engine.autoTurretTimer = 0;
        this.fireAutoTurret(engine.rapidFireTimer > 0 || engine.overdriveActiveTime > 0);
      }

      // Tactical Missile Sentry
      const missileLevel = this.engine.progressionManager.getSkillLevel('missile_sentry');
      if (missileLevel > 0) {
        engine.missileSentryTimer += dt;
        if (engine.missileSentryTimer >= 10.0) {
          engine.missileSentryTimer = 0;
          const threatTargets = engine.bugs.filter((b) => b.active && b.hp > 0);
          if (threatTargets.length > 0) {
            const target = threatTargets[0];
            engine.particleSystem.spawnLaser(engine.coreX, engine.coreY, target.x, target.y, '#fd8432');
            engine.particleSystem.spawnShockwave(target.x, target.y, '#f97316', 70);
            this.damageBug(target, 15 * missileLevel);
            soundManager.bossWarning();
          }
        }
      }
    }
  }

  // Active skills trigger (Progression Skill Tree)
  triggerActiveAbility(id: string): boolean {
    const engine = this.engine;
    const level = this.engine.progressionManager.getSkillLevel(id);
    if (level <= 0) {
      console.warn(`Ability ${id} is not unlocked!`);
      return false;
    }

    if (id === 'nanite_bioshield') {
      if (engine.bioshieldCooldown > 0) return false;
      engine.bioshieldCooldown = GameConfig.abilities.bioshieldCooldown; // from config per audit
      engine.bioshieldActiveTime = 4; // 4s invincibility
      engine.health = Math.min(engine.maxHealth, engine.health + 25);
      engine.particleSystem.spawnShockwave(engine.coreX, engine.coreY, '#10b981', 250);
      soundManager.heal();
      return true;
    }

    if (id === 'turret_overdrive') {
      if (engine.overdriveCooldown > 0) return false;
      engine.overdriveCooldown = 45; // 45s cooldown
      engine.overdriveActiveTime = 8; // 8s duration
      engine.particleSystem.spawnShockwave(engine.coreX, engine.coreY, '#fbbf24', 200);
      soundManager.armoryEquip();
      return true;
    }

    if (id === 'chrono_emp_shatter') {
      if (engine.empShatterCooldown > 0) return false;
      engine.empShatterCooldown = 50; // 50s cooldown
      engine.empShatterActiveTime = 5; // 5s duration
      engine.activatePowerup('freeze', engine.coreX, engine.coreY);
      engine.bugs.forEach((b) => {
        this.damageBug(b, b.hp * 0.3); // decay 30% of bug's current health
      });
      engine.particleSystem.spawnShockwave(engine.coreX, engine.coreY, '#a855f7', 350);
      soundManager.bossWarning();
      return true;
    }

    return false;
  }
}
