# Application Context & Standards

## Project identity

BugSmasher is a React 19 + TypeScript + Canvas 2D arcade game with Firebase-backed authentication, persistence, server-validated score submission, progression, achievements, procedural content, accessibility controls, and automated verification.

This repository is intentionally developed with multiple AI agents and coding platforms. The repository documentation is therefore part of the engineering system, not optional prose.

## Current truth (2026-08-30)

**Certification:** NOT 10/10 certified.  
**Latest inspected main CI:** GREEN on 2026-08-30 at commit `bbc7250` (CI, CodeQL and Security Audit workflows all passed).  
**Frontend tests in that state:** 752/752 passed (40 files); emulator suite 26/26 passed; functions unit 6/6 passed; Playwright E2E 5/5 passed.  
**ESLint:** 0 errors but 910 warnings in that state.  
**Coverage in that state:** 81.70% lines, 80.78% statements, 85.99% functions, 70.92% branches (enforced floors: 80/80/75/70).  
**Formatting:** `prettier --check .` still fails on ~181 files; formatting is not yet a CI gate.  
**Security:** server-issued session-token protection exists; it is not equivalent to complete deterministic replay verification. `npm audit --omit=dev` reports 0 vulnerabilities.

Treat all older ratings and victory-lap claims as historical unless backed by a newer verification record.

## Read order

1. `docs/PROJECT_OPERATING_SYSTEM.md`
2. `AGENTS.md` (this file)
3. `TASKBOARD.md`
4. `docs/STATUS.md`
5. `docs/RELEASE_CERTIFICATION.md`
6. `docs/ARCHITECTURE.md`
7. `docs/AGENT_HANDOFF.md`
8. task-specific documents and latest verification record

## Non-negotiable engineering rules

### Truth and evidence

- Never claim a check passed unless it actually passed.
- CI evidence outranks agent assertions and stale documents.
- Never lower coverage/security thresholds to manufacture green CI.
- Never delete or weaken a regression test merely to remove a failure.
- Never mark a stub/mock/simulation as production-complete.
- Update documentation whenever a quantitative claim changes.

### Git and collaboration

- One primary TASKBOARD ID per branch/PR.
- Prefer feature/fix/test/docs branches and PRs.
- `main` is the release branch.
- Keep unrelated work separate.
- Coordinate before touching high-conflict files.
- Never force-push shared branches.

### Game architecture

- `GameEngine` orchestrates; specialized systems own domain logic.
- Rendering owns drawing, not game rules.
- UI owns presentation and interaction, not authoritative scoring/security.
- Gameplay timing uses delta-time (`dt`). Do not use `setTimeout`/`setInterval` for game-state progression.
- Do not recreate global `window` state bridges.
- Prefer explicit dependency injection over new static service coupling.

### Type safety

- Prefer strict TypeScript over casts.
- No avoidable `any`, `as any`, `@ts-ignore`, or `@ts-nocheck`.
- Core game entities/types live in `src/game/GameTypes.ts` and should not be duplicated casually.

### React correctness

- Render functions should be deterministic.
- Do not call `Date.now`, `performance.now`, `Math.random`, mutable ref reads, or external mutations during render where React purity is violated.
- Effects must have correct dependencies and should not be used as a substitute for derived state.

### Security

- Client-side validation is UX assistance, not authority.
- Authoritative save/score rules belong in server callables and Firestore rules.
- Security-sensitive changes require emulator/integration tests.
- Never commit secrets, service-account JSON, production salts, credentials, or private tokens.

## Definition of done

A task is done only when:

1. acceptance criteria are met;
2. appropriate tests exist and pass;
3. required verification passes;
4. documentation is synchronized;
5. TASKBOARD state is updated;
6. known follow-up work is recorded.

## Standard verification

```bash
npm run typecheck
npm run lint:eslint
npm run test:coverage
npm run test:emulator
npm run build
npx playwright test
```

Use `npm run ci` for the full repository gate once the individual failure is understood.

## Agent behavior

Agents must be skeptical, incremental and auditable. Before editing, inspect the relevant implementation and current branch/PR state. After editing, explain the behavioral risk and verify it. Leave a structured handoff if work is incomplete.

The objective is not to produce the most code. The objective is to leave the repository more correct, more understandable and more independently verifiable.
