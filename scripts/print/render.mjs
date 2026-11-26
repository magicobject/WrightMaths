// The walker's trees -> a Word document. Everything about how the printed book looks lives here.

import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { optionLetter, answerRuns } from './answers.mjs';
import { hrefToId } from './chapters.mjs';
import { equation, runsToText } from './omml.mjs';
import { indexField, pageField, tocField, xe } from './fields.mjs';
import { keyAnswer, plainText } from '../book-lib.mjs';
import { dropHeading, stripScreenWording } from '../print-rules.mjs';

export const PAGE = { width: 12240, height: 15840, margin: 1080, gutter: 180 }; // 8.5 x 11 in, in twips
const TEXT_WIDTH = PAGE.width - PAGE.margin * 2 - PAGE.gutter; // 9900 twips = 6.875 in
export const MAX_FIGURE_IN = 6.8;
const FONT = 'Calibri';
const BODY = 22; // half-points: 11 pt
const SMALL = 20;

const BOX = {
  key: { fill: 'FFF4CC', line: 'C99700' },
  worked: { fill: 'E4F0FB', line: '2F6EA8' },
  faded: { fill: 'E6F5E9', line: '3C8D4F' },
  bys: { fill: 'F2F2F2', line: '888888' },
  words: { fill: 'F2F2F2', line: '888888' },
  unlocks: { fill: 'F2F2F2', line: '888888' },
};
const MONO_BOX = { fill: 'F0F0F0', line: '555555' };

// ---------- the context passed to every render function ----------

export function makeContext({ chapters, glossaryById, mono = false, noHints = false, noSlips = false }) {
  return {
    chapters,
    byId: new Map(chapters.map((c) => [c.id, c])),
    glossaryById,
    mono,
    noHints,
    noSlips,
    deadRefs: [],
    figureLog: [],
    removed: [],
    chapter: null,
    page: '',
    index: null,
    sectionNo: 0,
  };
}

// ---------- runs ----------

function runsFor(runs, ctx, st = {}) {
  const size = st.size ?? BODY;
  const out = [];
  for (const r of runs) {
    if (r.x === 'frac' || r.x === 'cvec') {
      out.push(equation(r));
    } else if (r.x === 'blank') {
      out.push(new TextRun({ text: '________', size, font: FONT }));
    } else if (r.x === 'br') {
      out.push(new TextRun({ break: 1 }));
    } else if (r.x === 'ref') {
      out.push(...runsFor(r.runs, ctx, st));
      const target = ctx.byId.get(hrefToId(r.href));
      if (target) out.push(new TextRun({ text: ` (Chapter ${target.num})`, size, font: FONT }));
      else ctx.deadRefs.push({ page: ctx.page, href: r.href, text: runsToText(r.runs) });
    } else {
      out.push(new TextRun({
        text: r.t, size, font: r.code ? 'Consolas' : FONT, bold: r.b || st.bold, italics: r.i || st.italics, color: st.color,
        superScript: r.sup, subScript: r.sub,
      }));
      if (r.term && ctx.index) out.push(...ctx.index.mark(r.term));
    }
  }
  return out;
}

/** Index bookkeeping for one chapter: a bold entry where a term is taught, a plain one at its first use elsewhere. */
export function makeIndexer(chapter, glossaryById) {
  const seen = new Set();
  const taught = new Set(chapter.words ?? []);
  return {
    mark(id) {
      const entry = glossaryById.get(id);
      if (!entry || seen.has(id)) return [];
      seen.add(id);
      return xe(entry.term.replace(/\s*\(.*\)\s*$/, ''), { bold: taught.has(id) });
    },
  };
}

// ---------- paragraphs ----------

function para(children, st = {}, extra = {}) {
  const { indentLeft, hanging, before, ...rest } = extra;
  const indent = { left: (st.indent ?? 0) + (indentLeft ?? 0), hanging };
  return new Paragraph({
    children,
    spacing: { after: st.after ?? 100, before },
    indent,
    ...(st.pstyle ?? {}),
    ...rest,
  });
}

const boxStyle = (ctx, kind) => {
  const c = ctx.mono ? MONO_BOX : BOX[kind] ?? BOX.bys;
  return {
    shading: { type: ShadingType.CLEAR, fill: c.fill, color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: c.line, space: 6 } },
  };
};

// ---------- blocks ----------

