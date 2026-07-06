import firebaseFunctionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const PROJECT_ID = 'demo-bugsmasher';

process.env.CHECKSUM_SALT = 'emulator-test-salt-do-not-use-in-production';
process.env.GCLOUD_PROJECT = PROJECT_ID;

const fft = firebaseFunctionsTest({ projectId: PROJECT_ID });

type WrappedCallable = (
  data: unknown,
  context?: { auth?: { uid: string; token?: Record<string, unknown> } }
) => Promise<unknown>;

let uploadSave: WrappedCallable;
let submitScore: WrappedCallable;
let startSession: WrappedCallable;

const validSave = {
  score: 100,
  wave: 2,
  health: 90,
  maxHealth: 100,
  clickRadiusMultiplier: 1,
  autoTurretLevel: 0,
  timestamp: 1_700_000_000_000,
};

beforeAll(async () => {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  const mod = await import('../lib/index');
  uploadSave = fft.wrap(mod.uploadSave) as WrappedCallable;
  submitScore = fft.wrap(mod.submitScore) as WrappedCallable;
  startSession = fft.wrap(mod.startSession) as WrappedCallable;
});

afterAll(() => {
  fft.cleanup();
});

beforeEach(async () => {
  const db = admin.firestore();
  const collections = await db.listCollections();
  for (const collection of collections) {
    const docs = await collection.listDocuments();
    await Promise.all(docs.map((doc) => doc.delete()));
  }
});

describe('uploadSave callable', () => {
  it('rejects unauthenticated requests', async () => {
    await expect(uploadSave({ data: validSave })).rejects.toThrow(/Authentication is required/);
  });

  it('writes save with server and client checksums', async () => {
    const result = (await uploadSave({ data: validSave }, { auth: { uid: 'user-1' } })) as {
      ok: boolean;
      checksum: string;
    };

    expect(result.ok).toBe(true);
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);

    const snap = await admin.firestore().doc('users/user-1/private/saves').get();
    expect(snap.exists).toBe(true);
    const saved = snap.data();
    expect(saved?.clientChecksum).toBe(result.checksum);
    expect(saved?.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(saved?.checksum).not.toBe(saved?.clientChecksum);
  });

  it('rejects invalid save schema', async () => {
    await expect(
      uploadSave({ data: { score: 'not-a-number', wave: 1 } }, { auth: { uid: 'user-2' } })
    ).rejects.toThrow(/Save data failed validation/);
  });

  it('rejects unknown save fields', async () => {
    await expect(
      uploadSave({ data: { ...validSave, hacked: true } }, { auth: { uid: 'user-3' } })
    ).rejects.toThrow(/Save data failed validation/);
  });

  it('enforces rate limits', async () => {
    const uid = 'rate-limit-save-user';
    for (let i = 0; i < 10; i += 1) {
      await uploadSave({ data: { ...validSave, timestamp: validSave.timestamp + i } }, { auth: { uid } });
    }

    await expect(
      uploadSave({ data: { ...validSave, timestamp: validSave.timestamp + 99 } }, { auth: { uid } })
    ).rejects.toThrow(/Rate limit exceeded/);
  });
});

describe('submitScore callable', () => {
  it('rejects unauthenticated requests', async () => {
    await expect(submitScore({ score: 100, wave: 2, username: 'Player' })).rejects.toThrow(
      /Authentication is required/
    );
  });

  it('writes leaderboard entry for authenticated user', async () => {
    const result = (await submitScore(
      { score: 12_500, wave: 5, username: '  Alice  ' },
      { auth: { uid: 'leader-1' } }
    )) as { ok: boolean };

    expect(result.ok).toBe(true);

    const snap = await admin.firestore().doc('leaderboard/leader-1').get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toMatchObject({
      userId: 'leader-1',
      username: 'Alice',
      score: 12_500,
      wave: 5,
    });
  });

  it('preserves higher existing score', async () => {
    const uid = 'leader-monotonic';
    await submitScore({ score: 50_000, wave: 10, username: 'Pro' }, { auth: { uid } });
    await submitScore({ score: 10_000, wave: 20, username: 'Pro' }, { auth: { uid } });

    const snap = await admin.firestore().doc(`leaderboard/${uid}`).get();
    expect(snap.data()?.score).toBe(50_000);
  });

  it('rejects implausible scores', async () => {
    await expect(
      submitScore({ score: 2_000_000, wave: 5, username: 'Cheater' }, { auth: { uid: 'cheater-1' } })
    ).rejects.toThrow(/plausibility bounds/);
  });

  it('enforces rate limits', async () => {
    const uid = 'rate-limit-score-user';
    for (let i = 0; i < 5; i += 1) {
      await submitScore({ score: 1_000 + i, wave: 1, username: 'Spammer' }, { auth: { uid } });
    }

    await expect(
      submitScore({ score: 9_999, wave: 2, username: 'Spammer' }, { auth: { uid } })
    ).rejects.toThrow(/Rate limit exceeded/);
  });
});

