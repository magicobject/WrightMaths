// Answer checking for the GCSE book. Pure functions with no DOM access, so
// test-unit/book-answer.test.mjs can test every rule directly.
//
// Two modes (set per question with data-mode):
//   value  accept anything numerically equal: 3/4, 6/8, 0.75 and 75% all match 3/4
//   exact  accept only the same written form: 6/8 does NOT match 3/4 (used for "simplify")
// Non-numeric answers (such as 6x-1) are compared as normalised text.

const MINUS = /[−–—]/g;
const UNITS = /\s*(cm³|cm\^3|cm3|m³|m\^3|m3|mm³|mm\^3|mm3|mm²|mm\^2|mm2|km²|km2|cm²|cm\^2|cm2|m²|m\^2|m2|litres?|ml|cm|mm|km|kg|m|g|l|degrees|deg|°c|°)$/;

function clean(raw) {
  // A student cannot need more than 200 characters; longer input is junk and must not freeze the tab.
  return String(raw).slice(0, 200)
    .trim()
    .toLowerCase()
    .replace(MINUS, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/^£\s*/, '')
    .replace(/^[a-z]\s*=\s*/, '')
    .replace(/(?<=[a-z)])\.$/, '')
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
/** Inequalities written another way: "4>x>=-1" is "-1<=x<4"; "x>=-1 and x<4" is "-1<=x<4"; "6.50<=x" is "6.5<=x". */
function normaliseInequality(text) {
  let t = text
    .replace(/≤/g, '<=').replace(/≥/g, '>=')
    .replace(/=</g, '<=').replace(/=>/g, '>=')
    .replace(/\.$/, '')
    .replace(/(\d\.\d*?)0+(?!\d)/g, '$1').replace(/(\d)\.(?!\d)/g, '$1');
  if (!/[<>]/.test(t)) return t;
  const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  const oneWay = (seg) => {
    const m = /^\s*(-?[\d.]+)\s*(<=|>=|<|>)\s*([a-z])\s*$/.exec(seg);
    return m ? `${m[3]}${flip[m[2]]}${m[1]}` : seg.trim();
  };
  const chain = (seg) => {
    const parts = seg.split(/(<=|>=|<|>)/).map((x) => x.trim());
    if (parts.length === 5 && parts[1][0] === '>' && parts[3][0] === '>') return `${parts[4]}${flip[parts[3]]}${parts[2]}${flip[parts[1]]}${parts[0]}`;
    return seg.trim();
  };
  const join = (a, b) => {
    // "x>=-1 and x<4" as one chain: lower bound first
    const ma = /^([a-z])(>=|>)(-?[\d.]+)$/.exec(a);
    const mb = /^([a-z])(<=|<)(-?[\d.]+)$/.exec(b);
    if (ma && mb && ma[1] === mb[1]) return `${ma[3]}${flip[ma[2]]}${ma[1]}${mb[2]}${mb[3]}`;
    const na = /^([a-z])(<=|<)(-?[\d.]+)$/.exec(a);
    const nb = /^([a-z])(>=|>)(-?[\d.]+)$/.exec(b);
    if (na && nb && na[1] === nb[1]) return `${nb[3]}${flip[nb[2]]}${nb[1]}${na[2]}${na[3]}`;
    return `${a} and ${b}`;
  };
  const ors = t.split(/\s*(?:\bor\b|;)\s*/).map((seg) => {
    const ands = seg.split(/\s*(?:\band\b|,)\s*/).map((x) => chain(oneWay(x)));
    return ands.length === 2 ? join(ands[0], ands[1]) : ands.join(' and ');
  });
  return ors.join(' or ');
}

