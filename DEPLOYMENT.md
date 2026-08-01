# BUGSMASHER — Deployment Guide

**Last updated:** 2026-08-01
**Target environments:** Local dev · CI (GitHub Actions) · Vercel (primary hosting) · Firebase Hosting (secondary) · Firebase Firestore
**Live URL (primary):** https://bugsmasher-hopetheory.vercel.app — currently serves the latest build (verified; push-to-deploy integration not yet confirmed — see note below)
**Live URL (secondary):** https://studio-1155838266-56095.web.app — Firebase mirror; currently stale until `FIREBASE_SERVICE_ACCOUNT` secret is configured

---

## Repository Map

| Repository  | URL                                                       | Role                                    |
| ----------- | --------------------------------------------------------- | --------------------------------------- |
| **Primary** | `https://github.com/FahadIbrahim93/BugSmasher-HopeTheory` | Main source of truth; deployment origin |

### Branch Strategy

| Branch                                   | Purpose                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| `main`                                   | Production-ready; CI must pass; deploys to Firebase Hosting |
| `develop`                                | Optional integration branch                                 |
| `feat/*` / `fix/*` / `docs/*` / `test/*` | Feature work; **PR into `main` only**                       |

See [docs/AGENTIC_WORKFLOW.md](./docs/AGENTIC_WORKFLOW.md) for naming, commits, SemVer, and multi-agent rules.

---

## Prerequisites

- **Node.js** 20+ (CI uses 22)
- **npm** 10+
- **Firebase CLI** (for manual deploys): `npm install -g firebase-tools`
- Firebase project: `studio-1155838266-56095` (configure client values via `VITE_FIREBASE_*` env vars; do not commit `firebase-applet-config.json`)

---

## Local Development

```bash
git clone https://github.com/FahadIbrahim93/BugSmasher-HopeTheory.git
cd BugSmasher-HopeTheory
npm install
npm run dev
```

Open `http://localhost:3000`.

### Quality gates (run before every push)

```bash
npm run typecheck   # tsc --noEmit — hard gate (0 errors)
npm run lint:eslint # advisory — ~233 tracked errors (see AGENTS.md); must not add new ones
npm test            # 507 Vitest unit tests (+ 21 functions/emulator tests via npm run ci)
npm run build       # Vite production bundle → dist/
```

---

## Environment Variables

Copy `.env.example` → `.env` for local overrides.

