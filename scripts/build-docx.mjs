#!/usr/bin/env node
// Builds the GCSE book as one Word file: dist/gcse-book.docx (and dist/print-report.json). See docs/print-edition.md.
//
//   npm run book:docx                      the whole book
//   node scripts/build-docx.mjs --pages fractions,percentages      just those chapters (used by the tests)
//   --tier foundation | higher   one of the two KDP paperbacks: dist/gcse-foundation.docx or dist/gcse-higher.docx
//                                (no --tier is the whole book). npm run book:docx:both builds both.
//   --mono        greyscale figures and box shading
//   --release     fail if any placeholder or any report is not empty
//   --no-hints    leave the Hints section out        --no-slips   leave the "If you got..." lines out
//   --short-answers   the Answers print the answer line and any mark scheme, not the worked solution or the "If you got..." lines
//   --first-hint      the Hints print only the first clue of each ladder
//                     Both are ON by default for a --tier book (the page count matters for KDP); opt out with
//                     --full-answers and --all-hints. The whole book keeps full answers and hints unless asked.
//   --out FILE    where to write the .docx           --report FILE   where to write the report

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Packer } from 'docx';
import { TOPICS } from '../src/book/topics.mjs';
import { GLOSSARY } from '../src/book/glossary.mjs';
import { buildGraph, extractKey } from './book-lib.mjs';
import { buildChapters } from './print/chapters.mjs';
import { estimatePages, wordsIn } from './print/estimate.mjs';
import { chipsLeft, dropHigher, glossaryForBook, keepOnlyHigher, papersForTier, renumberQuestions, retitleFront, termsUsed, TIER_LABEL, TIERS } from './print/tier.mjs';
import { capturePage, openBrowser } from './print/capture.mjs';
import { patchSettings } from './print/docx-settings.mjs';
import { allTexts, buildDocument, cleanTree, featuresFor, hintsFor, makeContext, solutionFor } from './print/render.mjs';
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

export const PROPERTIES = { creator: 'Greg Wright', lastModifiedBy: 'Greg Wright', title: 'GCSE Mathematics', subject: 'GCSE Maths', description: 'GCSE maths book, print edition' };
/** The document properties of one book: the title says which tier. */
export const propertiesFor = (tier) => (tier ? { ...PROPERTIES, title: `${PROPERTIES.title}: ${TIER_LABEL[tier]}` } : PROPERTIES);

