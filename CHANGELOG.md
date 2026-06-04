# Changelog

All notable changes to BUGSMASHER are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [2.5.0] - 2026-06 (feat/enterprise-10x-elevation)

### Added
- Full 10/10 enterprise elevation (see docs/2026_10X_TRANSFORMATION_ROADMAP.md + 10X_ELEVATION_FINAL_REPORT.md)
- `vite-plugin-pwa` + brutalist PWA icons (192/512) + SW precache + offline audio cache (true installable + 2026 PWA)
- `QUALITY_PRESETS` (Ultra/High/Balanced/Mobile) + crt/heat/emissive/glow tunables in PerformanceScaler (ported concepts from pro three.js adaptive example; no direct import possible — Canvas 2D stack)
- PR preview channels (Firebase `pr-N`) + functions validation in CI
- `validate:functions` + full `npm run ci` gate
- Bundle manualChunks (main app now ~290kB from 1.19MB; react/motion/firebase/vendor)

### Changed
- CI: root lint + functions + tests + build; deploy job supports previews + live
- tsconfig excludes functions/; functions import v1 for tsc + lock committed
- Renderer/Environment/BugRenderer wired to new preset scalars
- Tests fixed + 411/411 green; git hygiene (gitignore functions/lib, conventional on feat branch)
- PWA manifest now sourced in vite config (removed dupe public/)
- index.html cleaned for plugin injection
- Composite: ~9.3/10 (perf/ops/docs strong gains; see final report)

### Fixed
- InputSystem dash Space test (code + start consistency)
- Root tsc on functions (exclude + CI step)
- Large chunk warnings (splits + limit 600)

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

## [2.5.1] - 2026-06 (Portfolio Polish + P6 Features)

### Added
- **P6-A: Backend Ops** — Analytics events wired (powerup_collected, achievement_unlocked, daily_challenge_start, settings_changed), analytics.identify() on Firebase Auth login, leaderboard auto-sync on game over, functions deploy config
- **P6-B: E2E Smoke Tests** — 9 Playwright tests covering all critical paths (app load, settings, armory, daily challenge, language switch, leaderboard, account, achievements, game start HUD)
- **P6-C: Production Audio** — All 7 WAV assets now prioritized over procedural synth fallbacks (shoot, splat, ui_click, ui_hover, powerup, hit_base, boss_warning)
- **P6-D: Gameplay Depth** — 2 new enemy types: Sniper (ranged laser, wave 7+) and Burrower (burrow/emerge cycle, wave 12+). 4 wave modifiers (no_healers, armored, swarm, toxic_regen) with 20% roll chance. Full BugRenderer visuals + shape markers
- **IntelHub** — Class-IV Advanced Threats section with tactical descriptions for Sniper and Burrower (EN + ES)
- **`.env.example`** — Comprehensive documentation for all environment variables (PostHog, ads, monetization)

### Changed
- README.md fully rewritten for GitHub portfolio showcase (badges, architecture diagram, tech stack table, feature list)
- Removed duplicate `vite` dependency from package.json
- Removed unused `ResourceType` import from IntelHub.tsx
- Removed debug `console.log` from AchievementManager.ts
- Updated SSOT ratings: Architecture 8.8→9.0, Game Design 8.0→9.2, Testing 9.3→9.3, Overall 7.9→8.2

### Fixed
- Burrower `decideType` dead code — sniper's shared `Math.random()` was swallowing burrower's `r < 0.06` check (now uses independent roll)

## [2.3.0] - Prior milestone
- Initial BugSmasher NextGen with Firebase auth and PWA support