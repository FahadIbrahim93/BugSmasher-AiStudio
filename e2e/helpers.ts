import type { Locator, Page } from '@playwright/test';

/** Buttons are matched on their visible text: several expose a different aria-label (e.g. "Start Game"). */
export const buttonByText = (page: Page, re: RegExp): Locator =>
  page.locator('button').filter({ hasText: re }).first();

export interface Hud {
  rage: string | null;
  furyOp: number;
  rechText: string | null;
  rechOp: number;
}

/** Reads the RAGE meter value + FURY/RECHARGING badge state from the HUD DOM. */
export const readHud = (page: Page): Promise<Hud> =>
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

/** Reads the HUD's WAVE n indicator (e.g. "WAVE 2"). */
export const readWave = (page: Page): Promise<string | null> =>
  page.evaluate(() => {
    const panel = [...document.querySelectorAll('.glass-panel')].find((el) =>
      /WAVE\s*\d+/.test(el.textContent ?? ''),
    );
    const valueEl = panel?.querySelector('span.font-mono');
    return valueEl ? (valueEl.textContent ?? '').trim() : null;
  });

/** Waits until the RAGE meter panel is mounted and has a live value span. */
export const waitForRagePanel = async (page: Page): Promise<void> => {
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
};

/** Rapid core-biased clicking — bugs converge on the screen center (the core). */
export async function smash(page: Page, clicks: number): Promise<void> {
  for (let i = 0; i < clicks; i += 1) {
    const coreBiased = Math.random() < 0.7;
    const x = coreBiased ? 640 + (Math.random() * 2 - 1) * 280 : 140 + Math.random() * 1000;
    const y = coreBiased ? 400 + (Math.random() * 2 - 1) * 220 : 240 + Math.random() * 480;
    await page.mouse.click(x, y);
    await page.waitForTimeout(38);
  }
}

/** Dismiss wave-complete menus (engine pause) and restart after game over. */
export async function dismissOverlays(page: Page): Promise<void> {
  // A stray smash() click can hit the "Technical Progression Hub" button (it sits
  // adjacent to Proceed in the menu footer), opening the hub overlay on top of the
  // menu. Close it first so the menu's buttons stay clickable — this flake hit both
  // wave-transition and fury-cooldown CI runs (random full-screen clicks + z-[60]).
  const hubHeader = page.getByText(/Authorized Access Only/).first();
  if (await hubHeader.isVisible().catch(() => false)) {
    await hubHeader.locator('xpath=ancestor::div[2]//button').first().click();
    await hubHeader.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  }

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
