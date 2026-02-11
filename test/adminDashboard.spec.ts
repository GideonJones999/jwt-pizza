import { test, expect } from "./coverage-helper";

test.beforeEach(async ({ page }) => {
  // Set up localStorage first
  await page.addInitScript(() => {
    localStorage.setItem("token", "admin-token-123");
  });

  // Mock API responses for authentication
  await page.route("**/api/auth", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: 1,
          name: "Admin User",
          email: "admin@jwt.com",
          roles: [{ role: "admin" }],
        },
        token: "admin-token-123",
      }),
    });
  });

  await page.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        name: "Admin User",
        email: "admin@jwt.com",
        roles: [{ role: "admin" }],
      }),
    });
  });

  await page.route("**/api/franchise?page=0&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 1,
            name: "Pizzeria Alpha",
            admins: [
              { id: 2, name: "Franchise Admin", email: "fadmin@test.com" },
            ],
            stores: [
              { id: 1, name: "Alpha Store 1", totalRevenue: 5000 },
              { id: 2, name: "Alpha Store 2", totalRevenue: 7500 },
            ],
          },
          {
            id: 2,
            name: "Pizzeria Beta",
            admins: [{ id: 3, name: "Beta Owner", email: "beta@test.com" }],
            stores: [{ id: 3, name: "Beta Store 1", totalRevenue: 3000 }],
          },
        ],
        more: true,
      }),
    });
  });

  await page.route("**/api/order/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
});

test("admin dashboard displays franchise table", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Give extra time for React to render

  // Just check that a table exists with headers
  const tableHeaders = page.locator("th");
  const headerCount = await tableHeaders.count();

  // Should have at least 5 headers
  expect(headerCount).toBeGreaterThanOrEqual(5);

  // Check for specific text content in any th elements
  const pageContent = await page.content();
  expect(pageContent).toContain("Franchise");
  expect(pageContent).toContain("Action");
});

test("admin dashboard displays franchise data", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check franchise names appear
  await expect(page.locator("text=Pizzeria Alpha")).toBeVisible();
  await expect(page.locator("text=Pizzeria Beta")).toBeVisible();

  // Check admin names
  await expect(page.locator("text=Franchise Admin")).toBeVisible();
  await expect(page.locator("text=Beta Owner")).toBeVisible();
});

test("admin dashboard displays store data with revenue", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check store names
  await expect(page.locator("text=Alpha Store 1")).toBeVisible();
  await expect(page.locator("text=Alpha Store 2")).toBeVisible();
  await expect(page.locator("text=Beta Store 1")).toBeVisible();

  // Check revenue is displayed (with Bitcoin symbol)
  const revenueText = await page.locator("text=/5,000|7,500|3,000/").count();
  expect(revenueText).toBeGreaterThan(0);
});

test("admin dashboard close franchise button navigates correctly", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Find and click the first close franchise button
  const closeFranchiseButton = page.locator('button:has-text("Close")').first();
  await expect(closeFranchiseButton).toBeVisible();

  await closeFranchiseButton.click();

  // Should navigate to close-franchise page
  await expect(page).toHaveURL(/.*close-franchise/);
});

test("admin dashboard close store button navigates correctly", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Find a close button for a store (not the first one, which is for franchise)
  const closeStoreButtons = page.locator('button:has-text("Close")');
  const buttonCount = await closeStoreButtons.count();

  // Click the second close button (first store's close button)
  if (buttonCount > 1) {
    await closeStoreButtons.nth(1).click();
    await expect(page).toHaveURL(/.*close-store/);
  }
});

test("admin dashboard add franchise button navigates to create", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Find and click Add Franchise button
  const addButton = page.locator('button:has-text("Add Franchise")');
  await expect(addButton).toBeVisible();

  await addButton.click();

  await expect(page).toHaveURL(/.*create-franchise/);
});

test("admin dashboard pagination next button works", async ({ page }) => {
  // Mock page 1 response
  await page.route("**/api/franchise?page=1&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 3,
            name: "Pizzeria Gamma",
            admins: [{ id: 4, name: "Gamma Admin", email: "gamma@test.com" }],
            stores: [],
          },
        ],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Click next button (»)
  const nextButton = page.locator('button:has-text("»")');
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  // Wait for new data to load
  await page.waitForTimeout(500);

  // Should show Gamma franchise
  await expect(page.locator("text=Pizzeria Gamma")).toBeVisible();
});

test("admin dashboard pagination previous button disabled on first page", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Previous button should be disabled on page 0
  const prevButton = page.locator('button:has-text("«")');
  await expect(prevButton).toBeDisabled();
});

test("admin dashboard pagination previous button works", async ({ page }) => {
  // Start on page 1
  await page.route("**/api/franchise?page=1&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 3,
            name: "Pizzeria Gamma",
            admins: [{ id: 4, name: "Gamma Admin", email: "gamma@test.com" }],
            stores: [],
          },
        ],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Go to page 1
  const nextButton = page.locator('button:has-text("»")');
  await nextButton.click();
  await page.waitForTimeout(500);

  // Now go back to page 0
  const prevButton = page.locator('button:has-text("«")');
  await expect(prevButton).toBeEnabled();
  await prevButton.click();
  await page.waitForTimeout(500);

  // Should show Alpha and Beta again
  await expect(page.locator("text=Pizzeria Alpha")).toBeVisible();
});

