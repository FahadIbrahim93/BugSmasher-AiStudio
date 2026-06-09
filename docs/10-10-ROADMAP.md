# BUGSMASHER 10/10 ROADMAP (Updated June 2026)

**Current:** 7.4/10 (per COMPREHENSIVE_AUDIT_2026.md)  
**Target:** Production-grade (9.5+/10) for Early Access / Portfolio / Steam.

## Verified Gaps (Live Repo Evidence)
**P0 (Blocking 10/10)**:
- Test Coverage Metrics: `npm test` lacks `--coverage`. Add to vitest.config.ts + CI.
- Remaining `any` Types: Present in UI layers / firebaseService (per audit).
- Audio: Procedural Web Audio only — critical player-facing gap.
- Security: Client-side checksum dominant; enhance server validation/rate limiting in functions/.

**P1**:
- Integration/E2E tests (unit tests strong).
- Firestore rules schema validation.
- npm audit in CI.
- Full ARIA + colorblind support.

**Evidence**: COMPREHENSIVE_AUDIT_2026.md, package.json, firestore.rules, src/ structure.

## Actionable Sprints
**Sprint 1 (Security & Quality, ~8h)**:
1. Add `npm audit` to .github/workflows/ci.yml.
2. Enhance Firestore rules + Cloud Functions.
3. Document schema in docs/API_SPEC.md.

**Sprint 2 (Testing, ~10h)**:
- Coverage reporting.
- Integration + basic E2E tests.

**Sprint 3 (Polish)**: Audio integration (outsource), DI, bundle budgets, A11y.

## 10/10 Verification Checklist
- [ ] Coverage ≥85%, CI green.
- [ ] 0 unresolved `any` in core.
- [ ] Server-side validation + rate limits.
- [ ] Professional audio.
- [ ] Lighthouse ≥85, bundle limits enforced.
- Re-audit after sprints.

Track in TASKBOARD.md. Prioritize audio for player retention.