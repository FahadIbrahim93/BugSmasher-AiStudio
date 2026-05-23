export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: { type: 'combo' | 'kills' | 'score' | 'waves' | 'bugs_per_click' | 'total_crystals' | 'prestige'; target: number }
  xpReward: number
  unlocked: boolean
}

const STORAGE_KEY = 'bugsmasher_achievements'

export class AchievementSystem {
  achievements: Achievement[] = []
  private unlockedCache = new Set<string>()
  private unlockedDuringRun: string[] = []

  constructor() { this.achievements = this.defineAchievements(); this.load() }

  private defineAchievements(): Achievement[] {
    return [
      { id: 'first_kill', name: 'First Blood', description: 'Smash your first bug', icon: '🎯', requirement: { type: 'kills', target: 1 }, xpReward: 10, unlocked: false },
      { id: 'kills_10', name: 'Bug Hunter', description: 'Smash 10 bugs', icon: '🔨', requirement: { type: 'kills', target: 10 }, xpReward: 25, unlocked: false },
      { id: 'kills_100', name: 'Pest Controller', description: 'Smash 100 bugs', icon: '💪', requirement: { type: 'kills', target: 100 }, xpReward: 50, unlocked: false },
      { id: 'kills_1000', name: 'Bug Genocide', description: 'Smash 1,000 bugs', icon: '☠️', requirement: { type: 'kills', target: 1000 }, xpReward: 150, unlocked: false },
      { id: 'kills_10000', name: 'Extinction Level', description: 'Smash 10,000 bugs', icon: '💀', requirement: { type: 'kills', target: 10000 }, xpReward: 500, unlocked: false },
      { id: 'combo_5', name: 'Combo Novice', description: 'Reach a 5x combo', icon: '🔥', requirement: { type: 'combo', target: 5 }, xpReward: 15, unlocked: false },
      { id: 'combo_20', name: 'Combo Master', description: 'Reach a 20x combo', icon: '🔥🔥', requirement: { type: 'combo', target: 20 }, xpReward: 50, unlocked: false },
      { id: 'combo_50', name: 'Combo God', description: 'Reach a 50x combo', icon: '🔥💀', requirement: { type: 'combo', target: 50 }, xpReward: 200, unlocked: false },
      { id: 'wave_5', name: 'Wave Rider', description: 'Survive 5 waves', icon: '🌊', requirement: { type: 'waves', target: 5 }, xpReward: 20, unlocked: false },
      { id: 'wave_10', name: 'Deep Diver', description: 'Survive 10 waves', icon: '🌊🌊', requirement: { type: 'waves', target: 10 }, xpReward: 40, unlocked: false },
      { id: 'wave_25', name: 'Abyss Walker', description: 'Survive 25 waves', icon: '🕳️', requirement: { type: 'waves', target: 25 }, xpReward: 100, unlocked: false },
      { id: 'wave_50', name: 'Void Conqueror', description: 'Survive 50 waves', icon: '👑', requirement: { type: 'waves', target: 50 }, xpReward: 500, unlocked: false },
      { id: 'score_1000', name: 'Thousand Club', description: 'Score 1,000 points', icon: '🏆', requirement: { type: 'score', target: 1000 }, xpReward: 20, unlocked: false },
      { id: 'score_50000', name: 'High Roller', description: 'Score 50,000 points', icon: '🏆🏆', requirement: { type: 'score', target: 50000 }, xpReward: 75, unlocked: false },
      { id: 'score_1000000', name: 'Millionaire', description: 'Score 1,000,000 points', icon: '🥇', requirement: { type: 'score', target: 1000000 }, xpReward: 1000, unlocked: false },
      { id: 'bugs_per_click_3', name: 'Triple Threat', description: 'Smash 3 bugs in one click', icon: '⚡', requirement: { type: 'bugs_per_click', target: 3 }, xpReward: 30, unlocked: false },
      { id: 'bugs_per_click_10', name: 'Bug Splatter', description: 'Smash 10 bugs in one click', icon: '💥', requirement: { type: 'bugs_per_click', target: 10 }, xpReward: 100, unlocked: false },
      { id: 'crystals_100', name: 'Crystal Collector', description: 'Earn 100 crystals total', icon: '💎', requirement: { type: 'total_crystals', target: 100 }, xpReward: 30, unlocked: false },
      { id: 'crystals_5000', name: 'Crystal Tycoon', description: 'Earn 5,000 crystals total', icon: '💎💎', requirement: { type: 'total_crystals', target: 5000 }, xpReward: 200, unlocked: false },
      { id: 'crystals_50000', name: 'Crystal Hoarder', description: 'Earn 50,000 crystals total', icon: '👑💎', requirement: { type: 'total_crystals', target: 50000 }, xpReward: 1000, unlocked: false },
      { id: 'prestige_1', name: 'New Game+', description: 'Prestige once', icon: '🔄', requirement: { type: 'prestige', target: 1 }, xpReward: 100, unlocked: false },
      { id: 'prestige_5', name: 'Phoenix', description: 'Prestige 5 times', icon: '🔥🔄', requirement: { type: 'prestige', target: 5 }, xpReward: 500, unlocked: false },
    ]
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const unlockedIds: string[] = JSON.parse(raw)
        unlockedIds.forEach(id => this.unlockedCache.add(id))
      }
    } catch { /* ignore */ }
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlockedCache])) } catch { /* ignore */ }
  }

  isUnlocked(id: string): boolean { return this.unlockedCache.has(id) }

  checkUnlocks(params: { kills: number; combo: number; wave: number; score: number; bugsPerClick: number; totalCrystals: number; prestigeLevel: number }): Achievement[] {
    const newlyUnlocked: Achievement[] = []
    for (const a of this.achievements) {
      if (this.unlockedCache.has(a.id)) continue
      let met = false
      switch (a.requirement.type) {
        case 'kills': met = params.kills >= a.requirement.target; break
        case 'combo': met = params.combo >= a.requirement.target; break
        case 'waves': met = params.wave >= a.requirement.target; break
        case 'score': met = params.score >= a.requirement.target; break
        case 'bugs_per_click': met = params.bugsPerClick >= a.requirement.target; break
        case 'total_crystals': met = params.totalCrystals >= a.requirement.target; break
        case 'prestige': met = params.prestigeLevel >= a.requirement.target; break
      }
      if (met) { this.unlockedCache.add(a.id); a.unlocked = true; newlyUnlocked.push(a); this.unlockedDuringRun.push(a.id) }
    }
    if (newlyUnlocked.length > 0) this.persist()
    return newlyUnlocked
  }

  getFreshlyUnlocked(): string[] { return this.unlockedDuringRun }
  clearFreshlyUnlocked(): void { this.unlockedDuringRun = [] }

  getTotalXP(): number {
    let total = 0
    for (const a of this.achievements) if (this.unlockedCache.has(a.id)) total += a.xpReward
    return total
  }

  getUnlockCount(): number { return this.unlockedCache.size }
  getTotalCount(): number { return this.achievements.length }
}

export const achievementSystem = new AchievementSystem()
