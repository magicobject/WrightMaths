// One source, two paperbacks. These pure functions cut the Higher-only parts out of a walked page tree for the Foundation book,
// and number what is left. The marker is the page's own `<span class="chip chip-higher">Higher</span>`, which the walker turns
// into a run with `chip: true`. Nothing here touches the file system or the browser, so it is unit tested directly.
//
// What counts as Higher (see docs/print-edition.md):
//   a heading with the chip      that heading and everything after it up to the next heading of the same or a higher level
//   a question whose qtext has the chip     that one question
//   any other paragraph with the chip       just the sentence that carries it (for example "The sections marked Higher are ...")
// A section left with nothing in it goes too.

import { runsToText } from './omml.mjs';

export const TIERS = ['foundation', 'higher'];

/** The words under the title, and the document's title property, for each book. `null` is the whole-book build. */
export const TIER_LABEL = { foundation: 'Foundation', higher: 'Higher' };
export const WHOLE_SUBTITLE = 'Foundation and Higher';

const hasChip = (runs) => Array.isArray(runs) && runs.some((r) => r.chip);
const isQuestion = (n) => n.t === 'q' && Array.isArray(n.body);

/** A question is Higher when a chip is in its question text. */
export function isHigherQuestion(q) {
  return q.higher === true || q.body.some((b) => b.t === 'qtext' && hasChip(b.runs));
}

// Only the page's own ways of saying "this is Higher". Everyday uses ("Higher value minus lower value") are not markers.
const HIGHER_WORD = /\(Higher\)|\bHigher (?:tier|only|parts?|chip|sections?)\b|\bmarked Higher\b|\bFoundation and Higher\b|\bfor Higher\b/;
const HIGHER_NOTE = /^\s*Higher tier:/;
const lengthOf = (r) => (typeof r.t === 'string' ? r.t.length : 1); // a fraction or a gap counts as one character

/** Where the first Higher marker is, as a character position in the runs' text: a chip, or the word "Higher" in plain text. -1 if none. */
function markerPos(runs) {
  let pos = 0;
  for (const r of runs) {
    if (r.chip) return pos;
    if (typeof r.t === 'string') { const m = HIGHER_WORD.exec(r.t); if (m) return pos + m.index; }
    pos += lengthOf(r);
  }
  return -1;
}

/** Runs with the sentence that holds a marker taken out ("... only. The sections marked Higher are for Higher." -> "... only."), for every marker. */
export function dropChipSentence(runs) {
  let current = runs;
  for (let at = markerPos(current); at >= 0; at = markerPos(current)) {
    const text = current.map((r) => (typeof r.t === 'string' ? r.t : '#')).join('');
    let start = 0;
    for (const m of text.slice(0, at).matchAll(/[.!?]\s+/g)) start = m.index + m[0].length;
    const after = /[.!?](\s+|$)/.exec(text.slice(at));
    const end = after ? at + after.index + after[0].length : text.length;
    const out = [];
    let pos = 0;
    for (const r of current) {
      const from = pos;
      pos += lengthOf(r);
      if (typeof r.t !== 'string') {
        if (from < start || from >= end) out.push(r);
      } else {
        const kept = r.t.slice(0, Math.max(0, start - from)) + r.t.slice(Math.max(0, end - from));
        if (kept) out.push({ ...r, t: kept });
      }
    }
    current = out;
  }
  return current;
}

/** Remove the Higher parts from a list of blocks (and, recursively, from everything inside them). Returns a new list. */
export function dropHigher(blocks) {
  const out = [];
  let skipLevel = null;
  for (const b of blocks) {
    if (b && b.t === 'h') {
      if (hasChip(b.runs)) { skipLevel = b.level; continue; }
      if (skipLevel !== null && b.level <= skipLevel) skipLevel = null;
    }
    if (skipLevel !== null) continue;
    const kept = keepBlock(b);
    if (kept) out.push(kept);
  }
  return out;
}

function keepBlock(b) {
  if (!b || typeof b !== 'object') return b;
  if (isQuestion(b)) return isHigherQuestion(b) ? null : b;
  let node = b;
  // a note that starts "Higher tier:" is about Higher content only, and goes whole (so nothing like "See Identity" is left behind)
  if (b.t === 'p' && Array.isArray(b.runs) && HIGHER_NOTE.test(runsToText(b.runs))) return null;
  if (Array.isArray(b.runs) && b.t === 'p') {
    // words marked data-tier="H" go; then any sentence still carrying a chip or the word "Higher" goes
    const runs = dropChipSentence(b.runs.filter((r) => !r.hi));
    if (!runs.some((r) => r.x || (r.t && r.t.trim()))) return null;
    node = { ...b, runs };
  } else if (hasChip(b.runs)) {
    node = { ...b, runs: b.runs.filter((r) => !r.chip) };
  }
  if (Array.isArray(node.blocks)) {
    const blocks = dropHigher(node.blocks);
    if (!blocks.length && node.blocks.length) return null; // everything in it was Higher
    node = { ...node, blocks };
  }
  if (node.t === 'list') {
    const items = node.items.map((item) => dropHigher(item)).filter((item) => item.length);
    if (!items.length && node.items.length) return null;
    node = { ...node, items };
  }
  return node;
}

