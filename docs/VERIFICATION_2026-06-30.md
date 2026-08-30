# Session Verification — 2026-06-30

Evidence for Phase 1 (security boundary) and Phase 2 (coverage recovery) work completed in this session.

## Commands run (repo root)

| Command                      | Result   | Notes                                         |
| ---------------------------- | -------- | --------------------------------------------- |
| `npm run lint`               | **PASS** | `tsc --noEmit`, 0 errors                      |
| `npm run test:coverage`      | **PASS** | 507/507 frontend tests; thresholds met        |
| `npm run validate:functions` | **PASS** | `npm ci` + build + 4 schema unit tests        |
| `npm run test:emulator`      | **PASS** | 17 integration tests (7 rules + 10 callables) |
| `npm run build`              | **PASS** | Vite + esbuild; bundle warnings unchanged     |

Full gate: `npm run ci` runs all of the above in sequence.

## Test inventory

| Suite                        | Location                            | Count |
| ---------------------------- | ----------------------------------- | ----: |
| Frontend unit/integration    | `src/**/*.test.ts`                  |   507 |
| Functions schema unit        | `functions/test/saveSchema.test.ts` |     4 |
| Firestore rules (emulator)   | `functions/test/rules.test.ts`      |     7 |
| Callable handlers (emulator) | `functions/test/callables.test.ts`  |    10 |

## Coverage (engine/lib gate)

Scoped in `vitest.config.ts` to `src/game/**` and `src/lib/**` (production stubs excluded).

| Metric     | Actual | Interim threshold | Phase 2b target |
| ---------- | -----: | ----------------: | --------------: |
| Lines      | 77.77% |                77 |              80 |
| Statements | 76.82% |                76 |              80 |
| Functions  | 80.03% |                75 |              75 |
| Branches   | 62.15% |                61 |              70 |

Lowest branch coverage: `GameEngine.ts`, `WaveManager.ts`, `SaveManager.ts`, `InputSystem.ts`.

## Security boundary (Phase 1)

Implemented under `functions/src/`:

- `saveSchema.ts` — Zod validation for cloud saves
- `validation.ts` — checksum + monotonic score checks
- `rateLimit.ts` — Firestore-backed limits (10 saves/min, 5 score submits/min per user)
- `handlers.ts` — `saveGameData`, `submitScore` callables
- `checksum.ts` — lazy `CHECKSUM_SALT` with emulator test fallback

Emulator tests prove:

- Direct client writes to `users/{uid}/save` and `leaderboard` are **denied**
- Unauthenticated callables are **rejected**
- Invalid checksums, schema violations, and rate limits are **rejected**
- Monotonic high-score updates are **enforced**

## Prerequisites

- **Node.js** 20+ (CI uses 22)
- **Java JDK 21+** for `npm run test:emulator` (JDK 17 works today; firebase-tools v15 will require 21)
- **Firebase CLI** via `firebase-tools` devDependency

See [EMULATOR_TESTING.md](./EMULATOR_TESTING.md) for local setup and troubleshooting.

## 2026-08-15 addendum — refactor backlog & gate changes

Verified after the A-01…A-08 / ST-01…ST-03b refactor backlog merged to `main`:

| Command                      | Result   | Notes                                                                                           |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `npm run typecheck`          | **PASS** | `tsc --noEmit`, 0 errors                                                                        |
| `npm run lint:eslint`        | **PASS** | **0 errors** (908 advisory warnings) — now a hard CI gate                                       |
| `npm run test:coverage`      | **PASS** | 651/651 frontend tests; thresholds met                                                          |
| `npm run validate:functions` | **PASS** | `npm ci` + build + 6 schema unit tests                                                          |
| `npm run test:emulator`      | **PASS** | 26 integration tests (7 rules + 19 callables)                                                   |
| `npm run build`              | **PASS** | zero bundle warnings                                                                            |
| `npm run test:e2e`           | **PASS** | 5/5 Playwright specs (wave transition, fury cooldown, save/load rage, endless, game-over retry) |

Coverage (engine/lib gate) at 2026-08-15: lines 79.17% · statements 78.12% · functions 84.57% · branches 66.02% — all above interim thresholds (77/76/75/61).

