import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './support/fixtures';
import { ALL_PAGES } from './support/pages';
import { BOOK_PAGES } from './support/book-pages';

// WCAG 2.1 A and AA rules (colour contrast included). Each page is checked as
// it loads; the book pages are also checked in their interactive open states.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function violations(page: import('@playwright/test').Page, ignore: string[] = []) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations
    .filter((v) => !ignore.includes(v.id))
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
}

// KNOWN, NOT FIXED HERE: the main site's pages have two colour-contrast failures
// that exist in style.css today: the gold ".kicker" labels on the cream sections
// (about 2.4:1) and the footer's first paragraph (grey on navy). Every other axe
// rule is enforced on them. Remove this ignore once style.css is fixed (Greg's call:
// it changes how the live site looks). The book's pages carry their own fixes in
// book.css and are checked with every rule.
const MAIN_SITE_KNOWN = ['color-contrast'];

for (const sitePage of [...ALL_PAGES, { path: '/404.html' }, { path: '/books/' }]) {
  test(`${sitePage.path} has no axe violations (colour contrast excepted: see note)`, async ({ page }) => {
    await page.goto(sitePage.path);
    expect(await violations(page, MAIN_SITE_KNOWN)).toEqual([]);
  });
}

for (const bookPage of BOOK_PAGES) {
  test(`${bookPage.path} has no axe violations`, async ({ page }) => {
    await page.goto(bookPage.path);
    expect(await violations(page)).toEqual([]);
  });
}

test.describe('the book in its interactive states', () => {
  test('after answering right and wrong, with hints open, and with a term pop-up open', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const first = page.locator('.q').first();
    await first.getByLabel('Your answer').fill('5/16');
    await first.getByRole('button', { name: 'Check' }).click();
    await first.getByRole('button', { name: /Give me a clue/ }).click();
    await page.locator('a.term').first().click();
    await expect(page.locator('.term-pop')).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await first.getByLabel('Your answer').fill('5/8');
    await first.getByRole('button', { name: 'Check' }).click();
    expect(await violations(page)).toEqual([]);
  });

  test('with the duck open', async ({ page }) => {
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    const help = q.getByRole('button', { name: /Give me a clue|Another clue/ });
    await help.click();
    await help.click();
    await help.click();
    await expect(q.locator('.duck-rung')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('multiple choice, right and wrong', async ({ page }) => {
    await page.goto('/books/gcse/raise-your-grade.html');
    const q = page.locator('.q').first();
    await q.getByRole('button', { name: /Nothing: only/ }).click();
    expect(await violations(page)).toEqual([]);
    await q.getByRole('button', { name: /Method marks/ }).click();
    expect(await violations(page)).toEqual([]);
  });

  test('the glossary filtered', async ({ page }) => {
    await page.goto('/books/gcse/glossary.html');
    await page.locator('[data-glossary-filter]').selectOption('algebra');
    expect(await violations(page)).toEqual([]);
  });

  // One test per page (each gets its own time budget): a 320px phone width, as a high-zoom user would see it.
  for (const bookPage of BOOK_PAGES) {
    test(`${bookPage.path} has no axe violations at 320px wide`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(bookPage.path);
      expect(await violations(page), bookPage.path).toEqual([]);
    });
  }
});
