# BugSmasher — Live 10/10 Taskboard

**Last updated:** 2026-08-30  
**Certification:** NOT CERTIFIED  
**Current state:** strong engineering baseline; `main` @ `bbc7250` CI is GREEN (CI + CodeQL + Security Audit), verified locally on the exact commit.

Read first: [Project Operating System](./docs/PROJECT_OPERATING_SYSTEM.md) · [Release Certification](./docs/RELEASE_CERTIFICATION.md) · [Current Status](./docs/STATUS.md) · [AGENTS.md](./AGENTS.md)

## Operating rules

- One primary task ID per implementation branch/PR.
- P0 work before discretionary P1/P2 work.
- A task is `[x]` only with acceptance evidence.
- Never lower a test/security threshold to manufacture a pass.
- Never delete a regression test to hide a defect.
- Never claim a provider/integration is production-ready while it is a stub.
- Documentation must follow verified repository state.

**Legend:** `[ ]` open · `[~]` partial · `[x]` verified done · **P0** release blocker · **P1** high · **P2** medium · **P3** optional

---

## P0 — Restore the verification foundation

| ID          | Task                                        | Acceptance                                                                                                                           | State                                                                                |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| P0-CI-01    | Fix failing emulator regression test        | `functions/test/callables.test.ts` uses a plausible score for a fresh session; anti-cheat logic remains intact; emulator suite green | `[x]` verified 2026-08-30: emulator 26/26 on `bbc7250`                               |
| P0-CI-02    | Run full CI on exact main commit            | typecheck + functions + coverage + emulator + build + lint + E2E all green                                                           | `[x]` verified 2026-08-30: GitHub CI green on `bbc7250` + local re-run of every gate |
| P0-TRUTH-01 | Synchronize README/STATUS/verification docs | no stale test, coverage or CI claims                                                                                                 | `[~]` AGENTS/STATUS/TASKBOARD synced 2026-08-30                                      |
| P0-GOV-01   | Protect `main`                              | required CI checks + no unsafe direct merges                                                                                         | `[ ]` requires repository admin settings                                             |

---

## P0 — Security and supply chain

| ID   | Task                                         | Acceptance                                                                                         |
| ---- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| S-01 | Dependency vulnerability cleanup             | 0 unresolved critical production vulnerabilities; high findings resolved or explicitly mitigated   |
| S-02 | CodeQL/Dependabot verification               | current security workflows green                                                                   |
| S-03 | Secret/config audit                          | no credentials, production salts or service-account material in source/history                     |
| S-04 | Competitive integrity adversarial suite      | authentication, user binding, expiry, replay, rate limit, implausible score and abuse cases proven |
| S-05 | Evaluate signed/deterministic run validation | documented decision: required vs not required, with rationale                                      |

---

## P1 — Zero-debt code quality

| ID    | Task                                      | Acceptance                                                                                                   |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| CQ-01 | Burn down ESLint warnings                 | 0 errors and 0 warnings on supported source/tooling                                                          |
| CQ-02 | Eliminate unsafe `any`                    | no avoidable `any`, unsafe member access or unsafe casts in production source                                |
| CQ-03 | React purity cleanup                      | no render-time `Date.now`, `performance.now`, `Math.random`, mutable ref reads or state-effect anti-patterns |
| CQ-04 | Remove unnecessary hook dependency issues | hooks are dependency-correct or intentionally documented                                                     |
| CQ-05 | Standardize formatting                    | Prettier check green; no formatting churn mixed with behavior work                                           |

---

## P1 — Architecture

| ID   | Task                           | Acceptance                                                                          |
| ---- | ------------------------------ | ----------------------------------------------------------------------------------- |
| A-01 | GameEngine decomposition       | orchestration-only; specialized systems own domain behavior                         |
| A-02 | Sound/audio decomposition      | music, SFX and voice separated cleanly                                              |
| A-03 | Remove static service coupling | injectable interfaces for major services where practical                            |
| A-04 | Remove dead/duplicate paths    | unused modules/features removed or clearly archived                                 |
| A-05 | Dependency direction audit     | UI → application/game services → infrastructure; no accidental reverse dependencies |

---

## P1 — Testing and reliability

