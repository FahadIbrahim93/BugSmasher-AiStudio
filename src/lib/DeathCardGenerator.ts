export interface DeathCardData {
  score: number
  wave: number
  bugsKilled: number
  combo: number
  prestigeLevel: number
  biome: string
  highestWave: number
}

const BIOME_PALETTES: Record<string, { bg: string; accent: string; text: string }> = {
  neon_core: { bg: '#0a0a0a', accent: '#39ff14', text: '#ffffff' },
  quantum_void: { bg: '#0a0015', accent: '#bb00ff', text: '#e0e0ff' },
  ember_depths: { bg: '#150500', accent: '#ff4400', text: '#ffccaa' },
  frostbyte: { bg: '#050a15', accent: '#00ccff', text: '#ffffff' },
  void_abyss: { bg: '#000005', accent: '#ffffff', text: '#aaaacc' },
}

export function generateDeathCardBlob(data: DeathCardData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')!

  const palette = BIOME_PALETTES[data.biome] ?? BIOME_PALETTES.neon_core

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, 1200, 630)

  ctx.fillStyle = 'rgba(255,255,255,0.015)'
  for (let y = 0; y < 630; y += 4) ctx.fillRect(0, y, 1200, 2)

  ctx.fillStyle = palette.accent
  ctx.fillRect(0, 0, 1200, 3)
  ctx.fillRect(0, 627, 1200, 3)

  ctx.fillStyle = palette.accent
  ctx.font = 'bold 14px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('BUGSMASHER // CONNECTION LOST', 600, 50)

  ctx.fillStyle = palette.text
  ctx.font = 'bold 96px "JetBrains Mono", monospace'
  ctx.fillText(data.score.toLocaleString(), 600, 210)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.fillText('FINAL SCORE', 600, 240)

  ctx.textAlign = 'left'
  const stats = [
    { label: 'WAVE REACHED', value: String(data.wave) },
    { label: 'BUGS SMASHED', value: data.bugsKilled.toLocaleString() },
    { label: 'HIGHEST COMBO', value: `${data.combo}x` },
    { label: 'HIGHEST WAVE', value: String(data.highestWave) },
  ]
  const startX = 200
  const startY = 320
  const colWidth = 200
  ctx.font = '10px "JetBrains Mono", monospace'
  stats.forEach((s, i) => {
    const x = startX + i * colWidth
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText(s.label, x, startY)
    ctx.fillStyle = palette.text
    ctx.font = 'bold 24px "JetBrains Mono", monospace'
    ctx.fillText(s.value, x, startY + 35)
    ctx.font = '10px "JetBrains Mono", monospace'
  })

  ctx.fillStyle = palette.accent
  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.3
  ctx.fillText(`BIOME: ${data.biome.toUpperCase()} | PRESTIGE: ${data.prestigeLevel}`, 600, 580)
  ctx.globalAlpha = 1

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}

export async function shareDeathCard(data: DeathCardData): Promise<void> {
  const blob = await generateDeathCardBlob(data)
  const file = new File([blob], 'bugsmasher-death.png', { type: 'image/png' })

  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({ title: 'BugSmasher Death Card', files: [file] })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'bugsmasher-death.png'; a.click()
    URL.revokeObjectURL(url)
  }
}

export async function generateDeathCardDataUrl(data: DeathCardData): Promise<string> {
  const blob = await generateDeathCardBlob(data)
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}
