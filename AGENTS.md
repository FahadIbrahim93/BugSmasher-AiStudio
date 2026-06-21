# Application Context & Standards

## Project Overview
This is a high-intensity, FAANG-level React/TypeScript game engine using Canvas 2D. 
It follows a modular architecture where the `GameEngine` orchestrates several systems.

## Audit Status (June 2026, Verified - HONEST)
**Overall Rating: 5.6/10** (per independent CTO audit). Pre-Alpha prototype with polished facade.
Security is critically broken (2/10). Do not trust previous self-ratings.

See `AUDIT_HONEST.md` and the full Claude CTO audit report for details.

| Category | Rating | Key Issue |
|---|---|---|
| Security & Data Integrity | 2/10 | CRITICAL: Hardcoded client salt, firebase key in git |
| Test Coverage & Reliability | 5.5/10 | 3 failing tests (missing import in InputSystem); coverage not enforced |
| Standards & Compliance | 5/10 | Docs lies (README Supabase vs Firebase); no CSP |
| Code Quality & Structure | 6.5/10 | SoundManager God Object (1368+ lines); 50+ public fields on GameEngine |
| Performance & Scalability | 6/10 | 2.6MB PWA precache; WAV audio; heavy Firebase chunk |
| Architecture & Modularity | 7/10 | Good systems, but static singletons |
| Team Collaboration Readiness | 7/10 | Good agent docs, but AGENTS.md was misleading |
| Business Objectives Alignment | 5/10 | Stub analytics/monetization; fake leaderboard seeds |

**Action for agents: Always verify with `npm test`, `npm run build`, grep for "SALT", "Supabase", "firebase-applet-config". Fix issues, do not paper over. Update this section with real findings.**

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
| `AUDIT_REPORT.md` | Understanding quality gaps |

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
