import { GameEngine } from '@/core/GameEngine'
import { Bug, Hazard, Powerup } from '@/types'
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from './ParticleSystem'
import { assetManager } from './AssetManager'

export class Renderer {
  engine: GameEngine
  isGlitching = false
  fireAlpha = 0
  clickFlash = 0
  impactFlash = 0
  powerupAlpha = 0
  chromaticOffset = 0
  glitchTimer = 0

  constructor(engine: GameEngine) { this.engine = engine }

  draw() {
    const ctx = this.engine.ctx
    const w = this.engine.width
    const h = this.engine.height

    let ox = 0, oy = 0
    const ambient = this.engine.threatShakeIntensity
    if (ambient > 0) { ox = (Math.random() - 0.5) * ambient; oy = (Math.random() - 0.5) * ambient }
    if (this.engine.shakeTime > 0) {
      const i = this.engine.shakeTime / 0.5
      ox += (Math.random() - 0.5) * this.engine.shakeMagnitude + this.engine.shakeX * this.engine.shakeMagnitude * i
      oy += (Math.random() - 0.5) * this.engine.shakeMagnitude + this.engine.shakeY * this.engine.shakeMagnitude * i
    }
    ctx.setTransform(this.engine.dpr, 0, 0, this.engine.dpr, ox * this.engine.dpr, oy * this.engine.dpr)

    const milestone = Math.floor(this.engine.state.wave / 10)
    const bgs = ['#050505', '#0a0508', '#0d0505', '#050a0d', '#10050a', '#1a0d05']
    ctx.fillStyle = bgs[Math.min(milestone, bgs.length - 1)]
    ctx.fillRect(0, 0, w, h)

    this.drawBiomeBackground()
    this.drawGlitchOverlay()
    this.drawScanlines()
    if (this.isGlitching) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,255,0.1)'
      ctx.fillRect((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, w, h)
    }
    if (this.engine.waveManager.bossIntroActive) { this.drawBossIntro(); ctx.setTransform(1, 0, 0, 1, 0, 0); return }
    if (this.engine.waveManager.isBossWave) {
      const ab = this.engine.bugs.find(b => b.type === 'boss')
      if (ab && ab.hp === ab.maxHp && !this.engine.waveManager.bossIntroActive) this.drawBossWarning()
    }

