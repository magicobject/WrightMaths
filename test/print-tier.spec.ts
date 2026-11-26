import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { test, expect } from '@playwright/test';

// Builds a small Foundation book and a small Higher book from real pages and checks the two-book rules:
// squares-roots (a Higher h2, Higher check sets, Higher questions marked data-tier), indices (Higher h2s and a checklist item with a
// Higher part) and rearranging-formulae (an h3 with the Higher chip). The full books are built on demand: npm run book:docx:both.

const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'test-results', 'print-tier');
const PAGES = ['indices', 'rearranging-formulae', 'squares-roots'];

type Built = { files: Record<string, Uint8Array>; xml: string; paragraphs: string[]; report: Record<string, any> };

function build(tier: 'foundation' | 'higher'): Built {
  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${tier}.docx`);
  const reportFile = join(OUT, `${tier}.json`);
  execFileSync('node', ['scripts/build-docx.mjs', '--tier', tier, '--pages', PAGES.join(','), '--out', out, '--report', reportFile], { cwd: ROOT, stdio: 'pipe' });
  const files = unzipSync(new Uint8Array(readFileSync(out)));
  const xml = strFromU8(files['word/document.xml']);
  const paragraphs = xml.split('</w:p>').map((p) => [...p.matchAll(/<(?:w|m):t[^>]*>([^<]*)</g)].map((m) => m[1]).join('|')).filter(Boolean);
  return { files, xml, paragraphs, report: JSON.parse(readFileSync(reportFile, 'utf8')) };
}

/** The question numbers asked in the chapters, answered in Answers and hinted in Hints, as "chapter.question" strings in print order. */
function numbers(paragraphs: string[]) {
  const asked: string[] = [];
  const answered: string[] = [];
  const hinted: string[] = [];
  const answerText = new Map<string, string>();
  let part = 'chapters';
  for (const p of paragraphs) {
    if (p === 'Answers' || p === 'Hints' || p === 'Glossary') part = p;
    const m = /^(\d+\.\d+)\|\t\|(.*)/.exec(p);
    if (!m) continue;
    if (part === 'chapters') asked.push(m[1]);
    else if (part === 'Answers') { answered.push(m[1]); answerText.set(m[1], m[2]); } else if (part === 'Hints' && !hinted.includes(m[1])) hinted.push(m[1]);
  }
  return { asked, answered, hinted, answerText };
}

const chapterNumber = (paragraphs: string[], title: string) => {
  const m = paragraphs.map((p) => new RegExp(`^Chapter (\\d+)\\|\\t\\|${title}$`).exec(p)).find(Boolean);
  return m ? m[1] : '';
};

/** Typed answers of the questions of a page in order, with the Higher ones (by the page's own markers) left out when asked. */
function sourceQuestions(page: string, withoutHigher: boolean) {
  const raw = readFileSync(join(ROOT, 'src/pages/books/gcse', `${page}.html`), 'utf8');
  const tokens = raw.split(/(?=<h2[ >]|<div class="q")/);
  let higherSection = false;
  const out: { type: string; first: string }[] = [];
  for (const t of tokens) {
    if (t.startsWith('<h2')) higherSection = /^<h2[^>]*>[\s\S]*?<\/h2>/.exec(t)?.[0].includes('chip-higher') ?? false;
    else if (t.startsWith('<div class="q"')) {
      const tag = t.split('>')[0];
      const qtext = /<p class="qtext">([\s\S]*?)<\/p>/.exec(t)?.[1] ?? '';
      const higher = higherSection || tag.includes('data-tier="H"') || qtext.includes('chip-higher');
      if (withoutHigher && higher) continue;
      out.push({ type: /data-type="(\w+)"/.exec(tag)?.[1] ?? 'typed', first: (/data-answers="([^"]*)"/.exec(tag)?.[1] ?? '').split(';')[0] });
    }
  }
  return out;
}

const norm = (s: string) => s.replace(/sqrt|pi/g, '').replace(/[^0-9a-z]/gi, '').toLowerCase();

test.describe('the Foundation book', () => {
  test.setTimeout(240_000);
  let b: Built;
  test.beforeAll(() => { b = build('foundation'); });

  test('the title page says Foundation, and so does the title property; the ISBN is the only placeholder', () => {
    expect(b.paragraphs.slice(0, 3)).toEqual(['GCSE Mathematics', 'Foundation', 'Greg Wright']);
    expect(strFromU8(b.files['docProps/core.xml'])).toContain('<dc:title>GCSE Mathematics: Foundation</dc:title>');
    expect(Object.keys(b.report.placeholders)).toEqual(['[ISBN]']);
  });

  test('no Higher label, Higher section or Higher question is left', () => {
    // a bold "Higher" run is the chip; "(in the Higher book)" is the only other place the word is allowed
    expect(b.xml).not.toMatch(/<w:t[^>]*>Higher<\/w:t>/);
    const chapterText = b.paragraphs.join('\n');
    const mentions = b.paragraphs.filter((p) => /\bHigher\b/.test(p) && !/\(in the Higher book\)/.test(p) && !/^Higher value/.test(p.split('|\t|').pop() ?? ''));
    expect(mentions.filter((p) => !/Hint \d/.test(p) && !/^If you /.test(p)), mentions.join('\n')).toEqual([]);
    for (const gone of ['Simplifying a surd', 'Check your knowledge: surds', 'Fractional indices', 'Adding and subtracting in standard form', 'Stretch: the letter on both sides', 'Which statement about', 'and (Higher) fractional indices']) {
      expect(chapterText, gone).not.toContain(gone);
    }
    // the Foundation parts of the same pages stay
    for (const kept of ['Square numbers', 'Standard form', 'Rearranging']) expect(chapterText, kept).toContain(kept);
    expect(b.report.higherLeftovers).toEqual([]);
    expect(b.report.stats.questionsLeftOutAsHigher).toBeGreaterThan(20);
  });

  test('a reference to a Higher chapter prints "(in the Higher book)" and is not reported as dead', () => {
    expect(b.paragraphs.join('\n')).toContain('(in the Higher book)');
    expect(b.report.deadRefs).toEqual([]);
  });

  test('every printed question has an answer, numbered from 1 in each chapter with no gaps, and the answers match the right questions', () => {
    const { asked, answered, hinted, answerText } = numbers(b.paragraphs);
    expect(asked.length).toBe(b.report.stats.questionsPrinted);
    expect(answered).toEqual(asked);
    expect(hinted.filter((q) => !asked.includes(q))).toEqual([]);
    for (const ch of new Set(asked.map((q) => q.split('.')[0]))) {
      const own = asked.filter((q) => q.startsWith(`${ch}.`)).map((q) => Number(q.split('.')[1]));
      expect(own, `chapter ${ch}`).toEqual(own.map((_, i) => i + 1));
    }
    // squares-roots: the k-th printed question is the k-th question that is not Higher in the source
    const num = chapterNumber(b.paragraphs, 'Squares and square roots') || chapterNumber(b.paragraphs, '[^|]*oot[^|]*');
    const expected = sourceQuestions('squares-roots', true);
    expect(expected.length).toBeLessThan(sourceQuestions('squares-roots', false).length);
    expect(asked.filter((q) => q.startsWith(`${num}.`)).length).toBe(expected.length);
    expected.forEach((q, i) => {
      const printed = answerText.get(`${num}.${i + 1}`) ?? '';
      if (q.type === 'typed') expect(norm(printed).startsWith(norm(q.first)), `question ${i + 1}: printed "${printed}" for key "${q.first}"`).toBe(true);
      if (q.type === 'show') expect(printed.toLowerCase()).toContain('mark scheme');
    });
  });

  test('the glossary has no Higher-only term, and the index has no entry for one', () => {
    const glossary = b.paragraphs.slice(b.paragraphs.indexOf('Glossary'));
    expect(glossary.some((p) => p.startsWith('Surd'))).toBe(false);
    expect(glossary.some((p) => p.startsWith('Integer'))).toBe(true);
    expect(b.xml).not.toContain('XE &quot;Surd&quot;');
  });
});

test.describe('the Higher book', () => {
  test.setTimeout(240_000);
  let b: Built;
  test.beforeAll(() => { b = build('higher'); });

  test('the title page says Higher, and so does the title property', () => {
    expect(b.paragraphs.slice(0, 3)).toEqual(['GCSE Mathematics', 'Higher', 'Greg Wright']);
    expect(strFromU8(b.files['docProps/core.xml'])).toContain('<dc:title>GCSE Mathematics: Higher</dc:title>');
    expect(Object.keys(b.report.placeholders)).toEqual(['[ISBN]']);
  });

  test('every topic is printed in full, Higher sections and chips included, with the web question numbers', () => {
    const text = b.paragraphs.join('\n');
    for (const kept of ['Simplifying a surd', 'Fractional indices', 'Stretch: the letter on both sides', 'Which statement about']) expect(text, kept).toContain(kept);
    expect(b.xml).toMatch(/<w:t[^>]*>Higher<\/w:t>/); // the chip is the label of a Higher section
    expect(text).not.toContain('(in the Higher book)');
    expect(text).not.toContain('(in the Foundation book)');
    const { asked, answered } = numbers(b.paragraphs);
    expect(answered).toEqual(asked);
    expect(b.report.stats.questionsLeftOutAsHigher).toBe(0);
    const num = chapterNumber(b.paragraphs, 'Squares and square roots') || '';
    if (num) expect(asked.filter((q) => q.startsWith(`${num}.`)).length).toBe(sourceQuestions('squares-roots', false).length);
  });

  test('the reports are empty', () => {
    for (const key of ['unknown', 'screenWording', 'screenOnlyQuestions', 'deadRefs', 'figuresBelow300ppi', 'blockedRequests', 'higherLeftovers']) expect(b.report[key], key).toEqual([]);
  });
});
