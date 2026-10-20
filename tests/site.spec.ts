import { expect, test } from "@playwright/test";

// Pages that must open in every language
for (const lang of ["az", "ru", "en"]) {
  test(`home opens in ${lang}`, async ({ page }) => {
    const res = await page.goto(`/${lang}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

test("robots.txt hides admin and sitemap.xml is valid", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");
});

test("cart page is noindex", async ({ page }) => {
  await page.goto("/en/cart");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("admin sends a visitor to the login page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
