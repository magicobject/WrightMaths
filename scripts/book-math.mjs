// Maths shorthand for the A-level book: {m:x^2+5x+4} becomes native MathML (no script, no font, no third party).
//
// One small, strict syntax, so a typo fails the build instead of shipping a broken equation:
//   numbers            12   3.5
//   letters            x  y  n        (one letter = one variable, drawn in italics)
//   words              sin cos tan sec cosec cot arcsin arccos arctan ln log exp lim   (upright)
//   greek              pi theta alpha beta gamma delta Delta lambda mu sigma phi omega
//   operators          + - * = < > <= >= != ~= -> , ; : /     ("-" is drawn as a true minus, "*" as a times sign)
//   powers, subscripts x^2   x^(n+1)   e^(2x)   u_n   u_(n+1)   (a power binds to the thing just before it)
//   brackets           ( ) [ ]
//   fraction           frac(a, b)             square root   sqrt(x)         nth root   root(3, x)
//   modulus            abs(x)                 vector        vec(a)          unit hat  hat(a)
//   integral           int(a, b)  or  int()   then write the rest after it:   int(0, 2) x^2 dx
//   sum                sum(r=1, n)  or  sum(r=1, infinity)
//   limit              lim(x -> 0)
//   text               "for all x"            spacing       ~   (a gap)      infinity   infinity
//   degrees            30deg
//   a derivative       frac(dy, dx)   frac(d^2y, dx^2)   (d and the letter are drawn as separate pieces)
//
// toMathML(src) gives the <math> element; toLinear(src) gives the plain-text form used in answer keys,
// search results and as the MathML alttext (for example "(x^2 + 5x + 4)/(x - 1)").

const WORDS = new Set(['sin', 'cos', 'tan', 'sec', 'cosec', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'lim', 'max', 'min', 'det', 'mod', 'rad']);
const GREEK = {
  pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ',
  lambda: 'λ', mu: 'μ', sigma: 'σ', phi: 'φ', omega: 'ω', epsilon: 'ε', rho: 'ρ', tau: 'τ',
};
const FUNCS = new Set(['frac', 'sqrt', 'root', 'abs', 'vec', 'hat', 'int', 'sum', 'lim', 'col', 'nCr']);
// Named symbols: written as a word, drawn as the sign. kind 'set' is a double-struck letter, 'op' an operator sign.
const SYMS = {
  reals: ['ℝ', 'R', 'set'], integers: ['ℤ', 'Z', 'set'], rationals: ['ℚ', 'Q', 'set'], naturals: ['ℕ', 'N', 'set'],
  elementof: ['∈', 'in', 'op'], notelementof: ['∉', 'not in', 'op'], union: ['∪', 'union', 'op'], intersect: ['∩', 'intersect', 'op'],
  implies: ['⇒', '=>', 'op'], iff: ['⇔', '<=>', 'op'], mapsto: ['↦', '->', 'op'], therefore: ['∴', 'therefore', 'op'], prop: ['∝', 'prop', 'op'],
  plusminus: ['±', '+-', 'op'],
};
const OPS = [['<=>', '⇔', '<=>'], ['=>', '⇒', '=>'], ['+-', '±', '+-'], ['<=', '≤', '<='], ['>=', '≥', '>='], ['!=', '≠', '!='], ['~=', '≈', '~='], ['->', '→', '->'], ['+', '+', '+'], ['-', '−', '-'], ['*', '×', '*'], ['=', '=', '='], ['<', '&lt;', '<'], ['>', '&gt;', '>'], [',', ',', ','], [';', ';', ';'], [':', ':', ':'], ['/', '/', '/'], ['!', '!', '!']];

function fail(src, msg) {
  throw new Error(`maths shorthand {m:${src}}: ${msg}`);
}

// ---------- tokeniser ----------

