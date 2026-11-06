import { expect, test } from '@playwright/test';
import en from '../messages/en.json';

test('desktop filter panel does not take focus; reset floats and clears every filter', async ({ page }) => {
  await page.goto('/en/catalog?cat=dryers&min=1&color=black', { waitUntil: 'networkidle' });
  const panel = page.locator('aside');
  await expect(panel).not.toHaveAttribute('tabindex');
  await expect(panel.getByRole('button', { name: en.Catalog.reset })).toHaveCount(0);
  const reset = page.getByRole('button', { name: en.Catalog.reset, exact: true });
  await expect(reset).toBeVisible();
  expect(await reset.evaluate(e => getComputedStyle(e).position)).toBe('fixed');
  await reset.click();
  await expect(page).toHaveURL(/\/en\/catalog$/);
  await expect(reset).toHaveCount(0);
  await expect(page.locator('article').first()).toBeVisible();
});

test('mobile reset remains accessible in the filter dialog and after closing it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/catalog', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: en.Catalog.filters, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[name="cat"][value="dryers"]').check();
  await expect(page).toHaveURL(/cat=dryers/);
  const reset = page.getByRole('button', { name: en.Catalog.reset, exact: true });
  await expect(reset).toBeVisible();
  await expect(dialog.getByRole('button', { name: en.Catalog.reset })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(page).toHaveURL(/\/en\/catalog$/);
});

test('cards contain very long names and align purchase buttons on narrow screens', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/catalog', { waitUntil: 'networkidle' });
  await page.screenshot({ path: testInfo.outputPath('mobile-catalog.png'), fullPage: true, animations: 'disabled' });
  const cards = page.locator('article');
  // Stress only the rendered test DOM; never modify catalog records.
  await cards.first().locator('a[title]').evaluate(e => { e.textContent = 'Professional '.repeat(30) + 'LongUnbrokenModelName'.repeat(6); });
  const geometry = await cards.evaluateAll(elements => elements.slice(0, 2).map(e => {
    const title = e.querySelector('a[title]')!;
    const button = [...e.querySelectorAll('button')].at(-1)!;
    return { titleHeight: title.getBoundingClientRect().height, bottom: button.getBoundingClientRect().bottom, right: e.getBoundingClientRect().right };
  }));
  expect(geometry[0].titleHeight).toBeLessThanOrEqual(61);
  expect(Math.abs(geometry[0].bottom - geometry[1].bottom)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('shared links use the brand artwork and icons are served successfully', async ({ page, request }) => {
  await page.goto('/en');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/share-card.png$/);
  for (const path of ['/favicon.ico', '/icon.svg', '/apple-icon.png', '/images/share-card.png']) {
    expect((await request.get(path)).ok(), path).toBeTruthy();
  }
});
