import { test as base } from "@playwright/test";
import fs from "fs";
import path from "path";

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);

    // Collect coverage after test completes
    try {
      const coverage = await page.evaluate(() => {
        return (window as any).__coverage__ || null;
      });

      if (coverage && Object.keys(coverage).length > 0) {
        const coverageDir = path.join(process.cwd(), ".nyc_output");
        if (!fs.existsSync(coverageDir)) {
          fs.mkdirSync(coverageDir, { recursive: true });
        }
        const timestamp = Date.now();
        const filename = `coverage-${timestamp}.json`;
        fs.writeFileSync(
          path.join(coverageDir, filename),
          JSON.stringify(coverage, null, 2),
        );
        console.log(`✓ Coverage collected: ${filename}`);
      } else {
        console.log(`ℹ No coverage data collected for this test`);
      }
    } catch (error) {
      console.log(`ℹ Coverage collection skipped (page may have been closed)`);
    }
  },
});

export { expect } from "@playwright/test";
