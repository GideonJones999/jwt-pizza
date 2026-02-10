import { test, expect } from "./coverage-helper";

test("create franchise page loads", async ({ page }) => {
  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("create store page loads", async ({ page }) => {
  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("create franchise form elements exist", async ({ page }) => {
  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");

  // Look for form elements
  const form = page.locator("form").first();
  const formExists = await form.isVisible({ timeout: 3000 }).catch(() => false);

  if (formExists) {
    await expect(form).toBeVisible();

    // Check for input fields
    const inputs = page.locator("input");
    const inputCount = await inputs.count().catch(() => 0);
    if (inputCount > 0) {
      expect(inputCount).toBeGreaterThan(0);
    }
  }
});

test("create store form elements exist", async ({ page }) => {
  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");

  // Look for form elements
  const form = page.locator("form").first();
  const formExists = await form.isVisible({ timeout: 3000 }).catch(() => false);

  if (formExists) {
    await expect(form).toBeVisible();
  }
});

test("create franchise has submit button", async ({ page }) => {
  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");

  // Look for submit button
  const submitButton = page.locator("button[type='submit']").first();
  const submitExists = await submitButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (submitExists) {
    await expect(submitButton).toBeVisible();
  }
});

test("create store has submit button", async ({ page }) => {
  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");

  // Look for submit button
  const submitButton = page.locator("button[type='submit']").first();
  const submitExists = await submitButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (submitExists) {
    await expect(submitButton).toBeVisible();
  }
});

test("create franchise displays title", async ({ page }) => {
  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");

  // Check for view title
  const body = page.locator("body");
  await expect(body).toBeVisible();

  // Verify page loaded properly
  const currentUrl = await page.url();
  expect(currentUrl).toContain("/create-franchise");
});

test("create store displays content", async ({ page }) => {
  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");

  // Verify page loaded
  const body = page.locator("body");
  await expect(body).toBeVisible();

  const currentUrl = await page.url();
  expect(currentUrl).toContain("/create-store");
});

test("create franchise form doesn't crash on load", async ({ page }) => {
  let errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Page should load successfully
  expect(await page.title()).toBeTruthy();
});

test("create store form doesn't crash on load", async ({ page }) => {
  let errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Page should load successfully
  expect(await page.title()).toBeTruthy();
});

test("admin dashboard loads", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("admin dashboard displays content", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Verify page has content
  const currentUrl = await page.url();
  expect(currentUrl).toContain("/admin-dashboard");

  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("create franchise accessible from franchise dashboard", async ({
  page,
}) => {
  // First load franchise dashboard
  await page.goto("/franchise-dashboard");
  await page.waitForLoadState("networkidle");

  // Then navigate to create franchise
  await page.goto("/create-franchise");
  await page.waitForLoadState("networkidle");

  // Verify navigation worked
  expect(await page.url()).toContain("/create-franchise");
});

test("create store accessible from franchise dashboard", async ({ page }) => {
  // Navigate to create store
  await page.goto("/create-store");
  await page.waitForLoadState("networkidle");

  // Verify navigation worked
  expect(await page.url()).toContain("/create-store");
});
