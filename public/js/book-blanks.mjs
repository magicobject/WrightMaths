// "Now you finish it" boxes: each ___ becomes a small typed gap, with one Check button for the whole box.
//
// Markup (written in src/pages/books/gcse/*.html):
//   <span class="blank" data-answers="9;9.0">___</span>
// The ___ stays in the page, so it still reads correctly with no script and on a worksheet.
// data-answers is a list split on ";" (same rule as .q). data-mode="exact" on the box makes written form matter.
// Nothing typed here is stored or sent anywhere.

import { matches, splitList } from './book-answer.mjs?m=39';

/**
 * Mark a row of typed gaps against their keys. Pure, so test-unit can cover every rule.
 * Returns one of 'empty' | 'right' | 'wrong' for each gap, plus a summary the box can speak.
 */
export function markBlanks(values, keys, mode = 'value') {
  const states = keys.map((list, i) => {
    const v = String(values[i] ?? '');
    if (v.trim() === '') return 'empty';
    return matches(v, list, mode) ? 'right' : 'wrong';
  });
  const right = states.filter((s) => s === 'right').length;
  const empty = states.filter((s) => s === 'empty').length;
  const total = states.length;
  let message;
  if (right === total) message = total === 1 ? 'Right! Well done.' : `All ${total} right! Well done.`;
  else if (empty > 0) message = `Fill in every gap, then press Check. (${empty} still empty.)`;
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
  const mode = box.dataset.mode === 'exact' ? 'exact' : 'value';
  const keys = spans.map((s) => splitList(s.dataset.answers));
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
    const result = markBlanks(inputs.map((i) => i.value), keys, mode);
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
