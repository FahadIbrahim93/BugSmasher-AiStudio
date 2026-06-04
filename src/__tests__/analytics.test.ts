import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'console');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (window as any).posthog;
  });

  it('tracks events when console provider enabled', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.track('wave_complete', { wave: 5, score: 1200 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not track when provider is none', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'none');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.track('wave_complete', { wave: 1 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('calls posthog.capture when posthog provider configured and SDK is on window', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'posthog');
    vi.stubEnv('VITE_POSTHOG_API_KEY', 'phc_test_key');

    const capture = vi.fn();
    const identify = vi.fn();
    const reset = vi.fn();

    (window as any).posthog = { init: vi.fn(), capture, identify, reset };

    const { analytics } = await import('../lib/analytics');
    analytics.track('session_start', { mode: 'standard' });

    expect(capture).toHaveBeenCalledWith('session_start', expect.objectContaining({
      event: 'session_start',
      mode: 'standard',
    }));

  });

  it('calls posthog.identify when posthog provider configured', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'posthog');
    vi.stubEnv('VITE_POSTHOG_API_KEY', 'phc_test_key');

    const identify = vi.fn();
    (window as any).posthog = { init: vi.fn(), capture: vi.fn(), identify, reset: vi.fn() };

    const { analytics } = await import('../lib/analytics');
    analytics.identify('user_abc', { plan: 'premium' });

    expect(identify).toHaveBeenCalledWith('user_abc', { plan: 'premium' });

  });

  it('calls posthog.reset when reset is called', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'posthog');
    vi.stubEnv('VITE_POSTHOG_API_KEY', 'phc_test_key');

    const resetFn = vi.fn();
    (window as any).posthog = { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), reset: resetFn };

    const { analytics } = await import('../lib/analytics');
    analytics.reset();

    expect(resetFn).toHaveBeenCalled();
  });

  it('gracefully handles missing posthog SDK on window', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'posthog');
    vi.stubEnv('VITE_POSTHOG_API_KEY', 'phc_test_key');

    // No posthog on window — should fall back to lazy import (async — can't await in test)
    const { analytics } = await import('../lib/analytics');
    // This should not throw despite posthog-js not loading (dynamic import fails in test)
    expect(() => analytics.track('session_start')).not.toThrow();

  });
});