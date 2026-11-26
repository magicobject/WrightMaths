import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPdf, collectImages } from '../scripts/print/pdf-check-lib.mjs';

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

test('a font that is not embedded fails, and so does an image below 300 ppi', () => {
  const withFont = (fonts, images = []) => ({ ...good, pages: good.pages.map((p, i) => (i === 3 ? { ...p, fonts, images } : p)) });
  assert.ok(checkPdf(withFont([{ name: 'Calibri', embedded: true }], [{ ppi: 300 }])).every((r) => r.ok));
  const loose = checkPdf(withFont([{ name: 'Calibri', embedded: true }, { name: 'Arial', embedded: false }]));
  assert.equal(byName(loose, 'every font').ok, false);
  assert.match(byName(loose, 'every font').detail, /Arial/);
  const soft = checkPdf(withFont([], [{ ppi: 299 }, { ppi: 150 }]));
  assert.equal(byName(soft, 'every image').ok, false);
  assert.match(byName(soft, 'every image').detail, /150 ppi on page 4/);
});

test('collectImages works out ppi from the transform in force when the image is drawn', () => {
  const OPS = { save: 1, restore: 2, transform: 3, paintImageXObject: 4 };
  // an image 1800 px wide drawn 432 pt (6 in) wide inside save/restore, then another drawn 1 pt wide with the default transform
  const fn = [OPS.save, OPS.transform, OPS.paintImageXObject, OPS.restore, OPS.paintImageXObject];
  const args = [null, [432, 0, 0, 200, 0, 0], ['img1', 1800, 800], null, ['img2', 1800, 800]];
  const [a, b] = collectImages(fn, args, OPS);
  assert.equal(Math.round(a.ppi), 300);
  assert.equal(Math.round(b.ppi), 129600);
});
