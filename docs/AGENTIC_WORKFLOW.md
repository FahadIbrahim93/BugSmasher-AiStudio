# Agentic Workflow — Multi-Agent Safe Development

This file is the practical workflow for humans and AI agents working on BugSmasher across multiple IDEs and platforms.

## Required read order

1. [Project Operating System](./PROJECT_OPERATING_SYSTEM.md)
2. [AGENTS.md](../AGENTS.md)
3. [TASKBOARD.md](../TASKBOARD.md)
4. [Current Status](./STATUS.md)
5. [Release Certification](./RELEASE_CERTIFICATION.md)
6. [Architecture](./ARCHITECTURE.md)
7. [Agent Handoff](./AGENT_HANDOFF.md)

## Golden rules

- One primary TASKBOARD ID per branch/PR.
- Never assume another agent's work is complete; inspect the current branch and CI.
- Keep one owner per high-conflict file at a time.
- Never lower tests or security controls to make a build pass.
- Never delete a meaningful regression test to hide a defect.
- Never mark a stub as shipped.
- Never commit secrets or production credentials.
- Security-sensitive work requires emulator/integration evidence.
- Gameplay timing uses `dt`; do not introduce `setTimeout`/`setInterval` for game-state timing.

## Standard lifecycle

```text
READ → CLAIM → PLAN → IMPLEMENT → VERIFY → DOCUMENT → HANDOFF/PR
```

### READ

Understand current code and latest evidence.

### CLAIM

Claim exactly one task from `TASKBOARD.md`. Put the ID in the branch/PR title.

### PLAN

State intended files, behavioral risk, tests and gates.

### IMPLEMENT

Make the smallest coherent change. Avoid unrelated cleanup.

### VERIFY

Use the narrowest relevant test first, then the appropriate full gate. Release-critical changes require `npm run ci`.

### DOCUMENT

Update task status only when acceptance criteria and evidence exist.

### HANDOFF

Use `docs/AGENT_HANDOFF.md` whenever work remains incomplete or the context moves to another agent/platform.

## Parallel work matrix

| Domain | Normal paths | Rule |
|---|---|---|
| Game engine | `src/game/GameEngine.ts` | one active owner; extract new behavior instead of growing the file |
| Game systems | `src/game/*System.ts`, managers | parallel OK when files/domains are independent |
| Rendering | `src/game/rendering/*` | one owner per file |
| React UI | `src/components/*` | parallel OK across independent components |
| Firebase client | `src/lib/*`, save/auth code | coordinate with functions/rules changes |
| Functions | `functions/src/*` | serialize security-sensitive changes |
| Firestore rules | `firestore.rules` | coordinate with corresponding backend tests |
| Tooling | `.github/*`, `package.json`, lockfiles, config | dedicated changes preferred |
| Tests | `src/__tests__/*`, `functions/test/*` | align with the owning implementation task |
| Docs | `*.md`, `docs/*` | safe to parallelize, but current status docs are shared truth |

High-conflict files must not be edited by competing agents simultaneously without coordination.

## Git conventions

Branch patterns:

```text
feat/<task-id>-<description>
fix/<task-id>-<description>
test/<task-id>-<description>
docs/<description>
chore/<description>
ci/<description>
```

Commit format:

```text
<type>(<scope>): <imperative summary> [<TASKBOARD-ID>]
```

Examples:

```text
fix(security): reject replayed score sessions [S-04]
test(engine): cover boss wave transitions [T-02]
refactor(audio): separate voice from music manager [A-02]
```

## Verification by change type

| Change | Minimum verification |
|---|---|
| Gameplay/engine | affected unit tests + coverage; full CI before release |
| UI | typecheck + tests + manual/E2E smoke for interaction |
| Firebase/functions/rules | functions tests + Firestore emulator |
| Security | adversarial tests + emulator + security workflow |
| Dependencies | lockfile consistency + CI + audit |
| CI/tooling | workflow validation + full CI |
| Docs | links/path review; no stale claims |

## Context-switch recovery

When returning after distraction:

1. read `docs/STATUS.md`;
2. read the top of `TASKBOARD.md`;
3. inspect the latest Actions run;
4. inspect open PRs;
5. resume the highest-priority unresolved task.

Do not restart work from memory.

## Done means done

A task is complete only when implementation, tests, required verification, documentation and task status all agree.

A green-looking local branch is never permission to claim the release is green if the current GitHub Actions state says otherwise.

## Emergency handling

If `main` is broken:

1. stop discretionary feature work;
2. reproduce the failure;
3. create/focus a P0 fix;
4. add/repair regression coverage;
5. restore green CI;
6. update `docs/STATUS.md`.

Use Git revert for an unsafe merged change rather than rewriting shared history.

## Final authority

For what is allowed into a release, use `docs/RELEASE_CERTIFICATION.md`. For what to do next, use `TASKBOARD.md`. For how to work safely, use `docs/PROJECT_OPERATING_SYSTEM.md`.