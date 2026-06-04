import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'bugsmasher_supporter_pack';

describe('monetization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  describe('TIER_PRICES', () => {
    it('should have 3 tiers with USD prices', async () => {
      const { TIER_PRICES } = await import('../lib/monetization');
      expect(TIER_PRICES.basic.usd).toBe(4.99);
      expect(TIER_PRICES.premium.usd).toBe(9.99);
      expect(TIER_PRICES.ultimate.usd).toBe(19.99);
    });

    it('should have display labels for all tiers', async () => {
      const { TIER_PRICES } = await import('../lib/monetization');
      expect(TIER_PRICES.basic.label).toBe('$4.99');
      expect(TIER_PRICES.premium.label).toBe('$9.99');
      expect(TIER_PRICES.ultimate.label).toBe('$19.99');
    });
  });

  describe('hasSupporterPack', () => {
    it('should return false initially', async () => {
      const { hasSupporterPack } = await import('../lib/monetization');
      expect(hasSupporterPack()).toBe(false);
    });

    it('should return true after granting', async () => {
      const { hasSupporterPack, grantSupporterPack } = await import('../lib/monetization');
      grantSupporterPack();
      expect(hasSupporterPack()).toBe(true);
    });

    it('should return false after clearing localStorage', async () => {
      const { hasSupporterPack, grantSupporterPack } = await import('../lib/monetization');
      grantSupporterPack();
      localStorage.removeItem(STORAGE_KEY);
      expect(hasSupporterPack()).toBe(false);
    });
  });

  describe('grantSupporterPack', () => {
    it('should set localStorage and dispatch event', async () => {
      const { grantSupporterPack } = await import('../lib/monetization');
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      grantSupporterPack();

      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'supporter_pack_granted' })
      );
    });
  });

  describe('purchaseSupporterTier', () => {
    it('should return false when demo mode is not enabled', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'false');
      const { purchaseSupporterTier, hasSupporterPack } = await import('../lib/monetization');

      const result = await purchaseSupporterTier('basic');
      expect(result).toBe(false);
      expect(hasSupporterPack()).toBe(false);
    });

    it('should return true and grant supporter pack in demo mode for basic tier', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'true');
      const { purchaseSupporterTier, hasSupporterPack } = await import('../lib/monetization');

      const result = await purchaseSupporterTier('basic');
      expect(result).toBe(true);
      expect(hasSupporterPack()).toBe(true);
    });

    it('should return true in demo mode for premium tier', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'true');
      const { purchaseSupporterTier } = await import('../lib/monetization');
      const result = await purchaseSupporterTier('premium');
      expect(result).toBe(true);
    });

    it('should return true in demo mode for ultimate tier', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'true');
      const { purchaseSupporterTier } = await import('../lib/monetization');
      const result = await purchaseSupporterTier('ultimate');
      expect(result).toBe(true);
    });
  });

  describe('purchaseSupporterPack (deprecated)', () => {
    it('should return false without demo mode', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'false');
      const { purchaseSupporterPack } = await import('../lib/monetization');
      const result = await purchaseSupporterPack();
      expect(result).toBe(false);
    });

    it('should return true in demo mode (defaults to basic)', async () => {
      vi.stubEnv('VITE_ENABLE_DEMO_PURCHASE', 'true');
      const { purchaseSupporterPack, hasSupporterPack } = await import('../lib/monetization');
      const result = await purchaseSupporterPack();
      expect(result).toBe(true);
      expect(hasSupporterPack()).toBe(true);
    });
  });
});
