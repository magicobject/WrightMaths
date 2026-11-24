// The calculator's brain: turns what was typed into a number. No page or browser code,
// so it is unit-tested directly. What a calculator can do is a "profile" (which
// functions, constants and postfix keys exist); BASIC is what ships, SCIENTIFIC is
// ready for a later keypad: adding sin, cos, log and so on means adding a profile
// entry and a key, not changing the parser.
//
// Conventions, chosen to match the book's own order-of-operations page:
//  - Brackets, then powers and roots, then x and / left to right, then + and -.
//  - A minus in front of a power applies after it: -3^2 is -9 (as on current school calculators).
//  - 2(3+4) or 2 sqrt(9) multiply, at the same level as x and /, left to right: 6 / 2(1+2) is 9.
//  - Unclosed brackets are closed for you at "=".
//  - Answers are shown to 10 significant figures, as on a real calculator, so 0.1 + 0.2 shows 0.3.

export class CalcError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind; // 'syntax' | 'math' | 'divzero'
  }
}

const mathCheck = (x) => {
  if (!Number.isFinite(x)) throw new CalcError('math');
  return x;
};

export const BASIC = {
  name: 'basic',
  functions: { sqrt: (x) => { if (x < 0) throw new CalcError('math'); return Math.sqrt(x); } },
  constants: {},
  postfix: { '²': (x) => x * x },
};

const toRadians = (x) => (x * Math.PI) / 180;
const fromRadians = (x) => (x * 180) / Math.PI;

export const SCIENTIFIC = {
  name: 'scientific',
  functions: {
    ...BASIC.functions,
    sin: (x) => Math.sin(toRadians(x)),
    cos: (x) => Math.cos(toRadians(x)),
    tan: (x) => {
      if (Math.abs(Math.cos(toRadians(x))) < 1e-12) throw new CalcError('math');
      return Math.tan(toRadians(x));
    },
    asin: (x) => { if (Math.abs(x) > 1) throw new CalcError('math'); return fromRadians(Math.asin(x)); },
    acos: (x) => { if (Math.abs(x) > 1) throw new CalcError('math'); return fromRadians(Math.acos(x)); },
    atan: (x) => fromRadians(Math.atan(x)),
    log: (x) => { if (x <= 0) throw new CalcError('math'); return Math.log10(x); },
    ln: (x) => { if (x <= 0) throw new CalcError('math'); return Math.log(x); },
    abs: Math.abs,
  },
  constants: { pi: Math.PI, e: Math.E },
  postfix: { ...BASIC.postfix, '³': (x) => x * x * x, '%': (x) => x / 100 },
};

const SYMBOLS = {
  '−': '-', '–': '-', '×': '*', '÷': '/', '√': 'sqrt', 'π': 'pi',
};

/** Split text into tokens: numbers, names, operators and brackets. Throws a syntax error on anything else. */
export function tokenize(text, profile = BASIC) {
  const src = String(text).replace(/[−–×÷√π]/g, (c) => ` ${SYMBOLS[c]} `);
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i += 1; continue; }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
    if (num) { tokens.push({ t: 'num', v: Number(num[1]) }); i += num[1].length; continue; }
    const name = /^[a-z]+/i.exec(src.slice(i));
    if (name) {
      const id = name[0].toLowerCase();
      if (id === 'ans') tokens.push({ t: 'ans' });
      else if (id in profile.functions) tokens.push({ t: 'fn', v: id });
      else if (id in profile.constants) tokens.push({ t: 'const', v: profile.constants[id] });
      else throw new CalcError('syntax');
      i += name[0].length;
      continue;
    }
    if ('+-*/^()'.includes(c)) { tokens.push({ t: c }); i += 1; continue; }
    if (c in profile.postfix) { tokens.push({ t: 'post', v: c }); i += 1; continue; }
    throw new CalcError('syntax');
  }
  return tokens;
}

