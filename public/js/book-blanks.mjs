// "Now you finish it" boxes: each ___ becomes a small typed gap, with one Check button for the whole box.
//
// Markup (written in src/pages/books/gcse/*.html):
//   <span class="blank" data-answers="9;9.0">___</span>
// The ___ stays in the page, so it still reads correctly with no script and on a worksheet.
// data-answers is a list split on ";" (same rule as .q). data-mode="exact" on the box makes written form matter.
// Nothing typed here is stored or sent anywhere.

import { matches, splitList, parseNumber } from './book-answer.mjs?m=40';

/**
 * Gaps in one step that share the same key list of two or more different numbers (such as 5;9 and 5;9 in
 * "5 + 9 = 14") can be filled in either order, but each number must be used once: "5 + 5" is not right.
 * `stepOf[i]` says which step gap i is in. Returns arrays of gap indexes that must hold different values.
 */
export function distinctGroups(keys, stepOf) {
  const groups = new Map();
  keys.forEach((list, i) => {
    const nums = list.map((a) => parseNumber(a.replace(/^\+\s*/, '').replace(/^-\s+/, '-')));
    if (nums.some((n) => n === null)) return;
    if (new Set(nums.map((n) => Math.round(n * 1e9))).size < 2) return;
    const id = `${stepOf[i]}|${[...list].sort().join(';')}`;
    groups.set(id, [...(groups.get(id) ?? []), i]);
  });
  return [...groups.values()].filter((g) => g.length > 1);
}

// A student may type the bracket that already sits beside a gap, such as (x+1): accept it where the key has none.
function matchesGap(value, list, mode) {
  if (matches(value, list, mode)) return true;
  if (list.some((a) => /[()]/.test(a))) return false;
  const t = value.trim();
  const stripped = t.replace(/^\(\s*/, '').replace(/\s*\)$/, '');
  return stripped !== t && stripped !== '' && matches(stripped, list, mode);
}

/**
 * Mark a row of typed gaps against their keys. Pure, so test-unit can cover every rule.
 * Returns one of 'empty' | 'right' | 'wrong' for each gap, plus a summary the box can speak.
 */
export function markBlanks(values, keys, mode = 'value', groups = []) {
  const states = keys.map((list, i) => {
    const v = String(values[i] ?? '');
    if (v.trim() === '') return 'empty';
    return matchesGap(v, list, Array.isArray(mode) ? mode[i] : mode) ? 'right' : 'wrong';
  });
  let repeated = false;
  for (const group of groups) {
    const seen = new Set();
    for (const i of group) {
      if (states[i] !== 'right') continue;
      const n = Math.round((parseNumber(values[i]) ?? Number.NaN) * 1e9);
      if (seen.has(n)) {
        states[i] = 'wrong';
        repeated = true;
      }
      seen.add(n);
    }
  }
  const right = states.filter((s) => s === 'right').length;
  const empty = states.filter((s) => s === 'empty').length;
  const total = states.length;
  let message;
  if (right === total) message = total === 1 ? 'Right! Well done.' : `All ${total} right! Well done.`;
  else if (empty > 0) message = `Fill in every gap, then press Check. (${empty} still empty.)`;
  else if (repeated) message = `${right} of ${total} right. Two gaps in one step need two different numbers: look again at the red one.`;
  else message = `${right} of ${total} right. The gaps marked in red are not right yet: have another go.`;
  return { states, right, total, message, allRight: right === total };
}

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  node.append(...kids);
  return node;
}

let uid = 0;

export function enhanceFaded(box) {
  const spans = [...box.querySelectorAll('.blank[data-answers]')];
  const steps = box.querySelector('ol.steps');
  if (spans.length === 0 || !steps) return;
  // data-mode="exact" on a gap (or its box) makes the written form matter, for "in its simplest form".
  const modes = spans.map((s) => ((s.dataset.mode ?? box.dataset.mode) === 'exact' ? 'exact' : 'value'));
  const keys = spans.map((s) => splitList(s.dataset.answers));
  const steps0 = [...box.querySelectorAll('li')];
  const groups = distinctGroups(keys, spans.map((s) => steps0.indexOf(s.closest('li'))));
  const inputs = spans.map((span, i) => {
    const numeric = keys[i].every((a) => /^[0-9.,]+$/.test(a));
    const longest = Math.max(...keys[i].map((a) => a.length));
    const input = el('input', {
      type: 'text', class: 'blank-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '40',
      'aria-label': `Gap ${i + 1} of ${spans.length}`,
      ...(numeric ? { inputmode: 'decimal' } : {}),
    });
    // Wide enough for the answer plus room to type a slip, never wider than the line.
    input.style.width = `${Math.min(Math.max(longest + 2, 4), 14)}ch`;
    span.replaceWith(input);
    return input;
  });

  uid += 1;
  const statusId = `blank-status-${uid}`;
  const status = el('p', { class: 'blank-status', id: statusId, role: 'status', 'aria-live': 'polite' });
  const check = el('button', { type: 'submit', class: 'btn-check', text: 'Check' });
  const form = el('form', { class: 'blank-form', novalidate: '' });
  steps.replaceWith(form);
  form.append(steps, el('div', { class: 'blank-actions' }, check, status));
  for (const input of inputs) input.setAttribute('aria-describedby', statusId);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = markBlanks(inputs.map((i) => i.value), keys, modes, groups);
    result.states.forEach((state, i) => {
      const input = inputs[i];
      input.classList.toggle('blank-right', state === 'right');
      input.classList.toggle('blank-wrong', state === 'wrong');
      if (state === 'right') input.readOnly = true;
      if (state === 'wrong') input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    status.textContent = result.message;
    status.classList.toggle('blank-ok', result.allRight);
    if (result.allRight) {
      check.disabled = true;
      // Done: show the worked answer so they can compare their own steps with it.
      const details = box.querySelector('details.check-line');
      if (details) details.open = true;
    } else {
      const first = inputs.find((_, i) => result.states[i] !== 'right');
      first?.focus();
    }
  });
}
