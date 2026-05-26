import { describe, it, expect, beforeEach } from 'vitest'

const STORAGE_KEY = 'bugsmasher_save'

// Minimal localStorage mock
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

// Import after mock
const { SaveManager } = await import('../lib/SaveManager')

describe('SaveManager', () => {
  let sm: InstanceType<typeof SaveManager>

  beforeEach(() => {
    localStorageMock.clear()
    sm = new SaveManager()
  })

  it('starts with default values', () => {
    expect(sm.getHighScore()).toBe(0)
    expect(sm.getTotalBugsKilled()).toBe(0)
    expect(sm.getTotalPlayTime()).toBe(0)
    expect(sm.isSoundEnabled()).toBe(true)
    expect(sm.isMusicEnabled()).toBe(true)
    expect(sm.getGamesPlayed()).toBe(0)
    expect(sm.getPrestigeLevel()).toBe(0)
    expect(sm.getHighestWave()).toBe(0)
    expect(sm.getTotalCrystalsEarned()).toBe(0)
  })

  it('updates high score only when higher', () => {
    expect(sm.updateHighScore(100)).toBe(true)
    expect(sm.getHighScore()).toBe(100)
    expect(sm.updateHighScore(50)).toBe(false)
    expect(sm.getHighScore()).toBe(100)
    expect(sm.updateHighScore(200)).toBe(true)
    expect(sm.getHighScore()).toBe(200)
  })

  it('accumulates bugs killed', () => {
    sm.addBugsKilled(5)
    expect(sm.getTotalBugsKilled()).toBe(5)
    sm.addBugsKilled(3)
    expect(sm.getTotalBugsKilled()).toBe(8)
  })

  it('accumulates play time', () => {
    sm.addPlayTime(60)
    expect(sm.getTotalPlayTime()).toBe(60)
    sm.addPlayTime(30)
    expect(sm.getTotalPlayTime()).toBe(90)
  })

  it('records game played', () => {
    expect(sm.getGamesPlayed()).toBe(0)
    sm.recordGamePlayed()
    expect(sm.getGamesPlayed()).toBe(1)
    sm.recordGamePlayed()
    expect(sm.getGamesPlayed()).toBe(2)
  })

  it('persists data to localStorage', () => {
    sm.updateHighScore(500)
    sm.addBugsKilled(10)
    sm.recordGamePlayed()
    sm.addPlayTime(120)
    sm.setHighestWave(5)
    sm.setSoundEnabled(false)

    const raw = localStorageMock.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.highScore).toBe(500)
    expect(parsed.totalBugsKilled).toBe(10)
    expect(parsed.gamesPlayed).toBe(1)
    expect(parsed.totalPlayTime).toBe(120)
    expect(parsed.highestWave).toBe(5)
    expect(parsed.soundEnabled).toBe(false)
  })

  it('loads persisted data', () => {
    sm.updateHighScore(500)
    sm.addBugsKilled(10)

    const sm2 = new SaveManager()
    expect(sm2.getHighScore()).toBe(500)
    expect(sm2.getTotalBugsKilled()).toBe(10)
  })

  it('handles corrupt JSON gracefully', () => {
    localStorageMock.setItem(STORAGE_KEY, 'not-json')
    const sm3 = new SaveManager()
    expect(sm3.getHighScore()).toBe(0)
  })

  it('handles highest wave updates', () => {
    sm.setHighestWave(3)
    expect(sm.getHighestWave()).toBe(3)
    sm.setHighestWave(2)
    expect(sm.getHighestWave()).toBe(3)
    sm.setHighestWave(7)
    expect(sm.getHighestWave()).toBe(7)
  })

  it('accumulates crystals earned', () => {
    sm.addCrystalsEarned(100)
    expect(sm.getTotalCrystalsEarned()).toBe(100)
    sm.addCrystalsEarned(50)
    expect(sm.getTotalCrystalsEarned()).toBe(150)
  })

  it('reset restores defaults', () => {
    sm.updateHighScore(500)
    sm.addBugsKilled(10)
    sm.reset()
    expect(sm.getHighScore()).toBe(0)
    expect(sm.getTotalBugsKilled()).toBe(0)
  })

  it('formats stats string', () => {
    sm.updateHighScore(1000)
    sm.addBugsKilled(50)
    sm.addPlayTime(3661)
    sm.recordGamePlayed()
    const fmt = sm.getFormattedStats()
    expect(fmt).toContain('1,000')
    expect(fmt).toContain('50')
    expect(fmt).toContain('1h 1m')
    expect(fmt).toContain('1')
  })
})
