import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALL_PAGES } from './support/pages';
import { BOOK_PAGES, BOOK_TOPICS } from './support/book-pages';

const PUBLIC = join(__dirname, '..', 'public');

test.describe('the GCSE book stays hidden', () => {
  test('no existing page, the sitemap or robots.txt mentions the book', async ({ page }) => {
    for (const sitePage of [...ALL_PAGES, { path: '/404.html' }]) {
      await page.goto(sitePage.path);
      await expect(page.locator('a[href*="books"]'), `${sitePage.path} links to the book`).toHaveCount(0);
    }
    for (const file of ['sitemap.xml', 'robots.txt']) {
      expect(readFileSync(join(PUBLIC, file), 'utf8'), file).not.toMatch(/books/i);
    }
  });

  for (const bookPage of BOOK_PAGES) {
    test(`${bookPage.path} is noindex, has its own title and heading, and no nav item is highlighted`, async ({ page }) => {
      await page.goto(bookPage.path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page).toHaveTitle(new RegExp(bookPage.titleContains));
      await expect(page.locator('h1')).toHaveText(bookPage.heading);
      await expect(page.locator('nav.mainnav a[aria-current="page"]')).toHaveCount(0);
      await expect(page.locator('.legal .build-number')).toHaveText(/^Build \d{4}\.\d{2}\.\d{2}\.\d{3}$/);
    });
  }
});

test.describe('the book is well formed', () => {
  test('the folder URL redirects to the slashed form so relative links work', async ({ page }) => {
    await page.goto('/books/gcse');
    await expect(page).toHaveURL(/\/books\/gcse\/$/);
    await expect(page.locator('h1')).toHaveText(/built from the ground up/i);
  });

  test('every internal link and every #anchor on every book page resolves', async ({ page, request }) => {
    const checked = new Set<string>();
    for (const bookPage of BOOK_PAGES) {
      await page.goto(bookPage.path);
      const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));
      for (const href of hrefs) {
        const url = new URL(href);
        if (url.hostname !== 'localhost') continue; // tel:, mailto: and https: are not served here
        const key = url.pathname + url.hash;
        if (checked.has(key)) continue;
        checked.add(key);
        const response = await request.get(url.pathname);
        expect(response.status(), `${bookPage.path} -> ${key}`).toBe(200);
        if (url.hash.length > 1) {
          const body = await response.text();
          expect(body, `${bookPage.path} -> ${key} (no such id)`).toContain(`id="${url.hash.slice(1)}"`);
        }
      }
    }
  });

  test('headings never skip a level', async ({ page }) => {
    for (const bookPage of BOOK_PAGES) {
      await page.goto(bookPage.path);
      const levels = await page.$$eval('main h1,main h2,main h3,main h4,main h5,main h6', (hs) => hs.map((h) => Number(h.tagName[1])));
      expect(levels[0], `${bookPage.path} starts at h1`).toBe(1);
      levels.forEach((level, i) => {
        if (i > 0) expect(level - levels[i - 1], `${bookPage.path}: heading ${i + 1}`).toBeLessThanOrEqual(1);
      });
    }
  });

  test('every page loads its script without console errors', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(m.text());
    });
    for (const bookPage of BOOK_PAGES) await page.goto(bookPage.path);
    expect(problems).toEqual([]);
  });

  test('the pyramid shows the live topics as links, the planned ones as "coming soon", base layer last', async ({ page }) => {
    await page.goto('/books/gcse/');
    const live = page.locator('.pyr-node.live a');
    await expect(live).toHaveCount(BOOK_TOPICS.length);
    expect(await page.locator('.pyr-node.planned .soon').count()).toBeGreaterThan(5);
    const labels = await page.locator('.layer-label').allTextContents();
    expect(labels[labels.length - 1]).toBe('Base layer');
  });

  test('each topic page names what it stands on and what it unlocks, matching the pyramid', async ({ page }) => {
    await page.goto('/books/gcse/pythagoras.html');
    await expect(page.locator('.bys').first()).toContainText('Squares and square roots');
    await expect(page.locator('.bys').first()).toContainText('Shapes and angles');
    await expect(page.locator('.bys.unlocks')).toContainText('Trigonometry');
  });

  test('every question has hints and a worked answer, and there are plenty of check-your-knowledge sets', async ({ page, request }) => {
    for (const topic of BOOK_TOPICS) {
      await page.goto(topic.path);
      const total = await page.locator('.q').count();
      expect(total, `${topic.path} question count`).toBeGreaterThanOrEqual(30);
      expect(await page.locator('.ckw').count(), `${topic.path} check sets`).toBeGreaterThanOrEqual(6);
      expect(await page.locator('.q .solution').count(), `${topic.path} solutions`).toBe(total);
      // The script moves hints into the live page, so count them in the served HTML.
      const html = await (await request.get(topic.path)).text();
      expect((html.match(/<ol class="ladder"/g) ?? []).length, `${topic.path} hints`).toBe((html.match(/<div class="q"/g) ?? []).length);
      expect(await page.locator('.flip-section').count(), `${topic.path} has a Flip it section`).toBe(1);
    }
  });
});

