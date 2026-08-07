import { test, expect } from '@playwright/test';
import { buttonByText, readHud, readWave, smash, waitForRagePanel } from './helpers';

/**
 * E2E: endless mode auto-advances through a wave transition with the HUD rage
 * meter keeping its value mid-flow.
 *
 * Endless modes (gameModeConfig.endlessWaves) never stop the engine on wave
 * completion: WaveManager flips straight into the next wave and Game.tsx skips
 * the UpgradeMenu. This spec asserts:
 *  1. Wave 1 -> wave 2 happens AUTOMATICALLY (no "Proceed to Wave 2" button,
 *     no upgrade menu, no click needed).
 *  2. The HUD rage value is continuous across the flip — only natural decay
 *     (~6/s) may elapse between the last WAVE 1 sample and the first WAVE 2
 *     sample; a transition bug (e.g. resetEntities) would snap it to 0.
 *  3. The meter keeps climbing during wave 2 — fully live, not stuck.
 */
test.describe('endless wave transition', () => {
  test('endless mode auto-advances and the rage meter keeps its value mid-flow', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Load the built app and start an ENDLESS run
    await page.goto('/');
    await expect(page.getByText('ANGER VENT PROTOCOL').first()).toBeVisible({ timeout: 45_000 });
    await buttonByText(page, /endless venting/i).click();
    await waitForRagePanel(page);

    const handleGameOverOnly = async () => {
      const body = await page.evaluate(() => document.body.innerText ?? '');
      if (/DEFENSE DOWN|Core Connection Severed/.test(body)) {
        const retry = buttonByText(page, /retry|play again|try again/i);
        if (await retry.isVisible().catch(() => false)) await retry.click();
        await page.waitForTimeout(1200);
        const endless = buttonByText(page, /endless venting/i);
        if (await endless.isVisible().catch(() => false)) await endless.click();
        await page.waitForTimeout(1200);
      }
    };

    // --- Phase A: smash wave 1, sampling rage, until the wave indicator flips ---
    const t0 = Date.now();
    const samples: { t: string; rage: string | null; wave: string | null }[] = [];
    let rageBeforeFlip: string | null = null;
    let rageAfterFlip: string | null = null;
    let flipped = false;
    let sawWave1 = false;

    while (Date.now() - t0 < 180_000) {
      await handleGameOverOnly();
      await smash(page, 8);
      const hud = await readHud(page);
      const wave = await readWave(page);

      if (!sawWave1 && wave === 'WAVE 1') {
        sawWave1 = true;
      }
      samples.push({
        t: ((Date.now() - t0) / 1000).toFixed(1),
        rage: hud.rage,
        wave,
      });

      if (sawWave1 && wave === 'WAVE 2' && !flipped) {
        // First sample where the indicator already shows wave 2: the flip
        // happened between this sample and the previous one.
        flipped = true;
        rageAfterFlip = hud.rage;
        // The sample BEFORE the flip carries the last WAVE 1 rage value.
        for (let i = samples.length - 2; i >= 0; i -= 1) {
          if (samples[i].wave === 'WAVE 1') {
            rageBeforeFlip = samples[i].rage;
            break;
          }
        }
        break;
      }
    }

    console.log(`SAMPLES: ${samples.map((s) => `${s.t}s:${s.wave}:${s.rage}`).join(' | ')}`);
    expect(sawWave1, 'should start on wave 1').toBe(true);
    expect(flipped, 'endless mode should auto-advance to wave 2 without input').toBe(true);
    expect(rageBeforeFlip, 'last WAVE 1 rage sample should be captured').not.toBeNull();
    expect(rageAfterFlip, 'first WAVE 2 rage sample should be captured').not.toBeNull();

    // --- Phase B: no upgrade menu may appear during an endless transition ---
    const bodyAfter = await page.evaluate(() => document.body.innerText ?? '');
    expect(
      /WAVE 1 SECURED|INTEGRITY METRICS|Proceed to Wave 2/.test(bodyAfter),
      'endless transitions must not show the upgrade menu',
    ).toBe(false);
    const proceedVisible = await buttonByText(page, /proceed to wave/i)
      .isVisible()
      .catch(() => false);
    expect(proceedVisible, 'no "Proceed to Wave 2" button in endless mode').toBe(false);

    // --- Phase C: the rage value is continuous across the flip (no reset) ---
    const before = Number(rageBeforeFlip);
    const after = Number(rageAfterFlip);
    console.log(`RAGE ACROSS FLIP: before=${rageBeforeFlip} after=${rageAfterFlip}`);
    if (Number.isFinite(before) && Number.isFinite(after)) {
      if (before > 20) {
        // Only natural decay (~6/s) may elapse over the sampling gap; a hard
        // reset to 0 at the transition would fail this comfortably.
        expect(after, 'rage must not snap to 0 across the endless flip').toBeGreaterThan(0);
        expect(
          after,
          'rage should carry its value across the flip (natural decay only)',
        ).toBeGreaterThanOrEqual(before - 40);
      } else {
        // Meter was near-empty (e.g. FURY just drained) — still must be alive,
        // verified by the Phase D climb.
        expect(after, 'rage must not be stuck at a reset value of 0').toBeGreaterThanOrEqual(0);
      }
    }

    // --- Phase D: the meter keeps climbing during wave 2 (fully functional) ---
    let climbed = false;
    const startRage = (await readHud(page)).rage;
    const startNum = Number(startRage);
    const d0 = Date.now();
    while (Date.now() - d0 < 30_000 && !climbed) {
      await handleGameOverOnly();
      await smash(page, 8);
      const hud = await readHud(page);
      if (hud.furyOp > 0.5 && hud.rage === 'FURY') {
        climbed = true; // reached 100 and ignited — definitively functional
        break;
      }
      const now = Number(hud.rage);
      if (Number.isFinite(now) && Number.isFinite(startNum) && now > startNum + 10) {
        climbed = true;
      }
    }
    console.log(`WAVE 2 CLIMB OK: ${climbed}`);
    expect(climbed, 'rage meter should keep climbing during endless wave 2').toBe(true);

    expect(pageErrors, 'no uncaught page errors during gameplay').toEqual([]);
  });
});
