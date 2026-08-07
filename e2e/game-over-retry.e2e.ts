import { test, expect } from '@playwright/test';
import { buttonByText, readHud, readWave, smash, waitForRagePanel } from './helpers';

/**
 * E2E: forcing a game-over state and retrying must START A FRESH RUN with
 * rage at 0.
 *
 * The opposite invariant of the save/load spec: while save/load persists the
 * vent meter, a retry remounts GameCanvas (new key -> new GameEngine) and
 * resetEntities() zeroes weaponHeat. Guards against any state leak where run 2
 * inherits run 1's meter.
 */
test.describe('game-over retry resets the rage meter', () => {
  test('a fresh run after Retry starts with the rage meter at 0', async ({ page }) => {
    test.setTimeout(300_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.getByText('ANGER VENT PROTOCOL').first()).toBeVisible({ timeout: 45_000 });
    await buttonByText(page, /begin stress vent/i).click();
    await waitForRagePanel(page);

    const t0 = Date.now();
    let initialRage = 0;
    while (Date.now() - t0 < 20_000 && initialRage <= 0) {
      await smash(page, 6);
      const hud = await readHud(page);
      initialRage = Number(hud.rage);
    }

    expect(Number.isFinite(initialRage), 'the run must expose a live rage value').toBe(true);
    expect(initialRage, 'the initial run should build some rage before retry').toBeGreaterThan(0);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('bugsmasher:force-game-over', { detail: { score: 0 } }));
    });

    const retry = buttonByText(page, /retry/i);
    await expect(retry).toBeVisible({ timeout: 15_000 });
    await retry.click();

    await waitForRagePanel(page);

    const samples: string[] = [];
    const s0 = Date.now();
    while (Date.now() - s0 < 5000) {
      const hud = await readHud(page);
      samples.push(hud.rage ?? 'null');
      await page.waitForTimeout(300);
    }
    console.log(`RUN 2 RAGE SAMPLES: ${samples.join(' | ')}`);
    const wave = await readWave(page);
    console.log(`RUN 2 wave: ${wave}`);
    expect(wave, 'a fresh run should be back on WAVE 1').toBe('WAVE 1');

    for (const sample of samples) {
      const num = Number(sample);
      expect(Number.isFinite(num), 'new-run rage must be a numeric value').toBe(true);
      expect(
        num,
        'rage must reset to 0 on a fresh run after Retry (no leak from run 1)',
      ).toBeLessThanOrEqual(1);
    }

    expect(pageErrors, 'no uncaught page errors during gameplay').toEqual([]);
  });
});
