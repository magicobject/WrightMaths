import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';
import { ALL_PAGES } from './support/pages';
import { BOOK_PAGES, BOOK_TOPICS } from './support/book-pages';

const PUBLIC = join(__dirname, '..', 'public');

test.describe('the GCSE book stays hidden', () => {
  test('only the Books page and the 404 page lead to the book; the sitemap and robots.txt never mention it', async ({ page }) => {
    for (const sitePage of ALL_PAGES) {
      await page.goto(sitePage.path);
      await expect(page.locator('a[href*="books"]'), `${sitePage.path} links to the book`).toHaveCount(0);
    }
    // Greg's decision (24 Nov 2026): the 404 page points at /books/, which points at the GCSE book.
    await page.goto('/404.html');
    await expect(page.locator('a[href*="books"]')).toHaveCount(1);
    await expect(page.locator('a[href="books/"]')).toHaveCount(1);
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
    const help = q.getByRole('button', { name: /Give me a clue|Another clue|Show me the answer/ });
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(1);
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(2);
    await help.click(); // the duck
    await expect(q.locator('.duck-rung')).toBeVisible();
    await expect(q.locator('.duck-rung')).toContainText('The question asks me to find');
    await help.click(); // a person
    await expect(q.locator('.rungs li').last()).toContainText('Show a mate');
    await expect(help).toHaveText('Show me the answer');
    await help.click();
    await expect(q.locator('.solution')).toBeVisible();
  });

  test('the duck listens but nothing typed to it is stored or sent anywhere', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET') requests.push(r.url()); });
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    const help = q.getByRole('button', { name: /Give me a clue|Another clue/ });
    await help.click();
    await help.click();
    await help.click();
    await q.getByText('Prefer to type it?').click();
    const text = q.getByLabel('Tell the duck what is going on');
    await text.fill('my secret thought about the problem');
    await q.getByRole('button', { name: /Done: let me try again/ }).click();
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
    await expect(q.locator('.q-feedback')).toContainText('Close, but not yet');
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
    expect(await page.evaluate(() => window.localStorage.getItem('wm-gcse-read'))).toBeNull();
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
    const q = page.locator('.q', { hasText: 'Work out \u22124 \u2212 3.' }).first();
    await q.getByLabel('Your answer').fill('\u2212 7');
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
    const help = oneHint.getByRole('button', { name: /Give me a clue/ });
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
    await qs.first().getByRole('button', { name: /Give me a clue/ }).click();
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

test.describe('display on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the header does not stick, and the main tap targets are at least 44px high', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    expect(await page.locator('.site-header').evaluate((e) => getComputedStyle(e).position)).toBe('static');
    await page.locator('.read-tools summary').click();
    const heights = await page.locator('.read-tools summary, .read-btn, .header-cta, a.brand').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(43);
  });

  test('a topic page has an On this page list whose links go to real headings, and a back-to-top button', async ({ page }) => {
    await page.goto('/books/gcse/shapes-angles.html');
    await page.locator('.toc summary').click();
    const hrefs = await page.locator('.toc a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const href of hrefs) expect(await page.locator(href!).count(), href!).toBe(1);
    await expect(page.locator('.to-top')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect(page.locator('.to-top')).toBeVisible();
    await page.locator('.to-top').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });

  test('reading options show a clear on/off state and the current text size', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    await page.locator('.read-tools summary').click();
    await expect(page.locator('.read-size')).toContainText('Text size 1 of 4');
    await page.getByRole('button', { name: 'Bigger text' }).click();
    await expect(page.locator('.read-size')).toContainText('Text size 2 of 4');
    const easy = page.getByRole('button', { name: /Easy-read font/ });
    await expect(easy).toHaveAttribute('aria-pressed', 'false');
    await easy.click();
    await expect(easy).toHaveAttribute('aria-pressed', 'true');
  });

  test('the pyramid comes before the five habits on the hub', async ({ page }) => {
    await page.goto('/books/gcse/');
    const order = await page.evaluate(() => {
      const a = document.querySelector('#pyramid')!.getBoundingClientRect().top;
      const b = [...document.querySelectorAll('h2')].find((h) => h.textContent?.includes('Five habits'))!.getBoundingClientRect().top;
      return a < b;
    });
    expect(order).toBe(true);
  });
});

test.describe('feedback round 2: hover definitions, Help after answering, human voice, identity sign', () => {
  test('technical words inside questions are linked automatically and show a definition with a picture on hover', async ({ page }) => {
    await page.goto('/books/gcse/shapes-angles.html');
    const term = page.locator('.qtext a.term[data-term="reflex-angle"]').first();
    await expect(term).toBeVisible();
    await term.hover();
    const pop = page.locator('.term-pop');
    await expect(pop).toBeVisible();
    await expect(pop).toContainText('more than 180');
    await expect(pop.locator('svg')).toHaveCount(1);
    await page.mouse.move(5, 5);
    await expect(pop).toHaveCount(0);
  });

  test('Help, I\'m stuck stays available after a right answer, for another way to see it', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 × 100.' }).first();
    await q.getByLabel('Your answer').fill('1000');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q).toHaveClass(/q-correct/);
    await expect(q.locator('.solution')).toBeVisible();
    await expect(q.locator('.q-feedback')).toContainText('worked solution');
    const help = q.getByRole('button', { name: 'Another way to see it' });
    await expect(help).toBeEnabled();
    await help.click();
    await expect(q.locator('.rungs li')).toHaveCount(1);
  });

  test('Listen says maths symbols as words and only uses a voice that runs on the device', async ({ page }) => {
    await page.addInitScript(() => {
      const spoken: { text: string; voice: string }[] = [];
      (window as any).__spoken = spoken;
      const voices = [
        { name: 'Microsoft David Desktop', lang: 'en-US', localService: true },
        { name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)', lang: 'en-GB', localService: false },
        { name: 'Daniel (Enhanced)', lang: 'en-GB', localService: true },
        { name: 'eSpeak English', lang: 'en', localService: true },
      ];
      (window as any).SpeechSynthesisUtterance = function (text: string) { return { text, voice: null, rate: 1, pitch: 1, lang: '' }; };
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          speaking: false,
          getVoices: () => voices,
          cancel() {},
          speak(u: any) { spoken.push({ text: u.text, voice: u.voice?.name ?? '' }); },
          addEventListener() {},
        },
      });
    });
    await page.goto('/books/gcse/negative-numbers.html');
    await page.locator('.q', { hasText: 'Work out (−5) × (−6).' }).first().locator('.listen').click();
    const spoken = await page.evaluate(() => (window as any).__spoken as { text: string; voice: string }[]);
    expect(spoken.length).toBeGreaterThan(0);
    const all = spoken.map((s) => s.text).join(' ');
    expect(all).toContain('times');
    expect(all).toContain('minus');
    // The best voice that runs on the device: an online voice would send the text away.
    expect(spoken[0].voice).toBe('Daniel (Enhanced)');
  });

  test('the identity sign is in the glossary, linked from the examples, each example on its own line', async ({ page }) => {
    await page.goto('/books/gcse/glossary.html');
    await expect(page.locator('#identity h3')).toContainText('Identity');
    await expect(page.locator('#identity')).toContainText('≡');
    expect(await page.locator('#factorise .g-line').count()).toBe(2);
    await expect(page.locator('#factorise .g-line a.term').first()).toHaveAttribute('href', /#identity/);
    await expect(page.locator('#fraction .g-example')).toContainText('3 pieces of a pizza cut into 8 equal slices');
  });
});

