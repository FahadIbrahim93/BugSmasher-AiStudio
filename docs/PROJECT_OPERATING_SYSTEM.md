# BugSmasher Project Operating System

**Status:** Active control document  
**Owner:** Project maintainer + designated coding agents  
**Purpose:** Keep BugSmasher coherent when multiple AI agents, IDEs, branches, and coding platforms are used in parallel.

## 1. The core problem this solves

BugSmasher is developed with multiple AI agents and frequent context switching. That creates predictable failure modes:

- two agents change the same files in incompatible ways;
- an agent assumes an old document is current;
- a passing local test is mistaken for a release-ready build;
- completed work is duplicated;
- unfinished experiments are mistaken for product features;
- README metrics become stale;
- fixes are made only to satisfy tests instead of preserving real behavior.

This document is the operating system for avoiding those failures.

## 2. One source of truth

Use these documents in this order:

1. `docs/PROJECT_OPERATING_SYSTEM.md` — how the project is managed.
2. `AGENTS.md` — coding and architecture rules.
3. `TASKBOARD.md` — what work exists and who owns it.
4. `docs/RELEASE_CERTIFICATION.md` — what 10/10 means and what evidence is required.
5. `docs/ARCHITECTURE.md` — module boundaries and dependency direction.
6. `docs/AGENT_HANDOFF.md` — how unfinished work is transferred.
7. `docs/STATUS.md` — current verified state and known blockers.
8. `docs/VERIFICATION_*.md` — historical evidence snapshots.

Older audit/roadmap documents remain historical unless explicitly promoted by a current verification record.

## 3. Non-negotiable rules

### Truth

- Code existing is not proof of completion.
- A local test result is not proof of CI success.
- A README claim is never stronger than the latest verified evidence.
- Never change a threshold simply to make CI pass.
- Never delete or weaken a regression test to hide a defect.
- Never mark a stub, mock, demo, placeholder, or simulated provider as production-complete.

### Scope

- One primary TASKBOARD ID per implementation branch/PR.
- Keep changes atomic and reviewable.
- Do not combine unrelated refactors with a bug fix.
- Prefer the smallest change that satisfies acceptance criteria.

### Safety

- Never commit secrets, service-account files, `.env` files, production salts, or credentials.
- Never put authoritative security decisions only in the client.
- Security-sensitive changes require emulator/integration evidence.

### Game-engine invariants

- Gameplay timers use delta-time (`dt`), not `setTimeout`/`setInterval`.
- Rendering code does not own game rules.
- React components do not mutate engine state during render.
- Do not read mutable refs during React render paths.
- Keep authoritative progression/scoring rules outside presentational components.

## 4. Agent startup protocol

Every coding agent must do this before touching code:

1. Read this document.
2. Read `AGENTS.md`.
3. Read `TASKBOARD.md`.
4. Inspect current `docs/STATUS.md`.
5. Search open branches/PRs for the intended task ID and files.
6. Identify whether another agent owns a high-conflict file.
7. Claim exactly one primary task ID.
8. State the intended files and verification command before implementation.

If the task cannot be uniquely identified, do not invent a second overlapping task. Use the existing nearest task or create a new task entry first.

## 5. Agent execution loop

```text
READ → CLAIM → PLAN → IMPLEMENT → VERIFY → DOCUMENT → HANDOFF/PR
```

### READ

Understand current code, not just task prose.

### CLAIM

Use the task ID in the branch/PR title.

### PLAN

List:
- files to touch;
- behavioral risk;
- tests to update/add;
- required gates.

### IMPLEMENT

Keep behavior-preserving changes separate from behavior-changing changes wherever practical.

### VERIFY

Run the narrowest relevant test first, then the appropriate broader gate. For release-critical changes, run `npm run ci`.

### DOCUMENT

Update the task status only when the acceptance criteria are actually met. Record new evidence in the current verification record when security, coverage, CI, deployment, or product claims change.

### HANDOFF

Any unfinished work gets a structured handoff using `docs/AGENT_HANDOFF.md`.

## 6. Parallel work rules

### Safe to parallelize

- documentation-only work;
- independent UI components;
- independent unit-test files;
- isolated game-system files;
- separate analysis/audit tasks.

### Serialize by default

Only one active agent should modify each of these at a time:

- `src/game/GameEngine.ts`
- `vitest.config.*`
- `package.json` / lockfiles
- `firestore.rules`
- `functions/src/*` security handlers
- major shared CSS/token files
- deployment workflow files

### Merge conflict rule

If another agent is already changing the same high-conflict file, do not race them. Reassign the task to a non-conflicting path or wait for the existing change to land in a controlled branch/PR workflow.

## 7. Anti-distraction rule

When the maintainer changes direction, unfinished work is not silently abandoned.

The agent must leave one of these explicit states:

- **DONE** — acceptance criteria met and verified;
- **PARTIAL** — meaningful progress, exact remaining work recorded;
- **BLOCKED** — external dependency or decision required;
- **SUPERSEDED** — intentionally replaced by another task;
- **ABANDONED** — intentionally stopped with a reason.

Never leave work in an ambiguous state.

## 8. Verification hierarchy

Evidence strength, highest to lowest:

1. Green GitHub Actions run on the exact commit.
2. Reproducible local command on the exact commit.
3. Automated test artifact/report.
4. Repository inspection.
5. Human visual/manual inspection.
6. Agent assertion.

A lower-level signal cannot override a stronger contradictory signal.

Example: “agent says tests pass” does not override a red CI run.

## 9. Definition of complete

A task is complete only when all are true:

- implementation exists;
- acceptance criteria are met;
- regression tests exist where behavior changed;
- no known high-severity defect was introduced;
- required verification passes;
- relevant documentation is updated;
- TASKBOARD status is updated;
- unfinished follow-ups are explicitly recorded.

## 10. Release discipline

`main` is the releasable branch.

A release candidate must have:

- green CI;
- verified security gates;
- verified coverage gates;
- verified E2E smoke path;
- documented deployment status;
- synchronized documentation;
- no unresolved release blockers.

The project may be feature-complete without being release-certified.

## 11. What the maintainer should do when returning after a break

Do not ask “what were we doing?” to every agent.

Read, in order:

1. `docs/STATUS.md`
2. top of `TASKBOARD.md`
3. latest `docs/VERIFICATION_*.md`
4. latest open PRs
5. latest CI run

Then continue from the first unresolved P0/P1 task.

## 12. AI-agent quality standard

Agents are expected to behave like senior maintainers:

- challenge incorrect assumptions;
- identify stale documentation;
- prefer evidence over confidence;
- call out architectural debt immediately;
- refuse scope creep inside unrelated tasks;
- add regression coverage for discovered defects;
- preserve backwards compatibility unless the task explicitly changes it;
- leave the repository easier for the next agent to understand.

The goal is not maximum code output.

The goal is maximum **verified project quality per change**.