const LIST_MARK = { checklist: '\u2610', tick: '\u2022', traps: '\u2022', needs: '\u2022', markscheme: '\u2022', facts: '' };

function renderList(b, ctx, st) {
  const out = [];
  b.items.forEach((item, i) => {
    const mark = b.ordered ? `${i + 1}.` : LIST_MARK[b.kind] ?? '\u2022';
    const lead = mark ? [new TextRun({ text: `${mark}\t`, size: st.size ?? BODY, font: b.kind === 'checklist' ? 'Segoe UI Symbol' : FONT })] : [];
    const blocks = renderBlocks(item, ctx, { ...st, indent: (st.indent ?? 0) + (mark ? 360 : 0) }, lead);
    out.push(...blocks);
  });
  return out;
}

function cellContent(cell, ctx) {
  const content = renderBlocks(cell.blocks, ctx, { size: SMALL, after: 40, bold: cell.th });
  return content.length ? content : [new Paragraph('')];
}

function renderTable(b, ctx, st) {
  const cols = Math.max(...b.rows.map((r) => r.cells.reduce((n, c) => n + c.colspan, 0)), 1);
  const width = Math.floor((TEXT_WIDTH - (st.indent ?? 0)) / cols);
  const line = { style: BorderStyle.SINGLE, size: 4, color: ctx.mono ? '555555' : '888888' };
  const borders = { top: line, bottom: line, left: line, right: line };
  const rows = b.rows.map((row) => new TableRow({
    tableHeader: row.head,
    cantSplit: true,
    children: row.cells.map((cell) => new TableCell({
      borders,
      columnSpan: cell.colspan,
      width: { size: width * cell.colspan, type: WidthType.DXA },
      shading: cell.th || row.head ? { type: ShadingType.CLEAR, fill: 'EDEDED', color: 'auto' } : undefined,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: cellContent(cell, ctx),
    })),
  }));
  const out = [];
  if (b.caption) out.push(para(runsFor(b.caption, ctx, { bold: true, size: SMALL }), st, { keepNext: true }));
  out.push(new Table({ rows, width: { size: width * cols, type: WidthType.DXA }, columnWidths: Array(cols).fill(width) }), para([], st, {}));
  return out;
}

function renderFigure(b, ctx, st) {
  return b.figs.flatMap((fig) => {
    const img = ctx.figures.get(fig.id);
    if (!img) return [];
    const placedIn = Math.min(Math.floor(fig.cssWidth) / 100, MAX_FIGURE_IN); // a 3x screenshot placed at css width / 100 in is 300 ppi
    const widthPx = Math.round(placedIn * 96);
    const heightPx = Math.round(widthPx * (img.pxHeight / img.pxWidth));
    ctx.figureLog.push({ page: ctx.page, id: fig.id, pxWidth: img.pxWidth, placedIn: Number(placedIn.toFixed(2)), ppi: Math.round(img.pxWidth / placedIn) });
    const out = [para([new ImageRun({
      type: 'png',
      data: img.png,
      transformation: { width: widthPx, height: heightPx },
      altText: { name: `Figure ${ctx.page} ${fig.id}`, title: fig.title || 'Figure', description: fig.alt || fig.title || 'Figure' },
    })], st, { alignment: AlignmentType.CENTER, keepNext: Boolean(b.caption), keepLines: true })];
    if (b.caption) out.push(para(runsFor(b.caption, ctx, { italics: true, size: SMALL }), st, { alignment: AlignmentType.CENTER }));
    return out;
  });
}

function heading(b, ctx, st) {
  const text = runsToText(b.runs).trim();
  if (!text) return [];
  if (ctx.mode === 'front') {
    if (b.level === 1) return [para(runsFor(b.runs, ctx, { size: 56, bold: true }), {}, { alignment: AlignmentType.CENTER, before: 2400, after: 240 })];
    return [new Paragraph({ heading: b.level === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_3, children: runsFor(b.runs, ctx, {}), pageBreakBefore: b.level === 2 })];
  }
  if (b.level === 1) return []; // the chapter heading is made from the chapter itself
  // Sections are not numbered: "7.12" always means question 12 of chapter 7.
  if (b.level === 2 && !st.box) return [new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: runsFor(b.runs, ctx, {}) })];
  return [new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: runsFor(b.runs, ctx, {}), spacing: { before: 160, after: 80 }, ...(st.pstyle ?? {}) })];
}

