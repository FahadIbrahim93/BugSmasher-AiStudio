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
