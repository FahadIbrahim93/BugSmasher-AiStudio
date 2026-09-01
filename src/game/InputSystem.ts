import { GameEngine } from './GameEngine';
import { soundManager } from './SoundManager';
// (removed unused Bug/Powerup import for lint)
import { loadControlBindings, matchesBinding } from './ControlBindings';
import { GameConfig } from './GameConfig';  // Fixed: added missing import per audit (was causing ReferenceError and 3 test failures)

export class InputSystem {
  private engine: GameEngine;
  public lastMouseX = 0;
  public lastMouseY = 0;
  private rapidClickCount = 0;
  private rapidClickWindow = 0;

  private get isClickThrottled(): boolean {
    const now = performance.now();
    // Reset click burst counter every 500ms
    if (now - this.rapidClickWindow > 500) {
      this.rapidClickCount = 0;
      this.rapidClickWindow = now;
    }
    this.rapidClickCount++;
    // Only throttle heavy effects on mobile — desktop gets full juice at any APM
    return this.engine.isMobile && this.rapidClickCount > 4;
  }

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.lastMouseX = engine.width / 2;
    this.lastMouseY = engine.height / 2;
    this.engine.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.engine.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.engine.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.engine.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private gamepadPollId: number | null = null;
  private lastGamepadClick = false;

  startGamepadPolling(): void {
    if (!this.engine.accessibility.gamepadEnabled) return;
    if (this.gamepadPollId !== null) return;
    const poll = () => {
      this.handleGamepad();
      this.gamepadPollId = requestAnimationFrame(poll);
    };
    this.gamepadPollId = requestAnimationFrame(poll);
  }

  stopGamepadPolling(): void {
    if (this.gamepadPollId !== null) {
      cancelAnimationFrame(this.gamepadPollId);
      this.gamepadPollId = null;
    }
  }

