import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  wave: number;
  updatedAt: any;
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
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      return false;
    }
  }

  /**
   * Game Saves
   */
  static async uploadSave(userId: string, data: any) {
    try {
      const saveRef = doc(db, 'users', userId, 'private', 'saves');
      await setDoc(saveRef, { 
        userId, 
        data, 
        updatedAt: new Date().toISOString() 
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/private/saves`);
      return false;
    }
  }

  static async downloadSave(userId: string): Promise<any | null> {
    try {
      const saveRef = doc(db, 'users', userId, 'private', 'saves');
      const snap = await getDoc(saveRef);
      if (!snap.exists()) return null;
      return snap.data().data;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/private/saves`);
      return null;
    }
  }

  /**
   * Leaderboard
   */
  static async submitScore(userId: string, username: string, score: number, wave: number) {
    try {
      const leaderboardRef = doc(db, 'leaderboard', userId);
      const existing = await getDoc(leaderboardRef);
      
      if (existing.exists() && existing.data().score >= score) {
        return true;
      }

      await setDoc(leaderboardRef, {
        userId,
        username: username || 'Anonymous User',
        score,
        wave,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `leaderboard/${userId}`);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      return [];
    }
  }
}
