/**
 * Cosmetics monetization stub — de-scoped for release.
 *
 * The game stays 100% free with no paywalls. Cosmetics monetization is a
 * future growth feature, not part of the 10/10 production release. This module
 * is kept as a no-op placeholder so the rest of the codebase compiles without
 * monetization-specific imports.
 */

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

export async function purchaseSupporterPack(): Promise<boolean> {
  // Stub: real payment SDK replaces this
  await Promise.resolve();
  if (import.meta.env.VITE_ENABLE_DEMO_PURCHASE === 'true') {
    grantSupporterPack();
    return true;
  }
  console.info('[monetization] Supporter pack purchase stub — set VITE_ENABLE_DEMO_PURCHASE=true for demo');
  return false;
}