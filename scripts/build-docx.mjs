#!/usr/bin/env node
// Builds the GCSE book as one Word file: dist/gcse-book.docx (and dist/print-report.json). See docs/print-edition.md.
//
//   npm run book:docx                      the whole book
//   node scripts/build-docx.mjs --pages fractions,percentages      just those chapters (used by the tests)
//   --mono        greyscale figures and box shading
//   --release     fail if any placeholder or any report is not empty
//   --no-hints    leave the Hints section out        --no-slips   leave the "If you got..." lines out
//   --out FILE    where to write the .docx           --report FILE   where to write the report

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Packer } from 'docx';
import { TOPICS } from '../src/book/topics.mjs';
import { GLOSSARY } from '../src/book/glossary.mjs';
import { buildGraph, extractKey } from './book-lib.mjs';
import { buildChapters } from './print/chapters.mjs';
import { capturePage, openBrowser } from './print/capture.mjs';
import { patchSettings } from './print/docx-settings.mjs';
import { allTexts, buildDocument, cleanTree, makeContext } from './print/render.mjs';
import { startServer } from './print/server.mjs';
import { reportScreenWords } from './print-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAPERS = [
  { id: 'foundation', title: 'Practice papers for grades 4 to 6' },
  { id: 'stretch', title: 'Grade 7 to 9 stretch papers' },
  // Not a paper, but every topic's exam section points to it ("Question words explained"), so it is printed as the last chapter.
  { id: 'command-words', title: 'Question words explained' },
];
const COLOUR_WORDS = /\b(red|blue|green|yellow|pink|orange|purple|brown|teal|gold)\b/i;
const PLACEHOLDER = /\[[A-Z][A-Z ]*[A-Z]\]/g;
/** Count the [PLACEHOLDER] markers in a list of strings. */
export function placeholdersIn(strings) {
  const found = {};
  for (const s of strings) for (const p of String(s).match(PLACEHOLDER) ?? []) found[p] = (found[p] ?? 0) + 1;
  return found;
}

export const PROPERTIES = { creator: '[IMPRINT]', lastModifiedBy: '[IMPRINT]', title: '[TITLE]', subject: 'GCSE Maths', description: 'GCSE maths book, print edition' };

export function parseArgs(argv) {
  const opts = { pages: null, mono: false, release: false, noHints: false, noSlips: false, out: join(root, 'dist/gcse-book.docx'), report: join(root, 'dist/print-report.json') };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pages') opts.pages = argv[(i += 1)].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--mono') opts.mono = true;
    else if (a === '--release') opts.release = true;
    else if (a === '--no-hints') opts.noHints = true;
    else if (a === '--no-slips') opts.noSlips = true;
    else if (a === '--out') opts.out = resolve(argv[(i += 1)]);
    else if (a === '--report') opts.report = resolve(argv[(i += 1)]);
    else throw new Error(`unknown option ${a}`);
  }
  return opts;
}

export function collect(node, test, out = []) {
  if (Array.isArray(node)) { for (const n of node) collect(n, test, out); return out; }
  if (!node || typeof node !== 'object') return out;
  if (test(node)) out.push(node);
  for (const v of Object.values(node)) if (typeof v === 'object') collect(v, test, out);
  return out;
}

const read = (path) => readFileSync(join(root, path), 'utf8');

/** Open every page, walk it, check it. Returns what the renderer needs, plus the walker's own findings. */
async function gather(opts, chosen, ctx) {
  const server = await startServer({ '/__front/': join(root, 'src/print/gcse'), '/': join(root, 'public') });
  const browser = await openBrowser({ port: server.port, mono: opts.mono });
  const unknown = [];
  const mismatches = [];
  const walk = async (url, name) => {
    const tree = await capturePage(browser, `http://127.0.0.1:${server.port}${url}`);
    for (const u of tree.unknown) unknown.push({ page: name, ...u });
    ctx.page = name;
    return { ...tree, blocks: cleanTree(tree.blocks, ctx) };
  };
  try {
    const f = await walk('/__front/front.html', 'front');
    const front = { tree: { blocks: f.blocks }, figures: f.figures };
    for (const c of chosen) {
      const t = await walk(`/books/gcse/${c.id}.html`, c.id);
      const expected = extractKey(read(`src/pages/books/gcse/${c.id}.html`)).length;
      if (t.qCount !== expected) mismatches.push({ page: c.id, walker: t.qCount, extractKey: expected });
      Object.assign(c, { tree: { blocks: t.blocks }, figures: t.figures, qCount: t.qCount });
    }
    return { front, unknown, mismatches, blocked: browser.blocked };
  } finally {
    await browser.close();
    await server.close();
  }
}

