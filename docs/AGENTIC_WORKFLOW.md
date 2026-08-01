# Agentic Workflow — Multi-Agent Safe Development

**Purpose:** Any human or AI agent can pick work from [TASKBOARD.md](../TASKBOARD.md), implement in isolation, and merge without breaking the codebase or other agents' work.

**Read order for agents:**

1. This file
2. [AGENTS.md](../AGENTS.md) — architecture rules
3. [TASKBOARD.md](../TASKBOARD.md) — claim one task ID
4. [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — module boundaries
5. Task-specific docs (e.g. [EMULATOR_TESTING.md](./EMULATOR_TESTING.md) for security)

---

## Golden rules (non-negotiable)

| Rule                                        | Why                                                               |
| ------------------------------------------- | ----------------------------------------------------------------- |
| **One TASKBOARD ID per branch/PR**          | Prevents scope creep and review confusion                         |
| **Never push to `main` directly**           | CI + review gate; deploy tracks `main`                            |
| **`npm run ci` before opening PR**          | Single source of truth for merge readiness                        |
| **Never mark stubs complete**               | No localStorage monetization / console analytics as "shipped"     |
| **Never lower coverage thresholds to pass** | Raise tests or get explicit TASKBOARD approval for interim floors |
| **Never commit secrets**                    | No `.env`, service account JSON, `CHECKSUM_SALT` in client code   |
| **Gameplay uses `dt` only**                 | No `setTimeout` / `setInterval` for game state                    |
| **Security = server + rules + emulator**    | Client checksum alone is not authoritative                        |

---

## Before you write code

1. **Claim a task** — Note TASKBOARD ID in branch name or PR (`feat/V-01-font-display-tokens`).
2. **Check conflicts** — Search open PRs/branches for the same files or task ID.
3. **Read boundaries** — See [Parallel work matrix](#parallel-work-matrix) below.
4. **Scope the diff** — Smallest change that satisfies acceptance criteria.

---

## Parallel work matrix

Agents **can** work in parallel when touching **different rows**. Avoid two agents on the **same file** in the same sprint.

| Domain                | Paths                                            | Parallel OK with     | Serialize / caution                                        |
| --------------------- | ------------------------------------------------ | -------------------- | ---------------------------------------------------------- |
| **Engine core**       | `src/game/GameEngine.ts`                         | —                    | **One agent at a time**; prefer new systems in own files   |
| **Game systems**      | `*System.ts`, `WaveManager.ts`, `InputSystem.ts` | Other system files   | Not `GameEngine.ts` in same PR                             |
| **Canvas render**     | `src/game/rendering/*.ts`                        | One file per agent   | Shared `Renderer.ts` — coordinate                          |
| **Game types/config** | `GameTypes.ts`, `GameConfig.ts`                  | Docs, tests          | Breaking changes block everyone — announce in PR           |
| **React UI**          | `src/components/*.tsx`                           | Different components | Shared `index.css` — merge carefully                       |
| **Theme/visual**      | `src/index.css`, `src/theme/*`                   | Docs                 | **One visual sprint PR** preferred for token changes       |
| **Firebase client**   | `src/lib/firebase*.ts`, `SaveManager.ts`         | UI-only PRs          | Must align with functions + rules                          |
| **Cloud Functions**   | `functions/src/*`                                | —                    | **One security PR at a time**; always run emulator tests   |
| **Firestore rules**   | `firestore.rules`                                | —                    | Same PR as related function changes                        |
| **Tests**             | `src/__tests__/*`, `functions/test/*`            | Matching domain      | Don't change `vitest.config.ts` thresholds without test PR |
| **CI/tooling**        | `.github/*`, `package.json`, `vitest.config.ts`  | Docs-only            | High conflict risk — dedicated PR                          |
| **Docs**              | `*.md`, `docs/*`                                 | Almost anything      | Update `VERIFICATION_*` only when gates change             |

### High-conflict files (single owner per release train)

- `src/game/GameEngine.ts`
- `vitest.config.ts` (coverage thresholds)
- `firestore.rules` + `functions/src/handlers.ts`
- `package.json` / lockfiles (dependency bumps — one PR)
- `src/index.css` (design tokens — batch in Phase V)

---

## Git workflow

### Branch naming

```
feat/<task-id>-<short-description>   # e.g. feat/V-01-font-display-tokens
fix/<task-id>-<short-description>    # e.g. fix/S-06-session-anti-cheat
docs/<topic>                         # docs-only
test/<scope>                         # test-only
chore/<topic>                        # tooling, deps
ci/<topic>                           # pipeline
```

### Standard flow

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feat/T-03-coverage-80

# work ...

npm run ci
git add -A
git commit -m "test(coverage): raise GameEngine branch coverage [T-03]"
git push -u origin feat/T-03-coverage-80
gh pr create --base main --title "test(coverage): raise GameEngine branch coverage [T-03]" --body-file .github/pr-body-example.md
```

### Commit message format (Conventional Commits)

```
<type>(<scope>): <imperative summary> [<TASKBOARD-ID>]

- Bullet for notable change
- Bullet for risk/rollback if any

Tests: npm run ci (507 + emulator) | Scope: engine only
```

| Type       | Use for                     |
| ---------- | --------------------------- |
| `feat`     | New behavior                |
| `fix`      | Bug fix                     |
| `refactor` | No behavior change          |
| `test`     | Tests only                  |
| `docs`     | Markdown only               |
| `ci`       | GitHub Actions, scripts     |
| `chore`    | Deps, gitignore, formatting |

**Scopes (examples):** `engine`, `render`, `ui`, `functions`, `security`, `coverage`, `deps`

### What agents must NOT do with git

- Force-push `main` / `develop`
- `git commit --amend` after push (unless maintainer explicitly requests)
- Skip hooks (`--no-verify`)
- Commit `node_modules/`, `functions/lib/`, `.env`, `dist/` (except CI artifacts upload)
- Large unrelated refactors mixed with feature work

---

## Pull request workflow

1. **Fill** [.github/pull_request_template.md](../.github/pull_request_template.md)
2. **Reference** exactly one primary TASKBOARD ID
3. **List** files/areas touched for conflict awareness
4. **Attach** CI pass evidence (`npm run ci` summary or link to Actions)
5. **Update** `TASKBOARD.md` checkbox only for IDs completed in this PR
6. **Update** `docs/VERIFICATION_2026-06-30.md` if security/coverage/CI gates changed
7. **Wait** for green CI before merge (do not merge on red)

### PR size guidance

| Size  | Lines (approx) | Policy                                                 |
| ----- | -------------- | ------------------------------------------------------ |
| Ideal | < 400          | Easy review, low conflict                              |
| OK    | 400–1000       | Needs clear summary                                    |
| Split | > 1000         | Split by TASKBOARD ID or layer (functions vs frontend) |

### Merge strategy

- **Squash merge** preferred for feature branches (clean `main` history)
- **Delete branch** after merge
- **No merge commits** from long-lived branches without rebase onto latest `main`

---

## Version management (SemVer)

**Current version:** `package.json` → `version` (e.g. `2.5.0`)

| Bump                        | When                                       | Examples                   |
| --------------------------- | ------------------------------------------ | -------------------------- |
| **PATCH** `2.5.0` → `2.5.1` | Bug fixes, test-only, docs                 | `fix(ui): cursor fallback` |
| **MINOR** `2.5.0` → `2.6.0` | Features, non-breaking improvements        | Phase V visuals, new mode  |
| **MAJOR** `3.0.0`           | Breaking save format, API, Firebase schema | Rare; needs migration doc  |

**Version bump checklist (release PR only):**

- [ ] `package.json` version updated
- [ ] `CHANGELOG.md` entry added
- [ ] `docs/VERIFICATION_*.md` refreshed with command output
- [ ] Tag after merge: `git tag -a v2.6.0 -m "Release 2.6.0"` + `git push origin v2.6.0`
- [ ] Deploy per [DEPLOYMENT.md](../DEPLOYMENT.md)

**Do not bump version** on every feature PR — batch at release.

---

## Verification gates by change type

| Change type             | Minimum verification                                   | Also required                             |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------- |
| Engine / gameplay       | `npm test` + affected test files                       | Coverage must not drop below thresholds   |
| UI only                 | `npm run typecheck` + `npm test` + manual smoke        | Screenshot in PR if visual                |
| Cloud Functions / rules | `npm run validate:functions` + `npm run test:emulator` | Update `security_spec.md` if rules change |
| Coverage thresholds     | `npm run test:coverage`                                | TASKBOARD + VERIFICATION doc              |
| Dependencies            | `npm run ci` + note audit warnings                     | Lockfile only in dedicated PR             |
| Docs only               | Link check, no broken paths                            | —                                         |

**Full gate (default):** `npm run ci`

```bash
npm run ci  # typecheck (hard gate) + functions + coverage + emulator + build; ESLint advisory (tracked debt)
```

ESLint runs in CI as an advisory step (continue-on-error) until the tracked debt is burned down — see AGENTS.md for the re-promotion plan.

**Note:** `.npmrc` sets `legacy-peer-deps=true` so ESLint 10 scaffolding installs cleanly alongside jsx-a11y until peer ranges align.

---

## Agent task lifecycle

```
1. READ  → AGENTIC_WORKFLOW + TASKBOARD + ARCHITECTURE
2. CLAIM → Task ID in branch/PR title
3. PLAN  → Files touched; confirm no parallel conflict
4. IMPLEMENT → Smallest diff; tests with behavior
5. VERIFY → npm run ci (or scoped gates above)
6. DOCUMENT → TASKBOARD [x], VERIFICATION if gates changed
7. PR → Template filled; wait for CI
8. HANDOFF → PR description lists follow-ups / debt
```

---

## Industry standards checklist (10/10 target)

| Standard             | Project status                  | Agent action                                         |
| -------------------- | ------------------------------- | ---------------------------------------------------- |
| Conventional Commits | Adopted                         | Follow format above                                  |
| Trunk-based + PR     | `main` protected                | Never direct push                                    |
| CI as merge gate     | GitHub Actions                  | Must pass                                            |
| SemVer               | `package.json`                  | Bump on release PR only                              |
| Test pyramid         | 507 unit + emulator integration | Add tests with features                              |
| Security SDLC        | Callable + rules + emulator     | Never skip emulator for security                     |
| Accessibility        | Partial                         | Respect `AccessibilitySettings`; test reduced motion |
| Observability        | Stub                            | Don't claim production monitoring until B-04 done    |
| IaC / deploy docs    | DEPLOYMENT.md                   | Follow checklist                                     |

---

## Emergency / rollback

- **Bad merge on `main`:** Revert PR via GitHub UI → `git revert` → redeploy previous hosting (see DEPLOYMENT.md rollback)
- **Broken CI on `main`:** Priority fix PR; no new feature PRs until green
- **Firebase rules regression:** `firebase deploy --only firestore:rules` with last known-good SHA

---

## Related documents

| Doc                                                             | Purpose                      |
| --------------------------------------------------------------- | ---------------------------- |
| [CONTRIBUTING.md](../CONTRIBUTING.md)                           | Human + agent PR entry point |
| [AGENTS.md](../AGENTS.md)                                       | Code architecture rules      |
| [TASKBOARD.md](../TASKBOARD.md)                                 | All work items to 10/10      |
| [DEPLOYMENT.md](../DEPLOYMENT.md)                               | CI/CD, release, rollback     |
| [security_spec.md](../security_spec.md)                         | Firestore security model     |
| [docs/VERIFICATION_2026-06-30.md](./VERIFICATION_2026-06-30.md) | Current gate evidence        |
