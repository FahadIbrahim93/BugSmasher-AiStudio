# BUGSMASHER // Tactical QA System 🛡️👾

An ultra-minimalist, high-intensity AI-themed base defense game with Brutalist OS aesthetics vs. neon bio-luminescent bugs. React 19 + TypeScript + Canvas 2D. 60+ FPS target with real-time performance scaling.

**Live:** [https://bugsmasher-hopetheory.vercel.app](https://bugsmasher-hopetheory.vercel.app) _(primary — serves the latest build with FURY/venting + full SFX pack; cloud features need one Vercel redeploy to pick up the `vercel.json` env config — see DEPLOYMENT.md)_ · [Firebase mirror](https://studio-1155838266-56095.web.app) _(secondary — currently stale; needs `FIREBASE_SERVICE_ACCOUNT` secret to auto-deploy)_  
**Repo:** [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)  
**Version:** 2.5.0 | **Audit:** ~7.1/10 (as of July 2026). **507** frontend tests pass with engine/lib coverage gates; **21** Firebase emulator + functions unit tests prove the security boundary. See [BLUEPRINT_10_10.md](./docs/BLUEPRINT_10_10.md), [VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md), and [AGENTS.md](./AGENTS.md).

## 📚 Documentation Index

- **[docs/BLUEPRINT_10_10.md](./docs/BLUEPRINT_10_10.md)** — SINGLE SOURCE OF TRUTH — 10/10 roadmap
- **[docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md)** — Git, PR, multi-agent parallel work, SemVer
- [AGENTS.md](./AGENTS.md) — AI coding standards & architecture rules
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contributor & agent entry point
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — Community standards
- [SECURITY.md](./SECURITY.md) — Vulnerability disclosure & security model
- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [DEPLOYMENT.md](./DEPLOYMENT.md) — CI/CD + Firebase
- [TASKBOARD.md](./TASKBOARD.md) — All work items to 10/10
- [docs/VERIFICATION_2026-06-30.md](./docs/VERIFICATION_2026-06-30.md) — Session verification evidence
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design & module boundaries
- [docs/EMULATOR_TESTING.md](./docs/EMULATOR_TESTING.md) — Firebase emulator setup
- [security_spec.md](./security_spec.md) — Firestore security model

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
npm run typecheck          # TypeScript check (tsc --noEmit)
npm run lint:eslint        # ESLint (TS + React + a11y rules)
npm run lint:all           # Both typecheck + ESLint
npm test                   # 600+ frontend unit tests
npm run test:coverage     # engine/lib coverage gate
npm run test:emulator     # Firestore rules + callable tests (requires Java 21+)
npm run validate:functions # Cloud Functions build + schema unit tests
npm run ci                # typecheck (hard gate) + functions + coverage + emulator + build; ESLint advisory (tracked debt, see AGENTS.md)
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full pipeline and production deploy.

**Next Focus**: See [docs/BLUEPRINT_10_10.md](./docs/BLUEPRINT_10_10.md) for the complete 12-week roadmap to a verified 10/10. Track sprint execution in [TASKBOARD.md](./TASKBOARD.md).