/** Everything the reports say about the trees. */
function findings(opts, front, chosen, ctx, unknown, blocked) {
  const screenWording = [];
  const colourWords = [];
  const placeholders = {};
  const scan = (name, blocks) => {
    for (const text of allTexts(blocks)) {
      for (const hit of reportScreenWords(text)) screenWording.push({ page: name, ...hit });
      if (opts.mono && COLOUR_WORDS.test(text)) colourWords.push({ page: name, text: text.slice(0, 120) });
      for (const p of text.match(PLACEHOLDER) ?? []) placeholders[p] = (placeholders[p] ?? 0) + 1;
    }
  };
  scan('front', front.tree.blocks);
  // the document properties (author, title) are part of the file too: a placeholder there must stop --release
  for (const [p, n] of Object.entries(placeholdersIn(Object.values(PROPERTIES)))) placeholders[p] = (placeholders[p] ?? 0) + n;
  for (const c of chosen) scan(c.id, c.tree.blocks);
  const screenOnly = chosen.flatMap((c) => collect(c.tree.blocks, (n) => n.t === 'q' && n.screenOnly).map((q) => ({ page: c.id, question: q.n, why: q.screenOnly })));
  const frontText = [...allTexts(front.tree.blocks)].join(' ');
  const frontNeedsEdit = [
    ...(opts.noHints && /Hints section/.test(frontText) ? ['front.html mentions the Hints section, but this build has none'] : []),
    ...(opts.noSlips && /If you got/.test(frontText) ? ['front.html mentions the "If you got" lines, but this build has none'] : []),
  ];
  const removed = {};
  for (const r of ctx.removed) removed[r.rule] = (removed[r.rule] ?? 0) + 1;
  const belowPpi = ctx.figureLog.filter((f) => f.ppi < 300);
  return {
    unknown,
    screenWording,
    screenOnlyQuestions: screenOnly,
    deadRefs: ctx.deadRefs,
    placeholders,
    colourWordsInMono: colourWords,
    figuresBelow300ppi: belowPpi,
    frontNeedsEdit,
    removedSentenceCounts: removed,
    blockedRequests: blocked,
  };
}

export async function buildDocx(opts) {
  const started = Date.now();
  const topics = TOPICS.map((t) => ({ ...t }));
  const graph = buildGraph(topics, { hasPage: (id) => existsSync(join(root, `src/pages/books/gcse/${id}.html`)) });
  const all = buildChapters(graph, PAPERS);
  for (const id of opts.pages ?? []) if (!all.some((c) => c.id === id)) throw new Error(`--pages: "${id}" is not a chapter`);
  const chosen = opts.pages ? all.filter((c) => opts.pages.includes(c.id)) : all;
  if (!existsSync(join(root, 'public/books/gcse/fractions.html'))) throw new Error('public/ is not built: run npm run build first');

  const glossaryById = new Map(GLOSSARY.map((g) => [g.id, g]));
  const ctx = makeContext({ chapters: all, glossaryById, mono: opts.mono, noHints: opts.noHints, noSlips: opts.noSlips });
  const { front, unknown, mismatches, blocked } = await gather(opts, chosen, ctx);
  if (mismatches.length) throw new Error(`question count differs from the teacher key: ${JSON.stringify(mismatches)}`);

  const report = findings(opts, front, chosen, ctx, unknown, blocked);
  const doc = buildDocument({ front, chapters: chosen, glossary: GLOSSARY, ctx, properties: PROPERTIES });
  const buffer = patchSettings(await Packer.toBuffer(doc));
  mkdirSync(dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, buffer);

  const questions = chosen.reduce((n, c) => n + c.qCount, 0);
  const figures = ctx.figureLog.length;
  report.stats = {
    chapters: chosen.length,
    questionsWalked: questions,
    questionsPrinted: questions - report.screenOnlyQuestions.length,
    figures,
    minFigurePpi: figures ? Math.min(...ctx.figureLog.map((f) => f.ppi)) : null,
    docxBytes: statSync(opts.out).size,
    seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
    options: { mono: opts.mono, noHints: opts.noHints, noSlips: opts.noSlips, release: opts.release, pages: opts.pages },
  };
  report.needsSourceChange = [
    ...report.screenWording.map((s) => `${s.page}: "${s.context.trim()}" mentions "${s.word}": give it data-print or reword it`),
    ...report.deadRefs.map((r) => `${r.page}: "${r.text}" links to ${r.href}, which is not in the printed book`),
    ...report.screenOnlyQuestions.map((q) => `${q.page} question ${q.question}: ${q.why}; needs a print version`),
    ...report.unknown.map((u) => `${u.page}: unsupported ${u.tag}${u.cls ? `.${u.cls}` : ''} "${u.text}"`),
  ];
  mkdirSync(dirname(opts.report), { recursive: true });
  writeFileSync(opts.report, `${JSON.stringify(report, null, 2)}\n`);
  return { report, docx: opts.out };
}

/** The checks --release adds. Returns a list of problems (empty means releasable). */
export function releaseProblems(report) {
  const problems = [];
  const nonEmpty = (name, v) => { if (Array.isArray(v) ? v.length : Object.keys(v).length) problems.push(name); };
  for (const key of ['unknown', 'screenWording', 'screenOnlyQuestions', 'deadRefs', 'placeholders', 'colourWordsInMono', 'figuresBelow300ppi', 'frontNeedsEdit', 'blockedRequests']) nonEmpty(key, report[key]);
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const opts = parseArgs(process.argv.slice(2));
  const { report, docx } = await buildDocx(opts);
  const s = report.stats;
  console.log(`wrote ${docx} (${(s.docxBytes / 1e6).toFixed(1)} MB): ${s.chapters} chapters, ${s.questionsPrinted} of ${s.questionsWalked} questions, ${s.figures} figures, in ${s.seconds}s`);
  console.log(`reports: unknown ${report.unknown.length}, screen wording ${report.screenWording.length}, screen-only questions ${report.screenOnlyQuestions.length}, dead references ${report.deadRefs.length}, placeholders ${Object.keys(report.placeholders).length}`);
  if (opts.release) {
    const problems = releaseProblems(report);
    if (problems.length) {
      console.error(`--release: not ready, these are not empty: ${problems.join(', ')} (see ${opts.report})`);
      process.exit(1);
    }
  }
}
