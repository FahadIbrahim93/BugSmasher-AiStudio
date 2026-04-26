// Database module exports
export * from './types';
export * from './AuthManager';
export * from './CloudSaveManager';
export * from './StatsManager';
export * from './LeaderboardManager';

import { authManager } from './AuthManager';
import { cloudSaveManager } from './CloudSaveManager';
import { statsManager } from './StatsManager';
import { leaderboardManager } from './LeaderboardManager';

// Initialize database on import
export function initializeDatabase(): void {
  const state = authManager.getState();
  
  if (!state.isAuthenticated) {
    // Auto-login as guest
    authManager.signInAsGuest();
  }
  
  statsManager.initialize();
}

// Export singleton instances
export const db = {
  auth: authManager,
  cloudSave: cloudSaveManager,
  stats: statsManager,
  leaderboard: leaderboardManager,
};