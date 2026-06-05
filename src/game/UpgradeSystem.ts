// UpgradeSystem — Persistent crystal-gated upgrades that survive between runs
// Inspired by Cookie Clicker / Vampire Survivors meta-progression

export type UpgradeId =
  | 'click_power'
  | 'crit_chance'
  | 'crystal_finder'
  | 'starting_shield'
  | 'extra_life'
  | 'xp_boost'
  | 'combo_master'
  | 'turret_power';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectPerLevel: number;   // e.g. +1 damage per level
  unit: string;              // e.g. 'dmg', '%', 'x'
}

export const UPGRADE_DEFS: UpgradeDef[] = [
  {
    id: 'click_power',
    name: 'Click Power',
    description: '+1 base click damage per level',
    icon: '💥',
    baseCost: 50,
    costMultiplier: 1.8,
    maxLevel: 20,
    effectPerLevel: 1,
    unit: 'dmg',
  },
  {
    id: 'crit_chance',
    name: 'Critical Hit',
    description: '+5% critical hit chance per level',
    icon: '⚡',
    baseCost: 100,
    costMultiplier: 2.0,
    maxLevel: 15,
    effectPerLevel: 5,
    unit: '%',
  },
  {
    id: 'crystal_finder',
    name: 'Crystal Finder',
    description: '+10% crystals earned per run',
    icon: '💎',
    baseCost: 75,
    costMultiplier: 1.9,
    maxLevel: 15,
    effectPerLevel: 10,
    unit: '%',
  },
  {
    id: 'starting_shield',
    name: 'Shield Start',
    description: 'Start each run with shield active',
    icon: '🛡️',
    baseCost: 200,
    costMultiplier: 2.5,
    maxLevel: 3,
    effectPerLevel: 1,
    unit: 's',
  },
  {
    id: 'extra_life',
    name: 'Extra Life',
    description: 'Start with +1 max life per level',
    icon: '❤️',
    baseCost: 150,
    costMultiplier: 2.2,
    maxLevel: 5,
    effectPerLevel: 1,
    unit: '',
  },
  {
    id: 'xp_boost',
    name: 'XP Boost',
    description: '+15% XP earned per level',
    icon: '📈',
    baseCost: 80,
    costMultiplier: 1.85,
    maxLevel: 20,
    effectPerLevel: 15,
    unit: '%',
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: '+10% combo decay time per level',
    icon: '🔥',
    baseCost: 120,
    costMultiplier: 2.0,
    maxLevel: 10,
    effectPerLevel: 10,
    unit: '%',
  },
  {
    id: 'turret_power',
    name: 'Turret Power',
    description: '+1 auto-turret damage per level',
    icon: '🔫',
    baseCost: 100,
    costMultiplier: 1.9,
    maxLevel: 15,
    effectPerLevel: 1,
    unit: 'dmg',
  },
];

const UPGRADE_KEY = 'bugsmasher_upgrades';

export interface UpgradeLevels {
  [id: string]: number;
}

const DEFAULT_LEVELS: UpgradeLevels = Object.fromEntries(
  UPGRADE_DEFS.map(def => [def.id, 0])
);

function calcCost(def: UpgradeDef, level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
}

export class UpgradeSystem {
  private levels: UpgradeLevels = this.load();
  private crystals: number = this.loadCrystals();

  /** Reset to defaults — used by tests */
  reset(): void {
    this.levels = { ...DEFAULT_LEVELS };
    this.crystals = 0;
    localStorage.removeItem(UPGRADE_KEY);
    localStorage.removeItem('bugsmasher_crystals');
  }

  // ── Persistence ──────────────────────────────────────────────────────────────

