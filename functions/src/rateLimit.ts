import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

export type RateLimitedAction = 'uploadSave' | 'submitScore';

const RATE_LIMITS: Record<RateLimitedAction, { max: number; windowMs: number }> = {
  uploadSave: { max: 10, windowMs: 60_000 },
  submitScore: { max: 5, windowMs: 60_000 },
};

export async function checkRateLimit(
  db: admin.firestore.Firestore,
  uid: string,
  action: RateLimitedAction
): Promise<void> {
  const config = RATE_LIMITS[action];
  const ref = db.doc(`_rateLimits/${uid}_${action}`);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data() as { windowStart: number; count: number } | undefined;

    if (!data || now - data.windowStart >= config.windowMs) {
      transaction.set(ref, { windowStart: now, count: 1 });
      return;
    }

    if (data.count >= config.max) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded for ${action}. Try again later.`
      );
    }

    transaction.update(ref, { count: data.count + 1 });
  });
}
