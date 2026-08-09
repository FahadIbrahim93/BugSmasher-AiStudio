/**
 * Rewarded ads facade — de-scoped for release.
 *
 * The game stays 100% free with no paywalls. Ads are a future growth feature,
 * not part of the 10/10 production release. This module is kept as a no-op
 * placeholder so the rest of the codebase compiles without ads-specific imports.
 */

export interface AdReward {
  type: 'resource_boost' | 'continue_run';
  amount?: number;
}

const ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

export class AdsService {
  static isEnabled(): boolean {
    return ENABLED;
  }

  static async showRewarded(_placement: string): Promise<AdReward | null> {
    if (!ENABLED) return null;
    await Promise.resolve();
    // Provider SDK hooks here
    return null;
  }

  static preload(): void {
    if (!ENABLED) return;
  }
}