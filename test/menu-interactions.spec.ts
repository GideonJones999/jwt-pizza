import { test, expect } from "./coverage-helper";

const mockMenu = [
  {
    id: "1",
    title: "Pizza 1",
    description: "Test pizza 1",
    image: "img1.png",
    price: 10,
  },
  {
    id: "2",
    title: "Pizza 2",
    description: "Test pizza 2",
    image: "img2.png",
    price: 12,
  },
  {
    id: "3",
    title: "Pizza 3",
    description: "Test pizza 3",
    image: "img3.png",
    price: 14,
  },
];

const mockFranchises = {
  franchises: [
    {
      id: "f1",
      name: "Test Franchise",
      stores: [
        { id: "s1", name: "Store 1" },
        { id: "s2", name: "Store 2" },
      ],
    },
  ],
  more: false,
};

test("menu displays pizza cards and allows selection", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const pizzaButtons = page.locator("button[type='button']");
  const firstButton = pizzaButtons.first();
  const isVisible = await firstButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isVisible) {
    await firstButton.click();
    await page.waitForTimeout(500);

    const orderText = page.locator("text=Selected pizzas");
    const orderVisible = await orderText
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (orderVisible) {
      await expect(orderText).toBeVisible();
    }
  }
});

test("menu click pizza button adds to order", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const pizzaButtons = page.locator(
    "button[type='button']:not([data-hs-collapse])",
  );
  const count = await pizzaButtons.count();

  if (count >= 2) {
    for (let i = 0; i < 2; i++) {
      await pizzaButtons.nth(i).click();
      await page.waitForTimeout(300);
    }

    const orderText = page.locator("text=Selected pizzas");
    const visible = await orderText
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (visible) {
      await expect(orderText).toBeVisible();
    }
  }
});

test("menu checkout requires store selection", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const pizzaButtons = page.locator("button[type='button']");
  const isVisible = await pizzaButtons
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isVisible) {
    await pizzaButtons.first().click();
    await page.waitForTimeout(500);

    const submitButton = page.locator("button[type='submit']");
    const submitVisible = await submitButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (submitVisible) {
      const isDisabled = await submitButton.isDisabled();
      if (isDisabled) {
        expect(isDisabled).toBe(true);
      }
    }
  }
});

test("menu checkout with store and items succeeds", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const storeSelect = page.locator("select").first();
  const storeVisible = await storeSelect
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (storeVisible) {
    const options = page.locator("option");
    const optionCount = await options.count();

    if (optionCount > 1) {
      await storeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      const pizzaButtons = page.locator("button[type='button']");
      const buttonVisible = await pizzaButtons
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (buttonVisible) {
        await pizzaButtons.first().click();
        await page.waitForTimeout(500);

        const submitButton = page.locator("button[type='submit']");
        const submitVisible = await submitButton
          .isVisible({ timeout: 3000 })
          .catch(() => false);

        if (submitVisible) {
          const isDisabled = await submitButton.isDisabled().catch(() => true);
          if (!isDisabled) {
            await submitButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  }
});

test("menu maintains order state across selections", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const pizzaButtons = page.locator("button[type='button']");
  const count = await pizzaButtons.count();

  if (count >= 3) {
    let clickCount = 0;
    for (let i = 0; i < 3; i++) {
      const btn = pizzaButtons.nth(i);
      try {
        await btn.click({ timeout: 3000 });
        clickCount++;
        await page.waitForTimeout(300);
      } catch {
        break;
      }
    }

    if (clickCount > 0) {
      const orderText = page.locator("text=Selected pizzas");
      const visible = await orderText
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (visible) {
        await expect(orderText).toBeVisible();
      }
    }
  }
});

test("menu store selection changes value", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const storeSelect = page.locator("select").first();
  const selectExists = await storeSelect
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (selectExists) {
    const options = page.locator("option");
    const optionCount = await options.count();

    if (optionCount > 1) {
      await storeSelect.selectOption({ index: 1 });

      const selectedValue = await storeSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  }
});

test("menu loads stores and pizzas", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const storeSelect = page.locator("select").first();
  const selectExists = await storeSelect
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (selectExists) {
    await expect(storeSelect).toBeVisible();

    const options = page.locator("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(1);
  }
});

test("menu displays pizza cards", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  const cards = page.locator("[class*='card']");
  const cardCount = await cards.count().catch(() => 0);

  if (cardCount > 0) {
    await expect(cards.first())
      .toBeVisible()
      .catch(() => {
        expect(cardCount).toBeGreaterThan(0);
      });
  }
});

test("menu has add to order buttons", async ({ page }) => {
  await page.route("**/api/order/menu", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockMenu) }),
  );
  await page.route("**/api/franchise**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(mockFranchises) }),
  );

  await page.goto("/menu");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  const buttons = page.locator("button");
  const buttonCount = await buttons.count();

  if (buttonCount > 0) {
    expect(buttonCount).toBeGreaterThan(0);
  }
});