/** Evaluate text to a number. `ans` is the previous answer for the Ans key. Throws CalcError. */
export function evaluate(text, { profile = BASIC, ans = 0 } = {}) {
  const tokens = tokenize(text, profile);
  let opens = 0;
  for (const tok of tokens) { if (tok.t === '(') opens += 1; else if (tok.t === ')') opens -= 1; if (opens < 0) throw new CalcError('syntax'); }
  for (let k = 0; k < opens; k += 1) tokens.push({ t: ')' });
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => { pos += 1; return tokens[pos - 1]; };
  // A number straight after a number is a typing slip (1.2.3), not a multiplication, so it is not listed here.
  const startsOperand = (tok) => tok && (tok.t === 'const' || tok.t === 'ans' || tok.t === 'fn' || tok.t === '(');

  function expression() {
    let left = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = take().t;
      const right = term();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function term() {
    let left = unary();
    for (;;) {
      const next = peek();
      if (next && (next.t === '*' || next.t === '/')) {
        take();
        const right = unary();
        if (next.t === '/' && right === 0) throw new CalcError('divzero');
        left = next.t === '*' ? left * right : left / right;
      } else if (startsOperand(next)) {
        left *= unary(); // implicit multiplication: 2(3+4), 3 sqrt(4)
      } else return left;
    }
  }

  function unary() {
    const next = peek();
    if (next && next.t === '-') { take(); return -unary(); }
    if (next && next.t === '+') { take(); return unary(); }
    return power();
  }

  function power() {
    const base = postfix();
    if (peek() && peek().t === '^') {
      take();
      const exponent = unaryExponent();
      return mathCheck(base ** exponent);
    }
    return base;
  }

  // The exponent may carry its own sign (2^-1) and is right-associative (2^3^2 is 2^9).
  function unaryExponent() {
    const next = peek();
    if (next && next.t === '-') { take(); return -unaryExponent(); }
    if (next && next.t === '+') { take(); return unaryExponent(); }
    return power();
  }

  function postfix() {
    let value = primary();
    while (peek() && peek().t === 'post') value = mathCheck(profile.postfix[take().v](value));
    return value;
  }

  function primary() {
    const tok = take();
    if (!tok) throw new CalcError('syntax');
    if (tok.t === 'num' || tok.t === 'const') return tok.v;
    if (tok.t === 'ans') return ans;
    if (tok.t === 'fn') {
      const argument = peek() && peek().t === '(' ? primary() : unary();
      return mathCheck(profile.functions[tok.v](argument));
    }
    if (tok.t === '(') {
      const inside = expression();
      if (!peek() || take().t !== ')') throw new CalcError('syntax');
      return inside;
    }
    throw new CalcError('syntax');
  }

  const value = expression();
  if (pos !== tokens.length) throw new CalcError('syntax');
  return mathCheck(value);
}

export const MESSAGES = {
  syntax: 'Check your sum',
  math: 'Cannot work that out',
  divzero: 'Cannot divide by zero',
};

/** What the display shows: 10 significant figures, trailing zeros dropped, E notation for very big or small. */
export function formatNumber(x) {
  if (!Number.isFinite(x)) return MESSAGES.math;
  if (x === 0) return '0';
  const rounded = Number(x.toPrecision(10));
  const abs = Math.abs(rounded);
  if (abs >= 1e10 || abs < 1e-9) {
    const [mantissa, exponent] = rounded.toExponential(9).split('e');
    return `${mantissa.replace(/\.?0+$/, '')}E${Number(exponent)}`;
  }
  return String(rounded);
}

/** Evaluate and format in one go, for the keypad. Never throws. */
export function calculate(text, options = {}) {
  try {
    const value = evaluate(text, options);
    return { ok: true, value, text: formatNumber(value) };
  } catch (error) {
    if (error instanceof CalcError) return { ok: false, text: MESSAGES[error.kind] ?? MESSAGES.syntax };
    throw error;
  }
}
