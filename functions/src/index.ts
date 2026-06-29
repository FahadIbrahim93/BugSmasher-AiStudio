import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

admin.initializeApp();

const SALT = process.env.CHECKSUM_SALT;

if (!SALT) {
  throw new Error('CHECKSUM_SALT must be configured for save checksum validation.');
}

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

function generateClientChecksum(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(sortObject(data));
  return createHash('sha256')
    .update(serialized)
    .digest('hex');
}

function requireAuth(context: functions.https.CallableContext): string {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }
  return uid;
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new functions.https.HttpsError('invalid-argument', `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function sanitizeUsername(value: unknown): string {
  if (typeof value !== 'string') return 'Anonymous User';
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 32);
  return cleaned || 'Anonymous User';
}

function assertSafeScore(score: unknown, wave: unknown): { score: number; wave: number } {
  if (!Number.isInteger(score) || !Number.isInteger(wave)) {
    throw new functions.https.HttpsError('invalid-argument', 'Score and wave must be integers.');
  }
  const numericScore = score as number;
  const numericWave = wave as number;
  if (numericScore <= 0 || numericWave <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Score and wave must be positive.');
  }
  if (numericWave > 1000 || numericScore > 100_000_000) {
    throw new functions.https.HttpsError('invalid-argument', 'Score submission exceeds hard safety bounds.');
  }

  // Conservative plausibility guard: high enough not to reject legitimate late-game
  // sessions, low enough to stop obvious DevTools/localStorage leaderboard injection.
  const maxPlausibleScore = 50_000 + numericWave * 250_000;
  if (numericScore > maxPlausibleScore) {
    throw new functions.https.HttpsError('failed-precondition', 'Score exceeds server plausibility bounds.');
  }

  return { score: numericScore, wave: numericWave };
}

/**
 * Validates save checksum before write (P1-07).
 */
export const validateSaveOnWrite = functions.firestore
  .document('users/{userId}/private/saves')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after?.data) return null;

    const payload = after.data as Record<string, unknown>;
    const checksum = after.checksum as string | undefined;
    if (!checksum) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Save must include server-verifiable checksum'
      );
    }

    const expected = generateChecksum(payload);
    if (expected !== checksum) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Save checksum mismatch — tampered data rejected'
      );
    }
    return null;
  });

/**
 * Authoritative cloud-save write path.
 *
 * Clients are denied direct writes to users/{uid}/private/saves in firestore.rules.
 * This callable verifies the authenticated user, computes the secret-bearing server
 * checksum, and writes with Admin SDK privileges.
 */
export const uploadSave = functions.https.onCall(async (requestData, context) => {
  const uid = requireAuth(context);
  const body = assertRecord(requestData, 'Request');
  const data = assertRecord(body.data, 'Save data');
  const serverChecksum = generateChecksum(data);
  const clientChecksum = generateClientChecksum(data);

  await admin.firestore().doc(`users/${uid}/private/saves`).set({
    userId: uid,
    data,
    checksum: serverChecksum,
    clientChecksum,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, checksum: clientChecksum };
});

/**
 * Authoritative leaderboard write path.
 *
 * This is not full anti-cheat telemetry, but it removes the previous direct
 * client-authoritative write and applies minimum server-side validation.
 */
export const submitScore = functions.https.onCall(async (requestData, context) => {
  const uid = requireAuth(context);
  const body = assertRecord(requestData, 'Request');
  const { score, wave } = assertSafeScore(body.score, body.wave);
  const username = sanitizeUsername(body.username);
  const leaderboardRef = admin.firestore().doc(`leaderboard/${uid}`);

  await admin.firestore().runTransaction(async (transaction) => {
    const existing = await transaction.get(leaderboardRef);
    const previousScore = existing.exists ? existing.get('score') : null;
    if (typeof previousScore === 'number' && previousScore >= score) return;

    transaction.set(leaderboardRef, {
      userId: uid,
      username,
      score,
      wave,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});
