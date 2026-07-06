# Security Policy

## Supported Versions

| Version | Supported             |
| ------- | --------------------- |
| 2.5.x   | ✅ Active development |
| < 2.5   | ❌ Not supported      |

## Reporting a Vulnerability

**BugSmasher** uses Firebase for its backend services. We take security seriously.

If you discover a security vulnerability, please **do not** open a public issue.
Instead, report it privately by emailing the project maintainer, or by opening a
GitHub Security Advisory at:

https://github.com/FahadIbrahim93/BugSmasher-HopeTheory/security/advisories/new

### What to include

- A clear description of the vulnerability
- Steps to reproduce (minimal proof of concept)
- Affected versions
- Any potential impact or exploit scenario

### Response timeline

- **Acknowledgment:** within 48 hours
- **Triage:** within 5 business days
- **Fix:** depends on severity (P0 critical: <24 hours, P1 high: <1 week)

## Security Model

See [security_spec.md](./security_spec.md) for the full trust-boundary architecture.

### Key principles

1. **Server-authoritative writes** — Cloud saves and leaderboard scores are
   written through authenticated callable functions, not directly from the client.
2. **Firestore rules deny direct writes** — Clients cannot write to `private/saves`
   or `leaderboard` collections directly.
3. **No secrets in client code** — Firebase config is loaded from env vars.
   Checksum salt is server-only.
4. **Emulator-proven security** — All trust boundaries are verified with Firebase
   Emulator integration tests in CI.
5. **Dependency scanning** — Dependabot + CodeQL + `npm audit` run in CI.

### Open items

- Session-token anti-cheat for competitive leaderboard (in progress, Sprint 1)
- PII sanitization in error logs (in progress)

## Responsible Disclosure

We ask that you give us a reasonable time to fix and disclose the issue before
making any information public. We will credit researchers who responsibly report
issues.