export function parseArgs(argv) {
  const opts = { pages: null, tier: null, mono: false, release: false, noHints: false, noSlips: false, shortAnswers: false, firstHint: false, out: null, report: null };
  const asked = new Set();
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pages') opts.pages = argv[(i += 1)].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--tier') {
      opts.tier = argv[(i += 1)];
      if (!TIERS.includes(opts.tier)) throw new Error(`--tier must be one of ${TIERS.join(', ')}`);
    } else if (a === '--mono') opts.mono = true;
    else if (a === '--release') opts.release = true;
    else if (a === '--no-hints') opts.noHints = true;
    else if (a === '--no-slips') opts.noSlips = true;
    else if (['--short-answers', '--full-answers', '--first-hint', '--all-hints'].includes(a)) asked.add(a);
    else if (a === '--out') opts.out = resolve(argv[(i += 1)]);
    else if (a === '--report') opts.report = resolve(argv[(i += 1)]);
    else throw new Error(`unknown option ${a}`);
  }
  // a single-tier book is short by default (Greg, 26 Nov 2026); the whole book is full unless asked
  opts.shortAnswers = !asked.has('--full-answers') && (Boolean(opts.tier) || asked.has('--short-answers'));
  opts.firstHint = !asked.has('--all-hints') && (Boolean(opts.tier) || asked.has('--first-hint'));
  opts.out ??= join(root, opts.tier ? `dist/gcse-${opts.tier}.docx` : 'dist/gcse-book.docx');
  opts.report ??= join(root, opts.tier ? `dist/print-report-${opts.tier}.json` : 'dist/print-report.json');
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
  // What each page becomes before its figures are photographed: screen wording out; in the Foundation book the Higher parts too;
  // in the Higher book a Foundation topic shrinks to its Higher parts only.
  const kindOf = new Map(chosen.map((c) => [c.id, c.kind]));
  const tidy = (blocks) => {
    const clean = cleanTree(blocks, ctx);
    if (opts.tier === 'foundation') return dropHigher(clean);
    if (opts.tier === 'higher' && kindOf.get(ctx.page) === 'part') return keepOnlyHigher(clean);
    return clean;
  };
  const tidyFront = (blocks) => cleanTree(blocks, ctx); // the title page says "Foundation and Higher" until it is retitled
  const server = await startServer({ '/__front/': join(root, 'src/print/gcse'), '/': join(root, 'public') });
  const browser = await openBrowser({ port: server.port, mono: opts.mono });
  const unknown = [];
  const mismatches = [];
  let walkedTotal = 0;
  const features = featuresFor(opts);
  const walk = async (url, name) => {
    ctx.page = name;
    const tree = await capturePage(browser, `http://127.0.0.1:${server.port}${url}`, name === 'front' ? tidyFront : tidy, features);
    for (const u of tree.unknown) unknown.push({ page: name, ...u });
    return tree;
  };
  try {
    const f = await walk('/__front/front.html', 'front');
    const front = { tree: { blocks: opts.tier ? retitleFront(f.blocks, opts.tier) : f.blocks }, figures: f.figures };
    for (const c of chosen) {
      const t = await walk(`/books/gcse/${c.id}.html`, c.id);
      const expected = extractKey(read(`src/pages/books/gcse/${c.id}.html`)).length;
      if (t.qCount !== expected) mismatches.push({ page: c.id, walker: t.qCount, extractKey: expected });
      Object.assign(c, { tree: { blocks: t.blocks }, figures: t.figures, qCount: t.qCount });
      walkedTotal += t.qCount;
      // Each chapter of a single-tier book is numbered from 1 in printed order, with no gaps, because part of a page was cut.
      // The whole book keeps the web numbers (7.12 is question 12 on the page and in the teacher key).
      if (opts.tier) renumberQuestions(c.tree.blocks);
    }
    return { front, unknown, mismatches, blocked: browser.blocked, walkedTotal };
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
  // front.html has variants (data-print-if) for every option; this catches a variant that was missed
  const frontNeedsEdit = [
    ...(opts.noHints && /Hints section/.test(frontText) ? ['front.html mentions the Hints section, but this build has none'] : []),
    ...((opts.noSlips || opts.shortAnswers) && /If you got/.test(frontText) ? ['front.html mentions the "If you got" lines, but this build has none'] : []),
    ...(opts.shortAnswers && /worked (answer|solution)/i.test(frontText) ? ['front.html mentions worked solutions, but this build has short answers'] : []),
    ...(opts.firstHint && /Hint 2/.test(frontText) ? ['front.html mentions more than one hint, but this build has only the first'] : []),
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
    // every word a printed chapter links must have an entry in this book's glossary
    termsNotInGlossary: (() => { const g = new Set(glossaryForBook(GLOSSARY, opts.tier, termsUsed(chosen.map((c) => c.tree.blocks))).map((e) => e.id)); return chosen.flatMap((c) => [...termsUsed(c.tree.blocks)].filter((id) => !g.has(id)).map((term) => ({ page: c.id, term }))); })(),
    higherLeftovers: opts.tier === 'foundation' ? [front, ...chosen].flatMap((c) => chipsLeft(c.tree.blocks).map(() => ({ page: c.id ?? 'front' }))) : [],
  };
}