test.describe('the glossary', () => {
  test('is generated with plenty of terms, each with a definition and an example', async ({ page }) => {
    await page.goto('/books/gcse/glossary.html');
    expect(await page.locator('.g-entry').count()).toBeGreaterThanOrEqual(60);
    expect(await page.locator('.g-entry').evaluateAll((es) => es.filter((e) => !e.querySelector('.g-def') || !e.querySelector('.g-example')).length)).toBe(0);
    await expect(page.locator('#denominator .g-used')).toContainText('Fractions');
  });

  test('can be filtered by strand and searched', async ({ page }) => {
    await page.goto('/books/gcse/glossary.html');
    const total = await page.locator('.g-entry:visible').count();
    await page.locator('[data-glossary-filter]').selectOption('geometry');
    const geometry = await page.locator('.g-entry:visible').count();
    expect(geometry).toBeGreaterThan(5);
    expect(geometry).toBeLessThan(total);
    await page.locator('[data-glossary-search]').fill('hypotenuse');
    await expect(page.locator('.g-entry:visible').first()).toContainText('Hypotenuse');
    await expect(page.locator('[data-glossary-status]')).toContainText('of');
  });
});

test.describe('words in teal', () => {
  test('tapping a term shows its meaning, Escape closes it, and it links to the glossary', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const term = page.locator('a.term', { hasText: 'denominator' }).first();
    await term.click();
    const pop = page.locator('.term-pop');
    await expect(pop).toBeVisible();
    await expect(pop).toContainText('equal parts');
    await expect(pop.locator('a')).toHaveAttribute('href', 'glossary.html#denominator');
    await page.keyboard.press('Escape');
    await expect(pop).toHaveCount(0);
  });
});

test.describe('questions', () => {
  test('a right answer is accepted in any equivalent form and shows why', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q').first(); // 5/8
    await q.getByLabel('Your answer').fill('0.625');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toHaveClass(/ok/);
    await expect(q).toHaveClass(/q-correct/);
    await expect(q.locator('.solution')).toBeVisible();
  });

  test('a known wrong answer gets a specific explanation, not just "wrong"', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q').first();
    await q.getByLabel('Your answer').fill('5/16');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toContainText('still cut into 8 slices');
    await expect(q).not.toHaveClass(/q-correct/);
  });

  test('an unsimplified fraction is told it is the right value in the wrong form', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q', { hasText: 'Simplify' }).first();
    await q.getByLabel('Your answer').fill('4/6');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toContainText('not fully simplified');
  });

  test('"Help, I\'m stuck!" reveals one hint at a time and ends with a person to ask, then the answer', async ({ page }) => {
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    await expect(q.locator('.solution')).toBeHidden();
    const help = q.getByRole('button', { name: /Help, I'm stuck|Another hint|Show me the answer/ });
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(1);
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(2);
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(3);
    await expect(q.locator('.rungs li').last()).toContainText('Show this question to your teacher');
    await expect(help).toHaveText('Show me the answer');
    await help.click();
    await expect(q.locator('.solution')).toBeVisible();
  });

  test('multiple choice explains a wrong pick and celebrates the right one', async ({ page }) => {
    await page.goto('/books/gcse/raise-your-grade.html');
    const q = page.locator('.q').first();
    await q.getByRole('button', { name: /Nothing: only the final answer counts/ }).click();
    await expect(q.locator('.q-feedback')).toContainText('Not quite');
    await q.getByRole('button', { name: /Method marks/ }).click();
    await expect(q).toHaveClass(/q-correct/);
    await expect(q.locator('.solution')).toBeVisible();
  });

  test('progress is saved on this device only, and shows on the pyramid', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q').first();
    await q.getByLabel('Your answer').fill('5/8');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('[data-topic-progress]')).toContainText('You have got 1 of');
    await page.goto('/books/gcse/');
    await expect(page.locator('[data-progress-for="fractions"]')).toContainText(/^1 of \d+ right$/);
    expect(await page.evaluate(() => Object.keys(window.localStorage))).toEqual(['wm-gcse-v1']);
    page.once('dialog', (d) => d.accept());
    await page.locator('[data-reset-progress]').click();
    await expect(page.locator('[data-progress-for="fractions"]')).toContainText(/questions$/);
  });

  test('the question counts on the pyramid match the pages', async ({ page }) => {
    for (const topic of BOOK_TOPICS) {
      await page.goto(topic.path);
      const onPage = await page.locator('.q').count();
      await page.goto('/books/gcse/');
      const id = topic.path.split('/').pop()!.replace('.html', '');
      expect(Number(await page.locator(`[data-progress-for="${id}"]`).getAttribute('data-total'))).toBe(onPage);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('hints and worked answers are all visible, so nothing is lost', async ({ page }) => {
    await page.goto('/books/gcse/solving-equations.html');
    await expect(page.locator('.q .ladder').first()).toBeVisible();
    await expect(page.locator('.q .solution').first()).toBeVisible();
    await expect(page.locator('.q-form')).toHaveCount(0);
  });
});
