import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { test, expect } from '@playwright/test';

// The short printed books (Greg, 26 Nov 2026): a --tier book prints short answers (the answer line and any mark scheme, no worked
// solution, no "If you got" lines) and only the first hint of each ladder, unless --full-answers / --all-hints say otherwise.
// Small books are built from real pages; the full books are built on demand: npm run book:docx:both.

const ROOT = join(__dirname, '..');
// Each Playwright worker builds into its own folder: with fullyParallel, two workers that need the same book would
// otherwise write the same .docx at once, and one could read a half-written zip ("invalid zip data").
const OUT = join(ROOT, 'test-results', 'print-short', `worker-${process.env.TEST_WORKER_INDEX ?? '0'}`);
const PAGES = ['fractions', 'percentages', 'squares-roots', 'pythagoras'];

type Built = { xml: string; paragraphs: string[]; report: Record<string, any> };
const cache = new Map<string, Built>();

function build(name: string, args: string[]): Built {
  if (!cache.has(name)) {
    mkdirSync(OUT, { recursive: true });
    const out = join(OUT, `${name}.docx`);
    const reportFile = join(OUT, `${name}.json`);
    execFileSync('node', ['scripts/build-docx.mjs', ...args, '--out', out, '--report', reportFile], { cwd: ROOT, stdio: 'pipe' });
    const xml = strFromU8(unzipSync(new Uint8Array(readFileSync(out)))['word/document.xml']);
    const paragraphs = xml.split('</w:p>').map((p) => [...p.matchAll(/<(?:w|m):t[^>]*>([^<]*)</g)].map((m) => m[1]).join('|')).filter(Boolean);
    cache.set(name, { xml, paragraphs, report: JSON.parse(readFileSync(reportFile, 'utf8')) });
  }
  return cache.get(name)!;
}

const shortBook = () => build('foundation-short', ['--tier', 'foundation', '--pages', PAGES.join(',')]);
const fullBook = () => build('foundation-full', ['--tier', 'foundation', '--pages', PAGES.join(','), '--full-answers', '--all-hints']);

/** The paragraphs of one part of the book: Answers or Hints. */
function part(paragraphs: string[], name: 'Answers' | 'Hints') {
  const start = paragraphs.indexOf(name);
  if (start < 0) return [];
  const end = paragraphs.findIndex((p, i) => i > start && ['Hints', 'Glossary'].includes(p));
  return paragraphs.slice(start + 1, end < 0 ? undefined : end);
}
/** The front matter and chapters: everything before the Answers. */
const chaptersOf = (paragraphs: string[]) => paragraphs.slice(0, paragraphs.indexOf('Answers'));
const numbered = (ps: string[]) => ps.filter((p) => /^\d+\.\d+\|\t\|/.test(p)).map((p) => /^(\d+\.\d+)/.exec(p)![1]);