function renderQuestion(q, ctx, st) {
  if (q.screenOnly) return [];
  const label = `${ctx.chapter.num}.${q.n}`;
  const tagBits = [q.tags.marks, q.tags.calc, q.tags.grade].filter(Boolean);
  const lead = [new TextRun({ text: label, bold: true, size: BODY, font: FONT }), new TextRun({ text: '\t', size: BODY })];
  const tagRun = tagBits.length ? [new TextRun({ text: `${tagBits.join('  ')}  `, italics: true, size: SMALL, font: FONT })] : [];
  const out = [];
  let labelled = false;
  const qst = { ...st, indent: 540 };
  for (const b of q.body) {
    if (b.t === 'qtext') {
      out.push(para([...(labelled ? [] : lead), ...tagRun, ...runsFor(b.runs, ctx, st)], { ...st }, { indentLeft: 540, hanging: labelled ? undefined : 540, keepNext: q.options.length > 0, keepLines: true }));
      labelled = true;
    } else {
      out.push(...renderBlocks([b], ctx, qst));
    }
  }
  if (!labelled) out.unshift(para(lead, st, { keepNext: true }));
  if (q.tags.from.length) {
    const names = q.tags.from.map((href) => ctx.byId.get(hrefToId(href))).filter(Boolean).map((c) => `Chapter ${c.num}, ${c.title}`);
    if (names.length) out.push(para([new TextRun({ text: `Uses: ${names.join('; ')}`, italics: true, size: SMALL, font: FONT })], st, { indentLeft: 540 }));
  }
  q.options.forEach((o, i) => out.push(para([new TextRun({ text: `${optionLetter(i)}\t`, bold: true, size: BODY, font: FONT }), ...runsFor(o.runs, ctx, st)], st, { indentLeft: 540 + 360, hanging: 360, keepLines: true })));
  return out;
}

function renderBox(b, ctx, st) {
  const style = boxStyle(ctx, b.kind);
  return renderBlocks(b.blocks, ctx, { ...st, box: true, pstyle: { ...(st.pstyle ?? {}), ...style }, indent: (st.indent ?? 0) + 120 });
}

/** Render a list of blocks. `lead` runs are put at the start of the first paragraph (a list marker). */
export function renderBlocks(blocks, ctx, st = {}, lead = []) {
  const out = [];
  let pending = lead;
  const take = (children) => { const c = [...pending, ...children]; pending = []; return c; };
  for (const b of blocks) {
    if (b.t === 'p') {
      const sz = b.cls === 'lead' ? 24 : st.size ?? BODY;
      const style = b.cls === 'muted' ? { color: '595959', italics: false } : b.cls === 'intro' ? { italics: true } : {};
      const hanging = pending.length ? 360 : undefined;
      out.push(para(take(runsFor(b.runs, ctx, { ...st, ...style, size: sz })), st, { hanging }));
    } else if (b.t === 'h') {
      out.push(...heading(b, ctx, st));
    } else if (b.t === 'list') {
      out.push(...renderList(b, ctx, st));
    } else if (b.t === 'dl') {
      for (const item of b.items) {
        out.push(para(runsFor(item.term, ctx, { ...st, bold: true }), st, { keepNext: true, after: 20 }));
        out.push(...renderBlocks(item.def, ctx, { ...st, indent: (st.indent ?? 0) + 360 }));
      }
    } else if (b.t === 'table') {
      out.push(...renderTable(b, ctx, st));
    } else if (b.t === 'fig') {
      out.push(...renderFigure(b, ctx, st));
    } else if (b.t === 'q') {
      out.push(...renderQuestion(b, ctx, st));
    } else if (b.t === 'box') {
      out.push(...renderBox(b, ctx, st));
    } else if (b.t === 'section') {
      if (b.kind === 'print-copyright') out.push(new Paragraph({ pageBreakBefore: true, children: [] }));
      out.push(...renderBlocks(b.blocks, ctx, b.kind === 'print-copyright' ? { ...st, size: SMALL } : st));
    } else if (b.t === 'recap') {
      out.push(para(runsFor(b.title, ctx, { ...st, bold: true }), st, { keepNext: true }));
      out.push(...renderBlocks(b.blocks, ctx, st));
    } else if (b.t === 'qtext') {
      out.push(para(runsFor(b.runs, ctx, st), st));
    }
    // 'check' blocks (the faded examples' answers) and 'hr' are not part of the chapter text: the answers section prints them.
  }
  if (pending.length) out.push(para(pending, st));
  return out;
}

