import * as functions from 'firebase-functions/v1';

export function requireAuth(context: functions.https.CallableContext): string {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }
  return uid;
}

export function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new functions.https.HttpsError('invalid-argument', `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function sanitizeUsername(value: unknown): string {
  if (typeof value !== 'string') return 'Anonymous User';
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 32);
  return cleaned || 'Anonymous User';
}

export function assertSafeScore(score: unknown, wave: unknown): { score: number; wave: number } {
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

  const maxPlausibleScore = 50_000 + numericWave * 250_000;
  if (numericScore > maxPlausibleScore) {
    throw new functions.https.HttpsError('failed-precondition', 'Score exceeds server plausibility bounds.');
  }

  return { score: numericScore, wave: numericWave };
}
