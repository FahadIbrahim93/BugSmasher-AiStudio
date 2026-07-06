import { GameEngine } from './GameEngine';
import { soundManager } from './SoundManager';
import { ResourceType } from './ResourceTypes';

export type PCGTheme = 'nuclear_melt' | 'cyberspace_node' | 'void_rift' | 'glacier_ice' | 'magma_core';

export interface PCGObstacle {
  id: string;
  x: number;
  y: number;
  type: 'healing_conduit' | 'electric_node' | 'magma_vent' | 'ice_crystal' | 'refinery_node';
  hp: number;
  maxHp: number;
  size: number;
  color: string;
  active: boolean;
  pulseTimer: number;
}

export interface PCGObjective {
  id: string;
  x: number;
  y: number;
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  charge: number; // 0 to 100%
  defendedBonusTriggered: boolean;
}

export interface PCGMapConfig {
  seed: string;
  theme: PCGTheme;
  name: string;
  color: string;
  colorA: string;
  colorB: string;
  gridSize: number;
  gridColor: string;
  label: string;
  visualStyle: 'grid' | 'circuits' | 'nebula' | 'tecton_cracks' | 'snowflake_nodes';
  obstacles: PCGObstacle[];
  objectives: PCGObjective[];
  spawnMultiplier: number;
  challengeInfo: string;
}