Changes since 2026-06-30: `@ts-nocheck` removed from all renderers and audio modules (zero remain in `src/`); ESLint re-promoted to a **blocking** CI step (was advisory, `continue-on-error: true`); `npm run ci` now fails on lint errors. Playwright E2E suite added and passing.

## 2026-08-16 addendum — coverage gates met, FURY regression fixed, security hardening

Two independent hardening sessions landed the same day; combined evidence:

| Command                 | Result   | Notes                                                                       |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `npm run typecheck`     | **PASS** | `tsc --noEmit`, 0 errors                                                    |
| `npm run lint:eslint`   | **PASS** | **0 errors** (908 advisory warnings) — blocking CI gate                     |
| `npm run test:coverage` | **PASS** | 750/750 frontend tests; **Phase 2b thresholds met**                         |
| `npm run test:emulator` | **PASS** | 26 integration tests (7 rules + 19 callables)                               |
| `npm run build`         | **PASS** | zero bundle warnings                                                        |
| `npm run test:e2e`      | **PASS** | 5/5 Playwright specs, incl. wave-transition + fury-cooldown exercising FURY |

Coverage (engine/lib gate) at 2026-08-16: lines 81.88% · statements 80.92% · functions 86.13% · branches 70.38% — **above the Phase 2b production targets (80/70/75/80)**, now the enforced thresholds in `vitest.config.ts`.

Changes since 2026-08-15:

- **FURY damage regression fixed** — A-01's CombatSystem extraction duplicated the FURY multiplier (`* 2.0` twice), silently making FURY 4x instead of 2x. Verified as the only transcription error via method-level diff against pre-extraction source; pinned by a regression test asserting exactly 2x.
- **Direct test suites added** for the two extracted systems that had none: `CombatSystem.test.ts` (39 tests, 82.84% lines) and `BugBehaviorSystem.test.ts` (15 tests). ~60 more branch tests across 10 small modules.
- **Session-token anti-cheat (S-06 / P1-07) verified DONE** — server `sessionToken.ts` with atomic replay protection, client `startSession` flow in `SaveManager`, 19 emulator tests covering replay/cross-user/expiry/plausibility/rate-limit/monotonic. The docs were stale; the code was complete. Additionally, `assertPlausibleSessionScore()` was hardened so a newly-created session cannot bypass the plausibility cap (5-second minimum elapsed-time floor).
- **S-08 PII removal** — `handleFirestoreError` logs a presence-only `authenticated` flag instead of the raw uid; error paths are uid-redacted (`<uid>`); AuthContext's profile-listen payload drops uid/email/emailVerified. Tests pin both offline and authenticated cases.
- **S-09 dependency audit gates** — blocking `npm audit --omit=dev` for root (0 vulns) in CI plus `security-audit.yml` (high-severity gate, main branch); functions gated at high/critical. Eliminated the one critical (websocket-driver) and one high (form-data) via surgical overrides (`^0.7.5`, `^2.5.6`); 10 low/moderate transitive findings remain via firebase-admin, waived in S-09.
- **S-07 legacy save handling verified done** — invalid-checksum docs rejected (tested); no-checksum docs load with a warning. No distinct legacy format exists in history to backfill.
- **E2E flake hardened** — `dismissOverlays` closes a stray-click-opened ProgressionCenter overlay (hit one CI run intermittently).
- **README corrected** — stale test counts and overstated accessibility/production claims removed; `SESSION.md` updated with current evidence policy.

## Remaining release gates

- Production stub replacement / explicit de-scope (`ads`, `monetization`, `monitoring`, analytics, crash reporting, telemetry consent)
- True constructor DI for StatsManager/ProgressionManager (A-03 partial — instance singletons shipped)
- Dependency audit follow-up: migrate `firebase-tools` (dev-only) when a non-breaking major lands; fresh CI evidence for `security-audit.yml`
- Decide whether competitive integrity requires authoritative gameplay-run summaries beyond server-issued one-time sessions
- Complete evidence-backed WCAG 2.2 AA audit
- ESLint advisory-warning burn-down (908 warnings; not a blocking gate)
