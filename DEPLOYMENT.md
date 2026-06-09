# BUGSMASHER — Deployment Guide

**Last updated:** 2026-06-09  
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
- Firebase project: `studio-1155838266-56095` (see `firebase-applet-config.json`)

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
| `GEMINI_API_KEY` | Optional | AI Studio / image generation features |
| `DISABLE_HMR` | Optional | Set `true` in agent environments to reduce flicker |

Firebase credentials are loaded from **`firebase-applet-config.json`** (checked into repo for this AI Studio applet). For a standalone production fork, move secrets to CI secrets and inject at build time.

---

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

### On every push / PR to `main`, `develop`, `feat/*`, `fix/*`:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. Upload `dist/` artifact (7-day retention)

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

- [ ] `npm test` — 0 failures  
- [ ] `npm run lint` — 0 errors  
- [ ] `npm run build` — succeeds, bundle reviewed  
- [ ] `TASKBOARD.md` P0 items for this release marked `[x]`  
- [ ] `SESSION.md` date and rating updated  
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
| Firebase auth fails locally | Check `firebase-applet-config.json` and authorized domains in console |
| Large bundle warning | Expected (~1.2MB); code-split in TASKBOARD P4 |

---

## Related Documentation

- [README.md](./README.md) — Overview & quick start  
- [AUDIT_REPORT.md](./AUDIT_REPORT.md) — Quality ratings  
- [TASKBOARD.md](./TASKBOARD.md) — AI/human task backlog  
- [AGENTS.md](./AGENTS.md) — Coding standards for agents  
- [security_spec.md](./security_spec.md) — Firestore security model
