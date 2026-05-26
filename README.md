# BugSmasher NextGen

A brutalist OS-themed Canvas shooter with procedural assets and 60fps particle chaos.

[![Test Coverage](https://img.shields.io/badge/tests-112%20passing-brightgreen)](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)

## Stack

- Vite + React 19 + TypeScript 5.8 (strict)
- Canvas renderer with CRT/bioluminescent effects
- Procedural audio via Web Audio API (zero external assets)
- Firebase auth + Firestore (leaderboard, cloud progression)
- PWA via vite-plugin-pwa

## Development

```bash
npm install
npm run dev      # localhost:3001
npm test         # 112 tests passing (12 files)
npm run build    # production
```

## Architecture

- `src/core/GameEngine.ts` — 60fps game loop (dash, resources, boss variants, hazards)
- `src/lib/` — Pure logic modules (singletons)
  - `GameConfig.ts` — All game constants
  - `ProgressionManager.ts` — Resources, skills, crafting, cloud sync, prestige
  - `Renderer.ts` — Canvas rendering with CRT, biomes, lighting, glitch
  - `ParticleSystem.ts` — Object-pooled VFX
  - `SoundManager.ts` — Procedural audio synthesis
  - `AssetManager.ts` — Pre-renders sprites to offscreen canvases
  - `UpgradeSystem.ts` — Crystal economy with 50+ upgrades
  - `AchievementSystem.ts` — 22 achievements
  - `DeathCardGenerator.ts` — Canvas 1200×630 death card PNG
  - `LeaderboardService.ts` — Firebase Firestore top 20 with offline cache
- `src/managers/` — WaveManager (6 biomes + surge + bosses), StoryManager (50 waves, 6 acts)
- `src/components/` — MainMenu, HUD, UpgradeMenu, GameOver, ProgressionCenter, Leaderboard, AccountMenu, StorySceneRenderer, TutorialOverlay, SettingsMenu, ErrorBoundary
- `src/contexts/AuthContext.tsx` — Firebase Google auth with auto-registration

## Controls

- Click bugs to smash, collect resources, survive waves
- Swipe to dash (mobile), click-drag dash (desktop)
- Boss waves every 10th wave
- 6 biomes, 22 achievements, 50+ upgrades, 8 skills, 3 consumables

## Milestone

**v2.3.0** — Playable release with full progression loop, Firebase auth + leaderboard, mobile touch, and 112 passing tests.
