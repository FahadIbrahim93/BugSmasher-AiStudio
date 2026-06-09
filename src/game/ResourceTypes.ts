export type ResourceType = 'scrap' | 'plasma' | 'alloy' | 'flux' | 'neural_core' | 'crystals';

export interface Resource {
  id: ResourceType;
  name: string;
  description: string;
  color: string;
  rarity: 'common' | 'rare' | 'exotic' | 'legendary';
}

export const RESOURCES: Record<ResourceType, Resource> = {
  scrap: {
    id: 'scrap',
    name: 'Biotic Scrap',
    description: 'Salvaged pieces of bug exoskeleton.',
    color: '#39ff14',
    rarity: 'common'
  },
  plasma: {
    id: 'plasma',
    name: 'Neural Plasma',
    description: 'Highly reactive fluid from scout nervous systems.',
    color: '#00ffff',
    rarity: 'rare'
  },
  alloy: {
    id: 'alloy',
    name: 'Hardened Alloy',
    description: 'Durable plates found in heavy tank variants.',
    color: '#ff00ff',
    rarity: 'rare'
  },
  flux: {
    id: 'flux',
    name: 'Void Flux',
    description: 'Ethereal substance from inter-dimensional ghosts.',
    color: '#ffffff',
    rarity: 'exotic'
  },
  neural_core: {
    id: 'neural_core',
    name: 'Neural Core',
    description: 'The central processing unit of a Nexus Overseer.',
    color: '#ff0000',
    rarity: 'legendary'
  },
  crystals: {
    id: 'crystals',
    name: 'Void Crystals',
    description: 'Valuable gems used for persistent genetic/neural upgrades.',
    color: '#00ffff',
    rarity: 'legendary'
  }
};

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Partial<Record<ResourceType, number>>;
  resultType: 'consumable' | 'permanent';
  icon: string;
}

export const RECIPES: Recipe[] = [
  {
    id: 'repair_kit',
    name: 'Nano-Repair Kit',
    description: 'Instantly restores 25% of base integrity.',
    ingredients: { scrap: 50, plasma: 5 },
    resultType: 'consumable',
    icon: 'wrench'
  },
  {
    id: 'emp_generator',
    name: 'EMP Generator',
    description: 'A one-time pulse that annihilates all non-boss threats.',
    ingredients: { scrap: 100, alloy: 10, flux: 2 },
    resultType: 'consumable',
    icon: 'zap'
  },
  {
    id: 'overdrive_chip',
    name: 'Overdrive Chip',
    description: 'Increases all weapon damage by 50% for 20 seconds.',
    ingredients: { plasma: 20, flux: 5, neural_core: 1 },
    resultType: 'consumable',
    icon: 'cpu'
  }
];

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  costPerLevel: (level: number) => Partial<Record<ResourceType, number>>;
  effect: (level: number) => number;
  category: 'combat' | 'scavenger' | 'control';
  dependencies?: string[];
  isActiveAbility?: boolean;
}

