# BugSmasher NextGen

A brutalist OS-themed Canvas shooter with procedural assets and 60fps particle chaos.

[![Test Coverage](https://img.shields.io/badge/tests-68%20passing-brightgreen)](https://github.com/HopeTheory/BugSmasher_v2-)

## Stack
- Vite + React + TypeScript + Tailwind v4
- Canvas renderer with CRT/bioluminescent effects
- Procedural audio via Web Audio API

## Development
```bash
npm install
npm run dev      # localhost:3001
npm test         # 68 tests passing
npm run build    # production
```

## Architecture
- `src/core/GameEngine.ts` — 60fps game loop
- `src/lib/AssetManager.ts` — pre-renders sprites to offscreen canvases
- `src/lib/Renderer.ts` — full Canvas rendering with biome effects
- `src/lib/UpgradeSystem.ts` — crystal economy persistence

## Controls
- Click bugs to smash, collect crystals, survive waves
- Boss waves every 10th wave
- 22 achievements, 50+ upgrades