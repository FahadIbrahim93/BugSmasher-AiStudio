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

const { SaveManager } = await import('../lib/SaveManager')

describe('SaveManager edge cases', () => {
  let sm: InstanceType<typeof SaveManager>

  beforeEach(() => {
    localStorageMock.clear()
    sm = new SaveManager()
  })

  it('addPlayTime can handle large values', () => {
    sm.addPlayTime(1000000)
    expect(sm.getTotalPlayTime()).toBe(1000000)
  })

  it('handles concurrent addBugsKilled calls', () => {
    sm.addBugsKilled(1)
    sm.addBugsKilled(1)
    sm.addBugsKilled(1)
    expect(sm.getTotalBugsKilled()).toBe(3)
  })

  it('handles multiple reset calls', () => {
    sm.updateHighScore(500)
    sm.reset()
    expect(sm.getHighScore()).toBe(0)
    sm.reset()
    expect(sm.getHighScore()).toBe(0)
  })

  it('getFormattedStats handles zero play time', () => {
    const fmt = sm.getFormattedStats()
    expect(fmt).toContain('0h 0m')
  })

  it('getFormattedStats handles large values', () => {
    sm.updateHighScore(999999)
    sm.addBugsKilled(999999)
    sm.addPlayTime(36000)
    const fmt = sm.getFormattedStats()
    expect(fmt).toContain('999,999')
    expect(fmt).toContain('10h')
  })

  it('handles localStorage full gracefully', () => {
    const original = localStorageMock.setItem
    localStorageMock.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    sm.updateHighScore(500)
    expect(sm.getHighScore()).toBe(500)
    localStorageMock.setItem = original
  })

  it('toggles sound and music independently', () => {
    sm.setSoundEnabled(false)
    sm.setMusicEnabled(true)
    expect(sm.isSoundEnabled()).toBe(false)
    expect(sm.isMusicEnabled()).toBe(true)
    sm.setSoundEnabled(true)
    expect(sm.isSoundEnabled()).toBe(true)
    sm.setMusicEnabled(false)
    expect(sm.isMusicEnabled()).toBe(false)
  })

  it('recordGamePlayed increments games played', () => {
    for (let i = 0; i < 100; i++) sm.recordGamePlayed()
    expect(sm.getGamesPlayed()).toBe(100)
  })
})
