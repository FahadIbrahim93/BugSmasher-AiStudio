import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { randomBytes } from 'crypto';
import { checkRateLimit } from './rateLimit';
import { requireAuth } from './validation';

// Session configuration
const SESSION_TTL_MS = 600_000; // 10 minutes — a single game round should complete within this window
const SESSION_MAX_SCORE_PER_SECOND = 5_000; // Hard cap: max plausible score accumulation per second
const SESSION_MIN_ELAPSED_SECONDS = 5; // Conservative floor for newly-created sessions

export interface SessionTokenData {
  userId: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  /** Optional: snapshot of user's score before session for delta validation */
  initialScore?: number;
}

/**
 * Generates a cryptographically random session ID.
 */
function generateSessionId(): string {
  return randomBytes(24).toString('hex');
}

/**
 * Creates a new game session token in Firestore and returns it to the client.
 *
 * The token grants the holder the ability to submit one score for the
 * authenticated user. Reuse is prevented by atomically marking the
 * document as `used` during score submission (replay protection).
 */
export async function handleStartSession(
  requestData: unknown,
  context: functions.https.CallableContext
): Promise<{ sessionId: string; expiresAt: number }> {
  const uid = requireAuth(context);

  // Rate-limit session creation to prevent abuse
  const db = admin.firestore();
  await checkRateLimit(db, uid, 'startSession');

  const sessionId = generateSessionId();
  const now = Date.now();

  const sessionData: SessionTokenData = {
    userId: uid,
    sessionId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    used: false,
  };

  await db.doc(`_sessions/${sessionId}`).set(sessionData);

  return { sessionId, expiresAt: sessionData.expiresAt };
}

/**
 * Validates a session token for score submission.
 *
 * Checks:
 * 1. Token document exists in Firestore
 * 2. Token belongs to the calling user
 * 3. Token has not expired
 * 4. Token has not already been used (replay protection)
 *
 * Returns the session data on success.
 *
 * IMPORTANT: this function MUST be called inside a Firestore transaction
 * that atomically marks the token as `used` to prevent race-condition replay.
 */
export async function validateAndConsumeSession(
  db: admin.firestore.Firestore,
  sessionId: string,
  uid: string,
): Promise<SessionTokenData> {
  const ref = db.doc(`_sessions/${sessionId}`);

  // Use a transaction for atomic read-then-write (replay protection)
  const sessionData = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Session token not found. Start a new game session first.'
      );
    }

    const data = snap.data() as SessionTokenData;

    // Belongs to this user?
    if (data.userId !== uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Session token does not belong to this user.'
      );
    }

    // Expired?
    if (Date.now() > data.expiresAt) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Session token has expired. Start a new game session.'
      );
    }

    // Already used (replay attack)?
    if (data.used) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Session token has already been used. Replay detected.'
      );
    }

    // Atomically mark as used
    transaction.update(ref, { used: true });
    return data;
  });

  return sessionData;
}

/**
 * Validates that the submitted score is plausible for a single session.
 *
 * A newly-created session is given a conservative 5-second minimum duration
 * floor rather than skipping validation entirely. This preserves usability
 * for legitimate short rounds while preventing a fresh token from becoming
 * an unconditional bypass around the session plausibility cap.
 */
export function assertPlausibleSessionScore(
  score: number,
  session: SessionTokenData,
): void {
  const elapsedSeconds = Math.max(
    (Date.now() - session.createdAt) / 1000,
    SESSION_MIN_ELAPSED_SECONDS,
  );

  const maxPlausible = elapsedSeconds * SESSION_MAX_SCORE_PER_SECOND;

  if (score > maxPlausible) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Score ${score} exceeds maximum plausible score ${Math.round(maxPlausible)} for session duration ${elapsedSeconds.toFixed(0)}s.`,
    );
  }
}
