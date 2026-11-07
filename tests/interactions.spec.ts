import { expect, test } from '@playwright/test';
import en from '../messages/en.json';

for (const width of [390, 1280]) {
  test(`reset stays centered and reachable after scrolling at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/en/catalog?sort=price-asc', { waitUntil: 'networkidle' });
    const reset = page.getByRole('button', { name: en.Catalog.reset, exact: true });
    await expect(reset).toBeVisible();
    await page.mouse.wheel(0, 950);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await expect.poll(async () => {
      const box = await reset.boundingBox();
      return box ? Math.abs(box.x + box.width / 2 - width / 2) : Infinity;
    }).toBeLessThan(2);
    const box = (await reset.boundingBox())!;
    expect(box.y).toBeGreaterThan(600);
    expect(box.y + box.height).toBeLessThan(844);
    expect(await reset.evaluate(e => {
      const r = e.getBoundingClientRect();
      return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })).toBe(true);
    if (width === 1280) {
      const panel = page.locator('aside');
      await expect.poll(async () => Math.abs((await panel.boundingBox())!.y - 24)).toBeLessThan(2);
      expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(796);
    }
    await page.screenshot({ path: testInfo.outputPath(`floating-reset-${width}.png`) });
    await reset.click();
    await expect(page).toHaveURL(/\/en\/catalog$/);
    await expect(reset).toHaveCount(0);
  });
}

test('removing and undoing a cart item keeps the other items mounted without refetching', async ({ page }) => {
  await page.goto('/en/catalog', { waitUntil: 'networkidle' });
  const cards = page.locator('article');
  await cards.nth(0).getByRole('button', { name: en.Product.addToCart, exact: true }).click();
  await cards.nth(1).getByRole('button', { name: en.Product.addToCart, exact: true }).click();
  await page.getByRole('link', { name: 'Cart (2)', exact: true }).click();
  const lines = page.locator('article');
  await expect(lines).toHaveCount(2);
  const remainingLine = await lines.nth(1).elementHandle();
  const summary = page.locator('aside');
  const originalSummary = await summary.elementHandle();
  const originalTotal = await summary.locator('dd').last().innerText();
  const mutations: string[] = [];
  page.on('request', request => {
    if (request.method() === 'POST' || request.isNavigationRequest()) mutations.push(request.url());
  });
  // A deletion must work even while the server is unreachable.
  await page.route('**/en/cart', route => route.request().method() === 'POST' ? route.abort() : route.continue());
  await lines.first().getByRole('button', { name: en.Cart.remove, exact: true }).click();
  await expect(lines).toHaveCount(1);
  expect(await remainingLine!.evaluate(e => e.isConnected)).toBe(true);
  expect(await originalSummary!.evaluate(e => e.isConnected)).toBe(true);
  await expect(summary.locator('dd').last()).not.toHaveText(originalTotal);
  await page.getByRole('button', { name: en.Cart.undo, exact: true }).click();
  await expect(lines).toHaveCount(2);
  await expect(summary.locator('dd').last()).toHaveText(originalTotal);
  expect(await remainingLine!.evaluate(e => e.isConnected)).toBe(true);
  expect(mutations).toEqual([]);
});
