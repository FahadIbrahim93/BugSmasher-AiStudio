# Changelog

All notable changes to BUGSMASHER are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [2.4.1] - 2026-06-03

### Added
- Enterprise docs: `docs/ENTERPRISE_TRANSFORMATION.md`, `ARCHITECTURE.md`, `PLAYER_GUIDE.md`, ADRs
- Analytics facade (`src/lib/analytics.ts`) with game event wiring
- Colorblind CSS filters on game canvas wrapper
- PWA `manifest.webmanifest` + meta tags
- GitHub PR template, `src/vite-env.d.ts`

### Changed
- Composite readiness: 7.6/10 audit · 8.3/10 enterprise operations

## [2.4.0] - 2026-06-03

### Added
- Comprehensive audit docs: `AUDIT_REPORT.md`, `TASKBOARD.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`
- GitHub Actions CI (lint, test, build, optional Firebase deploy)
- Firebase Hosting config (`firebase.json`, `.firebaserc`)
- `GameEngineStatusBus` — typed HUD/cursor state sync
- `AccessibilitySettings` — difficulty, reduced motion, gamepad, enemy shapes
- Engine systems: `CollisionSystem`, `BossSystem`, `PowerupSystem`, `HazardSystem`
- Renderer sub-modules under `src/game/rendering/`
- Daily challenges, Armory cosmetics UI
- 409 unit tests (16 test files)
- `npm run ci`, `npm run deploy:hosting`, `npm run deploy:rules`

### Changed
- Overall quality rating: 6.1 → **7.4/10** (pre-production)
- `package.json` name `bugsmasher`, version `2.4.0`
- `CustomCursor` uses event bus instead of window global
- `ParticleSystem` uses `ParticleEngineHost` interface
- Settings menu: accessibility section

### Fixed
- Flaky `PowerupSystem` tank resource test (deterministic RNG)
- React hooks ordering in `CustomCursor`

### Deployment
- Branch: `release/v2.4.0-preproduction`
- Tag: `v2.4.0`
- Remote: https://github.com/HopeTheoory/BugSmasher-ApZz

## [2.3.0] - Prior milestone
- Initial BugSmasher NextGen with Firebase auth and PWA support