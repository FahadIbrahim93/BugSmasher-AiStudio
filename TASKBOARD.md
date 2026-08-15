# BUGSMASHER — Full Taskboard to Verified 10/10

**Last updated:** 2026-06-30  
**Current honest rating:** ~7.5/10 overall · ~6.8/10 visuals  
**Evidence:** [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md) · [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md) · [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md)

**Legend:** `[x]` done · `[~]` partial · `[ ]` todo · **P0** release blocker · **P1** high · **P2** medium · **P3** nice-to-have

**10/10 exit rule:** Every dimension in the exit checklist below is `[x]` with command evidence — no stub marked complete, no doc inflation.

---

## Phase 0 — Truth & Release Governance (P0)

| ID   | Task                                  | Pri | Status | Acceptance                                                      |
| ---- | ------------------------------------- | --- | ------ | --------------------------------------------------------------- |
| G-01 | Replace false 10/10 claims in docs    | P0  | [~]    | README/AGENTS/DEPLOYMENT honest; archive stale victory-lap docs |
| G-02 | `npm run ci` as pre-push gate         | P0  | [x]    | lint + functions + coverage + emulator + build                  |
| G-03 | Branch protection requires CI         | P0  | [ ]    | GitHub settings + required checks                               |
| G-04 | Verification evidence doc per release | P0  | [x]    | `docs/VERIFICATION_2026-06-30.md` updated each milestone        |
| G-05 | Release checklist in DEPLOYMENT.md    | P0  | [x]    | Checklist matches actual CI steps                               |

---

## Phase 1 — Security & Trust Boundaries (P0)

| ID   | Task                                         | Pri | Status | Acceptance                                                    |
| ---- | -------------------------------------------- | --- | ------ | ------------------------------------------------------------- |
| S-01 | Deny direct client save/leaderboard writes   | P0  | [x]    | Firestore rules + emulator tests                              |
| S-02 | Callable `saveGameData` with server checksum | P0  | [x]    | Zod schema + `functions/test/callables.test.ts`               |
| S-03 | Callable `submitScore` with monotonic scores | P0  | [x]    | Rate limit + plausibility bounds tested                       |
| S-04 | Rate limiting (saves + scores)               | P0  | [x]    | Firestore `_rateLimits/` + emulator tests                     |
| S-05 | Firebase emulator test suite                 | P0  | [x]    | 17 integration + 4 schema unit tests                          |
| S-06 | Session-token / signed run anti-cheat        | P0  | [ ]    | Server validates session summary; replays rejected            |
| S-07 | Legacy cloud save migration/backfill         | P1  | [ ]    | Old checksum docs migrated or rejected gracefully             |
| S-08 | Remove PII from Firestore error logs         | P1  | [~]    | Audit `handleFirestoreError` paths                            |
| S-09 | Dependency + CodeQL security scan in CI      | P1  | [ ]    | Dependabot + `npm audit` + CodeQL green or waived with ticket |

---

## Phase 2 — Test Coverage & Reliability (P0 → P1)

| ID   | Task                                    | Pri | Status | Acceptance                                     |
| ---- | --------------------------------------- | --- | ------ | ---------------------------------------------- |
| T-01 | Frontend test suite                     | P0  | [x]    | 507/507 pass                                   |
| T-02 | Engine/lib coverage interim thresholds  | P0  | [x]    | 77/61/75/76 in `vitest.config.ts`              |
| T-03 | Restore target thresholds 80/70/75/80   | P0  | [ ]    | `npm run test:coverage` passes at target       |
| T-04 | GameEngine branch coverage              | P1  | [~]    | Kill/damage/resource/death edge cases          |
| T-05 | WaveManager branch coverage             | P1  | [~]    | Spawn/boss/surge paths                         |
| T-06 | SaveManager cloud path coverage         | P1  | [~]    | Auth + error branches                          |
| T-07 | InputSystem + GameEngineStatusBus tests | P2  | [ ]    | >80% on both                                   |
| T-08 | Playwright smoke E2E                    | P1  | [ ]    | Menu → play → pause → game over                |
| T-09 | Frame-time benchmark harness            | P2  | [ ]    | Scripted run; budget enforced in CI or nightly |
| T-10 | Firebase emulator in CI                 | P0  | [x]    | Java 21 + `test:emulator` in workflow          |

---

## Phase 3 — Standards & Tooling (P1)

