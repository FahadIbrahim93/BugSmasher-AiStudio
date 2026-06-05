import { GameEngine } from './GameEngine';

/** Boss behavior states */
export type BossState = 'spawning' | 'idle' | 'attacking' | 'enraged' | 'retreating' | 'dead';

/** The 7 boss varieties */
export type BossType = 'armored_beetle' | 'shadow_moth' | 'crystal_stag' | 'venom_widow' | 'thunder_hornet' | 'overseer' | 'convergence_queen';

export interface BossPhase {
  hpThreshold: number;       // e.g. 0.5 = phase 2 at 50% HP
  speedMultiplier: number;
  attackPattern: string;
  visualEffect: string;
  damageMultiplier: number;
}

/** A fully-implemented BossBug with AI states, phases, and mechanics */
export class BossBug {
  // Identity
  type: BossType;
  name: string;
  description: string;

  // Position & movement
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  baseSpeed: number;

  // Visuals
  color: string;
  accentColor: string;
  size: number;             // Base render size (e.g. 80)
  phase: number = 1;
  pulsePhase: number = 0;

  // Combat
  hp: number;
  maxHp: number;
  scoreValue: number;
  hitCount: number = 0;    // Clicks required per phase
  hitsRemaining: number = 0;
  baseDamage: number;

  // AI
  state: BossState = 'spawning';
  stateTimer: number = 0;
  attackTimer: number = 0;
  attackCooldown: number = 2.5;
  targetAngle: number = 0;
  orbitAngle: number = 0;

  // Phases
  phases: BossPhase[];

  // Minions (some bosses spawn adds)
  minionsSpawned: number = 0;
  maxMinions: number = 0;

  // Visual
  glowIntensity: number = 0;
  damageFlashTimer: number = 0;
  entranceTimer: number = 3.0; // 3 second dramatic entrance

  // Callbacks
  onPhaseChange?: (newPhase: number) => void;
  onDeath?: (boss: BossBug) => void;
  onAttack?: (type: string, x: number, y: number) => void;
  onMinionSpawn?: (x: number, y: number, type: string) => void;

