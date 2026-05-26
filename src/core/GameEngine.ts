import { GameState, Bug, Hazard, Powerup, StoryScene } from '@/types'
import { WaveManager, StoryManager } from '@/managers'
import {
  ParticleSystem,
  Renderer,
  soundManager,
  GameConfig,
  saveManager,
  upgradeSystem,
  achievementSystem,
  assetManager,
  progressionManager,
} from '@/lib'
import type { ResourceType, UpgradeId } from '@/lib'

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  dpr = 1
  isMobile = false

  state: GameState
  bugs: Bug[] = []
  hazards: Hazard[] = []
  powerups: Powerup[] = []

  particleSystem: ParticleSystem
  waveManager: WaveManager
  storyManager: StoryManager
  renderer: Renderer

  lastTime = 0
  globalTime = 0
  animationId = 0
  isRunning = false
  shakeTime = 0
  shakeMagnitude = 0
  shakeX = 0
  shakeY = 0
  hitStopTimer = 0
  impactFrame = 0
  baseScale = 1
  baseRecoil = 0
  baseRecoilAngle = 0

  coreX = 0
  coreY = 0

  clickRadius = GameConfig.player.baseClickRadius

  touchStartX = 0
  touchStartY = 0
  touchStartTime = 0
  isTouching = false
  readonly swipeThreshold = GameConfig.physics.touchSwipeThreshold
  currentBiome = 'neon_core'
  prestigeLevel = 0
  performanceFactor = 1
  streakCount = 0
  streakTimer = 0
  lastHitTime = 0
  playTimeAccumulator = 0

  bugsKilledThisRun = 0
  highestComboThisRun = 0
  runStartTime = 0

  shieldTimer = 0
  multiplierTimer = 0
  rapidFireTimer = 0
  slowMoTimer = 0
  overdriveTimer = 0
  freezeTimer = 0
  magnetTimer = 0
  spikeBurstTimer = 0
  controlDistortionTimer = 0

  autoTurretTimer = 0
  hazardSlowdown = 1
  damageMultiplier = 1

  dashTimer = 0
  dashCooldownTimer = 0
  dashStartX = 0
  dashStartY = 0
  dashTargetX = 0
  dashTargetY = 0
  readonly dashDuration = GameConfig.physics.dashDuration
  readonly dashCooldown = GameConfig.physics.dashCooldown
  readonly dashDistance = GameConfig.physics.dashMaxDistance

  resources: { x: number; y: number; type: string; color: string; active: boolean; life: number; size: number }[] = []

  onStateChange?: (_state: GameState) => void
  onGameOver?: (_score: number) => void
  onWaveComplete?: () => void
  onStoryScene?: (_scene: StoryScene | null) => void
  onAchievement?: (_id: string, _name: string) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.width = canvas.width
    this.height = canvas.height

    this.state = {
      score: 0,
      health: GameConfig.player.maxHealth,
      maxHealth: GameConfig.player.maxHealth,
      wave: 1,
      gameOver: false,
      isPaused: false,
      isPlaying: false,
      currentBiome: 'neon_core',
      performanceFactor: 1,
      shieldTimer: 0,
      multiplierTimer: 0,
      rapidFireTimer: 0,
      slowMoTimer: 0,
      overdriveTimer: 0,
      freezeTimer: 0,
      magnetTimer: 0,
      upgradeData: {},
      bugsKilled: saveManager.getTotalBugsKilled(),
      combo: 0,
      crystals: upgradeSystem.getCrystals(),
    }

    this.particleSystem = new ParticleSystem()
    this.waveManager = new WaveManager(this)
    this.storyManager = new StoryManager()
    this.renderer = new Renderer(this)

    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  handleResize = () => {
    const parent = this.canvas.parentElement
    if (parent) {
      this.isMobile = window.innerWidth < 768
      this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? GameConfig.canvas.mobileDprCap : GameConfig.canvas.desktopDprCap)
      const cw = parent.clientWidth || window.innerWidth
      const ch = parent.clientHeight || window.innerHeight
      this.canvas.width = cw * this.dpr
      this.canvas.height = ch * this.dpr
      this.canvas.style.width = `${cw}px`
      this.canvas.style.height = `${ch}px`
      const oldW = this.width || cw
      const oldH = this.height || ch
      this.width = cw
      this.height = ch
      if (this.coreX === 0 || this.coreY === 0) {
        this.coreX = this.width / 2
        this.coreY = this.height / 2
      } else {
        this.coreX = (this.coreX / oldW) * this.width
        this.coreY = (this.coreY / oldH) * this.height
      }
    }
  }

  start() {
    if (this.isRunning) return
    soundManager.init()
    assetManager.init()
    this.isRunning = true
    this.lastTime = performance.now()
    this.globalTime = 0
    this.state.score = 0
    this.state.health = this.state.maxHealth
    this.state.wave = 1
    this.state.gameOver = false
    this.state.isPlaying = true
    this.state.bugsKilled = saveManager.getTotalBugsKilled()
    this.state.combo = 0
    this.state.crystals = upgradeSystem.getCrystals()
    this.coreX = this.width / 2
    this.coreY = this.height / 2
    this.bugsKilledThisRun = 0
    this.highestComboThisRun = 0
    this.streakCount = 0
    this.streakTimer = 0
    this.runStartTime = performance.now()
    this.resetEntities()
    soundManager.playBiomeMusic('neon_core')
    this.waveManager.startWave()
    saveManager.recordGamePlayed()
    this.loop(this.lastTime)
    this.emitState()
  }

  stop() {
    this.isRunning = false
    this.state.isPlaying = false
    cancelAnimationFrame(this.animationId)
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    soundManager.stopMusic()
  }

  get threatShakeIntensity(): number {
    return Math.min(GameConfig.physics.threatShakeIntensityMax, this.bugs.length * GameConfig.physics.threatShakeIntensityFactor)
  }

  private resetEntities() {
    this.bugs = []
    this.hazards = []
    this.powerups = []
    this.resources = []
    this.particleSystem.reset()
  }

  emitState() {
    this.state.currentBiome = this.currentBiome
    this.state.performanceFactor = this.performanceFactor
    this.state.shieldTimer = this.shieldTimer
    this.state.multiplierTimer = this.multiplierTimer
    this.state.rapidFireTimer = this.rapidFireTimer
    this.state.slowMoTimer = this.slowMoTimer
    this.state.overdriveTimer = this.overdriveTimer
    this.state.freezeTimer = this.freezeTimer
    this.state.magnetTimer = this.magnetTimer
    this.state.bugsKilled = saveManager.getTotalBugsKilled()
    this.state.combo = this.streakCount
    this.state.crystals = upgradeSystem.getCrystals()
    this.onStateChange?.({ ...this.state })
  }

  pause() {
    this.state.isPaused = true
  }
  resume() {
    this.state.isPaused = false
  }

  private loop = (time: number) => {
    if (!this.isRunning) return
    const dt = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time
    if (this.state.isPaused) {
      this.renderer.draw()
      this.animationId = requestAnimationFrame(this.loop)
      return
    }
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt
      this.renderer.draw()
      this.animationId = requestAnimationFrame(this.loop)
      return
    }
    this.update(dt)
    this.renderer.draw()
    this.animationId = requestAnimationFrame(this.loop)
  }

  shake(duration: number, mag: number, dx = 0, dy = 0) {
    this.shakeTime = duration
    this.shakeMagnitude = mag
    this.shakeX = dx
    this.shakeY = dy
  }

  private update(dt: number) {
    if (this.state.health <= 0) {
      this.endGame()
      return
    }
    this.updateTimers(dt)
    this.updateCorePhysics(dt)
    this.updateMetrics(dt)
    this.waveManager.update(dt)
    this.updateBugs(dt)
    this.updatePowerups(dt)
    this.updateResources(dt)
    this.updateHazards(dt)
    this.particleSystem.update(dt)
    this.processInputQueue()
  }

  private updateTimers(dt: number) {
    if (this.shieldTimer > 0) this.shieldTimer -= dt
    if (this.multiplierTimer > 0) this.multiplierTimer -= dt
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt
    if (this.slowMoTimer > 0) this.slowMoTimer -= dt
    if (this.overdriveTimer > 0) this.overdriveTimer -= dt
    if (this.freezeTimer > 0) this.freezeTimer -= dt
    if (this.magnetTimer > 0) this.magnetTimer -= dt
    if (this.spikeBurstTimer > 0) this.spikeBurstTimer -= dt
    if (this.controlDistortionTimer > 0) {
      this.controlDistortionTimer -= dt
      if (this.controlDistortionTimer <= 0) {
        this.renderer.isGlitching = false
      }
    }
    if (this.shakeTime > 0) this.shakeTime -= dt
    if (this.streakTimer > 0) {
      this.streakTimer -= dt
      if (this.streakTimer <= 0) {
        this.streakCount = 0
      }
    }
  }

  private updateMetrics(dt: number) {
    this.baseScale += (1 - this.baseScale) * GameConfig.physics.baseScaleLerp
    this.baseRecoil *= GameConfig.physics.baseRecoilDecay
    this.impactFrame = Math.max(0, this.impactFrame - dt * GameConfig.physics.impactFrameDecay)
    this.playTimeAccumulator += dt
    if (this.playTimeAccumulator >= 10) {
      this.playTimeAccumulator -= 10
      saveManager.addPlayTime(10)
    }
    const safety = Math.min(1, (this.globalTime - this.lastHitTime) / GameConfig.physics.performanceSafetyPeriod)
    const streak = Math.min(1, this.streakCount / GameConfig.physics.performanceStreakMax)
    this.performanceFactor = GameConfig.physics.performanceBase + safety * GameConfig.physics.performanceSafetyWeight + streak * GameConfig.physics.performanceStreakWeight
  }

  private updateBugs(dt: number) {
    let ts = this.slowMoTimer > 0 ? GameConfig.physics.slowMoTimeScale : 1
    if (this.freezeTimer > 0) ts = 0
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i]
      const dx = this.coreX - bug.x
      const dy = this.coreY - bug.y
      const dsq = dx * dx + dy * dy
      if (dsq < GameConfig.player.coreRadius ** 2) {
        if (this.shieldTimer <= 0) {
          this.state.health -= GameConfig.player.hitDamage
          this.impactFrame = 1
          this.lastHitTime = this.globalTime
          this.streakCount = 0
          this.shake(0.3, 10)
          this.renderer.chromaticOffset = 15
          this.hitStopTimer = 0.1
          soundManager.hitBase()
        } else {
          this.shake(0.2, 5)
          soundManager.splat()
        }
        this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color)
        this.bugs.splice(i, 1)
        continue
      }
      const dist = Math.sqrt(dsq)
      let speed = bug.speed * ts
      let vx = (dx / dist) * speed
      let vy = (dy / dist) * speed
      if (bug.type === 'scout' || bug.type === 'swarmer') {
        const e = Math.sin(this.globalTime * 10 + bug.offsetTime) * (bug.type === 'swarmer' ? 1.2 : 0.5)
        vx += -vy * e
        vy += (dx / dist) * speed * e
      }
      bug.rotation = Math.atan2(vy, vx) - Math.PI / 2
      bug.x += vx * dt
      bug.y += vy * dt
      bug.walkCycle += speed * dt * 0.2
      if (bug.hitTimer > 0) bug.hitTimer -= dt
      if ((this.currentBiome === 'void_abyss' || bug.type === 'phase') && dsq > GameConfig.physics.voidTeleportRadius ** 2) {
        bug.lastTeleportTime = (bug.lastTeleportTime || 0) + dt * ts
        if (bug.lastTeleportTime > (bug.type === 'phase' ? GameConfig.physics.phaseTeleportCooldown : GameConfig.physics.voidTeleportCooldown)) {
          bug.lastTeleportTime = 0
          this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 40)
          const ang = Math.random() * Math.PI * 2
          bug.x += Math.cos(ang) * GameConfig.physics.voidTeleportDist
          bug.y += Math.sin(ang) * GameConfig.physics.voidTeleportDist
          this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 30)
        }
      }
      if (this.currentBiome === 'golden_spire') {
        if (dsq < GameConfig.physics.healerRange ** 2) {
          bug.hp = Math.min(bug.maxHp, Math.max(0, bug.hp + dt * GameConfig.physics.goldenSpireRegen))
        }
      }
      if (bug.type === 'healer') this.updateHealer(bug, dt, ts)
      if (bug.type === 'boss') this.updateBoss(bug, dt, ts)
    }
  }

  private updateHealer(bug: Bug, dt: number, ts: number) {
    bug.healCooldown = (bug.healCooldown ?? 0) + dt * ts
    if (bug.healCooldown > GameConfig.physics.healerHealCooldown) {
      bug.healCooldown = 0
      bug.isHealing = true
      bug.healEffectTimer = 0.5
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ff66', GameConfig.physics.healerRange)
      this.bugs.forEach(o => {
        if (o !== bug && o.active) {
          const odx = o.x - bug.x
          const ody = o.y - bug.y
          if (odx * odx + ody * ody < GameConfig.physics.healerRange ** 2) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * GameConfig.physics.healerHealPercent)
        }
      })
    }
    if (bug.healEffectTimer && bug.healEffectTimer > 0) {
      bug.healEffectTimer -= dt * ts
      if (bug.healEffectTimer <= 0) bug.isHealing = false
    }
  }

  private updateBoss(bug: Bug, dt: number, ts: number) {
    if (bug.phase === undefined) {
      bug.phase = 1
      bug.abilityTimer = 0
      bug.isShielded = false
    }
    bug.offsetTime += dt
    bug.abilityTimer = (bug.abilityTimer || 0) + dt * ts
    const hpPct = bug.hp / bug.maxHp
    const conf = GameConfig.bugs.boss
    if (bug.phase === 1 && hpPct < GameConfig.physics.bossPhaseThreshold1) {
      bug.phase = 2
      this.shake(1, 30)
      soundManager.powerup('overdrive')
    }
    if (bug.phase === 2 && hpPct < GameConfig.physics.bossPhaseThreshold2) {
      bug.phase = 3
      bug.isShielded = true
      bug.abilityTimer = 0
      this.shake(1.5, 40)
      this.renderer.chromaticOffset = 20
    }
    if (bug.offsetTime > conf.attackRate) {
      bug.offsetTime = 0
      this.particleSystem.spawnShockwave(bug.x, bug.y, bug.color, 120)
      const cnt = bug.phase === 3 ? Math.floor(conf.minionSpawnCount * 1.5) : conf.minionSpawnCount
      for (let i = 0; i < cnt; i++) this.waveManager.spawnSpecificMinion(bug.x, bug.y)
    }
    if (bug.phase === 3 && !bug.isShielded && (bug.abilityTimer ?? 0) > 10) {
      bug.isShielded = true
      bug.abilityTimer = 0
    }
    if (bug.phase === 3 && bug.isShielded && (bug.abilityTimer ?? 0) > conf.shieldDuration) {
      bug.isShielded = false
      bug.abilityTimer = 0
    }
    if ((bug.phase ?? 0) >= 2 && (bug.abilityTimer ?? 0) > conf.barrageRate) {
      bug.abilityTimer = 0
      soundManager.bossAbility()
      for (let j = 0; j < conf.barrageCount; j++) {
        this.hazards.push({
          id: `barrage_${this.globalTime}_${j}`,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: conf.barrageRadius,
          type: 'barrage',
          timer: 0,
          duration: conf.barrageWarningTime,
          active: true,
        })
      }
    }
    if (bug.variantId === 'arachne') {
      bug.webTimer = (bug.webTimer || 0) + dt * ts
      if (bug.webTimer > 4) {
        bug.webTimer = 0
        this.hazards.push({
          id: `web_${this.globalTime}`,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: 50,
          type: 'web',
          timer: 0,
          duration: 8,
          active: true,
        })
      }
    } else if (bug.variantId === 'moth') {
      if (Math.random() < GameConfig.physics.mothDistortionChance * dt * (bug.phase || 1)) {
        this.controlDistortionTimer = 2
        this.renderer.isGlitching = true
      }
    } else if (bug.variantId === 'mandible') {
      bug.armor = Math.sin(this.globalTime * Math.PI) > 0 ? GameConfig.physics.mandibleArmorActive : 1.0
    }
  }

  private updatePowerups(dt: number) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i]
      p.life -= dt
      if (p.life <= 0) {
        this.powerups.splice(i, 1)
        continue
      }
      if (this.magnetTimer > 0) {
        const dx = this.coreX - p.x
        const dy = this.coreY - p.y
        const d = Math.sqrt(dx * dx + dy * dy)
        p.x += (dx / d) * GameConfig.physics.magnetPullSpeed * dt
        p.y += (dy / d) * GameConfig.physics.magnetPullSpeed * dt
      }
    }
  }

  private updateResources(dt: number) {
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const r = this.resources[i]
      if (!r.active) {
        this.resources.splice(i, 1)
        continue
      }
      r.life -= dt
      if (r.life <= 0) {
        r.active = false
        continue
      }
      const dx = this.coreX - r.x
      const dy = this.coreY - r.y
      const dsq = dx * dx + dy * dy
      if (dsq < GameConfig.physics.resourceMagnetRadius ** 2 || this.magnetTimer > 0) {
        const d = Math.sqrt(dsq) || 1
        const factor = this.magnetTimer > 0 ? 1 : 1 - d / GameConfig.physics.resourceMagnetRadius
        r.x -= Math.cos(Math.atan2(dy, dx)) * GameConfig.physics.resourcePullSpeed * factor * dt
        r.y -= Math.sin(Math.atan2(dy, dx)) * GameConfig.physics.resourcePullSpeed * factor * dt
      }
      if (dsq < GameConfig.physics.resourceCollectRadius ** 2) {
        r.active = false
        const cv = GameConfig.physics.crystalValues
        const crystalVal = r.type === 'neural_core' ? cv.neural_core : r.type === 'flux' ? cv.flux : r.type === 'alloy' || r.type === 'plasma' ? cv.alloy : cv.scrap
        upgradeSystem.addCrystals(crystalVal)
        progressionManager.addResource('crystals', crystalVal)
        saveManager.addCrystalsEarned(crystalVal)
        const rt = r.type as ResourceType
        if (rt === 'crystals') {
          progressionManager.addResource('crystals', crystalVal)
        } else {
          progressionManager.addResource(rt, 1)
        }
      }
    }
  }

  private updateHazards(dt: number) {
    let isInLava = false
    let isInWeb = false
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i]
      h.timer += dt
      if (h.timer >= h.duration) {
        this.triggerHazard(h)
        this.hazards.splice(i, 1)
        continue
      }
      const dx = h.x - this.coreX
      const dy = h.y - this.coreY
      const dsq = dx * dx + dy * dy
      const touchR = h.radius + GameConfig.physics.hazardTouchPad
      if (dsq < touchR * touchR) {
        if (h.type === 'lava') isInLava = true
        else if (h.type === 'web') isInWeb = true
      }
    }
    if (isInLava && this.shieldTimer <= 0) {
      this.state.health -= dt * GameConfig.physics.lavaDps
      if (Math.random() < 0.1) {
        this.shake(0.1, 2)
        this.renderer.impactFlash = Math.max(this.renderer.impactFlash, 0.4)
      }
    }
    this.hazardSlowdown = isInWeb ? 0.4 : 1.0
  }

  private triggerHazard(h: Hazard) {
    if (h.type === 'barrage') {
      this.particleSystem.spawnExplosion(h.x, h.y, '#ff3300')
      this.particleSystem.spawnShockwave(h.x, h.y, '#ff6600', h.radius * 2)
      const dsq = (h.x - this.coreX) ** 2 + (h.y - this.coreY) ** 2
      const dmgR = h.radius + GameConfig.physics.barrageDmgPad
      if (dsq < dmgR * dmgR && this.shieldTimer <= 0) {
        this.state.health -= GameConfig.player.hitDamage * 1.5
        this.renderer.impactFlash = 1.5
        this.shake(0.5, 25)
        soundManager.hitBase()
      }
    }
  }

  private spawnResource(x: number, y: number, bugType: string, bonusMultiplier = 1) {
    const types: Record<string, { type: string; color: string; count: number }> = {
      basic: { type: 'scrap', color: '#39ff14', count: 1 * bonusMultiplier },
      scout: { type: 'plasma', color: '#00ffff', count: 1 },
      tank: { type: 'alloy', color: '#ff00ff', count: 1 },
      ghost: { type: 'flux', color: '#ffffff', count: 1 },
      boss: { type: 'neural_core', color: '#ff0000', count: 1 },
      swarmer: { type: 'plasma', color: '#00ffff', count: 1 },
      mini: { type: 'scrap', color: '#39ff14', count: 1 },
    }
    const res = types[bugType]
    if (!res) return
    for (let i = 0; i < res.count; i++) {
      this.resources.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        type: res.type,
        color: res.color,
        active: true,
        life: GameConfig.physics.resourceLife,
        size: GameConfig.physics.resourceSize,
      })
    }
  }

  private inputQueue: Array<{ x: number; y: number }> = []

  queueClick(x: number, y: number) {
    this.inputQueue.push({ x, y })
  }

  queueDash(x: number, y: number) {
    this.triggerDash(x, y)
  }

  handleTouchStart(x: number, y: number) {
    this.touchStartX = x
    this.touchStartY = y
    this.touchStartTime = performance.now()
    this.isTouching = true
  }

  handleTouchEnd(x: number, y: number) {
    if (!this.isTouching) return
    this.isTouching = false
    const dx = x - this.touchStartX
    const dy = y - this.touchStartY
    const dist = Math.hypot(dx, dy)
    const elapsed = (performance.now() - this.touchStartTime) / 1000

    if (dist > this.swipeThreshold && elapsed < GameConfig.physics.touchSwipeMaxElapsed) {
      const targetX = this.coreX + dx * 2
      const targetY = this.coreY + dy * 2
      this.queueDash(targetX, targetY)
    } else {
      this.queueClick(x, y)
    }
  }

  private processInputQueue() {
    for (const click of this.inputQueue) this.processClick(click.x, click.y)
    this.inputQueue = []
  }

  private processClick(x: number, y: number) {
    const touchBonus = this.isMobile ? GameConfig.physics.touchBonusMobile : 0
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i]
      if (Math.hypot(p.x - x, p.y - y) < p.size + GameConfig.physics.powerupClickRadiusPad + touchBonus) {
        this.activatePowerup(p.type)
        this.powerups.splice(i, 1)
        return
      }
    }
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const bug = this.bugs[i]
      if (!bug.active || bug.hp <= 0) continue
      const r = (bug.isBoss ? bug.size * GameConfig.physics.bossClickRadiusMul : bug.size + GameConfig.physics.bugClickRadiusPad) + touchBonus
      if (Math.hypot(bug.x - x, bug.y - y) < r) {
        this.damageBug(bug, this.damageMultiplier)
        this.particleSystem.spawnClickPulse(x, y)
        return
      }
    }
    this.particleSystem.spawnClickPulse(x, y)
  }

  damageBug(bug: Bug, amount: number) {
    let dmg = amount
    if (bug.type === 'boss' && bug.isShielded) {
      this.particleSystem.spawnShockwave(bug.x, bug.y, '#00ffff', 40)
      soundManager.uiError()
      return
    }
    if (bug.type === 'boss') {
      soundManager.bossHit()
      const pulse = Math.sin(this.globalTime * 10)
      if (pulse > 0.8) {
        dmg *= 2
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#fff', 60)
        this.hitStopTimer = 0.05
        this.renderer.chromaticOffset = 10
      } else if (pulse < -0.8) dmg *= 0.5
    }
    bug.hp -= dmg
    bug.hitTimer = 0.1
    this.shake(GameConfig.physics.shakeOnDamageDuration, GameConfig.physics.shakeOnDamageMagnitude)
    soundManager.shoot()
    this.particleSystem.spawnGibs(bug.x, bug.y, bug.color, 3)
    this.particleSystem.spawnShockwave(bug.x, bug.y, '#fff', 30)

    if (bug.hp <= 0) {
      const idx = this.bugs.indexOf(bug)
      if (idx < 0) return
      this.bugs.splice(idx, 1)
      this.streakCount++
      this.streakTimer = GameConfig.physics.streakDecayTime
      if (this.streakCount > this.highestComboThisRun) this.highestComboThisRun = this.streakCount
      this.bugsKilledThisRun++
      saveManager.addBugsKilled(1)

      const isBoss = bug.type === 'boss'
      const mult = this.multiplierTimer > 0 ? GameConfig.physics.scoreMultiplierActive : 1
      this.state.score += bug.scoreValue * mult

      const crystalBonus = isBoss ? bug.scoreValue * 0.1 : bug.scoreValue * 0.02
      const crystalMulti = upgradeSystem.getCrystalMultiplier()
      const crystalAmount = Math.floor(crystalBonus * crystalMulti) + 1
      upgradeSystem.addCrystals(crystalAmount)
      progressionManager.addResource('crystals', crystalAmount)
      saveManager.addCrystalsEarned(crystalAmount)

      soundManager.splat()
      this.hitStopTimer = 0.04
      const intens = isBoss ? GameConfig.physics.shakeBossIntensity : bug.type === 'tank' ? GameConfig.physics.shakeTankMultiplier * 10 : GameConfig.physics.shakeDefaultMultiplier * 10
      this.shake(isBoss ? GameConfig.physics.shakeBossDuration : GameConfig.physics.shakeMultiplierDuration * intens / 10, isBoss ? GameConfig.physics.shakeBossIntensity : intens)
      this.particleSystem.spawnSplatter(bug.x, bug.y, bug.color)
      this.particleSystem.spawnExplosion(bug.x, bug.y, bug.color)
      if (isBoss) {
        soundManager.bossDeath()
        this.particleSystem.spawnShockwave(bug.x, bug.y, '#ff0000', GameConfig.physics.bossDeathShockwaveRadius)
        this.shake(1.5, 60)
        this.hitStopTimer = GameConfig.physics.bossHitStop
        this.renderer.chromaticOffset = 40
        this.impactFrame = 1
        for (let i = 0; i < 3; i++) this.spawnPowerup(bug.x + (Math.random() - 0.5) * 50, bug.y + (Math.random() - 0.5) * 50, true)
        for (let i = 0; i < 3; i++) this.spawnResource(bug.x + (Math.random() - 0.5) * 50, bug.y + (Math.random() - 0.5) * 50, 'boss', 5)
        this.onStoryScene?.(this.storyManager.getSceneForWave(this.state.wave))
      }
      this.spawnResource(bug.x, bug.y, bug.type)
      if (Math.random() < GameConfig.powerups.dropChance) this.spawnPowerup(bug.x, bug.y)
      if (this.overdriveTimer > 0 && this.autoTurretTimer <= 0) {
        this.autoTurretTimer = GameConfig.physics.overdriveAutoturretCooldown
        const target = this.getClosestBug()
        if (target) {
          this.particleSystem.spawnLaser(this.coreX, this.coreY, target.x, target.y, '#ff6600', 3)
          this.damageBug(target, 1)
        }
      }

      const newAch = achievementSystem.checkUnlocks({
        kills: saveManager.getTotalBugsKilled(),
        combo: this.highestComboThisRun,
        wave: this.state.wave,
        score: this.state.score,
        bugsPerClick: 1,
        totalCrystals: upgradeSystem.getCrystals(),
        prestigeLevel: this.prestigeLevel,
      })
      for (const a of newAch) this.onAchievement?.(a.id, a.name)

      this.emitState()
    }
  }

  private getClosestBug(): Bug | null {
    let closest: Bug | null = null
    let minDist = Infinity
    for (const bug of this.bugs) {
      const d = Math.hypot(bug.x - this.coreX, bug.y - this.coreY)
      if (d < minDist) {
        minDist = d
        closest = bug
      }
    }
    return closest
  }

  private spawnPowerup(x: number, y: number, force = false) {
    if (!force && Math.random() > GameConfig.powerups.dropChance) return
    const types = GameConfig.powerups.types
    const pt = types[Math.floor(Math.random() * types.length)]
    this.powerups.push({
      active: true,
      x,
      y,
      type: pt.type,
      color: pt.color,
      icon: pt.icon,
      life: GameConfig.powerups.life,
      maxLife: GameConfig.powerups.life,
      size: GameConfig.physics.powerupSize,
      collection: pt.collection,
    })
  }

  activatePowerup(type: string) {
    soundManager.powerup(type)
    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#fff', 300)
    switch (type) {
      case 'shield':
        this.shieldTimer = GameConfig.powerups.duration
        break
      case 'multiplier':
        this.multiplierTimer = GameConfig.powerups.duration
        break
      case 'rapid_fire':
        this.rapidFireTimer = GameConfig.powerups.duration
        break
      case 'slow_mo':
        this.slowMoTimer = GameConfig.powerups.duration
        break
      case 'freeze':
        this.freezeTimer = GameConfig.powerups.duration
        break
      case 'magnet':
        this.magnetTimer = GameConfig.powerups.duration
        break
      case 'spike_burst':
        this.shake(0.5, 20)
        this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ff3300', 500)
        for (const bug of this.bugs) this.damageBug(bug, 2)
        break
      case 'nuke':
        soundManager.nuke()
        this.shake(1.5, 40)
        this.renderer.chromaticOffset = 30
        this.hitStopTimer = 0.15
        this.impactFrame = 1
        this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ffaa00', 1000)
        for (let i = this.bugs.length - 1; i >= 0; i--) this.damageBug(this.bugs[i], 9999)
        break
      case 'overdrive':
        this.overdriveTimer = GameConfig.powerups.duration
        break
    }
    this.emitState()
  }

  purchaseUpgrade(key: string): boolean {
    const result = upgradeSystem.purchaseUpgrade(key as UpgradeId)
    if (result) {
      switch (key) {
        case 'extra_life':
          this.state.maxHealth += 25
          this.state.health = Math.min(this.state.health + 25, this.state.maxHealth)
          break
        case 'click_power':
          this.damageMultiplier = upgradeSystem.getClickDamage() / 10
          break
        case 'combo_master':
          this.streakTimer = 2 * upgradeSystem.getComboDecayMultiplier()
          break
      }
      soundManager.upgrade()
      this.emitState()
      return true
    }
    soundManager.uiError()
    return false
  }

  startNextWave() {
    this.state.wave++
    this.waveManager.startWave()
    soundManager.playBiomeMusic(this.currentBiome)
    this.resume()
    this.emitState()
  }

  waveCompleted() {
    this.pause()
    this.onWaveComplete?.()
  }

  triggerDash(targetX: number, targetY: number) {
    if (this.dashCooldownTimer > 0 || !this.isRunning) return
    this.dashCooldownTimer = this.dashCooldown
    this.dashTimer = this.dashDuration
    this.dashStartX = this.coreX
    this.dashStartY = this.coreY
    const dx = targetX - this.coreX
    const dy = targetY - this.coreY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const actualDist = Math.min(dist, this.dashDistance)
    this.dashTargetX = this.coreX + (dx / dist) * actualDist
    this.dashTargetY = this.coreY + (dy / dist) * actualDist
    const margin = GameConfig.physics.dashBoundaryMargin
    this.dashTargetX = Math.max(margin, Math.min(this.width - margin, this.dashTargetX))
    this.dashTargetY = Math.max(margin, Math.min(this.height - margin, this.dashTargetY))
    this.renderer.chromaticOffset = 25
    this.impactFrame = 0.35
    this.shake(0.4, 12)
    this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#ffffff', 80)
  }

  updateCorePhysics(dt: number) {
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt)
    if (this.dashTimer > 0) {
      this.dashTimer -= dt
      const t = 1 - this.dashTimer / this.dashDuration
      const ease = t * (2 - t)
      this.coreX = this.dashStartX + (this.dashTargetX - this.dashStartX) * ease
      this.coreY = this.dashStartY + (this.dashTargetY - this.dashStartY) * ease
      const trailColor = this.shieldTimer > 0 ? GameConfig.physics.trailColorShielded : GameConfig.physics.trailColorDefault
      this.particleSystem.spawnSparkExplosion(this.coreX, this.coreY, trailColor)
      const pushR2 = GameConfig.physics.dashPushRadius ** 2
      this.bugs.forEach(bug => {
        const dx = bug.x - this.coreX
        const dy = bug.y - this.coreY
        const dsq = dx * dx + dy * dy
        if (dsq < pushR2) {
          const d = Math.sqrt(dsq) || 1
          bug.x += (dx / d) * GameConfig.physics.dashPushSpeed * dt
          bug.y += (dy / d) * GameConfig.physics.dashPushSpeed * dt
          this.damageBug(bug, GameConfig.physics.dashDamage)
        }
      })
      if (this.dashTimer <= 0) this.particleSystem.spawnShockwave(this.coreX, this.coreY, '#00ffff', GameConfig.physics.dashEndShockwaveRadius)
    } else {
      const tx = this.width / 2
      const ty = this.height / 2
      const dx = tx - this.coreX
      const dy = ty - this.coreY
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 1) {
        const speed = GameConfig.physics.snapbackSpeed
        this.coreX += (dx / d) * Math.min(d, speed * dt)
        this.coreY += (dy / d) * Math.min(d, speed * dt)
      } else {
        this.coreX = tx
        this.coreY = ty
      }
    }
  }

  private endGame() {
    this.state.gameOver = true
    this.state.isPlaying = false
    this.isRunning = false
    soundManager.stopMusic()
    cancelAnimationFrame(this.animationId)

    saveManager.updateHighScore(this.state.score)
    saveManager.setHighestWave(this.state.wave)
    const elapsed = Math.floor((performance.now() - this.runStartTime) / 1000)
    saveManager.addPlayTime(elapsed)

    this.onGameOver?.(this.state.score)
  }
}
