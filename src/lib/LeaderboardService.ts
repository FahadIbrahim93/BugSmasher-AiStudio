import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface LeaderboardEntry {
  id?: string
  score: number
  wave: number
  username: string
  biome: string
  prestigeLevel: number
  bugsKilled: number
  createdAt?: Timestamp
}

const COLLECTION = 'leaderboard'
const CACHE_KEY = 'bugsmasher_leaderboard_cache'
const CACHE_DURATION = 60_000

export class LeaderboardService {
  private cachedEntries: LeaderboardEntry[] | null = null
  private lastFetch = 0

  async submitScore(entry: Omit<LeaderboardEntry, 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTION), {
        ...entry,
        createdAt: serverTimestamp(),
      })
      this.cachedEntries = null
    } catch {
      throw new Error('Failed to submit score')
    }
  }

  async getTopScores(limitCount = 20): Promise<LeaderboardEntry[]> {
    if (this.cachedEntries && Date.now() - this.lastFetch < CACHE_DURATION) {
      return this.cachedEntries
    }

    try {
      const q = query(collection(db, COLLECTION), orderBy('score', 'desc'), limit(limitCount))
      const snapshot = await getDocs(q)
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardEntry)
      this.cachedEntries = entries
      this.lastFetch = Date.now()
      this.cacheToStorage(entries)
      return entries
    } catch {
      return this.getCachedFromStorage()
    }
  }

  private cacheToStorage(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ entries, timestamp: Date.now() }))
    } catch {
      /* ignore */
    }
  }

  private getCachedFromStorage(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { entries } = JSON.parse(raw)
        return entries
      }
    } catch {
      /* ignore */
    }
    return []
  }
}

export const leaderboardService = new LeaderboardService()
