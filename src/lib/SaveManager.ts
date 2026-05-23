interface GameSaveData {
  highScore: number
  totalBugsKilled: number
  totalPlayTime: number
  soundEnabled: boolean
  musicEnabled: boolean
  lastPlayed: string
  gamesPlayed: number
  prestigeLevel: number
  highestWave: number
  totalCrystalsEarned: number
  comboMaster: boolean
  shieldStart: boolean
}

const SAVE_KEY = 'bugsmasher_save'
const DEFAULT_SAVE: GameSaveData = {
  highScore: 0, totalBugsKilled: 0, totalPlayTime: 0,
  soundEnabled: true, musicEnabled: true, lastPlayed: '',
  gamesPlayed: 0, prestigeLevel: 0, highestWave: 0,
  totalCrystalsEarned: 0, comboMaster: false, shieldStart: false,
}

export class SaveManager {
  private data: GameSaveData

  constructor() { this.data = this.load() }

  private load(): GameSaveData {
    try {
      const stored = localStorage.getItem(SAVE_KEY)
      if (stored) return { ...DEFAULT_SAVE, ...JSON.parse(stored) }
    } catch { /* ignore corrupt data */ }
    return { ...DEFAULT_SAVE }
  }

  private persist(): void {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)) } catch { /* storage full */ }
  }

  getHighScore(): number { return this.data.highScore }
  getTotalBugsKilled(): number { return this.data.totalBugsKilled }
  getTotalPlayTime(): number { return this.data.totalPlayTime }
  isSoundEnabled(): boolean { return this.data.soundEnabled }
  isMusicEnabled(): boolean { return this.data.musicEnabled }
  getGamesPlayed(): number { return this.data.gamesPlayed }
  getPrestigeLevel(): number { return this.data.prestigeLevel }
  getHighestWave(): number { return this.data.highestWave }
  getTotalCrystalsEarned(): number { return this.data.totalCrystalsEarned }

  updateHighScore(score: number): boolean {
    if (score > this.data.highScore) { this.data.highScore = score; this.persist(); return true }
    return false
  }

  addBugsKilled(count: number): void { this.data.totalBugsKilled += count; this.persist() }
  addCrystalsEarned(count: number): void { this.data.totalCrystalsEarned += count; this.persist() }

  addPlayTime(seconds: number): void {
    this.data.totalPlayTime += seconds; this.persist()
  }

  recordGamePlayed(): void {
    this.data.gamesPlayed++; this.data.lastPlayed = new Date().toISOString(); this.persist()
  }

  setHighestWave(wave: number): void {
    if (wave > this.data.highestWave) { this.data.highestWave = wave; this.persist() }
  }

  setSoundEnabled(enabled: boolean): void { this.data.soundEnabled = enabled; this.persist() }
  setMusicEnabled(enabled: boolean): void { this.data.musicEnabled = enabled; this.persist() }

  getFormattedStats(): string {
    const h = Math.floor(this.data.totalPlayTime / 3600)
    const m = Math.floor((this.data.totalPlayTime % 3600) / 60)
    return `Score: ${this.data.highScore.toLocaleString()} | Kills: ${this.data.totalBugsKilled.toLocaleString()} | Time: ${h}h ${m}m | Games: ${this.data.gamesPlayed}`
  }

  reset(): void { this.data = { ...DEFAULT_SAVE }; this.persist() }
}

export const saveManager = new SaveManager()
