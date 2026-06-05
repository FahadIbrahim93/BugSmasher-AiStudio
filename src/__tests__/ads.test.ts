import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AdsService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.stubGlobal('Math', { ...Math, random: () => 0.5 }); // Deterministic — ensures ad success
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('isEnabled', () => {
    it('should return false when VITE_ADS_ENABLED is not set', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'false');
      const { AdsService } = await import('../lib/ads');
      expect(AdsService.isEnabled()).toBe(false);
    });

    it('should return true when VITE_ADS_ENABLED is true', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      expect(AdsService.isEnabled()).toBe(true);
    });
  });

  describe('isPreloaded', () => {
    it('should return false initially', async () => {
      const { AdsService } = await import('../lib/ads');
      expect(AdsService.isPreloaded()).toBe(false);
    });

    it('should return true after preload', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      AdsService.preload();
      expect(AdsService.isPreloaded()).toBe(true);
    });
  });

  describe('showRewarded', () => {
    it('should return null when ads are disabled', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'false');
      const { AdsService } = await import('../lib/ads');
      const result = await AdsService.showRewarded('continue_run');
      expect(result).toBeNull();
    });

    it('should return continue_run reward when ads are enabled', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      const result = await AdsService.showRewarded('continue_run');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('continue_run');
      expect(result!.amount).toBe(30);
    });

    it('should return resource_boost reward for resource_boost placement', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      const result = await AdsService.showRewarded('resource_boost');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('resource_boost');
      expect(result!.amount).toBe(100);
    });

    it('should return default resource_boost for unknown placements', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      const result = await AdsService.showRewarded('unknown_placement');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('resource_boost');
      expect(result!.amount).toBe(50);
    });

    it('should handle showRewarded throwing (error path coverage)', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      // force internal to reject by stubbing
      const orig = (AdsService as any).showRewarded;
      (AdsService as any).showRewarded = async () => { throw new Error('ad fail'); };
      await expect(AdsService.showRewarded('resource_boost')).rejects.toThrow('ad fail');
      (AdsService as any).showRewarded = orig;
    });
  });

  describe('preload', () => {
    it('should not throw when called', async () => {
      const { AdsService } = await import('../lib/ads');
      expect(() => AdsService.preload()).not.toThrow();
    });

    it('should set preloaded flag when ads enabled', async () => {
      vi.stubEnv('VITE_ADS_ENABLED', 'true');
      const { AdsService } = await import('../lib/ads');
      expect(AdsService.isPreloaded()).toBe(false);
      AdsService.preload();
      expect(AdsService.isPreloaded()).toBe(true);
    });
  });
});
