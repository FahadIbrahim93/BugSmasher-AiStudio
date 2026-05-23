import { describe, it, expect, beforeEach } from 'vitest'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (i: number) => Object.keys(store)[i] ?? null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

const { AchievementSystem } = await import('../lib/AchievementSystem')

describe('AchievementSystem', () => {
  let as: InstanceType<typeof AchievementSystem>

  beforeEach(() => {
    localStorageMock.clear()
    as = new AchievementSystem()
  })

  it('has 22 achievements defined', () => {
    expect(as.achievements.length).toBe(22)
    expect(as.getTotalCount()).toBe(22)
  })

  it('starts with zero unlocked', () => {
    expect(as.getUnlockCount()).toBe(0)
  })

  it('unlocks first_kill when kills >= 1', () => {
    const unlocked = as.checkUnlocks({ kills: 1, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(unlocked.length).toBe(1)
    expect(unlocked[0].id).toBe('first_kill')
    expect(as.isUnlocked('first_kill')).toBe(true)
    expect(as.getUnlockCount()).toBe(1)
  })

  it('unlocks multiple achievements at once', () => {
    const unlocked = as.checkUnlocks({ kills: 1000, combo: 50, wave: 50, score: 1000000, bugsPerClick: 10, totalCrystals: 5000, prestigeLevel: 0 })
    expect(unlocked.length).toBeGreaterThan(5)
  })

  it('does not unlock same achievement twice', () => {
    as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.getUnlockCount()).toBe(2) // first_kill + kills_10
    const more = as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(more.length).toBe(0)
    expect(as.getUnlockCount()).toBe(2)
  })

  it('loads persisted unlocks', () => {
    as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    const as2 = new AchievementSystem()
    expect(as2.getUnlockCount()).toBe(2)
    expect(as2.isUnlocked('first_kill')).toBe(true)
    expect(as2.isUnlocked('kills_10')).toBe(true)
  })

  it('calculates total XP correctly', () => {
    expect(as.getTotalXP()).toBe(0)
    as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.getTotalXP()).toBe(35) // first_kill(10) + kills_10(25)
  })

  it('checks combo achievements', () => {
    const u = as.checkUnlocks({ kills: 0, combo: 20, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    const ids = u.map((a: { id: string }) => a.id)
    expect(ids).toContain('combo_5')
    expect(ids).toContain('combo_20')
    expect(ids).not.toContain('combo_50')
  })

  it('checks wave achievements', () => {
    as.checkUnlocks({ kills: 0, combo: 0, wave: 25, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.isUnlocked('wave_5')).toBe(true)
    expect(as.isUnlocked('wave_10')).toBe(true)
    expect(as.isUnlocked('wave_25')).toBe(true)
    expect(as.isUnlocked('wave_50')).toBe(false)
  })

  it('checks prestige achievements', () => {
    as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 1 })
    expect(as.isUnlocked('prestige_1')).toBe(true)
    expect(as.isUnlocked('prestige_5')).toBe(false)
  })
})
