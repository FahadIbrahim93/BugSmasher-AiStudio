import { describe, it, expect, beforeEach } from 'vitest'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v
  },
  removeItem: (k: string) => {
    delete store[k]
  },
  clear: () => {
    Object.keys(store).forEach(k => delete store[k])
  },
  get length() {
    return Object.keys(store).length
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

const { UpgradeSystem, UPGRADE_DEFS } = await import('../lib/UpgradeSystem')

describe('UpgradeSystem', () => {
  let us: InstanceType<typeof UpgradeSystem>

  beforeEach(() => {
    localStorageMock.clear()
    us = new UpgradeSystem()
  })

  it('has 8 upgrade definitions', () => {
    expect(UPGRADE_DEFS.length).toBe(8)
    UPGRADE_DEFS.forEach(d => {
      expect(d.id).toBeTruthy()
      expect(d.baseCost).toBeGreaterThan(0)
      expect(d.maxLevel).toBeGreaterThan(0)
    })
  })

  it('starts with zero crystals and levels', () => {
    expect(us.getCrystals()).toBe(0)
    UPGRADE_DEFS.forEach(d => expect(us.getLevel(d.id)).toBe(0))
  })

  it('adds and spends crystals', () => {
    us.addCrystals(100)
    expect(us.getCrystals()).toBe(100)
    expect(us.spendCrystals(30)).toBe(true)
    expect(us.getCrystals()).toBe(70)
    expect(us.spendCrystals(100)).toBe(false)
    expect(us.getCrystals()).toBe(70)
  })

  it('cannot purchase if not enough crystals', () => {
    const result = us.purchaseUpgrade('click_power')
    expect(result).toBe(false)
    expect(us.getLevel('click_power')).toBe(0)
  })

  it('purchases upgrade when enough crystals', () => {
    us.addCrystals(500)
    const result = us.purchaseUpgrade('click_power')
    expect(result).toBe(true)
    expect(us.getLevel('click_power')).toBe(1)
    expect(us.getCrystals()).toBe(450) // cost is 50 for first level
  })

  it('cost increases with level', () => {
    us.addCrystals(5000)
    us.purchaseUpgrade('click_power')
    us.purchaseUpgrade('click_power')
    us.purchaseUpgrade('click_power')
    const costLvl3 = us.getUpgradeCost('click_power')
    const costLvl1 = UPGRADE_DEFS.find(d => d.id === 'click_power')?.baseCost ?? 0
    expect(costLvl3).toBeGreaterThan(costLvl1)
  })

  it('returns maxed status correctly', () => {
    const def = UPGRADE_DEFS.find(d => d.id === 'starting_shield')!
    us.addCrystals(50000)
    for (let i = 0; i < def.maxLevel; i++) us.purchaseUpgrade('starting_shield')
    expect(us.isMaxed('starting_shield')).toBe(true)
    expect(us.purchaseUpgrade('starting_shield')).toBe(false)
  })

  it('computes bonus values', () => {
    us.addCrystals(5000)
    us.purchaseUpgrade('click_power')
    us.purchaseUpgrade('click_power')
    expect(us.getClickDamage()).toBe(12) // 10 + 2
    expect(us.getCritChance()).toBe(0)
    us.purchaseUpgrade('crit_chance')
    expect(us.getCritChance()).toBe(5)
  })

  it('persists across instances', () => {
    us.addCrystals(500)
    us.purchaseUpgrade('click_power')

    const us2 = new UpgradeSystem()
    expect(us2.getCrystals()).toBe(450)
    expect(us2.getLevel('click_power')).toBe(1)
  })

  it('reset clears everything', () => {
    us.addCrystals(500)
    us.purchaseUpgrade('click_power')
    us.reset()
    expect(us.getCrystals()).toBe(0)
    expect(us.getLevel('click_power')).toBe(0)
  })

  it('getAllUpgrades returns all defs with computed state', () => {
    us.addCrystals(500)
    us.purchaseUpgrade('click_power')
    const all = us.getAllUpgrades()
    expect(all.length).toBe(8)
    const cp = all.find((a: { def: { id: string } }) => a.def.id === 'click_power')!
    expect(cp.level).toBe(1)
    expect(cp.isMaxed).toBe(false)
    expect(cp.cost).toBeGreaterThan(0)
    expect(cp.canAfford).toBe(true)
  })
})
