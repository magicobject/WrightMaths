#!/usr/bin/env node
// Walks one page and prints the tree as JSON (the figures as sizes only). Used by the tests and for looking at a page.
//   node scripts/print/walk-page.mjs /books/gcse/fractions.html
//   node scripts/print/walk-page.mjs /__fixtures/print-walker.html
//   node scripts/print/walk-page.mjs /__front/front.html short-answers,first-hint   (the words data-print-if asks for)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capturePage, openBrowser } from './capture.mjs';
import { startServer } from './server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const server = await startServer({ '/__fixtures/': join(root, 'test/fixtures'), '/__front/': join(root, 'src/print/gcse'), '/': join(root, 'public') });
const browser = await openBrowser({ port: server.port });
try {
  const tree = await capturePage(browser, `http://127.0.0.1:${server.port}${process.argv[2]}`, undefined, (process.argv[3] ?? '').split(',').filter(Boolean));
  const jsRan = await browser.page.evaluate("document.documentElement.getAttribute('data-js')");
  const figures = Object.fromEntries([...tree.figures].map(([id, f]) => [id, { pxWidth: f.pxWidth, pxHeight: f.pxHeight, cssWidth: f.cssWidth, bytes: f.png.length }]));
  console.log(JSON.stringify({ ...tree, figures, jsRan, blocked: browser.blocked }));
} finally {
  await browser.close();
  await server.close();
}
