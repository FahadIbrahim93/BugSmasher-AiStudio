/**
 * Rewarded ads facade — demo mode with simulated ad flow (P3-05).
 * Production: replace showRewarded with AdMob/AdSense SDK call.
 */

export interface AdReward {
  type: 'resource_boost' | 'continue_run';
  /** Resource type or health restore amount */
  amount?: number;
}

const ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';
let preloaded = false;

/** Simulated ad-watching delay (ms) — matches real ad SDK timing expectation */
const SIMULATED_AD_DURATION = 1200;

export class AdsService {
  static isEnabled(): boolean {
    return ENABLED;
  }

  static isPreloaded(): boolean {
    return preloaded;
  }

  /**
   * Show a rewarded ad for a placement.
   * In demo mode, simulates a short ad, then returns the reward based on placement.
   * Production: replace body with AdMob rewarded video or AdSense interstitial call.
   *
   * @param placement - Placement identifier ('continue_run' | 'resource_boost').
   * @returns The AdReward on successful completion, or null if ad was skipped/failed.
   */
  static async showRewarded(placement: string): Promise<AdReward | null> {
    if (!ENABLED) {
      console.info('[ads] Ads disabled — set VITE_ADS_ENABLED=true to test rewarded ads.');
      return null;
    }

    try {
      // In production, this would call the SDK's show() method
      // e.g. admob.rewarded.show() or window.gtag('event', 'ad_reward', ...)
      await new Promise(resolve => setTimeout(resolve, SIMULATED_AD_DURATION));

      // Simulate a 90% completion rate
      if (Math.random() < 0.9) {
        preloaded = false; // consumed — trigger fresh preload
        AdsService.preload();
        return AdsService.getRewardForPlacement(placement);
      }

      console.info('[ads] Simulated ad skipped by user.');
      return null;
    } catch (e) {
      console.warn('[ads] Rewarded ad failed:', e);
      return null;
    }
  }

  /** Determine the reward payload for a given placement. */
  private static getRewardForPlacement(placement: string): AdReward {
    switch (placement) {
      case 'continue_run':
        return { type: 'continue_run', amount: 30 };
      case 'resource_boost':
        return { type: 'resource_boost', amount: 100 };
      default:
        return { type: 'resource_boost', amount: 50 };
    }
  }

  /**
   * Preload the next ad so it's ready to show.
   * In production, this triggers the SDK's preload/load API.
   */
  static preload(): void {
    if (!ENABLED) return;
    preloaded = true;
    // Production: adProvider.preloadRewarded() or similar
  }
}