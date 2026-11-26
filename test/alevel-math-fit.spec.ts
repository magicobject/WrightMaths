import { test, expect } from './support/fixtures';
import { ALEVEL_PAGES } from './support/alevel-pages';

// On a phone, a formula must not run past the edge of the block that holds it. Long formulas are cut at their equals
// signs (and long pieces at + or -) by the build, so they wrap; a formula that cannot wrap would show up here.
// The page script hides hints, solutions, wrong-answer notes and options until a student asks, so they are forced
// visible first, and closed "Check my answer" blocks are opened. A formula that still has no size is a failure,
// not a skip: it was not measured.
for (const bookPage of ALEVEL_PAGES) {
  test(`${bookPage.path}: no formula is wider than its container at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(bookPage.path);
    await page.addStyleTag({ content: '.ladder, .wrong, .options, .solution, [hidden] { display: block !important; visibility: visible !important; }' });
    const problems = await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      const out: string[] = [];
      for (const m of document.querySelectorAll('math')) {
        const el = (m.closest('.mw') ?? m) as HTMLElement; // .mw keeps a formula and its punctuation on one line
        const box = el.getBoundingClientRect();
        const name = (m.getAttribute('alttext') ?? '').slice(0, 70);
        if (box.width === 0) { out.push(`not measured (no size): ${name}`); continue; }
        if (m.closest('.eq')) continue; // a display equation scrolls inside its own box
        const holder = (el.parentElement as HTMLElement).closest('p, li, figcaption, h2, h3, td, th, summary, div') as HTMLElement;
        const room = holder.getBoundingClientRect().right - parseFloat(getComputedStyle(holder).paddingRight || '0');
        if (box.right > room + 2 || box.right > document.documentElement.clientWidth + 1) out.push(`${Math.round(box.right - room)}px too wide: ${name}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });
}