test.describe('the short Foundation book (the default for a tier book)', () => {
  test.setTimeout(240_000);

  test('the Answers print no worked solution and no "If you got" lines, but keep every answer and mark scheme', () => {
    const short = part(shortBook().paragraphs, 'Answers');
    const full = part(fullBook().paragraphs, 'Answers');
    expect(full.some((p) => /^If you (got|chose)/.test(p)), 'the full book has slips, so this check means something').toBe(true);
    expect(short.filter((p) => /^If you (got|chose)/.test(p))).toEqual([]);
    // short only ever removes: every paragraph it prints is in the full Answers too
    const fullSet = new Set(full);
    expect(short.filter((p) => !fullSet.has(p))).toEqual([]);
    expect(full.length - short.length).toBeGreaterThan(100);
    // the answer lines are the same, one per question
    expect(numbered(short)).toEqual(numbered(full));
    // mark schemes stay, and so do the faded-example gaps
    expect(short.filter((p) => /^•\t\|M1\|/.test(p)).length).toBeGreaterThan(5);
    expect(short.filter((p) => /^Gaps, in order/.test(p)).length).toBe(full.filter((p) => /^Gaps, in order/.test(p)).length);
  });

  test('no worked solution of an ordinary question is printed (found from the page source)', () => {
    // a multiple-choice answer line repeats the option text, which can match a solution's first words: look below the answer lines only
    const belowAnswerLines = (name: Built) => part(name.paragraphs, 'Answers').filter((p) => !/^\d+\.\d+\|\t\|/.test(p)).join('\n');
    const short = belowAnswerLines(shortBook());
    const full = belowAnswerLines(fullBook());
    const texts: string[] = [];
    for (const id of PAGES) {
      const raw = readFileSync(join(ROOT, 'src/pages/books/gcse', `${id}.html`), 'utf8');
      for (const m of raw.matchAll(/<div class="solution"><p>([^<{&]{25,}?)[.<]/g)) texts.push(m[1].trim().slice(0, 40));
    }
    const printedInFull = texts.filter((t) => full.includes(t));
    expect(printedInFull.length).toBeGreaterThan(10);
    expect(printedInFull.filter((t) => short.includes(t))).toEqual([]);
  });

  test('every printed question still has exactly one answer', () => {
    const b = shortBook();
    const asked = numbered(chaptersOf(b.paragraphs));
    const answered = numbered(part(b.paragraphs, 'Answers'));
    expect(asked.length).toBeGreaterThan(100);
    expect(answered).toEqual(asked);
    expect(new Set(answered).size).toBe(answered.length);
    expect(b.report.stats.questionsPrinted).toBe(asked.length);
  });

  test('the Hints print exactly one hint per hinted question: the first clue', () => {
    const hints = part(shortBook().paragraphs, 'Hints');
    const lines = hints.filter((p) => /^\d+\.\d+\|\t\|/.test(p));
    const ids = numbered(lines);
    expect(ids.length).toBeGreaterThan(80);
    expect(new Set(ids).size).toBe(ids.length);
    expect(lines.every((p) => /^\d+\.\d+\|\t\|Hint: \|/.test(p))).toBe(true);
    expect(hints.filter((p) => /Hint \d/.test(p))).toEqual([]);
    // the full book has the whole ladder, and its first hint is the short book's hint
    const fullHints = part(fullBook().paragraphs, 'Hints');
    const fullFirst = fullHints.filter((p) => /^\d+\.\d+\|\t\|Hint 1: /.test(p));
    expect(numbered(fullFirst)).toEqual(ids);
    expect(fullHints.some((p) => /Hint 2: /.test(p))).toBe(true);
    expect(fullFirst.map((p) => p.replace('Hint 1: ', 'Hint: '))).toEqual(lines);
  });

  test('a "show that" question without a mark scheme keeps its worked solution, and the report counts it', () => {
    const b = shortBook();
    expect(b.report.stats.options).toMatchObject({ shortAnswers: true, firstHint: true });
    expect(b.report.shortAnswerFallbacks).toHaveLength(b.report.stats.shortAnswerFallbacks);
    expect(fullBook().report.shortAnswerFallbacks).toEqual([]);
  });

  test('the front matter describes the short book: one hint, no worked answers, no "If you got"', () => {
    const front = chaptersOf(shortBook().paragraphs).join('\n');
    expect(front).toContain('read the hint for that question');
    expect(front).not.toMatch(/If you got|Hint 1|Hint 2|read the worked answer|short worked solution/);
    expect(front).toContain('The Answers section gives the answer to every question.');
    expect(shortBook().report.frontNeedsEdit).toEqual([]);
  });

  test('the page estimate is reported, and is smaller than the full book of the same pages', () => {
    const s = shortBook().report.stats.pagesEstimate;
    const f = fullBook().report.stats.pagesEstimate;
    expect(s.total).toBeLessThan(f.total);
    expect(s.answers).toBeLessThan(f.answers);
    expect(s.hints).toBeLessThan(f.hints);
    expect(s.chapters).toBe(f.chapters);
  });

  test('--full-answers and --all-hints bring back the old output', () => {
    const b = fullBook();
    const answers = part(b.paragraphs, 'Answers');
    expect(answers.some((p) => /^If you got /.test(p))).toBe(true);
    expect(answers.some((p) => /slices out of 8/.test(p))).toBe(true);
    expect(part(b.paragraphs, 'Hints').some((p) => /Hint 2: /.test(p))).toBe(true);
    const front = chaptersOf(b.paragraphs).join('\n');
    expect(front).toMatch(/Hint 1 only/);
    expect(front).toMatch(/read the worked answer/);
    expect(front).toMatch(/If you got/);
    expect(b.report.frontNeedsEdit).toEqual([]);
    expect(b.report.stats.options).toMatchObject({ shortAnswers: false, firstHint: false });
  });

  test('each option works on its own, and --no-hints / --no-slips still work', () => {
    const answersOnly = build('full-answers-only', ['--tier', 'foundation', '--pages', 'fractions', '--full-answers']);
    expect(part(answersOnly.paragraphs, 'Answers').some((p) => /^If you got /.test(p))).toBe(true);
    expect(part(answersOnly.paragraphs, 'Hints').filter((p) => /Hint \d/.test(p))).toEqual([]);
    const noHints = build('no-hints', ['--tier', 'foundation', '--pages', 'fractions', '--no-hints']);
    expect(noHints.paragraphs).not.toContain('Hints');
    expect(chaptersOf(noHints.paragraphs).join('\n')).not.toMatch(/Hints section|use the hints|Hint \d/);
    expect(noHints.report.frontNeedsEdit).toEqual([]);
    const noSlips = build('no-slips', ['--tier', 'foundation', '--pages', 'fractions', '--full-answers', '--no-slips']);
    expect(part(noSlips.paragraphs, 'Answers').filter((p) => /^If you got /.test(p))).toEqual([]);
    expect(chaptersOf(noSlips.paragraphs).join('\n')).not.toMatch(/If you got/);
    expect(noSlips.report.frontNeedsEdit).toEqual([]);
  });

  test('the whole book (no --tier) stays full unless asked for the short options', () => {
    const whole = build('whole-default', ['--pages', 'fractions']);
    expect(whole.report.stats.options).toMatchObject({ shortAnswers: false, firstHint: false });
    expect(part(whole.paragraphs, 'Answers').some((p) => /^If you got /.test(p))).toBe(true);
    const asked = build('whole-short', ['--pages', 'fractions', '--short-answers', '--first-hint']);
    expect(part(asked.paragraphs, 'Answers').filter((p) => /^If you got /.test(p))).toEqual([]);
    expect(part(asked.paragraphs, 'Hints').filter((p) => /Hint \d/.test(p))).toEqual([]);
  });
});

test.describe('the fallback and mixed options', () => {
  test.setTimeout(240_000);

  test('a "show that" question with no mark scheme says the worked answer follows, and the worked answer is printed', () => {
    const b = build('fallback', ['--tier', 'foundation', '--pages', 'direct-inverse-proportion']);
    const fallbacks = b.report.shortAnswerFallbacks as { page: string; question: number; printed: string }[];
    expect(fallbacks.length).toBeGreaterThan(0);
    expect(b.report.stats.shortAnswerFallbacks).toBe(fallbacks.length);
    const answers = part(b.paragraphs, 'Answers');
    for (const f of fallbacks) {
      expect(f.page).toBe('direct-inverse-proportion');
      const at = answers.findIndex((p) => p.startsWith(`${f.printed}|\t|`));
      expect(at, `${f.printed} has an answer`).toBeGreaterThanOrEqual(0);
      expect(answers[at]).toBe(`${f.printed}|\t|Written answer: see the worked answer below.`);
      const next = answers[at + 1] ?? '';
      expect(next, 'the worked answer follows').not.toMatch(/^\d+\.\d+\|\t\||^Chapter \d+:|^Now you finish it/);
      expect(next.length).toBeGreaterThan(10);
    }
    // a show-that question that has a mark scheme still points to it, and no fallback question does
    expect(answers.filter((p) => /see the mark scheme/.test(p)).every((p) => !fallbacks.some((f) => p.startsWith(`${f.printed}|`)))).toBe(true);
    expect(b.report.frontNeedsEdit).toEqual([]);
  });

  test('full answers with the first hint: the front matter says one hint and the worked answer, with no contradiction', () => {
    const b = build('full-first', ['--tier', 'foundation', '--pages', 'fractions', '--full-answers']);
    const front = chaptersOf(b.paragraphs).join('\n');
    expect(front).toContain('read the hint for that question');
    expect(front).toContain('read the worked answer');
    expect(front).toContain('The Answers section gives the answer and a short worked solution for every question.');
    expect(front).toMatch(/If you got/);
    expect(front).not.toMatch(/Hint 1|Hint 2|The Answers section gives the answer to every question/);
    expect(b.report.frontNeedsEdit).toEqual([]);
  });

  test('short answers with all the hints: the front matter says Hint 2 and no worked answer, with no contradiction', () => {
    const b = build('short-all', ['--tier', 'foundation', '--pages', 'fractions', '--all-hints']);
    const front = chaptersOf(b.paragraphs).join('\n');
    expect(front).toContain('read Hint 1 only');
    expect(front).toContain('Read Hint 2');
    expect(front).toContain('The Answers section gives the answer to every question.');
    expect(front).not.toMatch(/read the worked answer|short worked solution|If you got|read the hint for that question/);
    expect(b.report.frontNeedsEdit).toEqual([]);
    expect(part(b.paragraphs, 'Hints').some((p) => /Hint 2: /.test(p))).toBe(true);
    expect(part(b.paragraphs, 'Answers').filter((p) => /^If you got /.test(p))).toEqual([]);
  });
});

test.describe('the short Higher book', () => {
  test.setTimeout(240_000);
  test('has short answers and one hint per question, every question answered once', () => {
    const b = build('higher-short', ['--tier', 'higher', '--pages', 'surds,stretch,squares-roots']);
    const answers = part(b.paragraphs, 'Answers');
    expect(answers.filter((p) => /^If you (got|chose)/.test(p))).toEqual([]);
    const asked = numbered(chaptersOf(b.paragraphs));
    expect(asked.length).toBeGreaterThan(20);
    expect(numbered(answers)).toEqual(asked);
    const hintLines = part(b.paragraphs, 'Hints').filter((p) => /^\d+\.\d+\|\t\|/.test(p));
    expect(new Set(numbered(hintLines)).size).toBe(hintLines.length);
    expect(hintLines.every((p) => /\|Hint: \|/.test(p))).toBe(true);
    expect(b.report.frontNeedsEdit).toEqual([]);
  });
});
