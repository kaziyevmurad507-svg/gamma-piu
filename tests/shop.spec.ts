import { expect, test, type Page } from "@playwright/test";
import en from "../messages/en.json"; // button names come from the real texts, not typed by hand

// networkidle = wait until the page is hydrated, so the first click is not lost
const open = (page: Page, path: string) => page.goto(path, { waitUntil: "networkidle" });
const firstCard = (page: Page) => page.locator("article").first();

test("catalog search with no match shows the empty message", async ({ page }) => {
  await open(page, "/en/catalog?q=zzzzzzzz");
  await expect(page.getByText(en.Catalog.empty)).toBeVisible();
});

test("add to cart, then the cart has the product and a WhatsApp link", async ({ page }) => {
  await open(page, "/en/catalog");
  const name = await firstCard(page).getByRole("link").first().innerText();
  await firstCard(page).getByRole("button", { name: en.Product.addToCart }).click();
  await expect(page.getByRole("link", { name: "Cart (1)" })).toBeVisible(); // header counter

  await page.getByRole("link", { name: "Cart (1)" }).click();
  await expect(page.getByRole("heading", { name: en.Cart.title })).toBeVisible();
  await expect(page.getByRole("link", { name }).first()).toBeVisible();

  const href = (await page.getByRole("link", { name: en.Cart.order }).getAttribute("href")) ?? "";
  expect(href).toContain("https://wa.me/");
  expect(decodeURIComponent(href)).toContain(name); // order text has the product name
});

test("cart line can be removed", async ({ page }) => {
  await open(page, "/en/catalog");
  await firstCard(page).getByRole("button", { name: en.Product.addToCart }).click();
  await page.getByRole("link", { name: "Cart (1)" }).click();
  await page.getByRole("button", { name: en.Cart.remove }).click();
  await expect(page.getByText(en.Cart.emptyTitle)).toBeVisible();
});

test("favorite shows on the favorites page", async ({ page }) => {
  await open(page, "/en/catalog");
  const name = await firstCard(page).getByRole("link").first().innerText();
  await firstCard(page).getByRole("button", { name: en.Product.addFavorite }).click();
  await expect(page.getByRole("link", { name: "Favorites (1)" })).toBeVisible();

  await page.getByRole("link", { name: "Favorites (1)" }).click();
  await expect(page.getByRole("link", { name }).first()).toBeVisible();
});

test("compare counter goes up", async ({ page }) => {
  await open(page, "/en/catalog");
  await firstCard(page).getByRole("button", { name: en.Product.compare }).click();
  await expect(page.getByRole("link", { name: "Compare (1)" })).toBeVisible();
});

test("product page opens from the catalog", async ({ page }) => {
  await open(page, "/en/catalog");
  const name = await firstCard(page).getByRole("link").first().innerText();
  await firstCard(page).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/en\/product\//);
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
});

test("dark theme is saved and survives a reload", async ({ page }) => {
  await open(page, "/en");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: en.Nav.theme }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
