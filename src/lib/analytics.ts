/**
 * Analytics facade — de-scoped for release.
 *
 * The game stays 100% free with no paywalls. Analytics are a future growth
 * feature, not part of the 10/10 production release. This module is kept as a
 * no-op placeholder so the rest of the codebase compiles without analytics-
 * specific imports.
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
  | 'achievement_unlocked'
  | 'mission_claimed'
  | 'fury_triggered'
  | 'slam_used'
  | 'goo_swept';

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

type AnalyticsProvider = 'none' | 'console' | 'posthog' | 'mixpanel';

function getProvider(): AnalyticsProvider {
  const raw = import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined;
  if (raw === 'console' || raw === 'posthog' || raw === 'mixpanel') return raw;
  return 'none';
}

class AnalyticsService {
  private sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  private enabled = getProvider() !== 'none';

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
    }
    // Analytics stub. For production, integrate PostHog or similar (see audit recommendation). Currently logs to console only.
  }

  identify(userId: string, traits?: AnalyticsPayload): void {
    if (!this.enabled) return;
    if (getProvider() === 'console') {
      console.info('[analytics] identify', userId, traits);
    }
  }

  reset(): void {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const analytics = new AnalyticsService();