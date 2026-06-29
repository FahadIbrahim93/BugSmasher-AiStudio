import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from './firebase';
import { ChecksumSystem } from './checksum';
import type { GameSaveData } from '../game/SaveManager';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  wave: number;
  updatedAt: number | { seconds: number; nanoseconds: number } | null;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export class FirebaseService {
  /**
   * Profiles
   */
  static async updateUsername(userId: string, username: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        username, 
        updatedAt: new Date().toISOString() 
      });
      return true;
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      return false;
    }
  }

  /**
   * Game Saves
   */
  static async uploadSave(userId: string, data: GameSaveData) {
    try {
      const { checksum, ...pure } = data;
      if (auth.currentUser?.uid !== userId) {
        throw new Error('Cannot upload a cloud save for a different user.');
      }
      const upload = httpsCallable<{ data: Record<string, unknown> }, { ok: boolean; checksum?: string }>(
        functions,
        'uploadSave'
      );
      const result = await upload({ data: pure });
      if (!result.data.ok) throw new Error('Cloud save upload was rejected by the server.');
      if (result.data.checksum && checksum && result.data.checksum !== checksum) {
        console.warn('[FirebaseService] Server accepted save but returned a different client checksum.');
      }
      return true;
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/private/saves`, false);
      return false;
    }
  }

  static async downloadSave(userId: string): Promise<GameSaveData | null> {
    try {
      const saveRef = doc(db, 'users', userId, 'private', 'saves');
      const snap = await getDoc(saveRef);
      if (!snap.exists()) return null;
      const docData = snap.data();
      const payload = docData.data as Record<string, unknown>;
      const clientChecksum = docData.clientChecksum as string | undefined;
      if (clientChecksum) {
        const valid = await ChecksumSystem.verify(payload, clientChecksum);
        if (!valid) {
          console.error('[FirebaseService] Cloud save checksum invalid — rejected');
          return null;
        }
      }
      return { ...payload, checksum: clientChecksum } as GameSaveData;
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/private/saves`);
      return null;
    }
  }

  /**
   * Leaderboard
   */
  static async submitScore(userId: string, username: string, score: number, wave: number) {
    try {
      if (auth.currentUser?.uid !== userId) {
        throw new Error('Cannot submit a leaderboard score for a different user.');
      }
      const submit = httpsCallable<
        { username: string; score: number; wave: number },
        { ok: boolean }
      >(functions, 'submitScore');
      const result = await submit({ username, score, wave });
      if (!result.data.ok) throw new Error('Leaderboard submission was rejected by the server.');
      return true;
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.WRITE, `leaderboard/${userId}`, false);
      return false;
    }
  }

  static async getTopScores(count = 10): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardQuery = query(
        collection(db, 'leaderboard'),
        orderBy('score', 'desc'),
        limit(count)
      );
      const snap = await getDocs(leaderboardQuery);
      return snap.docs.map(d => d.data() as LeaderboardEntry);
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      return [];
    }
  }
}
