import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentUser: { uid: 'user-1' } as { uid: string } | null,
  callable: vi.fn(),
  httpsCallable: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: { get currentUser() { return mocks.currentUser; } },
  db: {},
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: mocks.httpsCallable,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...parts: string[]) => parts.join('/')),
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  updateDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  collection: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

import { FirebaseService } from '../lib/firebaseService';

describe('FirebaseService server-authoritative writes', () => {
  beforeEach(() => {
    mocks.currentUser = { uid: 'user-1' };
    mocks.callable = vi.fn(() => Promise.resolve({ data: { ok: true, checksum: 'server-client-checksum' } }));
    mocks.httpsCallable.mockReturnValue(mocks.callable);
    mocks.getDoc.mockResolvedValue({ exists: () => false });
    mocks.getDocs.mockResolvedValue({ docs: [] });
  });

  it('uploads cloud saves through the callable function instead of direct Firestore writes', async () => {
    const result = await FirebaseService.uploadSave('user-1', {
      score: 100,
      wave: 2,
      health: 90,
      maxHealth: 100,
      clickRadiusMultiplier: 1,
      autoTurretLevel: 0,
      timestamp: 123,
      checksum: 'client-checksum',
    });

    expect(result).toBe(true);
    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, 'uploadSave');
    expect(mocks.callable).toHaveBeenCalledWith({
      data: {
        score: 100,
        wave: 2,
        health: 90,
        maxHealth: 100,
        clickRadiusMultiplier: 1,
        autoTurretLevel: 0,
        timestamp: 123,
      },
    });
  });

  it('refuses to upload a cloud save for a different authenticated user', async () => {
    const result = await FirebaseService.uploadSave('other-user', {
      score: 100,
      wave: 2,
      health: 90,
      maxHealth: 100,
      clickRadiusMultiplier: 1,
      autoTurretLevel: 0,
      timestamp: 123,
    });

    expect(result).toBe(false);
    expect(mocks.callable).not.toHaveBeenCalled();
  });

  it('submits leaderboard scores through the callable function', async () => {
    const result = await FirebaseService.submitScore('user-1', 'Operator', 1200, 4);

    expect(result).toBe(true);
    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, 'submitScore');
    expect(mocks.callable).toHaveBeenCalledWith({ username: 'Operator', score: 1200, wave: 4 });
  });

  it('refuses to submit leaderboard scores for a different authenticated user', async () => {
    const result = await FirebaseService.submitScore('other-user', 'Operator', 1200, 4);

    expect(result).toBe(false);
    expect(mocks.callable).not.toHaveBeenCalled();
  });
});