export const SKILLS: Skill[] = [
  // --- COMBAT MECHANIST ARCHETYPE ---
  {
    id: 'sentry_optimization',
    name: 'Sentry Optimization',
    description: 'Reduces auto-sentry fire interval by 0.05 seconds per rank.',
    maxLevel: 10,
    costPerLevel: (l) => ({ plasma: 10 * (l + 1), neural_core: l > 5 ? 1 : 0 }),
    effect: (l) => l * 0.05,
    category: 'combat'
  },
  {
    id: 'kinetic_amplifier',
    name: 'Kinetic Amplifier',
    description: 'Permanent increase to all click and structural damage (+20% per rank).',
    maxLevel: 5,
    costPerLevel: (l) => ({ neural_core: (l + 1), flux: 5 * (l + 1) }),
    effect: (l) => l * 0.2,
    category: 'combat',
    dependencies: ['sentry_optimization']
  },
  {
    id: 'turret_overdrive',
    name: 'Turret Overdrive',
    description: 'ACTIVE: Press "2" or click to overclock turret to fire at 500% speed with piercing beams for 8s (45s cooldown).',
    maxLevel: 1,
    costPerLevel: (l) => ({ crystals: 100, neural_core: 2 }),
    effect: (l) => l,
    category: 'combat',
    dependencies: ['kinetic_amplifier'],
    isActiveAbility: true
  },
  {
    id: 'missile_sentry',
    name: 'Tactical Missile Sentry',
    description: 'Sentry automatically launches an explosive heat-seeking missile (deals 10 AoE damage) every 10s.',
    maxLevel: 3,
    costPerLevel: (l) => ({ alloy: 15 * (l + 1), flux: 4 * (l + 1) }),
    effect: (l) => l * 10,
    category: 'combat',
    dependencies: ['turret_overdrive']
  },

  // --- BIO-SCAVENGER ARCHETYPE ---
  {
    id: 'hardened_hull',
    name: 'Hardened Hull',
    description: 'Increases maximum base health (+10 health per rank).',
    maxLevel: 10,
    costPerLevel: (l) => ({ scrap: 100 * (l + 1), alloy: 5 * (l + 1) }),
    effect: (l) => l * 10,
    category: 'scavenger'
  },
  {
    id: 'scavenger_protocol',
    name: 'Scavenger Protocol',
    description: 'Increases the amount of scrap dropped by basic threats (+1 scrap per rank).',
    maxLevel: 10,
    costPerLevel: (l) => ({ scrap: 50 * (l + 1), plasma: 2 * (l + 1) }),
    effect: (l) => l * 1,
    category: 'scavenger'
  },
  {
    id: 'crystal_finder',
    name: 'Crystal Finder',
    description: 'Increases crystals earned from bugs by 10% per rank.',
    maxLevel: 10,
    costPerLevel: (l) => ({ scrap: 1000 * (l + 1), crystals: 20 * l }),
    effect: (l) => l * 0.1,
    category: 'scavenger',
    dependencies: ['scavenger_protocol']
  },
  {
    id: 'nanite_lifesteal',
    name: 'Nanite Lifesteal',
    description: 'Gives player clicks a 2% chance per rank to steal biosca scrap and repair 1 HP.',
    maxLevel: 5,
    costPerLevel: (l) => ({ plasma: 30 * (l + 1), crystals: 15 * (l + 1) }),
    effect: (l) => l * 0.02,
    category: 'scavenger',
    dependencies: ['crystal_finder']
  },
  {
    id: 'nanite_bioshield',
    name: 'Nanite Bio-Shield',
    description: 'ACTIVE: Press "1" or click to instantly recover 25 HP and trigger temporary absolute invincibility for 4s (40s cooldown).',
    maxLevel: 1,
    costPerLevel: (l) => ({ crystals: 120, flux: 10 }),
    effect: (l) => l,
    category: 'scavenger',
    dependencies: ['nanite_lifesteal'],
    isActiveAbility: true
  },

  // --- TEMPORAL TECHNOMANCER ARCHETYPE ---
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Increases combo decay time by +10% per rank.',
    maxLevel: 10,
    costPerLevel: (l) => ({ plasma: 50 * (l + 1), crystals: 10 * l }),
    effect: (l) => l * 0.1,
    category: 'control'
  },
  {
    id: 'amplified_pulse',
    name: 'Amplified Pulse',
    description: 'Increases click interaction shockwave radius (+10% per rank).',
    maxLevel: 5,
    costPerLevel: (l) => ({ scrap: 200 * (l + 1), flux: 3 * (l + 1) }),
    effect: (l) => l * 0.1,
    category: 'control',
    dependencies: ['combo_master']
  },
  {
    id: 'crit_hit',
    name: 'Critical Hit',
    description: 'Grants +5% chance per rank to deal double structural damage on click.',
    maxLevel: 10,
    costPerLevel: (l) => ({ crystals: 50 * (l + 1), flux: l % 4 === 0 ? 1 : 0 }),
    effect: (l) => l * 0.05,
    category: 'control',
    dependencies: ['amplified_pulse']
  },
  {
    id: 'chrono_emp_shatter',
    name: 'Chrono EMP Shatter',
    description: 'ACTIVE: Press "3" or click to trigger full screen freeze for 5s and decay all active bug healths by 30% (50s cooldown).',
    maxLevel: 1,
    costPerLevel: (l) => ({ crystals: 150, neural_core: 3 }),
    effect: (l) => l,
    category: 'control',
    dependencies: ['crit_hit'],
    isActiveAbility: true
  },
  {
    id: 'gravity_well',
    name: 'Gravity Well',
    description: 'Permanent cosmic force: Clicks generate localized gravity wells that immediately pull all scrap, crystals, and powerups in a 300px radius.',
    maxLevel: 3,
    costPerLevel: (l) => ({ flux: 15 * (l + 1), crystals: 40 * (l + 1) }),
    effect: (l) => l * 100,
    category: 'control',
    dependencies: ['chrono_emp_shatter']
  }
];
