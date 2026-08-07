import { test, expect } from '@playwright/test';
import { buttonByText, readHud, readWave, smash, waitForRagePanel } from './helpers';

/**
 * E2E: a mid-run save/load restores the HUD rage meter from the saved state.
 *
 * Guards the "rage resets on load" regression: exportState() must persist
 * weaponHeat (and the FURY ignition cooldown), and importState() must restore
 * them AFTER resetEntities() zeroes the meter. The spec:
 *  1. Plays wave 1 and builds a solid rage value (~40+).
 *  2. Pauses and saves the run to an empty memory slate.
 *  3. Loads that slate back mid-session (PauseMenu -> Load Game -> Mount Slate).
 *  4. Asserts the rage meter is restored to (approximately) the saved value —
 *     definitely NOT 0, and consistent with only natural ~6/s decay elapsing
 *     between the frozen pause value and the post-load read.
 */
test.describe('save / load rage restoration', () => {
  test('rage meter restores from a saved mid-wave run', async ({ page }) => {
    test.setTimeout(300_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Load the built app and start a standard run
    await page.goto('/');
    await expect(page.getByText('ANGER VENT PROTOCOL').first()).toBeVisible({ timeout: 45_000 });
    await buttonByText(page, /begin stress vent/i).click();
    await waitForRagePanel(page);

    // --- Phase A: smash until the meter holds a solid numeric value (~40+) ---
    const t0 = Date.now();
    let rageBefore: number | null = null;
    while (Date.now() - t0 < 90_000 && rageBefore === null) {
      await smash(page, 6);
      const hud = await readHud(page);
      const num = Number(hud.rage);
      // Skip FURY text / transient drain — wait for a stable numeric reading.
      if (Number.isFinite(num) && num >= 40) {
        rageBefore = num;
      }
    }
    console.log(`RAGE BEFORE SAVE: ${rageBefore}`);
    expect(rageBefore, 'rage should build to a solid value before saving').not.toBeNull();

    // --- Phase B: pause and save the run to an empty slate ---
    await page.getByRole('button', { name: 'Pause Game' }).click();
    await buttonByText(page, /save game/i).click();
    await expect(page.getByText('Save Game State').first()).toBeVisible({ timeout: 15_000 });
    // First empty slot -> "Write State"
    await buttonByText(page, /write state/i).click();
    // Modal closes via onSlotSaved; the PauseMenu remains.
    await expect(page.getByText('Save Game State').first()).not.toBeVisible({ timeout: 15_000 });

    // --- Phase C: load the slate back mid-session ---
    await buttonByText(page, /load game/i).click();
    await expect(page.getByText('Load Game State').first()).toBeVisible({ timeout: 15_000 });
    await buttonByText(page, /mount slate/i).click();
    // onSlotLoaded -> importState + togglePause (resume); modal closes.
    await expect(page.getByText('Load Game State').first()).not.toBeVisible({ timeout: 15_000 });

    // --- Phase D: the rage meter must have restored from the saved run ---
    const hudAfter = await readHud(page);
    const rageAfter = Number(hudAfter.rage);
    console.log(`RAGE AFTER LOAD: ${hudAfter.rage} | wave shown: ${await readWave(page)}`);
    expect(hudAfter.rage, 'rage meter should render after load').not.toBeNull();
    expect(Number.isFinite(rageAfter), 'restored rage should be a numeric value').toBe(true);
    expect(
      rageAfter,
      'rage must NOT be reset to 0 by save/load (the regression this guards)',
    ).toBeGreaterThan(0);
    // Only natural decay (~6/s) may elapse between the frozen pause value and
    // the post-load read; a dropped weaponHeat would read 0 here.
    expect(
      rageAfter,
      'restored rage should match the saved value within a small decay window',
    ).toBeGreaterThanOrEqual((rageBefore as number) - 30);

    expect(pageErrors, 'no uncaught page errors during gameplay').toEqual([]);
  });
});
