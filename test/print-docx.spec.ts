import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { test, expect } from '@playwright/test';

// Builds the Word file from three real pages (fractions: fractions and a faded example; percentages: multiple choice;
// vectors: column vectors) and checks it the way the print design asks. The whole book is built on demand: npm run book:docx.

const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'test-results', 'print-docx');
const PAGES = ['fractions', 'percentages', 'vectors'];

test.describe('the Word build', () => {
  test.setTimeout(180_000);
  let files: Record<string, Uint8Array>;
  let xml: string;
  let paragraphs: string[];
  let report: Record<string, any>;

  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
    execFileSync('node', ['scripts/build-docx.mjs', '--pages', PAGES.join(','), '--out', join(OUT, 'book.docx'), '--report', join(OUT, 'report.json')], { cwd: ROOT, stdio: 'pipe' });
    files = unzipSync(new Uint8Array(readFileSync(join(OUT, 'book.docx'))));
    xml = strFromU8(files['word/document.xml']);
    paragraphs = xml.split('</w:p>').map((p) => [...p.matchAll(/<(?:w|m):t[^>]*>([^<]*)</g)].map((m) => m[1]).join('|')).filter(Boolean);
    report = JSON.parse(readFileSync(join(OUT, 'report.json'), 'utf8'));
  });

  test('it unzips, with the settings a printed book needs', () => {
    for (const part of ['word/document.xml', 'word/settings.xml', 'docProps/core.xml']) expect(files[part], part).toBeTruthy();
    const settings = strFromU8(files['word/settings.xml']);
    for (const tag of ['w:updateFields', 'w:mirrorMargins', 'w:doNotAutoCompressPictures']) expect(settings, tag).toContain(tag);
    expect(xml).toMatch(/w:pgSz w:w="12240" w:h="15840"/);
    expect(xml).not.toContain('w:hyperlink');
    // the author is the imprint placeholder, never a username
    expect(strFromU8(files['docProps/core.xml'])).toMatch(/<dc:creator>\[IMPRINT\]<\/dc:creator>/);
  });

  test('it has chapters, answers, hints, glossary, index, contents and equations', () => {
    for (const title of ['Fractions', 'Percentages', 'Vectors']) expect(paragraphs.some((p) => p.includes(`Chapter`) && p.endsWith(`|${title}`) || p.endsWith(`|\t|${title}`)), title).toBe(true);
    for (const part of ['Answers', 'Hints', 'Glossary', 'Index', 'Contents']) expect(paragraphs, part).toContain(part);
    expect(xml).toMatch(/ TOC \\o /);
    expect(xml).toMatch(/ INDEX \\c /);
    expect(xml).toMatch(/ XE &quot;Fraction&quot; \\b /);
    expect(xml).toContain('<m:f>');
    expect(xml).toContain('<m:m>'); // a column vector
  });

  test('every question number has an answer, and every hint ladder is numbered like its question', () => {
    const asked = new Set<string>();
    const answered = new Set<string>();
    const hinted = new Set<string>();
    let part = 'chapters';
    for (const p of paragraphs) {
      if (p === 'Answers' || p === 'Hints' || p === 'Glossary') part = p;
      const m = /^(\d+\.\d+)\|\t\|(.*)/.exec(p);
      if (!m) continue;
      if (part === 'chapters') asked.add(m[1]);
      else if (part === 'Answers') answered.add(m[1]);
      else if (part === 'Hints') hinted.add(m[1]);
    }
    expect(asked.size).toBe(report.stats.questionsPrinted);
    expect([...asked].filter((q) => !answered.has(q))).toEqual([]);
    expect([...hinted].filter((q) => !asked.has(q))).toEqual([]);
    expect(hinted.size).toBeGreaterThan(100);
  });

  test('nothing from the screen reaches the book', () => {
    const text = paragraphs.join('\n');
    for (const dropped of ['Listen', 'Check my answer', 'Type it like', 'Skip to the lesson', 'Reading options']) expect(text, dropped).not.toContain(dropped);
  });

  test('the reports are empty for these pages, and the figures are 300 ppi or more', () => {
    expect(report.unknown).toEqual([]);
    // vectors.html has a "Typing vectors" box that needs a data-print in the source (listed in the report for the content owner)
    expect(report.screenWording.filter((s: { page: string }) => s.page !== 'vectors')).toEqual([]);
    expect(report.screenWording.filter((s: { page: string }) => s.page === 'vectors').map((s: { context: string }) => s.context)).toEqual(['Typing vectors']);
    expect(report.screenOnlyQuestions).toEqual([]);
    expect(report.blockedRequests).toEqual([]);
    expect(report.figuresBelow300ppi).toEqual([]);
    expect(report.stats.figures).toBeGreaterThan(20);
    expect(report.stats.minFigurePpi).toBeGreaterThanOrEqual(300);
    // the front matter placeholders are still placeholders: never invented
    expect(Object.keys(report.placeholders)).toEqual(expect.arrayContaining(['[TITLE]', '[AUTHOR]', '[ISBN]', '[IMPRINT]']));
  });

  test('--release refuses a build that still has placeholders', () => {
    let status = 0;
    try {
      execFileSync('node', ['scripts/build-docx.mjs', '--pages', 'fractions', '--release', '--out', join(OUT, 'release.docx'), '--report', join(OUT, 'release.json')], { cwd: ROOT, stdio: 'pipe' });
    } catch (e) {
      status = (e as { status: number }).status;
    }
    expect(status).toBe(1);
  });
});
