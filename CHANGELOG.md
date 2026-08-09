# Changelog

All notable changes to **BugSmasher** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] — 2026-06-30

### Added

- Cloud Functions: `saveGameData` and `submitScore` callables with Zod schema validation
- Firebase Emulator test suite: 17 integration tests (7 rules + 10 callables)
- Server-side checksum + monotonic high-score enforcement
- Rate limiting (10 saves/min, 5 score submits/min per user)
- `docs/VERIFICATION_2026-06-30.md` with command evidence

### Changed

- Firestore rules: deny direct client writes to `private/saves` and `leaderboard`
- Server-authoritative save/score paths (no more client-trusted leaderboard)
- Coverage thresholds: engine/lib at 77/61/75/76 (interim, Phase 2b target: 80/70/75/80)
- De-scoped analytics, monetization, ads, crash reporting, and monitoring from the 10/10 production release (game stays 100% free with no paywalls)

### Fixed

- 507/507 frontend tests passing
- Security: hardcoded client SALT removed; OAuth scopes minimized

## [2.4.0] — 2026-06-22

### Added

- GitHub Actions CI: lint, functions build, coverage, build
- `@vitest/coverage-v8` — coverage enforcement in CI
- `.env.example` — Firebase config env vars
- PWA: vite-plugin-pwa with Service Worker + runtime caching
- Accessibility: difficulty presets, reduced motion, colorblind filter, gamepad

### Changed

- `AGENTS.md` — honest rating (5.6/10 → 7.2/10), warnings for AI agents
- `src/lib/firebase.ts` — migrated from JSON import to VITE_ env vars
- `vite.config.ts` — runtime caching, PNG icons, chunk optimization

### Fixed

- Firebase config removed from git (`firebase-applet-config.json` gitignored)
- Hardcoded SALT removed from client `checksum.ts`
- 448/448 tests passing (was failing per audit)
- `InputSystem.ts` — added missing `GameConfig` import

### Security

- Env-vars only for Firebase config (no committed secrets)
- Client checksum no longer uses secret salt

## [2.3.0] — 2026-06-15

### Added

- `ParticleEngineHost` — typed particle engine abstraction (no `any`)
- `GameEngineStatusBus` — typed event bus for engine → UI sync
- `AccessibilitySettings` — dedicated module for a11y configuration
- Daily Challenge system with modifiers + cosmetic rewards
- `docs/ARCHITECTURE.md` — mermaid diagrams, module boundaries

### Changed

- Renderer split into 5 sub-modules: `EnvironmentRenderer`, `BugRenderer`,
  `ParticleRenderer`, `UIRenderer`, `PerformanceScaler`
- Systems extracted from `GameEngine`: `CollisionSystem`, `BossSystem`,
  `PowerupSystem`, `HazardSystem`, `InputSystem`
- Cloud Functions modularized into schema, validation, rate limiting, handlers

### Fixed

- Global state bridge deprecated: `(window as any).__gameEngineStatus` → `GameEngineStatusBus`
- Remaining `setTimeout`/`setInterval` for game state → delta-time based

## [2.2.0] — 2026-06-08

### Added

- Armory: cursor skins + core theme customization
- IntelHub: telemetry dashboard with Google Sheets integration
- WorkspaceConsole: real-time system status log
- BiomeBackgroundGallery: visual biome showcase

### Changed

- HUD redesign with real-time FPS monitor
- Improved wave pacing and boss mechanics

## [2.1.0] — 2026-06-01

### Added

- Progression Center: skill tree + resource crafting
- Save/Load system with IndexedDB persistence + cloud save
- Firebase auth with Google Sign-In

### Changed

- Game loop optimization for 60+ FPS target

## [2.0.0] — 2026-05-25

### Added

- Complete game engine rewrite in React 19 + TypeScript + Canvas 2D
- Wave-based base defense with multiple enemy types (scout, tank, healer)
- Boss fights every 10 waves
- Powerup system (hover, collect, burst)
- Particle system with 2D canvas rendering
- Procedural Content Generation (PCG) for resources + hazards
- Sound system with procedural audio generation
- Firebase integration (auth, Firestore, hosting)
- Daily challenges with modifiers
- Achievement system
- i18n support (English + Spanish)
- Accessibility (difficulty, reduced motion, colorblind modes)
- Custom cursor with trail effects

[2.5.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.5.0
[2.4.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.4.0
[2.3.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.3.0
[2.2.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.2.0
[2.1.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.1.0
[2.0.0]: https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/releases/tag/v2.0.0
