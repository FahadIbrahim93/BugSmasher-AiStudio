# BUGSMASHER — AI Coder Taskboard

**Purpose:** Actionable task list for any AI agent continuing this codebase.  
**Rule:** Do not mark tasks done without tests. Follow `AGENTS.md` architecture standards.

**Legend:** `[x]` done · `[~]` partial · `[ ]` todo · **P0** ship-blocker · **P1** commercial · **P2** polish

---

## How AI Coders Should Work Here

1. Read `AUDIT_REPORT.md` for context and ratings.
2. Pick the lowest-ID open **P0** task unless the user specifies otherwise.
3. Run `npm test && npm run lint && npm run build` before claiming completion.
4. One PR-sized change per task — no drive-by refactors.
5. Update this file: change `[ ]` → `[x]` and add completion date in the commit message.

---

## Phase 1 — Production Readiness (P0)

| ID | Task | Status | Files | Acceptance Criteria |
|----|------|--------|-------|---------------------|
| P1-01 | Extract CollisionSystem, BossSystem, PowerupSystem, HazardSystem | [x] | `src/game/*System.ts` | GameEngine < 1000 lines, tests pass |
| P1-02 | Split Renderer monolith | [x] | `src/game/Renderer.ts`, `src/game/rendering/*` | Orchestrator < 300 lines, draw() works |
| P1-03 | Replace `__gameEngineStatus` with typed bus | [x] | `GameEngineStatusBus.ts`, `CustomCursor.tsx` | No window global reads in components |
| P1-04 | Fix `ParticleSystem.engine?: any` | [x] | `ParticleEngineHost.ts` | tsc clean |
| P1-05 | Comprehensive test suite (80%+ systems) | [x] | `src/__tests__/*` | 400+ tests green |
| P1-06 | Remove remaining `any` in game UI | [ ] | `ProgressionCenter.tsx`, `Armory.tsx`, `AccountMenu.tsx` | tsc with strict mocks |
| P1-07 | Server-side save checksum validation | [ ] | Cloud Function + `firebaseService.ts` | Tampered saves rejected |
| P1-08 | Offscreen canvas for static environment | [ ] | `EnvironmentRenderer.ts` | Measurable draw call reduction |

---

## Phase 2 — Commercial Polish (P1)

| ID | Task | Status | Files | Acceptance Criteria |
|----|------|--------|-------|---------------------|
| P2-01 | Professional SFX pack integration | [ ] | `SoundManager.ts`, `public/audio/*` | Replace procedural splat/shoot/UI |
| P2-02 | Adaptive music layers (wave/health/boss) | [ ] | `SoundManager.ts` | Crossfade on state change |
| P2-03 | Accessibility — colorblind canvas filter | [~] | `AccessibilitySettings.ts`, `Renderer.ts` | CSS filter per mode when not `off` |
| P2-04 | Accessibility — difficulty presets | [x] | `AccessibilitySettings.ts`, `WaveManager.ts` | Easy/Normal/Hard changes HP/speed/drops |
| P2-05 | Accessibility — reduced motion | [x] | `Renderer.ts` | No shake when enabled |
| P2-06 | Accessibility — gamepad support | [x] | `InputSystem.ts` | Stick moves aim, A fires |
| P2-07 | Accessibility — enemy shape markers | [x] | `BugRenderer.ts` | Shapes when `showEnemyShapes` |
| P2-08 | Control remapping UI | [ ] | `SettingsMenu.tsx`, `InputSystem.ts` | Persist bindings in localStorage |
| P2-09 | Achievement gallery screen | [~] | `AchievementManager.ts`, new component | Visual grid of badges + progress |
| P2-10 | Lifetime stats dashboard | [ ] | `StatsManager.ts`, `ProgressionCenter.tsx` | Runs, K/D, best wave |
| P2-11 | Daily challenge polish | [~] | `DailyChallengeManager.ts` | Modifier tooltips + streak UI |
| P2-12 | Volume preview on slider change | [ ] | `SettingsMenu.tsx` | Play sample SFX on drag end |

---

## Phase 3 — Growth & Monetization (P1)

| ID | Task | Status | Files | Acceptance Criteria |
|----|------|--------|-------|---------------------|
| P3-01 | PostHog/Mixpanel analytics wrapper | [ ] | `src/lib/analytics.ts` | session_start, wave_complete, death events |
| P3-02 | Share score image generator | [ ] | `src/lib/shareCard.ts` | Canvas → PNG download |
| P3-03 | Friend challenge deep links | [ ] | Firebase + routing | URL opens challenge modal |
| P3-04 | Cosmetics monetization (Stripe/revenuecat stub) | [ ] | `CosmeticsManager.ts` | Supporter pack flag + UI |
| P3-05 | Rewarded ad hook (interface only) | [ ] | `src/lib/ads.ts` | No-op impl + feature flag |

---

## Phase 4 — Expansion (P2)

| ID | Task | Status | Files | Acceptance Criteria |
|----|------|--------|-------|---------------------|
| P4-01 | Endless mode | [ ] | `GameEngine.ts`, menus | No wave cap, scaling formula |
| P4-02 | Boss Rush mode | [ ] | `WaveManager.ts` | Boss every wave |
| P4-03 | i18n (en + es minimum) | [ ] | `src/i18n/*` | All menu strings externalized |
| P4-04 | Mobile haptic feedback | [ ] | `InputSystem.ts` | vibrate on hit when supported |
| P4-05 | Story expansion (5 beats) | [ ] | `StoryManager.ts`, `lore.ts` | Multiple endings by prestige |

---

## Quick Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run ci       # lint + test + build (pre-push)
npm test         # vitest run (409 tests)
npm run lint     # tsc --noEmit
npm run build    # production bundle
```

**Deploy:** See [DEPLOYMENT.md](./DEPLOYMENT.md) · **Contribute:** See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Git & CI

| Item | Location |
|------|----------|
| CI workflow | `.github/workflows/ci.yml` |
| Firebase Hosting | `firebase.json`, `.firebaserc` |
| Primary remote | `origin` → HopeTheoory/BugSmasher-ApZz |
| Upstream | `upstream` → FahadIbrahim93/BugSmasher-HopeTheory |

---

## Definition of Done (10/10)

- All P0 tasks `[x]`
- All P1 tasks `[x]` or explicitly deferred with user approval
- `npm test` — 0 failures
- `npm run lint` — 0 errors
- `AUDIT_REPORT.md` overall score ≥ **9.0**
- No `(window as any)` game state
- No `engine?: any` in engine code
- Audio is asset-based, not purely procedural