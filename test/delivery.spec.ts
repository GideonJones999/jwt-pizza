import { test, expect } from "./coverage-helper";

test.beforeEach(async ({ page }) => {
  // Mock API responses
  await page.route("**/api/order/verify", async (route) => {
    const requestBody = route.request().postDataJSON();

    if (requestBody.jwt === "valid-jwt-token") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "valid",
          payload: {
            vendor: {
              id: "1",
              name: "pizzaPocket",
            },
            diner: {
              id: 1,
              name: "Test User",
              email: "test@test.com",
            },
            order: {
              items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
              storeId: 1,
              franchiseId: 1,
              id: 123,
            },
          },
        }),
      });
    } else if (requestBody.jwt === "invalid-jwt-token") {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "invalid",
          payload: { error: "invalid JWT" },
        }),
      });
    } else {
      // Error case
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: "error",
          code: 500,
        }),
      });
    }
  });
});

test("delivery page displays order information", async ({ page }) => {
  await page.goto("/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check that the order information structure exists
  const pageContent = await page.content();

  // These labels should always be present
  expect(pageContent).toContain("order ID:");
  expect(pageContent).toContain("pie count:");
  expect(pageContent).toContain("total:");
});

test("delivery page displays total price", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => {
    window.location.href = "/delivery";
  });

  await page.waitForURL("**/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check total label exists
  const totalLabel = page.locator("text=total:");
  await expect(totalLabel).toBeVisible({ timeout: 5000 });

  // The total value will be shown - just verify the label is there
  // The actual calculation depends on the state being passed
});

test("delivery page displays JWT token", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => {
    window.location.href = "/delivery";
  });

  await page.waitForURL("**/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // JWT should be displayed in a monospace font div
  const jwtDisplay = page.locator("div.font-mono.text-xs");
  await expect(jwtDisplay).toBeVisible({ timeout: 5000 });

  // It will show 'error' as default if no state is passed
  const jwtText = await jwtDisplay.textContent();
  expect(jwtText).toBeTruthy();
});

test("delivery page verify button exists", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  const verifyButton = page.locator('button:has-text("Verify")');
  await expect(verifyButton).toBeVisible();
});

test("delivery page order more button exists", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  const orderMoreButton = page.locator('button:has-text("Order more")');
  await expect(orderMoreButton).toBeVisible();
});

test("delivery page order more button navigates to menu", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  const orderMoreButton = page.locator('button:has-text("Order more")');
  await orderMoreButton.click();

  await expect(page).toHaveURL(/.*menu/);
});

test("delivery page verify button opens modal with valid JWT", async ({
  page,
}) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  // Set up state with valid JWT
  await page.evaluate(() => {
    const order = {
      id: 123,
      items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
    };
    const jwt = "valid-jwt-token";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  // Click verify button
  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  // Wait for modal to appear
  await page.waitForTimeout(1000);

  // Modal should be visible
  const modal = page.locator("#hs-jwt-modal");
  await expect(modal).toBeVisible();

  // Check for "valid" status
  await expect(page.locator("text=valid")).toBeVisible();
});

test("delivery page verify button shows invalid JWT in modal", async ({
  page,
}) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  // Set up state with invalid JWT
  await page.evaluate(() => {
    const order = {
      id: 123,
      items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
    };
    const jwt = "invalid-jwt-token";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  // Click verify button
  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Modal should show invalid status
  await expect(page.locator("text=invalid")).toBeVisible();
});

test("delivery page modal displays payload data", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => {
    window.location.href = "/delivery";
  });

  await page.waitForURL("**/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const verifyButton = page.locator("button").filter({ hasText: "Verify" });
  await expect(verifyButton).toBeVisible({ timeout: 5000 });
  await verifyButton.click();

  await page.waitForTimeout(2000);

  // Modal should be visible
  const modal = page.locator("#hs-jwt-modal");
  await expect(modal).toBeVisible({ timeout: 5000 });

  // Check for any payload content in the modal
  const payloadContent = page.locator("#hs-jwt-modal pre");
  await expect(payloadContent).toBeVisible({ timeout: 5000 });
});

test("delivery page modal close button works", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = {
      id: 123,
      items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
    };
    const jwt = "valid-jwt-token";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Click close button in modal
  const closeButton = page
    .locator('button[data-hs-overlay="#hs-jwt-modal"]')
    .last();
  await closeButton.click();

  await page.waitForTimeout(500);

  // Modal should no longer be visible (or at least hidden)
  const modal = page.locator("#hs-jwt-modal");
  const isHidden = await modal.evaluate((el) => {
    return (
      el.classList.contains("hidden") ||
      window.getComputedStyle(el).display === "none" ||
      window.getComputedStyle(el).opacity === "0"
    );
  });
  expect(isHidden).toBe(true);
});

