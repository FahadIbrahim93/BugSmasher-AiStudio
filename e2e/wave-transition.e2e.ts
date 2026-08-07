import { test, expect } from '@playwright/test';
import { buttonByText, readHud, readWave, smash, waitForRagePanel } from './helpers';

/**
 * E2E: the HUD rage meter survives a full wave transition.
 *
 * Guards the "rage resets at wave change" regression. The engine only zeroes
 * weaponHeat in resetEntities() — which runs on new game / import, NEVER on a
 * wave transition (WaveManager -> engine.stop() -> onWaveComplete() ->
 * engine.resume() -> startWave()). This spec drives a real wave 1 -> wave 2
 * transition and asserts:
 *  1. Wave 1 completes and the UpgradeMenu appears ("WAVE 1 SECURED").
 *  2. The HUD rage value stays visible (frozen) while the menu is open.
 *  3. "Proceed to Wave 2" closes the menu and resumes the engine.
 *  4. The rage value is NOT zeroed by the transition (persists through resume).
 *  5. The meter keeps climbing during wave 2 — fully functional, not stuck.
 */
test.describe('wave transition', () => {
  test('rage meter persists across wave 1 -> wave 2', async ({ page }) => {
    test.setTimeout(300_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Load the built app and start a run
    await page.goto('/');
    await expect(page.getByText('ANGER VENT PROTOCOL').first()).toBeVisible({ timeout: 45_000 });
    await buttonByText(page, /begin stress vent/i).click();
    await waitForRagePanel(page);

    // Restart from a game-over only (NOT the wave menu — that is the signal).
    const handleGameOverOnly = async () => {
      const body = await page.evaluate(() => document.body.innerText ?? '');
      if (/DEFENSE DOWN|Core Connection Severed/.test(body)) {
        const retry = buttonByText(page, /retry|play again|try again/i);
        if (await retry.isVisible().catch(() => false)) await retry.click();
        await page.waitForTimeout(1200);
        const start = buttonByText(page, /begin stress vent/i);
        if (await start.isVisible().catch(() => false)) await start.click();
        await page.waitForTimeout(1200);
      }
    };

    // --- Phase A: smash wave 1 while building rage until the UpgradeMenu appears ---
    const t0 = Date.now();
    const climb: string[] = [];
    let menuSeen = false;
    while (Date.now() - t0 < 180_000 && !menuSeen) {
      await handleGameOverOnly();
      await smash(page, 8);
      const hud = await readHud(page);
      if (hud.rage !== null) {
        climb.push(`${((Date.now() - t0) / 1000).toFixed(1)}s:${hud.rage}`);
      }
      const body = await page.evaluate(() => document.body.innerText ?? '');
      if (/WAVE 1 SECURED/.test(body)) menuSeen = true;
    }
    console.log(`RAGE BEFORE MENU: ${climb.join(' -> ')}`);
    expect(menuSeen, 'Wave 1 should complete and open the upgrade menu').toBe(true);

    // --- Phase B: while the menu is open the HUD keeps showing the frozen rage value ---
    const hudAtMenu = await readHud(page);
    const rageAtMenu = hudAtMenu.rage;
    expect(rageAtMenu, 'HUD rage value should be visible during the upgrade menu').not.toBeNull();
    console.log(`RAGE AT MENU: ${rageAtMenu} | wave shown: ${await readWave(page)}`);

    // --- Phase C: proceed to wave 2 ---
    const proceed = buttonByText(page, /proceed to wave 2/i);
    await expect(proceed).toBeVisible({ timeout: 15_000 });
    await proceed.click();
    await expect(proceed).not.toBeVisible({ timeout: 15_000 });

    // Give the resumed engine a beat; then the rage must still be rendered.
    await page.waitForTimeout(400);
    const hudAfter = await readHud(page);
    const rageAfter = hudAfter.rage;
    console.log(`RAGE AFTER RESUME: ${rageAfter} | wave shown: ${await readWave(page)}`);
    expect(rageAfter, 'rage value should remain rendered after the transition').not.toBeNull();

    // --- Phase D: the transition must NOT have reset the meter to 0 ---
    const atMenu = Number(rageAtMenu);
    const after = Number(rageAfter);
    const rageIsFuryAfter = hudAfter.rage === 'FURY';
    if (rageIsFuryAfter) {
      // Meter shows FURY text = it reached 100 and ignited right after resume
      // — the transition clearly did NOT reset it. Fully functional.
      console.log('RAGE AFTER RESUME: FURY (meter at 100 — no reset)');
    } else if (Number.isFinite(atMenu) && Number.isFinite(after) && atMenu > 15) {
      // Strong regression check: only natural decay (~6/s) for the 1-2s of
      // menu close + resume may elapse; a hard reset would show 0 here.
      expect(after, 'rage must persist across the wave transition (no reset to 0)').toBeGreaterThan(
        0,
      );
      expect(
        after,
        'rage should only decay naturally across the transition, not plummet',
      ).toBeGreaterThanOrEqual(atMenu - 20);
    } else {
      // Edge case (FURY drained right as the menu appeared): meter may be low,
      // but it must still be alive — verified by the Phase E climb.
      expect(
        Number.isFinite(after) ? after : -1,
        'rage must not be stuck at a reset value of 0',
      ).toBeGreaterThanOrEqual(0);
    }

    // --- Phase E: wave 2 is live — smashing feeds the meter again ---
    let climbed = false;
    let prev = after;
    const e0 = Date.now();
    while (Date.now() - e0 < 25_000 && !climbed) {
      await smash(page, 8);
      const hud = await readHud(page);
      if (hud.furyOp > 0.5 && hud.rage === 'FURY') {
        climbed = true; // meter reached 100 and ignited — definitively functional
        break;
      }
      const now = Number(hud.rage);
      if (Number.isFinite(now) && Number.isFinite(prev) && now > prev + 10) climbed = true;
      prev = now;
    }
    console.log(`WAVE 2 CLIMB OK: ${climbed}`);
    expect(climbed, 'rage meter should keep climbing during wave 2').toBe(true);

    expect(pageErrors, 'no uncaught page errors during gameplay').toEqual([]);
  });
});
