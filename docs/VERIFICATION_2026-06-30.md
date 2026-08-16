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

## Remaining release gates

- Phase 2b: raise coverage thresholds to 80/70/75/80; deepen `GameEngine` / `WaveManager` branch tests
- Session-token anti-cheat for competitive leaderboard (TASKBOARD P1-07)
- Dependency audit; production stub replacement (`ads`, `monetization`, `monitoring`)
- ESLint advisory-warning burn-down (908 warnings; not a blocking gate)