function tokenise(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i += 1; continue; }
    if (c === '"') {
      const end = src.indexOf('"', i + 1);
      if (end < 0) fail(src, 'a quote is never closed');
      out.push({ t: 'text', v: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (num) {
      out.push({ t: 'num', v: num[0] });
      i += num[0].length;
      if (src.startsWith('deg', i) && !/[a-z]/i.test(src[i + 3] ?? '')) { out.push({ t: 'deg' }); i += 3; }
      continue;
    }
    const word = /^[A-Za-z]+/.exec(src.slice(i));
    if (word) {
      const w = word[0];
      if (FUNCS.has(w) && src[i + w.length] === '(') { out.push({ t: 'func', v: w }); i += w.length; continue; }
      if (SYMS[w]) { out.push({ t: 'named', name: w }); i += w.length; continue; }
      if (w === 'infinity') { out.push({ t: 'sym', v: '∞' }); i += w.length; continue; }
      if (w === 'deg') { out.push({ t: 'deg' }); i += 3; continue; }
      if (WORDS.has(w)) { out.push({ t: 'word', v: w }); i += w.length; continue; }
      if (GREEK[w]) { out.push({ t: 'greek', v: GREEK[w], name: w }); i += w.length; continue; }
      // Anything else is a run of single-letter variables (dx, xy, 5x), each drawn on its own.
      for (const ch of w) out.push({ t: 'var', v: ch });
      i += w.length;
      continue;
    }
    if (c === '(' || c === ')' || c === '[' || c === ']') { out.push({ t: c }); i += 1; continue; }
    if (c === '^' || c === '_') { out.push({ t: c }); i += 1; continue; }
    if (c === "'") {
      const n = src.startsWith("''", i) ? 2 : 1;
      out.push({ t: 'op', v: n === 2 ? '″' : '′', lin: "'".repeat(n), prime: true });
      i += n;
      continue;
    }
    if (c === '~') { out.push({ t: 'space' }); i += 1; continue; }
    if (c === '|') fail(src, 'use abs(x) for a modulus, not |x|');
    const op = OPS.find(([s]) => src.startsWith(s, i));
    if (op) { out.push({ t: 'op', v: op[1], lin: op[2] }); i += op[0].length; continue; }
    fail(src, `unexpected character "${c}"`);
  }
  return out;
}

// ---------- parser: tokens -> a small tree ----------

function parse(src) {
  const tokens = tokenise(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];

  // A sequence of items up to a closing bracket or comma-level stop.
  function sequence(stops) {
    const items = [];
    while (pos < tokens.length && !stops.includes(peek().t) && !(stops.includes(',') && peek().t === 'op' && peek().lin === ',')) {
      items.push(withScripts(atom()));
    }
    return items;
  }

  function atom() {
    const tok = take();
    switch (tok.t) {
      case 'num': return { k: 'num', v: tok.v };
      case 'var': return { k: 'var', v: tok.v };
      case 'greek': return { k: 'greek', v: tok.v, name: tok.name };
      case 'named': return { k: 'named', name: tok.name };
      case 'sym': return { k: 'sym', v: tok.v };
      case 'word': return { k: 'word', v: tok.v };
      case 'text': return { k: 'text', v: tok.v };
      case 'deg': return { k: 'deg' };
      case 'space': return { k: 'space' };
      case 'op': return { k: 'op', v: tok.v, lin: tok.lin, prime: tok.prime };
      case '(': case '[': {
        const close = tok.t === '(' ? ')' : ']';
        const body = sequence([close]);
        if (peek()?.t !== close) fail(src, `a bracket "${tok.t}" is never closed`);
        take();
        return { k: 'group', open: tok.t, close, body };
      }
      case 'func': return func(tok.v);
      case ')': case ']': return fail(src, `an extra closing bracket "${tok.t}"`);
      case '^': case '_': return fail(src, `"${tok.t}" has nothing in front of it`);
      default: return fail(src, `cannot read "${tok.t}"`);
    }
  }

  function func(name) {
    take(); // the opening bracket
    const args = [];
    let current = [];
    while (pos < tokens.length && peek().t !== ')') {
      if (peek().t === 'op' && peek().lin === ',') { take(); args.push(current); current = []; continue; }
      current.push(withScripts(atom()));
    }
    if (peek()?.t !== ')') fail(src, `${name}( is never closed`);
    take();
    if (current.length || args.length) args.push(current);
    const need = { frac: 2, sqrt: 1, root: 2, abs: 1, vec: 1, hat: 1 }[name];
    if (need && args.length !== need) fail(src, `${name}(...) needs ${need} part${need > 1 ? 's' : ''} separated by commas`);
    if (name === 'int' && args.length !== 0 && args.length !== 2) fail(src, 'int() needs no limits, or int(lower, upper)');
    if (name === 'sum' && args.length !== 2) fail(src, 'sum(start, end) needs two parts, for example sum(r=1, n)');
    if (name === 'col' && (args.length < 2 || args.length > 3)) fail(src, 'col(a, b) or col(a, b, c) needs two or three rows');
    if (name === 'nCr' && args.length !== 2) fail(src, 'nCr(n, r) needs two parts');
    if (name === 'lim' && args.length !== 1) fail(src, 'lim(x -> 0) needs one part');
    return { k: 'func', name, args };
  }

  // x^2  x^(n+1)  u_n  u_(n+1): the script binds to the single item in front of it.
  function withScripts(base) {
    let node = base;
    for (;;) {
      const next = peek();
      if (!next || (next.t !== '^' && next.t !== '_')) return node;
      take();
      if (!peek()) fail(src, `"${next.t}" has nothing after it`);
      let arg;
      if (peek().t === '(') {
        take();
        const body = sequence([')']);
        if (peek()?.t !== ')') fail(src, 'a bracket is never closed');
        take();
        arg = { k: 'row', body };
      } else if (peek().t === 'op' && (peek().lin === '-' || peek().lin === '+')) {
        const sign = take();
        const n = take();
        if (!n || !['num', 'var', 'greek'].includes(n.t)) fail(src, `"${next.t}${sign.lin}" must be followed by a number or letter`);
        arg = { k: 'row', body: [{ k: 'op', v: sign.v, lin: sign.lin }, n.t === 'num' ? { k: 'num', v: n.v } : n.t === 'var' ? { k: 'var', v: n.v } : { k: 'greek', v: n.v, name: n.name }] };
      } else {
        const t = take();
        if (t.t === 'num') arg = { k: 'num', v: /^\d+/.exec(t.v)[0] }; // x^23 means x to the 23: one number
        else if (t.t === 'var') arg = { k: 'var', v: t.v };
        else if (t.t === 'greek') arg = { k: 'greek', v: t.v, name: t.name };
        else if (t.t === 'word') arg = { k: 'word', v: t.v };
        else fail(src, `a power or subscript cannot start with "${t.t}"`);
      }
      node = { k: next.t === '^' ? 'sup' : 'sub', base: node, arg };
    }
  }

  const tree = sequence([]);
  if (pos < tokens.length) fail(src, 'something is left over after the end');
  if (tree.length === 0) fail(src, 'it is empty');
  return tree;
}

// ---------- MathML ----------

const esc = (t) => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

function mlSeq(items) {
  return items.map(ml).join('');
}

function ml(n) {
  switch (n.k) {
    case 'num': return `<mn>${n.v}</mn>`;
    case 'var': return `<mi>${n.v}</mi>`;
    case 'greek': return `<mi>${n.v}</mi>`;
    case 'named': return SYMS[n.name][2] === 'set' ? `<mi mathvariant="double-struck">${SYMS[n.name][0]}</mi>` : `<mo>${SYMS[n.name][0]}</mo>`;
    case 'sym': return `<mi>${n.v}</mi>`;
    case 'word': return `<mi mathvariant="normal">${n.v}</mi>`;
    case 'text': return `<mtext>${esc(n.v)}</mtext>`;
    case 'deg': return '<mo>°</mo>';
    case 'space': return '<mspace width="0.5em"></mspace>';
    case 'op': return `<mo>${n.v === '&lt;' ? '&lt;' : n.v === '&gt;' ? '&gt;' : n.v}</mo>`;
    case 'group': return `<mrow><mo form="prefix" fence="true" stretchy="false" lspace="0em" rspace="0em">${n.open}</mo>${mlSeq(n.body)}<mo form="postfix" fence="true" stretchy="false" lspace="0em" rspace="0em">${n.close}</mo></mrow>`;
    case 'row': return `<mrow>${mlSeq(n.body)}</mrow>`;
    case 'sup': return `<msup>${ml(n.base)}${ml(n.arg)}</msup>`;
    case 'sub': return `<msub>${ml(n.base)}${ml(n.arg)}</msub>`;
    case 'func': return mlFunc(n);
    default: throw new Error(`maths shorthand: unknown node ${n.k}`);
  }
}

function mlFunc({ name, args }) {
  const a = (i) => `<mrow>${mlSeq(args[i])}</mrow>`;
  switch (name) {
    case 'frac': return `<mfrac>${a(0)}${a(1)}</mfrac>`;
    case 'sqrt': return `<msqrt>${mlSeq(args[0])}</msqrt>`;
    case 'root': return `<mroot><mrow>${mlSeq(args[1])}</mrow>${a(0)}</mroot>`;
    case 'abs': return `<mrow><mo>|</mo>${mlSeq(args[0])}<mo>|</mo></mrow>`;
    case 'vec': return `<mover><mrow>${mlSeq(args[0])}</mrow><mo>→</mo></mover>`;
    case 'hat': return `<mover><mrow>${mlSeq(args[0])}</mrow><mo>^</mo></mover>`;
    case 'int': return args.length ? `<msubsup><mo>∫</mo>${a(0)}${a(1)}</msubsup>` : '<mo>∫</mo>';
    case 'sum': return `<munderover><mo>∑</mo>${a(0)}${a(1)}</munderover>`;
    case 'col': return `<mrow><mo>(</mo><mtable>${args.map((row) => `<mtr><mtd>${mlSeq(row)}</mtd></mtr>`).join('')}</mtable><mo>)</mo></mrow>`;
    case 'nCr': return `<mmultiscripts><mi>C</mi><mrow>${mlSeq(args[1])}</mrow><none></none><mprescripts></mprescripts><mrow>${mlSeq(args[0])}</mrow><none></none></mmultiscripts>`;
    case 'lim': return `<munder><mi mathvariant="normal">lim</mi>${a(0)}</munder>`;
    default: throw new Error(`maths shorthand: unknown function ${name}`);
  }
}

// ---------- plain-text form ----------

// dy and d^2y are one derivative symbol: dy/dx, d^2y/dx^2 need no brackets. Anything with a sign or several terms does.
const isDerivativeSymbol = (items) => items.length >= 2 && ((items[0].k === 'var' && items[0].v === 'd') || (items[0].k === 'sup' && items[0].base.k === 'var' && items[0].base.v === 'd')) && items.slice(1).every((x) => x.k === 'var');
const needsBrackets = (items) => !isDerivativeSymbol(items) && (items.length > 1 || (items.length === 1 && items[0].k === 'op'));

function linSeq(items) {
  let out = '';
  items.forEach((n, i) => {
    const text = lin(n);
    const prev = items[i - 1];
    // A fraction next to other terms must be bracketed, or "(1/2)x" reads as "1/2x" and "27^(2/3)" as "27^2/3".
    if (n.k === 'func' && n.name === 'frac' && ((prev && prev.k !== 'op') || (items[i + 1] && items[i + 1].k !== 'op'))) { out += `(${text})`; return; }
    if (n.k === 'named' && SYMS[n.name][2] === 'op') { out += ` ${text} `; return; }
    if (n.k !== 'op') {
      const afterBigOperator = prev?.k === 'func' && ['int', 'sum', 'lim'].includes(prev.name);
      const afterWord = prev?.k === 'word' && ['var', 'num', 'greek', 'sup'].includes(n.k);
      const startsDifferential = n.k === 'var' && n.v === 'd' && items[i + 1]?.k === 'var' && prev && prev.k !== 'op' && !(prev.k === 'var' && prev.v === 'd');
      out += afterBigOperator || afterWord || startsDifferential ? ` ${text}` : text;
      return;
    }
    // "a, b"  "n!"  "-3" (a sign at the start or after another operator) and "x - 1" (a sum).
    if (n.lin === ',' || n.lin === ';') out += `${text} `;
    else if (n.lin === '!' || n.prime) out += text;
    else if ((n.lin === '-' || n.lin === '+') && (!prev || prev.k === 'op')) out += text;
    else out += ` ${text} `;
  });
  return out.replace(/ {2,}/g, ' ').trim();
}

function lin(n) {
  switch (n.k) {
    case 'num': case 'var': return n.v;
    case 'greek': return n.name;
    case 'named': return SYMS[n.name][1];
    case 'sym': return n.v === '∞' ? 'infinity' : n.v;
    case 'word': return n.v;
    case 'text': return n.v;
    case 'deg': return '°';
    case 'space': return ' ';
    case 'op': return n.lin === '&lt;' ? '<' : n.lin === '&gt;' ? '>' : n.lin === '-' ? '-' : n.lin;
    case 'group': return `${n.open}${linSeq(n.body)}${n.close}`;
    case 'row': return linSeq(n.body);
    case 'sup': return `${lin(n.base)}^${scriptLin(n.arg)}`;
    case 'sub': return `${lin(n.base)}_${scriptLin(n.arg)}`;
    case 'func': return linFunc(n);
    default: return '';
  }
}

function scriptLin(arg) {
  if (arg.k === 'row') return arg.body.length === 1 && !(arg.body[0].k === 'func' && arg.body[0].name === 'frac') ? lin(arg.body[0]) : `(${linSeq(arg.body)})`;
  return lin(arg);
}

function linFunc({ name, args }) {
  const t = (i) => linSeq(args[i]);
  switch (name) {
    case 'frac': return `${needsBrackets(args[0]) ? `(${t(0)})` : t(0)}/${needsBrackets(args[1]) ? `(${t(1)})` : t(1)}`;
    case 'sqrt': return `sqrt(${t(0)})`;
    case 'root': return `root(${t(0)}, ${t(1)})`;
    case 'abs': return `|${t(0)}|`;
    case 'vec': return `vector ${t(0)}`;
    case 'hat': return `${t(0)}-hat`;
    case 'int': return args.length ? `integral from ${t(0)} to ${t(1)} of` : 'integral of';
    case 'sum': return `sum from ${t(0)} to ${t(1)} of`;
    case 'col': return `column vector (${args.map((_, i) => t(i)).join(', ')})`;
    case 'nCr': return `${t(0)}C${t(1)}`;
    case 'lim': return `limit as ${t(0)} of`;
    default: return '';
  }
}

// ---------- public ----------

/** The <math> element for one {m:...} shorthand. `display` puts it on its own line. */
export function toMathML(src, { display = false } = {}) {
  return mathElement(parse(src), display);
}

/**
 * One <math> element. A `continuation` is the second or later piece of a split formula: if it starts with an operator
 * (= + -), that operator is an infix one, so it keeps infix spacing, and its text alternative keeps the space after it
 * ("- 4", not "-4"). A leading sign on a whole formula, such as the minus in -3, is NOT touched.
 */
function mathElement(tree, display = false, continuation = false) {
  const startsWithOperator = continuation && tree[0]?.k === 'op';
  const alt = startsWithOperator ? `${lin(tree[0])} ${linSeq(tree.slice(1))}`.trim() : linSeq(tree);
  const body = startsWithOperator ? mlSeq(tree).replace(/^<mo>/, '<mo form="infix">') : mlSeq(tree);
  return `<math${display ? ' display="block"' : ''} alttext="${esc(alt).replaceAll('"', '&quot;')}">${body}</math>`;
}

/**
 * Inline maths for running text. A formula with equals signs is cut before each top-level "=" into separate <math>
 * elements joined by a space, so a long chain such as a = b = c wraps at an equals sign on a narrow screen instead of
 * running off the line (a <math> element never breaks inside itself). Punctuation straight after the formula goes
 * inside a no-break .mw span with the last piece, so it can never land alone on a line.
 */
const LONG_PIECE = 16; // characters of plain text; shorter pieces stay in one <math>

export function toInlineMathML(src, punct = '') {
  const tree = parse(src);
  if (linSeq(tree).length <= LONG_PIECE) return punct ? `<span class="mw">${mathElement(tree)}${punct}</span>` : mathElement(tree); // short: never split
  const pieces = [];
  let current = [];
  for (const node of tree) {
    if (node.k === 'op' && node.v === '=' && current.length) { pieces.push(current); current = []; }
    current.push(node);
  }
  pieces.push(current);
  // A long piece may also break before a top-level + or -, or between two brackets, as printed maths does.
  const wrapped = pieces.flatMap((piece) => {
    if (linSeq(piece).length <= LONG_PIECE) return [piece];
    const parts = [];
    let part = [];
    piece.forEach((node, i) => {
      const before = piece[i - 1];
      // never after another operator (a sign), a limits sign (int, sum, lim) or a function name (sin, ln, ...): the sign belongs to what follows
      const signOfNext = !before || before.k === 'op' || before.k === 'word' || (before.k === 'func' && ['int', 'sum', 'lim'].includes(before.name));
      const binary = node.k === 'op' && (node.v === '+' || node.v === '−') && part.length && !signOfNext;
      const betweenBrackets = node.k === 'group' && before?.k === 'group'; // (x - 2)(x + 1): break between the brackets
      if (binary || betweenBrackets) { parts.push(part); part = []; }
      part.push(node);
    });
    parts.push(part);
    return parts;
  });
  const html = wrapped.map((piece, i) => mathElement(piece, false, i > 0));
  const last = html.pop();
  const tail = punct ? `<span class="mw">${last}${punct}</span>` : last;
  return [...html, tail].join(' ');
}

/** Plain text of the same shorthand, for answer keys, search and pop-up definitions. */
export function toLinear(src) {
  return linSeq(parse(src));
}

/** Expand every {m:...} and {md:...} (display, on its own line) in `html`. */
export function expandMath(html) {
  return html
    .replace(/\{md:([^{}]+)\}/g, (_, body) => `<span class="eq">${toMathML(body, { display: true })}</span>`)
    .replace(/\{m:([^{}]+)\}(?:([.,;:!?)]+)(?!\w))?/g, (_, body, punct) => toInlineMathML(body, punct ?? ''));
}

/** Replace every {m:...} / {md:...} with its plain-text form (no MathML). */
export function mathToLinear(html) {
  return html.replace(/\{md?:([^{}]+)\}/g, (_, body) => toLinear(body));
}