export function textKey(raw) {
  let s = clean(raw)
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replace(/sqrt\s*(?:\(\s*(\d+)\s*\)|(\d+))/g, (_, a, b) => `√${a ?? b}`)
    .replace(/√\s*\(\s*(\d+)\s*\)/g, '√$1')
    .replace(/\((\d*√\d+)\)/g, '$1') // (3√2) means 3√2
    .replace(/\s*\/\s*/g, '/')
    // Standard form needs its multiplication sign: "4.6x10^6" and "4.6*10^6" match, "4.610^6" does not.
    .replace(/\s*[x*·]\s*(?=10\s*\^)/g, 'x')
    // A bracketed whole-number index, "a^(8)" or "7^(-2)", means the same as "a^8".
    .replace(/\^\((-?\d+)\)/g, '^$1')
    // Two solutions typed as "x = -4 or x = 3": drop the repeated "x =" so it matches "-4 or 3".
    .replace(/(\bor\b|\band\b|,)\s*[a-z]\s*=\s*/g, '$1 ')
    // A pair typed with brackets, "(2,5)", means the same as "2,5".
    .replace(/^\(([^()]*,[^()]*)\)$/, '$1')
    .replace(/^\{(.*)\}$/, '$1')
    .replace(/^(-?\d+(?:\.\d+)?(?:[\s;]+-?\d+(?:\.\d+)?)+)$/, (m) => m.trim().split(/[\s;]+/).join(','));
  if (/[<>≤≥]/.test(s)) s = normaliseInequality(s);
  // Keep one space only in a mixed number such as "1 1/2"; drop all others.
  if (/^-?\d+\s+\d+\/\d+$/.test(s)) return s.replace(/\s+/g, ' ');
  return s.replace(/[\s*·]/g, '');
}

/** True when `input` matches any of `answers` under `mode`. */
export function matches(input, answers, mode = 'value') {
  if (String(input).length > 200) return false;
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
  if (list.some((a) => textKey(a) === key)) return true;
  return mode === 'exact' && list.some((a) => sameAlgebra(input, a) === 'same');
}

// ---------- algebra written a different way ----------
// "n*3+1" and "1+3n" mean the same as "3n+1". Both sides are tried at several values of the letter.
// The typed answer must also be no longer and no more bracketed than the key, so "2(x+1)" is not
// accepted where "2x+2" (expanded) was asked for, and "x^2+7x-2x-14" is not accepted where a simplified answer was asked for.

const ALG_OK = /^[0-9a-z.+\-*/^()\s]+$/;

function algEval(src, vars) {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  const num = () => {
    const m = /^\d*\.?\d+/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return Number(m[0]);
  };
  function atom() {
    if (peek() === '(') {
      i += 1;
      const v = sum();
      if (peek() !== ')') throw new Error('bracket');
      i += 1;
      return v;
    }
    if (/[0-9.]/.test(peek() ?? '')) {
      const v = num();
      if (v === null) throw new Error('number');
      return v;
    }
    if (/[a-z]/.test(peek() ?? '')) {
      const ch = peek();
      i += 1;
      return vars[ch];
    }
    throw new Error('unexpected');
  }
  function power() {
    const base = atom();
    if (peek() === '^') {
      i += 1;
      const neg = peek() === '-';
      if (neg) i += 1;
      const e = peek() === '(' ? atom() : num();
      if (e === null) throw new Error('exponent');
      return base ** (neg ? -e : e);
    }
    return base;
  }
  function product() {
    let v = power();
    for (;;) {
      const c = peek();
      if (c === '*') { i += 1; v *= power(); }
      else if (c === '/') { i += 1; v /= power(); }
      else if (c !== undefined && (c === '(' || /[a-z0-9.]/.test(c))) v *= power(); // implicit multiplication: 3n, 2(n+1), n(n+1)
      else return v;
    }
  }
  function sum() {
    let neg = false;
    while (peek() === '+' || peek() === '-') { if (peek() === '-') neg = !neg; i += 1; }
    let v = product();
    if (neg) v = -v;
    while (peek() === '+' || peek() === '-') {
      const op = peek();
      i += 1;
      let sign = op === '-' ? -1 : 1;
      while (peek() === '+' || peek() === '-') { if (peek() === '-') sign = -sign; i += 1; }
      v += sign * product();
    }
    return v;
  }
  const out = sum();
  if (i !== s.length) throw new Error('trailing');
  return out;
}