    const ps = this.engine.particleSystem
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < ps.splatters.length; i++) { const s = ps.splatters[i]; if (s.active) this.drawSplatter(s) }
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < ps.shockwaves.length; i++) { const sw = ps.shockwaves[i]; if (sw.active) this.drawShockwave(sw) }
    for (let i = 0; i < ps.particles.length; i++) { const p = ps.particles[i]; if (p.active) this.drawParticle(p) }
    for (let i = 0; i < ps.lasers.length; i++) { const l = ps.lasers[i]; if (l.active) this.drawLaser(l) }
    for (let i = 0; i < ps.muzzleFlashes.length; i++) { const mf = ps.muzzleFlashes[i]; if (mf.active) this.drawMuzzleFlash(mf) }
    ctx.globalCompositeOperation = 'source-over'

    for (const p of this.engine.powerups) this.drawPowerup(p)
    const resources = this.engine.resources
    for (let i = 0; i < resources.length; i++) { const r = resources[i]; if (r.active) this.drawResource(r) }
    this.drawBase()
    for (const h of this.engine.hazards) this.drawHazard(h)
    for (const b of this.engine.bugs) this.drawBug(b)

    this.drawCRT()
    if (this.chromaticOffset > 0) { this.drawChromatic(); this.chromaticOffset *= 0.9; if (this.chromaticOffset < 0.1) this.chromaticOffset = 0 }
    if (this.clickFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.clickFlash * 0.05})`; ctx.fillRect(0, 0, w, h); this.clickFlash *= 0.85; if (this.clickFlash < 0.01) this.clickFlash = 0 }
    if (this.engine.impactFrame > 0) { ctx.fillStyle = `rgba(255,255,255,${this.engine.impactFrame * 0.8})`; ctx.fillRect(0, 0, w, h) }

    this.drawLightingPass(w, h)
    const hr = this.engine.state.health / this.engine.state.maxHealth
    const crisis = hr < 0.3
    const vo = crisis ? (0.5 + Math.sin(this.engine.globalTime * 8) * 0.2) : Math.min(0.25, (this.engine.state.wave / 50) * 0.25)
    const vg = ctx.createRadialGradient(w / 2, h / 2, w / 4, w / 2, h / 2, w * 0.8)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, crisis ? `rgba(255,0,0,${vo * 0.5})` : `rgba(0,0,0,${vo})`)
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h)

    this.drawActivePowerupUI(w, h)
    this.drawBossHealthBar(w, h)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private drawLightingPass(w: number, h: number) {
    const ctx = this.engine.ctx
    ctx.save(); ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = `rgba(0,0,10,${0.4 + Math.sin(this.engine.globalTime * 0.1) * 0.1})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'screen'
    const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 200)
    cg.addColorStop(0, 'rgba(255,255,255,0.4)'); cg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h)
    for (const bug of this.engine.bugs) {
      if (!bug.active) continue
      const bg = ctx.createRadialGradient(bug.x, bug.y, 0, bug.x, bug.y, bug.size * 3)
      bg.addColorStop(0, `${bug.color}66`); bg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
  }

  private drawActivePowerupUI(w: number, _h: number) {
    const ctx = this.engine.ctx; let y = 30
    ctx.textAlign = 'right'; ctx.font = 'bold 12px "JetBrains Mono", monospace'
    if (this.engine.multiplierTimer > 0) { ctx.fillStyle = '#fff'; ctx.fillText(`2X UPLINK: ${Math.ceil(this.engine.multiplierTimer)}s`, w - 20, y); y += 20 }
    if (this.engine.rapidFireTimer > 0) { ctx.fillStyle = '#ffcc00'; ctx.fillText(`OVERRIDE: ${Math.ceil(this.engine.rapidFireTimer)}s`, w - 20, y); y += 20 }
    if (this.engine.slowMoTimer > 0) { ctx.fillStyle = '#33ff99'; ctx.fillText(`TIME DILATION: ${Math.ceil(this.engine.slowMoTimer)}s`, w - 20, y); y += 20 }
    if (this.engine.overdriveTimer > 0) { ctx.fillStyle = '#ff6600'; ctx.fillText(`CRITICAL OVERDRIVE: ${Math.ceil(this.engine.overdriveTimer)}s`, w - 20, y) }
  }

  private drawBiomeBackground() {
    const ctx = this.engine.ctx
    const b = this.engine.currentBiome
    const w = this.engine.width, h = this.engine.height
    const map: Record<string, [string, string]> = {
      neon_core: ['#050505', '#0a0a0a'], quantum_void: ['#08001a', '#1a0033'],
      ember_depths: ['#1a0500', '#330a00'], frostbyte: ['#001a1a', '#003344'],
      void_abyss: ['#000', '#111'], golden_cache: ['#1a1a00', '#333300'],
      golden_spire: ['#0a0a05', '#1a1a10']
    }
    const [cA, cB] = map[b] || map.neon_core
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w)
    const hr = this.engine.state.health / this.engine.state.maxHealth
    if (hr < 0.3) {
      const pulse = Math.sin(this.engine.globalTime * 8) * 0.2 + 0.2
      g.addColorStop(0, cB); g.addColorStop(1, `rgba(180,0,0,${pulse})`)
    } else {
      g.addColorStop(0, cB); g.addColorStop(1, cA)
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)

    if (['neon_core', 'golden_cache'].includes(b)) this.drawGrid(200, 'rgba(255,255,255,0.01)')
    else if (['quantum_void', 'void_abyss'].includes(b)) this.drawStars(b === 'void_abyss' ? 100 : 50)
    else if (b === 'ember_depths') this.drawLava()
    else if (b === 'frostbyte') this.drawSnow()
    if (!this.engine.isMobile) this.drawMesh()
  }

  private drawGrid(size: number, color: string) {
    const ctx = this.engine.ctx
    ctx.strokeStyle = color; ctx.lineWidth = 1
    for (let x = 0; x < this.engine.width; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.engine.height); ctx.stroke() }
    for (let y = 0; y < this.engine.height; y += size) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.engine.width, y); ctx.stroke() }
  }

  private drawStars(n: number) {
    const ctx = this.engine.ctx; const t = this.engine.globalTime
    for (let i = 0; i < n; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.engine.width
      const y = (Math.cos(i * 678.9) * 0.5 + 0.5) * this.engine.height
      const s = (Math.sin(t + i) * 0.5 + 0.5) * 2
      ctx.fillStyle = `rgba(255,255,255,${Math.sin(t * 2 + i) * 0.5 + 0.5})`
      ctx.fillRect(x, y, s, s)
    }
  }

  private drawLava() {
    const ctx = this.engine.ctx; const t = this.engine.globalTime
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(i * 500) * 0.5 + 0.5) * this.engine.width
      const y = (this.engine.height - (t * 50 + i * 40) % (this.engine.height + 100))
      const r = (Math.sin(t + i) * 0.5 + 0.5) * 10 + 5
      ctx.fillStyle = 'rgba(255,50,0,0.1)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
  }

  private drawSnow() {
    const ctx = this.engine.ctx; const t = this.engine.globalTime
    for (let i = 0; i < 40; i++) {
      const x = (Math.sin(i * 1000 + t * 0.5) * 0.5 + 0.5) * this.engine.width
      const y = (t * 80 + i * 30) % (this.engine.height + 50)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
    }
  }

  private drawMesh() {
    const ctx = this.engine.ctx; const t = this.engine.globalTime; const w = this.engine.width; const h = this.engine.height
    const hr = this.engine.state.health / this.engine.state.maxHealth; const lh = hr < 0.3
    const intense = this.engine.performanceFactor > 1.5 || this.engine.bugs.length > 20 || this.engine.waveManager.isBossWave
    let wx = 20, wy = 15, sm = 1
    if (lh) { wx = 30 + Math.sin(t * 10) * 10; wy = 25 + Math.cos(t * 12) * 10; sm = 2 }
    else if (intense) { wx = 25; wy = 20; sm = 1.5 }
    ctx.lineWidth = 1; const gs = 80
    ctx.beginPath()
    for (let x = 0; x <= w; x += gs) {
      for (let y = 0; y <= h; y += 10) {
        const nwx = Math.sin(y * 0.005 + t * 0.2 * sm) * wx; const nwy = Math.cos(x * 0.005 + t * 0.15 * sm) * wy
        y === 0 ? ctx.moveTo(x + nwx, y + nwy) : ctx.lineTo(x + nwx, y + nwy)
      }
    }
    for (let y = 0; y <= h; y += gs) {
      for (let x = 0; x <= w; x += 10) {
        const nwx = Math.sin(y * 0.005 + t * 0.2 * sm) * wx; const nwy = Math.cos(x * 0.005 + t * 0.15 * sm) * wy
        x === 0 ? ctx.moveTo(x + nwx, y + nwy) : ctx.lineTo(x + nwx, y + nwy)
      }
    }
    let sc = 'rgba(255,255,255,0.01)'
    if (lh) sc = `rgba(255,0,0,${0.05 + Math.abs(Math.sin(t * 5)) * 0.15})`
    else if (intense) sc = 'rgba(255,150,0,0.08)'
    ctx.strokeStyle = sc; ctx.stroke()
  }

  private drawCRT() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height
    ctx.save()
    ctx.fillStyle = 'rgba(18,16,16,0.03)'
    for (let i = 0; i < h; i += 4) ctx.fillRect(0, i, w, 1)
    if (Math.random() > 0.995) { ctx.fillStyle = 'rgba(255,255,255,0.01)'; ctx.fillRect(0, 0, w, h) }
    ctx.globalAlpha = 0.01
    for (let i = 0; i < 100; i++) { ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'; ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1) }
    ctx.restore()
  }

  private drawChromatic() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height; const o = this.chromaticOffset
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.2
    const bands = 5
    for (let i = 0; i < bands; i++) {
      const by = i * h / bands; const j = (Math.random() - 0.5) * o * 0.5
      ctx.fillStyle = '#ff0000'; ctx.fillRect(-o + j, by, w, h / bands)
      ctx.fillStyle = '#00ffff'; ctx.fillRect(o - j, by, w, h / bands)
    }
    ctx.restore()
  }

  private drawScanlines() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height
    ctx.save(); ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = 'rgba(0,0,0,0.03)'
    for (let i = 0; i < h; i += 5) ctx.fillRect(0, i, w, 1)
    const y = (this.engine.globalTime * 100) % h
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(0, y, w, 50)
    ctx.restore()
  }

  private drawGlitchOverlay() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height
    const isBoss = this.engine.waveManager.isBossWave
    const pf = Math.max(1, this.engine.performanceFactor)
    const intensity = (isBoss ? 0.6 : Math.min(0.3, (this.engine.state.wave - 15) * 0.01)) * (pf * 0.5 + 0.5)
    if (Math.random() < intensity) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 * Math.random()})`; ctx.fillRect(0, Math.random() * h, w, Math.random() * 5)
    }
    if (isBoss && Math.random() < 0.1 * pf) { ctx.fillStyle = 'rgba(255,0,0,0.05)'; ctx.fillRect(0, Math.random() * h, w, 2) }
    if (Math.random() < intensity * 0.5) {
      const sy = Math.random() * h; const sh = Math.random() * 20 + 5; const z = (Math.random() - 0.5) * 10 * pf
      ctx.save(); ctx.beginPath(); ctx.rect(0, sy, w, sh); ctx.clip(); ctx.translate(z, 0)
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,0,255,0.08)' : 'rgba(0,255,255,0.08)'
      ctx.fillRect(0, sy, w, sh); ctx.restore()
    }
  }

  private drawBossIntro() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height
    const t = this.engine.globalTime; const timer = this.engine.waveManager.bossIntroTimer
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, (4 - timer) * 0.5)})`; ctx.fillRect(0, 0, w, h)
    if (Math.random() < 0.1) { ctx.fillStyle = 'rgba(255,0,0,0.1)'; ctx.fillRect(0, Math.random() * h, w, 10) }
    ctx.strokeStyle = 'rgba(255,0,0,0.2)'; ctx.lineWidth = 1
    for (let i = 0; i < h; i += 4) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }
    const logs = [`[ ALERT ] : PROJECT NEXUS INTEGRITY BREACHED`,`[ LOG ]   : ANOMALY CLASS 'OVERSEER' DETECTED IN SECTOR 7`,`[ LOG ]   : KINETIC SUPPRESSION PROTOCOLS: [ INACTIVE ]`,`[ ERROR ] : SYSTEM CORRUPTION AT 84.3%`,`[ LOG ]   : INITIATING EMERGENCY DATA PURGE...`,`[ ALERT ] : SENTIENCE DETECTED WITHIN THE CORE`]
    const dc = Math.floor((4 - timer) * 4)
    for (let i = 0; i < Math.min(logs.length, dc); i++) { ctx.fillStyle = `rgba(255,50,50,${Math.random() > 0.1 ? 1 : 0.5})`; ctx.font = '800 12px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(logs[i], 40, h - 100 - (i * 20)) }
    if (timer < 3) {
      const sc = 1 + Math.sin(t * 15) * 0.05; ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(sc, sc)
      ctx.font = '900 64px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
      const off = Math.sin(t * 40) * 4
      ctx.fillStyle = 'rgba(255,0,255,0.5)'; ctx.fillText('CORE BREACH', off, 0)
      ctx.fillStyle = 'rgba(0,255,255,0.5)'; ctx.fillText('CORE BREACH', -off, 0)
      ctx.fillStyle = '#fff'; ctx.fillText('CORE BREACH', 0, 0)
      ctx.font = 'bold 16px "JetBrains Mono", monospace'; ctx.fillStyle = '#f00'; ctx.fillText('SYSTEM OVERRIDE IN PROGRESS', 0, 50)
      ctx.strokeStyle = '#f00'; ctx.strokeRect(-150, 70, 300, 4); ctx.fillStyle = '#f00'; ctx.fillRect(-150, 70, 300 * (1 - timer / 3), 4)
      ctx.restore()
    }
  }

  private drawBossWarning() {
    const ctx = this.engine.ctx; const w = this.engine.width; const h = this.engine.height
    const a = Math.abs(Math.sin(this.engine.globalTime * 8))
    ctx.fillStyle = `rgba(255,0,0,${0.1 * a})`; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = `rgba(255,0,0,${a})`; ctx.font = '900 42px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
    ctx.fillText('! WARNING: CRITICAL SYSTEM THREAT !', w / 2, h / 2 - 100)
    ctx.font = 'bold 14px "JetBrains Mono", monospace'; ctx.fillText('OVERSEER CLASS ANOMALY DETECTED', w / 2, h / 2 - 60)
  }

  private drawBase() {
    const ctx = this.engine.ctx; const cx = this.engine.coreX; const cy = this.engine.coreY
    ctx.save(); ctx.translate(cx, cy)

    if (this.engine.shieldTimer > 0) {
      const shield = assetManager.getShieldSprite()
      if (shield) {
        ctx.drawImage(shield, -shield.width / 2, -shield.height / 2)
      }
    }

    const core = assetManager.getCoreSprite()
    if (core) {
      ctx.drawImage(core, -core.width / 2, -core.height / 2)
    }

    ctx.fillStyle = '#050505'
    ctx.font = '800 14px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.ceil(this.engine.state.health)}`, 0, 1)
    ctx.restore()
    this.impactFlash = Math.max(0, this.impactFlash - 0.05)
  }

  private drawBug(bug: Bug) {
    const ctx = this.engine.ctx
    const sprite = assetManager.getBugSprite(bug.type, bug.walkCycle, bug.hitTimer > 0)

    ctx.save()
    ctx.translate(bug.x, bug.y)
    ctx.rotate(bug.rotation)

    if (bug.type === 'ghost') {
      const f = Math.sin(this.engine.globalTime * 20) * 0.5 + 0.5
      if (f < 0.3) { ctx.restore(); return }
      ctx.globalAlpha = 0.4 + f * 0.4
    }

    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
    ctx.restore()

    if (bug.maxHp > 1 && !bug.isBoss) {
      const bw = Math.max(30, bug.size); const bh = 2.5
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bug.x - bw / 2, bug.y - bug.size - 12, bw, bh)
      const r = bug.hp / bug.maxHp
      ctx.fillStyle = bug.color; ctx.fillRect(bug.x - bw / 2, bug.y - bug.size - 12, bw * r, bh)
      if (r < 0.25 && Math.sin(this.engine.globalTime * 15) > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(bug.x - bw / 2, bug.y - bug.size - 12, bw * r, bh) }
    }
  }

  private drawPowerup(p: Powerup) {
    const ctx = this.engine.ctx
    const sprite = assetManager.getPowerupSprite(p.type)
    ctx.save()
    ctx.translate(p.x, p.y)
    if (p.life < 2 && Math.floor(this.engine.globalTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.3
    }
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
    ctx.restore()
  }

  private drawResource(r: { x: number; y: number; type: string; color: string; active: boolean; life: number; size: number }) {
    const ctx = this.engine.ctx
    ctx.save(); ctx.translate(r.x, r.y)
    const a = Math.min(1, r.life / 5)
    ctx.globalAlpha = a
    ctx.fillStyle = r.color
    ctx.shadowColor = r.color; ctx.shadowBlur = 10
    ctx.beginPath()
    if (r.type === 'neural_core') {
      ctx.arc(0, 0, r.size + 3, 0, Math.PI * 2)
    } else if (r.type === 'flux') {
      for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2; i === 0 ? ctx.moveTo(Math.cos(ang) * r.size, Math.sin(ang) * r.size) : ctx.lineTo(Math.cos(ang) * r.size, Math.sin(ang) * r.size) }
      ctx.closePath()
    } else {
      ctx.arc(0, 0, r.size, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.restore()
  }

  private drawSplatter(s: Splatter) {
    const ctx = this.engine.ctx
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rotation)
    const a = Math.min(0.6, (s.life / s.maxLife) * 1.5)
    ctx.globalAlpha = a; ctx.fillStyle = s.color
    if (Math.random() > 0.95) ctx.translate((Math.random() - 0.5) * 5, 0)
    ctx.beginPath(); ctx.arc(0, 0, s.size, 0, Math.PI * 2); ctx.fill()
    s.drops.forEach((d, i) => {
      ctx.beginPath()
      i % 3 === 0 ? ctx.rect(d.x - d.size, d.y - d.size, d.size * 2, d.size * 2) : ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  private drawParticle(p: Particle) {
    const ctx = this.engine.ctx; const a = p.life / p.maxLife
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation)
    ctx.globalAlpha = a; ctx.fillStyle = p.color
    if (!this.engine.isMobile) { ctx.shadowColor = p.color; ctx.shadowBlur = 10 }
    ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size / 3, -p.size / 3); ctx.lineTo(p.size, 0)
    ctx.lineTo(p.size / 3, p.size / 3); ctx.lineTo(0, p.size); ctx.lineTo(-p.size / 3, p.size / 3)
    ctx.lineTo(-p.size, 0); ctx.lineTo(-p.size / 3, -p.size / 3); ctx.closePath(); ctx.fill()
    ctx.restore()
  }

  private drawShockwave(sw: Shockwave) {
    const ctx = this.engine.ctx; const a = sw.life / sw.maxLife
    ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
    ctx.strokeStyle = sw.color; ctx.lineWidth = 10 * a
    if (!this.engine.isMobile) { ctx.shadowColor = sw.color; ctx.shadowBlur = 20 }
    ctx.stroke(); ctx.restore()
  }

  private drawLaser(l: Laser) {
    const ctx = this.engine.ctx; const a = l.life / l.maxLife
    ctx.save(); ctx.globalAlpha = a
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2)
    ctx.strokeStyle = l.color; ctx.lineWidth = l.width * 5 * a; ctx.lineCap = 'round'
    if (!this.engine.isMobile) { ctx.shadowColor = l.color; ctx.shadowBlur = 15 }
    ctx.stroke(); ctx.restore()
  }

  private drawMuzzleFlash(mf: MuzzleFlash) {
    const ctx = this.engine.ctx; const a = mf.life / mf.maxLife
    ctx.save(); ctx.translate(mf.x, mf.y); ctx.globalAlpha = a
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, mf.size * a, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  private drawHazard(h: Hazard) {
    const ctx = this.engine.ctx
    ctx.save(); ctx.translate(h.x, h.y)
    if (h.type === 'barrage') {
      const pu = Math.sin(this.engine.globalTime * 15) * 5; const progress = h.timer / h.duration
      ctx.strokeStyle = `rgba(255,50,0,${0.5 + Math.sin(this.engine.globalTime * 20) * 0.3})`; ctx.lineWidth = 2
      for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + this.engine.globalTime; ctx.beginPath(); ctx.arc(0, 0, h.radius + pu, a, a + Math.PI / 4); ctx.stroke() }
      ctx.beginPath(); ctx.arc(0, 0, h.radius * progress, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,0,0,${0.1 + progress * 0.2})`; ctx.fill()
      ctx.fillStyle = '#ff0000'; ctx.font = '800 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
      ctx.fillText('! DANGER !', 0, h.radius + 20); ctx.fillText(`${Math.ceil((h.duration - h.timer) * 10) / 10}s`, 0, -h.radius - 10)
    } else if (h.type === 'web') {
      const a = Math.min(1, (h.duration - h.timer) * 0.5)
      ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1
      for (let j = 1; j <= 3; j++) {
        const r = h.radius * (j / 3); ctx.beginPath()
        for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) }
        ctx.closePath(); ctx.stroke()
      }
      for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * h.radius, Math.sin(ang) * h.radius); ctx.stroke() }
    }
    ctx.restore()
  }

  private drawBossHealthBar(w: number, _h: number) {
    const ctx = this.engine.ctx
    const boss = this.engine.bugs.find(b => b.type === 'boss')
    if (!boss) return
    const bw = 500; const bh = 6; const bx = (w - bw) / 2; const by = 100
    const glitch = Math.random() > 0.9 ? (Math.random() > 0.5 ? '_' : '!') : ''
    ctx.fillStyle = '#ff3333'; ctx.font = 'bold 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
    ctx.fillText(`ANOMALY DETECTED: OVERSEER_TYPE_V${Math.floor(this.engine.state.wave / 10)}${glitch}`, w / 2, by - 15)
    ctx.fillStyle = 'rgba(255,0,0,0.1)'; ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = '#ff0000'; ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), bh)
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(bx - 10, by - 5); ctx.lineTo(bx - 10, by + bh + 5); ctx.moveTo(bx + bw + 10, by - 5); ctx.lineTo(bx + bw + 10, by + bh + 5); ctx.stroke()
    const barrageCharge = boss.phase && boss.phase >= 2 && boss.abilityTimer ? Math.min(1, boss.abilityTimer / 8) : 0
    if (barrageCharge > 0.7) {
      const wa = (barrageCharge - 0.7) / 0.3
      ctx.save()
      ctx.strokeStyle = `rgba(255,0,0,${wa * (Math.sin(this.engine.globalTime * 20) * 0.5 + 0.5)})`
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w / 2, by + 10, 95, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = '#f00'; ctx.font = '900 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
      ctx.fillText('BARRAGE_IMMINENT', w / 2, by - 130)
      ctx.restore()
    }
  }
}
