import { test, expect } from './support/fixtures';
import { ALEVEL_PAGES } from './support/alevel-pages';

// On a phone, a formula must not run past the edge of the block that holds it (a long chain of equals signs is split
// into two steps instead). Hidden parts, such as closed "Check my answer" blocks, are opened first so they are measured too.
for (const bookPage of ALEVEL_PAGES) {
  test(`${bookPage.path}: no formula is wider than its container at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(bookPage.path);
    const wide = await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      const out: string[] = [];
      for (const m of document.querySelectorAll('math')) {
        const el = (m.closest('.mw') ?? m) as HTMLElement; // a formula is wrapped in .mw, which scrolls inside itself on a phone
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        const holder = (el.parentElement as HTMLElement).closest('p, li, figcaption, h2, h3, td, th, summary, div') as HTMLElement;
        if (m.closest('.eq')) continue; // a display equation scrolls inside its own box
        const room = holder.getBoundingClientRect().right - parseFloat(getComputedStyle(holder).paddingRight || '0');
        if (box.right > room + 2 || box.right > document.documentElement.clientWidth + 1) {
          out.push(`${Math.round(box.right - room)}px too wide: ${(m.getAttribute('alttext') ?? '').slice(0, 70)}`);
        }
      }
      return out;
    });
    expect(wide).toEqual([]);
  });
}
