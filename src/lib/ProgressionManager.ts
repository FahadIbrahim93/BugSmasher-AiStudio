import { ResourceType, SKILLS } from './ResourceTypes'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'

export interface ProgressionData {
  inventory: Record<ResourceType, number>
  skills: Record<string, number>
  consumables: Record<string, number>
  prestigeLevel: number
  prestigePoints: number
}

function createInitialData(): ProgressionData {
  return {
    inventory: { scrap: 0, plasma: 0, alloy: 0, flux: 0, neural_core: 0, crystals: 0 },
    skills: {},
    consumables: { repair_kit: 0, emp_generator: 0, overdrive_chip: 0 },
    prestigeLevel: 0,
    prestigePoints: 0,
  }
}

const KNOWN_SKILL_IDS = new Set(SKILLS.map(s => s.id))
const KNOWN_CONSUMABLE_IDS = new Set(['repair_kit', 'emp_generator', 'overdrive_chip'])

function isValidProgressionData(raw: unknown): raw is ProgressionData {
  if (!raw || typeof raw !== 'object') return false
  const d = raw as Record<string, unknown>
  if (typeof d.inventory !== 'object' || d.inventory === null) return false
  if (typeof d.skills !== 'object' || d.skills === null) return false
  if (typeof d.consumables !== 'object' || d.consumables === null) return false
  if (typeof d.prestigeLevel !== 'number' || typeof d.prestigePoints !== 'number') return false
  const inv = d.inventory as Record<string, unknown>
  const validResources = ['scrap', 'plasma', 'alloy', 'flux', 'neural_core', 'crystals']
  for (const key of Object.keys(inv)) {
    if (!validResources.includes(key)) return false
    if (typeof inv[key] !== 'number' || inv[key] < 0) return false
  }
  const skills = d.skills as Record<string, unknown>
  for (const key of Object.keys(skills)) {
    if (!KNOWN_SKILL_IDS.has(key)) return false
    if (typeof skills[key] !== 'number' || skills[key] < 0) return false
  }
  const consumables = d.consumables as Record<string, unknown>
  for (const key of Object.keys(consumables)) {
    if (!KNOWN_CONSUMABLE_IDS.has(key)) return false
    if (typeof consumables[key] !== 'number' || consumables[key] < 0) return false
  }
  return true
}

function sanitize(data: Partial<ProgressionData>): ProgressionData {
  const base = createInitialData()
  return {
    ...base,
    ...data,
    inventory: { ...base.inventory, ...data.inventory },
    skills: { ...base.skills, ...data.skills },
    consumables: { ...base.consumables, ...data.consumables },
  }
}

export class ProgressionManager {
  private data: ProgressionData
  private listeners: Set<() => void> = new Set()
  private isSyncing = false
  private snapshotUnsub: Unsubscribe | null = null
  private authUnsub: Unsubscribe | null = null

  constructor() {
    this.data = this.loadLocal()
  }