| ID   | Task                                            | Acceptance                                                                                           |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| T-01 | Coverage floors                                 | 85% statements, 85% lines, 85% functions, 75% branches                                               |
| T-02 | Critical branch coverage                        | GameEngine, SaveManager, WaveManager, InputSystem and security paths have meaningful branch coverage |
| T-03 | Regression-test every discovered production bug | each fixed defect has a durable automated test                                                       |
| T-04 | E2E critical journey                            | launch → play → pause/resume → game over → persistence/leaderboard is green                          |
| T-05 | Accessibility automated suite                   | axe/Lighthouse-style automated checks integrated where applicable                                    |
| T-06 | Mutation testing on critical logic              | security/scoring tests demonstrate resistance to meaningful mutants                                  |

---

## P1 — Performance

| ID      | Task                                   | Acceptance                                                                         |
| ------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| PERF-01 | Establish performance budgets          | startup, bundle, frame time, memory and network budgets stored in repo             |
| PERF-02 | Stress benchmark                       | normal/heavy/boss/particle-heavy scenarios measured                                |
| PERF-03 | Mobile benchmark                       | representative low/mid device profile remains usable                               |
| PERF-04 | Remove correctness-risk build warnings | production build output is clean or every remaining warning is explicitly accepted |

---

## P1 — Accessibility

| ID    | Task                         | Acceptance                                                |
| ----- | ---------------------------- | --------------------------------------------------------- |
| AX-01 | Keyboard-only audit          | complete critical flows usable without pointer            |
| AX-02 | Focus/semantics audit        | visible focus, labels, dialog semantics and logical order |
| AX-03 | Reduced-motion audit         | gameplay + React shell respect preference consistently    |
| AX-04 | Contrast/color audit         | no critical information depends on color alone            |
| AX-05 | Manual assistive-tech review | supported screen reader workflow documented               |

---

## P1 — Production operations

| ID     | Task                       | Acceptance                                                     |
| ------ | -------------------------- | -------------------------------------------------------------- |
| OPS-01 | Deployment reproducibility | clean-environment deployment documented and repeatable         |
| OPS-02 | Crash/error monitoring     | real provider verified, or feature explicitly de-scoped        |
| OPS-03 | Runtime monitoring         | uptime/error/function latency visibility, or explicit de-scope |
| OPS-04 | Rollback plan              | tested/documented rollback path                                |
| OPS-05 | Backup/recovery            | persistence recovery procedure documented                      |
| OPS-06 | Telemetry/privacy          | consent and privacy behavior defined before analytics ship     |

---

## P2 — Product / UX polish

| ID    | Task                   | Acceptance                                                         |
| ----- | ---------------------- | ------------------------------------------------------------------ |
| UX-01 | Remove dead UI         | every visible control is wired, intentionally disabled, or removed |
| UX-02 | Onboarding polish      | first-time player understands objective and controls quickly       |
| UX-03 | Game-feel pass         | hit feedback, audio, progression and game-over loop feel coherent  |
| UX-04 | Mobile responsive pass | supported viewport sizes checked manually + E2E where practical    |
| UX-05 | Visual consistency     | shared tokens/primitives replace ad-hoc patterns                   |

---

## P2 — Documentation

| ID     | Task                                  | Acceptance                                                           |
| ------ | ------------------------------------- | -------------------------------------------------------------------- |
| DOC-01 | Keep `STATUS.md` current              | blockers/evidence reflect latest verified state                      |
| DOC-02 | Maintain release certification record | every release candidate has current evidence                         |
| DOC-03 | ADR coverage                          | major architectural/security decisions recorded in `docs/adr/`       |
| DOC-04 | Reproducible onboarding               | a fresh agent can work from repository docs without tribal knowledge |

---

## 10/10 exit checklist

- [ ] P0-CI-01
- [ ] P0-CI-02
- [ ] P0-TRUTH-01
- [ ] P0-GOV-01
- [ ] S-01 through S-05 accepted
- [ ] CQ-01 through CQ-05 accepted
- [ ] A-01 through A-05 accepted
- [ ] T-01 through T-06 accepted
- [ ] PERF-01 through PERF-04 accepted
- [ ] AX-01 through AX-05 accepted
- [ ] OPS-01 through OPS-06 accepted
- [ ] UX-01 through UX-05 accepted
- [ ] DOC-01 through DOC-04 accepted
- [ ] Final adversarial audit completed
- [ ] `docs/RELEASE_CERTIFICATION.md` records PASS

**Do not set the final certification checkbox until the exact release commit is independently verified.**
