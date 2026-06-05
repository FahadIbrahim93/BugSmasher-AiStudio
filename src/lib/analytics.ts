/**
 * Analytics facade — provider-agnostic event tracking.
 * Wire to PostHog/Mixpanel in production via VITE_ANALYTICS_PROVIDER.
 */

export type AnalyticsEvent =
  // Core gameplay (9)
  | 'session_start'
  | 'session_end'
  | 'wave_complete'
  | 'wave_fail'
  | 'game_over'
  | 'powerup_collected'
  | 'daily_challenge_start'
  | 'settings_changed'
  | 'achievement_unlocked'
  // Retention (7)
  | 'login_streak_day'
  | 'login_streak_broken'
  | 'mission_started'
  | 'mission_completed'
  | 'mission_claimed'
  | 'daily_reward_claimed'
  | 'app_returned_from_background'
  // Monetization (8)
  | 'ad_impression'
  | 'ad_clicked'
  | 'ad_skipped'
  | 'rewarded_ad_offered'
  | 'rewarded_ad_watched'
  | 'rewarded_ad_declined'
  | 'iap_initiated'
  | 'iap_purchased'
  | 'iap_failed'
  // Social (6)
  | 'score_shared'
  | 'referral_link_generated'
  | 'referral_link_shared'
  | 'referral_completed'
  | 'friend_challenge_sent'
  | 'friend_challenge_completed'
  // Onboarding (4)
  | 'tutorial_started'
  | 'tutorial_step_completed'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  // Progression (5)
  | 'biome_unlocked'
  | 'prestige_initiated'
  | 'prestige_completed'
  | 'level_up'
  | 'custom_map_created'
  // Technical (3)
  | 'error_caught'
  | 'performance_low_fps'
  | 'app_crashed';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined;
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
    // posthog / mixpanel: inject SDK in Sprint B (TASKBOARD P3-01)
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