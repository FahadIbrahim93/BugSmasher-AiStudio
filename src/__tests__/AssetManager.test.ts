import { describe, it, expect } from 'vitest'

describe('AssetManager', () => {
  const getAM = async () => {
    const m = await import('@/lib/AssetManager')
    m.assetManager.init()
    return m.assetManager
  }

  it('pre-renders all bug sprites', async () => {
    const am = await getAM()
    const sprite = am.getBugSprite('basic', 0, false)
    expect(sprite).toBeDefined()
    expect(sprite.width).toBeGreaterThan(0)
  })

  it('returns different frames for different walk cycles', async () => {
    const am = await getAM()
    const sprite1 = am.getBugSprite('basic', 0, false)
    const sprite2 = am.getBugSprite('basic', Math.PI, false)
    expect(sprite1).toBeDefined()
    expect(sprite2).toBeDefined()
  })

  it('returns flash sprite when hit', async () => {
    const am = await getAM()
    const sprite = am.getBugSprite('basic', 0, true)
    expect(sprite).toBeDefined()
  })

  it('pre-renders all powerup sprites', async () => {
    const am = await getAM()
    const sprite = am.getPowerupSprite('shield')
    expect(sprite).toBeDefined()
    expect(sprite.width).toBeGreaterThan(0)
  })

  it('returns core and shield sprites', async () => {
    const am = await getAM()
    const core = am.getCoreSprite()
    const shield = am.getShieldSprite()
    expect(core).not.toBeNull()
    expect(shield).not.toBeNull()
  })

  it('returns fallback for unknown bug type', async () => {
    const am = await getAM()
    const sprite = am.getBugSprite('nonexistent', 0, false)
    expect(sprite).toBeDefined()
    expect(sprite.width).toBe(1)
    expect(sprite.height).toBe(1)
  })

  it('does not reinitialize', async () => {
    const am = await getAM()
    const initialSprite = am.getBugSprite('basic', 0, false)
    am.init()
    const afterSprite = am.getBugSprite('basic', 0, false)
    expect(afterSprite).toBe(initialSprite)
  })
})
