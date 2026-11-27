// Opens built book pages in Chromium with JavaScript OFF, in print media and the light scheme, and turns each into a tree
// (walker-page.js) plus a PNG for every figure. Every request that is not to our own 127.0.0.1 server is blocked.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const WALKER = readFileSync(fileURLToPath(new URL('./walker-page.js', import.meta.url)), 'utf8');
export const FIGURE_SCALE = 3;

export async function openBrowser({ port, mono = false }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 900, height: 1200 },
    deviceScaleFactor: FIGURE_SCALE,
    colorScheme: 'light',
  });
  const blocked = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(`http://127.0.0.1:${port}/`)) return route.continue();
    blocked.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  return { browser, page, blocked, mono, close: () => browser.close() };
}

/**
 * Walk one page. Returns { title, blocks, unknown, qCount, figures: Map(id -> {png, pxWidth, pxHeight, cssWidth}) }.
 * `shape(blocks)` may change the tree first (cleaning, dropping the Higher parts), so only the figures that stay are screenshotted.
 */
export async function capturePage({ page, mono }, url, shape = (blocks) => blocks) {
  const response = await page.goto(url, { waitUntil: 'load' });
  if (!response?.ok()) throw new Error(`could not open ${url} (${response?.status()})`);
  // page.addStyleTag hangs with JavaScript off; evaluate does not.
  const css = `html,body{background:#fff !important;}${mono ? 'svg{filter:grayscale(1);}' : ''}`;
  await page.evaluate(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(css)}; document.head.append(s); })()`);
  const walked = await page.evaluate(`${WALKER}()`);
  const tree = { ...walked, blocks: shape(walked.blocks) };
  const figures = new Map();
  for (const block of allFigs(tree.blocks)) {
    for (const fig of block.figs) {
      const png = await page.locator(`[data-print-fig="${fig.id}"]`).screenshot({ type: 'png' });
      figures.set(fig.id, { png, pxWidth: png.readUInt32BE(16), pxHeight: png.readUInt32BE(20), cssWidth: fig.cssWidth });
    }
  }
  return { ...tree, figures };
}

function* allFigs(blocks) {
  for (const b of blocks ?? []) {
    if (b.t === 'fig') yield b;
    yield* allFigs(b.blocks);
    yield* allFigs(b.body);
    yield* allFigs(b.solution);
    for (const item of b.items ?? []) yield* allFigs(Array.isArray(item) ? item : item.def);
    for (const row of b.rows ?? []) for (const cell of row.cells) yield* allFigs(cell.blocks);
    for (const step of b.ladder ?? []) yield* allFigs(step);
  }
}