// ---------- cleaning a tree before it is drawn ----------

/** Apply the screen-wording rules to every paragraph, drop screen-only headings, number sections. Records what was removed. */
export function cleanTree(node, ctx) {
  if (Array.isArray(node)) {
    const kept = node.filter((n) => !(n && n.t === 'h' && dropHeading(runsToText(n.runs))));
    return kept.map((n) => cleanTree(n, ctx));
  }
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'runs' && Array.isArray(v) && node.x !== 'frac') {
      const { runs, removed } = stripScreenWording(v);
      for (const r of removed) ctx.removed.push({ page: ctx.page, ...r });
      out[k] = runs;
    } else {
      out[k] = cleanTree(v, ctx);
    }
  }
  return out;
}

/** Every paragraph's plain text, for the screen-wording report. */
export function* allTexts(node) {
  if (Array.isArray(node)) { for (const n of node) yield* allTexts(n); return; }
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.runs)) yield runsToText(node.runs);
  if (node.why) yield node.why;
  for (const [k, v] of Object.entries(node)) if (k !== 'runs' && typeof v === 'object') yield* allTexts(v);
}

// ---------- chapters, answers, hints ----------

function* questionsOf(node) {
  if (Array.isArray(node)) { for (const n of node) yield* questionsOf(n); return; }
  if (!node || typeof node !== 'object') return;
  if (node.t === 'q') { yield node; return; }
  for (const v of Object.values(node)) if (typeof v === 'object') yield* questionsOf(v);
}

function* fadedOf(node, state = { section: '' }) {
  if (Array.isArray(node)) { for (const n of node) yield* fadedOf(n, state); return; }
  if (!node || typeof node !== 'object') return;
  if (node.t === 'h' && node.level === 2) state.section = runsToText(node.runs).trim();
  if (node.t === 'box' && node.kind === 'faded') {
    yield { section: state.section, blocks: node.blocks };
    return;
  }
  for (const v of Object.values(node)) if (typeof v === 'object') yield* fadedOf(v, state);
}

function* blanksOf(node) {
  if (Array.isArray(node)) { for (const n of node) yield* blanksOf(n); return; }
  if (!node || typeof node !== 'object') return;
  if (node.x === 'blank') yield node.answers;
  for (const v of Object.values(node)) if (typeof v === 'object') yield* blanksOf(v);
}

function* checksOf(node) {
  if (Array.isArray(node)) { for (const n of node) yield* checksOf(n); return; }
  if (!node || typeof node !== 'object') return;
  if (node.t === 'check') { yield node.blocks; return; }
  for (const v of Object.values(node)) if (typeof v === 'object') yield* checksOf(v);
}

export function chapterBody(chapter, ctx) {
  ctx.chapter = chapter;
  ctx.page = chapter.id;
  ctx.mode = 'chapter';
  ctx.sectionNo = 0;
  ctx.figures = chapter.figures;
  ctx.index = makeIndexer(chapter, ctx.glossaryById);
  const title = new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    children: [new TextRun({ text: `Chapter ${chapter.num}`, font: FONT }), new TextRun({ text: '\t', font: FONT }), new TextRun({ text: chapter.title, font: FONT }), ...xe(chapter.title, { bold: true })],
  });
  const out = [title, ...renderBlocks(chapter.tree.blocks, ctx)];
  ctx.index = null;
  return out;
}

