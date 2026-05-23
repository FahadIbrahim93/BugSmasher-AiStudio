import { GameConfig } from './GameConfig'

export class AssetManager {
  private bugSprites: Record<string, HTMLCanvasElement[]> = {}
  private bugFlashSprites: Record<string, HTMLCanvasElement[]> = {}
  private powerupSprites: Record<string, HTMLCanvasElement> = {}
  private coreSprite: HTMLCanvasElement | null = null
  private shieldSprite: HTMLCanvasElement | null = null
  private initialized = false

  init() {
    if (this.initialized) return
    this.preRenderBugs()
    this.preRenderPowerups()
    this.preRenderCore()
    this.initialized = true
  }

  private preRenderBugs() {
    const bugTypes = Object.keys(GameConfig.bugs)
    bugTypes.forEach(type => {
      const conf = GameConfig.bugs[type as keyof typeof GameConfig.bugs]
      if (!conf) return
      this.bugSprites[type] = []
      this.bugFlashSprites[type] = []

      const frames = 4
      const size = conf.size * 2 + 20

      for (let f = 0; f < frames; f++) {
        const walkCycle = (f / frames) * Math.PI * 2
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        this.drawProceduralBug(ctx, size / 2, size / 2, type, conf.color, conf.size, walkCycle, false)
        this.bugSprites[type].push(canvas)

        const flashCanvas = document.createElement('canvas')
        flashCanvas.width = size; flashCanvas.height = size
        const flashCtx = flashCanvas.getContext('2d')!
        this.drawProceduralBug(flashCtx, size / 2, size / 2, type, '#ffffff', conf.size, walkCycle, true)
        this.bugFlashSprites[type].push(flashCanvas)
      }
    })
  }

  private preRenderPowerups() {
    const types = GameConfig.powerups.types
    types.forEach(p => {
      const canvas = document.createElement('canvas')
      const size = 40
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!

      ctx.save()
      ctx.translate(size / 2, size / 2)
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2
      ctx.fillStyle = 'rgba(5,5,5,0.95)'

      ctx.beginPath()
      ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.closePath()
      ctx.fill(); ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(p.icon, 0, 1)
      ctx.restore()

      this.powerupSprites[p.type] = canvas
    })
  }

  private preRenderCore() {
    const canvas = document.createElement('canvas')
    const size = 100
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')!

    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 15
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
    this.coreSprite = canvas

    const sCanvas = document.createElement('canvas')
    sCanvas.width = 150; sCanvas.height = 150
    const sCtx = sCanvas.getContext('2d')!
    sCtx.save()
    sCtx.translate(75, 75)
    sCtx.shadowColor = '#00ccff'
    sCtx.shadowBlur = 20
    sCtx.strokeStyle = 'rgba(0,204,255,0.8)'
    sCtx.lineWidth = 2
    sCtx.fillStyle = 'rgba(0,204,255,0.05)'
    sCtx.beginPath(); sCtx.arc(0, 0, 60, 0, Math.PI * 2); sCtx.fill(); sCtx.stroke()
    sCtx.restore()
    this.shieldSprite = sCanvas
  }

  private drawProceduralBug(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    type: string,
    color: string,
    baseSize: number,
    walkCycle: number,
    isFlash: boolean
  ) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.shadowColor = color
    ctx.shadowBlur = isFlash ? 5 : 15
    ctx.lineWidth = 2
    ctx.strokeStyle = color

    const legSwing = Math.sin(walkCycle) * 0.8
    for (let i = 0; i < 3; i++) {
      const legY = -10 + i * 15
      const swing = i % 2 === 0 ? legSwing : -legSwing
      this.drawLeg(ctx, -10, legY, -1, swing)
      this.drawLeg(ctx, 10, legY, 1, -swing)
    }

    if (type === 'boss') {
      ctx.fillStyle = isFlash ? '#ffffff' : 'rgba(25, 5, 10, 0.95)'
      ctx.beginPath(); ctx.arc(0, 10, baseSize * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(0, -10, baseSize * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#050505'
      ctx.beginPath(); ctx.arc(-8, -12, 3, 0, Math.PI * 2); ctx.arc(8, -12, 3, 0, Math.PI * 2); ctx.fill()
    } else {
      const grad = ctx.createRadialGradient(-3, -5, 0, 0, 0, baseSize * 1.5)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.2, color)
      grad.addColorStop(1, '#050505')
      ctx.fillStyle = isFlash ? '#ffffff' : grad

      ctx.beginPath(); ctx.ellipse(0, 15, baseSize * 1.2, baseSize * 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(0, -5, baseSize, baseSize * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(0, -22, baseSize * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

      ctx.fillStyle = '#050505'
      ctx.beginPath(); ctx.arc(-4, -18, 2, 0, Math.PI * 2); ctx.arc(4, -18, 2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  private drawLeg(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, swing: number) {
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + side * 15, y + swing * 15, x + side * 25, y + swing * 5)
    ctx.stroke()
  }

  getBugSprite(type: string, walkCycle: number, isHit: boolean): HTMLCanvasElement {
    const frames = isHit ? this.bugFlashSprites[type] : this.bugSprites[type]
    if (!frames || frames.length === 0) {
      const fallback = document.createElement('canvas')
      fallback.width = 1; fallback.height = 1
      return fallback
    }
    const idx = Math.floor((Math.abs(walkCycle) % (Math.PI * 2)) / (Math.PI * 2) * frames.length) % frames.length
    return frames[idx]
  }

  getPowerupSprite(type: string): HTMLCanvasElement {
    return this.powerupSprites[type] || document.createElement('canvas')
  }

  getCoreSprite(): HTMLCanvasElement | null {
    return this.coreSprite
  }

  getShieldSprite(): HTMLCanvasElement | null {
    return this.shieldSprite
  }
}

export const assetManager = new AssetManager()
