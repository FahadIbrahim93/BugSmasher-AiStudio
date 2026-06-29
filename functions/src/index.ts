import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { generateChecksum } from './checksum';
import { handleSubmitScore, handleUploadSave } from './handlers';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Validates save checksum after callable writes (defense in depth).
 */
export const validateSaveOnWrite = functions.firestore
  .document('users/{userId}/private/saves')
  .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after?.data) return null;

    const payload = after.data as Record<string, unknown>;
    const checksum = after.checksum as string | undefined;
    if (!checksum) {
      console.error('[validateSaveOnWrite] Save missing checksum');
      return null;
    }

    const expected = generateChecksum(payload);
    if (expected !== checksum) {
      console.error('[validateSaveOnWrite] Save checksum mismatch — tampered data detected');
    }
    return null;
  });

/**
 * Authoritative cloud-save write path.
 */
export const uploadSave = functions.https.onCall(handleUploadSave);

/**
 * Authoritative leaderboard write path.
 */
export const submitScore = functions.https.onCall(handleSubmitScore);
