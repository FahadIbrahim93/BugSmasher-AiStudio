# BugSmasher — current README

<div align="center">

![BugSmasher](https://img.shields.io/badge/BugSmasher-HopeTheory-2.5.0-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-%7E5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-tests%20verified%20in%20CI-2ECC71?style=for-the-badge)](https://vitest.dev)
[![Accessibility](https://img.shields.io/badge/Accessibility-audit%20in%20progress-FF6B6B?style=for-the-badge)](./docs/RELEASE_CERTIFICATION.md)

</div>

**Arcade clicker-defense with server-validated leaderboards.**  
React 19 + TypeScript + Canvas 2D + Firebase.

> **Current release truth:** BugSmasher is **not currently certified 10/10**. The latest inspected `main` CI run (2026-08-30, commit `bbc7250`) is green across CI, CodeQL and Security Audit; remaining gaps are code-quality, coverage, accessibility, performance and operations evidence. See [docs/STATUS.md](./docs/STATUS.md).

- **Live:** https://bugsmasher-hopetheory.vercel.app
- **Repo:** https://github.com/FahadIbrahim93/BugSmasher-HopeTheory

## What it is

BugSmasher is a feature-rich browser arcade game combining real-time Canvas gameplay with a React interface and Firebase services. Major systems include authentication, progression, achievements, procedural content, offline/local persistence, leaderboards, accessibility settings, game audio, and server-side score validation.

## Engineering highlights

| Area            | Implementation                                                                       |
| --------------- | ------------------------------------------------------------------------------------ |
| Frontend        | React 19, TypeScript, Vite, Tailwind CSS                                             |
| Game loop       | Canvas 2D + `requestAnimationFrame` + delta-time updates                             |
| State / systems | Specialized game managers and rendering modules                                      |
| Auth            | Firebase Authentication                                                              |
| Persistence     | Local/IndexedDB paths plus Firebase callable-backed cloud persistence                |
| Security        | Firestore rules, callable validation, rate limits, checksums, session-token controls |
| Testing         | Vitest, Firebase Emulator Suite, Playwright                                          |
| CI/CD           | GitHub Actions with typecheck, tests, coverage, emulator, build, lint and E2E stages |
| PWA             | Service-worker/PWA support                                                           |

## Verification truth

Do not use the README as the source for current numeric test or coverage metrics. Current evidence lives in:

- [Current Status](./docs/STATUS.md)
- [Release Certification](./docs/RELEASE_CERTIFICATION.md)
- [Live Taskboard](./TASKBOARD.md)
- [Project Operating System](./docs/PROJECT_OPERATING_SYSTEM.md)
- [Agent Handoff Protocol](./docs/AGENT_HANDOFF.md)
- [Architecture](./docs/ARCHITECTURE.md)

Historical `VERIFICATION_*.md` documents record past snapshots and should not be interpreted as current results.

## Local development

```bash
git clone https://github.com/FahadIbrahim93/BugSmasher-HopeTheory.git
cd BugSmasher-HopeTheory
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run lint:eslint
npm test
npm run test:coverage
npm run test:emulator
npm run build
npx playwright test
```

The full quality gate is `npm run ci` once all required infrastructure is available.

## Multi-agent development

This project is intentionally designed for work across multiple AI agents and coding platforms. Start with [docs/PROJECT_OPERATING_SYSTEM.md](./docs/PROJECT_OPERATING_SYSTEM.md), then [AGENTS.md](./AGENTS.md), then claim exactly one task from [TASKBOARD.md](./TASKBOARD.md).

Never assume another agent's branch is complete. Verify the current main branch and latest CI run before continuing work.

## Security

See [SECURITY.md](./SECURITY.md) and [docs/RELEASE_CERTIFICATION.md](./docs/RELEASE_CERTIFICATION.md).

The project already has server-issued session-token protection for score submission, including authentication binding, expiration, one-time use and plausibility checks. This is a security control, not a claim of mathematically unbreakable anti-cheat.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), [AGENTS.md](./AGENTS.md) and [docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md).

## Status

**10/10 certification:** NOT CERTIFIED  
**Next priority:** lint, prettier, accessibility, and operations evidence — then the live taskboard.
