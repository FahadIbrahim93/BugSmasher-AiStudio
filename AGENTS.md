# BugSmasher Next-Gen — Agent Guide

## Stack
- Vite + React 19 + TypeScript 5.8 (strict)
- Tailwind CSS v4, Canvas-based game rendering (no React DOM for game objects)
- Procedural Web Audio API (zero external audio assets)
- PWA via vite-plugin-pwa (service worker, offline support)

## Architecture

### Source Layout
```
src/
  core/GameEngine.ts       — 614-line 60fps game loop: dash, resources, boss variants, hazards
  lib/                     — Pure logic modules (singletons)
    GameConfig.ts          — All game constants, typed configs
    ParticleSystem.ts      — Object-pooled VFX (particles, splatters, shockwaves, lasers, muzzle flashes)
    AssetManager.ts        — Pre-renders bug/powerup sprites to offscreen canvases
    Renderer.ts            — 459-line Canvas rendering: CRT, biomes, boss cutscenes, glitch, lighting, active UI
    SoundManager.ts        — Procedural audio synthesis
    SaveManager.ts         — localStorage persistence for stats/settings
    UpgradeSystem.ts       — Crystal economy + typed upgrade defs
    AchievementSystem.ts   — 22 achievements with unlock checks
    DeathCardGenerator.ts  — Canvas-based 1200×630 death card PNG
  managers/
    WaveManager.ts         — Biome progression (6+ biomes), prestige biomes, surge system, boss waves
    StoryManager.ts        — 50-wave narrative across 6 acts
  components/
    MainMenu.tsx, HUD.tsx, UpgradeMenu.tsx, GameOver.tsx (w/ DeathCard share)
    StorySceneRenderer.tsx, TutorialOverlay.tsx, SettingsMenu.tsx (w/ achievements list)
    ErrorBoundary.tsx
  types/index.ts           — Bug (w/ variantId, armor, phase, isShielded, webTimer), Hazard, Powerup, Resource, GameState
  App.tsx                  — Phase-based UI routing, canvas + overlay orchestration
  __tests__/               — 68 tests across 8 files
```

## Key Features Ported from GitHub
- **Dash mechanics**: coreX/coreY movement with cooldown/duration/distance, push/damage bugs, trail particles
- **Resource system**: scrap/plasma/alloy/flux/neural_core drops from bugs, magnet pull, auto-collect
- **Boss variants**: Arachne (web hazards), Mandible (armor cycle), Moth (control distortion)
- **Hazard types**: Barrage (retargetable AoE), Web (speed slowdown), Lava (tick damage)
- **Biome mechanics**: Void abyss teleport, golden spire regen, prestige biomes (golden_cache, golden_spire)
- **Renderer effects**: Boss intro cutscenes, boss warning flash, glitch overlay, scanlines with pulse, lighting pass, active powerup UI, dynamic mesh distortion
- **Progression**: Consumable support (repair_kit, emp_generator, overdrive_chip)

### State Management
- **No Zustand/Redux** — game state flows through `GameEngine.state` → `onStateChange` callback → React `useState`
- Phase-based UI: `menu → playing → paused → upgrade → story → gameOver`
- Persistent state: `localStorage` via `SaveManager`, `UpgradeSystem`, `AchievementSystem` singletons

### Key Conventions
- **No comments** in production code
- `no-unused-vars` as error (prefix with `_` to suppress)
- No `any` casts in production code (tolerated in test files with eslint-disable)
- No external audio/image assets — everything procedural
- No React state for game objects — Canvas renders from GameEngine arrays
- Barrel exports: `@/lib`, `@/components`, `@/managers`

### Testing
- `vitest` with `jsdom` for Canvas tests
- `npm test` — vitest run
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — eslint
- Test files under `src/__tests__/*.test.ts`
- Each module's edge cases in separate `.edge.test.ts` file

### Available Scripts
- `npm run dev` — dev server on port 3001
- `npm run build` — production build + PWA generation
- `npm test` — run tests
- `npm run typecheck` — TS check
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Critical Rules
1. Never import from a path that doesn't exist (use barrel exports)
2. Never add external dependencies without checking package.json
3. Never add code comments to production files
4. Never use `any` in production code
5. Always run `typecheck + lint + test + build` after changes
