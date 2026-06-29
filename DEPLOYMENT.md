# BUGSMASHER — Deployment Guide

**Last updated:** 2026-06-29
**Target environments:** Local dev · CI (GitHub Actions) · Firebase Hosting · Firebase Firestore
**Live URL:** https://studio-1155838266-56095.web.app

---

## Repository Map

| Repository | URL | Role |
|--------|-----|------|
| **Primary** | `https://github.com/FahadIbrahim93/BugSmasher-HopeTheory` | Main source of truth; deployment origin |

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready; CI must pass; deploys to Firebase Hosting |
| `develop` | Optional integration branch |
| `feat/*` / `fix/*` | Feature work; PR into `main` |

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
npm run lint    # TypeScript strict check
npm test        # 409+ Vitest unit tests
npm run build   # Vite production bundle → dist/
```

---

## Environment Variables

Copy `.env.example` → `.env` for local overrides.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Required for Firebase auth/cloud features | Public Firebase web API key from Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Required for Firebase auth/cloud features | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Required for Firebase auth/cloud features | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Required for Firebase auth/cloud features | Firebase app ID |
| `VITE_FIREBASE_DATABASE_ID` | Optional | Named Firestore database ID, if used |
| `CHECKSUM_SALT` | Required for functions deploy | Server-only Cloud Functions checksum salt; never expose through `VITE_` |
| `GEMINI_API_KEY` | Optional | AI Studio / image generation features |
| `DISABLE_HMR` | Optional | Set `true` in agent environments to reduce flicker |

Firebase client configuration is loaded from `VITE_FIREBASE_*` environment variables. `firebase-applet-config.json` is intentionally ignored and must not be committed. Cloud Functions secrets such as `CHECKSUM_SALT` must be configured in the deploy environment, not shipped to the browser.

---

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

### On every push / PR to `main`, `develop`, `feat/*`, `fix/*`:

1. `npm ci`
2. `npm run lint`
3. `npm run validate:functions`
4. `npm test -- --coverage`
5. `npm run build`
6. Upload `dist/` artifact (7-day retention)

### On push to `main` (optional auto-deploy):

Deploys to **Firebase Hosting** when `FIREBASE_SERVICE_ACCOUNT` secret is configured.

#### Setup Firebase deploy secret

1. Firebase Console → Project Settings → Service accounts → Generate new private key
2. GitHub repo → Settings → Secrets → Actions → New secret: `FIREBASE_SERVICE_ACCOUNT` (paste JSON)
3. Push to `main` — workflow deploys `dist/` to channel `live`

If the secret is missing, CI still passes; deploy step is skipped (`continue-on-error: true`).

---

## Manual Deployment

### Firebase Hosting

```bash
npm ci
npm run build
firebase login
firebase deploy --only hosting
```

**Live URL (default):** https://studio-1155838266-56095.web.app

### Firestore rules only

```bash
firebase deploy --only firestore:rules
```

Rules file: [`firestore.rules`](./firestore.rules)

---

## Release Checklist (10/10 bar)

- [ ] `npm run lint` — 0 TypeScript errors
- [ ] `npm run validate:functions` — Cloud Functions compile
- [ ] `npm test` — 0 failures
- [ ] `npm test -- --coverage` — configured thresholds met
- [ ] `npm run build` — succeeds, bundle reviewed
- [ ] Firestore rules deployed and smoke-tested for denied direct save/leaderboard writes
- [ ] `TASKBOARD.md` P0 items for this release marked `[x]`
- [ ] `CTO_AUDIT_2026-06-29.md` and `PERFECT_10_REMEDIATION_PLAN.md` updated with current evidence
- [ ] Version bumped in `package.json`
- [ ] Tag: `git tag -a v2.5.0 -m "10/10 enterprise elevation milestone"` (done via feat merge to main)
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

| Issue | Fix |
|-------|-----|
| Detached HEAD in worktrees | `git checkout main && git pull` |
| `vitest: not found` | Run `npm install` |
| Firebase auth fails locally | Check `VITE_FIREBASE_*` values in `.env` and authorized domains in Firebase Console |
| Large bundle warning | Expected (~1.2MB); code-split in TASKBOARD P4 |

---

## Related Documentation

- [README.md](./README.md) — Overview & quick start
- [CTO_AUDIT_2026-06-29.md](./CTO_AUDIT_2026-06-29.md) — Quality ratings
- [PERFECT_10_REMEDIATION_PLAN.md](./PERFECT_10_REMEDIATION_PLAN.md) — Roadmap to verified 10/10
- [TASKBOARD.md](./TASKBOARD.md) — AI/human task backlog
- [AGENTS.md](./AGENTS.md) — Coding standards for agents
- [security_spec.md](./security_spec.md) — Firestore security model
