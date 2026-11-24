import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './support/fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const box = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: /Search this book/ });
const options = (page: import('@playwright/test').Page) => page.locator('form.book-search').getByRole('option'); // not the page's own <select> options

test.describe('the book search box', () => {
  test('typing "circle theorems" on any book page puts the Circle theorems topic first', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    await box(page).fill('circle theorems');
    await expect(options(page).first()).toHaveAttribute('href', /\/books\/gcse\/circle-theorems\.html$/);
    await expect(options(page).first()).toContainText('Circle theorems');
    await expect(options(page).first()).toContainText('Topic');
  });

  test('a glossary word finds its glossary entry, with its strand and a short definition', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    await box(page).fill('hypotenuse');
    const first = options(page).first();
    await expect(first).toHaveAttribute('href', /\/books\/gcse\/glossary\.html#hypotenuse$/);
    await expect(first).toContainText('Term');
    await expect(first).toContainText('Geometry');
    await first.click();
    await expect(page).toHaveURL(/glossary\.html#hypotenuse$/);
  });

  test('a section heading is found and links to its anchor, and other pages are findable by plain words', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    await box(page).fill('alternate segment');
    const href = await options(page).filter({ hasText: 'Section' }).first().getAttribute('href');
    expect(href).toMatch(/circle-theorems\.html#s-/);
    const id = new URL(href!).hash.slice(1);
    await box(page).fill('teacher answer key');
    await expect(options(page).first()).toHaveAttribute('href', /teachers\.html$/);
    await box(page).fill('parents');
    await expect(options(page).first()).toHaveAttribute('href', /parents\.html$/);
    await box(page).fill('practice papers');
    await expect(options(page).first()).toHaveAttribute('href', /foundation\.html$/);
    const response = await page.request.get('/books/gcse/circle-theorems.html');
    expect(await response.text()).toContain(`id="${id}"`);
  });

  test('answer keys are never offered as results', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    await box(page).fill('answer key');
    await expect(options(page).first()).toBeVisible();
    for (const href of await options(page).evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href))) {
      expect(href).not.toContain('/key/');
    }
  });

  test('the keyboard works: arrows move through the results, Enter opens one, Escape closes the list', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    const input = box(page);
    await input.click();
    await input.pressSequentially('circle');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    const second = options(page).nth(1);
    await page.keyboard.press('ArrowDown');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', (await second.getAttribute('id'))!);
    await page.keyboard.press('ArrowUp');
    await expect(options(page).first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
    await input.fill('circle theorems');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/circle-theorems\.html$/);
  });

  test('a search with no matches says so, politely', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    await box(page).fill('zzzqqq');
    await expect(page.locator('.book-search-empty')).toContainText('No results for');
    await expect(page.getByRole('status')).toContainText('No results');
    await expect(options(page)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.book-search-empty')).toBeHidden();
  });

  test('small typos and plurals still find the page', async ({ page }) => {
    await page.goto('/books/gcse/index.html');
    await box(page).fill('simultanous equation');
    await expect(options(page).first()).toHaveAttribute('href', /simultaneous-equations\.html$/);
  });

  test('privacy: the index is fetched from this site only, only once the box is used, and nothing is stored', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await page.goto('/books/gcse/index.html');
    expect(requested.filter((u) => u.includes('search-index'))).toEqual([]);
    const before = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
    await box(page).click();
    await box(page).fill('circle theorems secret-query');
    await box(page).fill('circle theorems');
    await expect(options(page).first()).toBeVisible();
    const fetched = requested.filter((u) => u.includes('search-index'));
    expect(fetched).toHaveLength(1);
    expect(new URL(fetched[0]).origin).toBe(new URL(page.url()).origin);
    for (const url of requested) {
      expect(new URL(url).origin, url).toBe(new URL(page.url()).origin);
      expect(url).not.toContain('circle');
    }
    const after = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
    expect(after).toBe(before);
    expect(after).not.toContain('circle');
    expect(page.url()).not.toContain('circle');
  });

  test('the box is only on book pages, not on the rest of the site', async ({ page }) => {
    for (const path of ['/index.html', '/about.html', '/books/index.html', '/contact.html', '/404.html']) {
      await page.goto(path);
      await expect(page.locator('form.book-search'), path).toHaveCount(0);
    }
    await page.goto('/books/gcse/key/fractions.html');
    await expect(page.locator('form.book-search')).toHaveCount(1);
  });

  test('on a phone (320px wide) the page does not scroll sideways, with the results open', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/books/gcse/index.html');
    await box(page).fill('circle');
    await expect(options(page).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const list = await page.getByRole('listbox').boundingBox();
    expect(list!.x).toBeGreaterThanOrEqual(0);
    expect(list!.x + list!.width).toBeLessThanOrEqual(320);
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`no axe violations with results open (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/books/gcse/fractions.html');
      await box(page).fill('circle');
      await page.keyboard.press('ArrowDown');
      await expect(options(page).first()).toBeVisible();
      let results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
      await box(page).fill('zzzqqq');
      await expect(page.locator('.book-search-empty')).toBeVisible();
      results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
    });
  }
});
