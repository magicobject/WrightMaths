import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALL_PAGES } from './support/pages';
import { ALEVEL_PAGES, ALEVEL_TOPICS } from './support/alevel-pages';

const PUBLIC = join(__dirname, '..', 'public');

test.describe('the A-level book stays hidden', () => {
  test('no page on the main site, and not the Books page, links to it; the sitemap and robots.txt never mention it', async ({ page }) => {
    for (const sitePage of [...ALL_PAGES, { path: '/books/' }, { path: '/404.html' }]) {
      await page.goto(sitePage.path);
      await expect(page.locator('a:not([href^="http"])[href*="a-level"], a:not([href^="http"])[href*="alevel"]'), `${sitePage.path} links to the A-level book`).toHaveCount(0);
    }
    for (const file of ['sitemap.xml', 'robots.txt']) {
      expect(readFileSync(join(PUBLIC, file), 'utf8'), file).not.toMatch(/a-level\/|alevel/i);
    }
  });

  for (const bookPage of ALEVEL_PAGES) {
    test(`${bookPage.path} is noindex, has its own title and heading, and no nav item is highlighted`, async ({ page }) => {
      await page.goto(bookPage.path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page).toHaveTitle(new RegExp(bookPage.titleContains));
      await expect(page.locator('h1')).toHaveText(bookPage.heading);
      await expect(page.locator('nav.mainnav a[aria-current="page"]')).toHaveCount(0);
      await expect(page.locator('main.book')).toHaveAttribute('data-book-id', 'a-level');
    });
  }
});

test.describe('the A-level book has no voice and sends nothing anywhere', () => {
  test('no page has a Listen button or voice control, and no page asks for another website', async ({ page }) => {
    for (const bookPage of ALEVEL_PAGES) {
      const outside: string[] = [];
      page.on('request', (req) => { if (!req.url().startsWith('http://localhost')) outside.push(req.url()); });
      await page.goto(bookPage.path);
      await expect(page.locator('main.book')).toHaveAttribute('data-audio', 'off');
      await expect(page.locator('.listen, button[aria-label*="Listen" i]'), bookPage.path).toHaveCount(0);
      await page.getByText('Reading options').first().click();
      await expect(page.locator('.read-tools')).not.toContainText(/listen|voice|speed/i);
      expect(outside, `${bookPage.path} asked another website for something`).toEqual([]);
      page.removeAllListeners('request');
    }
  });

  test('there are no recorded audio clips for the A-level book, and no page points at any', async () => {
    expect(readdirSync(join(PUBLIC, 'audio')).filter((f) => /a-level|alevel/i.test(f))).toEqual([]);
    for (const file of readdirSync(join(PUBLIC, 'books', 'a-level')).filter((f) => f.endsWith('.html'))) {
      expect(readFileSync(join(PUBLIC, 'books', 'a-level', file), 'utf8'), file).not.toMatch(/data-say|\.ogg|audio\/book/);
    }
  });

  test('progress is kept under its own key, separate from the GCSE book', async ({ page }) => {
    await page.goto('/books/a-level/');
    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys.filter((k) => k.startsWith('wm-gcse'))).toEqual([]);
  });
});

test.describe('the A-level hub', () => {
  test('lists all 47 topics in two years, with Year 2 and Further Pure marked as coming soon', async ({ page }) => {
    await page.goto('/books/a-level/');
    await expect(page.locator('.year-list').first().locator('li')).toHaveCount(21);
    await expect(page.locator('.year-list').nth(1).locator('li')).toHaveCount(26);
    await expect(page.locator('.pyr-node')).toHaveCount(47);
    const live = ALEVEL_TOPICS.length;
    await expect(page.locator('.pyr-node a')).toHaveCount(live);
    await expect(page.locator('.book-year.is-soon', { hasText: 'Year 2' })).toContainText('Coming soon');
    await expect(page.locator('.book-year.is-soon', { hasText: 'Further Pure' })).toContainText('Coming soon');
  });

  test('the pyramid reaches every topic through its prerequisites: no topic is unreachable', async ({ page }) => {
    await page.goto('/books/a-level/');
    const nodes = await page.locator('.pyr-node .node-title').allInnerTexts();
    expect(new Set(nodes).size).toBe(47);
  });
});

test.describe('the A-level glossary', () => {
  test('shows each term with its year and area, and renders the maths as MathML with a text alternative', async ({ page }) => {
    await page.goto('/books/a-level/glossary.html');
    const entries = page.locator('.g-entry');
    expect(await entries.count()).toBeGreaterThan(0);
    for (const entry of await entries.all()) {
      await expect(entry.locator('.chip-year, .chip-year2'), 'every term shows Year 1 or Year 2').toHaveCount(1);
    }
    const math = page.locator('.g-entry math').first();
    await expect(math).toHaveAttribute('alttext', /.+/);
  });

  test('filtering by area shows only that area', async ({ page }) => {
    await page.goto('/books/a-level/glossary.html');
    await page.locator('[data-glossary-filter]').selectOption('al-differentiation');
    const visible = page.locator('.g-entry:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    for (const entry of await visible.all()) await expect(entry).toHaveAttribute('data-strand', 'al-differentiation');
  });
});
