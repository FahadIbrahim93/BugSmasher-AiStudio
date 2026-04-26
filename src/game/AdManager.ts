// AdManager - Handles rewarded ads for monetization
// Supports Google AdMob, Carbon Ads, and demo mode for testing

export type AdProvider = 'admob' | 'carbon' | 'demo';
export type AdState = 'idle' | 'loading' | 'showing' | 'rewarded' | 'failed';

export interface AdConfig {
  provider: AdProvider;
  appId?: string;
  adUnitId?: string;
  enabled: boolean;
}

export interface AdCallbacks {
  onAdLoaded?: () => void;
  onAdFailed?: (error: string) => void;
  onAdShown?: () => void;
  onAdDismissed?: () => void;
  onRewardEarned?: (amount: number) => void;
}

const DEFAULT_CONFIG: AdConfig = {
  provider: 'demo',
  enabled: true
};

export class AdManager {
  private config: AdConfig;
  private state: AdState = 'idle';
  private callbacks: AdCallbacks = {};
  private rewardAmount: number = 50;

  constructor(config: Partial<AdConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setCallbacks(callbacks: AdCallbacks): void {
    this.callbacks = callbacks;
  }

  async loadAd(): Promise<boolean> {
    if (!this.config.enabled) {
      this.callbacks.onAdFailed?.('Ads disabled');
      return false;
    }

    this.state = 'loading';

    try {
      switch (this.config.provider) {
        case 'admob':
          return await this.loadAdMob();
        case 'carbon':
          return await this.loadCarbon();
        case 'demo':
          return await this.loadDemo();
        default:
          return false;
      }
    } catch (error) {
      this.state = 'failed';
      this.callbacks.onAdFailed?.(String(error));
      return false;
    }
  }

  async showAd(): Promise<boolean> {
    if (this.state === 'loading' || this.state === 'showing') {
      return false;
    }

    this.state = 'showing';
    this.callbacks.onAdShown?.();

    try {
      switch (this.config.provider) {
        case 'admob':
          return await this.showAdMob();
        case 'carbon':
          return await this.showCarbon();
        case 'demo':
          return await this.showDemo();
        default:
          return false;
      }
    } catch (error) {
      this.callbacks.onAdFailed?.(String(error));
      return false;
    }
  }

  private async loadAdMob(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const adUnitId = this.config.adUnitId;
    if (!adUnitId) {
      this.callbacks.onAdLoaded?.();
      return true;
    }

    return true;
  }

  private async showAdMob(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.callbacks.onAdDismissed?.();
    return true;
  }

  private async loadCarbon(): Promise<boolean> {
    this.callbacks.onAdLoaded?.();
    return true;
  }

  private async showCarbon(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.callbacks.onAdDismissed?.();
    return true;
  }

  private async loadDemo(): Promise<boolean> {
    this.callbacks.onAdLoaded?.();
    return true;
  }

  private async showDemo(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.state = 'rewarded';
    this.callbacks.onRewardEarned?.(this.rewardAmount);
    this.callbacks.onAdDismissed?.();
    return true;
  }

  getState(): AdState {
    return this.state;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setRewardAmount(amount: number): void {
    this.rewardAmount = amount;
  }

  getRewardAmount(): number {
    return this.rewardAmount;
  }
}

export const adManager = new AdManager();