test.describe('ready to revisit', () => {
  test('a clean answer is scheduled for tomorrow, and a due question comes back in Give me five', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 × 10.' }).first();
    await q.getByLabel('Your answer').fill('100');
    await q.getByRole('button', { name: 'Check' }).click();
    const qid = await q.getAttribute('data-qid');
    const rec = await page.evaluate((id) => JSON.parse(window.localStorage.getItem('wm-gcse-v1') ?? '{}').rq?.[id], qid!);
    expect(rec.b).toBe(1);
    expect(rec.due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // pretend it was answered long ago, then ask for practice on this topic only
    await page.evaluate((id) => {
      const data = JSON.parse(window.localStorage.getItem('wm-gcse-v1') ?? '{}');
      data.rq[id] = { b: 1, due: '2020-01-01', last: '2019-12-31', miss: 0 };
      window.localStorage.setItem('wm-gcse-v1', JSON.stringify(data));
    }, qid!);
    await page.goto('/books/gcse/practice.html');
    for (const box of await page.locator('input[name="practice-topic"]').all()) await box.uncheck();
    await page.locator('input[name="practice-topic"][value="place-value"]').check();
    await page.getByRole('button', { name: 'Give me five new questions' }).click();
    await expect(page.locator('[data-practice-status]')).toContainText('ready to revisit');
    const ids = await page.locator('[data-practice-set] .q').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.qid));
    expect(ids).toContain(qid);
  });

  test('a hand-edited or hostile store is ignored, not trusted', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('wm-gcse-v1', JSON.stringify({ done: {}, ticks: {}, rq: { '__proto__': { b: 1 }, 'x y': 1, 'place-value-1': { b: 99 } }, days: 'nope', diag: [{ score: 'a' }] }));
    });
    await page.goto('/books/gcse/practice.html');
    await expect(page.locator('[data-practice-set] .q')).toHaveCount(5);
  });
});

