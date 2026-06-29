# BUGSMASHER // Tactical QA System 🛡️👾

An ultra-minimalist, high-intensity AI-themed base defense game with Brutalist OS aesthetics vs. neon bio-luminescent bugs. React 19 + TypeScript + Canvas 2D. 60+ FPS target with real-time performance scaling.

**Live:** [https://studio-1155838266-56095.web.app](https://studio-1155838266-56095.web.app)  
**Repo:** [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)  
**Version:** 2.5.0 | **Audit:** ~7.5/10 after the June 30, 2026 session. **507** frontend tests pass with engine/lib coverage gates; **21** Firebase emulator + functions unit tests prove the security boundary. Session-token anti-cheat, real ESLint, and production stubs remain release gates. See [VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md), [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md), and [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md).

## 📚 Documentation Index

- **[docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md)** — Git, PR, multi-agent parallel work, SemVer
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contributor & agent entry point
- [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md) — Session verification evidence
- [docs/EMULATOR_TESTING.md](./docs/EMULATOR_TESTING.md) — Firebase emulator setup
- [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md) — Principal engineer review
- [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md) — Actionable path to a verified 10/10
- [DEPLOYMENT.md](./DEPLOYMENT.md) — CI/CD + Firebase
- [TASKBOARD.md](./TASKBOARD.md) — Backlog
- [AGENTS.md](./AGENTS.md) — AI coding standards
- Full suite in `/docs/`

## 🏆 Recent Wins (Verified 2026-06-30)

- **507** Vitest tests with engine/lib coverage thresholds (~78% lines, ~62% branches).
- Firebase emulator tests: Firestore rules deny direct writes; callables enforce auth, Zod schema, checksums, rate limits.
- Cloud Functions modularized (`functions/src/` — schema, validation, rate limiting, handlers).
- Real-time FPS scaler + dynamic VFX downscaling; modular systems + Renderer split.
- Accessibility + security (OAuth scopes eliminated; server-authoritative save/score paths).
- See [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md) for command evidence.

## 🏃 Getting Started

### Development

```bash
git clone https://github.com/FahadIbrahim93/BugSmasher-HopeTheory.git
cd BugSmasher-HopeTheory
npm install
npm run dev
```

### Quality & CI

```bash
npm run lint              # TypeScript check (tsc --noEmit)
npm test                  # 507 frontend unit tests
npm run test:coverage     # engine/lib coverage gate
npm run test:emulator     # Firestore rules + callable tests (requires Java 21+)
npm run validate:functions # Cloud Functions build + schema unit tests
npm run ci                # all, functions, coverage, emulator, build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full pipeline and production deploy.

**Next Focus**: server-authoritative security, coverage recovery, real linting, and production-stub de-scoping. Track in [TASKBOARD.md](./TASKBOARD.md) and [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md).
