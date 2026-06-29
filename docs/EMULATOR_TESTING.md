# Firebase Emulator Tests

Security integration tests validate Firestore rules and Cloud Function callables against a local Firestore emulator. They are required by `npm run ci` and GitHub Actions.

## Prerequisites

- **Java JDK 21+** recommended (JDK 17 works today; Firebase CLI will require 21+ in firebase-tools v15)
- **Firebase CLI** — `firebase-tools` is a devDependency; use `npm run test:emulator` from the repo root
- **Node.js** 20+

## Commands

```bash
# Full gate from repo root — starts Firestore emulator, runs rules + callable tests
npm run test:emulator

# Functions package only (emulator must already be on port 8080)
cd functions && npm run test:emulator

# Schema/validation unit tests (no Java required)
cd functions && npm run test:unit

# Full CI locally (lint + functions + coverage + emulator + build)
npm run ci
```

## What is tested

| File                                | Tests | Validates                                                  |
| ----------------------------------- | ----: | ---------------------------------------------------------- |
| `functions/test/rules.test.ts`      |     7 | Direct client writes denied for saves and leaderboard      |
| `functions/test/callables.test.ts`  |    10 | Auth, checksums, Zod schema, rate limits, monotonic scores |
| `functions/test/saveSchema.test.ts` |     4 | Save payload schema (unit, no emulator)                    |

## Configuration

- `.firebaserc` — demo project `demo-bugsmasher` for emulator runs
- `firebase.json` — Firestore emulator on port **8080**
- `CHECKSUM_SALT` — required in production; CI and emulator use `ci-test-salt-not-for-production` when `FIRESTORE_EMULATOR_HOST` is set

## CI

GitHub Actions (`.github/workflows/ci.yml`):

1. `npm run test:coverage` — 507 frontend tests with engine/lib coverage thresholds
2. Setup Java 21 (Temurin)
3. `npm run test:emulator` with `CHECKSUM_SALT` env var

## Troubleshooting

| Issue                                        | Fix                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Java not found`                             | Install JDK 21+ and ensure `java` is on PATH                                        |
| `Cannot find module ... vitest` in functions | `cd functions && rm -rf node_modules && npm ci`                                     |
| `EPERM` on Windows during `npm ci`           | Close processes locking `functions/node_modules`; retry with admin or `npm install` |
| Emulator port conflict                       | Change port in `firebase.json` or stop other Firestore emulators                    |
| `functions/lib/` in git status               | Compiled output — listed in `.gitignore`; do not commit                             |

## Related docs

- [VERIFICATION_2026-06-30.md](./VERIFICATION_2026-06-30.md) — session evidence and coverage numbers
- [security_spec.md](../security_spec.md) — Firestore security model
- [DEPLOYMENT.md](../DEPLOYMENT.md) — release checklist
