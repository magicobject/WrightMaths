import { test, expect } from './support/fixtures';
import { ALEVEL_PAGES, ALEVEL_TOPICS } from './support/alevel-pages';

// Layout rules for the A-level book at the narrowest supported width (320px).

test.describe('A-level pages at 320px', () => {
  for (const bookPage of ALEVEL_PAGES) {
    test(`${bookPage.path} does not scroll sideways`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(bookPage.path);
      // Hints, solutions, wrong-answer notes and options are hidden until a student asks: show them so they are measured.
      await page.addStyleTag({ content: '.ladder, .wrong, .options, .solution, [hidden] { display: block !important; visibility: visible !important; }' });
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      const wide = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        // elements wider than the screen that are not inside a box that scrolls on its own
        culprits: [...document.querySelectorAll('main *')]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .filter((el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return false; } return true; })
          .slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${el.className} right=${Math.round(el.getBoundingClientRect().right)} in "${(el.closest('p,li,div,figcaption,summary')?.textContent ?? '').slice(0, 50)}"`),
      }));
      expect(wide.culprits, 'elements wider than the screen').toEqual([]);
      expect(wide.scrollWidth).toBeLessThanOrEqual(320);
    });
  }
});

test.describe('A-level maths markup', () => {
  for (const bookPage of ALEVEL_PAGES) {
    test(`${bookPage.path}: no word in an equation is read as separate letters`, async ({ page }) => {
      await page.goto(bookPage.path);
      // sqrt written without a bracket or a sign (asqrt) is drawn as the letters s, q, r, t.
      const spelt = await page.evaluate(() => [...document.querySelectorAll('main math')].filter((m) => {
        const letters = [...m.querySelectorAll('mi')].map((mi) => mi.textContent).join(',');
        return /(^|,)s,q,r,t(,|$)/.test(letters) || /(^|,)s,i,n(,|$)/.test(letters) || /(^|,)c,o,s(,|$)/.test(letters);
      }).map((m) => m.getAttribute('alttext') ?? m.textContent));
      expect(spelt).toEqual([]);
    });
  }
});

// Only pages whose figures have been fixed are listed. The older topic pages still have overlapping labels
// (for example a y-axis letter over the equation above the graph); add each page here when its figures are fixed.
const FIGURES_CHECKED = ['/courses/a-level/circles.html', '/courses/a-level/trig-triangles.html', '/courses/a-level/exponentials-logs.html', '/courses/a-level/vectors-2d.html', '/courses/a-level/graphs-polynomials.html', '/courses/a-level/trig-graphs.html', '/courses/a-level/exp-modelling.html', '/courses/a-level/differentiation-applications.html', '/courses/a-level/definite-integrals.html', '/courses/a-level/trig-identities.html'];

test.describe('A-level figures at 320px', () => {
  for (const bookPage of ALEVEL_TOPICS.filter((t) => FIGURES_CHECKED.includes(t.path))) {
    test(`${bookPage.path}: no two labels in a figure overlap`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(bookPage.path);
      const overlaps = await page.evaluate(() => {
        const out: string[] = [];
        for (const svg of document.querySelectorAll('main svg.graph-svg')) {
          const texts = [...svg.querySelectorAll('text')].map((t) => ({ t, b: t.getBoundingClientRect(), s: (t.textContent ?? '').trim() })).filter((x) => x.s);
          for (let i = 0; i < texts.length; i += 1) {
            for (let j = i + 1; j < texts.length; j += 1) {
              const a = texts[i].b;
              const b = texts[j].b;
              const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (w > 1 && h > 1) out.push(`${svg.querySelector('title')?.textContent}: "${texts[i].s}" overlaps "${texts[j].s}"`);
            }
          }
        }
        return out;
      });
      expect(overlaps).toEqual([]);
    });
  }
});