export async function buildDocx(opts) {
  const started = Date.now();
  const topics = TOPICS.map((t) => ({ ...t }));
  const graph = buildGraph(topics, { hasPage: (id) => existsSync(join(root, `src/pages/books/gcse/${id}.html`)) });
  // A Foundation topic gets a chapter in the Higher book only if it has Higher material. The page source says which can (a chip or
  // a data-tier marker); the walk below drops any that turn out to have none, and the chapters are numbered after that.
  const hasHigherMarker = (id) => /chip-higher|data-tier="H"/.test(read(`src/pages/books/gcse/${id}.html`));
  const higherParts = new Set(opts.tier === 'higher' ? topics.filter((t) => t.status === 'live' && t.tier === 'F' && hasHigherMarker(t.id)).map((t) => t.id) : []);
  let all = buildChapters(graph, papersForTier(PAPERS, opts.tier), { tier: opts.tier, higherParts });
  for (const id of opts.pages ?? []) if (!all.some((c) => c.id === id)) throw new Error(`--pages: "${id}" is not a chapter`);
  let chosen = opts.pages ? all.filter((c) => opts.pages.includes(c.id)) : all;
  if (!existsSync(join(root, 'public/books/gcse/fractions.html'))) throw new Error('public/ is not built: run npm run build first');

  const walkCtx = { page: '', removed: [] };
  const { front, unknown, mismatches, blocked, walkedTotal } = await gather(opts, chosen, walkCtx);
  if (mismatches.length) throw new Error(`question count differs from the teacher key: ${JSON.stringify(mismatches)}`);

  // a Foundation topic with nothing Higher in it has no chapter in the Higher book; then every chapter counts from 1
  const empty = (c) => c.kind === 'part' && !c.tree.blocks.length;
  all = all.filter((c) => !chosen.includes(c) || !empty(c));
  chosen = chosen.filter((c) => !empty(c));
  all.forEach((c, i) => { c.num = i + 1; });
  for (const c of chosen) {
    if (c.kind === 'part') c.tree.blocks.unshift({ t: 'p', cls: 'intro', runs: [{ t: `The Higher parts of ${c.title}. The rest of this topic is in the Foundation book.` }] });
  }

  // chapters of the other book (and a Foundation topic's own basics, seen from the Higher book), so a reference to one says
  // "(in the Higher book)" or "(in the Foundation book)" instead of a chapter number, and is not reported as dead
  const referable = all.filter((c) => c.kind !== 'part');
  const elsewhere = new Map(buildChapters(graph, PAPERS).filter((c) => !referable.some((a) => a.id === c.id)).map((c) => [c.id, c.title]));
  const elsewhereLabel = opts.tier === 'foundation' ? 'in the Higher book' : 'in the Foundation book';

  const glossary = glossaryForBook(GLOSSARY, opts.tier, termsUsed(chosen.map((c) => c.tree.blocks)));
  const glossaryById = new Map(glossary.map((g) => [g.id, g]));
  const ctx = makeContext({ chapters: referable, glossaryById, mono: opts.mono, noHints: opts.noHints, noSlips: opts.noSlips, shortAnswers: opts.shortAnswers, firstHint: opts.firstHint, elsewhere, elsewhereLabel });
  ctx.tier = opts.tier;
  ctx.removed = walkCtx.removed;

  const report = findings(opts, front, chosen, ctx, unknown, blocked);
  const doc = buildDocument({ front, chapters: chosen, glossary, ctx, properties: propertiesFor(opts.tier) });
  const buffer = patchSettings(await Packer.toBuffer(doc));
  mkdirSync(dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, buffer);

  const questions = walkedTotal;
  const kept = chosen.reduce((n, c) => n + collect(c.tree.blocks, (x) => x.t === 'q' && Array.isArray(x.body)).length, 0);
  const figures = ctx.figureLog.length;
  report.shortAnswerFallbacks = opts.shortAnswers
    ? chosen.flatMap((c) => collect(c.tree.blocks, (x) => x.t === 'q' && Array.isArray(x.body) && !x.screenOnly && solutionFor(x, true).fallback).map((q) => ({ page: c.id, question: q.webN ?? q.n })))
    : [];
  report.stats = {
    tier: opts.tier ?? 'whole book',
    chapters: chosen.length,
    questionsWalked: questions,
    questionsInOtherBook: questions - kept,
    questionsPrinted: kept - report.screenOnlyQuestions.length,
    figures,
    minFigurePpi: figures ? Math.min(...ctx.figureLog.map((f) => f.ppi)) : null,
    docxBytes: statSync(opts.out).size,
    seconds: Number(((Date.now() - started) / 1000).toFixed(1)),
    shortAnswerFallbacks: report.shortAnswerFallbacks.length,
    pagesEstimate: pageEstimate(chosen, front, glossary, ctx, opts),
    options: { mono: opts.mono, noHints: opts.noHints, noSlips: opts.noSlips, shortAnswers: opts.shortAnswers, firstHint: opts.firstHint, release: opts.release, pages: opts.pages },
  };
  report.questionIds = chosen.flatMap((c) => collect(c.tree.blocks, (x) => x.t === 'q' && Array.isArray(x.body)).map((q) => `${c.id}-${q.webN ?? q.n}`));
  report.needsSourceChange = [
    ...report.screenWording.map((s) => `${s.page}: "${s.context.trim()}" mentions "${s.word}": give it data-print or reword it`),
    ...report.deadRefs.map((r) => `${r.page}: "${r.text}" links to ${r.href}, which is not in the printed book`),
    ...report.screenOnlyQuestions.map((q) => `${q.page} question ${q.question}: ${q.why}; needs a print version`),
    ...(report.termsNotInGlossary ?? []).map((h) => `${h.page}: links the glossary word "${h.term}", which is not in this book's glossary`),
    ...report.higherLeftovers.map((h) => `${h.page}: a Higher label is left in the Foundation book`),
    ...report.unknown.map((u) => `${u.page}: unsupported ${u.tag}${u.cls ? `.${u.cls}` : ''} "${u.text}"`),
  ];
  mkdirSync(dirname(opts.report), { recursive: true });
  writeFileSync(opts.report, `${JSON.stringify(report, null, 2)}\n`);
  return { report, docx: opts.out };
}

