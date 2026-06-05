// BiomeConfig — Theme + GAMEPLAY per biome
// Each biome now has mechanically distinct gameplay, not just visuals

export interface BiomeBugConfig {
  // Bug type probabilities (must sum to 1)
  basicWeight: number;
  scoutWeight: number;
  tankWeight: number;
  // Speed multiplier vs base
  speedMultiplier: number;
  // HP multiplier vs base
  hpMultiplier: number;
  // Score multiplier vs base
  scoreMultiplier: number;
  // Extra bug types that spawn in this biome
  extraTypes: string[];
}

export interface BiomePowerupConfig {
  dropChanceMultiplier: number;   // ×base drop rate
  preferredTypes: string[];       // weighted toward these
  rareBoost: number;              // 1+N chance of rare powerups
}

export interface BiomeGameplay {
  // Bug spawning
  bugs: BiomeBugConfig;
  // Powerup spawning
  powerups: BiomePowerupConfig;
  // Special mechanic
  specialEffect: 'none' | 'teleport' | 'swarm' | 'armored' | 'split' | 'regen';
  specialDesc: string;
  // Difficulty scalar applied to all bugs
  difficultyMultiplier: number;
}

export interface Biome {
  id: string;
  name: string;
  description: string;
  tagline: string;
  theme: {
    background: string;
    gridColor: string;
    gridColorSecondary: string;
    coreColor: string;
    coreGlow: string;
    fogColor: string;
  };
  bugs: {
    baseColor: string;
    scoutColor: string;
    tankColor: string;
    eliteColor?: string;
  };
  particles: {
    splatter: string;
    glow: string;
  };
  gameplay: BiomeGameplay;
  unlockRequirement: {
    wavesCompleted?: number;
    scoreRequired?: number;
    prestigeLevel?: number;
  };
}

// ── Gameplay per biome ──────────────────────────────────────────────────────

const NEON_CORE_BUGS: BiomeBugConfig = {
  basicWeight: 0.70, scoutWeight: 0.20, tankWeight: 0.10,
  speedMultiplier: 1.0, hpMultiplier: 1.0, scoreMultiplier: 1.0,
  extraTypes: [],
};
const NEON_CORE_POWERUPS: BiomePowerupConfig = {
  dropChanceMultiplier: 1.0, preferredTypes: [], rareBoost: 0,
};

const QUANTUM_VOID_BUGS: BiomeBugConfig = {
  basicWeight: 0.35, scoutWeight: 0.40, tankWeight: 0.25,
  speedMultiplier: 1.15, hpMultiplier: 0.85, scoreMultiplier: 1.1,
  extraTypes: ['phase'], // phase bugs phase in/out — harder to click
};
const QUANTUM_VOID_POWERUPS: BiomePowerupConfig = {
  dropChanceMultiplier: 1.3, preferredTypes: ['slow_mo', 'freeze'], rareBoost: 1,
};

const EMBER_DEPTHS_BUGS: BiomeBugConfig = {
  basicWeight: 0.35, scoutWeight: 0.20, tankWeight: 0.45,
  speedMultiplier: 1.05, hpMultiplier: 1.25, scoreMultiplier: 1.2,
  extraTypes: ['ember'], // ember bugs leave lava trail
};
const EMBER_DEPTHS_POWERUPS: BiomePowerupConfig = {
  dropChanceMultiplier: 1.5, preferredTypes: ['shield', 'freeze'], rareBoost: 2,
};

const FROSTBYTE_BUGS: BiomeBugConfig = {
  basicWeight: 0.40, scoutWeight: 0.35, tankWeight: 0.25,
  speedMultiplier: 0.85, hpMultiplier: 1.1, scoreMultiplier: 1.15,
  extraTypes: ['frost', 'swarmer'], // frost bugs slow the player, swarmer spawns mini-bugs
};
const FROSTBYTE_POWERUPS: BiomePowerupConfig = {
  dropChanceMultiplier: 1.2, preferredTypes: ['rapid_fire', 'multiplier'], rareBoost: 1,
};

