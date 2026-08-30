# BugSmasher — Release Certification Standard

**Target:** Verified 10/10 production-ready showcase  
**Status:** Not yet certified  
**Certification owner:** Maintainer + independent verification evidence  
**Rule:** A gate is green only when implementation and evidence agree.

## 1. What 10/10 means

A 10/10 rating is not a subjective score. It is a release certification state.

BugSmasher is certified 10/10 only when every release-critical gate below is GREEN and supported by current evidence on the exact release commit.

There is no “close enough” certification.

## 2. Certification pillars

| Pillar | Required 10/10 condition | Evidence |
|---|---|---|
| Code quality | TypeScript clean; ESLint 0 errors/0 warnings; no prohibited suppressions | CI + static scan |
| Architecture | Clear subsystem boundaries; no unacceptable god objects or circular dependencies | architecture audit + build |
| Testing | Strong coverage, regression tests, integration tests and critical E2E | test/coverage artifacts |
| Security | Auth/rules/server validation proven; no critical vulnerabilities | emulator + audit + CodeQL |
| Competitive integrity | Score submission resistant to replay, spoofing and implausible runs | adversarial tests |
| Accessibility | Critical flows pass automated and manual accessibility review | axe/Lighthouse/manual audit |
| Performance | Defined budgets pass on representative devices/scenarios | benchmark artifact |
| CI/CD | Required pipeline green and reproducible | GitHub Actions |
| Deployment/operations | Deployment is reproducible; failures observable; rollback documented | deployment evidence |
| Product/UX | Core player journey complete, coherent and free of dead/stub UI | acceptance audit |
| Documentation | Current, internally consistent, evidence-linked, reproducible | documentation audit |
| Git governance | Protected main, review/check gates, clean release history | repository settings + history |

## 3. Hard release gates

### G1 — Build

- production build succeeds;
- no known build warnings that indicate correctness risk;
- generated artifact can be served successfully;
- production configuration is reproducible.

### G2 — Type safety

- `npm run typecheck` exits 0;
- no `@ts-ignore`, `@ts-nocheck`, `as any`, or equivalent bypasses in production source unless explicitly documented and approved as an exception.

### G3 — Static quality

- `npm run lint:eslint` exits 0;
- 0 errors;
- 0 warnings;
- new suppressions require explicit justification and a tracked removal task.

### G4 — Unit/integration tests

- all tests pass;
- no skipped critical tests;
- meaningful regression coverage exists for every discovered production defect.

### G5 — Coverage

Target floor for certification:

| Metric | Floor |
|---|---:|
| Statements | 85% |
| Lines | 85% |
| Functions | 85% |
| Branches | 75% |

The target may be exceeded. It may not be lowered merely to obtain a green build.

### G6 — End-to-end

Critical path must be automated and green:

`launch → start game → gameplay → pause/resume → game over → score/save path → leaderboard`

Additional critical journeys should be added for authentication, settings, progression and offline recovery as those become release-critical.

### G7 — Security

- Firestore denies unauthorized direct writes;
- callable functions validate authentication, schema and business rules;
- rate limits are tested;
- authoritative score/save paths are server validated;
- CodeQL is green;
- dependency scanning has no unresolved critical production vulnerability;
- high production vulnerabilities require explicit documented exception and mitigation.

### G8 — Competitive integrity

Minimum accepted protections:

- server-issued session identity;
- user binding;
- expiry;
- one-time consumption;
- replay rejection;
- implausible score rejection;
- rate limiting.

Advanced competitive requirements may add signed run summaries, deterministic seeds, event sequence validation or replay verification.

### G9 — Accessibility

No known critical accessibility defect across the supported product surface.

Review includes keyboard operation, focus order/visibility, semantics, contrast, reduced motion, color-independent communication, touch targets and assistive-technology behavior.

### G10 — Performance

Maintain explicit budgets in source control. At minimum measure:

- initial load;
- largest JS assets;
- memory;
- frame time/FPS;
- heavy-wave and boss-wave performance;
- particle/VFX stress;
- mobile behavior.

Regression is a release blocker when a budget is exceeded without an accepted exception.

### G11 — Deployment/operations

- deployment procedure tested from a clean environment;
- environment configuration documented;
- monitoring/error reporting either real and verified or explicitly de-scoped;
- rollback path documented and tested where practical;
- backup/recovery expectations documented for persistent data.

### G12 — Documentation truth

Every current numeric claim must identify its source of truth.

Examples:

- test count → CI artifact;
- coverage → coverage artifact;
- CI status → Actions run;
- accessibility claim → current audit;
- production provider claim → actual configured integration.

Historical documents must be clearly historical.

## 4. Severity model

**P0 — Release blocker:** security bypass, data-integrity issue, failing main CI, broken production build/deploy, unreproducible release, or materially false production claim.

**P1 — High:** major quality debt, accessibility defect, significant performance regression, incomplete critical workflow, or operational blind spot.

**P2 — Medium:** maintainability, polish, non-critical UX or optimization work.

**P3 — Optional:** experiments and post-release enhancements.

## 5. Evidence record

Every certification run records:

```text
Commit SHA:
Release/version:
Date/time:
Verifier:
CI run:
Build:
Typecheck:
Lint:
Unit/integration:
Coverage:
Emulator/security:
E2E:
Dependency audit:
CodeQL:
Accessibility:
Performance:
Deployment:
Open P0:
Open P1:
Exceptions:
Final certification: PASS / FAIL
```

## 6. Exception policy

Exceptions are allowed only when:

1. the exact risk is documented;
2. the affected surface is identified;
3. mitigation exists;
4. a removal task exists;
5. the exception does not conceal a known production-critical vulnerability.

Exceptions must never be silently converted into “done.”

## 7. Anti-gaming policy

Certification fails if quality is manufactured by:

- lowering thresholds without fixing the underlying gap;
- removing meaningful tests;
- excluding problematic source solely to improve metrics;
- suppressing lint/security findings without justification;
- hiding failed CI in documentation;
- claiming provider integrations that are stubs;
- manually editing reported metrics.

## 8. Final sign-off

The final release statement must answer:

> Can a new engineer, auditor or coding agent reproduce the build, understand the architecture, run the verification suite, identify known limitations, and safely continue development without relying on undocumented tribal knowledge?

If the answer is no, certification is FAIL.