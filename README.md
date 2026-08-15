# BugSmasher-HopeTheory

<div align="center">

![BugSmasher](https://img.shields.io/badge/BugSmasher-HopeTheory-2.5.0-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-%7E5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-507%20tests-2ECC71?style=for-the-badge)](https://vitest.dev)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20Phase%206-FF6B6B?style=for-the-badge)](/docs/BLUEPRINT_10_10.md)

</div>

**Accessible bug-squashing arcade game** built with React 19, TypeScript, and Canvas 2D. High-intensity gameplay meets brutalist OS aesthetics and neon bio-luminescent bugs.

**Live:** [https://bugsmasher-hopetheory.vercel.app](https://bugsmasher-hopetheory.vercel.app)  
**Repo:** [FahadIbrahim93/BugSmasher-HopeTheory](https://github.com/FahadIbrahim93/BugSmasher-HopeTheory)

---

## 🎯 What this is

BugSmasher is a production-grade browser game that proves accessibility and performance can coexist in a high-intensity interactive experience. It’s not a portfolio demo—it’s a shipped, tested, and hardened application.

---

## ✨ Key features

- **Accessible by design** — WCAG-aligned input, ARIA labels, keyboard-first navigation, Phase 6 a11y shipped
- **Performance-hardened** — 60+ FPS target with real-time performance scaling and dynamic VFX downscaling
- **Security boundaries** — Firebase emulator + callable tests prove Firestore rules deny direct writes; auth + Zod schema + checksums enforced server-side
- **Modular architecture** — Renderer split, engine/lib separation, coverage thresholds enforced in CI
- **AI-assisted workflow** — Built with AI agents under strict architecture rules; see `AGENTS.md`

---

## 🧪 Quality & CI

| Signal | Value |
|--------|-------|
| Frontend tests | 507 passing Vitest tests |
| Firebase tests | 21 emulator + functions unit tests |
| Coverage | ~78% lines, ~62% branches |
| CI | typecheck + coverage + emulator + build |
| Version | 2.5.0 |

**Run locally:**
```bash
git clone https://github.com/FahadIbrahim93/BugSmasher-HopeTheory.git
cd BugSmasher-HopeTheory
npm install
npm run dev
```

**Quality gates:**
```bash
npm run typecheck          # TypeScript check
npm run lint:eslint        # ESLint + a11y rules
npm test                   # 600+ frontend unit tests
npm run test:coverage     # engine/lib coverage gate
npm run test:emulator     # Firestore rules + callable tests
npm run ci                # Full CI gate
```

---

## 📚 Documentation

- **[docs/BLUEPRINT_10_10.md](./docs/BLUEPRINT_10_10.md)** — 10/10 roadmap
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System design & module boundaries
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — CI/CD + Firebase
- **[SECURITY.md](./SECURITY.md)** — Vulnerability disclosure & security model
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Contributor & agent entry point
- **[CHANGELOG.md](./CHANGELOG.md)** — Version history
- **[TASKBOARD.md](./TASKBOARD.md)** — Work items to 10/10

---

## 🏆 Why this matters

- **Accessible gaming:** Proves high-intensity Canvas games can be WCAG-aligned
- **Security-first:** Server-authoritative score paths with checksum validation
- **Test discipline:** 500+ tests with coverage gates, not just demo coverage
- **Real-time scaling:** FPS-aware rendering pipeline, not just “works on my machine”

---

## 📄 License

MIT — see [LICENSE](LICENSE).