/** A rough page count from the trees (see scripts/print/estimate.mjs). The word counts are of what is printed, in each part. */
function pageEstimate(chosen, front, glossary, ctx, opts) {
  const questions = chosen.flatMap((c) => collect(c.tree.blocks, (x) => x.t === 'q' && Array.isArray(x.body) && !x.screenOnly));
  // what the chapters hold, whether or not it is printed there (the walker keeps the solutions, wrong-answer lines and ladders on each question)
  const fullParts = questions.map((q) => [q.solution, q.wrong, q.options.map((o) => ({ runs: [{ t: o.why }] })), q.ladder]);
  const slips = !opts.noSlips && !opts.shortAnswers;
  const answerParts = questions.map((q) => [solutionFor(q, opts.shortAnswers).blocks, slips ? [q.wrong, q.options.map((o) => ({ runs: [{ t: o.why }] }))] : []]);
  const hintParts = questions.map((q) => hintsFor(q, opts.firstHint));
  const answers = wordsIn(answerParts) + questions.length * 4;
  const hints = opts.noHints ? 0 : wordsIn(hintParts) + questions.length * 2;
  const chapterWords = wordsIn(chosen.map((c) => c.tree.blocks)) - wordsIn(fullParts);
  // lines: one per answer plus one per block (list item) printed under it; one per question that has a hint
  const countLines = (blocks) => blocks.reduce((n, b) => n + (b.t === 'list' ? b.items.length : 1), 0);
  const answerLines = questions.reduce((n, q) => n + 1 + countLines(solutionFor(q, opts.shortAnswers).blocks) + (slips ? q.wrong.length : 0), 0);
  const hintLines = opts.noHints ? 0 : questions.reduce((n, q) => n + hintsFor(q, opts.firstHint).length, 0);
  const headings = chosen.flatMap((c) => collect(c.tree.blocks, (x) => x.t === 'h' && x.level === 2)).length;
  const glossaryWords = wordsIn(glossary.map((g) => [{ runs: [{ t: [g.term, g.def, g.watch, ...(Array.isArray(g.example) ? g.example : [g.example])].filter(Boolean).join(' ') }] }]));
  return estimatePages({
    words: { front: wordsIn([front.tree.blocks]), chapters: Math.max(0, chapterWords), answers, hints, glossary: glossaryWords },
    lines: { answers: answerLines, hints: hintLines },
    figureHeightIn: ctx.figureLog.reduce((n, f) => n + f.heightIn, 0) / 2, // the figure log counts a figure in the chapter and again where its answer is printed
    chapterCount: chosen.length,
    tocEntries: chosen.length + headings + 4,
    indexEntries: glossary.length + chosen.length,
  });
}

/** The checks --release adds. Returns a list of problems (empty means releasable). */
export function releaseProblems(report) {
  const problems = [];
  const nonEmpty = (name, v) => { if (Array.isArray(v) ? v.length : Object.keys(v).length) problems.push(name); };
  for (const key of ['unknown', 'screenWording', 'screenOnlyQuestions', 'deadRefs', 'placeholders', 'colourWordsInMono', 'figuresBelow300ppi', 'frontNeedsEdit', 'blockedRequests', 'higherLeftovers', 'termsNotInGlossary']) nonEmpty(key, report[key] ?? []);
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const opts = parseArgs(process.argv.slice(2));
  const { report, docx } = await buildDocx(opts);
  const s = report.stats;
  console.log(`wrote ${docx} (${(s.docxBytes / 1e6).toFixed(1)} MB): ${s.chapters} chapters, ${s.questionsPrinted} of ${s.questionsWalked} questions, ${s.figures} figures, in ${s.seconds}s`);
  const p = s.pagesEstimate;
  console.log(`rough page estimate (about 20% either way): ${p.total} (front ${p.front}, contents ${p.contents}, chapters ${p.chapters}, answers ${p.answers}, hints ${p.hints}, glossary ${p.glossary}, index ${p.index})`);
  console.log(`reports: unknown ${report.unknown.length}, screen wording ${report.screenWording.length}, screen-only questions ${report.screenOnlyQuestions.length}, dead references ${report.deadRefs.length}, placeholders ${Object.keys(report.placeholders).length}, Higher labels left ${report.higherLeftovers.length}, glossary words missing ${(report.termsNotInGlossary ?? []).length}`);
  if (opts.release) {
    const problems = releaseProblems(report);
    if (problems.length) {
      console.error(`--release: not ready, these are not empty: ${problems.join(', ')} (see ${opts.report})`);
      process.exit(1);
    }
  }
}
