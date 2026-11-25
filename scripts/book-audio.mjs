// Recorded audio for the GCSE book's Listen buttons. Run `npm run book:audio -- help`.
// It finds every sentence a Listen button reads (by opening the real pages in a
// browser, so the text is exactly what the page speaks), compares that with the
// recordings in public/audio/book/, and helps fill the gaps with a speech engine
// of your choice or with Greg's own recordings.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { buildManifest, missingUnits, orphanClips, scriptSheet, unitForRecording, engineCommand, reviewPage } from './book-audio-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const CLIPS = join(PUBLIC, 'audio', 'book');
const WORK = join(ROOT, 'audio-work');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = resolve(PUBLIC, `.${path}`);
    if (!file.startsWith(PUBLIC + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

// --pages=shapes-angles,place-value limits everything to those book pages (a pilot, or one topic at a time).
const pageFilter = (process.argv.find((a) => a.startsWith('--pages=')) ?? '').slice(8).split(',').filter(Boolean);

async function collectUnits() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const pages = readdirSync(join(PUBLIC, 'books', 'gcse'))
    .filter((f) => f.endsWith('.html') && (!pageFilter.length || pageFilter.includes(f.replace(/\.html$/, ''))))
    .sort();
  if (pageFilter.length && !pages.length) throw new Error(`no book page matches --pages=${pageFilter.join(',')}`);
  const browser = await chromium.launch();
  const seen = new Map();
  try {
    const page = await browser.newPage();
    for (const name of pages) {
      await page.goto(`${base}/books/gcse/${name}`);
      const units = await page.evaluate(async () => (await import('/js/book-audio.mjs')).speechUnits(document));
      for (const u of units) if (!seen.has(u.hash)) seen.set(u.hash, u);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return [...seen.values()];
}

// Every Listen sentence on every page (not de-duplicated), with the words as written beside the words the voice is given.
async function collectReview() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const pages = readdirSync(join(PUBLIC, 'books', 'gcse'))
    .filter((f) => f.endsWith('.html') && (!pageFilter.length || pageFilter.includes(f.replace(/\.html$/, ''))))
    .sort();
  const browser = await chromium.launch();
  const rows = [];
  try {
    const page = await browser.newPage();
    for (const name of pages) {
      await page.goto(`${base}/books/gcse/${name}`);
      const found = await page.evaluate(async () => {
        const { unitText, hashText } = await import('/js/book-audio.mjs');
        return [...document.querySelectorAll('.qtext, .key')].map((node) => {
          const shown = node.cloneNode(true);
          shown.querySelectorAll('.listen, .qnum, .term-pop').forEach((n) => n.remove());
          const spoken = unitText(node);
          return { display: shown.textContent, spoken, hash: hashText(spoken), says: node.hasAttribute('data-say') };
        }).filter((r) => r.spoken);
      });
      for (const r of found) rows.push({ page: name.replace(/\.html$/, ''), ...r });
    }
  } finally {
    await browser.close();
    server.close();
  }
  return rows;
}

function clipFiles() {
  return existsSync(CLIPS) ? readdirSync(CLIPS) : [];
}

function writeManifest() {
  const manifest = buildManifest(clipFiles());
  mkdirSync(CLIPS, { recursive: true });
  writeFileSync(join(CLIPS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

const [command = 'help', ...args] = process.argv.slice(2);

if (command === 'status') {
  const units = await collectUnits();
  const manifest = buildManifest(clipFiles());
  const missing = missingUnits(units, manifest);
  const chars = missing.reduce((n, u) => n + u.text.length, 0);
  console.log(`${units.length} sentences are read by Listen buttons; ${units.length - missing.length} have a recording, ${missing.length} do not (${chars} characters).`);
  const orphans = orphanClips(units, manifest);
  if (orphans.length) console.log(`${orphans.length} recording(s) no longer match any text (the sentence changed): ${orphans.join(', ')}`);
} else if (command === 'todo') {
  const units = await collectUnits();
  const manifest = buildManifest(clipFiles());
  const missing = new Set(missingUnits(units, manifest).map((u) => u.hash));
  const all = process.argv.includes('--all'); // every sentence, to re-make clips that already exist (after a change of gap or voice)
  const sheet = scriptSheet(units).filter((r) => all || missing.has(r.hash));
  mkdirSync(WORK, { recursive: true });
  writeFileSync(join(WORK, 'script.json'), `${JSON.stringify(sheet, null, 2)}\n`);
  writeFileSync(join(WORK, 'script.txt'), sheet.map((r) => `${r.number}  ${r.text}`).join('\n\n') + '\n');
  console.log(`${sheet.length} sentences still need a recording. Reading script: audio-work/script.txt`);
} else if (command === 'review') {
  const manifest = buildManifest(clipFiles());
  const rows = (await collectReview()).map((r) => ({ ...r, recorded: Boolean(manifest[r.hash]) }));
  mkdirSync(WORK, { recursive: true });
  writeFileSync(join(WORK, 'review.html'), reviewPage(rows, { generated: new Date().toISOString().slice(0, 10) }));
  console.log(`${rows.length} sentences. Open audio-work/review.html to read what the voice is given beside what is written.`);
} else if (command === 'make') {
  const template = process.env.WM_TTS_CMD;
  const ext = (process.env.WM_TTS_EXT ?? 'wav').toLowerCase();
  const limit = Number(args.find((a) => !a.startsWith('--')) ?? Infinity);
  const units = await collectUnits();
  const todo = missingUnits(units, buildManifest(clipFiles())).slice(0, limit);
  mkdirSync(CLIPS, { recursive: true });
  let made = 0;
  for (const u of todo) {
    const out = join(CLIPS, `${u.hash}.${ext}`);
    const run = spawnSync(engineCommand(template, out), { shell: true, input: u.text, stdio: ['pipe', 'inherit', 'inherit'] });
    if (run.status !== 0 || !existsSync(out)) { console.error(`engine failed for ${u.hash}`); process.exitCode = 1; break; }
    made += 1;
  }
  writeManifest();
  console.log(`made ${made} recording(s); manifest updated.`);
} else if (command === 'import') {
  const dir = resolve(args.find((a) => !a.startsWith('--')) ?? '');
  const sheet = JSON.parse(readFileSync(join(WORK, 'script.json'), 'utf8'));
  mkdirSync(CLIPS, { recursive: true });
  let n = 0;
  for (const name of readdirSync(dir)) {
    const hit = unitForRecording(sheet, name);
    if (!hit) { console.log(`skipped ${name}`); continue; }
    copyFileSync(join(dir, name), join(CLIPS, `${hit.hash}.${hit.ext}`));
    n += 1;
  }
  writeManifest();
  console.log(`imported ${n} recording(s); manifest updated.`);
} else if (command === 'prune') {
  // Delete recordings whose sentence no longer exists (it was edited or removed). Needs every page, so no --pages.
  if (pageFilter.length) throw new Error('prune looks at the whole book: run it without --pages');
  const units = await collectUnits();
  const manifest = buildManifest(clipFiles());
  const orphans = orphanClips(units, manifest);
  for (const hash of orphans) unlinkSync(join(CLIPS, manifest[hash]));
  writeManifest();
  console.log(`removed ${orphans.length} out-of-date recording(s); manifest updated.`);
} else if (command === 'manifest') {
  console.log(`manifest lists ${Object.keys(writeManifest()).length} recording(s).`);
} else {
  console.log(`npm run book:audio -- <command>

  status      how many Listen sentences have a recording, and which recordings are out of date
  todo        write audio-work/script.txt: the numbered sentences that still need recording (--all: every sentence)
  review      write audio-work/review.html: every sentence as written beside what the voice is given, differences marked
  make [n]    make recordings with a speech engine. Set WM_TTS_CMD to the engine command, which reads the
              sentence on standard input and writes {out}; set WM_TTS_EXT (wav, mp3, m4a, ogg).
              Example:  WM_TTS_CMD='piper --model voice.onnx --output_file {out}'  WM_TTS_EXT=wav
  import dir  copy recordings named by script number (001.mp3, 002.mp3 ...) into the book
  prune       delete recordings whose sentence was edited or removed (whole book only)
  manifest    rebuild public/audio/book/manifest.json from the files there
  Add --pages=place-value,shapes-angles to status, todo or make to work on just those pages.
  Many sentences at once with Piper: python scripts/piper-batch.py --voice <voice.onnx> (reads audio-work/script.json).

Recordings live in public/audio/book/ and are matched to sentences by the text they say, so editing a
sentence makes its recording stop playing (the browser voice reads it instead) until it is re-recorded.`);
}
