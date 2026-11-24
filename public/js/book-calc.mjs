// The on-page calculator for questions where a calculator is allowed. It is built
// into the question it belongs to (a button under the answer box opens a keypad),
// so it simply does not exist for non-calculator questions. Nothing is stored or sent.
//
// Where is a calculator allowed? In order:
//   1. the question's own tag, "Calculator" or "Non-calculator" (the same tag students see);
//   2. otherwise data-calc="yes" on the question or on a section around it;
//   3. otherwise no.
// A "Non-calculator" tag always wins.
//
// Keypads: data-calc="yes" (or a Calculator tag) gives the basic keypad; data-calc="scientific" gives the
// scientific one (sin, cos, tan and inverses, log, ln, pi, cubes, roots, x10^x, angles in degrees).
// To add another keypad, add an entry to LAYOUTS: rows of keys, a profile from book-calc-engine.mjs,
// optional cols, show (how an inserted piece is displayed) and note.
import { calculate, BASIC, SCIENTIFIC } from './book-calc-engine.mjs';

export function calcAllowed(q) {
  const tag = q.querySelector(':scope > .qtext .qtag-calc')?.textContent.trim().toLowerCase();
  if (tag === 'non-calculator') return false;
  if (tag === 'calculator') return true;
  const mark = q.closest('[data-calc]')?.dataset.calc;
  return mark === 'yes' || (typeof mark === 'string' && mark in LAYOUTS);
}

/** Which keypad a question gets: a named layout from data-calc, else the basic one. */
export function layoutFor(q) {
  const mark = q.closest('[data-calc]')?.dataset.calc;
  return LAYOUTS[mark] ?? LAYOUTS.basic;
}

// say: extra words for a screen reader ('' when the label already says it).
// A function key: inserts its name and an opening bracket, like sin(.
const fn = (label, say, text, kind = 'fn') => ({ label, say, action: 'insert', text, kind });
const digit = (d) => ({ label: d, say: d, action: 'insert', text: d, kind: 'digit' });
const key = (label, say, action, text, kind) => ({ label, say, action, text, kind });

export const LAYOUTS = {
  basic: {
    profile: BASIC,
    rows: [
      [key('Clear', '', 'clear', '', 'control'), key('Delete', '', 'del', '', 'control'), key('(', 'open bracket', 'insert', '(', 'open'), key(')', 'close bracket', 'insert', ')', 'bracket')],
      [digit('7'), digit('8'), digit('9'), key('÷', 'divide', 'insert', '÷', 'binary')],
      [digit('4'), digit('5'), digit('6'), key('×', 'times', 'insert', '×', 'binary')],
      [digit('1'), digit('2'), digit('3'), key('−', 'minus', 'insert', '−', 'binary')],
      [digit('0'), key('.', 'decimal point', 'insert', '.', 'digit'), key('Ans', 'previous answer', 'insert', 'Ans', 'open'), key('+', 'plus', 'insert', '+', 'binary')],
      [key('x²', 'squared', 'insert', '²', 'binary'), key('√', 'square root', 'insert', '√(', 'open'), key('^', 'to the power of', 'insert', '^', 'binary'), key('=', 'equals', 'equals', '', 'equals')],
    ],
  },
  scientific: {
    profile: SCIENTIFIC,
    cols: 5,
    mode: 'DEG', // shown beside the display: angles are in degrees
    // What is shown for pieces whose typed form is not pretty.
    show: { 'asin(': 'sin⁻¹(', 'acos(': 'cos⁻¹(', 'atan(': 'tan⁻¹(' },
    rows: [
      [fn('sin', 'sine', 'sin('), fn('cos', 'cosine', 'cos('), fn('tan', 'tangent', 'tan('), fn('log', 'log base 10', 'log('), fn('ln', 'natural log', 'ln(')],
      [fn('sin⁻¹', 'inverse sine', 'asin('), fn('cos⁻¹', 'inverse cosine', 'acos('), fn('tan⁻¹', 'inverse tangent', 'atan('), fn('π', 'pi', 'π'), fn('×10ˣ', 'times ten to the power', '×10^(')],
      [key('x²', 'squared', 'insert', '²', 'binary'), key('x³', 'cubed', 'insert', '³', 'binary'), fn('√', 'square root', '√(', 'fnbig'), fn('∛', 'cube root', '∛(', 'fnbig'), key('^', 'to the power of', 'insert', '^', 'binary')],
      [key('(', 'open bracket', 'insert', '(', 'open'), key(')', 'close bracket', 'insert', ')', 'bracket'), key('Ans', 'previous answer', 'insert', 'Ans', 'open'), key('Delete', '', 'del', '', 'control'), key('Clear', '', 'clear', '', 'control')],
      [digit('7'), digit('8'), digit('9'), key('÷', 'divide', 'insert', '÷', 'binary'), key('×', 'times', 'insert', '×', 'binary')],
      [digit('4'), digit('5'), digit('6'), key('+', 'plus', 'insert', '+', 'binary'), key('−', 'minus', 'insert', '−', 'binary')],
      [digit('1'), digit('2'), digit('3'), digit('0'), key('.', 'decimal point', 'insert', '.', 'digit')],
      [{ ...key('=', 'equals', 'equals', '', 'equals'), span: 5 }],
    ],
  },
};

