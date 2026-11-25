import { test, expect } from './support/fixtures';
import { ALL_PAGES } from './support/pages';

const ALL_PATHS = [...ALL_PAGES.map((p) => p.path), '/404.html'];

for (const path of ALL_PATHS) {
  test(`${path} has no build number or DBS claim in the footer`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer .build-number')).toHaveCount(0);
    await expect(page.locator('footer')).not.toContainText(/build \d{4}\./i);
    await expect(page.locator('footer')).not.toContainText(/DBS/i);
  });
}
