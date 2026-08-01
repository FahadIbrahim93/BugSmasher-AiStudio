import { describe, expect, it, vi } from 'vitest';

// Simulate an offline/unconfigured build: Firebase module exports null values.
// This is the state that previously crashed the app at startup (getAuth threw
// auth/invalid-api-key on an empty config) and produced a blank black screen.
// All cloud operations must fail soft instead of throwing.
vi.mock('../lib/firebase', () => ({
  auth: null,
  db: null,
  functions: null,
  googleProvider: null,
}));

import { FirebaseService, handleFirestoreError, OperationType } from '../lib/firebaseService';

describe('FirebaseService offline (unconfigured Firebase)', () => {
  it('updateUsername returns false instead of throwing', async () => {
    await expect(FirebaseService.updateUsername('uid-1', 'Player')).resolves.toBe(false);
  });

  it('uploadSave returns false instead of throwing', async () => {
    await expect(
      FirebaseService.uploadSave('uid-1', {
        score: 100,
        wave: 1,
        health: 100,
        maxHealth: 100,
        clickRadiusMultiplier: 1,
        autoTurretLevel: 0,
        timestamp: Date.now(),
      })
    ).resolves.toBe(false);
  });

  it('downloadSave returns null instead of throwing', async () => {
    await expect(FirebaseService.downloadSave('uid-1')).resolves.toBeNull();
  });

  it('startSession returns null instead of throwing', async () => {
    await expect(FirebaseService.startSession()).resolves.toBeNull();
  });

  it('submitScore returns false instead of throwing', async () => {
    await expect(FirebaseService.submitScore('uid-1', 'Player', 100, 1, 'sess-1')).resolves.toBe(false);
  });

  it('getTopScores returns empty array instead of throwing', async () => {
    await expect(FirebaseService.getTopScores()).resolves.toEqual([]);
  });

  it('handleFirestoreError does not crash on null auth (shouldThrow=false)', () => {
    // shouldThrow=false: the function logs and returns instead of throwing.
    // The meaningful assertion is that accessing auth.currentUser with null auth
    // does not raise a TypeError during error-reporting construction.
    expect(() => {
      handleFirestoreError(new Error('offline test'), OperationType.GET, 'test/path', false);
    }).not.toThrow();
  });
});
