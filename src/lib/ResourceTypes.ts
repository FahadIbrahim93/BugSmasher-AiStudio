export type ResourceType = 'scrap' | 'plasma' | 'alloy' | 'flux' | 'neural_core' | 'crystals'

export interface Resource {
  id: ResourceType
  name: string
  description: string
  color: string
  rarity: 'common' | 'rare' | 'exotic' | 'legendary'
}

export const RESOURCES: Record<ResourceType, Resource> = {
  scrap: { id: 'scrap', name: 'Biotic Scrap', description: 'Salvaged pieces of bug exoskeleton.', color: '#39ff14', rarity: 'common' },
  plasma: {
    id: 'plasma',
    name: 'Neural Plasma',
    description: 'Highly reactive fluid from scout nervous systems.',
    color: '#00ffff',
    rarity: 'rare',
  },
  alloy: {
    id: 'alloy',
    name: 'Hardened Alloy',
    description: 'Durable plates found in heavy tank variants.',
    color: '#ff00ff',
    rarity: 'rare',
  },
  flux: {
    id: 'flux',
    name: 'Void Flux',
    description: 'Ethereal substance from inter-dimensional ghosts.',
    color: '#ffffff',
    rarity: 'exotic',
  },
  neural_core: {
    id: 'neural_core',
    name: 'Neural Core',
    description: 'The central processing unit of a Nexus Overseer.',
    color: '#ff0000',
    rarity: 'legendary',
  },
  crystals: {
    id: 'crystals',
    name: 'Void Crystals',
    description: 'Valuable gems used for persistent upgrades.',
    color: '#aa44ff',
    rarity: 'legendary',
  },
}

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: Partial<Record<ResourceType, number>>
  resultType: 'consumable' | 'permanent'
  icon: string
}

export const RECIPES: Recipe[] = [
  {
    id: 'repair_kit',
    name: 'Nano-Repair Kit',
    description: 'Instantly restores 25% of base integrity.',
    ingredients: { scrap: 50, plasma: 5 },
    resultType: 'consumable',
    icon: 'wrench',
  },
  {
    id: 'emp_generator',
    name: 'EMP Generator',
    description: 'A one-time pulse that annihilates all non-boss threats.',
    ingredients: { scrap: 100, alloy: 10, flux: 2 },
    resultType: 'consumable',
    icon: 'zap',
  },
  {
    id: 'overdrive_chip',
    name: 'Overdrive Chip',
    description: 'Increases all weapon damage by 50% for 20 seconds.',
    ingredients: { plasma: 20, flux: 5, neural_core: 1 },
    resultType: 'consumable',
    icon: 'cpu',
  },
]

export interface Skill {
  id: string
  name: string
  description: string
  maxLevel: number
  costPerLevel: (level: number) => Partial<Record<ResourceType, number>>
  effect: (level: number) => number
}

export const SKILLS: Skill[] = [
  {
    id: 'hardened_hull',
    name: 'Hardened Hull',
    description: 'Increases maximum base health.',
    maxLevel: 10,
    costPerLevel: l => ({ scrap: 100 * (l + 1), alloy: 5 * (l + 1) }),
    effect: l => l * 10,
  },
  {
    id: 'amplified_pulse',
    name: 'Amplified Pulse',
    description: 'Increases click interaction radius.',
    maxLevel: 5,
    costPerLevel: l => ({ scrap: 200 * (l + 1), flux: 3 * (l + 1) }),
    effect: l => 1 + l * 0.1,
  },
  {
    id: 'sentry_optimization',
    name: 'Sentry Optimization',
    description: 'Reduces auto-sentry fire interval.',
    maxLevel: 10,
    costPerLevel: l => ({ plasma: 10 * (l + 1), ...(l > 5 ? { neural_core: 1 } : {}) }),
    effect: l => l * 0.05,
  },
  {
    id: 'scavenger_protocol',
    name: 'Scavenger Protocol',
    description: 'Increases the amount of scrap dropped by basic threats.',
    maxLevel: 10,
    costPerLevel: l => ({ scrap: 50 * (l + 1), plasma: 2 * (l + 1) }),
    effect: l => l,
  },
  {
    id: 'kinetic_amplifier',
    name: 'Kinetic Amplifier',
    description: 'Permanent increase to all structural damage.',
    maxLevel: 5,
    costPerLevel: l => ({ neural_core: l + 1, flux: 5 * (l + 1) }),
    effect: l => 1 + l * 0.2,
  },
  {
    id: 'crit_hit',
    name: 'Critical Hit',
    description: 'Chance to deal double damage on click.',
    maxLevel: 20,
    costPerLevel: l => ({ crystals: 50 * (l + 1), ...(l % 5 === 0 ? { flux: 1 } : {}) }),
    effect: l => l * 0.05,
  },
  {
    id: 'crystal_finder',
    name: 'Crystal Finder',
    description: 'Increases crystals earned from bugs.',
    maxLevel: 10,
    costPerLevel: l => ({ scrap: 1000 * (l + 1), crystals: 20 * l }),
    effect: l => 1 + l * 0.1,
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Increases combo decay time.',
    maxLevel: 10,
    costPerLevel: l => ({ plasma: 50 * (l + 1), crystals: 10 * l }),
    effect: l => 1 + l * 0.1,
  },
]
