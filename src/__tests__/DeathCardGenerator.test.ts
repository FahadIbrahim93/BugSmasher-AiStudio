// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { generateDeathCardBlob, generateDeathCardDataUrl } from '../lib/DeathCardGenerator'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: Record<string, any> = {
    _fillStyle: '',
    _font: '',
    _textAlign: '',
    _globalAlpha: 1,
    _operations: [] as string[],
    get fillStyle() {
      return this._fillStyle
    },
    set fillStyle(v: string) {
      this._fillStyle = v
    },
    get font() {
      return this._font
    },
    set font(v: string) {
      this._font = v
    },
    get textAlign() {
      return this._textAlign
    },
    set textAlign(v: string) {
      this._textAlign = v
    },
    get globalAlpha() {
      return this._globalAlpha
    },
    set globalAlpha(v: number) {
      this._globalAlpha = v
    },
    fillRect: () => {},
    fillText: () => {},
  }

  HTMLCanvasElement.prototype.getContext = function () {
    return ctx as unknown as CanvasRenderingContext2D
  } as unknown as typeof HTMLCanvasElement.prototype.getContext

  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
    const blob = new Blob(['fake-png-data'], { type: 'image/png' })
    cb(blob)
  } as unknown as typeof HTMLCanvasElement.prototype.toBlob
})

describe('DeathCardGenerator', () => {
  const mockData = {
    score: 50000,
    wave: 25,
    bugsKilled: 1500,
    combo: 15,
    prestigeLevel: 2,
    biome: 'neon_core',
    highestWave: 30,
  }

  it('generates a PNG blob', async () => {
    const blob = await generateDeathCardBlob(mockData)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('generates a data URL', async () => {
    const url = await generateDeathCardDataUrl(mockData)
    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
  })

  it('handles different biome palettes', async () => {
    const blobNeon = await generateDeathCardBlob({ ...mockData, biome: 'neon_core' })
    const blobVoid = await generateDeathCardBlob({ ...mockData, biome: 'void_abyss' })
    expect(blobNeon.size).toBeGreaterThan(0)
    expect(blobVoid.size).toBeGreaterThan(0)
  })

  it('handles zero score edge case', async () => {
    const blob = await generateDeathCardBlob({ ...mockData, score: 0 })
    expect(blob.size).toBeGreaterThan(0)
  })

  it('handles unknown biome gracefully', async () => {
    const blob = await generateDeathCardBlob({ ...mockData, biome: 'invalid_biome' })
    expect(blob.size).toBeGreaterThan(0)
  })
})