  private handleGamepad = (): void => {
    if (!this.engine.isRunning || this.engine.isPaused) return;
    // Older browsers and jsdom lack the Gamepad API even though DOM types declare it.
    if (typeof navigator.getGamepads !== 'function') return;
    const pads = navigator.getGamepads();
    const pad = pads[0];
    if (!pad) return;
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const deadzone = 0.2;
    if (Math.abs(ax) > deadzone || Math.abs(ay) > deadzone) {
      this.lastMouseX = Math.max(
        0,
        Math.min(this.engine.width, this.lastMouseX + ax * 12)
      );
      this.lastMouseY = Math.max(
        0,
        Math.min(this.engine.height, this.lastMouseY + ay * 12)
      );
    }
    const fire = pad.buttons[0]?.pressed || pad.buttons[7]?.pressed;
    if (fire && !this.lastGamepadClick) {
      const rect = this.engine.canvas.getBoundingClientRect();
      this.processClick(this.lastMouseX + rect.left, this.lastMouseY + rect.top);
    }
    this.lastGamepadClick = fire;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (this.engine.isPaused || !this.engine.isRunning) return;
    // Q = Manual Garbage Collection: sweep goo contamination and recycle it
    if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      this.engine.gooSystem.isCollecting = true;
      return;
    }
    const bindings = loadControlBindings();
    if (matchesBinding(e.code, bindings.dash) || e.key === 'Shift') {
      e.preventDefault();
      this.engine.triggerDash(this.lastMouseX, this.lastMouseY);
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
      this.engine.gooSystem.isCollecting = false;
    }
  };

  // Ground Slam hold-to-charge tracking
  private pointerDownTime = 0;

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    if (this.engine.isPaused) return;
    soundManager.init();
    
    const rect = this.engine.canvas.getBoundingClientRect();
    this.lastMouseX = e.clientX - rect.left;
    this.lastMouseY = e.clientY - rect.top;
    this.pointerDownTime = performance.now();

    // Start charging the Ground Slam — release after a hold triggers it
    if (this.engine.isRunning && this.engine.waveManager.waveActive) {
      this.engine.slamCharging = true;
      this.engine.slamCharge = 0;
    }

    this.processClick(e.clientX, e.clientY);
  }

  private handlePointerUp = (e: PointerEvent) => {
    const engine = this.engine;
    const wasCharging = engine.slamCharging;
    engine.slamCharging = false;
    if (engine.isPaused || !engine.isRunning || !engine.waveManager.waveActive) return;
    if (!wasCharging) return;

    const heldMs = performance.now() - this.pointerDownTime;
    // A deliberate hold (>= 250ms) releases the Ground Slam; quick taps stay clicks
    if (heldMs >= 250) {
      const rect = engine.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const charge = Math.min(1, engine.slamCharge);
      engine.triggerGroundSlam(x, y, charge);
    }
  }

  private handlePointerMove = (e: PointerEvent) => {
    const rect = this.engine.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.lastMouseX = x;
    this.lastMouseY = y;

    if (!this.engine.isRunning || !this.engine.waveManager.waveActive || this.engine.isPaused) {
      this.engine.canvas.removeAttribute('data-hovering-game-object');
      return;
    }
    
    let isHovering = false;
    for (let i = this.engine.powerups.length - 1; i >= 0; i--) {
      const p = this.engine.powerups[i];
      if (p.collection === 'hover') {
        const dx = p.x - x;
        const dy = p.y - y;
        const distSq = dx * dx + dy * dy;
        const collectRadius = p.size * 3;
        
        // Match hovering states when within slightly larger hover radius
        const hoverRadius = collectRadius * 3;
        if (distSq < hoverRadius * hoverRadius) {
          isHovering = true;
        }

        if (distSq < collectRadius * collectRadius) {
          this.engine.activatePowerup(p.type, p.x, p.y);
          this.engine.powerups.splice(i, 1);
        }
      }
    }

    if (isHovering) {
      this.engine.canvas.setAttribute('data-hovering-game-object', 'true');
    } else {
      this.engine.canvas.removeAttribute('data-hovering-game-object');
    }
  }

  public processClick(clientX: number, clientY: number) {
    const engine = this.engine;
    if (!engine.isRunning || !engine.waveManager.waveActive || engine.isPaused) return;
    
    const rect = engine.canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    if (engine.clickCooldown > 0) return;

    // Set click cooldown (slower if webbed or goo-contaminated)
    engine.clickCooldown = 0.08 / (engine.hazardSlowdown * engine.gooSystem.slowdownFactor);
    
    let x = clickX;
    let y = clickY;

    // Distorted Controls — softened partial deflection (35% offset, not a full mirror)
    // with a heavy visual telegraph so the player is never secretly hijacked.
    if (engine.controlDistortionTimer > 0) {
      const centerX = engine.width / 2;
      const centerY = engine.height / 2;
      x = centerX + (centerX - x) * 0.35;
      y = centerY + (centerY - y) * 0.35;
      
      // Always telegraph the hijack while active
      engine.renderer.chromaticOffset = 12;
      engine.renderer.isGlitching = true;
      engine.particleSystem.spawnSmoke(x, y, 'rgba(150, 0, 255, 0.3)');
    }

    // Intercept with PCG System
    if (engine.pcgSystem.activeMap) {
      const hitNode = engine.pcgSystem.checkNodeHit(x, y);
      if (hitNode) {
        return; // Intercepted successfully!
      }
    }

    const throttled = this.isClickThrottled;

    if (!throttled) {
      // Full tactile smash effects
      engine.particleSystem.spawnInputFeedback(x, y);
      engine.particleSystem.spawnClickPulse(x, y);
      engine.particleSystem.spawnMissParticles(x, y);
    } else {
      // Throttled: minimal click effect
      engine.particleSystem.spawnClickPulse(x, y);
    }
    engine.renderer.clickFlash = 0.4; // Subtle screen flash for tactile weight
    if (!throttled) {
      engine.shake(0.06, 4.5); // Satisfying heavy screen shake
    }

    if (engine.spikeBurstTimer > 0) {
      engine.particleSystem.spawnShockwave(x, y, '#ff3300', 150);
      const SPIKE_RADIUS_SQ = 150 * 150;
      engine.bugs.forEach(b => {
        const dx = b.x - x;
        const dy = b.y - y;
        if (dx * dx + dy * dy < SPIKE_RADIUS_SQ) engine.damageBug(b, 2);
      });
    }

    // Gravity Well (Temporal Technomancer) click magnet effect
    const gravityLevel = this.engine.progressionManager.getSkillLevel('gravity_well');
    if (gravityLevel > 0) {
      const pullRadius = gravityLevel * 100 + 100;
      const pullRadiusSq = pullRadius * pullRadius;
      engine.resources.forEach(res => {
        const rx = res.x - x;
        const ry = res.y - y;
        const distSq = rx * rx + ry * ry;
        if (distSq < pullRadiusSq) {
          const dist = Math.sqrt(distSq);
          if (dist > 5) {
            res.x -= (rx / dist) * 100 * gravityLevel * 0.15;
            res.y -= (ry / dist) * 100 * gravityLevel * 0.15;
          }
        }
      });
      engine.powerups.forEach(p => {
        const px = p.x - x;
        const py = p.y - y;
        const distSq = px * px + py * py;
        if (distSq < pullRadiusSq) {
          const dist = Math.sqrt(distSq);
          if (dist > 5) {
            p.x -= (px / dist) * 100 * gravityLevel * 0.15;
            p.y -= (py / dist) * 100 * gravityLevel * 0.15;
          }
        }
      });
    }

    for (let i = engine.powerups.length - 1; i >= 0; i--) {
      const p = engine.powerups[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const distSq = dx * dx + dy * dy;
      const collectRadius = p.size * 2;
      if (distSq < collectRadius * collectRadius) {
        engine.activatePowerup(p.type, p.x, p.y);
        engine.powerups.splice(i, 1);
        return;
      }
    }
    
    let hit = false;
    for (let i = engine.bugs.length - 1; i >= 0; i--) {
      const bug = engine.bugs[i];
      const dx = bug.x - x;
      const dy = bug.y - y;
      const distSq = dx * dx + dy * dy;
      
      const clickRadius = bug.size * GameConfig.player.baseClickRadiusMultiplier * engine.clickRadiusMultiplier;
      if (distSq < clickRadius * clickRadius) {
        hit = true;
        // RAGE METER — a landed smash feeds the vent (perHit default; rapid-fire is
        // frictionless, overdrive runs an optimized cooling buffer). NOTE: modifier
        // gains are absolute values, not multipliers of perHit. Powerup-collection
        // and PCG-intercepted clicks intentionally do not feed rage (not a smash).
        let rageGain = GameConfig.rage.perHit;
        if (engine.rapidFireTimer > 0) {
          rageGain = GameConfig.rage.hitWithRapidFire;
        } else if (engine.overdriveTimer > 0) {
          rageGain = GameConfig.rage.hitWithOverdrive;
        }
        engine.addRage(rageGain);
        // Desktop browsers and jsdom lack vibrate() even though DOM types declare it.
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate(12);
        }
        engine.damageBug(bug, 1);

        // Nanite Lifesteal (Bio-Scavenger) passive hit restoration
        const lifestealChance = this.engine.progressionManager.getSkillBonus('nanite_lifesteal');
        if (lifestealChance > 0 && Math.random() < lifestealChance) {
          engine.health = Math.min(engine.maxHealth, engine.health + 1);
          engine.particleSystem.spawnShockwave(x, y, '#10b981', 30);
          soundManager.heal();
        }

        break;
      }
    }
    
    if (!hit) {
      soundManager.miss();
      // Missing builds rage — the swing and miss makes you angrier, which feeds FURY MODE
      engine.addRage(GameConfig.rage.perMiss);
      engine.particleSystem.spawnMissParticles(x, y);
      engine.missedClicksInSubwave++;
    }

    // FURY MODE: every smash becomes an AoE splash through the swarm
    if (engine.furyActive) {
      engine.applyFurySplash(x, y);
    }
  }

  public destroy() {
    this.stopGamepadPolling();
    this.engine.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.engine.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.engine.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.engine.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
