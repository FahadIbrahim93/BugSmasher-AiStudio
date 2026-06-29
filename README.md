# BUGSMASHER // Tactical QA System 🛡️👾

An ultra-minimalist, high-intensity AI-themed base defense game with Brutalist OS aesthetics vs. neon bio-luminescent bugs. React 19 + TypeScript + Canvas 2D. 60+ FPS target with real-time performance scaling.

**Live:** [https://studio-1155838266-56095.web.app](https://studio-1155838266-56095.web.app)  
**Repo:** [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)  
**Version:** 2.5.0 | **Audit:** 7.2/10 after the June 29, 2026 remediation pass. The normal unit suite passes and cloud save/leaderboard writes now use server callables, but coverage, emulator proof, full anti-cheat telemetry, real linting, and production stubs remain active release gates. See CTO_AUDIT_2026-06-29.md and PERFECT_10_REMEDIATION_PLAN.md.

## 📚 Documentation Index
- [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md) — Principal engineer review
- [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md) — Actionable path to a verified 10/10
- [DEPLOYMENT.md](./DEPLOYMENT.md) — CI/CD + Firebase
- [TASKBOARD.md](./TASKBOARD.md) — Backlog
- [AGENTS.md](./AGENTS.md) — AI coding standards
- Full suite in `/docs/`

## 🏆 Recent Wins (Verified 2026-06-21)
- Real-time FPS scaler + dynamic VFX downscaling.
- Modular systems + Renderer split + **strict TS source clean**.
- 400+ Vitest tests; slop removed.
- Accessibility + security (OAuth scopes eliminated).
- Vercel tuned + clean push to main; merge conflicts resolved.
- Full honest audit performed; critical security and test issues being addressed (see AUDIT_HONEST.md and AGENTS.md for current status).

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
npm run ci  # lint + test + build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full pipeline and production deploy.

**Next Focus**: server-authoritative security, coverage recovery, real linting, and production-stub de-scoping. Track in [TASKBOARD.md](./TASKBOARD.md) and [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md).