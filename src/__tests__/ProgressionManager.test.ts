import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ProgressionManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const getPM = async () => {
    const m = await import('@/lib/ProgressionManager')
    m.progressionManager.reset()
    return m.progressionManager
  }

  it('starts with zero resources', async () => {
    const pm = await getPM()
    const data = pm.getData()
    expect(data.inventory.scrap).toBe(0)
    expect(data.inventory.plasma).toBe(0)
    expect(data.inventory.alloy).toBe(0)
    expect(data.inventory.flux).toBe(0)
    expect(data.inventory.neural_core).toBe(0)
    expect(data.inventory.crystals).toBe(0)
  })

  it('adds resources correctly', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 10)
    pm.addResource('plasma', 5)
    expect(pm.getResource('scrap')).toBe(10)
    expect(pm.getResource('plasma')).toBe(5)
  })

  it('accumulates resources across multiple adds', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 10)
    pm.addResource('scrap', 20)
    expect(pm.getResource('scrap')).toBe(30)
  })

  it('rejects negative resource amounts', async () => {
    const pm = await getPM()
    pm.addResource('scrap', -100)
    expect(pm.getResource('scrap')).toBe(0)
  })

  it('spends resources when enough are available', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 100)
    pm.addResource('plasma', 10)

    const result = pm.spendResources({ scrap: 50, plasma: 5 })
    expect(result).toBe(true)
    expect(pm.getResource('scrap')).toBe(50)
    expect(pm.getResource('plasma')).toBe(5)
  })

  it('fails to spend resources when insufficient', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 10)

    const result = pm.spendResources({ scrap: 50 })
    expect(result).toBe(false)
    expect(pm.getResource('scrap')).toBe(10)
  })

  it('does not partially spend on failure', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 100)
    pm.addResource('plasma', 0)

    const result = pm.spendResources({ scrap: 50, plasma: 5 })
    expect(result).toBe(false)
    expect(pm.getResource('scrap')).toBe(100)
  })

  it('upgrades skill when enough resources', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 200)
    pm.addResource('alloy', 10)

    const result = pm.upgradeSkill('hardened_hull')
    expect(result).toBe(true)
    expect(pm.getSkillLevel('hardened_hull')).toBe(1)
  })

  it('fails to upgrade skill at max level', async () => {
    const pm = await getPM()
    for (let i = 0; i < 11; i++) {
      pm.addResource('scrap', 10000)
      pm.addResource('alloy', 1000)
    }
    for (let i = 0; i < 10; i++) pm.upgradeSkill('hardened_hull')

    const result = pm.upgradeSkill('hardened_hull')
    expect(result).toBe(false)
    expect(pm.getSkillLevel('hardened_hull')).toBe(10)
  })

  it('fails skill upgrade for unknown skill ID', async () => {
    const pm = await getPM()
    const result = pm.upgradeSkill('nonexistent')
    expect(result).toBe(false)
  })

  it('crafts consumable item', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 100)
    pm.addResource('plasma', 10)

    const result = pm.craftItem('repair_kit', { scrap: 50, plasma: 5 })
    expect(result).toBe(true)
    expect(pm.getConsumableCount('repair_kit')).toBe(1)
    expect(pm.getResource('scrap')).toBe(50)
  })

  it('fails crafting without enough ingredients', async () => {
    const pm = await getPM()
    const result = pm.craftItem('repair_kit', { scrap: 999, plasma: 999 })
    expect(result).toBe(false)
  })

  it('uses consumable when available', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 100)
    pm.addResource('plasma', 10)
    pm.craftItem('repair_kit', { scrap: 50, plasma: 5 })

    const result = pm.useConsumable('repair_kit')
    expect(result).toBe(true)
    expect(pm.getConsumableCount('repair_kit')).toBe(0)
  })

  it('fails to use consumable when not owned', async () => {
    const pm = await getPM()
    const result = pm.useConsumable('repair_kit')
    expect(result).toBe(false)
  })

  it('persists and loads from localStorage', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 200)
    pm.addResource('alloy', 10)
    pm.upgradeSkill('hardened_hull')

    const raw = localStorage.getItem('nexus_progression')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.inventory.scrap).toBe(100)
    expect(parsed.inventory.alloy).toBe(5)
    expect(parsed.skills.hardened_hull).toBe(1)
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('nexus_progression', '{invalid json!!!')
    const pm = await getPM()
    expect(pm.getResource('scrap')).toBe(0)
  })

  it('handles prestige and awards points', async () => {
    const pm = await getPM()
    const points = pm.prestige(50000)
    expect(points).toBe(5)
    const data = pm.getData()
    expect(data.prestigeLevel).toBe(1)
    expect(data.prestigePoints).toBe(5)
  })

  it('notifies subscribers on changes', async () => {
    const pm = await getPM()
    const listener = vi.fn()
    pm.subscribe(listener)
    pm.addResource('scrap', 1)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes listeners', async () => {
    const pm = await getPM()
    const listener = vi.fn()
    const unsub = pm.subscribe(listener)
    unsub()
    pm.addResource('scrap', 1)
    expect(listener).not.toHaveBeenCalled()
  })

  it('gets correct skill bonus value', async () => {
    const pm = await getPM()
    for (let i = 0; i < 3; i++) {
      pm.addResource('scrap', 1000)
      pm.addResource('alloy', 50)
      pm.upgradeSkill('hardened_hull')
    }
    expect(pm.getSkillLevel('hardened_hull')).toBe(3)
    expect(pm.getSkillBonus('hardened_hull')).toBe(30)
  })

  it('returns 0 bonus for unknown skill', async () => {
    const pm = await getPM()
    expect(pm.getSkillBonus('nonexistent')).toBe(0)
  })

  it('reset clears all data', async () => {
    const pm = await getPM()
    pm.addResource('scrap', 100)
    pm.upgradeSkill('hardened_hull')
    pm.reset()
    expect(pm.getResource('scrap')).toBe(0)
    expect(pm.getSkillLevel('hardened_hull')).toBe(0)
  })
})
