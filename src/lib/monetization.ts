/**
 * Cosmetics monetization — tier purchase API with demo mode.
 * Production: replace grantSupporterPack with Stripe/RevenueCat SDK call (P3-04).
 */

export type PurchaseTier = 'basic' | 'premium' | 'ultimate';

/** Display prices for each supporter tier (USD). */
export const TIER_PRICES: Record<PurchaseTier, { usd: number; label: string }> = {
  basic:   { usd: 4.99,  label: '$4.99' },
  premium: { usd: 9.99,  label: '$9.99' },
  ultimate: { usd: 19.99, label: '$19.99' },
};

const SUPPORTER_KEY = 'bugsmasher_supporter_pack';

export function hasSupporterPack(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SUPPORTER_KEY) === 'true';
}

export function grantSupporterPack(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUPPORTER_KEY, 'true');
  window.dispatchEvent(new CustomEvent('supporter_pack_granted'));
}

/**
 * Attempt to purchase a supporter tier.
 * In demo mode (VITE_ENABLE_DEMO_PURCHASE=true) grants immediately.
 * Production: replace body with payment SDK call (Stripe Elements, RevenueCat, etc.).
 *
 * @param tier - The supporter tier to purchase.
 * @returns true on successful purchase, false on failure/cancellation.
 */
export async function purchaseSupporterTier(tier: PurchaseTier): Promise<boolean> {
  const isDemo = import.meta.env.VITE_ENABLE_DEMO_PURCHASE === 'true';

  if (!isDemo) {
    console.info(
      `[monetization] Purchase requested for ${tier} ($${TIER_PRICES[tier].usd}) — ` +
      'set VITE_ENABLE_DEMO_PURCHASE=true to test.'
    );
    return false;
  }

  // Demo: simulate network delay, then grant via key system
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Import CosmeticsManager dynamically to avoid circular dependency at module level
    const { unlockSupporterPack } = await import('../game/CosmeticsManager');
    const tierMap: Record<PurchaseTier, string> = {
      basic: 'NEXUS_SUPPORTER',
      premium: 'NEXUS_PREMIUM',
      ultimate: 'NEXUS_ULTIMATE',
    };
    const result = unlockSupporterPack(tierMap[tier]);
    if (result) {
      grantSupporterPack();
      return true;
    }
    return false;
  } catch {
    console.warn('[monetization] Demo purchase failed');
    return false;
  }
}

/** @deprecated Use purchaseSupporterTier(tier) instead. */
export async function purchaseSupporterPack(): Promise<boolean> {
  return purchaseSupporterTier('basic');
}