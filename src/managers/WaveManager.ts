import { GameEngine } from '@/core/GameEngine'
import { Bug } from '@/types'
import { GameConfig, BugConfigKey, soundManager } from '@/lib'

export class WaveManager {
  engine: GameEngine
  bugsToSpawn = 0
  spawnTimer = 0
  waveActive = false
  intensity = 1
  intensityTimer = 0
  surgeActive = false
  surgeTimer = 0
  isBossWave = false
  bossSpawned = false
  bossWarningSounded = false
  bossIntroActive = false
  bossIntroTimer = 0

  constructor(engine: GameEngine) { this.engine = engine }

  startWave() {
    this.waveActive = true
    this.isBossWave = this.engine.state.wave % 10 === 0
    this.bossSpawned = false
    this.bossWarningSounded = false
    this.bossIntroActive = this.isBossWave
    this.bossIntroTimer = this.isBossWave ? 1.5 : 0
    this.updateBiome()

    if (this.isBossWave) this.bugsToSpawn = 1 + Math.floor(this.engine.state.wave * 1.5)
    else this.bugsToSpawn = GameConfig.waves.baseBugs + this.engine.state.wave * GameConfig.waves.bugsPerWave + Math.floor(this.engine.performanceFactor * 5)

    this.spawnTimer = 0; this.intensity = 1; this.intensityTimer = 0; this.surgeActive = false
    this.surgeTimer = this.engine.performanceFactor > 1.8 ? 2 : Math.random() * 5 + 5
  }

  private updateBiome() {
    const wave = this.engine.state.wave
    const prestige = this.engine.prestigeLevel
    const old = this.engine.currentBiome
    if (prestige >= 3 && wave >= 30) this.engine.currentBiome = 'golden_spire'
    else if (wave >= 40) this.engine.currentBiome = 'void_abyss'
    else if (prestige >= 1 && wave >= 10) this.engine.currentBiome = 'golden_cache'
    else if (wave >= 25) this.engine.currentBiome = 'frostbyte'
    else if (wave >= 15) this.engine.currentBiome = 'ember_depths'
    else if (wave >= 5) this.engine.currentBiome = 'quantum_void'
    else this.engine.currentBiome = 'neon_core'
    if (old !== this.engine.currentBiome) soundManager.playBiomeMusic(this.engine.currentBiome)
  }

  update(dt: number) {
    if (!this.waveActive) return
    if (this.bossIntroActive) {
      this.bossIntroTimer -= dt
      if (this.bossIntroTimer <= 0) this.bossIntroActive = false
      if (this.bossIntroTimer < 2 && !this.bossWarningSounded) { soundManager.bossWarning(); this.bossWarningSounded = true }
      return
    }

    this.intensityTimer += dt
    this.intensity = 1 + Math.sin(this.intensityTimer * 0.5) * 0.5

    if (!this.isBossWave) {
      this.surgeTimer -= dt
      if (this.surgeTimer <= 0) { this.surgeActive = !this.surgeActive; this.surgeTimer = this.surgeActive ? (Math.random() * 3 + 2) : (Math.random() * 10 + 10) }
    } else this.surgeActive = false

    if (this.bugsToSpawn > 0) {
      this.spawnTimer += dt
      let rate = Math.max(GameConfig.waves.minSpawnRate, GameConfig.waves.baseSpawnRate - this.engine.state.wave * GameConfig.waves.spawnRateReduction)
      if (this.isBossWave) {
        rate = 1.7
        if (!this.bossSpawned) { this.spawnBoss(); this.bossSpawned = true; this.spawnTimer = -2 }
      }
      rate /= this.intensity * (this.surgeActive ? (1 + this.engine.performanceFactor) : 1)
      if (this.spawnTimer > rate) {
        this.spawnTimer = 0
        const group = (this.surgeActive ? 2 : 1) + (this.engine.performanceFactor > 1.5 ? 1 : 0)
        for (let i = 0; i < group; i++) { if (this.bugsToSpawn > 0) this.spawnBug() }
      }
    } else if (this.engine.bugs.length === 0) {
      this.waveActive = false
      this.engine.waveCompleted()
    }
  }

