import { test, expect } from '@playwright/test';
import { ALL_PAGES, PAGES, UPDATES_PAGE } from './support/pages';

// Regression guard: each page's file once served the wrong page's content
// entirely (e.g. lessons.html rendered the Contact form, contact.html
// rendered the 404 page). These specs check every page directly, by its
// own URL, so a future mix-up fails immediately.
for (const page of PAGES) {
  test(`${page.path} shows its own title, heading and active nav item`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);

    await expect(browserPage).toHaveTitle(new RegExp(page.titleContains));
    await expect(browserPage.locator('h1')).toHaveText(page.heading);

    const active = browserPage.locator('nav.mainnav a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText(page.navLabel);
  });
}

// Updates isn't in the nav, so it gets its own version of the check above
// without the active-nav-item assertion.
test(`${UPDATES_PAGE.path} shows its own title and heading, and stays out of search results`, async ({ page }) => {
  await page.goto(UPDATES_PAGE.path);
  await expect(page).toHaveTitle(new RegExp(UPDATES_PAGE.titleContains));
  await expect(page.locator('h1')).toHaveText(UPDATES_PAGE.heading);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('every page links to a unique canonical URL matching its own filename', async ({ page }) => {
  for (const sitePage of ALL_PAGES) {
    await page.goto(sitePage.path);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `https://wrightmaths.uk${sitePage.path}`);
  }
});
