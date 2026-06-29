import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['functions/**', 'node_modules/**', 'dist/**'],
    // Engine/lib coverage gate — React UI shells are validated via planned Playwright E2E.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/game/**/*.ts', 'src/lib/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'node_modules/**',
        'dist/**',
        // Phase 4 production stubs — excluded until real integrations land.
        'src/lib/ads.ts',
        'src/lib/monetization.ts',
        'src/lib/monitoring.ts',
        'src/lib/workspaceService.ts',
        'src/lib/shareCard.ts',
        'src/lib/safeStorage.ts',
        'src/lib/firebase.ts',
        'src/game/AdManager.ts',
        'src/game/Sentry.ts',
        'src/game/StoryManager.ts',
        'src/game/MissionManager.ts',
        'src/game/LoginStreakManager.ts',
        'src/game/AssetManager.ts',
        'src/game/AchievementSession.ts',
        'src/game/missionEvents.ts',
        'src/game/AudioAssetLoader.ts',
      ],
      thresholds: {
        // Phase 2 interim floor (2026-06-30). Phase 2b targets 80/70/75/80 after GameEngine/WaveManager branch work.
        lines: 77,
        functions: 75,
        branches: 61,
        statements: 76,
      },
    },
  },
});