| ID    | Task                                   | Pri | Status | Acceptance                                 |
| ----- | -------------------------------------- | --- | ------ | ------------------------------------------ |
| ST-01 | ESLint flat config (TS + React + a11y) | P1  | [ ]    | `npm run lint` = ESLint; `typecheck` = tsc |
| ST-02 | Prettier after ESLint green            | P2  | [ ]    | No mixed noisy diffs                       |
| ST-03 | Remove `@ts-nocheck` from renderers    | P1  | [x]    | Environment/Bug/Particle/UIRenderer typed  |
| ST-04 | Lighthouse CI budget                   | P2  | [ ]    | Performance + a11y scores documented       |
| ST-05 | Husky pre-commit (lint-staged)         | P2  | [ ]    | Optional; only after ESLint stable         |

---

## Phase 4 — Architecture & Performance (P1)

| ID   | Task                                            | Pri | Status | Acceptance                              |
| ---- | ----------------------------------------------- | --- | ------ | --------------------------------------- |
| A-01 | Extract `CombatSystem` from GameEngine          | P1  | [x]    | GameEngine <800 lines; tests for combat |
| A-02 | Extract `BugBehaviorSystem`                     | P1  | [x]    | AI/movement/abilities isolated          |
| A-03 | DI for ProgressionManager/StatsManager          | P1  | [x]    | Engine paths inject interfaces          |
| A-04 | Remove `__gameEngineStatus` window bridge       | P1  | [x]    | All consumers on GameEngineStatusBus    |
| A-05 | Fix Vite circular chunk warning                 | P1  | [x]    | Clean build, no vendor↔react cycle      |
| A-06 | Fix DailyChallengeManager static/dynamic import | P1  | [x]    | No vite reporter warning                |
| A-07 | Split SoundManager (audio vs voice vs music)    | P2  | [x]    | File <600 lines                         |
| A-08 | Split IntelHub / HUD / WorkspaceConsole         | P2  | [x]    | Sub-components + lazy tabs              |

---

## Phase V — Visual & UX Sprint (NEW — P1 for commercial polish)

**Goal:** Close visual gap from 6.8 → 9.0+. Industry bar: cohesive design system, owned assets, WCAG visuals, no dead UI.

### V1 — Design system foundation (P1, ~3 days)

| ID   | Task                                                | Pri | Status | Acceptance                                                                                   |
| ---- | --------------------------------------------------- | --- | ------ | -------------------------------------------------------------------------------------------- |
| V-01 | Register `font-display` in `@theme` (Space Grotesk) | P1  | [ ]    | Headings render correctly; visual regression spot-check                                      |
| V-02 | Define missing CSS utilities                        | P1  | [ ]    | `bg-scanlines`, `bg-radial-vignette`, `bg-radial-gradient`, `animate-fade-in` in `index.css` |
| V-03 | Unify color tokens                                  | P1  | [ ]    | Single `src/theme/tokens.css` — UI accents map to biome/cursor/cosmetics                     |
| V-04 | Button/toggle component primitives                  | P1  | [ ]    | `PrimaryButton`, `Toggle`, `GlassPanel` — replace ad-hoc copies                              |
| V-05 | Focus-visible rings on all interactive elements     | P1  | [ ]    | Keyboard nav audit pass                                                                      |
| V-06 | Touch targets ≥44px on mobile menus                 | P1  | [ ]    | MainMenu, Pause, Settings, Upgrade                                                           |

### V2 — Asset pipeline (P1, ~2 days)

| ID   | Task                                           | Pri | Status | Acceptance                                                   |
| ---- | ---------------------------------------------- | --- | ------ | ------------------------------------------------------------ |
| V-07 | Commit lobby background + avatar assets        | P1  | [ ]    | `src/assets/images/` populated; no 404 in Preloader/MainMenu |
| V-08 | Remove Unsplash runtime dependencies           | P1  | [ ]    | `AssetManager` uses local or bundled art only                |
| V-09 | Remove external texture URLs (GameOver carbon) | P1  | [ ]    | Local SVG/pattern or CSS-only texture                        |
| V-10 | Branded PWA + OG share images                  | P1  | [ ]    | `public/og.png`, manifest icons reviewed                     |
| V-11 | Brand-grade share card                         | P2  | [ ]    | Logo, score, biome tint — not random circles                 |

### V3 — UI cleanup & consistency (P1, ~2 days)

| ID   | Task                                    | Pri | Status | Acceptance                                              |
| ---- | --------------------------------------- | --- | ------ | ------------------------------------------------------- |
| V-12 | Wire or delete `DifficultySelector.tsx` | P1  | [ ]    | Used in flow OR removed from repo                       |
| V-13 | Wire or delete `MissionPanel.tsx`       | P1  | [ ]    | Styled + routed OR removed                              |
| V-14 | Align biome names UI ↔ engine           | P2  | [ ]    | `BiomeBackgroundGallery` keys match `GameConfig.biomes` |
| V-15 | Loading skeletons for lazy routes       | P2  | [ ]    | Game/Settings/IntelHub Suspense fallbacks               |
| V-16 | Achievement gallery visual upgrade      | P2  | [ ]    | Icons/illustrations replace emoji-only grid             |
| V-17 | IntelHub dashboard polish               | P2  | [ ]    | Empty/error states when Google Sheets unavailable       |

