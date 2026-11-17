import { expect, test } from '@playwright/test';
import en from '../messages/en.json';
import ru from '../messages/ru.json';

test('catalog cannot lose the first mobile tap while JavaScript is loading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route('**/_next/static/chunks/*.js', async route => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto('/ru/catalog', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: ru.Catalog.filters, exact: true });
    await expect(trigger).toBeDisabled();
    releaseScripts();
    await trigger.click();
    await expect(page.getByRole('dialog', { name: ru.Catalog.filters, exact: true })).toBeVisible();
  } finally {
    releaseScripts();
  }
});

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

test('cards contain long names and keep price and purchase action compact on narrow screens', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/catalog', { waitUntil: 'networkidle' });
  await page.screenshot({ path: testInfo.outputPath('mobile-catalog.png'), fullPage: true, animations: 'disabled' });
  const cards = page.locator('article');
  // Stress only the rendered test DOM; never modify catalog records.
  await cards.first().locator('a[title]').evaluate(e => { e.textContent = 'Professional '.repeat(30) + 'LongUnbrokenModelName'.repeat(6); });
  const geometry = await cards.evaluateAll(elements => elements.slice(0, 2).map(e => {
    const title = e.querySelector('a[title]')!;
    const button = [...e.querySelectorAll('button')].at(-1)!;
    const cardRect = e.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const priceRow = button.previousElementSibling!.getBoundingClientRect();
    return {
      titleHeight: title.getBoundingClientRect().height,
      priceToButton: buttonRect.top - priceRow.bottom,
      trailingSpace: cardRect.bottom - buttonRect.bottom,
      left: buttonRect.left - cardRect.left,
      right: cardRect.right - buttonRect.right,
    };
  }));
  expect(geometry[0].titleHeight).toBeLessThanOrEqual(61);
  // Cards intentionally follow their content height. Check each purchase area,
  // rather than requiring empty space below a shorter neighboring title.
  expect(geometry).toHaveLength(2);
  for (const card of geometry) {
    expect(card.priceToButton).toBeGreaterThanOrEqual(0);
    expect(card.priceToButton).toBeLessThanOrEqual(9);
    expect(Math.abs(card.trailingSpace)).toBeLessThanOrEqual(1);
    expect(card.left).toBeGreaterThanOrEqual(0);
    expect(card.right).toBeGreaterThanOrEqual(0);
    expect(card.left + card.right).toBeLessThanOrEqual(9);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('shared links use the brand artwork and icons are served successfully', async ({ page, request }) => {
  await page.goto('/en');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/share-card.png$/);
  for (const path of ['/favicon.ico', '/icon.svg', '/apple-icon.png', '/images/share-card.png']) {
    expect((await request.get(path)).ok(), path).toBeTruthy();
  }
});
