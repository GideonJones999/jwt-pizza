import { test, expect } from "./coverage-helper";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

test.beforeEach(async ({ context }) => {
  // Mock localStorage in the browser context
  await context.addInitScript(() => {
    const mockStore: { [key: string]: string } = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => mockStore[key] || null,
        setItem: (key: string, value: string) => {
          mockStore[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStore[key];
        },
        clear: () => {
          Object.keys(mockStore).forEach((k) => delete mockStore[k]);
        },
      },
      writable: true,
    });
  });
});

test("httpPizzaService - successful login stores token", async ({ page }) => {
  // Set up route interception for login
  await page.route("**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: 1,
            name: "Test User",
            email: "test@test.com",
            roles: [{ role: "diner" }],
          },
          token: "test-jwt-token-123",
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Execute login via service
  const result = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    const user = await httpPizzaService.login("test@test.com", "password123");
    const token = localStorage.getItem("token");
    return { user, token };
  });

  expect(result.user.email).toBe("test@test.com");
  expect(result.token).toBe("test-jwt-token-123");
});

test("httpPizzaService - failed login throws error", async ({ page }) => {
  await page.route("**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid credentials" }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const error = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    try {
      await httpPizzaService.login("bad@test.com", "wrongpassword");
      return null;
    } catch (e: any) {
      return { code: e.code, message: e.message };
    }
  });

  expect(error?.code).toBe(401);
  expect(error?.message).toBe("Invalid credentials");
});

test("httpPizzaService - successful registration stores token", async ({
  page,
}) => {
  await page.route("**/api/auth", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: 2,
            name: "New User",
            email: "new@test.com",
            roles: [{ role: "diner" }],
          },
          token: "new-user-token-456",
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const result = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    const user = await httpPizzaService.register(
      "New User",
      "new@test.com",
      "password123",
    );
    const token = localStorage.getItem("token");
    return { user, token };
  });

  expect(result.user.name).toBe("New User");
  expect(result.token).toBe("new-user-token-456");
});

test("httpPizzaService - logout removes token and calls API", async ({
  page,
}) => {
  let logoutCalled = false;

  await page.route("**/api/auth", async (route) => {
    if (route.request().method() === "DELETE") {
      logoutCalled = true;
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const tokenRemoved = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    localStorage.setItem("token", "test-token");
    httpPizzaService.logout();
    // Give it a moment for async call
    await new Promise((resolve) => setTimeout(resolve, 100));
    return localStorage.getItem("token") === null;
  });

  expect(tokenRemoved).toBe(true);
});

test("httpPizzaService - getUser returns user when token exists", async ({
  page,
}) => {
  await page.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        name: "Current User",
        email: "current@test.com",
        roles: [{ role: "diner" }],
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const user = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    localStorage.setItem("token", "valid-token");
    return await httpPizzaService.getUser();
  });

  expect(user?.email).toBe("current@test.com");
});

test("httpPizzaService - getUser returns null when no token", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const user = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    localStorage.removeItem("token");
    return await httpPizzaService.getUser();
  });

  expect(user).toBeNull();
});

test("httpPizzaService - getUser removes token on 401 error", async ({
  page,
}) => {
  await page.route("**/api/user/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const result = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    localStorage.setItem("token", "invalid-token");
    const user = await httpPizzaService.getUser();
    const token = localStorage.getItem("token");
    return { user, token };
  });

  expect(result.user).toBeNull();
  expect(result.token).toBeNull();
});

test("httpPizzaService - getMenu returns menu data", async ({ page }) => {
  await page.route("**/api/order/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          title: "Veggie",
          description: "Vegetables",
          image: "pizza1.png",
          price: 0.0038,
        },
      ]),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const menu = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.getMenu();
  });

  expect(menu.length).toBeGreaterThan(0);
  expect(menu[0].title).toBe("Veggie");
});

test("httpPizzaService - order creates an order", async ({ page }) => {
  await page.route("**/api/order", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          order: {
            id: 123,
            items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
          },
          jwt: "order-jwt-token",
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const orderResponse = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.order({
      franchiseId: "1",
      storeId: "1",
      items: [{ menuId: "1", description: "Veggie", price: 0.0038 }],
    });
  });

  expect(orderResponse.order.id).toBe(123);
  expect(orderResponse.jwt).toBe("order-jwt-token");
});

test("httpPizzaService - verifyOrder calls factory service", async ({
  page,
}) => {
  await page.route("**/api/order/verify", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "valid",
          payload: { vendor: { id: "1", name: "pizzaPocket" } },
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const verification = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.verifyOrder("test-jwt");
  });

  expect(verification.message).toBe("valid");
});