### V4 — Settings & graphics UX (P1, ~1 day)

| ID   | Task                                               | Pri | Status | Acceptance                                        |
| ---- | -------------------------------------------------- | --- | ------ | ------------------------------------------------- |
| V-18 | Expose PerformanceScaler presets in Settings       | P1  | [ ]    | Ultra/High/Balanced/Mobile/Headless selectable    |
| V-19 | Graphics section copy matches DESIGN_DOC brutalism | P2  | [ ]    | Reduce generic glassmorphism where doc says stark |
| V-20 | High-contrast UI mode (optional)                   | P2  | [ ]    | Toggle increases border/text contrast on shell    |

### V5 — Accessibility visuals (P1, ~2 days)

| ID   | Task                                               | Pri | Status | Acceptance                                             |
| ---- | -------------------------------------------------- | --- | ------ | ------------------------------------------------------ |
| V-21 | Global `prefers-reduced-motion`                    | P1  | [ ]    | Disables Framer Motion + cursor animations + scanline  |
| V-22 | Colorblind filter on React shell (not just canvas) | P1  | [ ]    | HUD/menus respect same preset                          |
| V-23 | Fix `cursor: none` fallback                        | P1  | [ ]    | System cursor if CustomCursor fails or a11y setting on |
| V-24 | Wire SVG colorblind filters to DOM                 | P2  | [ ]    | Filters in `index.html` or component, not dead URLs    |

### V6 — Canvas ↔ shell cohesion (P2, ~3 days)

| ID   | Task                                                     | Pri | Status | Acceptance                               |
| ---- | -------------------------------------------------------- | --- | ------ | ---------------------------------------- |
| V-25 | Goop/stain bleed into React HUD edges                    | P2  | [ ]    | DESIGN_DOC “stain on OS” moment visible  |
| V-26 | Boss intro sync with shell overlay                       | P2  | [ ]    | React + canvas boss warning feel unified |
| V-27 | Map preview in BattlegroundGenerator matches in-game PCG | P2  | [ ]    | Side-by-side or shared renderer path     |

---

## Phase 5 — Audio & Game Feel (P1)

| ID    | Task                             | Pri | Status | Acceptance                            |
| ----- | -------------------------------- | --- | ------ | ------------------------------------- |
| AF-01 | WAV SFX pack                     | P1  | [x]    | 7 files in `public/audio/`            |
| AF-02 | Adaptive music layers            | P1  | [x]    | Intensity-driven                      |
| AF-03 | Commercial SFX pack (licensed)   | P1  | [ ]    | Replace/supplement synthesis for ship |
| AF-04 | Adaptive soundtrack (full loops) | P2  | [ ]    | Not synth-only drones                 |
| AF-05 | UI sound sync with motion        | P2  | [ ]    | Hover/click on all primary buttons    |

---

## Phase 6 — Accessibility & Input (P1)

| ID    | Task                                   | Pri | Status | Acceptance                                   |
| ----- | -------------------------------------- | --- | ------ | -------------------------------------------- |
| AX-01 | Difficulty presets                     | P1  | [x]    | Easy/normal/hard                             |
| AX-02 | Reduced motion (gameplay shake)        | P1  | [x]    | Renderer gate                                |
| AX-03 | Reduced motion (full UI)               | P1  | [ ]    | See V-21                                     |
| AX-04 | Colorblind canvas filter               | P1  | [x]    | Settings toggle                              |
| AX-05 | Enemy shape markers                    | P1  | [x]    | BugRenderer                                  |
| AX-06 | Gamepad support                        | P1  | [x]    | InputSystem                                  |
| AX-07 | Control remapping UI                   | P1  | [x]    | Settings                                     |
| AX-08 | WCAG 2.2 AA audit (automated + manual) | P1  | [ ]    | Lighthouse a11y ≥90 or documented exceptions |

---

## Phase 7 — Business & Production (P1)