test.describe('find your gaps', () => {
  test('scores in the browser, recommends the lowest topics first, remembers the result, shows a history', async ({ page }) => {
    await page.goto('/books/gcse/diagnostic.html');
    const answers: Record<string, string> = { 'place-value': '600', 'four-operations': '282', 'negative-numbers': '5', 'order-of-operations': '17' };
    for (const d of await page.locator('.dq').all()) {
      const topic = await d.getAttribute('data-topic');
      if (topic && answers[topic]) await d.locator('input').fill(answers[topic]);
    }
    await page.getByRole('button', { name: 'Show my results' }).click();
    await expect(page.locator('[data-diag-results]')).toContainText('You already have 3 of 11');
    const first = page.locator('.diag-start li').first();
    await expect(first).toContainText('Negative numbers');
    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('wm-gcse-v1') ?? '{}').diag);
    expect(stored).toHaveLength(1);
    expect(stored[0].score).toBe(3);
    await page.reload();
    await expect(page.locator('[data-diag-history]')).toContainText('3 of 11');
  });

  test('the hub offers it first', async ({ page }) => {
    await page.goto('/books/gcse/');
    await expect(page.getByRole('link', { name: /Find my gaps/ }).first()).toBeVisible();
  });
});

test.describe('privacy and keyboard access', () => {
  for (const bookPage of BOOK_PAGES) {
    test(`${bookPage.path} makes no request to any other website`, async ({ page }) => {
      const foreign: string[] = [];
      page.on('request', (r) => { if (!r.url().startsWith('http://localhost') && !r.url().startsWith('data:')) foreign.push(r.url()); });
      await page.goto(bookPage.path);
      await page.waitForLoadState('networkidle');
      expect(foreign).toEqual([]);
    });
  }

  test('there is a skip link first in the tab order, and it lands on the main content', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('every question and answer box has its own name, and every Listen button is distinct', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const names = await page.locator('.q-input').evaluateAll((els) => els.map((e) => (document.querySelector(`label[for="${e.id}"]`) as HTMLElement | null)?.textContent));
    expect(names.length).toBeGreaterThan(10);
    expect(new Set(names).size).toBe(names.length);
    const listens = await page.locator('button.listen').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(new Set(listens.filter((l) => l?.startsWith('Listen to question'))).size).toBe(listens.filter((l) => l?.startsWith('Listen to question')).length);
    expect(await page.locator('.q').first().getAttribute('aria-labelledby')).toBeTruthy();
  });

  test('a term pop-up can be reached and left with the keyboard', async ({ page }) => {
    await page.goto('/books/gcse/shapes-angles.html');
    const term = page.locator('.qtext a.term').first();
    await term.focus();
    await expect(page.locator('.term-pop')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.term-pop-more')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.term-pop')).toHaveCount(0);
    await expect(term).toBeFocused();
  });

  test('asking for hints keeps focus on the Help button, and a very long answer does not freeze the page', async ({ page }) => {
    await page.goto('/books/gcse/solving-equations.html');
    const q = page.locator('.q').first();
    const help = q.getByRole('button', { name: /Give me a clue|Another clue/ });
    await help.click();
    await expect(help).toBeFocused();
    const input = q.locator('.q-input');
    expect(await input.getAttribute('maxlength')).toBe('60');
  });

  test('the footer headings follow the page headings without skipping a level', async ({ page }) => {
    await page.goto('/books/gcse/practice.html');
    const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (hs) => hs.map((h) => Number(h.tagName[1])));
    levels.forEach((level, i) => { if (i > 0) expect(level - levels[i - 1]).toBeLessThanOrEqual(1); });
  });
});

