import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

for (const entry of [
  { path: "cart", button: en.Product.addToCart, empty: en.Cart.emptyTitle },
  { path: "favorites", button: en.Product.addFavorite, empty: en.Favorites.emptyTitle },
  { path: "compare", button: en.Product.compare, empty: en.Compare.emptyTitle },
]) {
  test(`${entry.path} shows an explicit load failure and can retry without losing saved items`, async ({ page }) => {
    await page.goto("/en/catalog", { waitUntil: "networkidle" });
    const card = page.locator("article").first();
    const name = await card.getByRole("link").first().innerText();
    await card.getByRole("button", { name: entry.button, exact: true }).click();
    const route = `**/en/${entry.path}`;
    await page.route(route, (request) => request.request().method() === "POST" ? request.abort("failed") : request.continue());
    await page.goto(`/en/${entry.path}`);
    await expect(page.getByText(en.Common.loadError)).toBeVisible();
    await expect(page.getByText(entry.empty)).not.toBeVisible();
    await page.unroute(route);
    await page.getByRole("button", { name: en.Common.retry }).click();
    await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();
    await expect(page.getByText(en.Common.loadError)).not.toBeVisible();
  });
}