const OPERATORS = new Set(['+', '−', '×', '÷', '^']);
// A minus after these (or after any opening bracket such as sin() starts a negative number.
const isStrong = (t) => ['×', '÷', '^'].includes(t) || (typeof t === 'string' && t.endsWith('('));
const KEYBOARD = { '*': '×', '/': '÷', '-': '−', x: '×' };

const el = (tag, attrs = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const kid of kids) node.append(kid);
  return node;
};

let calcUid = 0;

/** Build the calculator for one question. Returns the element to place after the answer area. */
export function createCalculator(layout = LAYOUTS.basic) {
  calcUid += 1;
  const panelId = `calc-${calcUid}`;
  let tokens = [];
  let ans = 0;
  let fresh = false; // true right after "=": the next key starts a new sum (or continues from Ans)
  let errored = false; // true after an error: the next key starts a new sum

  const root = el('div', { class: 'q-calc' });
  const icon = el('span', { class: 'calc-icon', 'aria-hidden': 'true', text: '🧮' });
  const toggle = el('button', { type: 'button', class: 'btn-calc calc-toggle', 'aria-expanded': 'false', 'aria-controls': panelId }, icon, document.createTextNode(' Calculator'));
  const panel = el('div', { class: `calc calc-${layout.cols ?? 4}col`, id: panelId, role: 'group', 'aria-label': 'Calculator', tabindex: '-1', hidden: '' });
  const expr = el('div', { class: 'calc-expr', 'aria-label': 'Sum so far' });
  const result = el('output', { class: 'calc-result', 'aria-live': 'polite', 'aria-label': 'Result' });
  const pad = el('div', { class: 'calc-pad', 'data-cols': String(layout.cols ?? 4) });
  const close = el('button', { type: 'button', class: 'calc-dismiss', 'aria-label': 'Close calculator', text: 'Close' });
  const tip = el('p', { class: 'calc-tip', text: 'Then type your answer in the answer box.' });
  const mode = layout.mode
    ? el('span', { class: 'calc-mode' }, el('span', { 'aria-hidden': 'true', text: layout.mode }), el('span', { class: 'sr-only', text: 'Angles are in degrees' }))
    : null;
  panel.append(el('div', { class: 'calc-head' }, tip, close), el('div', { class: 'calc-screen' }, ...(mode ? [mode] : []), expr, result), pad);
  root.append(toggle, panel);

  const show = (text) => { result.textContent = text.replaceAll('-', '−'); };

  function render() {
    expr.textContent = tokens.map((t, i) => {
      const shown = layout.show?.[t] ?? t;
      if (!OPERATORS.has(t)) return shown;
      // a minus that starts a negative number sits tight against it: sin(−30, not sin( − 30
      return t === '−' && (i === 0 || isStrong(tokens[i - 1])) ? t : ` ${t} `;
    }).join('').replace(/\s+/g, ' ').trim() || ' ';
    expr.scrollLeft = expr.scrollWidth; // keep the end of a long sum in view
  }

  function startAgain() {
    tokens = [];
    fresh = false;
    errored = false;
    show('');
  }

  // The number being typed at the end of the sum, as a string ("" when the last token is not a digit or point).
  const currentNumber = () => {
    let i = tokens.length;
    while (i > 0 && /^[0-9.]$/.test(tokens[i - 1])) i -= 1;
    return tokens.slice(i).join('');
  };

  function press(k) {
    if (k.action === 'clear') { startAgain(); render(); return; }
    if (k.action === 'del') {
      if (fresh) startAgain(); else { tokens.pop(); errored = false; show(''); }
      render();
      return;
    }
    if (k.action === 'equals') {
      if (!tokens.length) return;
      const out = calculate(tokens.join(''), { profile: layout.profile, ans });
      show(out.text);
      if (out.ok) { ans = out.value; fresh = true; errored = false; } else errored = true;
      return;
    }
    // insert
    if (errored) startAgain();
    if (fresh) {
      tokens = k.kind === 'binary' ? ['Ans'] : [];
      fresh = false;
      show('');
    }
    const last = tokens[tokens.length - 1];
    if (k.text === '.' && currentNumber().includes('.')) return; // one decimal point per number
    if (k.kind === 'digit' && k.text !== '.' && currentNumber() === '0') tokens.pop(); // no leading zero: 05 is 5
    if (k.kind === 'binary' && OPERATORS.has(k.text) && OPERATORS.has(last)) {
      // A second operator replaces the first, except a minus after x, / or ^ (a negative number).
      if (!(k.text === '−' && isStrong(last))) tokens.pop();
    }
    tokens.push(k.text);
    show('');
    render();
  }

  for (const row of layout.rows) {
    for (const k of row) {
      const btn = el('button', {
        type: 'button', class: `calc-key calc-${k.kind}`, text: k.label,
        'aria-label': k.say === '' ? k.label : (/\p{L}/u.test(k.label) ? `${k.label}, ${k.say}` : k.say),
      });
      if (k.span) btn.style.gridColumn = `span ${k.span}`;
      btn.addEventListener('click', () => press(k));
      pad.append(btn);
    }
  }

  const allKeys = layout.rows.flat();
  // A typed character finds its key by what it inserts or by what is printed on it (so a typed √ presses the √ key).
  const byText = (text) => allKeys.find((k) => k.action === 'insert' && (k.text === text || k.label === text));

  function open() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    panel.focus();
  }
  function shut(returnFocus = true) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => (panel.hidden ? open() : shut(false)));
  close.addEventListener('click', () => shut());

  panel.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { key: pressed } = event;
    if (pressed === 'Escape') { event.preventDefault(); shut(); return; }
    // Enter on a focused key presses that key; anywhere else it means "equals".
    if (pressed === 'Enter' && event.target.tagName === 'BUTTON') return;
    if (pressed === 'Enter' || pressed === '=') { event.preventDefault(); press(allKeys.find((k) => k.action === 'equals')); return; }
    if (pressed === 'Backspace') { event.preventDefault(); press(allKeys.find((k) => k.action === 'del')); return; }
    if (pressed === 'Delete') { event.preventDefault(); press(allKeys.find((k) => k.action === 'clear')); return; }
    const text = KEYBOARD[pressed] ?? pressed;
    const k = byText(text);
    if (k) { event.preventDefault(); press(k); }
  });

  render();
  return { root, toggle, panel };
}