function answerParagraphs(q, ctx, label) {
  const small = { size: SMALL, after: 60 };
  const { answer, also } = keyAnswer({
    type: q.type,
    correct: '',
    answers: q.answers,
  });
  const out = [];
  let answerRunsOut;
  if (q.type === 'mc') {
    const i = q.options.findIndex((o) => o.correct);
    answerRunsOut = i < 0 ? [{ t: '?' }] : [{ t: `${optionLetter(i)}  `, b: true }, ...q.options[i].runs];
  } else if (q.type === 'show') {
    answerRunsOut = [{ t: 'See the mark scheme' }];
  } else {
    answerRunsOut = answerRuns(answer);
    if (also.length) answerRunsOut.push({ t: '  (also accept: ' }, ...also.flatMap((a, i) => [...(i ? [{ t: ', ' }] : []), ...answerRuns(a)]), { t: ')' });
  }
  out.push(para([new TextRun({ text: label, bold: true, size: BODY, font: FONT }), new TextRun({ text: '\t', size: BODY }), ...runsFor(answerRunsOut, ctx, { size: BODY })], { after: 40 }, { indentLeft: 600, hanging: 600, keepNext: q.solution.length > 0, keepLines: true }));
  if (q.solution.length) out.push(...renderBlocks(q.solution, ctx, { ...small, indent: 600 }));
  if (!ctx.noSlips) {
    const slips = [
      ...q.wrong.map((w) => ({ label: w.if, runs: w.runs })),
      ...q.options.map((o, i) => ({ label: optionLetter(i), runs: [{ t: o.why }], skip: o.correct || !o.why })).filter((s) => !s.skip),
    ];
    for (const s of slips) {
      const isOption = /^[A-Z]$/.test(s.label) && q.type === 'mc';
      const lead = isOption ? `If you chose ${s.label}: ` : '';
      out.push(para([new TextRun({ text: lead || 'If you got ', italics: true, size: SMALL, font: FONT }), ...(isOption ? [] : [...runsFor(answerRuns(s.label), ctx, { size: SMALL, italics: true }), new TextRun({ text: ': ', italics: true, size: SMALL, font: FONT })]), ...runsFor(s.runs, ctx, { size: SMALL })], small, { indentLeft: 600 }));
    }
  }
  return out;
}

export function chapterAnswers(chapter, ctx) {
  ctx.chapter = chapter;
  ctx.page = chapter.id;
  ctx.index = null;
  ctx.mode = 'answers';
  ctx.figures = chapter.figures;
  const out = [new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun({ text: `Chapter ${chapter.num}: ${chapter.title}`, font: FONT })] })];
  for (const q of questionsOf(chapter.tree.blocks)) {
    if (q.screenOnly) continue;
    out.push(...answerParagraphs(q, ctx, `${chapter.num}.${q.n}`));
  }
  for (const f of fadedOf(chapter.tree.blocks)) {
    const blanks = [...blanksOf(f.blocks)].filter(Boolean);
    out.push(para([new TextRun({ text: `Now you finish it${f.section ? ` (in \u201c${f.section}\u201d)` : ''}`, bold: true, size: BODY, font: FONT })], { after: 40 }, { keepNext: true }));
    if (blanks.length) out.push(para([new TextRun({ text: `Gaps, in order: ${blanks.map((b) => plainText(b)).join(', ')}`, size: SMALL, font: FONT })], { after: 40 }, { indentLeft: 600 }));
    for (const blocks of checksOf(f.blocks)) out.push(...renderBlocks(blocks, ctx, { size: SMALL, after: 60, indent: 600 }));
  }
  return out;
}

export function chapterHints(chapter, ctx) {
  ctx.chapter = chapter;
  ctx.page = chapter.id;
  ctx.index = null;
  ctx.mode = 'hints';
  const out = [new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun({ text: `Chapter ${chapter.num}: ${chapter.title}`, font: FONT })] })];
  for (const q of questionsOf(chapter.tree.blocks)) {
    if (q.screenOnly || !q.ladder.length) continue;
    const lead = [new TextRun({ text: `${chapter.num}.${q.n}`, bold: true, size: SMALL, font: FONT }), new TextRun({ text: '\t', size: SMALL })];
    q.ladder.forEach((blocks, i) => {
      out.push(...renderBlocks(blocks, ctx, { size: SMALL, after: 40, indent: 600 }, [...(i === 0 ? lead : [new TextRun({ text: '\t', size: SMALL })]), new TextRun({ text: `Hint ${i + 1}: `, bold: true, size: SMALL, font: FONT })]));
    });
  }
  return out;
}

// ---------- glossary ----------

const dec = (t) => {
  const s = plainText(t);
  return `${/^\s/.test(t) ? ' ' : ''}${s}${/\s$/.test(t) && s ? ' ' : ''}`;
};

/** Page shorthand ({frac:a/b}, <sup>) -> runs, so the glossary keeps its maths. */
export function shorthandRuns(text) {
  const out = [];
  const re = /\{frac:([^}]*)\}|<sup>([^<]*)<\/sup>|<sub>([^<]*)<\/sub>/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ t: dec(text.slice(last, m.index)) });
    if (m[1] !== undefined) {
      const at = [...m[1]].findIndex((ch, i) => ch === '/' && m[1][i - 1] !== '<');
      out.push({ x: 'frac', num: shorthandRuns(m[1].slice(0, at).trim()), den: shorthandRuns(m[1].slice(at + 1).trim()) });
    } else if (m[2] !== undefined) out.push({ t: dec(m[2]), sup: true });
    else out.push({ t: dec(m[3]), sub: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: dec(text.slice(last)) });
  return out.filter((r) => r.x || r.t);
}

