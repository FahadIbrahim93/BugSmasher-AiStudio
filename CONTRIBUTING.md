# Contributing to BUGSMASHER

Thank you for contributing. This project is built for **humans and AI agents working in parallel** toward a verified **10/10** quality bar.

---

## Start here

| Step | Document                                                                                      |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | [docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md) — git, PR, parallel work, verification |
| 2    | [AGENTS.md](./AGENTS.md) — architecture and coding rules                                      |
| 3    | [TASKBOARD.md](./TASKBOARD.md) — pick **one** task ID                                         |
| 4    | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — module boundaries                            |

**Current honest rating:** ~7.5/10 — see [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md).

---

## Development workflow

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feat/T-03-coverage-80

npm install
cd functions && npm ci && cd ..
npm run dev
```

### Required checks before PR

```bash
npm run ci
```

This runs: lint → functions build + unit tests → coverage → emulator tests → production build.

For scoped work, see minimum gates in [docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md#verification-gates-by-change-type).

**Do not merge without CI green on the PR.**

---

## Branch policy

| Branch                                        | Purpose                                                 |
| --------------------------------------------- | ------------------------------------------------------- |
| `main`                                        | Production; deploys to Firebase Hosting when configured |
| `develop`                                     | Optional integration                                    |
| `feat/*`, `fix/*`, `docs/*`, `test/*`, `ci/*` | All work via PR into `main`                             |

**Direct pushes to `main` are discouraged.** Use PRs + squash merge.

---

## Pull request guidelines

- **One TASKBOARD ID per PR** (e.g. `[V-01]`, `[S-06]`)
- Include tests for new/changed game systems
- No new `any` in `src/game/` — use `GameTypes.ts`
- No `(window as any)` for game state — use `GameEngineStatusBus`
- Do not add gameplay logic directly to `GameEngine.ts` — extract systems
- Update `TASKBOARD.md` when completing a task
- Update `docs/VERIFICATION_2026-06-30.md` if security/coverage/CI gates change
- Firebase changes: update `firestore.rules` + `security_spec.md` + emulator tests

Use [.github/pull_request_template.md](./.github/pull_request_template.md).

### PR title format

```
feat(scope): short description [TASK-ID]
fix(security): session anti-cheat validation [S-06]
docs: agentic workflow and git guidelines
test(coverage): GameEngine branch paths [T-04]
```

---

## Commit message format

```
type(scope): imperative summary [TASK-ID]

- Notable change bullet
- Risk or follow-up if any

Tests: npm run ci passes
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`

---

## Version & release

- Version lives in `package.json` (SemVer)
- **Do not bump version on every PR** — only on release PRs
- Release process: [DEPLOYMENT.md](./DEPLOYMENT.md) checklist + `CHANGELOG.md`

---

## AI agent instructions

1. Read [docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md) fully
2. Claim one TASKBOARD ID; check parallel conflict matrix
3. Run `npm run ci` before opening PR
4. Never mark stubs complete; never lower coverage thresholds without TASKBOARD approval
5. Search for forbidden patterns: hardcoded `SALT`, `Supabase`, `firebase-applet-config.json`

---

## Code review focus

- Delta-time (`dt`) only — no `setTimeout` / `setInterval` for gameplay
- Renderer changes in `src/game/rendering/`, not monolithic `Renderer.ts` growth
- Accessibility via `AccessibilitySettings.ts`
- Cloud saves/scores via callables only — no direct client Firestore writes

---

## Questions

Open an issue on [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/issues).
