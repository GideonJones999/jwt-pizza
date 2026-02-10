import { test as baseTest } from "@playwright/test";
import { saveCoverage } from "./coverage";

export const test = baseTest.extend({
  page: async ({ page }, use) => {
    // Clear any previous coverage data
    await page.addInitScript(() => {
      (window as any).__coverage__ = undefined;
    });

    await use(page);

    // No automatic coverage save here - let individual tests handle it
  },
});

export { expect } from "@playwright/test";
