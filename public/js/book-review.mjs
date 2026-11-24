// Reviewer mode: add ?review=1 to any book page to see every question with all its
// hints, the messages for known wrong answers, the answer and the full solution
// open at once. For checking the book (and printing it for a colleague), not for
// students. It reads the address only: nothing is stored, sent or changed.

export function isReviewMode(search) {
  try {
    return new URLSearchParams(search).get('review') === '1';
  } catch {
    return false;
  }
}

// What a reviewer wants to see that a student must not: the keyed answer(s).
export function answerSummary(q) {
  if (q.dataset.type === 'mc') {
    const right = [...q.querySelectorAll(':scope > ul.options > li[data-correct]')].map((li) => li.textContent.trim());
    return right.length ? `Correct option: ${right.join(' / ')}` : '';
  }
  if (q.dataset.type === 'show') return 'Marked against the mark scheme below.';
  const answers = (q.dataset.answers ?? '').split('|').map((a) => a.trim()).filter(Boolean);
  if (!answers.length) return '';
  const how = q.dataset.mode === 'exact' ? 'exact form required' : 'any equal value accepted';
  return `Keyed answer: ${answers.join('  or  ')} (${how})`;
}

export function annotateForReview(q) {
  if (q.querySelector(':scope > .review-answer')) return;
  const summary = answerSummary(q);
  if (!summary) return;
  const note = document.createElement('p');
  note.className = 'review-answer';
  note.textContent = summary;
  (q.querySelector(':scope > .qfig') ?? q.querySelector(':scope > .qtext') ?? q).after(note);
}

export function startReviewMode() {
  document.documentElement.classList.add('review');
  const main = document.querySelector('main') ?? document.body;
  const banner = document.createElement('div');
  banner.className = 'review-banner';
  banner.setAttribute('role', 'note');
  banner.textContent = 'Reviewer mode: every hint, wrong-answer message, answer and solution is open, and nothing is saved. Remove ?review=1 from the address to go back to the student view.';
  main.prepend(banner);
}
