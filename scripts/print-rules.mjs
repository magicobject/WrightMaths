// Screen-only wording for the printed book. The build never rewrites maths text on its own: a source attribute
// (data-print="...") decides what an element prints, and the patterns below remove whole screen-only sentences or clauses.
// Anything that still mentions typing, clicking, tapping, buttons or scrolling is REPORTED, and a test fails if the report is not empty.
// A bare "type" is not a pattern ("this type of triangle" is fine); every allowlist entry says why it is allowed.

// A whole sentence is removed when it matches one of these.
export const SENTENCE_RULES = [
  { id: 'type-first', re: /^\W*type\b(?!\s+of\b)/i, why: 'an instruction to type an answer' },
  { id: 'then-type', re: /\b(?:then|and|to)\s+type\b(?!\s+of\b)/i, why: 'an instruction to type an answer' },
  { id: 'type-the', re: /\btype\s+(?:the|your|it|them|both|just|one|two|x|yes)\b/i, why: 'an instruction to type an answer' },
  { id: 'skip-to', re: /^\W*skip to\b/i, why: 'a screen link to the lesson' },
  { id: 'tap-click', re: /^\W*(?:tap|click)\b/i, why: 'an instruction to tap or click' },
  { id: 'check-my-answer', re: /\bcheck my answer\b/i, why: 'the name of a screen button' },
  { id: 'pop-up', re: /\bpop-?ups?\b/i, why: 'a screen pop-up' },
  { id: 'listen-button', re: /\blisten button\b/i, why: 'a screen button' },
  { id: 'scroll', re: /\bscroll(?:ing)?\b/i, why: 'scrolling a screen' },
];

// Just the matching words are removed from a sentence that is otherwise needed.
export const CLAUSE_RULES = [
  { id: 'skip-if-happy', re: /\s*\(\s*skip if you are happy\s*\)/i, why: 'screen advice in a heading' },
  { id: 'typed-clause', re: /,\s*typed\s*\([^)]*\)/i, why: 'a note about how to type a point' },
  { id: 'type-bracket', re: /\s*\(\s*type\b[^)]*\)/i, why: 'a bracketed typing example' },
];

// Whole headings that are only about the screen.
export const HEADING_RULES = [
  { id: 'typing-heading', re: /^(?:units and typing|typing\b.*|how to type\b.*)$/i, why: 'a heading about typing answers' },
];

// What still gets reported if it survives the rules above.
export const SCREEN_WORDS = /\b(?:type|typed|typing|click|clicked|tap|taps|button|buttons|scroll|scrolling)\b/i;

// Words that look like screen talk but are not. Each entry says why.
export const ALLOWED = [
  { re: /\btype of\b|\btypes of\b/i, why: 'ordinary English: a type of triangle or number' },
  { re: /\b(?:circle|triangle|number|graph|shape|quadrilateral|angle) type\b/i, why: 'ordinary English: the type of a shape' },
  { re: /\binverse button\b|\bshift button\b|\bequals button\b/i, why: 'a key on a real calculator' },
  { re: /\b(?:a|the|each|hot|cold|mixer|dripping|water|leaking|two|one) taps?\b/i, why: 'a water tap' },
  { re: /\bbuttons\b/i, why: 'buttons in a bag, a probability context' },
  { re: /\b(?:\d+|many|of|400|sold|in every \d+) taps\b|\btaps (?:sold|are|were)\b/i, why: 'water taps in a probability question' },
  { re: /(?:[^ -~]|pi) button/i, why: 'the pi key on a real calculator' },
];

const SENTINEL = '\ue000';

/** Sentence ranges [start, end) of a string, split after . ? ! (and a closing bracket or quote). */
export function sentenceRanges(s) {
  const out = [];
  let start = 0;
  const re = /[.?!][)\u201d"']?(?=\s|$)\s*/g;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index + m[0].length > start) out.push([start, m.index + m[0].length]);
    start = m.index + m[0].length;
  }
  if (start < s.length) out.push([start, s.length]);
  return out;
}

/** The text of runs on one line, with a sentinel for each run that is not text (a fraction, a blank...). */
export function flatten(runs) {
  return runs.map((r) => (r.t !== undefined ? r.t : SENTINEL)).join('');
}

/** Remove screen-only sentences and clauses from a paragraph's runs. Returns { runs, removed: [{rule, text}] }. */
export function stripScreenWording(runs) {
  const flat = flatten(runs);
  const cut = []; // [start, end, rule]
  for (const [a, b] of sentenceRanges(flat)) {
    const sentence = flat.slice(a, b).replaceAll(SENTINEL, 'X');
    const rule = SENTENCE_RULES.find((r) => r.re.test(sentence));
    if (rule) cut.push([a, b, rule.id]);
  }
  for (const rule of CLAUSE_RULES) {
    const re = new RegExp(rule.re.source, `${rule.re.flags.replace('g', '')}g`);
    for (let m = re.exec(flat); m; m = re.exec(flat)) cut.push([m.index, m.index + m[0].length, rule.id]);
  }
  if (!cut.length) return { runs, removed: [] };
  const dead = new Array(flat.length).fill(false);
  for (const [a, b] of cut) for (let i = a; i < b; i += 1) dead[i] = true;
  const removed = cut.map(([a, b, rule]) => ({ rule, text: flat.slice(a, b).replaceAll(SENTINEL, '[maths]').trim() }));
  const out = [];
  let pos = 0;
  for (const r of runs) {
    if (r.t === undefined) {
      if (!dead[pos]) out.push(r);
      pos += 1;
      continue;
    }
    const kept = [...r.t].map((ch, i) => (dead[pos + i] ? '' : ch)).join('');
    pos += r.t.length;
    if (kept) out.push({ ...r, t: kept });
  }
  return { runs: tidy(out), removed };
}

function tidy(runs) {
  const out = runs.map((r) => (r.t === undefined ? r : { ...r, t: r.t.replace(/ {2,}/g, ' ') }));
  while (out.length && out[0].t !== undefined && !out[0].t.trim()) out.shift();
  while (out.length && out.at(-1).t !== undefined && !out.at(-1).t.trim()) out.pop();
  if (out[0]?.t !== undefined) out[0] = { ...out[0], t: out[0].t.trimStart() };
  if (out.at(-1)?.t !== undefined) out[out.length - 1] = { ...out.at(-1), t: out.at(-1).t.trimEnd() };
  return out;
}

/** Whether a whole heading is only about the screen. */
export function dropHeading(text) {
  return HEADING_RULES.some((r) => r.re.test(text.trim()));
}

/** Screen words that survive in a string and are not on the allowlist. Returns [{word, context}]. */
export function reportScreenWords(text) {
  const out = [];
  const re = new RegExp(SCREEN_WORDS.source, 'gi');
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const context = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40);
    if (ALLOWED.some((a) => a.re.test(context))) continue;
    out.push({ word: m[0], context });
  }
  return out;
}