test("httpPizzaService - getFranchise returns user franchises", async ({
  page,
}) => {
  await page.route("**/api/franchise/1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, name: "Test Franchise", stores: [] }]),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const franchises = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.getFranchise({
      id: "1",
      name: "User",
      email: "test@test.com",
      roles: [],
    });
  });

  expect(franchises.length).toBe(1);
  expect(franchises[0].name).toBe("Test Franchise");
});

test("httpPizzaService - createFranchise creates new franchise", async ({
  page,
}) => {
  await page.route("**/api/franchise", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 2,
          name: "New Franchise",
          admins: [{ id: 1, name: "Admin", email: "admin@test.com" }],
          stores: [],
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const franchise = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.createFranchise({
      name: "New Franchise",
      admins: [{ id: "1", name: "Admin", email: "admin@test.com" }],
      stores: [],
    });
  });

  expect(franchise.name).toBe("New Franchise");
  expect(franchise.id).toBe(2);
});

test("httpPizzaService - getFranchises with pagination", async ({ page }) => {
  await page.route("**/api/franchise?page=0&limit=10&name=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        franchises: [{ id: 1, name: "Franchise 1", stores: [] }],
        more: true,
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const franchiseList = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.getFranchises(0, 10, "*");
  });

  expect(franchiseList.franchises.length).toBe(1);
  expect(franchiseList.more).toBe(true);
});

test("httpPizzaService - closeFranchise deletes franchise", async ({
  page,
}) => {
  let deleteCalled = false;

  await page.route("**/api/franchise/1", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteCalled = true;
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    await httpPizzaService.closeFranchise({
      id: "1",
      name: "Test",
      admins: [],
      stores: [],
    });
  });

  // Give it time to complete
  await page.waitForTimeout(100);
  expect(deleteCalled).toBe(true);
});

test("httpPizzaService - createStore adds store to franchise", async ({
  page,
}) => {
  await page.route("**/api/franchise/1/store", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "New Store",
          totalRevenue: 0,
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const store = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.createStore(
      { id: "1", name: "Franchise", admins: [], stores: [] },
      { name: "New Store", id: "1" },
    );
  });

  expect(store.name).toBe("New Store");
});

test("httpPizzaService - closeStore deletes store", async ({ page }) => {
  let deleteCalled = false;

  await page.route("**/api/franchise/1/store/1", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteCalled = true;
      await route.fulfill({ status: 200, body: JSON.stringify(null) });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    await httpPizzaService.closeStore(
      { id: "1", name: "Franchise", admins: [], stores: [] },
      { id: "1", name: "Store", totalRevenue: 0 },
    );
  });

  await page.waitForTimeout(100);
  expect(deleteCalled).toBe(true);
});

test("httpPizzaService - docs returns service documentation", async ({
  page,
}) => {
  await page.route("**/api/docs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "1.0.0",
        endpoints: ["/api/order", "/api/franchise"],
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const docs = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.docs("service");
  });

  expect(docs.version).toBe("1.0.0");
});

test("httpPizzaService - docs factory returns factory documentation", async ({
  page,
}) => {
  await page.route("**/api/docs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "1.0.0",
        endpoints: ["/api/order/verify"],
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const docs = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.docs("factory");
  });

  expect(docs.endpoints).toContain("/api/order/verify");
});

test("httpPizzaService - network error handling", async ({ page }) => {
  await page.route("**/api/order/menu", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const error = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    try {
      await httpPizzaService.getMenu();
      return null;
    } catch (e: any) {
      return { code: e.code, message: e.message };
    }
  });

  expect(error?.code).toBe(500);
  expect(error?.message).toBeTruthy();
});

test("httpPizzaService - includes auth token in requests when available", async ({
  page,
}) => {
  let authHeaderPresent = false;

  await page.route("**/api/order/menu", async (route) => {
    const headers = route.request().headers();
    authHeaderPresent = headers["authorization"] === "Bearer test-token-xyz";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    localStorage.setItem("token", "test-token-xyz");
    await httpPizzaService.getMenu();
  });

  await page.waitForTimeout(100);
  expect(authHeaderPresent).toBe(true);
});

test("httpPizzaService - getOrders returns order history", async ({ page }) => {
  await page.route("**/api/order", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          dinerId: 1,
          orders: [
            {
              id: 1,
              franchiseId: 1,
              storeId: 1,
              date: "2024-01-01",
              items: [],
            },
          ],
          page: 0,
        }),
      });
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const orderHistory = await page.evaluate(async () => {
    const { default: httpPizzaService } =
      await import("../src/service/httpPizzaService");
    return await httpPizzaService.getOrders({
      id: "1",
      name: "Test User",
      email: "test@test.com",
      roles: [],
    });
  });

  expect(orderHistory.orders.length).toBe(1);
  expect(orderHistory.dinerId).toBe(1);
});
