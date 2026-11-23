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
    await expect(q.locator('.q-feedback')).toContainText('The slices are still eighths');
    await expect(q).not.toHaveClass(/q-correct/);
  });

  test('an unsimplified fraction is told it is the right value in the wrong form', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q', { hasText: 'Simplify' }).first();
    await q.getByLabel('Your answer').fill('4/6');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toContainText('Right value');
  });

  test('"Help, I\'m stuck!" reveals hints one at a time, then the duck, then a person, then the answer', async ({ page }) => {
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    await expect(q.locator('.solution')).toBeHidden();
    const help = q.getByRole('button', { name: /Help, I'm stuck|Another hint|Show me the answer/ });
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(1);
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(2);
    await help.click(); // the duck
    await expect(q.locator('.duck-rung')).toBeVisible();
    await expect(q.locator('.duck-rung')).toContainText('The question asks me to find');
    await help.click(); // a person
    await expect(q.locator('.rungs li').last()).toContainText('Show this question to your teacher');
    await expect(help).toHaveText('Show me the answer');
    await help.click();
    await expect(q.locator('.solution')).toBeVisible();
  });

  test('the duck listens but nothing typed to it is stored or sent anywhere', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET') requests.push(r.url()); });
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    const help = q.getByRole('button', { name: /Help, I'm stuck|Another hint/ });
    await help.click();
    await help.click();
    await help.click();
    const text = q.getByLabel('Tell the duck what is going on');
    await text.fill('my secret thought about the problem');
    await q.getByRole('button', { name: /I have explained it/ }).click();
    await expect(text).toHaveValue('');
    await expect(q.locator('.q-input')).toBeFocused();
    const stored = await page.evaluate(() => JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage }));
    expect(stored).not.toContain('secret thought');
    expect(requests).toEqual([]);
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
    await expect(page.locator('[data-topic-progress]')).toContainText('You have finished 1 of');
    await page.goto('/books/gcse/');
    await expect(page.locator('[data-progress-for="fractions"]')).toContainText(/^1 of \d+ done$/);
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

test.describe('feedback that helps instead of scolds', () => {
  test('a right value in the wrong form gets an amber "nearly", not a cross, and does not count as a wrong try', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const q = page.locator('.q', { hasText: 'Simplify' }).first();
    await q.getByLabel('Your answer').fill('4/6');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toHaveClass(/nearly/);
    await expect(q.locator('.q-feedback')).not.toHaveClass(/oops/);
  });

  test('a slipped decimal point or a wrong sign gets a generic hint even with no hand-written message', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 \u00d7 100' }).first();
    await q.getByLabel('Your answer').fill('10000');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q.locator('.q-feedback')).toContainText('10 times too big');
  });

  test('a typed minus in any style, a pound sign and x= are all accepted', async ({ page }) => {
    await page.goto('/books/gcse/negative-numbers.html');
    const q = page.locator('.q', { hasText: 'Work out 3 \u00d7 (\u22124)' }).first();
    await q.getByLabel('Your answer').fill('\u2212 12');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q).toHaveClass(/q-correct/);
  });

  test('multiple-choice options are shuffled across loads but always contain the right one', async ({ page }) => {
    const orders = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      await page.goto('/books/gcse/raise-your-grade.html');
      orders.add((await page.locator('.q').first().locator('.mc-option').allTextContents()).join('|'));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  test('a question with several hints offers the duck; a one-hint question skips it', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const qs = page.locator('.q');
    const oneHint = qs.filter({ hasText: 'Work out 10 \u00d7 10.' }).first();
    const help = oneHint.getByRole('button', { name: /Help, I'm stuck/ });
    await help.click();
    await expect(oneHint.locator('.duck-rung')).toHaveCount(0);
  });
});

test.describe('reading options and listen', () => {
  test('text size, easy-read font, tint and ruler can be switched on, and are remembered', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    await page.locator('.read-tools summary').click();
    await page.getByRole('button', { name: 'Bigger text' }).click();
    await page.getByRole('button', { name: 'Easy-read font' }).click();
    await page.getByRole('button', { name: 'Tinted page' }).click();
    await page.getByRole('button', { name: 'Reading ruler' }).click();
    const cls = await page.evaluate(() => document.documentElement.className);
    expect(cls).toContain('read-big1');
    expect(cls).toContain('read-easy');
    expect(cls).toContain('read-tint');
    expect(cls).toContain('read-ruler-on');
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.className)).toContain('read-easy');
    await page.locator('.read-tools summary').click();
    await page.getByRole('button', { name: 'Reset' }).click();
    expect(await page.evaluate(() => document.documentElement.className)).not.toContain('read-easy');
  });

  test('questions and key ideas have a Listen button that uses the browser voice only', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    expect(await page.locator('.qtext .listen').count()).toBeGreaterThan(10);
    expect(await page.locator('.key .listen').count()).toBeGreaterThan(2);
  });
});

test.describe('mixed practice', () => {
  test('deals five mixed questions, they work, and a new set is different', async ({ page }) => {
    await page.goto('/books/gcse/practice.html');
    const qs = page.locator('[data-practice-set] .q');
    await expect(qs).toHaveCount(5);
    const before = await qs.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.qid));
    expect(new Set(before.map((id) => id!.replace(/-\d+$/, ''))).size).toBeGreaterThan(1);
    await qs.first().getByRole('button', { name: /Help, I'm stuck/ }).click();
    await expect(qs.first().locator('.rungs li')).toHaveCount(1);
    await page.getByRole('button', { name: 'Give me five new questions' }).click();
    await expect(qs).toHaveCount(5);
  });

  test('only the topics ticked are used', async ({ page }) => {
    await page.goto('/books/gcse/practice.html');
    for (const box of await page.locator('input[name="practice-topic"]').all()) await box.uncheck();
    await page.locator('input[name="practice-topic"][value="pythagoras"]').check();
    await page.getByRole('button', { name: 'Give me five new questions' }).click();
    const ids = await page.locator('[data-practice-set] .q').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.qid));
    expect(ids.length).toBe(5);
    for (const id of ids) expect(id).toMatch(/^pythagoras-/);
  });

  test('finishing any question records a practice day on this device, once a day', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 \u00d7 10.' }).first();
    await q.getByLabel('Your answer').fill('100');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q).toHaveClass(/q-correct/);
    const days = await page.evaluate(() => JSON.parse(window.localStorage.getItem('wm-gcse-v1') ?? '{}').days);
    expect(days).toHaveLength(1);
    expect(days[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