  private spawnBoss() {
    this.bugsToSpawn--
    const bug = this.createBug('boss', this.engine.state.wave)
    if (GameConfig.bugs.boss.variants) {
      const idx = Math.floor(Math.random() * GameConfig.bugs.boss.variants.length)
      const v = GameConfig.bugs.boss.variants[idx]; bug.variantId = v.id; bug.color = v.color
    }
    this.engine.bugs.push(bug)
    if (!this.bossWarningSounded) { soundManager.bossWarning(); this.bossWarningSounded = true }
  }

  private spawnBug() {
    if (this.bugsToSpawn <= 0) return
    this.bugsToSpawn--
    this.engine.bugs.push(this.createBug(this.decideType(this.engine.state.wave), this.engine.state.wave))
  }

  spawnSpecificMinion(x: number, y: number) {
    const type = Math.random() > 0.5 ? 'mini' : 'scout'
    const bug = this.createBug(type, this.engine.state.wave); bug.x = x; bug.y = y
    this.engine.bugs.push(bug)
    this.engine.particleSystem.spawnShockwave(x, y, '#ff0000', 40)
  }

  private decideType(wave: number): string {
    const biome = this.engine.currentBiome; const r = Math.random()
    if (wave < 3) return 'basic'
    if (biome === 'quantum_void' && r < 0.3) return 'phase'
    if (biome === 'ember_depths' && r < 0.4) return 'tank'
    if (biome === 'frostbyte' && r < 0.4) return 'scout'
    if (biome === 'void_abyss' && r < 0.4) return 'ghost'
    if (wave > 8 && r < 0.05) return 'healer'
    if (wave < 6) return r < 0.6 ? 'basic' : (r < 0.8 ? 'scout' : 'swarmer')
    if (wave < 12) { if (r < 0.3) return 'basic'; if (r < 0.5) return 'scout'; if (r < 0.7) return 'swarmer'; if (r < 0.9) return 'tank'; return 'ghost' }
    return ['basic', 'scout', 'tank', 'swarmer', 'ghost', 'phase', 'ember', 'frost'][Math.floor(Math.random() * 8)]
  }

  private createBug(typeName: string, wave: number): Bug {
    const edge = Math.floor(Math.random() * 4); let x = 0, y = 0; const m = 100
    if (edge === 0) { x = Math.random() * this.engine.width; y = -m }
    else if (edge === 1) { x = this.engine.width + m; y = Math.random() * this.engine.height }
    else if (edge === 2) { x = Math.random() * this.engine.width; y = this.engine.height + m }
    else { x = -m; y = Math.random() * this.engine.height }

    const conf = typeName in GameConfig.bugs ? GameConfig.bugs[typeName as BugConfigKey] : null
    if (!conf) return this.createBug('basic', wave)

    const hp = Math.floor((conf.baseHp + Math.floor(wave * conf.hpPerWave)) * (1 + (this.engine.performanceFactor - 1) * 0.5))
    const speed = (conf.baseSpeed + wave * conf.speedPerWave) * (1 + (this.engine.performanceFactor - 1) * 0.2)

    return {
      id: `bug_${Math.random().toString(36).slice(2, 9)}`,
      x, y,
      active: true,
      type: typeName,
      isBoss: typeName === 'boss',
      hp, maxHp: hp,
      velocity: { x: 0, y: 0 },
      speed, color: conf.color, size: conf.size,
      scoreValue: Math.floor(conf.score * this.engine.performanceFactor * (typeName === 'boss' ? 100 : 1)),
      walkCycle: Math.random() * Math.PI * 2,
      rotation: 0, offsetTime: Math.random() * 100,
      hitTimer: 0
    }
  }
}
