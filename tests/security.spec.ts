import { expect, test } from "@playwright/test";

test("admin responses forbid framing and MIME sniffing", async ({ request }) => {
  const response = await request.get("/admin/login");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test("MFA setup also rejects unauthenticated visitors", async ({ page }) => {
  await page.goto("/admin/mfa");
  await expect(page).toHaveURL(/\/admin\/login/);
});

for (const locale of ["az", "ru", "en"]) {
  test(`ordering information and email available in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/terms`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main a[href="mailto:kaziyevmurad507@gmail.com"]')).toBeVisible();
    const title = await page.getByRole("heading", { level: 1 }).innerText();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: title, exact: true })).toHaveAttribute("href", `/${locale}/terms`);
  });
}
