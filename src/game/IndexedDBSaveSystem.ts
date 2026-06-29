import { GameSaveData } from './SaveManager';

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  data: GameSaveData;
  biome: string;
}

const DB_NAME = 'BugSmasherDB';
const STORE_NAME = 'save_slots';
const DB_VERSION = 1;

export class IndexedDBSaveSystem {
  private static db: IDBDatabase | null = null;
  private static useFallback = false;
  // Fallback in-memory storage for test/sandboxed iframe restrictions
  private static memoryStorage: Record<string, SaveSlot> = {};

  static resetForTests(): void {
    this.db = null;
    this.useFallback = false;
    this.memoryStorage = {};
  }

  static init(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined') {
          this.useFallback = true;
          resolve(false);
          return;
        }

        // Accessing window.indexedDB inside try/catch to deal with Safari/Chrome SecurityErrors in iframes
        let hasIndexedDB = false;
        try {
          hasIndexedDB = 'indexedDB' in window && window.indexedDB !== undefined && window.indexedDB !== null;
        } catch (e) {
          hasIndexedDB = false;
        }

        if (!hasIndexedDB) {
          console.warn('IndexedDB not supported or permission denied in this environment. Falling back to memory/localStorage.');
          this.useFallback = true;
          this.loadFallbackFromLocalStorage();
          resolve(false);
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.warn('IndexedDB request error. Falling back to memory.', event);
          this.useFallback = true;
          this.loadFallbackFromLocalStorage();
          resolve(false);
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
      } catch (e) {
        console.warn('SecurityError or indexing blocker encountered. Falling back to memory.', e);
        this.useFallback = true;
        this.loadFallbackFromLocalStorage();
        resolve(false);
      }
    });
  }

  private static loadFallbackFromLocalStorage() {
    try {
      const stored = localStorage.getItem('bugsmasher_idb_fallback');
      if (stored) {
        this.memoryStorage = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load fallback save slots from localStorage', e);
    }
  }

  private static persistFallbackToLocalStorage() {
    try {
      localStorage.setItem('bugsmasher_idb_fallback', JSON.stringify(this.memoryStorage));
    } catch (e) {
      console.warn('Failed to save fallback save slots to localStorage', e);
    }
  }

  private static async getDB(): Promise<IDBDatabase> {
    if (this.useFallback) {
      throw new Error('IndexedDB is in fallback mode');
    }
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('IndexedDB could not be initialized');
    }
    return this.db;
  }

  static async saveSlot(slot: SaveSlot): Promise<boolean> {
    try {
      if (this.useFallback) {
        this.memoryStorage[slot.id] = slot;
        this.persistFallbackToLocalStorage();
        return true;
      }

      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(slot);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Error saving slot to IndexedDB', request.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('IDB write failed, using fallback.', e);
      this.useFallback = true;
      this.memoryStorage[slot.id] = slot;
      this.persistFallbackToLocalStorage();
      return true;
    }
  }

  static async getSlot(id: string): Promise<SaveSlot | null> {
    try {
      if (this.useFallback) {
        return this.memoryStorage[id] || null;
      }

      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error('Error loading slot from IndexedDB', request.error);
          resolve(null);
        };
      });
    } catch (e) {
      console.warn('IDB read failed, using fallback.', e);
      this.useFallback = true;
      this.loadFallbackFromLocalStorage();
      return this.memoryStorage[id] || null;
    }
  }

  static async getAllSlots(): Promise<SaveSlot[]> {
    try {
      if (this.useFallback) {
        return Object.values(this.memoryStorage).sort((a, b) => b.timestamp - a.timestamp);
      }

      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const slots = request.result as SaveSlot[];
          resolve(slots.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => {
          console.error('Error fetching all slots from IndexedDB', request.error);
          resolve([]);
        };
      });
    } catch (e) {
      console.warn('IDB getAll failed, using fallback.', e);
      this.useFallback = true;
      this.loadFallbackFromLocalStorage();
      return Object.values(this.memoryStorage).sort((a, b) => b.timestamp - a.timestamp);
    }
  }

  static async deleteSlot(id: string): Promise<boolean> {
    try {
      if (this.useFallback) {
        delete this.memoryStorage[id];
        this.persistFallbackToLocalStorage();
        return true;
      }

      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Error deleting slot from IndexedDB', request.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('IDB delete failed, using fallback.', e);
      this.useFallback = true;
      delete this.memoryStorage[id];
      this.persistFallbackToLocalStorage();
      return true;
    }
  }
}
