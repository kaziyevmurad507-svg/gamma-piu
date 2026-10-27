import { expect, test, type Page } from "@playwright/test";
import az from "../messages/az.json";
import en from "../messages/en.json";
import ru from "../messages/ru.json";

const translations = { az, en, ru };
const open = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

for (const locale of ["az", "ru", "en"] as const) {
  for (const width of [320, 390]) {
    test(`${locale} public pages fit a ${width}px viewport`, async ({ page }, testInfo) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["", "/catalog", "/cart", "/compare", "/favorites"]) {
        await open(page, `/${locale}${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const size = await page.evaluate(() => ({
          available: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        if (size.content > size.available) {
          const overflowing = await page.locator("body *").evaluateAll((elements) => elements
            .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth)
            .map((element) => ({ tag: element.tagName, className: element.className, text: element.textContent?.slice(0, 90), right: element.getBoundingClientRect().right })));
          await testInfo.attach("overflow-elements", { body: JSON.stringify(overflowing, null, 2), contentType: "application/json" });
          console.log("Overflowing elements:", JSON.stringify(overflowing));
          await page.screenshot({ path: testInfo.outputPath("overflow.png"), fullPage: true, animations: "disabled" });
        }
        expect(size.content, `${locale}${path} at ${width}px`).toBeLessThanOrEqual(size.available);
        if (locale === "en" && width === 320 && (path === "" || path === "/catalog")) {
          await page.screenshot({ path: testInfo.outputPath(`${path ? "catalog" : "home"}-320.png`) });
        }
      }
    });
  }

  test(`${locale} mobile filters trap focus, close and restore focus`, async ({ page }) => {
    const messages = translations[locale];
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, `/${locale}/catalog`);
    const trigger = page.getByRole("button", { name: messages.Catalog.filters, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: messages.Catalog.filters, exact: true });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: messages.Nav.close, exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button").last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await expect(page.locator("header")).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator("header")).not.toHaveAttribute("inert");
    await trigger.click();
    await page.getByRole("dialog").getByRole("button").last().click();
    await expect(trigger).toBeFocused();
  });
}

test("product zoom has a name, contained focus and usable close button", async ({ page }) => {
  await open(page, "/en/catalog");
  const card = page.locator("article:has(img)").first();
  const expectedName = await card.getByRole("link").first().innerText();
  await card.getByRole("link").first().click();
  await page.waitForURL(/\/en\/product\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(expectedName);
  const name = await page.getByRole("heading", { level: 1 }).innerText();
  const trigger = page.getByRole("button", { name: en.Product.zoom, exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const close = dialog.getByRole("button", { name: en.Product.closeZoom, exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("catalog controls follow header navigation and browser history", async ({ page }) => {
  await open(page, "/en/catalog?q=fixture&cat=dryers&min=1&sort=price-desc");
  const search = page.getByRole("searchbox");
  const category = page.locator('input[name="cat"][value="dryers"]');
  const minimum = page.locator('input[name="min"]');
  const sort = page.getByRole("button", { name: en.Catalog.sortBy, exact: true });
  await expect(search).toHaveValue("fixture");
  await expect(category).toBeChecked();
  await expect(minimum).toHaveValue("1");
  await expect(sort).toContainText(en.Catalog.sort["price-desc"]);
  await page.locator("header nav").getByRole("link", { name: en.Nav.catalog, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/catalog$/);
  await expect(search).toHaveValue("");
  await expect(category).not.toBeChecked();
  await expect(minimum).toHaveValue("");
  await expect(sort).toContainText(en.Catalog.sort.recommended);
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(search).toHaveValue("fixture");
  await expect(category).toBeChecked();
  await expect(minimum).toHaveValue("1");
  await expect(sort).toContainText(en.Catalog.sort["price-desc"]);
});

test("applying a mobile filter preserves its dialog and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/en/catalog");
  await page.getByRole("button", { name: en.Catalog.filters, exact: true }).click();
  const dialog = page.getByRole("dialog");
  const category = dialog.locator('input[name="cat"][value="dryers"]');
  await category.check();
  await expect(page).toHaveURL(/cat=dryers/);
  await expect(dialog).toBeVisible();
  await expect(category).toBeChecked();
  await expect(category).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("saved dark theme hydrates without script or mismatch errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|script|match/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => localStorage.setItem("gp-theme", "dark"));
  await open(page, "/en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: en.Nav.theme }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("populated cart and three-product comparison stay inside mobile pages", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await open(page, "/en/catalog?cat=dryers");
  const products = page.locator("article");
  await expect(products.nth(2)).toBeVisible();
  for (let index = 0; index < 3; index++) await products.nth(index).getByRole("button", { name: en.Product.compare, exact: true }).click();
  await products.first().getByRole("button", { name: en.Product.addToCart, exact: true }).click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const locale of ["az", "ru", "en"] as const) {
      for (const path of ["cart", "compare"]) {
        await open(page, `/${locale}/${path}`);
        if (path === "cart") await expect(page.locator("article")).toHaveCount(1);
        else await expect(page.getByRole("region", { name: translations[locale].Compare.matrixTitle })).toBeVisible();
        const size = await page.evaluate(() => ({ available: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
        expect(size.content, `populated ${locale}/${path} at ${width}px`).toBeLessThanOrEqual(size.available);
        if (locale === "en" && width === 320) await page.screenshot({ path: testInfo.outputPath(`${path}-320.png`), fullPage: true, animations: "disabled" });
      }
    }
  }
});

test("small text and filled action tokens meet 4.5:1 contrast", async ({ page }) => {
  await open(page, "/en");
  const ratios = await page.evaluate(() => {
    const luminance = (hex: string) => {
      const rgb = hex.trim().replace("#", "").match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255)
        .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return rgb.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    };
    const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    const results: number[] = [];
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      const style = getComputedStyle(document.documentElement);
      const color = (token: string) => style.getPropertyValue(`--color-${token}`);
      results.push(contrast(color("muted"), color("media")));
      results.push(contrast(color("action"), color("action-soft")));
      for (const token of ["action-fill", "action-fill-hover", "action-fill-pressed", "ok-fill", "danger-fill"]) results.push(contrast("#ffffff", color(token)));
    }
    return results;
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
});
