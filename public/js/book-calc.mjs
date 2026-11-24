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
// To add a scientific keypad later: add a layout to LAYOUTS (rows of keys) with
// profile SCIENTIFIC from book-calc-engine.mjs, and ask for it with data-calc="scientific".
import { calculate, BASIC } from './book-calc-engine.mjs';

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

const digit = (d) => ({ label: d, say: d, action: 'insert', text: d, kind: 'digit' });
const key = (label, say, action, text, kind) => ({ label, say, action, text, kind });

export const LAYOUTS = {
  basic: {
    profile: BASIC,
    rows: [
      [key('AC', 'clear all', 'clear', '', 'control'), key('DEL', 'delete', 'del', '', 'control'), key('(', 'open bracket', 'insert', '(', 'open'), key(')', 'close bracket', 'insert', ')', 'bracket')],
      [digit('7'), digit('8'), digit('9'), key('÷', 'divide', 'insert', '÷', 'binary')],
      [digit('4'), digit('5'), digit('6'), key('×', 'times', 'insert', '×', 'binary')],
      [digit('1'), digit('2'), digit('3'), key('−', 'minus', 'insert', '−', 'binary')],
      [digit('0'), key('.', 'decimal point', 'insert', '.', 'digit'), key('Ans', 'previous answer', 'insert', 'Ans', 'open'), key('+', 'plus', 'insert', '+', 'binary')],
      [key('x²', 'squared', 'insert', '²', 'binary'), key('√', 'square root', 'insert', '√(', 'open'), key('^', 'to the power of', 'insert', '^', 'binary'), key('=', 'equals', 'equals', '', 'equals')],
    ],
  },
};

const OPERATORS = new Set(['+', '−', '×', '÷', '^']);
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

  const root = el('div', { class: 'q-calc' });
  const toggle = el('button', { type: 'button', class: 'btn-calc calc-toggle', 'aria-expanded': 'false', 'aria-controls': panelId, text: 'Calculator' });
  const panel = el('div', { class: 'calc', id: panelId, role: 'group', 'aria-label': 'Calculator', tabindex: '-1', hidden: '' });
  const expr = el('div', { class: 'calc-expr', 'aria-label': 'Sum so far' });
  const result = el('output', { class: 'calc-result', 'aria-live': 'polite', 'aria-label': 'Result', text: '0' });
  const pad = el('div', { class: 'calc-pad' });
  const close = el('button', { type: 'button', class: 'calc-dismiss', 'aria-label': 'Close calculator', text: 'Close' });
  panel.append(el('div', { class: 'calc-screen' }, expr, result), pad, close);
  root.append(toggle, panel);

  function render() {
    expr.textContent = tokens.map((t) => (OPERATORS.has(t) ? ` ${t} ` : t)).join('').trim() || ' ';
  }

  function startAgain() {
    tokens = [];
    fresh = false;
    result.textContent = '0';
  }

  function press(k) {
    if (k.action === 'clear') { startAgain(); render(); return; }
    if (k.action === 'del') {
      if (fresh) startAgain(); else tokens.pop();
      if (!tokens.length) result.textContent = '0';
      render();
      return;
    }
    if (k.action === 'equals') {
      if (!tokens.length) return;
      const out = calculate(tokens.join(''), { profile: layout.profile, ans });
      result.textContent = out.text;
      if (out.ok) { ans = out.value; fresh = true; }
      return;
    }
    // insert
    if (fresh) {
      const continuing = k.kind === 'binary';
      tokens = continuing ? ['Ans'] : [];
      fresh = false;
    }
    if (k.text === '.') {
      // one decimal point per number
      let i = tokens.length - 1;
      while (i >= 0 && /^[0-9.]$/.test(tokens[i])) { if (tokens[i] === '.') return; i -= 1; }
    }
    tokens.push(k.text);
    result.textContent = '0';
    render();
  }

  for (const row of layout.rows) {
    for (const k of row) {
      const btn = el('button', { type: 'button', class: `calc-key calc-${k.kind}`, 'aria-label': /[A-Za-z]/.test(k.label) ? `${k.label}, ${k.say}` : k.say, text: k.label });
      btn.addEventListener('click', () => press(k));
      pad.append(btn);
    }
  }

  const allKeys = layout.rows.flat();
  const byText = (text) => allKeys.find((k) => k.action === 'insert' && k.text === text);

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