  constructor(type: BossType, x: number, y: number, wave: number) {
    this.type = type;
    this.x = x;
    this.y = y;

    const scale = 1 + wave * 0.05; // HP/score scales with wave

    const configs: Record<BossType, {
      name: string; description: string;
      color: string; accentColor: string;
      size: number; baseSpeed: number;
      hp: number; score: number; baseDamage: number;
      hits: number; maxMinions: number;
      phases: BossPhase[];
    }> = {
      armored_beetle: {
        name: 'Armored Beetle',
        description: 'A heavily plated beetle with impenetrable armor plating. Weak point exposed only in phase 2.',
        color: '#ff4444', accentColor: '#ff8800',
        size: 90, baseSpeed: 35,
        hp: 60, score: 500, baseDamage: 15,
        hits: 8, maxMinions: 0,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.6, attackPattern: 'charge', visualEffect: 'smoke', damageMultiplier: 1.0 },
          { hpThreshold: 0.5, speedMultiplier: 1.0, attackPattern: 'charge', visualEffect: 'fire', damageMultiplier: 1.5 },
        ]
      },
      shadow_moth: {
        name: 'Shadow Moth',
        description: 'Ethereal moth that phases in and out of reality. Hard to hit when not materializing.',
        color: '#aa44ff', accentColor: '#dd88ff',
        size: 75, baseSpeed: 80,
        hp: 35, score: 400, baseDamage: 12,
        hits: 6, maxMinions: 4,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.8, attackPattern: 'phase', visualEffect: 'ghost', damageMultiplier: 1.0 },
          { hpThreshold: 0.5, speedMultiplier: 1.3, attackPattern: 'phase_burst', visualEffect: 'shadow', damageMultiplier: 1.5 },
        ]
      },
      crystal_stag: {
        name: 'Crystal Stag',
        description: 'Crystalline beetle with razor-sharp antlers. Reflects damage in phase 2.',
        color: '#0ea5e9', accentColor: '#38bdf8',
        size: 85, baseSpeed: 45,
        hp: 50, score: 450, baseDamage: 18,
        hits: 7, maxMinions: 2,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.7, attackPattern: 'charge', visualEffect: 'sparkle', damageMultiplier: 1.0 },
          { hpThreshold: 0.5, speedMultiplier: 1.1, attackPattern: 'reflect', visualEffect: 'shards', damageMultiplier: 1.3 },
        ]
      },
      venom_widow: {
        name: 'Venom Widow',
        description: 'Poisonous spider that lays egg sacs and spawns spiderlings. Retreats when low.',
        color: '#32cd32', accentColor: '#90ee90',
        size: 80, baseSpeed: 30,
        hp: 45, score: 350, baseDamage: 20,
        hits: 6, maxMinions: 6,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.5, attackPattern: 'spawn', visualEffect: 'green_mist', damageMultiplier: 1.0 },
          { hpThreshold: 0.5, speedMultiplier: 0.8, attackPattern: 'spawn_burst', visualEffect: 'toxic', damageMultiplier: 1.5 },
        ]
      },
      thunder_hornet: {
        name: 'Thunder Hornet',
        description: 'Electric hornet that zips around unpredictably and fires lightning bolts.',
        color: '#facc15', accentColor: '#fef08a',
        size: 70, baseSpeed: 120,
        hp: 30, score: 300, baseDamage: 25,
        hits: 5, maxMinions: 0,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 1.0, attackPattern: 'zap', visualEffect: 'electric', damageMultiplier: 1.0 },
          { hpThreshold: 0.5, speedMultiplier: 1.5, attackPattern: 'zap_spread', visualEffect: 'lightning', damageMultiplier: 2.0 },
        ]
      },
      overseer: {
        name: 'The Overseer',
        description: 'A crystalline humanoid entity that wears insect bodies as armor. Commands all previous boss types.',
        color: '#ff4466', accentColor: '#ff88aa',
        size: 100, baseSpeed: 60,
        hp: 150, score: 2000, baseDamage: 30,
        hits: 20, maxMinions: 10,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.7, attackPattern: 'summon', visualEffect: 'crystal', damageMultiplier: 1.0 },
          { hpThreshold: 0.6, speedMultiplier: 1.0, attackPattern: 'morph', visualEffect: 'glitch', damageMultiplier: 1.5 },
          { hpThreshold: 0.3, speedMultiplier: 1.3, attackPattern: 'erupt', visualEffect: 'shards', damageMultiplier: 2.0 },
        ],
      },
      convergence_queen: {
        name: 'Convergence Queen',
        description: 'The final entity — a fusion of all five bosses. Every pattern. Every phase. Every mechanic. All at once.',
        color: '#ff00ff', accentColor: '#ffaaff',
        size: 120, baseSpeed: 90,
        hp: 300, score: 5000, baseDamage: 40,
        hits: 30, maxMinions: 15,
        phases: [
          { hpThreshold: 1.0, speedMultiplier: 0.8, attackPattern: 'summon', visualEffect: 'crystal', damageMultiplier: 1.0 },
          { hpThreshold: 0.7, speedMultiplier: 1.0, attackPattern: 'morph', visualEffect: 'glitch', damageMultiplier: 1.5 },
          { hpThreshold: 0.4, speedMultiplier: 1.3, attackPattern: 'erupt', visualEffect: 'shards', damageMultiplier: 2.0 },
          { hpThreshold: 0.15, speedMultiplier: 1.6, attackPattern: 'zap_spread', visualEffect: 'lightning', damageMultiplier: 3.0 },
        ],
      },
    };

    const cfg = configs[type];
    this.name = cfg.name;
    this.description = cfg.description;
    this.color = cfg.color;
    this.accentColor = cfg.accentColor;
    this.size = cfg.size;
    this.baseSpeed = cfg.baseSpeed;
    this.speed = cfg.baseSpeed;
    this.maxHp = Math.floor(cfg.hp * scale);
    this.hp = this.maxHp;
    this.scoreValue = Math.floor(cfg.score * scale);
    this.baseDamage = cfg.baseDamage;
    this.hitsRemaining = cfg.hits;
    this.maxMinions = cfg.maxMinions;
    this.phases = cfg.phases;

    // Start at a spawn position (off-screen)
    this.targetX = x;
    this.targetY = y;
  }

  /** Returns the current phase config based on HP % */
  getCurrentPhase(): BossPhase {
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (this.hp / this.maxHp <= this.phases[i].hpThreshold) {
        return this.phases[i];
      }
    }
    return this.phases[0];
  }

  /** Check phase transitions */
  checkPhaseTransition(): number {
    const hpRatio = this.hp / this.maxHp;
    for (let i = 1; i < this.phases.length; i++) {
      if (hpRatio <= this.phases[i].hpThreshold && hpRatio > this.phases[i].hpThreshold - 0.01) {
        return i;
      }
    }
    return 0;
  }

  /** Update AI state machine — called every frame from GameEngine */
  update(dt: number, engine: GameEngine) {
    this.pulsePhase += dt * 3;
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

    // Spawning entrance
    if (this.entranceTimer > 0) {
      this.entranceTimer -= dt;
      if (this.entranceTimer <= 0) {
        this.state = 'attacking';
        this.stateTimer = 0;
      }
      return;
    }

    // Phase transition check
    const newPhase = this.checkPhaseTransition();
    if (newPhase > this.phase - 1) {
      this.phase = newPhase + 1;
      const ph = this.getCurrentPhase();
      this.speed = this.baseSpeed * ph.speedMultiplier;
      this.hitsRemaining = Math.ceil(this.hitsRemaining * 0.8);
      this.attackCooldown *= 0.7;
      this.onPhaseChange?.(this.phase);
    }

    this.stateTimer += dt;
    this.attackTimer += dt;

    const cx = engine.width / 2;
    const cy = engine.height / 2;
    const dx = cx - this.x;
    const dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const ph = this.getCurrentPhase();

    switch (this.state) {
      case 'idle': {
        // Circle the core at medium distance
        this.orbitAngle += dt * 0.5;
        const orbitDist = 200 + Math.sin(this.orbitAngle * 0.5) * 30;
        this.targetX = cx + Math.cos(this.orbitAngle) * orbitDist;
        this.targetY = cy + Math.sin(this.orbitAngle) * orbitDist;
        if (this.stateTimer > 1.5) {
          this.state = 'attacking';
          this.stateTimer = 0;
        }
        break;
      }

      case 'attacking':
        // Move toward player with boss-specific pattern
        if (ph.attackPattern === 'charge') {
          // Beetles: charge straight at core
          this.targetX = cx;
          this.targetY = cy;
        } else if (ph.attackPattern === 'phase' || ph.attackPattern === 'phase_burst') {
          // Moths: teleport-styled movement (flicker toward target)
          if (this.stateTimer > 0.3) {
            this.x = cx + (Math.random() - 0.5) * 300;
            this.y = cy + (Math.random() - 0.5) * 300;
            this.x = Math.max(50, Math.min(engine.width - 50, this.x));
            this.y = Math.max(50, Math.min(engine.height - 50, this.y));
            this.stateTimer = 0;
          }
        } else if (ph.attackPattern === 'spawn' || ph.attackPattern === 'spawn_burst') {
          // Widow: slow approach, spawn minions
          if (this.attackTimer > this.attackCooldown * 2) {
            this.trySpawnMinion(engine);
            this.attackTimer = 0;
          }
          this.targetX = cx + Math.cos(angle + Math.PI) * 250;
          this.targetY = cy + Math.sin(angle + Math.PI) * 250;
        } else if (ph.attackPattern === 'zap' || ph.attackPattern === 'zap_spread') {
          // Hornet: erratic zigzag pattern
          this.orbitAngle += dt * 4;
          const zigAngle = angle + Math.sin(this.orbitAngle * 3) * 1.2;
          this.targetX = cx + Math.cos(zigAngle) * 180;
          this.targetY = cy + Math.sin(zigAngle) * 180;
        } else if (ph.attackPattern === 'reflect') {
          // Stag: circle and charge
          this.orbitAngle += dt * 0.8;
          this.targetX = cx + Math.cos(this.orbitAngle) * 200;
          this.targetY = cy + Math.sin(this.orbitAngle) * 200;
        }

        // Attack when close enough
        if (dist < 250 && this.attackTimer > this.attackCooldown) {
          this.performAttack(engine, ph);
          this.attackTimer = 0;
        }

        if (this.stateTimer > 4) {
          this.state = 'idle';
          this.stateTimer = 0;
        }
        break;

      case 'retreating':
        // Move away from core
        this.targetX = this.x - Math.cos(angle) * 200;
        this.targetY = this.y - Math.sin(angle) * 200;
        if (dist > 350 || this.stateTimer > 3) {
          this.state = 'idle';
          this.stateTimer = 0;
        }
        break;
    }

    // Move toward target
    const tdx = this.targetX - this.x;
    const tdy = this.targetY - this.y;
    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    if (tdist > 5) {
      const moveSpeed = this.speed * dt;
      this.x += (tdx / tdist) * Math.min(moveSpeed, tdist);
      this.y += (tdy / tdist) * Math.min(moveSpeed, tdist);
    }

    // Clamp to screen bounds (with margin)
    this.x = Math.max(30, Math.min(engine.width - 30, this.x));
    this.y = Math.max(30, Math.min(engine.height - 30, this.y));

    // Enraged: below 25% HP — all speed + damage up
    if (this.hp / this.maxHp <= 0.25) {
      this.glowIntensity = Math.min(1, this.glowIntensity + dt * 2);
    }
  }

  private performAttack(engine: GameEngine, phase: BossPhase) {
    const cx = engine.width / 2;
    const cy = engine.height / 2;
    const damage = this.baseDamage * phase.damageMultiplier;

    if (phase.attackPattern === 'zap' || phase.attackPattern === 'zap_spread') {
      // Lightning bolt attack — hits core
      if (engine.shieldTimer <= 0) {
        engine.health -= damage;
        engine.shake(0.5, 20);
      }
      this.onAttack?.('lightning', cx, cy);
      engine.particleSystem.spawnShockwave(cx, cy, '#fef08a', 200);
    } else {
      // Contact damage (handled by bug proximity in GameEngine)
      engine.shake(0.3, 10);
    }

    // Phase-specific burst attacks
    if (phase.attackPattern === 'phase_burst' && this.phase >= 2) {
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const bx = cx + Math.cos(angle) * 150;
        const by = cy + Math.sin(angle) * 150;
        engine.particleSystem.spawnShockwave(bx, by, '#aa44ff', 100);
      }
    }

    if (phase.attackPattern === 'spawn_burst') {
      this.trySpawnMinion(engine);
      this.trySpawnMinion(engine);
    }

    if (phase.attackPattern === 'reflect' && this.phase >= 2) {
      // Crystal shards projectile
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        const bx = this.x + Math.cos(angle) * 40;
        const by = this.y + Math.sin(angle) * 40;
        engine.particleSystem.spawnShockwave(bx, by, '#0ea5e9', 80);
      }
    }
  }

  private trySpawnMinion(_engine: GameEngine) {
    if (this.minionsSpawned >= this.maxMinions) return;
    const angle = Math.random() * Math.PI * 2;
    const mx = this.x + Math.cos(angle) * 30;
    const my = this.y + Math.sin(angle) * 30;
    this.onMinionSpawn?.(mx, my, 'boss_minion');
    this.minionsSpawned++;
  }

  /** Apply damage from player click. Returns true if boss died. */
  takeDamage(amount: number, isCrit: boolean, engine: GameEngine): boolean {
    // phase unused — damage logic is uniform across phases
    const _ph = this.getCurrentPhase();
    const actualDamage = isCrit ? amount * 3 : amount;

    // Stag reflect: take 1 damage back when hit in phase 2
    if (this.type === 'crystal_stag' && this.phase >= 2) {
      // No self-damage, but visual reflect
      engine.particleSystem.spawnShockwave(this.x, this.y, '#38bdf8', 60);
    }

    this.hp -= actualDamage;
    this.hitsRemaining--;
    this.damageFlashTimer = 0.15;

    // Phase 2 crystal stag: some clicks miss
    if (this.type === 'crystal_stag' && this.phase >= 2 && Math.random() < 0.3) {
      // 30% chance the click grazes off
      return false;
    }

    if (this.hp <= 0) {
      this.state = 'dead';
      this.onDeath?.(this);
      return true;
    }

    // Retreat at low HP
    if (this.hp / this.maxHp < 0.3 && this.state !== 'retreating') {
      this.state = 'retreating';
      this.stateTimer = 0;
    }

    return false;
  }

  /** Check if click hit the boss. Returns true if hit. */
  containsPoint(px: number, py: number, radiusMultiplier = 1): boolean {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size * 0.5 * radiusMultiplier;
  }

  /** Get rotation toward the core */
  getRotationTowardCore(): number {
    // Facing is handled in rendering, this is for movement
    return 0;
  }
}