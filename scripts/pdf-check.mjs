#!/usr/bin/env node
// Checks the PDF you exported from Word:  npm run book:pdf-check -- path/to/gcse-book.pdf [--limit 828]
import { readFileSync } from 'node:fs';
import { checkPdf, collectImages, fontIsEmbedded, KDP_PAGE_LIMITS } from './print/pdf-check-lib.mjs';

const args = process.argv.slice(2);
const limitAt = args.indexOf('--limit');
const limit = limitAt >= 0 ? Number(args[limitAt + 1]) : KDP_PAGE_LIMITS[0];
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--limit');
if (!file) {
  console.error('Usage: npm run book:pdf-check -- path/to/gcse-book.pdf [--limit 828]');
  process.exit(2);
}

const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), useSystemFonts: false }).promise;
const pages = [];
for (let i = 1; i <= doc.numPages; i += 1) {
  const page = await doc.getPage(i);
  const [x0, y0, x1, y1] = page.view;
  const content = await page.getTextContent();
  let text = '';
  for (const item of content.items) text += item.str + (item.hasEOL ? '\n' : '');
  const ops = await page.getOperatorList();
  const fonts = [];
  for (let k = 0; k < ops.fnArray.length; k += 1) {
    if (ops.fnArray[k] !== OPS.setFont) continue;
    const id = ops.argsArray[k][0];
    if (fonts.some((f) => f.id === id)) continue;
    const font = await new Promise((ok) => { page.commonObjs.get(id, ok); });
    fonts.push({ id, name: font?.name ?? id, embedded: font ? fontIsEmbedded(font) : false });
  }
  pages.push({ width: x1 - x0, height: y1 - y0, text, fonts, images: collectImages(ops.fnArray, ops.argsArray, OPS) });
}
const meta = await doc.getMetadata().catch(() => null);
const pdfa = /pdfaid/i.test(meta?.metadata?.getRaw?.() ?? '');
const results = checkPdf({ pageCount: doc.numPages, pages, pdfa }, { limit });
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}: ${r.detail}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
