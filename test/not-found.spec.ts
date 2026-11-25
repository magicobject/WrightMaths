import { test, expect } from './support/fixtures';

test('an unknown URL serves the branded 404 page with a 404 status', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist.html');

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page Not Found/);
  await expect(page.locator('h1')).toHaveText(/doesn't add up/i);

  // The 404 page is not itself a nav destination, so nothing should read as "current".
  await expect(page.locator('nav.mainnav a[aria-current="page"]')).toHaveCount(0);
});

test('the 404 page\'s recovery links lead back into the real site', async ({ page }) => {
  await page.goto('/this-page-does-not-exist.html');

  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page).toHaveTitle(/Maths Tuition in Leominster/);
});

test('the 404 page is not indexed by search engines', async ({ page }) => {
  await page.goto('/this-page-does-not-exist.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('a deep unknown URL still gets styles, scripts and working links', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/books/gcse/bad')) failed.push(r.url()); });
  const response = await page.goto('/books/gcse/bad');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(/doesn't add up/i);
  // The stylesheet applied (unstyled, the h1 would be Times at 32px).
  const font = await page.locator('h1').evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toMatch(/Fraunces|serif/);
  expect(failed.filter((u) => !/favicon/.test(u))).toEqual([]);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
});
