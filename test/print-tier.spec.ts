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
const PAGES = ['algebra-basics', 'factors-multiples', 'indices', 'pythagoras', 'rearranging-formulae', 'squares-roots'];

type Built = { files: Record<string, Uint8Array>; xml: string; paragraphs: string[]; report: Record<string, any> };

// Foundation: the pages above and the Foundation practice paper. Higher: the same topics (a short chapter each, if they have
// Higher material), a Higher-only topic (surds) and the stretch papers. Together they cover every question once.
const PAGES_BY_TIER = { foundation: [...PAGES, 'foundation'], higher: [...PAGES.filter((p) => p !== 'algebra-basics'), 'surds', 'stretch'] };
const cache = new Map<string, Built>();
function build(tier: 'foundation' | 'higher'): Built {
  if (!cache.has(tier)) cache.set(tier, buildNow(tier));
  return cache.get(tier)!;
}

function buildNow(tier: 'foundation' | 'higher'): Built {
  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${tier}.docx`);
  const reportFile = join(OUT, `${tier}.json`);
  execFileSync('node', ['scripts/build-docx.mjs', '--tier', tier, '--pages', PAGES_BY_TIER[tier].join(','), '--out', out, '--report', reportFile], { cwd: ROOT, stdio: 'pipe' });
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

/** What the source itself marks Higher on a page: the headings with the chip, and the start of the text of each Higher question. */
function higherMarkers(page: string) {
  const raw = readFileSync(join(ROOT, 'src/pages/books/gcse', page + '.html'), 'utf8');
  const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, '\u0000').split('\u0000')[0].split(/ ?\(?Type /)[0].replace(/\{[^}]*\}?/g, '').match(/^[A-Za-z ,.':-]*/)![0].trim();
  const headings: string[] = [];
  const questions: string[] = [];
  let higherSection = false;
  for (const t of raw.split(/(?=<h2[ >]|<div class="q"[ >])/)) {
    if (t.startsWith('<h2')) {
      const inner = /^<h2[^>]*>([\s\S]*?)<\/h2>/.exec(t)?.[1] ?? '';
      higherSection = inner.includes('chip-higher');
      if (higherSection) headings.push(plain(inner.replace(/^\s*\d+b?\.\s*/, '')));
    } else if (t.startsWith('<div class="q"')) {
      const qtext = /<p class="qtext">([\s\S]*?)<\/p>/.exec(t)?.[1] ?? '';
      if (higherSection || t.split('>')[0].includes('data-tier="H"') || qtext.includes('chip-higher')) {
        questions.push(plain(qtext.replace(/<span class="(?:qtag|chip)[^"]*">[^<]*<\/span>/g, '')));
      }
    }
  }
  return { headings: headings.filter((h) => h.length >= 12), questions: questions.filter((q) => q.length >= 30).map((q) => q.slice(0, 60)) };
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
    // everything the source marks Higher (found from the source) is absent; the Higher book below has all of it
    const text = chapterText.replace(/\|/g, '');
    let checked = 0;
    for (const page of PAGES) {
      const m = higherMarkers(page);
      for (const gone of [...m.headings, ...m.questions]) { expect(text, page + ': ' + gone).not.toContain(gone); checked += 1; }
    }
    expect(checked).toBeGreaterThan(10);
    expect(text).not.toContain('and (Higher) fractional indices');
    // a "Higher tier:" note goes whole, with its "See Identity in the glossary" sentence
    expect(text).not.toContain('See Identity in the glossary');
    expect(text).not.toContain('Higher tier:');
    // no question printed in the Foundation book is graded 7, 8 or 9
    const questionLines = b.paragraphs.filter((p) => /^\d+\.\d+\|\t\|/.test(p));
    expect(questionLines.length).toBeGreaterThan(100);
    expect(questionLines.filter((p) => /\bGrade [789]\b/.test(p))).toEqual([]);
    // the Foundation parts of the same pages stay
    for (const kept of ['Square numbers', 'Standard form', 'Rearranging']) expect(chapterText, kept).toContain(kept);
    expect(b.report.higherLeftovers).toEqual([]);
    expect(b.report.termsNotInGlossary).toEqual([]);
    // words that are only ever Higher content never reach the Foundation glossary (Greg, 26 Nov 2026)
    const g0 = b.paragraphs.findIndex((p) => p === 'Glossary');
    const g1 = b.paragraphs.findIndex((p, i) => i > g0 && p === 'Index');
    expect(g0).toBeGreaterThan(0);
    const glossaryHeads = b.paragraphs.slice(g0, g1).map((p) => p.split('|')[0].trim());
    for (const word of ['Cosine rule', 'Sine rule', 'Surd', 'Identity (≡)']) expect(glossaryHeads, word).not.toContain(word);
    expect(b.report.stats.questionsInOtherBook).toBeGreaterThan(20);
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

  test('a Higher-only topic is in full; a Foundation topic is a short chapter of its Higher parts with a lead-in, or absent if it has none', () => {
    const chapters = b.paragraphs.filter((p) => /^Chapter \d+\|\t\|/.test(p)).map((p) => p.split('|\t|')[1]);
    // in the book's derived order (layer, then title)
    expect(chapters.map((c) => c.replace('&apos;', "'"))).toEqual(['Factors and multiples', 'Squares and square roots', 'Powers and indices', "Pythagoras' theorem", 'Surds', 'Rearranging formulae', 'Grade 7 to 9 stretch papers']);
    expect(chapters).not.toContain('Algebra basics'); // only a "Higher tier:" note, no Higher material
    for (const title of ['Factors and multiples', 'Powers and indices', "Pythagoras' theorem", 'Rearranging formulae', 'Squares and square roots']) {
      expect(b.paragraphs.map((p) => p.replace('&apos;', "'")), title).toContain(`The Higher parts of ${title}. The rest of this topic is in the Foundation book.`);
    }
    expect(b.paragraphs.some((p) => p.startsWith('The Higher parts of Surds'))).toBe(false);
  });

  test('the Higher material of each page is printed, with its chips, and the Foundation material is not', () => {
    const text = b.paragraphs.join('\n').replace(/\|/g, '');
    let present = 0;
    for (const page of [...PAGES.filter((p) => p !== 'algebra-basics'), 'surds']) {
      const m = higherMarkers(page);
      for (const kept of [...m.headings, ...m.questions]) { expect(text, page + ': ' + kept).toContain(kept); present += 1; }
    }
    expect(present).toBeGreaterThan(10);
    expect(b.xml).toMatch(/<w:t[^>]*>Higher<\/w:t>/); // the chip labels a Higher section
    for (const foundation of ['Square numbers']) expect(text, foundation).not.toContain('\n' + foundation);
    expect(text).not.toContain('(in the Higher book)');
  });

  test('a reference to Foundation material prints "(in the Foundation book)" and is not reported as dead', () => {
    expect(b.paragraphs.join('\n')).toContain('(in the Foundation book)');
    expect(b.report.deadRefs).toEqual([]);
  });

  test('every chapter counts its questions from 1 with no gaps, and every question has an answer numbered the same', () => {
    const { asked, answered, hinted } = numbers(b.paragraphs);
    expect(asked.length).toBe(b.report.stats.questionsPrinted);
    expect(answered).toEqual(asked);
    expect(hinted.filter((q) => !asked.includes(q))).toEqual([]);
    for (const ch of new Set(asked.map((q) => q.split('.')[0]))) {
      const own = asked.filter((q) => q.startsWith(ch + '.')).map((q) => Number(q.split('.')[1]));
      expect(own, 'chapter ' + ch).toEqual(own.map((_, i) => i + 1));
    }
  });

  test('the glossary has the Higher-only terms and the terms the printed chapters use, and not the rest', () => {
    const glossary = b.paragraphs.slice(b.paragraphs.indexOf('Glossary'));
    expect(glossary.some((p) => p.startsWith('Surd'))).toBe(true);
    expect(glossary.some((p) => p.startsWith('y-intercept'))).toBe(false);
  });

  test('the reports are empty', () => {
    for (const key of ['unknown', 'screenWording', 'screenOnlyQuestions', 'deadRefs', 'figuresBelow300ppi', 'blockedRequests', 'higherLeftovers', 'termsNotInGlossary']) expect(b.report[key], key).toEqual([]);
  });
});

test.describe('the two books together', () => {
  test.setTimeout(480_000);

  test('every question in the source is in exactly one book; each paper is in its own book', () => {
    const f: string[] = build('foundation').report.questionIds;
    const h: string[] = build('higher').report.questionIds;
    expect(f.filter((id) => h.includes(id))).toEqual([]); // no overlap
    expect(new Set(f).size).toBe(f.length);
    expect(new Set(h).size).toBe(h.length);
    const all: string[] = [];
    for (const page of [...PAGES, 'foundation', 'stretch', 'surds']) {
      const raw = readFileSync(join(ROOT, 'src/pages/books/gcse', page + '.html'), 'utf8');
      const n = (raw.match(/<div class="q"[ >]/g) ?? []).length;
      for (let i = 1; i <= n; i += 1) all.push(page + '-' + i);
    }
    expect([...f, ...h].sort()).toEqual(all.sort());
    expect(f.some((id) => id.startsWith('stretch-'))).toBe(false);
    expect(h.some((id) => id.startsWith('foundation-'))).toBe(false);
    expect(f.some((id) => id.startsWith('foundation-'))).toBe(true);
    expect(h.some((id) => id.startsWith('stretch-'))).toBe(true);
    expect(h.some((id) => id.startsWith('surds-'))).toBe(true);
    expect(f.some((id) => id.startsWith('surds-'))).toBe(false);
  });
});
