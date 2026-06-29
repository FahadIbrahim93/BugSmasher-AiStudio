# Application Context & Standards

## Project Overview
This is a high-intensity, FAANG-level React/TypeScript game engine using Canvas 2D. 
It follows a modular architecture where the `GameEngine` orchestrates several systems.

## Audit Status (June 29, 2026, Verified - HONEST)
**Overall Rating: 7.2/10** — Functional and improving, but not a verified 10/10 production codebase. TypeScript, functions build, normal unit tests, and production build pass; production build still has bundle warnings. Cloud save and leaderboard writes now route through callable functions with direct client writes denied in Firestore rules, but emulator coverage, full anti-cheat telemetry, coverage recovery, real linting, and production-stub replacement remain release gates.

See `CTO_AUDIT_2026-06-29.md`, `AUDIT_HONEST.md`, and the full Claude CTO audit report for details. Treat older 10/10 claims as stale unless revalidated with tools.

| Category | Rating | Key Issue |
|---|---:|---|
| Security & Data Integrity | 7/10 | Callable save/leaderboard write paths added and direct client writes denied; emulator tests, stronger schema validation, and real anti-cheat telemetry still needed |
| Test Coverage & Reliability | 5/10 | 452/452 normal tests pass, but coverage still fails configured thresholds at ~60% lines / ~46% branches |
| Standards & Compliance | 6/10 | TypeScript passes and CI exists; dependency audit was blocked by registry 403; accessibility/performance/security gates are incomplete |
| Code Quality & Structure | 7/10 | Systems are extracted, but GameEngine, SoundManager, HUD, IntelHub, and WorkspaceConsole remain large |
| Performance & Scalability | 7/10 | DPR/performance scaler exists, but build warns about circular chunks and static/dynamic import conflicts; Firebase/vendor chunks are large |
| Architecture & Modularity | 7/10 | Renderer split is real; static managers, legacy status bridge, and GameEngine responsibility creep remain |
| Team Collaboration Readiness | 7/10 | Docs and CI exist; README/deployment/security docs are more honest, but older historical audit docs still need archival |
| Business Objectives Alignment | 7/10 | Core game is substantial; monetization, ads, and analytics are not production-real |

**Action for agents: Always verify with `npm test`, `npm run build`, and searches for "SALT", "Supabase", "firebase-applet-config". For release work, also run `npm test -- --coverage`, functions build, dependency scanning, and Firebase emulator tests. Fix issues; do not paper over. Update this section with real findings.**

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

| Doc | Use when |
|-----|----------|
| `DEPLOYMENT.md` | Shipping to Firebase / configuring CI secrets |
| `CONTRIBUTING.md` | Opening PRs, commit format |
| `TASKBOARD.md` | Picking next implementation task |
| `CTO_AUDIT_2026-06-29.md` | Understanding current quality gaps |

**Pre-push:** `npm run ci` · **Release:** follow DEPLOYMENT.md checklist · **Version:** `package.json` (currently 2.5.0)

## Recent Refactors (Completed June 2026)
- Split `Renderer` into `src/game/rendering/*` sub-modules.
- `GameEngineStatusBus`, `AccessibilitySettings`, `ParticleEngineHost`.
- GitHub Actions CI (`.github/workflows/ci.yml`).

## Earlier Refactors (May 2026)
- extracted `InputSystem` from `GameEngine`.
- centralize `GameTypes.ts`.
- remove `supabase` (unused).
- replace all `setTimeout` with `dt` based game timers.