/** Every Higher label still in a tree outside the questions: a chip, or the word "Higher" in text. For the report. */
export function chipsLeft(node, found = []) {
  if (Array.isArray(node)) { for (const n of node) chipsLeft(n, found); return found; }
  if (!node || typeof node !== 'object') return found;
  if (node.chip || (node.t === 'p' && Array.isArray(node.runs) && HIGHER_WORD.test(runsToText(node.runs)))) found.push(node);
  if (isQuestion(node)) { // a question's own text and chip are checked, its hints and solutions may say "higher" in the everyday way
    for (const b of node.body) if (b.t === 'qtext' && hasChip(b.runs)) found.push(b);
    return found;
  }
  for (const v of Object.values(node)) if (typeof v === 'object') chipsLeft(v, found);
  return found;
}

/** Number the questions of a page from 1, in page order, skipping none. The web number is kept as `webN`. Changes the tree in place. */
export function renumberQuestions(node) {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) { for (const y of x) walk(y); return; }
    if (!x || typeof x !== 'object') return;
    if (isQuestion(x)) { n += 1; x.webN = x.n; x.n = n; return; }
    for (const v of Object.values(x)) if (typeof v === 'object') walk(v);
  };
  walk(node);
  return n;
}

/** The subtitle line of the title page: "Foundation and Higher" becomes "Foundation" or "Higher" for a single-tier book. */
export function retitleFront(blocks, tier) {
  const word = TIER_LABEL[tier];
  const walk = (x) => {
    if (Array.isArray(x)) return x.map(walk);
    if (!x || typeof x !== 'object') return x;
    const out = {};
    for (const [k, v] of Object.entries(x)) out[k] = k === 'runs' && runsToText(v).trim() === WHOLE_SUBTITLE ? [{ t: word }] : walk(v);
    return out;
  };
  return walk(blocks);
}

/**
 * The other half of dropHigher: only the Higher material of a Foundation topic, for the Higher book.
 * Same rules, so a question or section is in exactly one of the two books.
 *   a heading with the chip      that heading and its whole section (up to a heading of the same or a higher level)
 *   a Higher question            that question, under the nearest h2 so it has a heading
 *   a list item that is Higher   the item ("(Higher) find arc lengths ..."), or the words marked data-tier="H"
 * Foundation text, and the notes about Higher ("Higher tier: the next question.") are not Higher material and are left out.
 * A container with nothing Higher in it is left out.
 */
export function keepOnlyHigher(blocks) {
  const out = [];
  let capture = null; // level of the chip heading whose section is being kept
  let context = null; // the latest ordinary h2, put in front of the first Higher thing under it
  let contextShown = true;
  const push = (b) => {
    if (context && !contextShown) { out.push(context); contextShown = true; }
    out.push(b);
  };
  for (const b of blocks) {
    if (b && b.t === 'h') {
      if (hasChip(b.runs)) { capture = b.level; out.push(b); continue; }
      if (capture !== null && b.level <= capture) capture = null;
      if (capture === null) {
        if (b.level <= 2) { context = b; contextShown = false; }
        continue;
      }
    }
    if (capture !== null) { out.push(b); continue; }
    const part = higherPartOf(b);
    if (part) push(part);
  }
  return out;
}

const trimLead = (runs) => {
  const out = runs.map((r) => ({ ...r, hi: undefined }));
  if (out.length && typeof out[0].t === 'string') out[0].t = out[0].t.replace(/^[\s,]*(?:and\s+)?/, '');
  return out.filter((r) => r.x || r.t);
};

function higherPartOf(b) {
  if (!b || typeof b !== 'object') return null;
  if (isQuestion(b)) return isHigherQuestion(b) ? b : null;
  if (b.t === 'list') {
    const items = [];
    for (const item of b.items) {
      const whole = item.length && dropHigher(item).length === 0; // every sentence of the item was a Higher one
      if (whole) { items.push(item); continue; }
      const words = item.filter((x) => x.t === 'p' && Array.isArray(x.runs) && x.runs.some((r) => r.hi)).map((x) => ({ ...x, runs: trimLead(x.runs.filter((r) => r.hi)) }));
      if (words.length) items.push(words);
    }
    return items.length ? { ...b, items } : null;
  }
  if (Array.isArray(b.blocks)) {
    const blocks = keepOnlyHigher(b.blocks);
    return blocks.length ? { ...b, blocks } : null;
  }
  return null;
}

/** The glossary ids used (as {term:} links) anywhere in some trees. */
export function termsUsed(node, found = new Set()) {
  if (Array.isArray(node)) { for (const n of node) termsUsed(n, found); return found; }
  if (!node || typeof node !== 'object') return found;
  if (typeof node.term === 'string' && node.t !== undefined) found.add(node.term);
  for (const v of Object.values(node)) if (typeof v === 'object') termsUsed(v, found);
  return found;
}

/** The glossary for a book. Foundation: the entries that are not Higher only. Higher: the Higher-only entries and any term a printed chapter uses. */
export function glossaryForBook(glossary, tier, usedIds = new Set()) {
  if (tier === 'foundation') return glossary.filter((g) => g.level !== 'H');
  if (tier === 'higher') return glossary.filter((g) => g.level === 'H' || usedIds.has(g.id));
  return glossary;
}

/** Which of the chapters belong in a book. A topic is in the Foundation book when its tier is 'F'; the Higher book has them all. */
export function topicsForTier(topics, tier) {
  return tier === 'foundation' ? topics.filter((t) => t.tier === 'F') : topics;
}

/** The papers in each book. The whole book has both, and always has the question words. */
export function papersForTier(papers, tier) {
  if (!tier) return papers;
  return papers.filter((p) => p.id === 'command-words' || p.id === (tier === 'foundation' ? 'foundation' : 'stretch'));
}

