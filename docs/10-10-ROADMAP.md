# BUGSMASHER → 10/10 ROADMAP

**Current State:** 7.4/10 (Pre-Production)  
**Target:** 10.0/10 (Production-Grade)  
**Date Created:** 2026-06-09  
**Last Updated:** 2026-06-09

---

## 🎯 VERIFIED GAPS (Not Speculated — Evidence-Based)

### **CRITICAL GAPS — P0 (Blocking 10/10)**

#### P0-1: No Test Coverage Metrics
**Evidence:**  
- `npm test` script in package.json does not include `--coverage` flag
- No `.github/workflows/ci.yml` step runs coverage report
- Coverage percentage unknown; quality assurance blind spot

**Target:** 85%+ coverage across critical paths (engine, systems, rendering)

**Implementation:** 2 hours
```bash
# 1. Update package.json test scripts
"test": "vitest run --coverage",
"test:watch": "vitest --coverage"

# 2. Add vitest coverage config (vitest.config.ts)
coverage: {
  provider: 'v8',
  reporter: ['text', 'json-summary', 'html'],
  exclude: ['node_modules', 'dist']
}

# 3. Add to CI (.github/workflows/ci.yml)
- name: Test Coverage
  run: npm test

# 4. Create coverage badge
# Reference: https://github.com/codecov/codecov-action
```

---

#### P0-2: No End-to-End Tests
**Evidence:**  
- devDependencies lacks `cypress`, `playwright`, `@testing-library/react`
- Only unit tests present; no E2E smoke tests
- React component integration untested

**Target:** Smoke test suite (5 core flows)

**Implementation:** 4 hours
```bash
# Install E2E test framework
npm install -D @testing-library/react @testing-library/user-event vitest @vitest/ui

# Create e2e suite: src/__tests__/integration/GameFlow.test.tsx
# Test cases:
# 1. Game starts → wave 1 spawns
# 2. Click on bug → damage applied
# 3. Power-up collected → effect active
# 4. Prestige flow → reset + bonus applied
# 5. Settings menu → control remapping works
```

---

#### P0-3: TypeScript `any` Remaining in Production Code
**Evidence:**  
- `firebaseService.ts` line ~117: `as Record<string, unknown>` (weak type)
- UI components still use context without strict typing
- No build-time check prevents regressions

**Target:** 0 `any` types in game code (except justified with `@ts-expect-error`)

**Implementation:** 3 hours
```typescript
// Current (WEAK):
const payload = docData.data as Record<string, unknown>;

// Fixed (STRICT):
interface SavePayload {
  score: number;
  wave: number;
  health: number;
  // ... full schema
}
const payload = docData.data as SavePayload;
```

---

#### P0-4: No Security Scanning in CI
**Evidence:**  
- `.github/workflows/ci.yml` doesn't run `npm audit`
- Dependency vulnerabilities can go undetected
- Firebase service account secret not rotated (hardcoded in CI secrets)

**Target:** Fail build on audit warnings; rotate secrets monthly

**Implementation:** 1 hour
```yaml
# Add to .github/workflows/ci.yml
- name: Audit Dependencies
  run: npm audit --audit-level=high
  # Fails if high/critical vulnerabilities exist
```

---

#### P0-5: Firestore Rules Lack Schema Validation
**Evidence:**  
- `firestore.rules` allows any field structure in collections
- No field type validation (score could be string, etc.)
- Data corruption risk on write

**Target:** Strict field validation in all rules

**Implementation:** 1 hour
```javascript
// firestore.rules — BEFORE
match /users/{userId}/private/saves {
  allow read, write: if request.auth.uid == userId;
}

// AFTER (strict)
match /users/{userId}/private/saves {
  allow read, write: if request.auth.uid == userId
    && request.resource.data.keys().hasOnly(['data', 'checksum', 'updatedAt'])
    && request.resource.data.data is map
    && request.resource.data.checksum is string
    && request.resource.data.data.score is number
    && request.resource.data.data.wave is number;
}
```

---

### **HIGH-PRIORITY GAPS — P1 (Quality Leveling)**

#### P1-1: No Rate Limiting on Leaderboard
**Evidence:**  
- `FirebaseService.submitScore()` has no throttle check
- Attacker can spam 1000 submissions in seconds
- Cloud Function `validateSaveOnWrite` exists but no rate limit logic

**Target:** Max 1 submission per 60 seconds per user

