import { GameEngine } from './GameEngine';
import { soundManager } from './SoundManager';
import { Bug, Powerup } from './GameTypes';
import { loadControlBindings, matchesBinding } from './ControlBindings';
import { ProgressionManager } from './ProgressionManager';
import { GameConfig } from './GameConfig';  // Fixed: added missing import per audit (was causing ReferenceError and 3 test failures)

export class InputSystem {
  private engine: GameEngine;
  public lastMouseX: number = 0;
  public lastMouseY: number = 0;
  private _lastClickTime: number = 0;
  private rapidClickCount: number = 0;
  private rapidClickWindow: number = 0;

  private get isClickThrottled(): boolean {
    const now = performance.now();
    // Reset click burst counter every 500ms
    if (now - this.rapidClickWindow > 500) {
      this.rapidClickCount = 0;
      this.rapidClickWindow = now;
    }
    this.rapidClickCount++;
    // Throttle heavy effects when clicking faster than 8 clicks/sec
    return this.rapidClickCount > 4;
  }

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.lastMouseX = engine.width / 2;
    this.lastMouseY = engine.height / 2;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    this.engine.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.engine.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('keydown', this.handleKeyDown);
    this.handleGamepad = this.handleGamepad.bind(this);
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

  private handleGamepad(): void {
    if (!this.engine.isRunning || this.engine.isPaused) return;
    const pads = navigator.getGamepads?.();
    if (!pads) return;
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
      this.processClick(this.lastMouseX + (this.engine.canvas.getBoundingClientRect?.()?.left ?? 0), this.lastMouseY + (this.engine.canvas.getBoundingClientRect?.()?.top ?? 0));
    }
    this.lastGamepadClick = !!fire;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    if (this.engine.isPaused || !this.engine.isRunning) return;
    const bindings = loadControlBindings();
    if (matchesBinding(e.code, bindings.dash) || e.key === 'Shift') {
      e.preventDefault();
      this.engine.triggerDash(this.lastMouseX, this.lastMouseY);
    }
  }

  private handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    if (this.engine.isPaused) return;
    soundManager.init();
    
    const rect = this.engine.canvas.getBoundingClientRect();
    this.lastMouseX = e.clientX - rect.left;
    this.lastMouseY = e.clientY - rect.top;
    
    this.processClick(e.clientX, e.clientY);
  }

  private handlePointerMove(e: PointerEvent) {
    const rect = this.engine.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.lastMouseX = x;
    this.lastMouseY = y;

    if (!this.engine.isRunning || !this.engine.waveManager.waveActive || this.engine.isPaused) {
      if (this.engine.canvas) {
        this.engine.canvas.removeAttribute('data-hovering-game-object');
      }
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

    if (this.engine.canvas) {
      if (isHovering) {
        this.engine.canvas.setAttribute('data-hovering-game-object', 'true');
      } else {
        this.engine.canvas.removeAttribute('data-hovering-game-object');
      }
    }
  }

  public processClick(clientX: number, clientY: number) {
    const engine = this.engine;
    if (!engine.isRunning || !engine.waveManager.waveActive || engine.isPaused) return;
    
    const rect = engine.canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    if (engine.isOverheated) {
      soundManager.uiError();
      engine.particleSystem.spawnSmoke(clickX, clickY, 'rgba(239, 68, 68, 0.45)');
      return;
    }

    if (engine.clickCooldown > 0) return;

    // Weapon Heat Mechanics
    let heatIncrease = 15;
    if (engine.rapidFireTimer > 0) {
      heatIncrease = 0; // Rapid fire powerup operates at absolute zero thermal friction
    } else if (engine.overdriveTimer > 0) {
      heatIncrease = 4.5; // Overdrive chip has an optimized cooling buffer
    }

    engine.weaponHeat = Math.min(100, engine.weaponHeat + heatIncrease);
    if (engine.weaponHeat >= 100) {
      engine.isOverheated = true;
      soundManager.uiError();
      engine.particleSystem.spawnSmoke(clickX, clickY, 'rgba(239, 68, 68, 0.7)');
      engine.particleSystem.spawnShockwave(clickX, clickY, '#ef4444', 70);
    }
    
    // Set click cooldown (Slightly slower if webbed)
    engine.clickCooldown = 0.08 / engine.hazardSlowdown;
    
    let x = clickX;
    let y = clickY;

    // Distorted Controls Mechanic
    if (engine.controlDistortionTimer > 0) {
      const centerX = engine.width / 2;
      const centerY = engine.height / 2;
      x = centerX + (centerX - x); // Mirror X
      y = centerY + (centerY - y); // Mirror Y
      
      // Visual feedback for distortion
      engine.renderer.chromaticOffset = 10;
      if (Math.random() < 0.2) engine.renderer.isGlitching = true;
    }

    // Intercept with PCG System
    if (engine.pcgSystem && engine.pcgSystem.activeMap) {
      const hitNode = engine.pcgSystem.checkNodeHit(x, y);
      if (hitNode) {
        return; // Intercepted successfully!
      }
    }

    const cx = engine.width / 2;
    const cy = engine.height / 2;
    const throttled = this.isClickThrottled;
    const lowEnd = engine.renderer?.isLowEnd ?? false;

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
    const gravityLevel = ProgressionManager.getSkillLevel('gravity_well');
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
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(12);
        }
        engine.damageBug(bug, 1);

        // Nanite Lifesteal (Bio-Scavenger) passive hit restoration
        const lifestealChance = ProgressionManager.getSkillBonus('nanite_lifesteal');
        if (lifestealChance > 0 && Math.random() < lifestealChance) {
          engine.health = Math.min(engine.maxHealth, engine.health + 1);
          engine.particleSystem.spawnShockwave(x, y, '#10b981', 30);
          soundManager.heal();
        }

        break;
      }
    }
    
    if (!hit) {
      soundManager.shoot();
      engine.particleSystem.spawnMissParticles(x, y);
      engine.missedClicksInSubwave++;
    }
  }

  public destroy() {
    this.stopGamepadPolling();
    this.engine.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.engine.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
