// EventTracker - Core analytics event tracking system

export type EventCategory = 
  | 'session' 
  | 'gameplay' 
  | 'progression' 
  | 'monetization' 
  | 'social' 
  | 'retention'
  | 'technical';

export interface AnalyticsEvent {
  id: string;
  category: EventCategory;
  name: string;
  timestamp: number;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  wave: number;
  kills: number;
  bugsPerMinute: number;
  avgCombo: number;
  maxCombo: number;
  powerupsCollected: number;
  upgradesPurchased: number;
}

export interface DailyMetrics {
  date: string;
  dau: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  avgSessionLength: number;
  totalScore: number;
  highestScore: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  conversionRate: number;
  adRevenue: number;
  iapRevenue: number;
}

const EVENTS_KEY = 'bugsmasher_events';
const SESSIONS_KEY = 'bugsmasher_sessions';
const METRICS_KEY = 'bugsmasher_metrics';

export class EventTracker {
  private sessionId: string = '';
  private sessionStart: number = 0;
  private events: AnalyticsEvent[] = [];
  private currentScore: number = 0;
  private currentWave: number = 0;
  private currentKills: number = 0;

  constructor() {
    this.initSession();
    this.loadEvents();
  }

  private initSession(): void {
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    this.sessionStart = Date.now();
    this.trackEvent('session', 'session_start', 1);
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(EVENTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        
        const now = Date.now();
        this.events = this.events.filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000);
      }
    } catch (e) {
      console.warn('Failed to load events:', e);
    }
  }

  private saveEvents(): void {
    try {
      const now = Date.now();
      const recent = this.events.filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000);
      
      localStorage.setItem(EVENTS_KEY, JSON.stringify({
        events: recent,
        lastUpdated: now
      }));
    } catch (e) {
      console.warn('Failed to save events:', e);
    }
  }

  trackEvent(category: EventCategory, name: string, value: number = 1, metadata?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      category,
      name,
      timestamp: Date.now(),
      value,
      metadata
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  trackGameStart(): void {
    this.trackEvent('session', 'game_start', 1);
  }

  trackGameEnd(score: number, wave: number, kills: number): void {
    this.trackEvent('session', 'game_end', 1, { score, wave, kills });
    this.saveSessionMetrics(score, wave, kills);
  }

  trackScore(score: number): void {
    this.currentScore = score;
    if (score % 1000 === 0) {
      this.trackEvent('progression', 'score_milestone', score, { milestone: score / 1000 });
    }
  }

  trackWave(wave: number): void {
    this.currentWave = wave;
    this.trackEvent('progression', 'wave_completed', wave);
  }

  trackKill(): void {
    this.currentKills++;
    this.trackEvent('gameplay', 'bug_killed', 1);
  }

  trackPowerupCollect(type: string): void {
    this.trackEvent('gameplay', 'powerup_collected', 1, { powerupType: type });
  }

  trackUpgradePurchased(type: string, cost: number): void {
    this.trackEvent('monetization', 'upgrade_purchased', cost, { upgradeType: type });
  }

  trackAdWatched(adType: string, reward: number): void {
    this.trackEvent('monetization', 'ad_watched', reward, { adType });
  }

  trackShare(platform: string): void {
    this.trackEvent('social', 'share', 1, { platform });
  }

  trackReferralSent(): void {
    this.trackEvent('social', 'referral_sent', 1);
  }

  trackReferralConverted(): void {
    this.trackEvent('social', 'referral_converted', 1);
  }

  trackAchievementUnlocked(achievementId: string): void {
    this.trackEvent('progression', 'achievement_unlocked', 1, { achievementId });
  }

  trackBiomeUnlocked(biomeId: string): void {
    this.trackEvent('progression', 'biome_unlocked', 1, { biomeId });
  }

  trackError(errorType: string, details: string): void {
    this.trackEvent('technical', 'error', 1, { errorType, details });
  }

  private saveSessionMetrics(score: number, wave: number, kills: number): void {
    const now = Date.now();
    const duration = now - this.sessionStart;
    const bugsPerMinute = duration > 0 ? (kills / (duration / 60000)) : 0;
    
    const metrics: SessionMetrics = {
      sessionId: this.sessionId,
      startTime: this.sessionStart,
      endTime: now,
      duration,
      score,
      wave,
      kills,
      bugsPerMinute: Math.round(bugsPerMinute * 10) / 10,
      avgCombo: 0,
      maxCombo: 0,
      powerupsCollected: 0,
      upgradesPurchased: 0
    };
    
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      const sessions: SessionMetrics[] = stored ? JSON.parse(stored) : [];
      sessions.push(metrics);
      
      const recent = sessions.slice(-100);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(recent));
    } catch (e) {
      console.warn('Failed to save session metrics:', e);
    }
  }

  getSessions(count: number = 10): SessionMetrics[] {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (stored) {
        const sessions: SessionMetrics[] = JSON.parse(stored);
        return sessions.slice(-count);
      }
    } catch (e) {
      console.warn('Failed to get sessions:', e);
    }
    return [];
  }

  getDailyMetrics(): DailyMetrics {
    const today = new Date().toISOString().split('T')[0];
    const sessions = this.getSessions(100);
    
    const todaySessions = sessions.filter(s => {
      const date = new Date(s.startTime).toISOString().split('T')[0];
      return date === today;
    });
    
    const avgSessionLength = todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + s.duration, 0) / todaySessions.length / 1000
      : 0;
    
    const dau = todaySessions.length;
    const highestScore = todaySessions.length > 0
      ? Math.max(...todaySessions.map(s => s.score))
      : 0;
    
    return {
      date: today,
      dau,
      newUsers: 1,
      returningUsers: dau - 1,
      sessions: dau,
      avgSessionLength: Math.round(avgSessionLength),
      totalScore: todaySessions.reduce((sum, s) => sum + s.score, 0),
      highestScore,
      retentionD1: 0,
      retentionD7: 0,
      retentionD30: 0,
      conversionRate: 0,
      adRevenue: 0,
      iapRevenue: 0
    };
  }

  getEventCount(category?: EventCategory): number {
    if (category) {
      return this.events.filter(e => e.category === category).length;
    }
    return this.events.length;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  endSession(): void {
    this.trackEvent('session', 'session_end', 1);
  }
}

export const eventTracker = new EventTracker();