import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

admin.initializeApp();

const SALT = process.env.CHECKSUM_SALT || 'smash_the_bugs_2026_FAANG_SECRET';

function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec)
    .sort()
    .reduce((acc: Record<string, unknown>, key) => {
      acc[key] = sortObject(rec[key]);
      return acc;
    }, {});
}

function generateChecksum(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(sortObject(data));
  return createHash('sha256')
    .update(serialized + SALT)
    .digest('hex');
}

/**
 * Callable for server-enforced save: validates checksum (prevents bad/tampered writes),
 * then performs the write from trusted admin context.
 * Client must call this (via FirebaseService) instead of direct setDoc.
 * This replaces the ineffective post-facto onWrite pattern.
 */
export const saveGame = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to save game data.');
  }
  const uid = context.auth.uid;

  const payload = (data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined;
  const checksum = (data as Record<string, unknown> | undefined)?.checksum as string | undefined;

  if (!payload || typeof checksum !== 'string' || checksum.length !== 64) {
    throw new functions.https.HttpsError('invalid-argument', 'Save must include data payload and 64-char checksum');
  }

  const expected = generateChecksum(payload);
  if (expected !== checksum) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Save checksum mismatch — tampered data rejected'
    );
  }

  // Minimal server-side payload validation (Dirty Dozen basics; after checksum)
  if (typeof payload.score !== 'number' || payload.score < 0 ||
      typeof payload.wave !== 'number' || payload.wave < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid score/wave values');
  }
  if (payload.userId && payload.userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'userId mismatch');
  }
  if (JSON.stringify(payload).length > 1024 * 1024) {
    throw new functions.https.HttpsError('invalid-argument', 'Payload too large');
  }

  // Write from server (bypasses client rules; checksum already validated)
  const saveRef = admin.firestore().doc(`users/${uid}/private/saves`);
  await saveRef.set({
    userId: uid,
    data: payload,
    checksum,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Callable for server-enforced leaderboard submit (monotonic high score only).
 * Replaces direct client setDoc for writes. Client optimistic check remains best-effort UI.
 * Enforces auth, positive values, and score >= existing (no downgrades).
 */
export const submitScore = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to submit score.');
  }
  const uid = context.auth.uid;

  const payload = data as { username?: string; score?: number; wave?: number } | undefined;
  const username = payload?.username || 'Anonymous User';
  const score = payload?.score;
  const wave = payload?.wave;

  if (typeof score !== 'number' || score < 0 || typeof wave !== 'number' || wave < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Score and wave must be non-negative numbers');
  }

  const leaderboardRef = admin.firestore().doc(`leaderboard/${uid}`);
  const existingSnap = await leaderboardRef.get();
  if (existingSnap.exists) {
    const existingScore = existingSnap.data()?.score;
    if (typeof existingScore === 'number' && existingScore >= score) {
      return { success: true, skipped: true }; // monotonic: do not allow lower/equal overwrite
    }
  }

  await leaderboardRef.set({
    userId: uid,
    username,
    score,
    wave,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});