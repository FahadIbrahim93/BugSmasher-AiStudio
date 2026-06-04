# 🛡️ BUGSMASHER — Tactical QA System

> **Brutalist OS meets bio-luminescent chaos.** A high-intensity, FAANG-grade browser-based base defense game built with React 19 + Canvas 2D.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/Tests-520%20passing-22C55E)](https://github.com/HopeTheoory/BugSmasher-ApZz/actions)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8)](https://github.com/HopeTheoory/BugSmasher-ApZz)
[![Demo](https://img.shields.io/badge/Demo-Live-FF6B6B)](https://studio-1155838266-56095.web.app/)

---

## 🎮 Features

### Core Gameplay
- **11 enemy types** — Basic, Scout, Tank, Swarmer, Ghost, Phase, Ember, Frost, Healer, **Sniper** (ranged laser), **Burrower** (burrow/emerge cycle)
- **3 boss variants** — Arachne (web snares), Mandible (armor cycles), Moth (psionic distortion)
- **7 biomes** — Neon Core → Quantum Void → Ember Depths → Frostbyte → Void Abyss → Golden Cache → Golden Spire
- **10 powerups** — Shield, Multiplier, Nuke, Rapid Fire, Slow-Mo, Freeze, Magnet, Spike Burst, Overdrive, Repair Cell
- **4 wave modifiers** — Armored, Swarm, Toxic Regen, No Healers (20% chance per wave)
- **Prestige system** — New game+ with permanent upgrades across cycles
- **Daily challenges** — Rotating modifiers with streak rewards

### Technical Excellence
- **Adaptive Performance Scaler** — Real-time FPS monitoring with dynamic VFX quality (Ultra/High/Balanced/Mobile presets)
- **Professional Audio** — 7 WAV assets with procedural synthesis fallback chain
- **Full i18n** — English + Spanish across all 21 UI components (180+ translation keys)
- **Accessibility** — Colorblind filters, shape markers, gamepad support, difficulty presets, reduced motion
- **PWA** — Installable, offline-capable with service worker precaching
- **Canvas 2D Engine** — Custom high-performance renderer with modular sub-renderers

### Production Infrastructure
- **Firebase Auth + Firestore** — Cloud sync for saves and leaderboards
- **PostHog Analytics** — Full event tracking (sessions, achievements, powerups, daily challenges)
- **E2E Testing** — 9 Playwright smoke tests covering all critical paths
- **CI/CD** — GitHub Actions with lint, test, build, and Firebase deploy pipeline
- **Bundle Optimization** — Manual chunks (main ~146kB, react ~220kB, motion ~129kB), PWA precaching

---

## 🚀 Quick Start

```bash
git clone https://github.com/HopeTheoory/BugSmasher-ApZz.git
cd BugSmasher-ApZz
npm install
npm run dev        # Dev server at localhost:3000
npm run ci         # Full CI pipeline (lint → test → build)
```

### Other Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run 520 unit tests |
| `npm run test:e2e` | Run 9 Playwright E2E smoke tests |
| `npm run build` | Production build with PWA |
| `npm run preview` | Preview production build locally |
| `npm run deploy:hosting` | Build + deploy to Firebase |

---

## 🏗️ Architecture

```mermaid
flowchart TB
  subgraph react [React Shell]
    App --> Game --> GameCanvas
    Game --> HUD
    SettingsMenu --> AccessibilitySettings
  end
  subgraph engine [Canvas Engine (60 FPS)]
    GameCanvas --> GameEngine
    GameEngine --> Renderer --> {Environment,Bug,Particle,UI}Renderer
    GameEngine --> {WaveManager,CollisionSystem,BossSystem}
    GameEngine --> {PowerupSystem,HazardSystem,InputSystem}
    GameEngine --> ParticleSystem --> ParticleEngineHost
  end
  subgraph sync [Cross-Cutting]
    GameEngine --> GameEngineStatusBus --> {HUD,CustomCursor}
    GameEngine --> SoundManager --> {WAV assets,Synth fallback}
  end
  subgraph backend [Firebase]
    SaveManager --> Firestore
    AuthContext --> FirebaseAuth
  end
```

### Key Design Decisions
- **Systems over Monoliths** — `GameEngine.ts` orchestrates ~10 specialized systems; no single file exceeds 920 lines
- **Delta-Time Timing** — All gameplay uses `dt` from `requestAnimationFrame`; zero `setTimeout`/`setInterval` for game state
- **Event Bus Architecture** — `GameEngineStatusBus` replaces legacy `window.__gameEngineStatus` global
- **Type Safety** — Core entity types defined in `GameTypes.ts`; zero `any` casts in engine code

---

## 📸 Gallery

| Main Menu | Gameplay | Armory |
|-----------|----------|--------|
| *Brutalist terminal UI with neon accents* | *Canvas 2D with 60 FPS adaptive scaling* | *Cosmetics & skin system* |

*Screenshots coming soon. Run `npm run dev` to see the game in action.*

---

## 📊 Test Coverage

| Layer | Tests | Status |
|-------|-------|--------|
| **Unit Tests** | 520 passing (23 files) | ✅ |
| **E2E Smoke Tests** | 9 passing (Playwright) | ✅ |
| **CI Pipeline** | Lint → Functions → Test → Build | ✅ |
| **Test Areas** | Engine, Renderer, Bosses, Collisions, Powerups, Hazards, Waves, i18n, A11y, E2E | ✅ |

---

## 🧰 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Core** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS 4, Lucide Icons |
| **Animation** | Motion (React), Canvas 2D |
| **Backend** | Firebase Auth, Firestore, Cloud Functions |
| **Audio** | Web Audio API, WAV assets + procedural synthesis |
| **Analytics** | PostHog (via `posthog-js`) |
| **Testing** | Vitest 4, Playwright, `jsdom` |
| **CI/CD** | GitHub Actions, Firebase Hosting |
| **PWA** | `vite-plugin-pwa`, service worker, precaching |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [Single Source of Truth](docs/SINGLE_SOURCE_OF_TRUTH.md) | Architecture, audit, roadmap |
| [Deployment Guide](DEPLOYMENT.md) | CI/CD, Firebase setup, release checklist |
| [Contributing](CONTRIBUTING.md) | PR workflow, commit standards, AI agent guide |
| [Design Doc](DESIGN_DOC.md) | Creative vision, core loop, art direction |
| [ADR: Renderer Split](docs/adr/001-renderer-modularization.md) | Why and how the renderer was modularized |
| [ADR: Status Bus](docs/adr/002-engine-status-bus.md) | Typed event bus for HUD sync |

---

## 📈 Project Status (June 2026)

**Composite Rating: 8.2/10** — Production-ready for portfolio and demo, with active development toward commercial launch.

| Dimension | Rating | Highlights |
|-----------|:------:|------------|
| Architecture & Code Quality | **9.0/10** | Modular systems, zero `any`, clean patterns |
| Performance & Optimization | **8.8/10** | Adaptive scaler, bundle splitting, PWA |
| UI/UX & Visual Design | **8.8/10** | Brutalist aesthetic, i18n, accessibility |
| Game Design & Engagement | **9.2/10** | 11 enemies, 7 biomes, modifiers, prestige |
| Business Viability | **6.5/10** | Analytics wired, monetization stubs exist |
| Security & Data Integrity | **8.0/10** | Firestore rules, client + server checksums |
| Testing & Reliability | **9.3/10** | 520 unit + 9 E2E, CI-gated |
| Feature Completeness | **8.5/10** | i18n, a11y, daily challenges, cosmetics |

---

<p align="center">
  <sub>Built with ❤️ and TypeScript · MIT License</sub>
</p>