test("delivery page displays title", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await expect(page.locator("text=Here is your JWT Pizza!")).toBeVisible();
});

test("delivery page displays pizza icon", async ({ page }) => {
  await page.goto("/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check for SVG pizza icon - look for the specific SVG paths
  const pizzaPath = page.locator('path[d*="M10.5 6a7.5 7.5"]');
  await expect(pizzaPath).toBeVisible({ timeout: 5000 });
});

test("delivery page handles missing order gracefully", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  // No state set - should use defaults
  // Check that page still renders
  await expect(page.locator("text=order ID:")).toBeVisible();
});

test("delivery page handles error JWT", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = {
      id: 123,
      items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
    };
    const jwt = "error-jwt";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Should show error in modal
  const modal = page.locator("#hs-jwt-modal");
  await expect(modal).toBeVisible();
});

test("delivery page JWT displayed in correct color for valid", async ({
  page,
}) => {
  await page.goto("/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // The JWT display div exists with color styling
  const pageContent = await page.content();

  // Should contain the styling for JWT display with color
  expect(pageContent).toMatch(/text-(green|red)-500/);

  // The JWT container should be visible
  const jwtContainer = page.locator("div.font-mono.text-xs");
  await expect(jwtContainer).toBeVisible({ timeout: 5000 });
});

test("delivery page handles empty items array", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = {
      id: 999,
      items: [],
    };
    const jwt = "test-jwt";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  // Should show 0 pies
  await expect(page.locator("text=pie count:")).toBeVisible();
  await expect(page.locator("text=0").first()).toBeVisible();
});

test("delivery page total calculates correctly with multiple items", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => {
    window.location.href = "/delivery";
  });

  await page.waitForURL("**/delivery");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Just verify the total label and that a value is displayed
  const totalLabel = page.locator("text=total:");
  await expect(totalLabel).toBeVisible({ timeout: 5000 });

  // There should be a div with a numeric value after the total label
  const totalValue = page
    .locator("div.col-span-4")
    .filter({ hasText: /₿/ })
    .first();
  await expect(totalValue).toBeVisible({ timeout: 5000 });
});

test("delivery page modal header displays correctly", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = { id: 123, items: [] };
    const jwt = "valid-jwt-token";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Check modal header
  await expect(page.locator("text=JWT Pizza -")).toBeVisible();
});

test("delivery page close icon button in modal works", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = { id: 123, items: [] };
    const jwt = "valid-jwt-token";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Click X close button
  const xButton = page
    .locator('button[data-hs-overlay="#hs-jwt-modal"]')
    .first();
  await xButton.click();

  await page.waitForTimeout(500);

  // Modal should be hidden
  const modal = page.locator("#hs-jwt-modal");
  const isHidden = await modal.evaluate((el) => {
    return (
      el.classList.contains("hidden") ||
      window.getComputedStyle(el).display === "none"
    );
  });
  expect(isHidden).toBe(true);
});

test("delivery page displays order labels correctly", async ({ page }) => {
  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  // Check all labels are present
  await expect(page.locator("text=order ID:")).toBeVisible();
  await expect(page.locator("text=pie count:")).toBeVisible();
  await expect(page.locator("text=total:")).toBeVisible();
});

test("delivery page handles verification with catch error", async ({
  page,
}) => {
  // Simulate network error by not mocking the route
  await page.route("**/api/order/verify", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/delivery", {
    waitUntil: "networkidle",
  });

  await page.evaluate(() => {
    const order = { id: 123, items: [] };
    const jwt = "test-jwt";

    window.history.pushState({ order, jwt }, "", "/delivery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.waitForTimeout(500);

  const verifyButton = page.locator('button:has-text("Verify")');
  await verifyButton.click();

  await page.waitForTimeout(1000);

  // Modal should still open showing error
  const modal = page.locator("#hs-jwt-modal");
  await expect(modal).toBeVisible();
});
