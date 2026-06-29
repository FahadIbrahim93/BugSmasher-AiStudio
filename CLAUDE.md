# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run these from the repository root (`bugsmasher-aaa/`).

```bash
npm install              # install frontend dependencies
npm run dev              # Vite dev server on 0.0.0.0:3000
npm run build            # production build
npm run preview          # preview production build
npm run lint             # TypeScript check (tsc --noEmit)
npm test                 # run Vitest once
npm run test:watch       # run Vitest in watch mode
npm run ci               # lint + functions build + tests + frontend build
npm run deploy:hosting   # build and deploy Firebase Hosting
npm run deploy:rules     # deploy Firestore rules only
```

Run a single test file:

```bash
npx vitest run src/__tests__/Renderer.test.ts
npx vitest run src/game/GameEngine.test.ts
```

Firebase Functions live in `functions/`:

```bash
cd functions && npm ci && npm run build
cd functions && npm run serve
```

## Project architecture

BUGSMASHER is a React 19 + Vite browser game with a Canvas 2D engine. The React shell owns app state, menus, overlays, auth, and lazy-loaded UI; the canvas engine owns gameplay state, timing, collision, wave orchestration, and drawing.

High-level flow:

1. `src/App.tsx` switches between preloading, main menu, settings/intel overlays, and playing state.
2. `src/components/GameCanvas.tsx` creates and owns a `GameEngine` instance for the canvas lifecycle.
3. `GameEngine.loop(dt)` updates gameplay systems, renders through `Renderer.draw()`, and publishes state through `GameEngineStatusBus`.
4. Firebase integration is isolated under `src/lib/`, `src/contexts/AuthContext.tsx`, and server functions in `functions/src/index.ts`.

## Key boundaries

- `src/game/GameEngine.ts` is the session orchestrator. Avoid adding specialized gameplay logic directly here when a focused system is more appropriate.
- Core systems include `InputSystem`, `WaveManager`, `CollisionSystem`, `BossSystem`, `PowerupSystem`, `HazardSystem`, `ParticleSystem`, and managers for saves/stats/progression/story.
- `src/game/Renderer.ts` coordinates draw order and delegates drawing to `src/game/rendering/*` modules, including `EnvironmentRenderer`, `BugRenderer`, `ParticleRenderer`, `UIRenderer`, and `PerformanceScaler`.
- Shared game entities and interfaces belong in `src/game/GameTypes.ts`; balance constants belong in `src/game/GameConfig.ts`.
- HUD/cursor sync should use `GameEngineStatusBus`, not ad-hoc globals.

## Engine invariants

- Gameplay timing uses delta time (`dt`) from the update loop. Do not use `setTimeout` or `setInterval` for game state.
- Keep rendering separate from game rules: renderers draw; systems update state and resolve mechanics.
- Mobile and reduced-motion paths matter. Check existing `isMobile`, DPR caps, accessibility settings, and performance scaler behavior before adding expensive visual effects.
- Client-side checksums are not authoritative security. Competitive or persistence-sensitive validation must be backed by server-side enforcement.

## Testing and config

- Vitest uses `jsdom` and `src/__tests__/setup.ts` via `vitest.config.ts`.
- Main test coverage lives in `src/__tests__/` plus `src/game/GameEngine.test.ts`.
- CI is represented by `npm run ci`, which also validates Firebase Functions with `cd functions && npm ci && npm run build`.
- Vite aliases `@` to the repository root and uses `vite-plugin-pwa` with audio asset caching.

## Existing docs to consult

- `AGENTS.md` — current agent-specific standards and audit status.
- `docs/ARCHITECTURE.md` — system diagram and module boundary table.
- `DESIGN_DOC.md` — creative vision and core loop.
- `DEPLOYMENT.md` — Firebase deployment and release checklist.
- `CONTRIBUTING.md` — PR and contribution workflow.
- `CTO_AUDIT_2026-06-29.md` / `PERFECT_10_REMEDIATION_PLAN.md` / `TASKBOARD.md` — quality gaps and implementation backlog.
- `security_spec.md` — Firestore security model.