// Deterministic PRNG using mulberry32
function createPRNG(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  let seed = h;
  return function() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class PCGSystem {
  engine: GameEngine;
  activeMap: PCGMapConfig | null = null;
  currentSeed = 'ALPHA-99';

  // Procedural content generation state trackers (Tied to seed + wave)
  resourceSpawnedForWave: Record<number, boolean> = {};
  hazardSpawnTimer = 0;

  getPRNGForWave(wave: number, salt: string) {
    return createPRNG(this.currentSeed + `_w${wave}_` + salt);
  }

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Generates a completely procedural battleground using a shared seed string.
   */
  generateMap(seed: string, selectedTheme?: PCGTheme): PCGMapConfig {
    this.currentSeed = seed.trim() || 'CORE';
    const rand = createPRNG(this.currentSeed);

    // Pick dynamic theme if not forced
    const themes: PCGTheme[] = ['nuclear_melt', 'cyberspace_node', 'void_rift', 'glacier_ice', 'magma_core'];
    const theme = selectedTheme || themes[Math.floor(rand() * themes.length)];

    let name = '';
    let color = '';
    let colorA = '';
    let colorB = '';
    let visualStyle: PCGMapConfig['visualStyle'] = 'grid';
    let challengeInfo = '';
    let spawnMultiplier = 1.0;

    switch (theme) {
      case 'nuclear_melt':
        name = `MELTDOWN_REACTOR_${Math.floor(rand() * 900 + 100)}`;
        color = '#39ff14'; // Mutagen green
        colorA = '#021004';
        colorB = '#000200';
        visualStyle = 'grid';
        challengeInfo = 'RADIATION OVERFLOW: Poison pools ignite bugs but core health decays gradually.';
        spawnMultiplier = 1.15;
        break;
      case 'cyberspace_node':
        name = `CYBER_NET_GRID_${Math.floor(rand() * 90 + 10)}`;
        color = '#00f3ff'; // Cyan
        colorA = '#000c14';
        colorB = '#000204';
        visualStyle = 'circuits';
        challengeInfo = 'DATA PIPELINE: Electric pylons shock clustered bugs with high voltage.';
        spawnMultiplier = 1.0;
        break;
      case 'void_rift':
        name = `SPATIAL_VOID_RIFT_${Math.floor(rand() * 999)}`;
        color = '#bf55ec'; // Void purple
        colorA = '#0a0012';
        colorB = '#010003';
        visualStyle = 'nebula';
        challengeInfo = 'GRAVITY DISTORTION: Kinetic nodes pull objects towards center.';
        spawnMultiplier = 1.25;
        break;
      case 'glacier_ice':
        name = `GLACIER_SECTOR_ICE_Z_${Math.floor(rand() * 80 + 10)}`;
        color = '#00e5ff'; // Ice blue
        colorA = '#000f1c';
        colorB = '#000206';
        visualStyle = 'snowflake_nodes';
        challengeInfo = 'SUB-ZERO CRYOGENICS: Freezing crystals trigger area freeze blizzards.';
        spawnMultiplier = 0.95;
        break;
      case 'magma_core':
        name = `TECTONIC_MAGMA_FISSURE_${Math.floor(rand() * 50)}`;
        color = '#ff4500'; // Volcanic orange-red
        colorA = '#140300';
        colorB = '#030000';
        visualStyle = 'tecton_cracks';
        challengeInfo = 'THERMAL CRACKING: Volcanic magma vents emit superheated shockwaves.';
        spawnMultiplier = 1.3;
        break;
    }

    const gridSize = Math.floor(rand() * 80) + 100;
    const gridColor = `${color}04`; // faint alpha
    const label = `SEED_${this.currentSeed.toUpperCase()}_SYS_ACTIVE`;

    // Generate terrain obstacles
    const obstacles: PCGObstacle[] = [];
    const obstacleCount = Math.floor(rand() * 3) + 3; // 3 to 5 obstacles

    const padding = 120;
    const width = this.engine.width || 800;
    const height = this.engine.height || 600;

    const opTypes: PCGObstacle['type'][] = ['healing_conduit', 'electric_node', 'magma_vent', 'ice_crystal', 'refinery_node'];

    for (let i = 0; i < obstacleCount; i++) {
      const x = Math.floor(rand() * (width - padding * 2)) + padding;
      const y = Math.floor(rand() * (height - padding * 2)) + padding;
      const type = opTypes[Math.floor(rand() * opTypes.length)];

      let oColor = '#fff';
      let hp = 1;
      let size = 20;

      if (type === 'healing_conduit') { oColor = '#10b981'; hp = 3; size = 25; }
      else if (type === 'electric_node') { oColor = '#06b6d4'; hp = 4; size = 24; }
      else if (type === 'magma_vent') { oColor = '#f97316'; hp = 5; size = 28; }
      else if (type === 'ice_crystal') { oColor = '#38bdf8'; hp = 2; size = 22; }
      else if (type === 'refinery_node') { oColor = '#fbbf24'; hp = 1; size = 18; }

      obstacles.push({
        id: `obs_${i}`,
        x,
        y,
        type,
        hp,
        maxHp: hp,
        size,
        color: oColor,
        active: true,
        pulseTimer: rand() * 2.0
      });
    }

    // Generate 1 main defense objective (requires protection or triggers extreme EMP)
    const objX = Math.floor(rand() * (width - padding * 3)) + padding * 1.5;
    const objY = Math.floor(rand() * (height - padding * 3)) + padding * 1.5;

    const objectives: PCGObjective[] = [{
      id: `obj_01`,
      x: objX,
      y: objY,
      name: `${theme.toUpperCase()}_REACTOR_BEACON`,
      hp: 10,
      maxHp: 10,
      active: true,
      charge: 0,
      defendedBonusTriggered: false
    }];

    const config: PCGMapConfig = {
      seed: this.currentSeed,
      theme,
      name,
      color,
      colorA,
      colorB,
      gridSize,
      gridColor,
      label,
      visualStyle,
      obstacles,
      objectives,
      spawnMultiplier,
      challengeInfo
    };

    this.activeMap = config;
    return config;
  }

  activateMapInEngine(map: PCGMapConfig) {
    this.activeMap = map;
    this.engine.currentBiome = 'custom_map';
  }

  /**
   * Safe delta time update of elements (no setIntervals bounds).
   */
  update(dt: number) {
    if (!this.activeMap) return;

    const currentWave = this.engine.wave;

    // 1. Procedural Resource Drop Distribution (Tied directly to seed + wave)
    if (this.engine.waveManager.waveActive && !this.resourceSpawnedForWave[currentWave]) {
      this.resourceSpawnedForWave[currentWave] = true;
      const rng = this.getPRNGForWave(currentWave, 'resources');
      const numResources = Math.floor(rng() * 4) + 3; // 3 to 6 drops
      const width = this.engine.width;
      const height = this.engine.height;
      const rTypes: ResourceType[] = ['scrap', 'crystals', 'plasma', 'alloy', 'flux'];

      for (let i = 0; i < numResources; i++) {
        const rx = Math.floor(rng() * (width - 240)) + 120;
        const ry = Math.floor(rng() * (height - 240)) + 120;
        const type = rTypes[Math.floor(rng() * rTypes.length)];

        this.engine.resources.push({
          active: true,
          x: rx,
          y: ry,
          type,
          color: type === 'scrap' ? '#cbd5e1' : type === 'crystals' ? '#00ffd2' : type === 'plasma' ? '#a855f7' : type === 'alloy' ? '#fb7185' : '#38bdf8',
          life: 25,
          maxLife: 25,
          size: 14
        });
        this.engine.particleSystem.spawnShockwave(rx, ry, '#00ffd2', 40);
      }
      console.log(`[PCGSystem] Distributed ${numResources} resources on wave ${currentWave} (seed ${this.currentSeed})`);
    }

    // 2. Procedural Environmental Hazard Spawner (Tied directly to seed + wave + timing)
    if (this.engine.waveManager.waveActive) {
      this.hazardSpawnTimer += dt;
      if (this.hazardSpawnTimer >= 12.0) {
        this.hazardSpawnTimer = 0;
        const rng = this.getPRNGForWave(currentWave, `hazard_${Math.floor(this.engine.globalTime)}`);
        const hx = Math.floor(rng() * (this.engine.width - 240)) + 120;
        const hy = Math.floor(rng() * (this.engine.height - 240)) + 120;
        const hTypes: ('barrage' | 'shockwave' | 'lava' | 'web')[] = ['barrage', 'lava', 'web'];
        const selectedType = hTypes[Math.floor(rng() * hTypes.length)];

        this.engine.hazards.push({
          id: `pcg_haz_${Date.now()}`,
          x: hx,
          y: hy,
          radius: 60 + Math.floor(rng() * 40),
          type: selectedType,
          timer: 0,
          duration: selectedType === 'barrage' ? 3.0 : 8.0,
          active: true
        });
        this.engine.particleSystem.spawnShockwave(hx, hy, '#ff5500', 80);
        console.log(`[PCGSystem] Spawned environmental hazard '${selectedType}' at [${hx}, ${hy}]`);
      }
    }

    // 3. Process Lava / Magma damage to bugs walked over MAGMA_VENTS
    const map = this.activeMap;
    map.obstacles.forEach((obs) => {
      if (!obs.active) return;
      obs.pulseTimer += dt;

      // Magma vent triggers a localized volcanic burst periodically
      if (obs.type === 'magma_vent' && obs.pulseTimer > 3.0) {
        obs.pulseTimer = 0;
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#f97316', 100);
        
        // Damage any bugs within magma range
        this.engine.bugs.forEach((bug) => {
          const dx = bug.x - obs.x;
          const dy = bug.y - obs.y;
          if (dx * dx + dy * dy < 100 * 100) {
            this.engine.damageBug(bug, 2);
          }
        });
      }

      // Electric Node periodically shocks nearest bugs
      if (obs.type === 'electric_node' && obs.pulseTimer > 2.0) {
        obs.pulseTimer = 0;
        // Find nearest bugs
        let count = 0;
        this.engine.bugs.forEach((bug) => {
          if (count >= 3) return;
          const dx = bug.x - obs.x;
          const dy = bug.y - obs.y;
          if (dx * dx + dy * dy < 150 * 150) {
            this.engine.damageBug(bug, 1);
            this.engine.particleSystem.spawnLaser(obs.x, obs.y, bug.x, bug.y, '#06b6d4');
            count++;
          }
        });
      }
    });

    // 2. Process active objectives
    map.objectives.forEach((obj) => {
      if (!obj.active) return;

      // Charge Objective holds state up to 100%
      if (this.engine.waveManager.waveActive) {
        obj.charge = Math.min(100, obj.charge + dt * 4.0); // 25 seconds of wave active to charge fully
      }

      // Trigger defended bonus when 100% charged
      if (obj.charge >= 100 && !obj.defendedBonusTriggered) {
        obj.defendedBonusTriggered = true;
        soundManager.heal();
        this.engine.score += 2500;
        this.engine.particleSystem.spawnShockwave(obj.x, obj.y, '#ffd700', 300);
        
        // Annihilate all simple active bugs via solar flare EMP!
        this.engine.bugs.forEach((b) => {
          this.engine.damageBug(b, 5);
        });
      }

      // Check if bugs are surrounding and attacking the objective
      this.engine.bugs.forEach((bug) => {
        const dx = bug.x - obj.x;
        const dy = bug.y - obj.y;
        const distSq = dx * dx + dy * dy;
        const triggerRange = (bug.size + 30) * (bug.size + 30);
        if (distSq < triggerRange) {
          // Attacking the beacon
          obj.hp -= dt * 1.5; // decays health
          bug.active = false; // Bug sacrifices self to damage objective
          this.engine.particleSystem.spawnSmoke(bug.x, bug.y, '#ff4500');
          soundManager.shoot();
          
          if (obj.hp <= 0) {
            obj.active = false;
            soundManager.uiError();
            // Objective Meltdown penalty!
            this.engine.health = Math.max(1, this.engine.health - 25);
            this.engine.particleSystem.spawnShockwave(obj.x, obj.y, '#ef4444', 200);
          }
        }
      });
    });
  }

  /**
   * Screen Click intersection check for procedural nodes
   * Returns true if a node was hit and intercepted click
   */
  checkNodeHit(x: number, y: number): boolean {
    if (!this.activeMap) return false;
    const map = this.activeMap;

    // Check Obstacles first
    for (let i = 0; i < map.obstacles.length; i++) {
      const obs = map.obstacles[i];
      if (!obs.active) continue;

      const dx = obs.x - x;
      const dy = obs.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < (obs.size + 15) * (obs.size + 15)) {
        obs.hp--;
        soundManager.uiClick();
        this.engine.particleSystem.spawnClickPulse(obs.x, obs.y);
        
        if (obs.hp <= 0) {
          obs.active = false;
          this.triggerObstacleExplosion(obs);
        }
        return true;
      }
    }

    // Check Objectives
    for (let i = 0; i < map.objectives.length; i++) {
      const obj = map.objectives[i];
      if (!obj.active) continue;

      const dx = obj.x - x;
      const dy = obj.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 35 * 35) {
        // Boosting Beacon recharge
        obj.charge = Math.min(100, obj.charge + 5);
        soundManager.armoryEquip();
        this.engine.particleSystem.spawnShockwave(obj.x, obj.y, '#00f3ff', 80);
        return true;
      }
    }

    return false;
  }

  private triggerObstacleExplosion(obs: PCGObstacle) {
    soundManager.bossWarning();
    
    switch (obs.type) {
      case 'healing_conduit':
        // Heals core core core!
        this.engine.health = Math.min(this.engine.maxHealth, this.engine.health + 20);
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#10b981', 150);
        soundManager.heal();
        break;
      case 'electric_node':
        // Electric storm!
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#06b6d4', 220);
        this.engine.bugs.forEach((bug) => {
          const dx = bug.x - obs.x;
          const dy = bug.y - obs.y;
          if (dx * dx + dy * dy < 250 * 250) {
            this.engine.damageBug(bug, 3);
            this.engine.particleSystem.spawnLaser(obs.x, obs.y, bug.x, bug.y, '#06b6d4');
          }
        });
        break;
      case 'magma_vent':
        // Lava explosion!
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#f97316', 180);
        this.engine.bugs.forEach((bug) => {
          const dx = bug.x - obs.x;
          const dy = bug.y - obs.y;
          if (dx * dx + dy * dy < 200 * 200) {
            this.engine.damageBug(bug, 4);
          }
        });
        break;
      case 'ice_crystal':
        // Ice burst - Freezes everyone on screen!
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#38bdf8', 250);
        this.engine.activatePowerup('freeze', obs.x, obs.y);
        break;
      case 'refinery_node':
        // Multiplier / Score payout
        this.engine.score += 1500;
        this.engine.streakCount += 25; // boost combo streak!
        this.engine.particleSystem.spawnShockwave(obs.x, obs.y, '#fbbf24', 120);
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (!this.activeMap) return;
    const map = this.activeMap;

    // Draw active objectives
    map.objectives.forEach((obj) => {
      if (!obj.active) return;

      ctx.save();
      // Neon glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';

      // Base Core Tower shape
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(obj.x - 20, obj.y + 30);
      ctx.lineTo(obj.x + 20, obj.y + 30);
      ctx.lineTo(obj.x + 8, obj.y - 20);
      ctx.lineTo(obj.x - 8, obj.y - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top energy sphere holding charge
      const pulse = Math.sin(this.engine.globalTime * 8) * 3 + 12;
      ctx.fillStyle = `hsl(${180 + obj.charge * 1.2}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y - 28, pulse, 0, Math.PI * 2);
      ctx.fill();

      // Inner details
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw health and charge levels
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(obj.x - 25, obj.y + 38, 50, 4);

      // Charge bar (Cyan)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(obj.x - 25, obj.y + 38, 50 * (obj.charge / 100), 2);

      // HP bar (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(obj.x - 25, obj.y + 40, 50 * (obj.hp / obj.maxHp), 2);

      // Text label
      ctx.fillStyle = '#fff';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BEACON HP: ${Math.floor(obj.hp * 10)}%`, obj.x, obj.y - 48);
      ctx.fillText(`CHARGE: ${Math.floor(obj.charge)}%`, obj.x, obj.y + 50);

      ctx.restore();
    });

    // Draw active obstacles
    map.obstacles.forEach((obs) => {
      if (!obs.active) return;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = obs.color;

      // Draw distinct geometric shapes depending on type
      ctx.fillStyle = `${obs.color}25`;
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 2;

      if (obs.type === 'healing_conduit') {
        // Hexagon pylon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = obs.x + Math.cos(angle) * obs.size;
          const py = obs.y + Math.sin(angle) * obs.size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Plus emblem
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x - 1.5, obs.y - 7, 3, 14);
        ctx.fillRect(obs.x - 7, obs.y - 1.5, 14, 3);
      } 
      else if (obs.type === 'electric_node') {
        // Diamond sparks
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - obs.size);
        ctx.lineTo(obs.x + obs.size * 0.8, obs.y);
        ctx.lineTo(obs.x, obs.y + obs.size);
        ctx.lineTo(obs.x - obs.size * 0.8, obs.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (obs.type === 'magma_vent') {
        // Volcanic fissure triangle
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - obs.size);
        ctx.lineTo(obs.x + obs.size, obs.y + obs.size);
        ctx.lineTo(obs.x - obs.size, obs.y + obs.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // lava cracks pulsing
        const pSize = Math.sin(this.engine.globalTime * 6) * 4 + 6;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y + 4, pSize, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (obs.type === 'ice_crystal') {
        // Ice crystal cross prism
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - obs.size);
        ctx.lineTo(obs.x + obs.size * 0.5, obs.y - obs.size * 0.3);
        ctx.lineTo(obs.x + obs.size, obs.y);
        ctx.lineTo(obs.x + obs.size * 0.5, obs.y + obs.size * 0.3);
        ctx.lineTo(obs.x, obs.y + obs.size);
        ctx.lineTo(obs.x - obs.size * 0.5, obs.y + obs.size * 0.3);
        ctx.lineTo(obs.x - obs.size, obs.y);
        ctx.lineTo(obs.x - obs.size * 0.5, obs.y - obs.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } 
      else if (obs.type === 'refinery_node') {
        // Spinning golden cube
        const spin = this.engine.globalTime * 2;
        ctx.translate(obs.x, obs.y);
        ctx.rotate(spin);
        ctx.strokeRect(-obs.size/2, -obs.size/2, obs.size, obs.size);
        ctx.fillRect(-obs.size/2, -obs.size/2, obs.size, obs.size);
      }

      ctx.restore();
    });
  }
}
