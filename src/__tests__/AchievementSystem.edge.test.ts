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

const { AchievementSystem } = await import('../lib/AchievementSystem')

describe('AchievementSystem edge cases', () => {
  let as: InstanceType<typeof AchievementSystem>

  beforeEach(() => {
    localStorageMock.clear()
    as = new AchievementSystem()
  })

  it('handles total_crystals achievement thresholds', () => {
    const u100 = as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 100, prestigeLevel: 0 })
    expect(u100.some(a => a.id === 'crystals_100')).toBe(true)
    expect(u100.some(a => a.id === 'crystals_5000')).toBe(false)

    const u5k = as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 5000, prestigeLevel: 0 })
    expect(u5k.some(a => a.id === 'crystals_5000')).toBe(true)
  })

  it('handles bugs_per_click achievements', () => {
    const u3 = as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 0, bugsPerClick: 3, totalCrystals: 0, prestigeLevel: 0 })
    expect(u3.some(a => a.id === 'bugs_per_click_3')).toBe(true)
    expect(u3.some(a => a.id === 'bugs_per_click_10')).toBe(false)

    const u10 = as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 10000, bugsPerClick: 10, totalCrystals: 0, prestigeLevel: 0 })
    expect(u10.some(a => a.id === 'bugs_per_click_10')).toBe(true)
  })

  it('handles score achievements cumulatively', () => {
    const u = as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 1000000, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(u.some(a => a.id === 'score_1000')).toBe(true)
    expect(u.some(a => a.id === 'score_50000')).toBe(true)
    expect(u.some(a => a.id === 'score_1000000')).toBe(true)
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorageMock.setItem('bugsmasher_achievements', '{broken json')
    const as2 = new AchievementSystem()
    expect(as2.getUnlockCount()).toBe(0)
  })

  it('does not double-unlock from concurrent checkUnlocks calls', () => {
    as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.getUnlockCount()).toBe(2)
    as.checkUnlocks({ kills: 10, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.getUnlockCount()).toBe(2)
  })

  it('prestige achievements require multiple prestiges', () => {
    as.checkUnlocks({ kills: 0, combo: 0, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 5 })
    expect(as.isUnlocked('prestige_1')).toBe(true)
    expect(as.isUnlocked('prestige_5')).toBe(true)
  })

  it('combo achievements only unlock the ones met', () => {
    as.checkUnlocks({ kills: 0, combo: 5, wave: 1, score: 0, bugsPerClick: 0, totalCrystals: 0, prestigeLevel: 0 })
    expect(as.isUnlocked('combo_5')).toBe(true)
    expect(as.isUnlocked('combo_20')).toBe(false)
    expect(as.isUnlocked('combo_50')).toBe(false)
  })
})
