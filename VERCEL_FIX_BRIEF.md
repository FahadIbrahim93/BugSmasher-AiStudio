# Vercel Deployment Fix — Handoff Brief (for Hermes / any agent with Vercel + GitHub access)

**Date:** 2026-08-02 · **Repo:** `FahadIbrahim93/BugSmasher-HopeTheory` · **Branch:** `main` (everything pushed, clean tree)

## 🎯 Goal

Make the live site **https://bugsmasher-hopetheory.vercel.app** serve the build with the Firebase API key baked in. Success = live `index.html` references **`index-DdML2CV-.js`** and that bundle contains **`AIzaSyAgszp_gKNxJCUs0BWa42pArAzyHSuzDqw`**.

## ✅ Already done (verified — do NOT redo)

- **Push-to-deploy is WIRED**: `vercel[bot]` auto-deploys every push to `main` as Production (confirmed via GitHub Deployments API; both `bugsmasher-hopetheory` and a duplicate `bugsmasher` project deploy, all success).
- **SSO/Deployment Protection is OFF**: deployment URLs now return HTTP 200 publicly (no `vercel.com/sso-api` redirect).
- **`vercel.json` already injects the 4 public `VITE_FIREBASE_*` vars at build time** (committed in `9a75652`), and the headers rule `/assets/(.*)` → `max-age=31536000, immutable` is fixed (commit `9a75652`).
- **The build is provably correct**: GitHub Actions built the same commit with these values → `index-DdML2CV-.js` with the API key (verified from the CI `dist` artifact).

## 🐛 The remaining problem

The latest deployed build (`1a4b290`) is **still the offline bundle** (`index-aiDl7IiO.js`, no API key, no `studio-1155838266-56095` strings). The deployment is public and current, but **Vercel's build did not receive the Firebase env vars** — i.e., project-level Environment Variables are overriding (or shadowing) the `vercel.json` env block, and/or a stale build cache was reused.

## 🔧 Fix (2-3 minutes, Vercel dashboard or API)

### Option A — Dashboard (simplest)

1. **vercel.com → project `bugsmasher-hopetheory` → Settings → Environment Variables**
2. If any `VITE_FIREBASE_*` vars exist, **delete them** (let `vercel.json` win) **or** set them exactly to:
   - `VITE_FIREBASE_API_KEY` = `AIzaSyAgszp_gKNxJCUs0BWa42pArAzyHSuzDqw`
   - `VITE_FIREBASE_AUTH_DOMAIN` = `studio-1155838266-56095.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` = `studio-1155838266-56095`
   - `VITE_FIREBASE_APP_ID` = `1:911343381703:web:75c16ea460d4aeab2ca2e2`
   - Scope: **Production** (and Preview if desired).
3. **Deployments → latest → ⋮ → Redeploy** → **uncheck "Use existing Build Cache"** → Redeploy.
4. Wait ~2-4 min, then verify (below).### Option B — API (if you have a valid Vercel token)

- Set env vars: `POST https://api.vercel.com/v9/projects/{projectIdOrName}/env` (the path accepts the project name `bugsmasher-hopetheory`) with the 4 values above, target `production`.
- Trigger a fresh build: `POST https://api.vercel.com/v13/deployments` with `{ "name": "bugsmasher-hopetheory", "project": "bugsmasher-hopetheory", "target": "production", "forceNew": true, "withLatestCommit": true }` — or simpler: `vercel --prod` from a current `main` checkout (needs login/token).

## ✅ Verify success (any shell)

```bash
# 1. Live bundle fingerprint — MUST be index-DdML2CV-.js
curl -s -L 'https://bugsmasher-hopetheory.vercel.app/?cb=1' | grep -oE 'index-[A-Za-z0-9_-]+[.]js' | head -1

# 2. API key baked in — MUST print AIzaSyAgszp_gKNxJCUs0BWa42pArAzyHSuzDqw
B=$(curl -s -L 'https://bugsmasher-hopetheory.vercel.app/?cb=1' | grep -oE 'index-[A-Za-z0-9_-]+[.]js' | head -1)
curl -s -L "https://bugsmasher-hopetheory.vercel.app/assets/$B" | grep -oE 'AIza[A-Za-z0-9_-]{20,}' | head -1

# 3. Config strings present
B=$(curl -s -L 'https://bugsmasher-hopetheory.vercel.app/?cb=1' | grep -oE 'index-[A-Za-z0-9_-]+[.]js' | head -1)
curl -s -L "https://bugsmasher-hopetheory.vercel.app/assets/$B" | grep -c 'studio-1155838266-56095'   # ≥1
```

All three passing = cloud save, leaderboard, and Google sign-in are live. Report back to the user with the fingerprint.

**Cache note:** `index.html` is served with `max-age=0, must-revalidate`, so the edge can briefly serve the old fingerprint even after a successful deploy. If `?cb=1` still shows the old bundle, wait ~60s and re-run, or fetch the latest deployment URL directly from the Deployments list.

## 🧹 Optional cleanup (nice-to-have, not required for the fix)

- The repo is connected to **two** Vercel projects (`bugsmasher-hopetheory` and `bugsmasher`). Keep the one owning `bugsmasher-hopetheory.vercel.app`; delete/ignore the duplicate `bugsmasher` project to avoid confusion.
- **Firebase mirror** (`studio-1155838266-56095.web.app`) is stale until the `FIREBASE_SERVICE_ACCOUNT` GitHub secret is added (Firebase Console → Project Settings → Service accounts → Generate new private key → paste as repo secret). Then every push auto-deploys both.