export function glossaryBlocks(glossary, ctx) {
  ctx.index = null;
  ctx.mode = 'glossary';
  ctx.page = 'glossary';
  const out = [];
  for (const g of [...glossary].sort((a, b) => a.term.localeCompare(b.term))) {
    const small = { size: SMALL, after: 40 };
    out.push(para([new TextRun({ text: g.term, bold: true, size: BODY, font: FONT }), new TextRun({ text: `  ${g.level === 'H' ? '(Higher)' : ''}`, size: SMALL, font: FONT })], { after: 20 }, { keepNext: true }));
    out.push(para(runsFor(shorthandRuns(g.def), ctx, small), small, { indentLeft: 360, keepNext: true }));
    const examples = Array.isArray(g.example) ? g.example : [g.example].filter(Boolean);
    for (const ex of examples) out.push(para([new TextRun({ text: 'Example: ', italics: true, size: SMALL, font: FONT }), ...runsFor(shorthandRuns(ex), ctx, small)], small, { indentLeft: 360 }));
    if (g.watch) out.push(para([new TextRun({ text: 'Watch out: ', italics: true, size: SMALL, font: FONT }), ...runsFor(shorthandRuns(g.watch), ctx, small)], small, { indentLeft: 360 }));
  }
  return out;
}

// ---------- the whole document ----------

const partTitle = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text, font: FONT })] });

const footer = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: pageField([new TextRun({ text: '1', size: SMALL, font: FONT })]) })] });

const sectionProps = (fmt) => ({
  page: {
    size: { width: PAGE.width, height: PAGE.height },
    margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin, gutter: PAGE.gutter },
    pageNumbers: { start: 1, formatType: fmt },
  },
});

/**
 * Build the Document. `front` is the walker's tree of src/print/gcse/front.html; each chapter has a cleaned `tree` and its `figures`.
 * `placeholders` for the properties are the imprint placeholders: never a username.
 */
export function buildDocument({ front, chapters, glossary, ctx, properties }) {
  ctx.mode = 'front';
  ctx.page = 'front';
  ctx.chapter = { num: 0, title: '', id: 'front' };
  ctx.figures = front.figures;
  const frontBlocks = renderBlocks(front.tree.blocks, ctx);
  const contents = [
    new Paragraph({ children: [new TextRun({ text: 'Contents', bold: true, size: 36, font: FONT })], pageBreakBefore: true, spacing: { after: 240 } }),
    new Paragraph({ children: tocField([new TextRun({ text: 'Open this file in Word and let it update its fields to fill in the contents.', italics: true, font: FONT })]) }),
  ];
  const chapterParts = chapters.flatMap((c) => chapterBody(c, ctx));
  const answers = [partTitle('Answers'), ...chapters.flatMap((c) => chapterAnswers(c, ctx))];
  const hints = ctx.noHints ? [] : [partTitle('Hints'), ...chapters.flatMap((c) => chapterHints(c, ctx))];
  const gloss = [partTitle('Glossary'), ...glossaryBlocks(glossary, ctx)];
  const index = [partTitle('Index'), new Paragraph({ children: indexField([new TextRun({ text: 'Open this file in Word and let it update its fields to build the index.', italics: true, font: FONT })]) })];
  return new Document({
    ...properties,
    features: { updateFields: true },
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY }, paragraph: { spacing: { after: 100, line: 264 } } },
        heading1: { run: { font: FONT, size: 40, bold: true, color: ctx.mono ? '000000' : '0F2440' }, paragraph: { spacing: { before: 0, after: 240 }, keepNext: true } },
        heading2: { run: { font: FONT, size: 30, bold: true, color: ctx.mono ? '000000' : '0F2440' }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true } },
        heading3: { run: { font: FONT, size: 24, bold: true }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true } },
      },
      paragraphStyles: [],
    },
    sections: [
      { properties: sectionProps('lowerRoman'), footers: { default: footer() }, children: [...frontBlocks, ...contents] },
      { properties: sectionProps('decimal'), footers: { default: footer() }, children: [...chapterParts, ...answers, ...hints, ...gloss, ...index] },
    ],
  });
}

export { keyAnswer };
