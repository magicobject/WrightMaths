// A small spaced-revisit queue (Leitner boxes) for "Give me five". Pure functions, no DOM,
// so test-unit/book-queue.test.mjs can check every rule. Data is plain numbers and dates kept
// in this browser only.
//
// record = { b: box 0..5, due: 'YYYY-MM-DD', last: 'YYYY-MM-DD', miss: count }
// A clean answer (right first time, no hints) moves a question up a box; help or a miss moves it down.
// Only a review ON OR AFTER the due date changes the box, so same-day repeats never promote it.

export const DAYS = [1, 1, 3, 7, 21, 60]; // days until due, by the box a question lands in

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

/** Record an answer. `clean` = right first time with no hint used. Returns the new record. */
export function review(record, clean, today) {
  if (!record) {
    const b = clean ? 1 : 0;
    return { b, due: addDays(today, DAYS[b]), last: today, miss: clean ? 0 : 1 };
  }
  if (record.last === today || record.due > today) return record; // not a spaced review yet
  const b = clean ? Math.min(5, record.b + 1) : Math.max(0, record.b - (record.miss > 0 ? 2 : 1));
  return { b, due: addDays(today, DAYS[b]), last: today, miss: record.miss + (clean ? 0 : 1) };
}

/** Ready to revisit: due today or earlier, and not already at the top box. */
export function isDue(record, today) {
  return Boolean(record) && record.due <= today && record.b < 5;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Keep only well-formed records (the store can be edited or corrupted by hand). */
export function sanitize(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [qid, r] of Object.entries(raw)) {
    if (!/^[a-z0-9-]{1,60}$/.test(qid) || qid === '__proto__') continue;
    if (!r || typeof r !== 'object') continue;
    if (!Number.isInteger(r.b) || r.b < 0 || r.b > 5) continue;
    if (typeof r.due !== 'string' || !ISO.test(r.due) || typeof r.last !== 'string' || !ISO.test(r.last)) continue;
    out[qid] = { b: r.b, due: r.due, last: r.last, miss: Number.isInteger(r.miss) && r.miss >= 0 ? Math.min(r.miss, 99) : 0 };
  }
  return out;
}
