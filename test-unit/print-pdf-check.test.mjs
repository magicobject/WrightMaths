import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPdf } from '../scripts/print/pdf-check-lib.mjs';

const page = (text = 'x', width = 612, height = 792) => ({ width, height, text });
const contents = `Contents\n${Array.from({ length: 12 }, (_, i) => `Chapter ${i + 1}  Topic ${i + 1} ${i + 1}`).join('\n')}`;
const index = `Index\n${'fraction 4, 9 numerator 12 '.repeat(60)}`;
const good = { pageCount: 30, pages: [page(contents), ...Array.from({ length: 28 }, () => page()), page(index)], pdfa: true };
const byName = (results, start) => results.find((r) => r.name.startsWith(start));

test('a good export passes every check', () => {
  assert.ok(checkPdf(good).every((r) => r.ok), JSON.stringify(checkPdf(good).filter((r) => !r.ok)));
});

test('wrong page size, too many pages, Error! text, empty Contents or Index and a non-PDF/A file each fail', () => {
  const bad = { ...good, pages: [page(contents, 595, 842), ...good.pages.slice(1, 28), page('Error! Reference source not found.'), page('Index\nnothing')], pdfa: false };
  const r = checkPdf(bad, { limit: 20 });
  for (const start of ['page size', 'page count', 'no "Error!"', 'Index is', 'exported as PDF/A']) assert.equal(byName(r, start).ok, false, start);
  assert.equal(byName(checkPdf({ ...good, pages: [page('Contents\nnothing'), ...good.pages.slice(1)] }), 'Contents').ok, false);
});
