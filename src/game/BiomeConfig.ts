export interface Biome {
  id: string;
  name: string;
  description: string;
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
  };
  particles: {
    splatter: string;
    glow: string;
  };
  unlockRequirement: {
    wavesCompleted?: number;
    scoreRequired?: number;
    prestigeLevel?: number;
  };
  difficulty: number;
}

export const BIOMES: Biome[] = [
  {
    id: 'neon_core',
    name: 'Neon Core',
    description: 'The default dimension',
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
    unlockRequirement: {},
    difficulty: 1,
  },
  {
    id: 'quantum_void',
    name: 'Quantum Void',
    description: 'Dimensional breach detected',
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
    },
    particles: {
      splatter: '#a855f7',
      glow: '#a855f7',
    },
    unlockRequirement: { wavesCompleted: 5 },
    difficulty: 1.2,
  },
  {
    id: 'ember_depths',
    name: 'Ember Depths',
    description: 'Volcanic frontier',
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
    },
    particles: {
      splatter: '#ef4444',
      glow: '#ef4444',
    },
    unlockRequirement: { wavesCompleted: 10, scoreRequired: 5000 },
    difficulty: 1.4,
  },
  {
    id: 'frostbyte',
    name: 'Frostbyte',
    description: 'Frozen data stream',
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
    },
    particles: {
      splatter: '#38bdf8',
      glow: '#38bdf8',
    },
    unlockRequirement: { wavesCompleted: 15, scoreRequired: 10000 },
    difficulty: 1.6,
  },
  {
    id: 'golden_cache',
    name: 'Golden Cache',
    description: 'Prestige reward tier',
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
    },
    particles: {
      splatter: '#eab308',
      glow: '#eab308',
    },
    unlockRequirement: { prestigeLevel: 1 },
    difficulty: 2,
  },
];