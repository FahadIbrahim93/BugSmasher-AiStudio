import { test, expect } from '@playwright/test';

// E2E smoke tests use stable data-testid / getByRole for resilience.
// Non-locale tests assume default English locale (i18n keys render to EN).
// Game/HUD canvas assertions prefer presence + testids over transient text like '100'.

test.describe('BUGSMASHER — Smoke Tests', () => {

  test('app loads and shows main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('BUGSMASHER', { timeout: 10000 });
    await expect(page.getByLabel('Start Game')).toBeVisible();
    await expect(page.getByText('DEFEND THE CORE')).toBeVisible();
    await expect(page.getByTestId('main-start')).toBeVisible();
  });

  test('settings menu opens and shows controls', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-settings').click();
    await expect(page.getByText('System Settings')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Audio Modules')).toBeVisible();
    await expect(page.getByText('Accessibility')).toBeVisible();
    await expect(page.getByText('Language')).toBeVisible();
  });

  test('armory opens and shows vault and supporter tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-armory').click();
    await expect(page.getByText('Armory').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Vault')).toBeVisible();
    await expect(page.getByText('Supporter', { exact: true }).first()).toBeVisible();
  });

  test('daily challenge modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-daily').click();
    await expect(page.getByTestId('challenge-primary-objective')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('challenge-system-modifiers')).toBeVisible();
    await expect(page.getByTestId('challenge-mission-rewards')).toBeVisible();
    // Close via Escape
    await page.keyboard.press('Escape');
  });

  test('language switch changes visible text', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-settings').click();
    await page.getByTestId('locale-select').selectOption('es');
    await expect(page.getByText('Módulos de Audio')).toBeVisible({ timeout: 3000 });
    // Switch back to English
    await page.getByTestId('locale-select').selectOption('en');
    await expect(page.getByText('Audio Modules')).toBeVisible({ timeout: 3000 });
  });

  test('leaderboard modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-leaderboard').click();
    await expect(page.getByTestId('leaderboard-title')).toBeVisible({ timeout: 5000 });
    // Should show loading or entry list
    await expect(page.getByText(/Nexus Archive|Sector Rankings/)).toBeVisible();
  });

  test('account menu opens with login option', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-terminal').click();
    await expect(page.getByText('CENTRAL ACCESS')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Secure Identity Management')).toBeVisible();
  });

  test('achievement gallery opens', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('main-achievements').click();
    await expect(page.getByText('Achievement Gallery')).toBeVisible({ timeout: 5000 });
  });

  test('start game shows HUD elements', async ({ page }) => {
    await page.goto('/');
    // Click the Initialize Sequence button (via aria + testid for stability)
    await page.getByLabel('Start Game').click();
    // Wait for game canvas to load and HUD to appear (prefer canvas + testids over locale-sensitive text)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('hud-score-label')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('hud-wave-label')).toContainText(/WAVE/i, { timeout: 5000 });
    // Health indicator should be present (initial value)
    await expect(page.getByTestId('hud-health')).toBeVisible({ timeout: 5000 });
    // GameOver controls have stable testids (added for E2E robustness under locale/async); not present pre-over
    await expect(page.getByTestId('gameover-retry')).toHaveCount(0);
    await expect(page.getByTestId('gameover-mainmenu')).toHaveCount(0);
  });
});