| Variable                    | Required                                  | Description                                                             |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`     | Required for Firebase auth/cloud features | Public Firebase web API key from Firebase Console                       |
| `VITE_FIREBASE_AUTH_DOMAIN` | Required for Firebase auth/cloud features | Firebase auth domain                                                    |
| `VITE_FIREBASE_PROJECT_ID`  | Required for Firebase auth/cloud features | Firebase project ID                                                     |
| `VITE_FIREBASE_APP_ID`      | Required for Firebase auth/cloud features | Firebase app ID                                                         |
| `VITE_FIREBASE_DATABASE_ID` | Optional                                  | Named Firestore database ID, if used                                    |
| `CHECKSUM_SALT`             | Required for functions deploy             | Server-only Cloud Functions checksum salt; never expose through `VITE_` |
| `GEMINI_API_KEY`            | Optional                                  | AI Studio / image generation features                                   |
| `DISABLE_HMR`               | Optional                                  | Set `true` in agent environments to reduce flicker                      |

Firebase client configuration is loaded from `VITE_FIREBASE_*` environment variables. `firebase-applet-config.json` is intentionally ignored and must not be committed. Cloud Functions secrets such as `CHECKSUM_SALT` must be configured in the deploy environment, not shipped to the browser.

---

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

### On every push / PR to `main`, `develop`, `feat/*`, `fix/*`:

1. `npm ci`
2. `npm run lint` — TypeScript (`tsc --noEmit`)
3. `cd functions && npm ci && npm run build`
4. `npm run test:coverage` — 507 frontend tests + engine/lib coverage thresholds
5. Setup Java 21
6. `npm run test:emulator` — Firestore rules + callable integration tests
7. `npm run build`
8. Upload `dist/` artifact (7-day retention)

Local full gate: `npm run ci` (same steps, includes `validate:functions` unit tests).

### Deployment reality (verified 2026-08-01)

- **Primary live hosting is Vercel**: `https://bugsmasher-hopetheory.vercel.app` currently serves the latest verified bundle (`index-aiDl7IiO.js` — matches local `main`; contains FURY/venting features and all 10 SFX including `crit_hit.wav`, `miss.wav`, `combo_break.wav`, all HTTP 200).
- **Vercel push-to-deploy is NOT wired**: pushing to `main` does not trigger a Vercel rebuild (verified — bundle unchanged after CI-green pushes). Until the GitHub ↔ Vercel integration is enabled (or a manual `vercel --prod` is run), the live site only updates via manual redeploy.
- **Firebase client config for Vercel**: `vercel.json` now injects the public `VITE_FIREBASE_*` web config at build time (researched: Vercel cloud builds do NOT auto-load committed `.env.production`; the `vercel.json` `env` key does inject). **Action required: trigger one redeploy of the latest deployment ≥ `9a75652`** (Deployments → ⋮ → Redeploy on the newest entry, or `vercel --prod` from the current `main` checkout — redeploying an older deployment rebuilds the old config and stays stale) to bake the API key into the live bundle (`index-DdML2CV-.js`). Dashboard env vars would take precedence over `vercel.json` if configured later.
- The CI workflow also attempts a **Firebase Hosting deploy** (`channelId: live`) on push to `main`, but it **skips cleanly** (env-guarded) because the `FIREBASE_SERVICE_ACCOUNT` secret is not configured — the Firebase site stays stale. **Do not treat a green CI as proof the Firebase mirror updated.** CI builds now bake the same public Firebase config (both `quality` and `deploy-preview` build steps), so once the secret is added the mirror will deploy a fully-configured build.

#### To enable the Firebase auto-deploy

1. Firebase Console → Project Settings → Service accounts → Generate new private key
2. GitHub repo → Settings → Secrets → Actions → New secret: `FIREBASE_SERVICE_ACCOUNT` (paste JSON)
3. Push to `main` — workflow deploys `dist/` to channel `live`

Until the secret is configured, the deploy step is skipped cleanly (see `ci.yml` guard).

---

## Manual Deployment

### Firebase Hosting

> **Note:** `.firebaserc` targets `demo-bugsmasher` (the emulator project). For real deploys always pass the production project explicitly:

```bash
npm ci
npm run build
firebase login
firebase deploy --only hosting --project studio-1155838266-56095
```

**Live URL (primary):** https://bugsmasher-hopetheory.vercel.app — use this for players.
**Firebase mirror:** https://studio-1155838266-56095.web.app — secondary; only current after a successful `firebase deploy --only hosting` or once the CI secret is configured.

### Firestore rules only

```bash
firebase deploy --only firestore:rules
```

Rules file: [`firestore.rules`](./firestore.rules)

---

## Release Checklist (10/10 bar)

- [ ] `npm run typecheck` — 0 TypeScript errors (eslint advisory; tracked debt per AGENTS.md)
- [ ] `npm run validate:functions` — Cloud Functions compile + schema unit tests
- [ ] `npm run test:coverage` — 507 tests, engine/lib thresholds met (~78% lines today)
- [ ] `npm run test:emulator` — rules + callable tests pass (Java 21+)
- [ ] `npm run build` — succeeds, bundle reviewed
- [ ] Firestore rules deployed and smoke-tested for denied direct save/leaderboard writes
- [ ] `TASKBOARD.md` P0 items for this release marked `[x]`
- [ ] `docs/VERIFICATION_2026-06-30.md` updated with fresh command output
- [ ] Version bumped in `package.json`
- [ ] Tag: `git tag -a v2.5.0 -m "10/10 enterprise elevation milestone"`
- [ ] Push branch + open PR to `main`
- [ ] After merge: verify Firebase Hosting + smoke test auth/saves

---

## Rollback

```bash
firebase hosting:rollback
```

Or redeploy a previous commit:

```bash
git checkout <known-good-sha>
npm ci && npm run build
firebase deploy --only hosting
```

---

## Troubleshooting

| Issue                                     | Fix                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Detached HEAD in worktrees                | `git checkout main && git pull`                                                     |
| `vitest: not found`                       | Run `npm install`                                                                   |
| Emulator tests fail (Java)                | Install JDK 21+; see `docs/EMULATOR_TESTING.md`                                     |
| `functions/node_modules` EPERM on Windows | Close locking processes; `cd functions && rm -rf node_modules && npm ci`            |
| Firebase auth fails locally               | Check `VITE_FIREBASE_*` values in `.env` and authorized domains in Firebase Console |
| Large bundle warning                      | Expected (~1.2MB); code-split in TASKBOARD P4                                       |

---

## Related Documentation

- [README.md](./README.md) — Overview & quick start
- [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md) — Quality ratings
- [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md) — Roadmap to verified 10/10
- [TASKBOARD.md](./TASKBOARD.md) — AI/human task backlog
- [AGENTS.md](./AGENTS.md) — Coding standards for agents
- [security_spec.md](./security_spec.md) — Firestore security model
