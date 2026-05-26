import { describe, it, expect, beforeEach } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engineMock: any

beforeEach(() => {
  engineMock = {
    state: { wave: 1, health: 100, maxHealth: 100, score: 0, isPaused: false, isPlaying: false, gameOver: false, currentBiome: 'neon_core', performanceFactor: 1, shieldTimer: 0, multiplierTimer: 0, rapidFireTimer: 0, slowMoTimer: 0, overdriveTimer: 0, freezeTimer: 0, magnetTimer: 0, upgradeData: {}, bugsKilled: 0, combo: 0, crystals: 0 },
    width: 800,
    height: 600,
    currentBiome: 'neon_core',
    prestigeLevel: 0,
    performanceFactor: 1,
    globalTime: 0,
    coreX: 400,
    coreY: 300,
    bugs: [],
    hazards: [],
    resources: [],
    powerups: [],
    isMobile: false,
    dpr: 1,
    shakeTime: 0,
    shakeMagnitude: 0,
    shakeX: 0,
    shakeY: 0,
    hitStopTimer: 0,
    impactFrame: 0,
    baseScale: 1,
    baseRecoil: 0,
    baseRecoilAngle: 0,
    dashTimer: 0,
    dashCooldownTimer: 0,
    shieldTimer: 0,
    multiplierTimer: 0,
    rapidFireTimer: 0,
    slowMoTimer: 0,
    overdriveTimer: 0,
    freezeTimer: 0,
    magnetTimer: 0,
    spikeBurstTimer: 0,
    controlDistortionTimer: 0,
    autoTurretTimer: 0,
    hazardSlowdown: 1,
    damageMultiplier: 1,
    streakCount: 0,
    streakTimer: 0,
    lastHitTime: 0,
    playTimeAccumulator: 0,
    bugsKilledThisRun: 0,
    highestComboThisRun: 0,
    runStartTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    isTouching: false,
    swipeThreshold: 40,
    lastTime: 0,
    animationId: 0,
    isRunning: false,
    inputQueue: [],
    ctx: {
      setTransform: () => {},
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillText: () => {},
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
      textAlign: 'start' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      font: '',
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 10 }),
      createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      putImageData: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      clip: () => {},
      closePath: () => {},
    },
    particleSystem: {
      spawnExplosion: () => {},
      spawnShockwave: () => {},
      spawnSplatter: () => {},
      spawnGibs: () => {},
      spawnClickPulse: () => {},
      spawnLaser: () => {},
      spawnSparkExplosion: () => {},
      reset: () => {},
      update: () => {},
      particles: [],
      shockwaves: [],
      splatters: [],
      lasers: [],
      muzzleFlashes: [],
    },
    renderer: {
      draw: () => {},
      isGlitching: false,
      fireAlpha: 0,
      clickFlash: 0,
      impactFlash: 0,
      powerupAlpha: 0,
      chromaticOffset: 0,
      glitchTimer: 0,
    },
    waveCompleted: () => {},
    emitState: () => {},
    shake: () => {},
    pause: () => {},
    resume: () => {},
    start: () => {},
    stop: () => {},
    destroy: () => {},
    triggerDash: () => {},
    damageBug: () => {},
    queueClick: () => {},
    queueDash: () => {},
    handleTouchStart: () => {},
    handleTouchEnd: () => {},
    activatePowerup: () => {},
    purchaseUpgrade: () => {},
    startNextWave: () => {},
    spawnPowerup: () => {},
    spawnResource: () => {},
    onStateChange: () => {},
    onGameOver: () => {},
    onWaveComplete: () => {},
    onStoryScene: () => {},
    onAchievement: () => {},
    get threatShakeIntensity() { return 0 },
    canvas: {
      width: 800, height: 600, style: {} as Record<string, string>,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => null,
      toDataURL: () => '',
    },
  }
})

describe('WaveManager', () => {
  it('starts a wave with correct biome for wave 1', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    expect(wm.waveActive).toBe(true)
    expect(wm.isBossWave).toBe(false)
    expect(engineMock.currentBiome).toBe('neon_core')
  })

  it('selects boss wave every 10th wave', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.state.wave = 10
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    expect(wm.isBossWave).toBe(true)
    expect(wm.bossIntroActive).toBe(true)
  })

  it('progresses biome at wave thresholds', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    const testCases = [
      { wave: 1, expected: 'neon_core' },
      { wave: 5, expected: 'quantum_void' },
      { wave: 15, expected: 'ember_depths' },
      { wave: 25, expected: 'frostbyte' },
      { wave: 40, expected: 'void_abyss' },
    ]
    for (const tc of testCases) {
      engineMock.state.wave = tc.wave
      engineMock.currentBiome = 'neon_core'
      const wm = new WaveManager(engineMock as never)
      wm.startWave()
      expect(engineMock.currentBiome).toBe(tc.expected)
    }
  })

  it('selects golden_cache with prestige≥1 and wave≥10', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.prestigeLevel = 1
    engineMock.state.wave = 10
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    expect(engineMock.currentBiome).toBe('golden_cache')
  })

  it('selects golden_spire with prestige≥3 and wave≥30', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.prestigeLevel = 3
    engineMock.state.wave = 30
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    expect(engineMock.currentBiome).toBe('golden_spire')
  })

  it('spawns bugs over time', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.state.wave = 1
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    expect(wm.bugsToSpawn).toBeGreaterThan(0)
    const initialCount = engineMock.bugs.length
    // Update enough times to trigger spawn
    for (let i = 0; i < 10; i++) wm.update(0.2)
    expect(engineMock.bugs.length).toBeGreaterThan(initialCount)
  })

  it('triggers wave complete when all bugs spawned and killed', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.state.wave = 1
    let waveCompleted = false
    engineMock.waveCompleted = () => { waveCompleted = true }
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    // Spawn all bugs
    while (wm.bugsToSpawn > 0) wm.update(2)
    // Clear any remaining bugs
    engineMock.bugs = []
    wm.update(0.1)
    expect(waveCompleted).toBe(true)
    expect(wm.waveActive).toBe(false)
  })

  it('creates correct bug types for early waves', async () => {
    const { WaveManager } = await import('@/managers/WaveManager')
    engineMock.state.wave = 2
    const wm = new WaveManager(engineMock as never)
    wm.startWave()
    while (wm.bugsToSpawn > 0) wm.update(2)
    for (const bug of engineMock.bugs as Array<{ type: string }>) {
      expect(['basic', 'scout', 'swarmer', 'mini']).toContain(bug.type)
    }
  })
})
