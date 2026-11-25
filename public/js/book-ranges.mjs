// The ?q= homework link on a topic page: "?q=5-12" or "?q=1-3,40-42" shows only those questions.
// Pure functions, so they can be tested without a browser.

/**
 * The question numbers a ?q= value asks for, sorted and without repeats.
 * Parts that make no sense (a range that runs backwards, a missing end, a stray minus) are ignored, never guessed at.
 * "5 to 8" (what "5+to+8" becomes in a link) is read as 5-8.
 */
export function parseRanges(raw) {
  const text = String(raw ?? '').trim().replace(/\s*\bto\b\s*/gi, '-');
  if (text.length === 0 || text.length > 60) return [];
  const wanted = new Set();
  for (const part of text.split(',')) {
    const m = /^(\d{1,4})(?:-(\d{1,4}))?$/.exec(part);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] === undefined ? a : Number(m[2]);
    if (b < a) continue;
    for (let n = a; n <= Math.min(b, a + 300); n += 1) wanted.add(n);
  }
  return [...wanted].sort((x, y) => x - y);
}

/** "1-3, 7 and 40-42": runs of consecutive numbers joined into ranges. */
export function rangeLabel(numbers) {
  const runs = [];
  for (const n of numbers) {
    const last = runs[runs.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  const parts = runs.map(([a, b]) => (a === b ? String(a) : `${a}-${b}`));
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** The sentence for the banner, e.g. "Showing questions 1-3 and 40-42 only." */
export function rangeBanner(numbers) {
  return `Showing question${numbers.length === 1 ? '' : 's'} ${rangeLabel(numbers)} only.`;
}
