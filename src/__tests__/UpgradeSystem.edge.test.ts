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

describe('UpgradeSystem edge cases', () => {
  let us: InstanceType<typeof UpgradeSystem>

  beforeEach(() => {
    localStorageMock.clear()
    us = new UpgradeSystem()
  })

  it('handles setCrystals boundary values', () => {
    us.setCrystals(-100)
    expect(us.getCrystals()).toBe(0)
    us.setCrystals(0)
    expect(us.getCrystals()).toBe(0)
    us.setCrystals(999999)
    expect(us.getCrystals()).toBe(999999)
  })

  it('purchaseUpgrade fails for non-existent upgrade id', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (us as any).purchaseUpgrade('nonexistent')
    expect(result).toBe(false)
  })

  it('getLevel returns 0 for unknown ids', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((us as any).getLevel('fake_id')).toBe(0)
  })

  it('cost calculation increases exponentially', () => {
    const def = UPGRADE_DEFS.find(d => d.id === 'click_power')!
    expect(def.baseCost).toBe(50)
    us.addCrystals(50000)
    us.purchaseUpgrade('click_power')
    const cost2 = us.getUpgradeCost('click_power')
    expect(cost2).toBeGreaterThan(def.baseCost)
    us.purchaseUpgrade('click_power')
    const cost3 = us.getUpgradeCost('click_power')
    expect(cost3).toBeGreaterThan(cost2)
  })

  it('maxed upgrades block further purchase', () => {
    const def = UPGRADE_DEFS.find(d => d.id === 'starting_shield')!
    expect(def.maxLevel).toBe(3)
    us.addCrystals(50000)
    for (let i = 0; i < def.maxLevel; i++) us.purchaseUpgrade('starting_shield')
    expect(us.isMaxed('starting_shield')).toBe(true)
    expect(us.purchaseUpgrade('starting_shield')).toBe(false)
    expect(us.canAfford('starting_shield')).toBe(false)
  })

  it('getAllUpgrades returns correct canAfford flags', () => {
    us.addCrystals(30)
    const all = us.getAllUpgrades()
    const cp = all.find(a => a.def.id === 'click_power')!
    expect(cp.canAfford).toBe(false)
    us.addCrystals(100)
    const all2 = us.getAllUpgrades()
    const cp2 = all2.find(a => a.def.id === 'click_power')!
    expect(cp2.canAfford).toBe(true)
  })

  it('persists crystals across instances', () => {
    us.setCrystals(500)
    const us2 = new UpgradeSystem()
    expect(us2.getCrystals()).toBe(500)
  })

  it('gets correct combo decay multiplier', () => {
    expect(us.getComboDecayMultiplier()).toBe(1)
    us.addCrystals(5000)
    us.purchaseUpgrade('combo_master')
    expect(us.getComboDecayMultiplier()).toBe(1.1)
  })

  it('handles corrupted storage gracefully', () => {
    localStorageMock.setItem('bugsmasher_upgrades', 'not json')
    const us2 = new UpgradeSystem()
    expect(us2.getLevel('click_power')).toBe(0)
  })

  it('computes maxLevel correctly for different upgrades', () => {
    const clickPower = UPGRADE_DEFS.find(d => d.id === 'click_power')!
    expect(clickPower.maxLevel).toBe(20)
    const shield = UPGRADE_DEFS.find(d => d.id === 'starting_shield')!
    expect(shield.maxLevel).toBe(3)
  })
})