const topTerms = (src) => {
  let depth = 0;
  let count = 1;
  const t = src.replace(/\s+/g, '').replace(/^[+-]/, '');
  for (let k = 0; k < t.length; k += 1) {
    const c = t[k];
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (depth === 0 && (c === '+' || c === '-') && !/[\^*/(]/.test(t[k - 1] ?? '')) count += 1;
  }
  return count;
};

/** 'same' when typed and key are the same algebra in an acceptable form; 'longer' when equal but not simplified; otherwise null. */
export function sameAlgebra(input, key) {
  const tidy = (t) => t.replace(/²/g, '^2').replace(/³/g, '^3').replace(/×/g, '*').replace(/\((\d+(?:\.\d+)?|[a-z])\)/g, '$1').replace(/\((\d+\/\d+)\)/g, '$1'); // (2) means 2, (1/2) means 1/2
  const unwrap = (t) => {
    let u = t.replace(/\+\(-([a-z0-9.]+)\)/g, '-$1');
    while (u.startsWith('(') && u.endsWith(')')) {
      let depth = 0;
      let whole = true;
      for (let k = 0; k < u.length - 1; k += 1) {
        if (u[k] === '(') depth += 1;
        else if (u[k] === ')') depth -= 1;
        if (depth === 0) { whole = false; break; }
      }
      if (!whole) break;
      u = u.slice(1, -1);
    }
    return u;
  };
  const a = unwrap(tidy(clean(input)));
  const b = unwrap(tidy(clean(key)));
  if (!ALG_OK.test(a) || !ALG_OK.test(b)) return null;
  if (/10\s*\^/.test(a) || /10\s*\^/.test(b)) return null; // standard form is matched by its written form, not as algebra
  const letters = [...new Set([...(a + b).replace(/[^a-z]/g, '')])].sort();
  if (letters.length < 1 || letters.length > 3) return null; // one to three letters, the same in both
  if (!/[a-z]/.test(a) || !/[a-z]/.test(b)) return null;
  try {
    const samples = [[2, 3, 5], [3, 5, 7], [5, 7, 2], [7, 2, 3], [-1, 4, 6], [0.5, 1.5, -3], [11, 13, 17]];
    for (const sample of samples) {
      const vars = Object.fromEntries(letters.map((ch, k) => [ch, sample[k]]));
      const u = algEval(a, vars);
      const v = algEval(b, vars);
      if (!Number.isFinite(u) || !Number.isFinite(v)) continue;
      if (Math.abs(u - v) > 1e-9 * Math.max(1, Math.abs(v))) return null;
    }
  } catch { return null; }
  if (/[a-z)]\/|\/[(a-z]/.test(b) && [...a.replace(/\s+/g, '')].sort().join('') !== [...b.replace(/\s+/g, '')].sort().join('')) return a.includes('/') ? 'longer' : null; // an algebraic fraction must be the same pieces, not just equal in value
  const bracketsA = (a.match(/\(/g) ?? []).length;
  const bracketsB = (b.match(/\(/g) ?? []).length;
  if (bracketsA > bracketsB) return 'longer'; // more bracketed than the key: for example a fraction that could still be cancelled
  if (bracketsB === 0 && bracketsA > 0) return 'longer';
  if (bracketsB > 0 && bracketsA === 0) return 'longer';
  return topTerms(a) <= topTerms(b) ? 'same' : 'longer';
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
/** How near a typed number is to the keyed answer: 'near' (within 2%), 'range' (within 25%), 'far', or null when it is not a number. */
export function closeness(input, answers) {
  const n = parseNumber(input);
  if (n === null) return null;
  const list = (Array.isArray(answers) ? answers : [answers]).map(parseNumber).filter((x) => x !== null);
  if (list.length === 0) return null;
  let best = Infinity;
  for (const a of list) {
    const scale = Math.max(Math.abs(a), 1e-9);
    best = Math.min(best, Math.abs(n - a) / scale);
  }
  if (best <= 0.02) return 'near';
  if (best <= 0.25) return 'range';
  return 'far';
}

/** A short, honest nudge for a wrong typed answer, or null to fall back to the generic one. */
export function feedbackFor(input, answers) {
  const list = Array.isArray(answers) ? answers : [answers];
  const numeric = list.length > 0 && list.every((a) => parseNumber(a) !== null);
  const typed = String(input).trim();
  if (numeric && parseNumber(typed) === null && !/[0-9]/.test(typed)) return 'This answer is a number. Type digits, like 12.';
  if (/^\d+(\.\d+)?e[-+]?\d+$/i.test(typed)) return 'Write E6 as x10^6, like 4.6x10^6.';
  if (list.some((k) => sameAlgebra(typed, String(k)) === 'longer')) return 'That is equal to the answer, but it is not in the form asked for. Collect like terms or write it the way the question says.';
  if (numeric && /%\s*$/.test(typed) && !list.some((a) => /%\s*$/.test(String(a)))) return 'Just the number, without the % sign.';
  if (/^[a-z]\d+$/i.test(typed) && list.some((a) => String(a).includes('^'))) return 'Write a power with ^, like x^2.';
  const sign = diagnose(input, answers);
  if (sign) return sign;
  const c = closeness(input, answers);
  if (c === 'near') return 'Very near. Check the rounding or the number of decimal places asked for.';
  if (c === 'range') return 'In the right area, but not yet. Have another go.';
  return null;
}

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
