import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { generateChecksum, generateClientChecksum } from './checksum';
import { checkRateLimit } from './rateLimit';
import { parseSaveData } from './saveSchema';
import { assertRecord, assertSafeScore, requireAuth, sanitizeUsername } from './validation';
import { validateAndConsumeSession, assertPlausibleSessionScore } from './sessionToken';

export function getFirestore(): admin.firestore.Firestore {
  return admin.firestore();
}

export async function handleUploadSave(
  requestData: unknown,
  context: functions.https.CallableContext
): Promise<{ ok: true; checksum: string }> {
  const uid = requireAuth(context);
  const body = assertRecord(requestData, 'Request');
  const rawData = assertRecord(body.data, 'Save data');
  const data = parseSaveData(rawData);

  const db = getFirestore();
  await checkRateLimit(db, uid, 'uploadSave');

  const serverChecksum = generateChecksum(data);
  const clientChecksum = generateClientChecksum(data);

  await db.doc(`users/${uid}/private/saves`).set({
    userId: uid,
    data,
    checksum: serverChecksum,
    clientChecksum,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, checksum: clientChecksum };
}

export async function handleSubmitScore(
  requestData: unknown,
  context: functions.https.CallableContext
): Promise<{ ok: true }> {
  const uid = requireAuth(context);
  const body = assertRecord(requestData, 'Request');
  const { score, wave } = assertSafeScore(body.score, body.wave);
  const username = sanitizeUsername(body.username);

  // Session-token anti-cheat: validate and consume the session token
  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Session token (sessionId) is required for score submission.'
    );
  }

  const db = getFirestore();
  await checkRateLimit(db, uid, 'submitScore');

  // Validate session token (atomic consume for replay protection)
  const session = await validateAndConsumeSession(db, sessionId, uid);

  // Plausibility check: score must be achievable within session duration
  assertPlausibleSessionScore(score, session);

  const leaderboardRef = db.doc(`leaderboard/${uid}`);

  await db.runTransaction(async (transaction) => {
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
}


