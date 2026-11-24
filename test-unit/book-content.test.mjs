// Content-consistency checks over the book's source pages. A keyed answer that
// disagrees with its own worked solution is the worst bug a maths book can have
// (a student who is right is marked wrong), so this guards every typed question.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'books', 'gcse');
const files = readdirSync(dir).filter((f) => f.endsWith('.html'));

const decode = (s) => s
  .replace(/&minus;|−/g, '-')
  .replace(/&times;/g, '*')
  .replace(/&divide;/g, '/')
  .replace(/&hellip;|\.\.\./g, ' ')
  .replace(/&sup2;/g, '^2')
  .replace(/&radic;/g, '√')
  .replace(/&pound;/g, '')
  .replace(/&deg;/g, '')
  .replace(/&[a-z#0-9]+;/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[{}]/g, ' ')
  .replace(/frac:/g, ' ');

function questions() {
  const out = [];
  for (const file of files) {
    const html = readFileSync(join(dir, file), 'utf8');
    const re = /<div class="q"([^>]*)>([\s\S]*?)<div class="solution">([\s\S]*?)<\/div>/g;
    let m;
    while ((m = re.exec(html))) {
      const attrs = m[1];
      if (/data-type="mc"/.test(attrs)) continue;
      const answers = /data-answers="([^"]*)"/.exec(attrs)?.[1];
      if (answers === undefined) continue;
      const qtext = /<p class="qtext">([\s\S]*?)<\/p>/.exec(m[2])?.[1] ?? '';
      out.push({ file, answers: decode(answers).split(';').map((a) => a.trim()).filter(Boolean), qtext: decode(qtext).trim().slice(0, 60), solution: decode(m[3]) });
    }
  }
  return out;
}

const norm = (s) => s.replace(/,/g, '').replace(/\s+/g, '');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

test('every typed question has at least one keyed answer, a hint ladder and a solution', () => {
  const qs = questions();
  assert.ok(qs.length > 400, `expected hundreds of typed questions, found ${qs.length}`);
  for (const q of qs) assert.ok(q.answers.length > 0, `${q.file}: "${q.qtext}" has no keyed answer`);
});

test('each numeric keyed answer appears in its own worked solution (no student marked wrong for being right)', () => {
  const problems = [];
  for (const q of questions()) {
    const numeric = q.answers.filter((a) => /^-?[\d.,]+$/.test(a));
    if (numeric.length === 0 || numeric.length !== q.answers.length) continue;
    const lower = q.solution.toLowerCase();
    const tokens = (q.solution.match(/-?\d[\d,]*(?:\.\d+)?/g) ?? []).map((t) => t.replace(/,/g, ''));
    const found = numeric.some((a) => {
      const n = norm(a);
      const asWord = WORDS[Number(n)];
      if (asWord && new RegExp(`\\b${asWord}\\b`).test(lower)) return true;
      return tokens.includes(n) || tokens.includes(n.replace(/^-/, '')) && n.startsWith('-');
    });
    if (!found) problems.push(`${q.file}: "${q.qtext}" keyed ${q.answers.join(' / ')} but the solution says: ${q.solution.replace(/\s+/g, ' ').trim().slice(0, 120)}`);
  }
  assert.deepEqual(problems, [], `${problems.length} keyed answers not found in their solutions:\n${problems.join('\n')}`);
});

test('multiple-choice feedback has normal spacing (a generator once turned every space into " x ")', () => {
  const bad = [];
  for (const file of files) {
    const html = readFileSync(join(dir, file), 'utf8');
    for (const m of html.matchAll(/data-why="([^"]*)"/g)) {
      if ((m[1].match(/ x /g) ?? []).length >= 3) bad.push(`${file}: ${m[1].slice(0, 50)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('every page has as many opening as closing paragraph tags (a generator once turned <p> into a pound sign)', () => {
  const bad = [];
  for (const file of files) {
    const html = readFileSync(join(dir, file), 'utf8');
    const open = (html.match(/<p[ >]/g) ?? []).length;
    const close = (html.match(/<\/p>/g) ?? []).length;
    if (open !== close) bad.push(`${file}: ${open} <p> and ${close} </p>`);
  }
  assert.deepEqual(bad, []);
});

test('the "like ..." example in a question is never the answer itself', () => {
  const squash = (t) => t.replace(/[\s()]/g, '').toLowerCase();
  const bad = [];
  for (const q of questions()) {
    const m = /\blike ([^.?]*?)(?:[.?]|$)/.exec(q.qtext);
    if (!m) continue;
    const example = squash(m[1]);
    if (example && q.answers.some((a) => squash(a) === example)) bad.push(`${q.file}: ${q.qtext}`);
  }
  assert.deepEqual(bad, []);
});