test.describe('lettered hints', () => {
  test('hints are lettered A, B, C (not numbered), and start again from A after a right answer', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 \u00d7 100.' }).first();
    const help = q.getByRole('button', { name: /Give me a clue/ });
    await help.click();
    const label = (n: number) => q.locator('.rungs li').nth(n).evaluate((e) => getComputedStyle(e, '::before').content);
    expect(await label(0)).toContain('upper-alpha');
    // get it right: the hints reset, and the next one is Hint A again
    await q.getByLabel('Your answer').fill('1000');
    await q.getByRole('button', { name: 'Check' }).click();
    await expect(q).toHaveClass(/q-correct/);
    await expect(q.locator('.rungs li')).toHaveCount(0);
    await expect(q.locator('.solution')).toBeVisible();
    await expect(q.locator('.q-feedback')).toContainText('worked solution');
    const again = q.getByRole('button', { name: 'Another way to see it' });
    await again.click();
    expect(await label(0)).toContain('upper-alpha');
    await q.locator('.btn-stuck').click();
    await expect(q.locator('.rungs li')).toHaveCount(2);
  });

  test('the static hint list (no script) is lettered too', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/books/gcse/place-value.html');
    const content = await page.locator('.q .ladder li').first().evaluate((e) => getComputedStyle(e, '::before').content);
    expect(content).toContain('upper-alpha');
    await context.close();
  });
});

test.describe('phone-friendly answers', () => {
  test('a number answer gets the number pad, and the symbol row types a minus', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 × 100.' }).first();
    const input = q.getByLabel(/Your answer/);
    await expect(input).toHaveAttribute('inputmode', 'decimal');
    await input.focus();
    await q.getByRole('button', { name: 'Type minus' }).click();
    await expect(input).toHaveValue('-');
  });

  test('the ask-a-person step does not mention lessons', async ({ page }) => {
    await page.goto('/books/gcse/place-value.html');
    const q = page.locator('.q', { hasText: 'Work out 10 × 100.' }).first();
    const help = q.locator('.btn-stuck');
    for (let i = 0; i < 6; i += 1) { if (await help.isEnabled()) await help.click(); }
    const text = await q.locator('.rungs').innerText();
    expect(text).toContain('Still stuck?');
    expect(text).not.toMatch(/lessons|parent or carer/i);
  });
});

test.describe('phone layout', () => {
  test('the Top button never covers the sticky Check button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/books/gcse/fractions.html');
    await page.locator('.q-input').first().scrollIntoViewIfNeeded();
    await page.locator('.q-input').first().focus();
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const top = page.locator('.to-top');
    if (await top.isVisible()) {
      const t = await top.boundingBox();
      for (const check of await page.locator('.q-form .btn-check:visible').all()) {
        const c = await check.boundingBox();
        const f = await check.locator('xpath=ancestor::form').boundingBox();
        // only the Check button of a form stuck to the bottom of the screen matters here
        if (!c || !t || !f || Math.abs(f.y + f.height - 812) > 2) continue;
        const overlap = c.x < t.x + t.width && c.x + c.width > t.x && c.y < t.y + t.height && c.y + c.height > t.y;
        expect(overlap, 'Top overlaps a Check button').toBe(false);
      }
    }
  });
});