describe('startSession callable', () => {
  it('rejects unauthenticated requests', async () => {
    await expect(startSession({})).rejects.toThrow(/Authentication is required/);
  });

  it('creates a session token for authenticated user', async () => {
    const result = (await startSession({}, { auth: { uid: 'session-user-1' } })) as {
      sessionId: string;
      expiresAt: number;
    };

    expect(result.sessionId).toMatch(/^[a-f0-9]{48}$/); // 24 bytes = 48 hex chars
    expect(result.expiresAt).toBeGreaterThan(Date.now());

    // Verify session document exists in Firestore
    const snap = await admin.firestore().doc(`_sessions/${result.sessionId}`).get();
    expect(snap.exists).toBe(true);
    const data = snap.data();
    expect(data?.userId).toBe('session-user-1');
    expect(data?.used).toBe(false);
  });

  it('enforces rate limits on session creation', async () => {
    const uid = 'rate-limit-session-user';
    for (let i = 0; i < 30; i += 1) {
      await startSession({}, { auth: { uid } });
    }

    await expect(
      startSession({}, { auth: { uid } })
    ).rejects.toThrow(/Rate limit exceeded/);
  });
});

describe('submitScore with session tokens', () => {
  it('rejects score submission without a session token', async () => {
    await expect(
      submitScore(
        { score: 100, wave: 1, username: 'Player' },
        { auth: { uid: 'no-session-user' } }
      )
    ).rejects.toThrow(/Session token/);
  });

  it('accepts score submission with a valid session token', async () => {
    const uid = 'valid-session-user';

    // Start a session
    const sessionResult = (await startSession({}, { auth: { uid } })) as {
      sessionId: string;
    };

    // Submit score with session token
    const result = (await submitScore(
      { score: 5_000, wave: 3, username: 'ValidPlayer', sessionId: sessionResult.sessionId },
      { auth: { uid } }
    )) as { ok: boolean };

    expect(result.ok).toBe(true);

    // Verify session token is marked as used
    const snap = await admin.firestore().doc(`_sessions/${sessionResult.sessionId}`).get();
    expect(snap.data()?.used).toBe(true);

    // Verify leaderboard entry
    const lbSnap = await admin.firestore().doc(`leaderboard/${uid}`).get();
    expect(lbSnap.data()?.score).toBe(5_000);
  });

  it('rejects replay of a used session token', async () => {
    const uid = 'replay-session-user';

    // Start a session
    const sessionResult = (await startSession({}, { auth: { uid } })) as {
      sessionId: string;
    };

    // First use — should succeed
    await submitScore(
      { score: 1_000, wave: 1, username: 'ReplayUser', sessionId: sessionResult.sessionId },
      { auth: { uid } }
    );

    // Second use — should be rejected (replay detection)
    await expect(
      submitScore(
        { score: 500, wave: 1, username: 'ReplayUser', sessionId: sessionResult.sessionId },
        { auth: { uid } }
      )
    ).rejects.toThrow(/already been used/);
  });

  it('rejects session token that belongs to a different user', async () => {
    // Start session as user A
    const sessionResult = (await startSession({}, { auth: { uid: 'user-a' } })) as {
      sessionId: string;
    };

    // Submit score as user B using user A's token
    await expect(
      submitScore(
        { score: 1_000, wave: 1, username: 'UserB', sessionId: sessionResult.sessionId },
        { auth: { uid: 'user-b' } }
      )
    ).rejects.toThrow(/does not belong/);
  });

  it('rejects expired session tokens', async () => {
    const uid = 'expired-session-user';

    // Create a session with an already-expired timestamp
    // We can't manipulate time via the API, so create a session document directly
    const expiredSessionId = 'expired-session-test-id-1234';
    await admin.firestore().doc(`_sessions/${expiredSessionId}`).set({
      userId: uid,
      sessionId: expiredSessionId,
      createdAt: Date.now() - 700_000, // 700 seconds ago (over 10 min TTL)
      expiresAt: Date.now() - 100_000, // Expired 100 seconds ago
      used: false,
    });

    await expect(
      submitScore(
        { score: 100, wave: 1, username: 'ExpiredUser', sessionId: expiredSessionId },
        { auth: { uid } }
      )
    ).rejects.toThrow(/has expired/);
  });

  it('rejects implausibly high scores for session duration', async () => {
    const uid = 'implausible-score-user';

    const sessionResult = (await startSession({}, { auth: { uid } })) as {
      sessionId: string;
    };

    // Immediately submit a score that's too high for zero elapsed time
    await expect(
      submitScore(
        { score: 100_000_000, wave: 100, username: 'Implausible', sessionId: sessionResult.sessionId },
        { auth: { uid } }
      )
    ).rejects.toThrow(/maximum plausible score/);
  });
});
