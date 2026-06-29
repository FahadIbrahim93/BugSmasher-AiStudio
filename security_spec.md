# Firebase Security Specification

## Current Trust-Boundary Invariants
1. A signed-in user can read/write only their own profile in `/users/{userId}`.
2. A signed-in user can read their own private documents in `/users/{userId}/private/{document}`.
3. Clients must **not** write `/users/{userId}/private/saves` directly. Cloud saves are written by the `uploadSave` callable function, which authenticates the caller and computes the server checksum with `CHECKSUM_SALT`.
4. Anyone can read `/leaderboard`, but clients must **not** write leaderboard documents directly. Scores are submitted through the `submitScore` callable function, which applies server-side sanity checks and monotonic high-score preservation.
5. Local/offline checksums are tamper-evidence only. They are not an anti-cheat boundary.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Write to another user's profile.
2. Update `uid` field in user profile (immutability).
3. Directly write `/users/{userId}/private/saves` as a client.
4. Directly write `/leaderboard/{userId}` as a client.
5. Inject a 1MB string into `username`.
6. Submit a leaderboard score without a valid `wave` field to the callable.
7. Submit a leaderboard score with `score` as a string.
8. Delete a leaderboard document as a client.
9. Access `/users/{userId}/private/saves` of another user.
10. Write a save with a `userId` that does not match the authenticated user.
11. Submit a score above server plausibility bounds.
12. Use a non-alphanumeric ID for a user.

## Required Next Verification
- Add Firebase Emulator tests for each denial payload.
- Add callable tests for valid save upload, invalid save shape, valid score submission, invalid score type, implausible score, unauthenticated caller, and monotonic score preservation.
- Keep these tests release-blocking once added.
