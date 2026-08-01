/**
 * Tests for AuthProvider in the offline/unconfigured-Firebase state.
 *
 * This is the state that previously blanked the whole app: firebase.ts ran
 * getAuth(app) at import time with an empty config (threw auth/invalid-api-key).
 * Now auth/db are null, so AuthProvider must resolve loading to false instead of
 * hanging on onAuthStateChanged, and signIn/logOut must be safe no-ops.
 *
 * Uses jsdom + React 19's createRoot API directly (no @testing-library dependency).
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Simulate an offline/unconfigured build: Firebase module exports null values.
// This per-file mock overrides the global setup.ts mock (non-null values).
vi.mock('../lib/firebase', () => ({
  auth: null,
  db: null,
  functions: null,
  googleProvider: null,
}));

// Keep the test hermetic — with null auth none of these are ever invoked, but
// AuthContext imports them, so provide inert stand-ins instead of loading the
// real firebase/auth SDK in jsdom.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({})),
  signOut: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: class {
    static credentialFromResult = vi.fn(() => null);
  },
}));

import { signInWithPopup, signOut } from 'firebase/auth';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// ===== RENDER HELPER =====
// Uses act() to flush React rendering synchronously, matching ThemePreviewRing.test.tsx.

interface RenderResult {
  container: HTMLElement;
  root: Root;
}

function renderComponent(component: React.ReactElement): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(component);
  });
  return { container, root };
}

function cleanup(result: RenderResult) {
  act(() => {
    result.root.unmount();
  });
  document.body.removeChild(result.container);
}

describe('AuthProvider offline (unconfigured Firebase)', () => {
  let result: RenderResult | null = null;

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
  });

  it('resolves loading to false when Firebase is unconfigured (does not hang)', () => {
    let state: { loading: boolean; user: unknown; profile: unknown } | null = null;

    function Probe() {
      const { loading, user, profile } = useAuth();
      state = { loading, user, profile };
      return null;
    }

    result = renderComponent(
      React.createElement(AuthProvider, null, React.createElement(Probe))
    );

    // The offline guard calls setLoading(false) synchronously in the effect, so
    // after act() flushes, loading must be false — never stuck at true.
    expect(state).not.toBeNull();
    expect(state!.loading).toBe(false);
    // No user/profile can exist without Firebase.
    expect(state!.user).toBeNull();
    expect(state!.profile).toBeNull();
  });

  it('signIn and logOut are safe no-ops when Firebase is unconfigured', async () => {
    let ctx: { signIn: () => Promise<void>; logOut: () => Promise<void> } | null = null;

    function Probe() {
      const { signIn, logOut } = useAuth();
      ctx = { signIn, logOut };
      return null;
    }

    result = renderComponent(
      React.createElement(AuthProvider, null, React.createElement(Probe))
    );

    expect(ctx).not.toBeNull();
    // Neither throws when auth/googleProvider are null (early-return guards).
    await act(async () => {
      await ctx!.signIn();
    });
    await act(async () => {
      await ctx!.logOut();
    });
    // The early-return guards must prevent any real Firebase auth call.
    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('renders children without crashing when Firebase is unconfigured', () => {
    result = renderComponent(
      React.createElement(AuthProvider, null, React.createElement('div', { id: 'child' }))
    );
    expect(result.container.querySelector('#child')).not.toBeNull();
  });
});