  private loadLocal(): ProgressionData {
    try {
      const saved = localStorage.getItem('nexus_progression')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (isValidProgressionData(parsed)) return sanitize(parsed)
        console.warn('[ProgressionManager] Corrupted localStorage data, resetting')
      }
    } catch (e) {
      console.warn('[ProgressionManager] Failed to load from localStorage:', e)
    }
    return createInitialData()
  }

  initCloudSync() {
    if (this.authUnsub) {
      this.authUnsub()
      this.authUnsub = null
    }
    this.authUnsub = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'private', 'progression')
          const snap = await getDoc(docRef)
          if (snap.exists()) {
            const raw = snap.data()
            if (isValidProgressionData(raw)) {
              this.data = sanitize(raw)
              this.saveLocal()
              this.notify()
            } else {
              console.warn('[ProgressionManager] Invalid cloud data, overwriting with local')
              await setDoc(docRef, this.data)
            }
          } else {
            await setDoc(docRef, this.data)
          }
          if (this.snapshotUnsub) this.snapshotUnsub()
          this.snapshotUnsub = onSnapshot(
            docRef,
            doc => {
              if (doc.exists() && !this.isSyncing) {
                const raw = doc.data()
                if (isValidProgressionData(raw)) {
                  this.data = sanitize(raw)
                  this.saveLocal()
                  this.notify()
                }
              }
            },
            err => {
              console.warn('[ProgressionManager] Firestore snapshot error:', err)
            },
          )
        } catch (e) {
          console.warn('[ProgressionManager] Failed to sync from cloud:', e)
        }
      }
    })
  }

  destroy() {
    if (this.authUnsub) this.authUnsub()
    if (this.snapshotUnsub) this.snapshotUnsub()
    this.listeners.clear()
  }

  getData(): ProgressionData {
    return { ...this.data }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(l => l())
  }

  addResource(type: ResourceType, amount: number) {
    this.data.inventory[type] = (this.data.inventory[type] || 0) + Math.max(0, amount)
    this.save()
    this.notify()
  }

  spendResources(requirements: Partial<Record<ResourceType, number>>): boolean {
    for (const [res, amount] of Object.entries(requirements)) {
      const typedRes = res as ResourceType
      if ((this.data.inventory[typedRes] || 0) < (amount || 0)) return false
    }
    for (const [res, amount] of Object.entries(requirements)) {
      const typedRes = res as ResourceType
      this.data.inventory[typedRes] -= amount || 0
    }
    this.save()
    this.notify()
    return true
  }

  upgradeSkill(skillId: string): boolean {
    const skill = SKILLS.find(s => s.id === skillId)
    if (!skill) return false
    const currentLevel = this.data.skills[skillId] || 0
    if (currentLevel >= skill.maxLevel) return false
    const cost = skill.costPerLevel(currentLevel)
    if (this.spendResources(cost)) {
      this.data.skills[skillId] = currentLevel + 1
      this.save()
      this.notify()
      return true
    }
    return false
  }

  craftItem(recipeId: string, ingredients: Partial<Record<ResourceType, number>>): boolean {
    if (this.spendResources(ingredients)) {
      this.data.consumables[recipeId] = (this.data.consumables[recipeId] || 0) + 1
      this.save()
      this.notify()
      return true
    }
    return false
  }

  getResource(type: ResourceType): number {
    return this.data.inventory[type] || 0
  }

  getAllResources(): Record<ResourceType, number> {
    return { ...this.data.inventory }
  }

  getConsumableCount(id: string): number {
    return this.data.consumables[id] || 0
  }

  getAllConsumables(): Record<string, number> {
    return { ...this.data.consumables }
  }

  useConsumable(id: string): boolean {
    if ((this.data.consumables[id] || 0) > 0) {
      this.data.consumables[id] -= 1
      this.save()
      this.notify()
      return true
    }
    return false
  }

  prestige(currentScore: number) {
    const pointsEarned = Math.floor(currentScore / 10000)
    this.data.prestigePoints += pointsEarned
    this.data.prestigeLevel += 1
    this.save()
    this.notify()
    return pointsEarned
  }

  getSkillLevel(skillId: string): number {
    return this.data.skills[skillId] || 0
  }

  getSkillBonus(skillId: string): number {
    const skill = SKILLS.find(s => s.id === skillId)
    if (!skill) return 0
    return skill.effect(this.getSkillLevel(skillId))
  }

  reset() {
    this.data = createInitialData()
    localStorage.removeItem('nexus_progression')
    this.notify()
  }

  private save() {
    this.saveLocal()
    this.saveCloud()
  }

  private saveLocal() {
    try {
      localStorage.setItem('nexus_progression', JSON.stringify(this.data))
    } catch (e) {
      console.warn('[ProgressionManager] Failed to save to localStorage:', e)
    }
  }

  private async saveCloud() {
    const user = auth.currentUser
    if (user) {
      this.isSyncing = true
      try {
        const docRef = doc(db, 'users', user.uid, 'private', 'progression')
        await setDoc(docRef, this.data)
      } catch (e) {
        console.warn('[ProgressionManager] Failed to save to cloud:', e)
      } finally {
        this.isSyncing = false
      }
    }
  }
}

export const progressionManager = new ProgressionManager()
