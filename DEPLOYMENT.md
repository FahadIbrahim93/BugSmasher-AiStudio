# BugSmasher — Deployment Guide

**Status:** Operational reference; verify current `docs/STATUS.md` before release.  
**Primary hosting:** Vercel  
**Secondary hosting:** Firebase Hosting  
**Source of truth:** `main`

## 1. Before deploying

Read, in order:

1. [Current Status](./docs/STATUS.md)
2. [Live Taskboard](./TASKBOARD.md)
3. [Release Certification](./docs/RELEASE_CERTIFICATION.md)
4. [Agentic Workflow](./docs/AGENTIC_WORKFLOW.md)

Never deploy merely because a local build succeeds. A release candidate must satisfy the certification gates appropriate to the release.

## 2. Local prerequisites

- Node.js version compatible with the current CI/runtime configuration;
- npm;
- Firebase CLI for manual Firebase operations;
- authenticated access to the target deployment platform.

Do not commit environment secrets, service-account JSON, or server-only checksum secrets.

## 3. Environment

### Client configuration

`VITE_FIREBASE_*` values are public client configuration and may be present in the browser bundle. They are not secret credentials.

### Server configuration

`CHECKSUM_SALT` is server-only and must never be exposed through `VITE_*` variables or committed to source.

Other integration-specific keys must follow their provider's secret-handling requirements.

## 4. Verification commands

```bash
npm run typecheck
npm run lint:eslint
npm test
npm run test:coverage
npm run test:emulator
npm run build
npx playwright test
```

The repository-wide gate is:

```bash
npm run ci
```

The exact GitHub Actions result on the exact commit is the authoritative release evidence.

## 5. GitHub Actions

Primary workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

The quality pipeline verifies type safety, lint, Functions build/tests, dependency/security checks where configured, frontend coverage, Firestore emulator tests and production build. A separate Playwright job consumes the validated build artifact.

Do not interpret a skipped job as a passing job.

## 6. Hosting reality

The repository historically used both Vercel and Firebase Hosting. Treat them as separate deployment targets.

### Vercel

Vercel is the primary player-facing host. Automatic Git-based deployment depends on the Vercel project being connected to this GitHub repository. Connection status must be verified in the Vercel dashboard; repository documentation must not claim push-to-deploy is active without evidence.

### Firebase Hosting

Firebase Hosting is a secondary target. The GitHub workflow can deploy when the required `FIREBASE_SERVICE_ACCOUNT` secret is configured. A successful GitHub build alone does not prove Firebase Hosting updated.

## 7. Manual deployment

### Vercel

Use the Vercel dashboard or CLI according to the currently configured project. Verify the resulting production deployment and perform a browser smoke test.

### Firebase Hosting

```bash
npm ci
npm run build
firebase login
firebase deploy --only hosting --project studio-1155838266-56095
```

Only deploy to the intended production project. Verify the resulting URL after deployment.

### Firestore rules

```bash
firebase deploy --only firestore:rules --project studio-1155838266-56095
```

Security-sensitive rule changes require emulator evidence before deployment.

### Cloud Functions

```bash
cd functions
npm ci
npm run build
cd ..
firebase deploy --only functions --project studio-1155838266-56095
```

Keep server secrets configured in the appropriate production secret/environment mechanism.

## 8. Release checklist

- [ ] Current `docs/STATUS.md` reviewed
- [ ] No unresolved P0 blocker
- [ ] `npm run ci` green on the release commit
- [ ] Playwright E2E green
- [ ] Security/dependency gates green or formally accepted under `RELEASE_CERTIFICATION.md`
- [ ] Production build artifact reviewed
- [ ] Firestore rules tested
- [ ] Environment configuration verified
- [ ] User-facing deployment smoke test completed
- [ ] Rollback path confirmed
- [ ] Changelog/version updated when this is a formal release
- [ ] `docs/VERIFICATION_YYYY-MM-DD.md` created/updated with exact evidence
- [ ] `docs/STATUS.md` updated
- [ ] `TASKBOARD.md` reflects completed release tasks
- [ ] `docs/RELEASE_CERTIFICATION.md` remains truthful

## 9. Rollback

Rollback is platform-specific.

For Firebase Hosting, use the Firebase Console/version controls or redeploy a known-good commit.

For Vercel, use the project deployment history to promote a known-good production deployment.

For code-level rollback, prefer a normal Git revert on `main` rather than rewriting shared history.

## 10. Incident procedure

If a production deployment is broken:

1. stop discretionary releases;
2. identify the exact deployed commit;
3. compare against the latest known-good release;
4. capture logs/errors;
5. revert or promote the known-good deployment;
6. create a regression test for the defect;
7. update `docs/STATUS.md` and the verification record.

## 11. Important truth rule

This document intentionally avoids asserting that a deployment, provider integration or monitoring system is active unless it is currently verified. Configuration may change outside GitHub; check the deployment platform before relying on historical statements.

## Related documentation

- [README](./README.md)
- [Project Operating System](./docs/PROJECT_OPERATING_SYSTEM.md)
- [Agentic Workflow](./docs/AGENTIC_WORKFLOW.md)
- [Current Status](./docs/STATUS.md)
- [Release Certification](./docs/RELEASE_CERTIFICATION.md)
- [Taskboard](./TASKBOARD.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./SECURITY.md)