| ID   | Task                                     | Pri | Status | Acceptance                                           |
| ---- | ---------------------------------------- | --- | ------ | ---------------------------------------------------- |
| B-01 | Analytics — real provider or de-scope    | P1  | [ ]    | PostHog/Mixpanel OR remove production claims         |
| B-02 | Monetization — real provider or de-scope | P1  | [ ]    | Stripe/etc. OR cosmetics stay free-only in docs      |
| B-03 | Ads — real provider or de-scope          | P1  | [ ]    | AdMob/etc. OR remove from release scope              |
| B-04 | Crash reporting (Sentry/etc.)            | P1  | [ ]    | Production DSN + source maps                         |
| B-05 | Runtime monitoring + alerting            | P2  | [ ]    | Uptime, error rate, function latency                 |
| B-06 | Privacy policy + consent for telemetry   | P1  | [ ]    | Legal review before analytics ship                   |
| B-07 | Product acceptance criteria doc          | P2  | [ ]    | Saves, leaderboard, offline, daily challenge defined |

---

## Phase 8 — Growth & Social (P2)

| ID    | Task                       | Pri | Status | Acceptance                           |
| ----- | -------------------------- | --- | ------ | ------------------------------------ |
| GR-01 | Share score image          | P2  | [x]    | `shareCard.ts` (upgrade per V-11)    |
| GR-02 | Friend challenge links     | P2  | [x]    | URL params                           |
| GR-03 | Daily challenge polish     | P2  | [~]    | Metadata + modal; streak UX          |
| GR-04 | Lifetime stats dashboard   | P2  | [~]    | StatsManager extended; UI incomplete |
| GR-05 | Leaderboard UX polish      | P2  | [ ]    | Loading, empty, error states         |
| GR-06 | Push / email re-engagement | P3  | [ ]    | Firebase messaging or de-scoped      |

---

## Phase 9 — Expansion (P2–P3)

| ID   | Task                         | Pri | Status | Acceptance                                 |
| ---- | ---------------------------- | --- | ------ | ------------------------------------------ |
| E-01 | Endless mode                 | P2  | [x]    |                                            |
| E-02 | Boss Rush mode               | P2  | [x]    |                                            |
| E-03 | i18n en + es wired           | P2  | [~]    | Catalogs exist; UI strings not fully wired |
| E-04 | Mobile haptics               | P2  | [x]    |                                            |
| E-05 | Story expansion              | P3  | [~]    | StoryManager + cutscenes exist             |
| E-06 | Time Attack / Survival modes | P3  | [ ]    |                                            |
| E-07 | Network status indicator     | P3  | [ ]    | Offline/sync UX                            |

---

## Infrastructure & Code Quality (ongoing)

| ID    | Task                          | Pri | Status |
| ----- | ----------------------------- | --- | ------ |
| CQ-01 | Code splitting / lazy loading | P1  | [x]    |
| CQ-02 | Monitoring module             | P1  | [x]    |
| CQ-03 | ErrorBoundary + monitoring    | P1  | [x]    |
| CQ-04 | Remove unused dependencies    | P1  | [x]    |
| CQ-05 | TypeScript strict (engine)    | P1  | [x]    |
| CQ-06 | Git + CI linked               | P1  | [x]    |
| CQ-07 | PWA (icons + SW)              | P1  | [x]    |
| CQ-08 | Functions modularized         | P1  | [x]    |

---

## Suggested execution order (path to 10/10)

```
NOW (P0 blockers)
  S-06 session anti-cheat → T-03 coverage 80/70 → G-03 branch protection

NEXT (P1 — 2–3 weeks)
  Phase V sprint (V-01…V-23) → ST-01 ESLint → A-01/A-05 architecture
  → AF-03 commercial audio → B-01/B-04 production telemetry decision

THEN (P2 polish)
  V-25…V-27 canvas cohesion → T-08 Playwright → AX-08 WCAG audit
  → GR/Expansion as product priorities allow
```

---

## 10/10 exit checklist (all must be `[x]`)

| Dimension     | Gate                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| Security      | Emulator tests green + session anti-cheat + no direct client writes      |
| Tests         | 80/70/75/80 coverage + Playwright smoke                                  |
| Tooling       | ESLint + typecheck + CI required on main                                 |
| Architecture  | GameEngine split; no window status bridge; clean Vite build              |
| Visuals       | Design tokens, owned assets, no dead UI, a11y motion, ≥9/10 visual audit |
| Audio         | Licensed SFX pack shipped                                                |
| Accessibility | WCAG 2.2 AA pass or documented exceptions                                |
| Business      | Real analytics/monetization OR explicitly de-scoped in docs              |
| Ops           | Crash reporting + rollback tested                                        |
| Docs          | VERIFICATION doc + honest ratings; no stale 10/10 claims                 |

---

## Quick commands

```bash
npm run ci              # full gate
npm run test:coverage   # engine/lib coverage
npm run test:emulator   # security integration (Java 21+)
npm run dev             # local play-test visuals
```

**Deploy:** [DEPLOYMENT.md](./DEPLOYMENT.md) · **Visual audit:** conversation 2026-06-30 · **Evidence:** [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md)