**Implementation:** 2 hours
```typescript
// Add to Cloud Function
const LEADERBOARD_COOLDOWN_MS = 60000;

export const validateLeaderboardSubmission = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;
  if (!userId) throw new HttpsError('unauthenticated', 'Not logged in');

  // Check last submission time
  const userRef = doc(admin.firestore(), `users/${userId}/leaderboard-meta`);
  const snap = await userRef.get();
  const lastSubmit = snap.data()?.lastSubmit || 0;
  
  if (Date.now() - lastSubmit < LEADERBOARD_COOLDOWN_MS) {
    throw new HttpsError('resource-exhausted', 'Too many submissions');
  }

  // Proceed with validation
  await userRef.set({ lastSubmit: Date.now() }, { merge: true });
});
```

---

#### P1-2: No Integration Tests
**Evidence:**  
- GameEngine.test.ts tests systems in isolation
- No tests verify CollisionSystem + WaveManager interaction
- No stress tests (1000 bugs, 100 particles)

**Target:** 3 integration tests + 1 stress test

**Implementation:** 3 hours
```typescript
// src/__tests__/integration/GameIntegration.test.ts
describe('GameEngine Integration', () => {
  it('wave manager spawns bugs → collision system detects → particles spawn', () => {
    // Arrange
    const engine = new GameEngine(canvas);
    
    // Act
    engine.startWave();
    for (let i = 0; i < 10; i++) {
      engine.update(0.016); // 60 FPS delta
    }
    
    // Assert — bugs exist
    expect(engine.bugs.length).toBeGreaterThan(0);
    
    // Simulate collision
    const bug = engine.bugs[0];
    engine.collisionSystem.handleBugImpact(bug, engine.coreX, engine.coreY);
    
    // Assert — bug removed, particles spawned
    expect(engine.bugs.length).toBe(0);
    expect(engine.particleSystem.particles.length).toBeGreaterThan(0);
  });

  it('stress test: 1000 bugs, FPS stays above 30', () => {
    const engine = new GameEngine(canvas);
    
    // Spawn 1000 bugs manually
    for (let i = 0; i < 1000; i++) {
      engine.bugs.push({
        active: true,
        x: Math.random() * engine.width,
        y: Math.random() * engine.height,
        type: 'basic',
        speed: 50,
        color: '#00ff00',
        size: 10,
        scoreValue: 10,
        hp: 1,
        maxHp: 1,
        walkCycle: 0,
        rotation: 0,
        offsetTime: 0,
        hitTimer: 0,
      });
    }

    const startTime = performance.now();
    engine.update(0.016);
    const deltaTime = performance.now() - startTime;
    const fps = 1000 / deltaTime;

    expect(fps).toBeGreaterThan(30);
  });
});
```

---

#### P1-3: No API Contract Documentation
**Evidence:**  
- Cloud Functions exist but no request/response schema documented
- Firestore data structure not formally defined
- Frontend assumes server API; mismatch risk

**Target:** OpenAPI/JSON Schema for all endpoints

**Implementation:** 2 hours
```yaml
# docs/API_SPEC.md
## validateLeaderboardSubmission(data) → response

### Request
{
  "userId": "string",
  "username": "string",
  "score": "number (>= 0)",
  "wave": "number (>= 1)",
  "clientChecksum": "string (hex, 64 chars)"
}

### Response (200 OK)
{
  "success": true,
  "message": "Score submitted",
  "rank": "number (1-indexed)"
}

### Errors
- `invalid-argument` (400): Checksum mismatch
- `unauthenticated` (401): Not logged in
- `resource-exhausted` (429): Rate limit exceeded
```

---

#### P1-4: Firestore Service Error Handling Incomplete
**Evidence:**  
- `handleFirestoreError()` logs but doesn't distinguish error types
- No retry logic for transient failures
- Client unaware if error is permanent or temporary

**Target:** Typed error responses with retry guidance

**Implementation:** 2 hours
```typescript
interface FirebaseErrorResponse {
  code: 'PERMANENT' | 'TRANSIENT' | 'AUTH';
  message: string;
  retryable: boolean;
  delayMs?: number;
}

export function classifyFirestoreError(error: unknown): FirebaseErrorResponse {
  const err = error as any;
  
  if (err.code === 'permission-denied') {
    return { code: 'AUTH', message: 'Access denied', retryable: false };
  }
  if (err.code === 'unavailable') {
    return { code: 'TRANSIENT', message: 'Service temporarily unavailable', retryable: true, delayMs: 5000 };
  }
  if (err.code === 'deadline-exceeded') {
    return { code: 'TRANSIENT', message: 'Request timeout', retryable: true, delayMs: 2000 };
  }
  return { code: 'PERMANENT', message: 'Unknown error', retryable: false };
}
```

---

### **MEDIUM-PRIORITY GAPS — P2 (Polish)**

#### P2-1: No Accessibility Audit Automated
**Evidence:**  
- Accessibility settings exist (difficulty, shapes) but no ARIA labels
- Screen reader support not verified
- No automated axe/pa11y checks in CI

