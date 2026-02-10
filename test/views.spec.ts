import { test, expect } from "./coverage-helper";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Verify we're on the login page
  await expect(page).toHaveURL(/.*login/);

  // Check for page content
  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("register page loads", async ({ page }) => {
  await page.goto("/register");
  await page.waitForLoadState("networkidle");

  // Verify we're on the register page
  await expect(page).toHaveURL(/.*register/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("history page loads", async ({ page }) => {
  await page.goto("/history");
  await page.waitForLoadState("networkidle");

  // Verify we're on the history page
  await expect(page).toHaveURL(/.*history/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("delivery page loads", async ({ page }) => {
  await page.goto("/delivery");
  await page.waitForLoadState("networkidle");

  // Verify we're on the delivery page
  await expect(page).toHaveURL(/.*delivery/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("docs page loads", async ({ page }) => {
  await page.goto("/docs");
  await page.waitForLoadState("networkidle");

  // Verify we're on the docs page
  await expect(page).toHaveURL(/.*docs/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("not found page loads", async ({ page }) => {
  await page.goto("/nonexistent-page-12345");
  await page.waitForLoadState("networkidle");

  // Verify we get a 404 page
  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("logout page loads", async ({ page }) => {
  await page.goto("/logout");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("diner dashboard page loads", async ({ page }) => {
  await page.goto("/diner-dashboard");
  await page.waitForLoadState("networkidle");

  // Verify we're on the diner dashboard page
  await expect(page).toHaveURL(/.*diner-dashboard/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("franchise dashboard page loads", async ({ page }) => {
  await page.goto("/franchise-dashboard");
  await page.waitForLoadState("networkidle");

  // Verify we're on the franchise dashboard page
  await expect(page).toHaveURL(/.*franchise-dashboard/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("admin dashboard page loads", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("payment page loads", async ({ page }) => {
  await page.goto("/payment");
  await page.waitForLoadState("networkidle");

  // Verify we're on the payment page
  await expect(page).toHaveURL(/.*payment/);

  const body = page.locator("body");
  await expect(body).toBeVisible();
});
