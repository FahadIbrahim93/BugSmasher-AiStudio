import { describe, it, expect } from 'vitest'
import { GameConfig } from '../lib/GameConfig'

describe('GameConfig', () => {
  it('has all required biomes', () => {
    expect(GameConfig.biomes.neon_core).toBeDefined()
    expect(GameConfig.biomes.quantum_void).toBeDefined()
    expect(GameConfig.biomes.ember_depths).toBeDefined()
    expect(GameConfig.biomes.frostbyte).toBeDefined()
    expect(GameConfig.biomes.void_abyss).toBeDefined()
  })

  it('has all bug types', () => {
    const bugTypes = ['basic', 'scout', 'tank', 'swarmer', 'mini', 'ghost', 'phase', 'ember', 'frost', 'healer', 'boss']
    bugTypes.forEach(t => expect(GameConfig.bugs[t as keyof typeof GameConfig.bugs]).toBeDefined())
  })

  it('boss config has variants', () => {
    const boss = GameConfig.bugs.boss
    expect(boss.variants).toHaveLength(3)
    expect(boss.variants[0].id).toBe('arachne')
    expect(boss.variants[1].id).toBe('mandible')
    expect(boss.variants[2].id).toBe('moth')
  })

  it('powerup types are defined', () => {
    expect(GameConfig.powerups.types.length).toBeGreaterThan(0)
    GameConfig.powerups.types.forEach(p => {
      expect(p.type).toBeTruthy()
      expect(p.color).toBeTruthy()
      expect(p.collection).toMatch(/^(click|hover)$/)
    })
  })

  it('player config has max health', () => {
    expect(GameConfig.player.maxHealth).toBeGreaterThan(0)
    expect(GameConfig.player.hitDamage).toBeGreaterThan(0)
  })
})