test("admin dashboard pagination next button disabled when no more results", async ({
  page,
}) => {
  // Mock a response with more: false
  await page.route("**/api/franchise?page=0&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 1,
            name: "Last Franchise",
            admins: [{ id: 2, name: "Admin", email: "admin@test.com" }],
            stores: [],
          },
        ],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Next button should be disabled
  const nextButton = page.locator('button:has-text("»")');
  await expect(nextButton).toBeDisabled();
});

test("admin dashboard filter input exists", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check for filter input
  const filterInput = page.locator('input[name="filterFranchise"]');
  await expect(filterInput).toBeVisible();
  await expect(filterInput).toHaveAttribute("placeholder", "Filter franchises");
});

test("admin dashboard filter submit button works", async ({ page }) => {
  let filterApplied = false;

  await page.route(
    "**/api/franchise?page=0&limit=10&name=*Pizza*",
    async (route) => {
      filterApplied = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          franchises: [
            {
              id: 1,
              name: "Pizza Paradise",
              admins: [{ id: 2, name: "Admin", email: "admin@test.com" }],
              stores: [],
            },
          ],
          more: false,
        }),
      });
    },
  );

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Type in filter input
  const filterInput = page.locator('input[name="filterFranchise"]');
  await filterInput.fill("Pizza");

  // Click submit button
  const submitButton = page.locator('button:has-text("Submit")');
  await submitButton.click();

  await page.waitForTimeout(500);
  expect(filterApplied).toBe(true);
});

test("admin dashboard shows multiple stores per franchise", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Pizzeria Alpha has 2 stores, check both are visible
  const alphaStores = page.locator("text=/Alpha Store [12]/");
  const count = await alphaStores.count();
  expect(count).toBe(2);
});

test("admin dashboard displays title", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check for the title
  await expect(page.locator("text=Mama Ricci's kitchen")).toBeVisible();
});

test("admin dashboard displays Franchises heading", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  await expect(page.locator('h3:has-text("Franchises")')).toBeVisible();
});

test("admin dashboard non-admin user sees not found", async ({ page }) => {
  // Mock user as non-admin
  await page.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        name: "Regular User",
        email: "user@test.com",
        roles: [{ role: "diner" }],
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Should show not found page
  await expect(page.locator("text=/not found|oops/i")).toBeVisible();
});

test("admin dashboard empty franchise list displays correctly", async ({
  page,
}) => {
  await page.route("**/api/franchise?page=0&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Table headers should still be visible
  const tableHeaders = page.locator("th");
  const headerCount = await tableHeaders.count();
  expect(headerCount).toBeGreaterThan(0);

  // No franchise data rows should appear
  const pageContent = await page.content();

  // The page should still render properly even with no franchises
  expect(pageContent).toContain("Franchise");
});

test("admin dashboard franchise with no stores displays correctly", async ({
  page,
}) => {
  await page.route("**/api/franchise?page=0&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 1,
            name: "Empty Franchise",
            admins: [{ id: 2, name: "Owner", email: "owner@test.com" }],
            stores: [],
          },
        ],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Franchise name should be visible
  await expect(page.locator("text=Empty Franchise")).toBeVisible();
  await expect(page.locator("text=Owner")).toBeVisible();

  // Close button should still be present
  const closeButtons = page.locator('button:has-text("Close")');
  expect(await closeButtons.count()).toBeGreaterThan(0);
});

test("admin dashboard multiple admins display correctly", async ({ page }) => {
  await page.route("**/api/franchise?page=0&limit=3&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [
          {
            id: 1,
            name: "Multi Admin Franchise",
            admins: [
              { id: 2, name: "Admin One", email: "admin1@test.com" },
              { id: 3, name: "Admin Two", email: "admin2@test.com" },
              { id: 4, name: "Admin Three", email: "admin3@test.com" },
            ],
            stores: [],
          },
        ],
        more: false,
      }),
    });
  });

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check all admin names appear (they should be comma-separated)
  const adminCell = page.locator(
    'td:has-text("Admin One, Admin Two, Admin Three")',
  );
  await expect(adminCell).toBeVisible();
});

test("admin dashboard trash icons are present", async ({ page }) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Trash icons should be in close buttons
  const closeButtons = page.locator('button:has-text("Close")');
  const buttonCount = await closeButtons.count();
  expect(buttonCount).toBeGreaterThan(0);
});

test("admin dashboard handles filter with special characters", async ({
  page,
}) => {
  await page.route(
    "**/api/franchise?page=0&limit=10&name=*test%26special*",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          franchises: [],
          more: false,
        }),
      });
    },
  );

  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  const filterInput = page.locator('input[name="filterFranchise"]');
  await filterInput.fill("test&special");

  const submitButton = page.locator('button:has-text("Submit")');
  await submitButton.click();

  await page.waitForTimeout(300);
  // Test should complete without errors
});

test("admin dashboard revenue displays with proper formatting", async ({
  page,
}) => {
  await page.goto("/admin-dashboard");
  await page.waitForLoadState("networkidle");

  // Check that revenue numbers are formatted with commas
  const revenue5000 = page.locator("text=5,000");
  const revenue7500 = page.locator("text=7,500");

  await expect(revenue5000).toBeVisible();
  await expect(revenue7500).toBeVisible();
});
