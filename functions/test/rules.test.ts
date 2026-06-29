import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-bugsmasher';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore security rules', () => {
  it('denies unauthenticated reads of private saves', async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(ctx.firestore().doc('users/alice/private/saves').get());
  });

  it('allows owner to read private saves', async () => {
    const ctx = testEnv.authenticatedContext('alice');
    await assertSucceeds(ctx.firestore().doc('users/alice/private/saves').get());
  });

  it('denies direct client write to private saves', async () => {
    const ctx = testEnv.authenticatedContext('alice');
    await assertFails(
      ctx.firestore().doc('users/alice/private/saves').set({
        userId: 'alice',
        data: { score: 100, wave: 1 },
        checksum: 'fake-checksum',
      })
    );
  });

  it('allows owner to write other private documents', async () => {
    const ctx = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      ctx.firestore().doc('users/alice/private/story').set({ beat: 'intro' })
    );
  });

  it('denies direct client write to leaderboard', async () => {
    const ctx = testEnv.authenticatedContext('alice');
    await assertFails(
      ctx.firestore().doc('leaderboard/alice').set({
        userId: 'alice',
        username: 'Alice',
        score: 999_999,
        wave: 99,
      })
    );
  });

  it('allows public leaderboard reads', async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertSucceeds(ctx.firestore().doc('leaderboard/alice').get());
  });

  it('denies cross-user private access', async () => {
    const ctx = testEnv.authenticatedContext('bob');
    await assertFails(ctx.firestore().doc('users/alice/private/saves').get());
  });
});
