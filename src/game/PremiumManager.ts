// PremiumManager - Handles premium version unlocks

export type PremiumFeature = 'no_ads' | 'extra_lives' | 'double_points' | 'exclusive_skins' | 'early_access';

export interface PremiumPerk {
  id: PremiumFeature;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export const PREMIUM_PERKS: PremiumPerk[] = [
  { id: 'no_ads', name: 'No Ads', description: 'Remove all advertisements', icon: '🚫', unlocked: false },
  { id: 'extra_lives', name: 'Extra Lives', description: 'Start with 2 extra lives', icon: '❤️', unlocked: false },
  { id: 'double_points', name: '2X Points', description: 'Double prestige points earned', icon: '✨', unlocked: false },
  { id: 'exclusive_skins', name: 'Exclusive Skins', description: 'Access to premium-only skins', icon: '💎', unlocked: false },
  { id: 'early_access', name: 'Early Access', description: 'Get new features first', icon: '🚀', unlocked: false },
];

export interface PremiumState {
  isPremium: boolean;
  purchaseDate: string | null;
  perks: Set<PremiumFeature>;
}

const PREMIUM_KEY = 'bugsmasher_premium';

export class PremiumManager {
  private state: PremiumState = this.load();

  private load(): PremiumState {
    try {
      const stored = localStorage.getItem(PREMIUM_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          isPremium: parsed.isPremium || false,
          purchaseDate: parsed.purchaseDate || null,
          perks: new Set(parsed.perks || []),
        };
      }
    } catch (e) {
      console.warn('Failed to load premium state:', e);
    }
    return { isPremium: false, purchaseDate: null, perks: new Set() };
  }

  private save(): void {
    try {
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({
        isPremium: this.state.isPremium,
        purchaseDate: this.state.purchaseDate,
        perks: Array.from(this.state.perks),
      }));
    } catch (e) {
      console.warn('Failed to save premium state:', e);
    }
  }

  isPremium(): boolean {
    return this.state.isPremium;
  }

  getPerks(): PremiumPerk[] {
    return PREMIUM_PERKS.map(perk => ({
      ...perk,
      unlocked: this.state.perks.has(perk.id),
    }));
  }

  hasPerk(feature: PremiumFeature): boolean {
    return this.state.perks.has(feature);
  }

  purchase(): void {
    this.state.isPremium = true;
    this.state.purchaseDate = new Date().toISOString();
    this.state.perks = new Set(['no_ads', 'extra_lives', 'double_points', 'exclusive_skins', 'early_access']);
    this.save();
  }

  getPurchaseDate(): string | null {
    return this.state.purchaseDate;
  }

  getBonusMultiplier(): number {
    return this.hasPerk('double_points') ? 2 : 1;
  }

  getStartingLives(): number {
    return this.hasPerk('extra_lives') ? 2 : 0;
  }

  shouldShowAds(): boolean {
    return !this.state.isPremium;
  }
}

export const premiumManager = new PremiumManager();