**Target:** Accessibility audit in CI + 0 WCAG 2.1 AA violations

**Implementation:** 4 hours
```bash
npm install -D @axe-core/react

# src/__tests__/accessibility/Audit.test.tsx
import { axe } from '@axe-core/react';

it('Game UI has no accessibility violations', async () => {
  render(<Game />);
  const results = await axe(document);
  expect(results.violations).toHaveLength(0);
});
```

---

#### P2-2: No Performance Budget
**Evidence:**  
- Bundle size warning at 600kB but no hard limit enforced
- No Lighthouse score tracking
- Regressions go undetected

**Target:** Enforce 300kB main bundle + 85+ Lighthouse score

**Implementation:** 2 hours
```bash
npm install -D bundlesize

# .bundlesize
[
  {
    "path": "dist/index.*.js",
    "maxSize": "300kB"
  },
  {
    "path": "dist/assets/*.css",
    "maxSize": "50kB"
  }
]

# In CI:
- run: npx bundlesize
```

---

#### P2-3: Documentation Gaps
**Evidence:**  
- README exists but no API reference, no schema docs
- COMPREHENSIVE_AUDIT_2026.md created but not linked in main docs
- Onboarding for new developers incomplete

**Target:** Complete docs suite (setup, API, architecture, troubleshooting)

**Implementation:** 3 hours
```
docs/
├── 00-SETUP.md (dev environment)
├── 01-ARCHITECTURE.md (system design with Mermaid)
├── 02-API-SPEC.md (Cloud Functions, Firestore)
├── 03-SECURITY.md (checksum, auth, rules)
├── 04-PERFORMANCE.md (FPS scaler, optimization tips)
├── 05-TESTING.md (unit, integration, E2E)
└── 10-10-ROADMAP.md (this file — action items)
```

---

## 📋 ACTIONABLE IMPLEMENTATION PLAN

### **Sprint 1 (Week 1) — Security & Quality**
- [ ] Add `npm audit` to CI
- [ ] Implement rate limiting on leaderboard
- [ ] Add Firestore field validation to rules
- [ ] Create typed error responses
- **Effort:** 6 hours | **Impact:** 8.2 → 8.5/10

### **Sprint 2 (Week 2) — Testing**
- [ ] Add test coverage reporting
- [ ] Write 3 integration tests + 1 stress test
- [ ] Add E2E smoke tests (5 core flows)
- [ ] Audit & fix remaining `any` types
- **Effort:** 10 hours | **Impact:** 8.5 → 8.8/10

### **Sprint 3 (Week 3) — Documentation & Polish**
- [ ] Write API schema documentation
- [ ] Create setup/architecture guides
- [ ] Add accessibility audit to CI
- [ ] Implement bundle size limits
- **Effort:** 8 hours | **Impact:** 8.8 → 9.3/10

### **Sprint 4 (Week 4) — Final Polish**
- [ ] Performance optimization (offscreen canvas, image atlasing)
- [ ] Haptic feedback implementation
- [ ] ARIA labels on all game UI
- [ ] Final regression testing
- **Effort:** 12 hours | **Impact:** 9.3 → 9.8/10

---

## 📊 SCORE PROGRESSION

| Current | After Sprint 1 | After Sprint 2 | After Sprint 3 | After Sprint 4 |
|---------|---|---|---|---|
| 7.4/10 | 8.2/10 | 8.8/10 | 9.3/10 | **9.8/10** |
| P0 gaps | Security ✅ | Testing ✅ | Docs ✅ | Final ✅ |

---

## ✅ VERIFICATION CHECKLIST (10/10 Criteria)

- [ ] Test coverage ≥85%
- [ ] 0 `any` types in game code
- [ ] All Cloud Functions have rate limiting
- [ ] Firestore rules validate all fields
- [ ] Integration tests pass (5 core flows)
- [ ] E2E smoke tests pass
- [ ] CI includes `npm audit`
- [ ] Bundle size < 300kB
- [ ] Lighthouse score ≥85
- [ ] API schema documented
- [ ] Architecture documented with diagrams
- [ ] WCAG 2.1 AA compliant
- [ ] No console errors in prod
- [ ] Performance metrics tracked
- [ ] Security audit passed

---

## 🚀 NEXT STEPS

1. **Review this roadmap** with team
2. **Prioritize by impact** (P0 first)
3. **Assign to sprints** with dev capacity
4. **Track progress** in TASKBOARD.md
5. **Execute sprints** 1–4 sequentially
6. **Verify 10/10** against checklist above

---

**Expected Timeline:** 4 weeks (40 hours)  
**Team:** 1 senior engineer  
**Cost:** ~$2,000 (if outsourced)

