import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('tracks events when console provider enabled', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'console');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.track('wave_complete', { wave: 5, score: 1200 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('no-ops when analytics provider is disabled', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'none');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.track('wave_complete', { wave: 1 });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('identifies users only when provider supports it', async () => {
    vi.stubEnv('VITE_ANALYTICS_PROVIDER', 'console');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { analytics } = await import('../lib/analytics');
    analytics.identify('user-123', { plan: 'demo' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