const GOLDEN_CACHE_BUGS: BiomeBugConfig = {
  basicWeight: 0.34, scoutWeight: 0.33, tankWeight: 0.33,
  speedMultiplier: 1.25, hpMultiplier: 1.5, scoreMultiplier: 1.5,
  extraTypes: ['golden', 'swarmer', 'healer'],
};
const GOLDEN_CACHE_POWERUPS: BiomePowerupConfig = {
  dropChanceMultiplier: 2.0, preferredTypes: ['nuke', 'spike_burst', 'multiplier'], rareBoost: 3,
};

export const BIOMES: Biome[] = [
  {
    id: 'neon_core',
    name: 'Neon Core',
    description: 'The default dimension',
    tagline: 'Standard Protocol',
    theme: {
      background: '#050505',
      gridColor: 'rgba(0, 255, 204, 0.1)',
      gridColorSecondary: 'rgba(0, 255, 204, 0.03)',
      coreColor: '#00ffcc',
      coreGlow: 'rgba(0, 255, 204, 0.5)',
      fogColor: 'rgba(0, 255, 204, 0.02)',
    },
    bugs: {
      baseColor: '#ffffff',
      scoutColor: '#00ffff',
      tankColor: '#ff3333',
    },
    particles: {
      splatter: '#00ffcc',
      glow: '#00ffcc',
    },
    gameplay: {
      bugs: NEON_CORE_BUGS,
      powerups: NEON_CORE_POWERUPS,
      specialEffect: 'none',
      specialDesc: '',
      difficultyMultiplier: 1.0,
    },
    unlockRequirement: {},
  },
  {
    id: 'quantum_void',
    name: 'Quantum Void',
    description: 'Dimensional breach detected',
    tagline: 'Phase Shift Protocol',
    theme: {
      background: '#0a0512',
      gridColor: 'rgba(147, 51, 234, 0.15)',
      gridColorSecondary: 'rgba(147, 51, 234, 0.05)',
      coreColor: '#a855f7',
      coreGlow: 'rgba(167, 139, 250, 0.5)',
      fogColor: 'rgba(147, 51, 234, 0.03)',
    },
    bugs: {
      baseColor: '#e9d5ff',
      scoutColor: '#c084fc',
      tankColor: '#f472b6',
      eliteColor: '#e879f9',
    },
    particles: {
      splatter: '#a855f7',
      glow: '#a855f7',
    },
    gameplay: {
      bugs: QUANTUM_VOID_BUGS,
      powerups: QUANTUM_VOID_POWERUPS,
      specialEffect: 'teleport',
      specialDesc: 'Phase bugs teleport — track their shimmer trail',
      difficultyMultiplier: 1.2,
    },
    unlockRequirement: { wavesCompleted: 5 },
  },
  {
    id: 'ember_depths',
    name: 'Ember Depths',
    description: 'Volcanic frontier',
    tagline: 'Inferno Protocol',
    theme: {
      background: '#0f0503',
      gridColor: 'rgba(239, 68, 68, 0.12)',
      gridColorSecondary: 'rgba(239, 68, 68, 0.04)',
      coreColor: '#ef4444',
      coreGlow: 'rgba(252, 165, 165, 0.5)',
      fogColor: 'rgba(239, 68, 68, 0.03)',
    },
    bugs: {
      baseColor: '#fecaca',
      scoutColor: '#fb923c',
      tankColor: '#fbbf24',
      eliteColor: '#ef4444',
    },
    particles: {
      splatter: '#ef4444',
      glow: '#ef4444',
    },
    gameplay: {
      bugs: EMBER_DEPTHS_BUGS,
      powerups: EMBER_DEPTHS_POWERUPS,
      specialEffect: 'armored',
      specialDesc: 'Heavy tanks with armored plates — need burst damage',
      difficultyMultiplier: 1.4,
    },
    unlockRequirement: { wavesCompleted: 10, scoreRequired: 5000 },
  },
  {
    id: 'frostbyte',
    name: 'Frostbyte',
    description: 'Frozen data stream',
    tagline: 'Cryo Protocol',
    theme: {
      background: '#030810',
      gridColor: 'rgba(56, 189, 248, 0.12)',
      gridColorSecondary: 'rgba(56, 189, 248, 0.04)',
      coreColor: '#38bdf8',
      coreGlow: 'rgba(125, 211, 252, 0.5)',
      fogColor: 'rgba(56, 189, 248, 0.04)',
    },
    bugs: {
      baseColor: '#e0f2fe',
      scoutColor: '#7dd3fc',
      tankColor: '#06b6d4',
      eliteColor: '#0ea5e9',
    },
    particles: {
      splatter: '#38bdf8',
      glow: '#38bdf8',
    },
    gameplay: {
      bugs: FROSTBYTE_BUGS,
      powerups: FROSTBYTE_POWERUPS,
      specialEffect: 'swarm',
      specialDesc: 'Frost swarms — fast scouts, compensate with AoE',
      difficultyMultiplier: 1.6,
    },
    unlockRequirement: { wavesCompleted: 15, scoreRequired: 10000 },
  },
  {
    id: 'golden_cache',
    name: 'Golden Cache',
    description: 'Prestige reward tier',
    tagline: 'Vault Protocol',
    theme: {
      background: '#0c0a04',
      gridColor: 'rgba(234, 179, 8, 0.15)',
      gridColorSecondary: 'rgba(234, 179, 8, 0.05)',
      coreColor: '#eab308',
      coreGlow: 'rgba(253, 224, 71, 0.5)',
      fogColor: 'rgba(234, 179, 8, 0.03)',
    },
    bugs: {
      baseColor: '#fef9c3',
      scoutColor: '#fde047',
      tankColor: '#fbbf24',
      eliteColor: '#f59e0b',
    },
    particles: {
      splatter: '#eab308',
      glow: '#eab308',
    },
    gameplay: {
      bugs: GOLDEN_CACHE_BUGS,
      powerups: GOLDEN_CACHE_POWERUPS,
      specialEffect: 'split',
      specialDesc: 'Split bugs — killing one spawns 2 mini-bugs',
      difficultyMultiplier: 2.0,
    },
    unlockRequirement: { prestigeLevel: 1 },
  },
  {
    id: 'void_abyss',
    name: 'Void Abyss',
    description: 'The bugs have broken containment',
    tagline: 'Containment Breach Protocol',
    theme: {
      background: '#020108',
      gridColor: 'rgba(168, 85, 212, 0.15)', // Purple void
      gridColorSecondary: 'rgba(168, 85, 212, 0.05)',
      coreColor: '#a855f7',
      coreGlow: 'rgba(168, 85, 212, 0.4)',
      fogColor: 'rgba(168, 85, 212, 0.04)',
    },
    bugs: {
      baseColor: '#e9d5ff',
      scoutColor: '#c084fc',
      tankColor: '#f472b6',
      eliteColor: '#d946ef',
    },
    particles: {
      splatter: '#a855f7',
      glow: '#a855f7',
    },
    gameplay: {
      bugs: {
        basicWeight: 0.40, scoutWeight: 0.30, tankWeight: 0.30,
        speedMultiplier: 1.15, hpMultiplier: 1.2, scoreMultiplier: 1.3,
        extraTypes: ['phase', 'swarmer'],
      },
      powerups: {
        dropChanceMultiplier: 1.4, preferredTypes: ['nuke', 'spike_burst'], rareBoost: 2,
      },
      specialEffect: 'teleport',
      specialDesc: 'Void phase — bugs teleport unpredictably',
      difficultyMultiplier: 1.8,
    },
    unlockRequirement: { wavesCompleted: 20, scoreRequired: 25000 },
  },
  // ── GOLDEN SPIRE (Kim's Addition - Endgame) ─────────────────────────────────
  {
    id: 'golden_spire',
    name: 'Golden Spire',
    description: 'Ultimate challenge',
    tagline: 'Apex Protocol',
    theme: {
      background: '#110c05',
      gridColor: 'rgba(250, 204, 21, 0.2)', // Brighter gold
      gridColorSecondary: 'rgba(250, 204, 21, 0.08)',
      coreColor: '#facc15',
      coreGlow: 'rgba(252, 211, 77, 0.6)',
      fogColor: 'rgba(250, 204, 21, 0.05)',
    },
    bugs: {
      baseColor: '#fef08a',
      scoutColor: '#fde047',
      tankColor: '#f59e0b',
      eliteColor: '#fbbf24',
    },
    particles: {
      splatter: '#facc15',
      glow: '#facc15',
    },
    gameplay: {
      bugs: {
        basicWeight: 0.35, scoutWeight: 0.30, tankWeight: 0.35,
        speedMultiplier: 1.3, hpMultiplier: 1.4, scoreMultiplier: 1.8,
        extraTypes: ['golden', 'healer', 'swarmer'],
      },
      powerups: {
        dropChanceMultiplier: 2.5, preferredTypes: ['nuke', 'spike_burst', 'multiplier'], rareBoost: 4,
      },
      specialEffect: 'regen',
      specialDesc: 'Regenerating elites — relentless pressure',
      difficultyMultiplier: 2.5,
    },
    unlockRequirement: { prestigeLevel: 3, scoreRequired: 100000 },
  },
];


// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the biome bug config with all modifiers applied (wave + difficulty) */
export function getBiomeBugStats(
  biome: Biome,
  wave: number,
  baseConfig: typeof import('./GameConfig').GameConfig.bugs
) {
  const g = biome.gameplay;
  const b = g.bugs;

  const getSwarmSpeed = (baseSpeed: number, speedPerWave: number, waveNum: number) => {
    return (baseSpeed + waveNum * speedPerWave) * b.speedMultiplier * g.difficultyMultiplier;
  };

  const getHp = (baseHp: number, hpPerWave: number, waveNum: number) => {
    return Math.ceil((baseHp + waveNum * hpPerWave) * b.hpMultiplier * g.difficultyMultiplier);
  };

  return {
    basic: {
      speed: getSwarmSpeed(baseConfig.basic.baseSpeed, baseConfig.basic.speedPerWave, wave),
      hp: getHp(baseConfig.basic.baseHp, baseConfig.basic.hpPerWave, wave),
      score: Math.ceil(baseConfig.basic.score * b.scoreMultiplier),
    },
    scout: {
      speed: getSwarmSpeed(baseConfig.scout.baseSpeed, baseConfig.scout.speedPerWave, wave),
      hp: getHp(baseConfig.scout.baseHp, baseConfig.scout.hpPerWave, wave),
      score: Math.ceil(baseConfig.scout.score * b.scoreMultiplier),
    },
    tank: {
      speed: getSwarmSpeed(baseConfig.tank.baseSpeed, baseConfig.tank.speedPerWave, wave),
      hp: getHp(baseConfig.tank.baseHp, baseConfig.tank.hpPerWave, wave),
      score: Math.ceil(baseConfig.tank.score * b.scoreMultiplier),
    },
    swarmer: {
      speed: getSwarmSpeed(baseConfig.swarmer.baseSpeed, baseConfig.swarmer.speedPerWave, wave),
      hp: Math.max(1, getHp(baseConfig.swarmer.baseHp, baseConfig.swarmer.hpPerWave, wave)), // always at least 1 HP
      score: Math.ceil(baseConfig.swarmer.score * b.scoreMultiplier),
    },
    healer: {
      speed: getSwarmSpeed(baseConfig.healer.baseSpeed, baseConfig.healer.speedPerWave, wave),
      hp: getHp(baseConfig.healer.baseHp, baseConfig.healer.hpPerWave, wave),
      score: Math.ceil(baseConfig.healer.score * b.scoreMultiplier),
    },
  };
}
