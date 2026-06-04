# Contributing to BUGSMASHER

Thank you for contributing. This project uses strict architecture rules so humans and AI agents can work safely in parallel.

---

## Before You Start

1. Read [SINGLE_SOURCE_OF_TRUTH.md](./docs/SINGLE_SOURCE_OF_TRUTH.md) — unified architecture, audit standards, and roadmap  
2. Pick a task from TASKBOARD section in SSOT  
3. Review current quality ratings (8.2/10 composite)

---

## Development Workflow

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

npm install
npm run dev
```

### Required checks

```bash
npm run lint
npm test
npm run build
```

**Do not merge without all three passing.**

---

## Pull Request Guidelines

- One task per PR (reference task ID from SSOT in description, e.g. `P6-D`)  
- Include tests for new game systems  
- No `any` in `src/game/` — use `GameTypes.ts`  
- No `(window as any)` for game state — use `GameEngineStatusBus`  
- Do not add logic directly to `GameEngine.ts` — extract systems  
- Update `SINGLE_SOURCE_OF_TRUTH.md` backlog when complete  

### PR title format

```
feat(scope): short description [P2-01]
fix(scope): short description [P1-07]
docs: update deployment guide
```

---

## Commit Message Format

```
type(scope): imperative summary

- Bullet for notable changes
- Reference TASKBOARD ID

Tests: 409 passing
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`

---

## AI Agent Instructions

If you are an AI coder:

1. Read `SINGLE_SOURCE_OF_TRUTH.md` to understand architecture and current gaps  
2. Pick a task from the Master Backlog Checklist in SSOT  
3. Run full test suite before marking `[x]`  
4. Update dimension ratings in SSOT only when dimensions materially change  

---

## Code Review Focus

- Delta-time (`dt`) only — no `setTimeout` / `setInterval` for gameplay  
- Renderer changes go in `src/game/rendering/`, not a growing monolith  
- Accessibility settings via `AccessibilitySettings.ts`  
- Firebase changes must update `firestore.rules` and document in SSOT security section  

---

## Questions

Open an issue on [HopeTheoory/BugSmasher-ApZz](https://github.com/HopeTheoory/BugSmasher-ApZz) with the `question` label.