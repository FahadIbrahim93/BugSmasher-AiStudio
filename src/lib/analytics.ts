/**
 * Analytics facade — provider-agnostic event tracking.
 * Supports console, PostHog, and Mixpanel providers.
 *
 * Configure via env vars:
 *   VITE_ANALYTICS_PROVIDER = 'console' | 'posthog' | 'mixpanel'
 *   VITE_POSTHOG_API_KEY      your PostHog project API key
 *   VITE_POSTHOG_HOST         your PostHog instance address (default: https://us.i.posthog.com)
 */

export type AnalyticsEvent =
  | 'session_start'
  | 'session_end'
  | 'wave_complete'
  | 'wave_fail'
  | 'game_over'
  | 'powerup_collected'
  | 'daily_challenge_start'
  | 'settings_changed'
  | 'achievement_unlocked';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
}

interface PostHog {
  init(key: string, options?: { api_host?: string }): void;
  capture(event: string, payload?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

type AnalyticsProvider = 'none' | 'console' | 'posthog' | 'mixpanel';

function getProvider(): AnalyticsProvider {
  const raw = import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined;
  if (raw === 'console' || raw === 'posthog' || raw === 'mixpanel') return raw;
  return 'none';
}

class AnalyticsService {
  private sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  private enabled = getProvider() !== 'none';
  private posthogInitialized = false;
  private posthogLoading = false;

  /** Lazily initialize PostHog SDK on first track/identify call. */
  private ensurePostHog(): void {
    if (this.posthogInitialized || this.posthogLoading || getProvider() !== 'posthog') return;

    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined;
    if (!apiKey) {
      // No API key configured — short-circuit to avoid repeated checks
      this.posthogInitialized = true;
      return;
    }
    const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

    this.posthogLoading = true;
    try {
      const posthog = (window as { posthog?: PostHog }).posthog;
      if (posthog && typeof posthog.init === 'function') {
        // Already loaded via script tag — init with config
        posthog.init(apiKey, { api_host: host });
        this.posthogInitialized = true;
        this.posthogLoading = false;
        return;
      }
      // Lazy-load posthog-js from npm if not loaded via script
      void import('posthog-js').then((mod) => {
        mod.default.init(apiKey, { api_host: host });
        this.posthogInitialized = true;
        this.posthogLoading = false;
      }).catch(() => {
        this.posthogLoading = false;
        console.warn('[analytics] posthog-js failed to load, falling back to console');
      });
    } catch {
      this.posthogLoading = false;
      console.warn('[analytics] PostHog init failed');
    }
  }

  track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
    if (!this.enabled) return;
    const envelope = {
      event,
      sessionId: this.sessionId,
      ts: Date.now(),
      ...payload,
    };
    const provider = getProvider();
    if (provider === 'console') {
      console.info('[analytics]', envelope);
    } else if (provider === 'posthog') {
      this.ensurePostHog();
      try {
        const ph = (window as { posthog?: PostHog }).posthog;
        if (ph && typeof ph.capture === 'function') {
          ph.capture(event, envelope);
        }
      } catch {
        // silent fail
      }
    } else if (provider === 'mixpanel') {
      console.warn('[analytics] Mixpanel provider not yet implemented');
    }
  }

  identify(userId: string, traits?: AnalyticsPayload): void {
    if (!this.enabled) return;
    const provider = getProvider();
    if (provider === 'console') {
      console.info('[analytics] identify', userId, traits);
    } else if (provider === 'posthog') {
      this.ensurePostHog();
      try {
        const ph = (window as { posthog?: PostHog }).posthog;
        if (ph && typeof ph.identify === 'function') {
          ph.identify(userId, traits);
        }
      } catch {
        // silent fail
      }
    } else if (provider === 'mixpanel') {
      console.warn('[analytics] Mixpanel provider not yet implemented');
    }
  }

  reset(clearSession: boolean = true): void {
    if (clearSession) {
      this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    const provider = getProvider();
    if (provider === 'posthog') {
      try {
        const ph = (window as { posthog?: PostHog }).posthog;
        if (ph && typeof ph.reset === 'function') {
          ph.reset();
        }
      } catch {
        // silent fail
      }
    } else if (provider === 'mixpanel') {
      console.warn('[analytics] Mixpanel provider not yet implemented');
    }
  }
}

export const analytics = new AnalyticsService();