  private load(): UpgradeLevels {
    try {
      const raw = localStorage.getItem(UPGRADE_KEY);
      if (raw) return { ...DEFAULT_LEVELS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_LEVELS };
  }

  private persist(): void {
    try {
      localStorage.setItem(UPGRADE_KEY, JSON.stringify(this.levels));
    } catch { /* ignore */ }
  }

  private loadCrystals(): number {
    try {
      const raw = localStorage.getItem('bugsmasher_crystals');
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  private persistCrystals(): void {
    try {
      localStorage.setItem('bugsmasher_crystals', String(this.crystals));
    } catch { /* ignore */ }
  }

  // ── Crystal economy ─────────────────────────────────────────────────────────

  getCrystals(): number {
    return this.crystals;
  }

  addCrystals(amount: number): void {
    this.crystals += amount;
    this.persistCrystals();
  }

  spendCrystals(amount: number): boolean {
    if (this.crystals < amount) return false;
    this.crystals -= amount;
    this.persistCrystals();
    return true;
  }

  setCrystals(amount: number): void {
    this.crystals = Math.max(0, amount);
    this.persistCrystals();
  }

  // ── Upgrade queries ─────────────────────────────────────────────────────────

  getLevel(id: UpgradeId): number {
    return this.levels[id] ?? 0;
  }

  getMaxLevel(id: UpgradeId): number {
    return UPGRADE_DEFS.find(d => d.id === id)?.maxLevel ?? 0;
  }

  isMaxed(id: UpgradeId): boolean {
    return this.getLevel(id) >= this.getMaxLevel(id);
  }

  getUpgradeCost(id: UpgradeId): number {
    const def = UPGRADE_DEFS.find(d => d.id === id);
    if (!def) return Infinity;
    return calcCost(def, this.getLevel(id));
  }

  canAfford(id: UpgradeId): boolean {
    return this.crystals >= this.getUpgradeCost(id) && !this.isMaxed(id);
  }

  getTotalBonus(id: UpgradeId): number {
    const def = UPGRADE_DEFS.find(d => d.id === id);
    if (!def) return 0;
    return def.effectPerLevel * this.getLevel(id);
  }

  // ── Mutate ──────────────────────────────────────────────────────────────────

  purchaseUpgrade(id: UpgradeId): boolean {
    const def = UPGRADE_DEFS.find(d => d.id === id);
    if (!def || this.isMaxed(id)) return false;
    const cost = calcCost(def, this.getLevel(id));
    if (!this.spendCrystals(cost)) return false;
    this.levels[id] = (this.levels[id] ?? 0) + 1;
    this.persist();
    return true;
  }

  // ── Computed game bonuses ──────────────────────────────────────────────────

  /** Base click damage including upgrade bonus + prestige multiplier */
  getClickDamage(prestigeMultiplier = 1): number {
    const upgradeBonus = this.getTotalBonus('click_power');
    return (10 + upgradeBonus) * prestigeMultiplier;
  }

  getCritChance(): number {
    return Math.min(this.getTotalBonus('crit_chance'), 75); // cap at 75%
  }

  getCrystalMultiplier(): number {
    return 1 + this.getTotalBonus('crystal_finder') / 100;
  }

  getXPBoost(): number {
    return 1 + this.getTotalBonus('xp_boost') / 100;
  }

  getShieldDuration(): number {
    return this.getLevel('starting_shield') > 0 ? 5 + this.getLevel('starting_shield') * 2 : 0;
  }

  getExtraLives(): number {
    return this.getLevel('extra_life');
  }

  getComboDecayMultiplier(): number {
    return 1 + this.getTotalBonus('combo_master') / 100;
  }

  getTurretDamage(prestigeMultiplier = 1): number {
    const upgradeBonus = this.getTotalBonus('turret_power');
    return (5 + upgradeBonus) * prestigeMultiplier;
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  getAllUpgrades(): Array<{
    def: UpgradeDef;
    level: number;
    cost: number;
    totalBonus: number;
    isMaxed: boolean;
    canAfford: boolean;
  }> {
    return UPGRADE_DEFS.map(def => ({
      def,
      level: this.getLevel(def.id),
      cost: this.getUpgradeCost(def.id),
      totalBonus: this.getTotalBonus(def.id),
      isMaxed: this.isMaxed(def.id),
      canAfford: this.canAfford(def.id),
    }));
  }
}

export const upgradeSystem = new UpgradeSystem();
