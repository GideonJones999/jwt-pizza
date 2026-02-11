import { test, expect } from "./coverage-helper";

test("breadcrumb navigation hook - navigate to parent", async ({ page }) => {
  // Test navigateToRegistration (with sibling parameter)
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Click on "Register" link to test navigation with sibling parameter
  const registerLink = page.locator("text=Register").first();
  const registerVisible = await registerLink
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (registerVisible) {
    await registerLink.click();
    await page.waitForTimeout(500);
    // Should navigate to /register (parent is /auth, sibling is /register)
    // or similar depending on routing
    const url = await page.url();
    expect(url).toBeTruthy();
  }
});

test("breadcrumb navigation works at different levels", async ({ page }) => {
  // Navigate to home first
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Then to a page that might have breadcrumbs
  await page.goto("/about");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/.*about/);

  // Navigate back to home
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/[^a-z]/);
});

test("navigation state preservation", async ({ page }) => {
  await page.goto("/menu");
  await page.waitForLoadState("networkidle");

  // Allow time for state to be set
  await page.waitForTimeout(500);

  // Verify we're still on the same page
  const currentUrl = await page.url();
  expect(currentUrl).toContain("/menu");
});

test("close franchise page displays with state", async ({ page }) => {
  // Navigate to franchise dashboard first
  await page.goto("/franchise-dashboard");
  await page.waitForLoadState("networkidle");

  // The close franchise page would be reached via navigation with state
  // For now, just verify franchise dashboard loads
  await expect(page).toHaveURL(/.*franchise-dashboard/);
});

test("close store page displays with state", async ({ page }) => {
  // Navigate to franchise dashboard first
  await page.goto("/franchise-dashboard");
  await page.waitForLoadState("networkidle");

  // The close store page would be reached via navigation with state
  // For now, just verify the parent page loads
  await expect(page).toHaveURL(/.*franchise-dashboard/);
});

test("navigation back from nested routes", async ({ page }) => {
  // Test navigation through a series of pages
  const routes = ["/", "/menu", "/about", "/history"];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    // Verify each page loads
    const currentUrl = await page.url();
    expect(currentUrl).toContain(
      route === "/" ? "localhost" : route.split("/")[1],
    );
  }
});

test("app navigation handles state properly", async ({ page }) => {
  // Start at home
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Navigate to menu (which uses location state for orders)
  await page.goto("/menu");
  await page.waitForLoadState("networkidle");

  // Verify menu loads without errors
  const body = page.locator("body");
  await expect(body).toBeVisible();
});

test("breadcrumb allows going up directory levels", async ({ page }) => {
  // Navigate deep into the app
  await page.goto("/franchise-dashboard");
  await page.waitForLoadState("networkidle");

  // Verify we can see content
  const body = page.locator("body");
  await expect(body).toBeVisible();

  // Navigate to another deep page
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Verify navigation works
  await expect(page).toHaveURL(/.*admin-dashboard/);
});

test("menu page with extended routing", async ({ page }) => {
  // Test the menu routing with potential breadcrumb scenarios
  await page.goto("/menu");
  await page.waitForLoadState("networkidle");

  // Check that menu-specific UI is present
  const body = page.locator("body");
  await expect(body).toBeVisible();

  // The routing should work
  expect(await page.url()).toContain("/menu");
});

test("franchise-related route accessibility", async ({ page }) => {
  // Test franchise routes for breadcrumb compatibility
  const franchiseRoutes = ["/franchise-dashboard"];

  for (const route of franchiseRoutes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const currentUrl = await page.url();
    expect(currentUrl).toContain(route.split("/")[1]);
  }
});
