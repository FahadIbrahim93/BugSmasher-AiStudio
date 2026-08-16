# Application Context & Standards

## Project Overview

This is a high-intensity, FAANG-level React/TypeScript game engine using Canvas 2D.
It follows a modular architecture where the `GameEngine` orchestrates several systems.

## Audit Status (June 30, 2026, Verified - HONEST)

**Overall Rating: ~7.5/10** — Functional and improving toward production readiness. TypeScript, functions build, **507** frontend tests, **21** functions/emulator tests, coverage thresholds (engine/lib), and production build all pass locally and in CI. Cloud save and leaderboard writes route through callables with Zod schema, rate limits, and emulator proof. ESLint is a **hard CI gate** (zero errors as of 2026-08); session-token anti-cheat, dependency audit, and production-stub replacement remain release gates.

See `docs/VERIFICATION_2026-06-30.md`, `CTO_AUDIT_2026-06-29.md`, and `PERFECT_10_REMEDIATION_PLAN.md`. Treat older 10/10 claims as stale unless revalidated with tools.

| Category                      | Rating | Key Issue                                                                                                                                             |
| ----------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security & Data Integrity     |   8/10 | Callable paths + emulator tests + Zod/rate limits; session-token anti-cheat still open                                                                |
| Test Coverage & Reliability   |   7/10 | 507/507 pass; engine/lib ~78% lines / ~62% branches (interim thresholds met)                                                                          |
| Standards & Compliance        |   7/10 | TypeScript (tsc) and ESLint (zero errors) are both hard CI gates and pass; dependency audit incomplete |
| Code Quality & Structure      |   7/10 | Systems extracted; GameEngine, SoundManager, HUD, IntelHub remain large                                                                               |
| Performance & Scalability     |   7/10 | DPR/performance scaler exists; build warns about circular chunks and large Firebase vendor chunk                                                      |
| Architecture & Modularity     |   7/10 | Renderer split + functions modularized; static managers and GameEngine creep remain                                                                   |
| Team Collaboration Readiness  |   8/10 | CI, emulator docs, verification evidence; historical audit docs still need archival                                                                   |
| Business Objectives Alignment |   7/10 | Core game substantial; monetization, ads, analytics are not production-real                                                                           |

**Action for agents:** Read `docs/AGENTIC_WORKFLOW.md` first. Claim one TASKBOARD ID per branch. Verify with `npm run ci`. Never push to `main` directly. Search for "SALT", "Supabase", "firebase-applet-config". Update verification docs when gates change. Fix issues; do not paper over.

> **ESLint status (2026-08):** ESLint is a **hard CI gate** — `eslint .` runs blocking on every push and passes with **zero errors** (908 advisory warnings remain, all stylistic/type-strictness hints). New work must not add lint errors. `tsc --noEmit` remains the primary type gate.

## Architecture Standards

- **Systems over Monoliths**: Avoid adding logic directly to `GameEngine.ts`. Extract specialized systems (e.g., `InputSystem`, `CollisionSystem`) to keep the engine lean.
  - Renderer delegates to `src/game/rendering/{Environment,Bug,Particle,UIRenderer}.ts` + `PerformanceScaler.ts`.
  - HUD sync uses `GameEngineStatusBus` — do not reintroduce `(window as any).__gameEngineStatus`.
- **Strict Timing**: NEVER use `setTimeout` or `setInterval` for game state. Use delta-time (`dt`) passed through the `update` loop.
- **Type Safety**: Core entities (`Bug`, `Powerup`, `Hazard`) are defined in `src/game/GameTypes.ts`. Always import from there to avoid circular dependencies.
- **Service Isolation**: Third-party services like Firebase should be abstracted or kept in specialized contexts (`AuthContext`).

## Implementation Guidelines

- **Brutal Honesty**: If a feature is implemented with "magic numbers" or hacks, document the technical debt immediately.
- **Performance**: High DPR is capped manually for mobile. Always check `isMobile` before intensive rendering effects (like `shadowBlur`).
- **Observability**: Game events should be logged internally for debugging and potentially surfaced to the player in "Intel" or "Terminal" components.

## Coding Standards (Post-Audit)

- **No `any` types in engine code**: Use `ParticleEngineHost`, `GameTypes.ts`. UI components still have `any` — see TASKBOARD P1-06.
- **No global state buses**: Use `GameEngineStatusBus.subscribe()` from React; legacy window sync is deprecated.
- **Prefer dependency injection over static managers**: Static service locators (ProgressionManager, StatsManager) make testing difficult — refactor with proper DI.
- **Test coverage target**: All new systems must have >80% test coverage. No merging without tests.
- **No client-side-only security**: Client-side checksums and validations must be mirrored with server-side enforcement.

## Documentation & Deployment

| Doc                               | Use when                                                  |
| --------------------------------- | --------------------------------------------------------- |
| **`docs/AGENTIC_WORKFLOW.md`**    | **Git, PR, parallel agents, version, verification gates** |
| `CONTRIBUTING.md`                 | First PR / human onboarding                               |
| `DEPLOYMENT.md`                   | Shipping to Firebase / configuring CI secrets             |
| `TASKBOARD.md`                    | Picking next implementation task (10/10 roadmap)          |
| `docs/VERIFICATION_2026-06-30.md` | Current CI/security/coverage evidence                     |
| `docs/ARCHITECTURE.md`            | Module boundaries before engine changes                   |
| `CTO_AUDIT_2026-06-29.md`         | Understanding quality gaps                                |

**Pre-push:** `npm run ci` · **Branch:** `feat/*` → PR to `main` (never direct push) · **Release:** DEPLOYMENT.md · **Version:** `package.json` (2.5.0 — bump on release PR only)

## Recent Refactors (Completed June 2026)

- Split `Renderer` into `src/game/rendering/*` sub-modules.
- `GameEngineStatusBus`, `AccessibilitySettings`, `ParticleEngineHost`.
- GitHub Actions CI (`.github/workflows/ci.yml`).

## Earlier Refactors (May 2026)

- extracted `InputSystem` from `GameEngine`.
- centralize `GameTypes.ts`.
- remove `supabase` (unused).
- replace all `setTimeout` with `dt` based game timers.
