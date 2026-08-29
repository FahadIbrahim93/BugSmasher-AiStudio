# BugSmasher — Current Status Ledger

**Status timestamp:** 2026-08-29  
**Branch:** `main`  
**Certification:** NOT CERTIFIED 10/10

## Verified repository state

The latest GitHub Actions evidence inspected for `main` is a failed CI run from 2026-08-26.

### Latest inspected CI outcome

| Gate | Result |
|---|---|
| TypeScript | PASS |
| ESLint | PASS with 908 warnings |
| Functions build | PASS |
| Frontend tests | 651/651 PASS |
| Coverage | ~79.14% lines / 78.06% statements / 84.43% functions / 66.30% branches in that run |
| Firebase emulator | **FAIL: 1 of 26 tests** |
| Production build | SKIPPED because emulator gate failed |
| Playwright | SKIPPED because quality job failed |

### Current known blocker

`functions/test/callables.test.ts` contains a monotonic-score test that submits `50,000` points from a newly created 5-second session. The current anti-cheat plausibility check correctly rejects that value for the session duration. The correct fix is to update the test fixture to a plausible score, not weaken the anti-cheat rule.

## Current engineering direction

Priority order:

1. restore fully green CI;
2. establish dependency/security cleanliness;
3. eliminate static-analysis debt and React correctness warnings;
4. finish meaningful coverage and regression testing;
5. harden competitive integrity;
6. certify accessibility and performance with evidence;
7. complete production operations and deployment verification;
8. enforce repository governance;
9. synchronize documentation;
10. run final adversarial certification.

## Important truth notes

- The project has a real server-issued session-token protection layer; older documents saying session-token anti-cheat is completely absent are stale.
- The current session mechanism is strong nonce/session validation, not full signed deterministic replay verification.
- Production analytics, monetization, ads, monitoring and similar features must be described as real only when the corresponding provider/integration is actually configured and verified.
- Historical verification documents are evidence snapshots, not current truth.
- The README must never contain manually maintained test/coverage/CI numbers that contradict current CI.

## Resume rule

When work resumes after a context switch, start with this file, then `TASKBOARD.md`, then the latest Actions run. Work the first unresolved P0 before starting discretionary improvements.

## Certification rule

Do not change `NOT CERTIFIED` to `CERTIFIED` until `docs/RELEASE_CERTIFICATION.md` is fully satisfied with current evidence.