// Answer checking for the GCSE book. Pure functions with no DOM access, so
// test-unit/book-answer.test.mjs can test every rule directly.
//
// Two modes (set per question with data-mode):
//   value  accept anything numerically equal: 3/4, 6/8, 0.75 and 75% all match 3/4
//   exact  accept only the same written form: 6/8 does NOT match 3/4 (used for "simplify")
// Non-numeric answers (such as 6x-1) are compared as normalised text.

const MINUS = /[−–—]/g;
const UNITS = /\s*(cm²|cm\^2|cm2|m²|m\^2|m2|cm|mm|km|kg|m|g|degrees|deg|°)$/;

function clean(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(MINUS, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/^£\s*/, '')
    .replace(/^[a-z]\s*=\s*/, '')
    .replace(UNITS, '')
    .trim();
}

/** Parse a typed number: 12, -3.5, 3/4, "1 1/2", 75%, £4.50, 12cm. Returns null if it is not a number. */
export function parseNumber(raw) {
  let s = clean(raw);
  if (s === '') return null;
  let percent = false;
  if (s.endsWith('%')) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  s = s.replace(/^(\d{1,3}(?:,\d{3})+)(\.\d+)?$/, (m) => m.replaceAll(',', ''));
  let value = null;
  let m;
  if ((m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/))) {
    const whole = Number(m[1]);
    const frac = Number(m[2]) / Number(m[3]);
    if (Number(m[3]) === 0) return null;
    value = whole < 0 || m[1].startsWith('-') ? whole - frac : whole + frac;
  } else if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/))) {
    if (Number(m[2]) === 0) return null;
    value = Number(m[1]) / Number(m[2]);
  } else if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
    value = Number(s);
  }
  if (value === null || Number.isNaN(value)) return null;
  return percent ? value / 100 : value;
}

const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

/** A text key for non-numeric / exact comparison: spaces and multiplication signs ignored, roots and powers unified. */
export function textKey(raw) {
  let s = clean(raw)
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replace(/sqrt\s*\(?\s*(\d+)\s*\)?/g, '√$1')
    .replace(/√\s*\(\s*(\d+)\s*\)/g, '√$1')
    .replace(/\s*\/\s*/g, '/');
  // Keep one space only in a mixed number such as "1 1/2"; drop all others.
  if (/^-?\d+\s+\d+\/\d+$/.test(s)) return s.replace(/\s+/g, ' ');
  return s.replace(/[\s*·]/g, '');
}

/** True when `input` matches any of `answers` under `mode`. */
export function matches(input, answers, mode = 'value') {
  const list = Array.isArray(answers) ? answers : [answers];
  if (String(input).trim() === '') return false;
  if (mode === 'value') {
    const n = parseNumber(input);
    if (n !== null) {
      for (const a of list) {
        const an = parseNumber(a);
        if (an !== null && close(n, an)) return true;
      }
      return false;
    }
  }
  const key = textKey(input);
  return list.some((a) => textKey(a) === key);
}

/** In exact mode: the value is right but the written form is not what was asked for. */
export function rightValueWrongForm(input, answers) {
  const n = parseNumber(input);
  if (n === null) return false;
  const list = Array.isArray(answers) ? answers : [answers];
  return list.some((a) => {
    const an = parseNumber(a);
    return an !== null && close(n, an);
  }) && !matches(input, list, 'exact');
}

/** Split a data attribute like "3/2;1 1/2" into a trimmed list. */
export function splitList(attr) {
  return String(attr ?? '').split(';').map((x) => x.trim()).filter((x) => x !== '');
}

/**
 * Generic hints for slips that need no hand-written message. Returns a short
 * sentence or null. Only for numeric answers.
 *  - right size, wrong sign
 *  - 10, 100, 1000 times too big or too small (a decimal point or a zero slipped)
 */
export function diagnose(input, answers) {
  const n = parseNumber(input);
  if (n === null) return null;
  const list = (Array.isArray(answers) ? answers : [answers]).map(parseNumber).filter((x) => x !== null);
  if (list.length === 0) return null;
  for (const a of list) {
    if (n !== 0 && close(-n, a)) return 'Check the sign: should the answer be positive or negative?';
  }
  for (const a of list) {
    if (a === 0 || n === 0) continue;
    const ratio = n / a;
    for (const p of [10, 100, 1000]) {
      if (close(ratio, p)) return 'Your answer is ' + p.toLocaleString('en-GB') + ' times too big. Check the decimal point or a zero.';
      if (close(ratio, 1 / p)) return 'Your answer is ' + p.toLocaleString('en-GB') + ' times too small. Check the decimal point or a zero.';
    }
  }
  return null;
}
