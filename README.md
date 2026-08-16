# BugSmasher-HopeTheory

<div align="center">

![BugSmasher](https://img.shields.io/badge/BugSmasher-HopeTheory-2.5.0-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-%7E5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-651%20tests-2ECC71?style=for-the-badge)](https://vitest.dev)
[![Accessibility](https://img.shields.io/badge/Accessibility-in%20progress-FF6B6B?style=for-the-badge)](/docs/BLUEPRINT_10_10.md)

</div>

**Accessible bug-squashing arcade game** built with React 19, TypeScript, and Canvas 2D. High-intensity gameplay meets brutalist OS aesthetics and neon bio-luminescent bugs.

**Live:** [https://bugsmasher-hopetheory.vercel.app](https://bugsmasher-hopetheory.vercel.app)  
**Repo:** [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)

---

## 🎯 What this is

BugSmasher is an actively hardened browser-game project with a strong automated verification baseline. It is **not yet claiming final production-grade 10/10 readiness**: coverage remains below the final target, accessibility still needs evidence-backed WCAG 2.2 AA verification, and several commercial/operational integrations remain intentionally de-scoped or stubbed.

---

## ✨ Key features

- **Accessibility foundations** — keyboard-first navigation, ARIA support, difficulty/reduced-motion/colorblind gameplay controls; full WCAG 2.2 AA verification remains in progress
- **Performance scaling** — adaptive rendering/VFX controls and mobile-aware canvas scaling
- **Security boundaries** — Firebase callable write paths, authentication, schema validation, server checksums, rate limiting, and server-issued one-time score sessions
- **Modular architecture** — extracted combat/bug behavior systems, separated audio systems, typed renderers, and dependency seams
- **AI-assisted workflow** — repository agent rules and engineering skills are documented in `AGENTS.md` and `.agents/`

---

## 🧪 Quality & CI

The latest repository verification addendum reports:

| Signal | Latest repository-reported result |
|--------|-----------------------------------|
| Frontend tests | 651 passing Vitest tests |
| Firebase tests | 26 emulator/integration tests plus 6 Functions schema tests |
| Coverage | 79.17% lines · 78.12% statements · 84.57% functions · 66.02% branches |
| Final coverage target | 80% lines · 80% statements · 75% functions · 70% branches |
| ESLint | 0 errors; advisory warnings remain |
| Playwright | 5/5 repository-reported specs passing |
| Production build | Passing in the latest repository-reported verification |

**Important:** these figures are repository-recorded verification results, not a claim that the current ChatGPT session freshly executed the commands.

**Run locally:**
```bash
git clone https://github.com/FahadIbrahim93/BugSmasher-HopeTheory.git
cd BugSmasher-HopeTheory
npm install
npm run dev
```

**Quality gates:**
```bash
npm run typecheck
npm run lint:eslint
npm run test:coverage
npm run test:emulator
npm run test:e2e
npm run ci
```

---

## 🔐 Security posture

Competitive leaderboard writes are server-authoritative. Score submission requires an authenticated user and a server-issued session token; tokens are user-bound, expire, are atomically consumed, and cannot be replayed. Emulator tests cover replay, expiry, cross-user use, and plausibility checks.

The repository also has Dependabot and CodeQL configured, plus a blocking `npm audit --audit-level=high` workflow for root and Functions dependencies.

This is strong baseline protection, not a claim of perfect anti-cheat: authoritative gameplay-run summaries/replay verification remain future hardening work if competitive integrity requirements demand them.

---

## 📚 Documentation

- **[docs/BLUEPRINT_10_10.md](./docs/BLUEPRINT_10_10.md)** — 10/10 roadmap
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System design & module boundaries
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — CI/CD + Firebase/Vercel deployment reality
- **[SECURITY.md](./SECURITY.md)** — Vulnerability disclosure & security model
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Contributor & agent entry point
- **[CHANGELOG.md](./CHANGELOG.md)** — Version history
- **[TASKBOARD.md](./TASKBOARD.md)** — Work items to 10/10
- **[SESSION.md](./SESSION.md)** — Current engineering session and evidence policy

---

## 🚧 Explicitly not production-integrated yet

The following remain intentionally incomplete until real providers and operational/legal controls are added:

- Paid monetization/payment processing
- Advertising
- Production analytics/telemetry consent
- Crash reporting and runtime alerting
- Final WCAG 2.2 AA evidence gate
- Final 80/80/75/70 coverage gate

The project should not claim those capabilities are live merely because integration stubs exist in the source tree.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
