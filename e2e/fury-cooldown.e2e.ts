import { test, expect, type Locator, type Page } from '@playwright/test';

/** Buttons are matched on their visible text: several expose a different aria-label (e.g. "Start Game"). */
const buttonByText = (page: Page, re: RegExp): Locator =>
  page.locator('button').filter({ hasText: re }).first();

/**
 * E2E: FURY cooldown cadence on the built app.
 *
 * Mirrors the manual headless playtest that caught the "FURY every 1.5s"
 * balance problem. Asserts the once-per-wave contract:
 *  1. The rage meter fills over ~12s (per-second gain cap), not instantly.
 *  2. FURY MODE ignites at 100 (badge visible, rage text flips to FURY).
 *  3. After FURY drains, the badge switches to a RECHARGING countdown.
 *  4. Smashing hard during the cooldown does NOT re-ignite FURY early.
 *  5. FURY auto-ignites again once the cooldown clears with a full meter.
 */

interface Hud {
  rage: string | null;
  furyOp: number;
  rechText: string | null;
  rechOp: number;
}

/** Reads the RAGE meter value + FURY/RECHARGING badge state from the HUD DOM. */
const readHud = (page: Page): Promise<Hud> =>
  page.evaluate<Hud>(() => {
    const panel = [...document.querySelectorAll('.glass-panel')].find((el) =>
      (el.textContent ?? '').includes('Rage'),
    );
    const valueEl = panel?.querySelector('span.font-mono');
    const exact = (re: RegExp): HTMLElement | null =>
      ([...document.querySelectorAll('div,span')] as HTMLElement[]).find((el) =>
        (el.textContent ?? '').trim().match(re),
      ) ?? null;
    const badge = exact(/^FURY MODE ACTIVE$/);
    const rech = exact(/^RECHARGING [0-9]+S$/);
    return {
      rage: valueEl ? valueEl.textContent : null,
      furyOp: badge ? parseFloat(getComputedStyle(badge).opacity) : -1,
      rechText: rech ? (rech.textContent?.trim() ?? null) : null,
      rechOp: rech ? parseFloat(getComputedStyle(rech).opacity) : -1,
    };
  });

/** Rapid core-biased clicking — bugs converge on the screen center (the core). */
async function smash(page: Page, clicks: number): Promise<void> {
  for (let i = 0; i < clicks; i += 1) {
    const coreBiased = Math.random() < 0.7;
    const x = coreBiased ? 640 + (Math.random() * 2 - 1) * 280 : 140 + Math.random() * 1000;
    const y = coreBiased ? 400 + (Math.random() * 2 - 1) * 220 : 240 + Math.random() * 480;
    await page.mouse.click(x, y);
    await page.waitForTimeout(38);
  }
}

/** Dismiss wave-complete menus (engine pause) and restart after game over. */
async function dismissOverlays(page: Page): Promise<void> {
  const body = await page.evaluate(() => document.body.innerText ?? '');
  if (/DEFENSE DOWN|Core Connection Severed/.test(body)) {
    const retry = buttonByText(page, /retry|play again|try again/i);
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await page.waitForTimeout(1200);
    const start = buttonByText(page, /begin stress vent/i);
    if (await start.isVisible().catch(() => false)) await start.click();
    await page.waitForTimeout(1200);
    return;
  }
  if (/WAVE \d+ SECURED|INTEGRITY METRICS|PROCEED TO NEXT SECTOR/.test(body)) {
    const next = buttonByText(page, /next wave|proceed|continue|deploy|next sector/i);
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(700);
    }
  }
}

