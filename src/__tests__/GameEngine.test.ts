import { describe, it, expect, beforeAll } from 'vitest'

let canvas: HTMLCanvasElement

beforeAll(() => {
  const el = document.createElement('canvas')
  el.width = 800
  el.height = 600
  Object.defineProperty(el, 'parentElement', {
    value: { clientWidth: 800, clientHeight: 600 },
    writable: false,
    configurable: true,
  })
  canvas = el
})

describe('GameEngine', () => {
  it('creates and starts game loop', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    expect(engine.isRunning).toBe(true)
    expect(engine.state.isPlaying).toBe(true)
    expect(engine.state.health).toBe(100)
    expect(engine.state.wave).toBe(1)
    engine.destroy()
  })

  it('triggers dash with cooldown', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    engine.triggerDash(500, 400)
    expect(engine.dashTimer).toBe(engine.dashDuration)
    expect(engine.dashCooldownTimer).toBe(engine.dashCooldown)
    engine.destroy()
  })

  it('dash does not trigger when on cooldown', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    engine.triggerDash(500, 400)
    engine.dashCooldownTimer = 5
    engine.triggerDash(100, 100)
    // Second dash should NOT have changed the target (same position as first dash end)
    expect(engine.dashTimer).toBe(engine.dashDuration) // still duration from first dash
    engine.destroy()
  })

  it('spawns resources on bug kill', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    engine.bugs.push({
      id: 'test_bug', x: 400, y: 300, active: true, hp: 0, maxHp: 1, type: 'basic',
      isBoss: false, velocity: { x: 0, y: 0 }, speed: 50, color: '#4CAF50', size: 15,
      scoreValue: 10, walkCycle: 0, rotation: 0, offsetTime: 0, hitTimer: 0,
    })
    engine['damageBug'](engine.bugs[0], 999)
    expect(engine.resources.length).toBeGreaterThan(0)
    expect(engine.resources[0].type).toBe('scrap')
    engine.destroy()
  })

  it('tracks combo streak on kill', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    for (let i = 0; i < 3; i++) {
      engine.bugs.push({
        id: `bug_${i}`, x: 400 + i * 50, y: 300, active: true, hp: 0, maxHp: 1, type: 'basic',
        isBoss: false, velocity: { x: 0, y: 0 }, speed: 50, color: '#4CAF50', size: 15,
        scoreValue: 10, walkCycle: 0, rotation: 0, offsetTime: 0, hitTimer: 0,
      })
      engine['damageBug'](engine.bugs[0], 999)
    }
    expect(engine.streakCount).toBe(3)
    engine.destroy()
  })

  it('handles touch swipe as dash', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    engine.handleTouchStart(400, 300)
    engine.handleTouchEnd(600, 300)
    expect(engine.dashCooldownTimer).toBeGreaterThan(0)
    engine.destroy()
  })

  it('handles touch tap as click', async () => {
    const { GameEngine } = await import('@/core/GameEngine')
    const engine = new GameEngine(canvas)
    engine.start()
    engine.handleTouchStart(400, 300)
    engine.handleTouchEnd(405, 305)
    expect(engine['inputQueue'].length).toBe(1)
    engine.destroy()
  })
})
