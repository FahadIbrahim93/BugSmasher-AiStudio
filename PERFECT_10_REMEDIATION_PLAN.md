# Perfect 10/10 Remediation Plan — Audit Reconciliation

_Date: 2026-06-29_

## Manager Summary

Claude's supplied audit is valuable as a risk model, but it describes an older Supabase-era repository. The current codebase has already moved to Firebase, includes CI, includes `vite-plugin-pwa`, includes `@vitest/coverage-v8`, and has 452 passing tests. Treat Claude's Supabase key findings as **historical/rotation reminders**, not current source findings, unless git history or the live Supabase dashboard proves otherwise.

The best path is not to chase outdated Supabase fixes. The best path is to close the **current** trust-boundary, coverage, and release-gate gaps verified in this repo.

## Reconciled Findings

| Area | Claude claim | Current repo reality | Decision |
|---|---|---|---|
| Supabase secrets | Supabase keys in `.env.example` / `supabaseConfig.ts` / README | No active Supabase source/config/test credential findings in current tree; Firebase is active | Do not add Supabase code. Human should still rotate any historical keys if they ever existed in public git history. |
| Missing `vite-plugin-pwa` | Missing dependency breaks clean build | Present in `devDependencies`; build succeeds | Already resolved. Keep build verification. |
| No CI | No `.github/workflows` | CI workflow exists and runs lint, functions build, coverage, build | Improve gates; do not recreate. |
| Coverage tooling missing | `@vitest/coverage-v8` absent | Present, but coverage thresholds fail | Add meaningful tests until thresholds pass; do not lower thresholds. |
| Client score integrity | Client-authoritative leaderboard | Still valid in current Firebase implementation before this work | Fixed direction: server callable + rules deny direct writes. |
| Cloud save integrity | Client/server checksum confusion | Still valid before this work: direct writes plus post-write function | Fixed direction: server callable computes secret checksum + rules deny direct save writes. |
| Tooling standards | `lint` is typecheck only | Still true | Add ESLint/Prettier after security boundary and coverage recovery. |
| Documentation inflation | 10/10 claims | Still partially true in older docs | Continue replacing claims with evidence-backed status. |

## Best Possible Plan to Reach Real 10/10

### P0 — Trust Boundaries and Honest Release Gate (now)
1. Deny direct client writes to cloud saves and leaderboards in Firestore rules.
2. Route cloud saves through authenticated callable function that computes server checksum.
3. Route leaderboard writes through authenticated callable function with sanity checks and monotonic high-score preservation.
4. Remove PII from Firestore error logs.
5. Preserve normal local/offline UX while making cloud/competitive paths server-authoritative.
6. Keep audit docs honest about remaining gaps.

### P1 — Coverage and Reliability (next work block)
1. Add tests for callable-backed `FirebaseService` save/leaderboard paths.
2. Add Firebase emulator tests for Firestore rules:
   - direct `private/saves` write denied
   - direct `leaderboard/{uid}` write denied
   - callable/admin writes accepted
3. Add high-value tests for `SoundManager`, `PCGSystem`, `IndexedDBSaveSystem`, and `FirebaseService` error branches.
4. Stabilize test isolation: restore mocks/timers after each test; pin date-sensitive tests with `vi.setSystemTime`.
5. Make `npm run ci` and GitHub coverage gates converge once coverage passes.

### P2 — Standards Tooling
1. Add ESLint flat config with TypeScript, React hooks, and accessibility rules.
2. Split current `lint` into `typecheck` and true `lint`; make `ci` run both.
3. Add Prettier only after ESLint is green, to avoid noisy mixed-purpose diffs.
4. Add Dependabot and CodeQL/security scanning.

### P3 — Architecture and Performance
1. Extract `CombatSystem` from `GameEngine`.
2. Extract `BugBehaviorSystem` from `GameEngine`.
3. Replace static `ProgressionManager` / `StatsManager` access with injected interfaces on engine paths.
4. Remove the deprecated `__gameEngineStatus` window bridge after consumers are migrated.
5. Fix Vite manual chunk circular warning and static/dynamic import conflict.
6. Add Lighthouse/Playwright smoke tests and a frame-time benchmark harness.

### P4 — Business Productionization
1. Either implement real analytics/monetization/ad providers with privacy review, or explicitly de-scope them from production claims.
2. Define product acceptance criteria for saves, leaderboards, daily challenge, accessibility, and offline mode.
3. Add runtime monitoring, alerting, rollback docs, and incident checklist.

## Coaching Guidance

- Do not optimize for looking 10/10; optimize for evidence that survives hostile review.
- Never mark a feature complete if it is a stub, localStorage-only entitlement, or console-only telemetry.
- Security work beats code style. Coverage work beats new features. Automated proof beats claims.
- The project is recoverable and strong, but only if docs stop overstating reality.
