// A check over EVERY typed question in the books: the answer checker must accept what each question lists as right,
// and must never accept a list of roots with a sign flipped, a root dropped or an extra root added
// (it once did: "-2 or 5" was marked right for "-5 or 2", because the words "or" and "and" were read as letters).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { matches } from '../public/js/book-answer.mjs';

const ROOT = join(import.meta.dirname, '..', 'src', 'pages', 'books');
const ENTITIES = { quot: '"', lt: '<', gt: '>', amp: '&', le: '≤', ge: '≥', minus: '-', times: '×', deg: '°', pi: 'π', sup2: '²', sup3: '³', pound: '£', divide: '÷', radic: '√', ne: '≠', plusmn: '±' };
const decode = (t) => t.replace(/&#39;/g, "'").replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n] ?? m);
const attr = (attrs, name) => { const m = new RegExp(`${name}="([^"]*)"`).exec(attrs); return m ? decode(m[1]) : undefined; };

function typedQuestions() {
  const out = [];
  for (const book of readdirSync(ROOT)) {
    const dir = join(ROOT, book);
    if (!existsSync(dir) || !statSync(dir).isDirectory() || !readdirSync(dir).length) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(join(dir, file), 'utf8');
      for (const part of html.split(/(?=<div class="q")/).filter((x) => x.startsWith('<div class="q"'))) {
        const attrs = /^<div class="q"([^>]*)>/.exec(part)?.[1] ?? '';
        const type = attr(attrs, 'data-type');
        if (type === 'mc' || type === 'show') continue;
        const answers = (attr(attrs, 'data-answers') ?? '').split(';').map((x) => x.trim()).filter(Boolean);
        if (answers.length) out.push({ where: `${book}/${file}`, answers, mode: attr(attrs, 'data-mode') ?? 'value' });
      }
    }
  }
  return out;
}

const QUESTIONS = typedQuestions();

test('every accepted answer of every typed question is accepted by the checker', () => {
  assert.ok(QUESTIONS.length > 500, 'the scan found the books');
  const rejected = [];
  for (const q of QUESTIONS) for (const a of q.answers) if (!matches(a, q.answers, q.mode)) rejected.push(`${q.where} [${q.mode}] ${a}`);
  assert.deepEqual(rejected, []);
});

test('a list of two roots is never accepted with a sign flipped, a root dropped or an extra root added', () => {
  const accepted = [];
  let checked = 0;
  for (const q of QUESTIONS) {
    for (const key of q.answers) {
      const word = /(?<![a-z])(or|and)(?![a-z])/i.exec(key)?.[1];
      const nums = key.split(/\s*(?:or|and)\s*/i).map((x) => x.trim());
      if (!word || nums.length !== 2 || !nums.every((x) => /^-?\d+(\.\d+)?$/.test(x))) continue;
      const [p, q2] = nums;
      const flip = (x) => (x.startsWith('-') ? x.slice(1) : `-${x}`);
      const keySet = [Number(p), Number(q2)].sort((x, y) => x - y).join(',');
      const asSet = (v) => v.split(/\s*(?:or|and)\s*/i).map(Number).sort((x, y) => x - y).join(',');
      const slips = [`${flip(p)} ${word} ${flip(q2)}`, `${flip(p)} ${word} ${q2}`, `${p} ${word} ${flip(q2)}`, p, q2, `${p} ${word} ${q2} ${word} ${Number(p) + 1}`]
        .filter((v) => asSet(v) !== keySet);
      for (const v of slips) {
        checked += 1;
        if (matches(v, q.answers, q.mode)) accepted.push(`${q.where} [${q.mode}] key "${key}" accepted "${v}"`);
      }
    }
  }
  assert.ok(checked > 500, 'there are list answers to check');
  assert.deepEqual(accepted, []);
});