test.describe('FURY cooldown cadence', () => {
  test('rage fills over ~12s, FURY ignites, RECHARGING counts down, no early re-ignition', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Load the built app and start a run
    await page.goto('/');
    await expect(page.getByText('ANGER VENT PROTOCOL').first()).toBeVisible({ timeout: 45_000 });
    await buttonByText(page, /begin stress vent/i).click();
    await page.waitForFunction(
      () => {
        const p = [...document.querySelectorAll('.glass-panel')].find((el) =>
          (el.textContent ?? '').includes('Rage'),
        );
        return p !== undefined && p.querySelector('span.font-mono') !== null;
      },
      undefined,
      { timeout: 30_000 },
    );

    // --- Phase A: sustained smashing must fill the meter over ~12s (gain cap) ---
    const t0 = Date.now();
    const climb: string[] = [];
    let lastRage: string | null = null;
    let sawFury = false;
    let fillSeconds = 0;

    while (Date.now() - t0 < 60_000 && !sawFury) {
      await dismissOverlays(page);
      await smash(page, 8);
      const hud = await readHud(page);
      const t = ((Date.now() - t0) / 1000).toFixed(1);
      if (hud.rage !== lastRage) {
        climb.push(`t=${t}s rage=${hud.rage}`);
        lastRage = hud.rage;
      }
      if (hud.furyOp > 0.5 && hud.rage === 'FURY') {
        await page.waitForTimeout(400);
        const again = await readHud(page);
        if (again.furyOp > 0.5) {
          sawFury = true;
          fillSeconds = (Date.now() - t0) / 1000;
        }
      }
    }

    console.log(`RAGE CLIMB:\n${climb.join('\n')}`);
    expect(sawFury, 'FURY MODE should ignite from sustained smashing').toBe(true);
    // Gain cap: fill must take a meaningful chunk of the cooldown window…
    expect(fillSeconds, 'gain cap should prevent insta-fill').toBeGreaterThan(6);
    // …but not so long the test crawls (budget refills at 15/s; decay 6/s → ~12s).
    expect(fillSeconds, 'meter should fill in reasonable time').toBeLessThan(25);

    // --- Phase B: after FURY drains (~4s), the badge flips to RECHARGING ---
    let rechSeen = false;
    let rechText: string | null = null;
    const b0 = Date.now();
    while (Date.now() - b0 < 25_000 && !rechSeen) {
      await dismissOverlays(page);
      await page.waitForTimeout(300);
      const hud = await readHud(page);
      if (hud.rechText && hud.rechOp > 0.5) {
        rechSeen = true;
        rechText = hud.rechText;
      }
    }
    expect(rechSeen, 'RECHARGING badge should appear after FURY drains').toBe(true);
    expect(rechText).toMatch(/^RECHARGING [0-9]+S$/);

    // --- Phase C: smashing during the cooldown must NOT re-ignite FURY ---
    let premature = false;
    const c0 = Date.now();
    const cdSamples: string[] = [];
    while (Date.now() - c0 < 7000) {
      await dismissOverlays(page);
      await smash(page, 8);
      const hud = await readHud(page);
      cdSamples.push(`${((Date.now() - t0) / 1000).toFixed(1)}:${hud.rechText || hud.rage || ''}`);
      if (hud.furyOp > 0.5 && hud.rage === 'FURY') {
        premature = true;
        break;
      }
    }
    console.log(`COOLDOWN SAMPLES: ${cdSamples.join(' | ')}`);
    expect(premature, 'FURY must not re-ignite during the cooldown window').toBe(false);

    // --- Phase D: once the cooldown clears with a full meter, FURY auto-ignites ---
    let secondFury = false;
    let secondSeconds = 0;
    const d0 = Date.now();
    while (Date.now() - d0 < 45_000 && !secondFury) {
      await dismissOverlays(page);
      await smash(page, 8);
      const hud = await readHud(page);
      if (hud.furyOp > 0.5 && hud.rage === 'FURY') {
        await page.waitForTimeout(400);
        const again = await readHud(page);
        if (again.furyOp > 0.5) {
          secondFury = true;
          secondSeconds = (Date.now() - t0) / 1000;
        }
      }
    }
    console.log(`second FURY at t=${secondSeconds.toFixed(1)}s`);
    expect(secondFury, 'FURY should auto-ignite when the cooldown clears with a full meter').toBe(
      true,
    );

    expect(pageErrors, 'no uncaught page errors during gameplay').toEqual([]);
  });
});