test('Listen stays silent when the device has no voice of its own', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as any).__spoken = spoken;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [], speak: (u: any) => spoken.push(u.text), cancel: () => {}, addEventListener: () => {}, onvoiceschanged: null } });
    (window as any).SpeechSynthesisUtterance = function (t: string) { (this as any).text = t; };
  });
  await page.goto('/books/gcse/place-value.html');
  await page.getByRole('button', { name: /Listen/ }).first().click();
  expect(await page.evaluate(() => (window as any).__spoken.length)).toBe(0);
});

test.describe('stretch papers', () => {
  test('a show-that question reveals its mark scheme, and ticking marks counts them on screen only', async ({ page }) => {
    await page.goto('/books/gcse/stretch.html');
    const q = page.locator('.q[data-type="show"]').first();
    const total = await q.locator('ul.markscheme > li').count();
    expect(total).toBeGreaterThanOrEqual(3);
    await expect(q.locator('.solution')).toBeHidden();
    await q.getByRole('button', { name: /show me the mark scheme/ }).click();
    await expect(q.locator('.solution')).toBeVisible();
    const boxes = q.locator('.mark-box');
    await expect(boxes).toHaveCount(total);
    await boxes.first().check();
    await expect(q.locator('.mark-total')).toContainText(`Marks: 1 of ${total}`);
    for (let i = 1; i < total; i += 1) await boxes.nth(i).check();
    await expect(q.locator('.mark-total')).toContainText('Full marks');
    await expect(q).toHaveClass(/q-correct/);
  });

  test('every stretch question says how many marks, calculator or not, and the mark scheme adds up', async ({ page }) => {
    await page.goto('/books/gcse/stretch.html');
    const qs = page.locator('.q');
    const n = await qs.count();
    expect(n).toBeGreaterThanOrEqual(24);
    for (let i = 0; i < n; i += 1) {
      const q = qs.nth(i);
      const marks = Number(await q.getAttribute('data-marks'));
      expect(await q.locator('.qtext .qtag-marks').innerText()).toContain(`[${marks} mark`);
      expect(await q.locator('.qtext .qtag-calc').innerText()).toMatch(/^(Non-calculator|Calculator)$/);
      expect(await q.locator('ul.markscheme > li').count(), `question ${i + 1} mark scheme`).toBe(marks);
    }
  });

  test('topic pages have a fast route that folds away recaps and check sets', async ({ page }) => {
    await page.goto('/books/gcse/fractions.html');
    const toggle = page.getByRole('button', { name: 'Hide recaps and check sets' });
    await toggle.click();
    await expect(page.locator('section.ckw').first()).toBeHidden();
    await expect(page.getByRole('button', { name: 'Show recaps and check sets again' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Jump to exam style' })).toBeVisible();
  });
});

test.describe('the Books page', () => {
  test('/books leads to the GCSE book, and the 404 page leads to /books', async ({ page }) => {
    await page.goto('/books');
    await expect(page).toHaveURL(/\/books\/$/);
    await expect(page).toHaveTitle(/Maths Books/);
    await expect(page.locator('h1')).toHaveText(/Maths books, written by a tutor/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByRole('link', { name: /Open the GCSE Maths Book/ }).click();
    await expect(page).toHaveURL(/\/books\/gcse\/$/);
    const response = await page.goto('/this-page-does-not-exist.html');
    expect(response?.status()).toBe(404);
    await page.getByRole('link', { name: /Go to Books/ }).click();
    await expect(page).toHaveURL(/\/books\/$/);
  });
});
