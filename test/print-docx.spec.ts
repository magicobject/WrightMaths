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
  // One worker builds the file and runs every check: with fullyParallel, each worker's beforeAll would rebuild the
  // same book.docx at once, and a worker could read a half-written zip ("invalid zip data").
  test.describe.configure({ mode: 'serial' });
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
    // the author is the book's author, never the computer's username
    expect(strFromU8(files['docProps/core.xml'])).toMatch(/<dc:creator>Greg Wright<\/dc:creator>/);
    if (process.env.USERNAME) expect(strFromU8(files['docProps/core.xml'])).not.toContain(process.env.USERNAME);
  });

  test('it has chapters, answers, hints, glossary, index, contents and equations', () => {
    for (const title of ['Fractions', 'Percentages', 'Vectors']) expect(paragraphs.some((p) => /^Chapter \d+\|\t\|/.test(p) && p.endsWith(`|${title}`)), title).toBe(true);
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
    const answerText = new Map<string, string>();
    let part = 'chapters';
    for (const p of paragraphs) {
      if (p === 'Answers' || p === 'Hints' || p === 'Glossary') part = p;
      const m = /^(\d+\.\d+)\|\t\|(.*)/.exec(p);
      if (!m) continue;
      if (part === 'chapters') asked.add(m[1]);
      else if (part === 'Answers') { answered.add(m[1]); answerText.set(m[1], m[2]); }
      else if (part === 'Hints') hinted.add(m[1]);
    }
    // the printed answer of every question is the teacher key's answer (multiple choice: the same option text, and its letter)
    const chapterNo = new Map<string, string>();
    for (const p of paragraphs) { const c = /^Chapter (\d+)\|\t\|(.*)$/.exec(p); if (c) chapterNo.set(c[2], c[1]); }
    const norm = (s: string) => s.replace(/sqrt|pi/g, '').replace(/[^0-9a-z]/gi, '').toLowerCase();
    for (const [id, title] of [['fractions', 'Fractions'], ['percentages', 'Percentages'], ['vectors', 'Vectors']]) {
      const raw = readFileSync(join(ROOT, 'src/pages/courses/gcse', `${id}.html`), 'utf8');
      const parts = raw.split(/(?=<div class="q")/).filter((q) => q.startsWith('<div class="q"'));
      expect(parts.length, id).toBeGreaterThan(30);
      parts.forEach((part, i) => {
        const printed = answerText.get(`${chapterNo.get(title)}.${i + 1}`) ?? '';
        const type = /data-type="(\w+)"/.exec(part.split('>')[0])?.[1];
        if (type === 'mc') {
          const lis = (/<ul class="options">([\s\S]*?)<\/ul>/.exec(part)?.[1] ?? '').split('<li').slice(1);
          const at = lis.findIndex((li) => li.startsWith(' data-correct') || li.startsWith(' data-correct>'));
          const optionText = lis[at].replace(/^[^>]*>/, '').replace(/<\/li>[\s\S]*$/, '').replace(/\{frac:([^/]*)\/([^}]*)\}/g, '$1$2').replace(/<[^>]+>/g, '').replace(/&#?[a-z0-9]+;/gi, '');
          expect(printed.split('|')[0].trim(), `${id} q${i + 1} letter`).toBe(String.fromCharCode(65 + at));
          expect(norm(printed.split('|').slice(1).join('')), `${id} q${i + 1} option text`).toBe(norm(optionText));
        } else if (type === 'show') {
          expect(printed.toLowerCase(), `${id} q${i + 1}`).toContain('mark scheme');
        } else {
          const first = (/data-answers="([^"]*)"/.exec(part.split('>')[0])?.[1] ?? '').split(';')[0];
          expect(norm(printed).startsWith(norm(first)), `${id} q${i + 1}: printed "${printed}" for key "${first}"`).toBe(true);
        }
      });
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
    // (vectors.html's "Typing vectors" box is allowlisted in scripts/print-rules.mjs until its source gets a data-print)
    expect(report.screenWording).toEqual([]);
    expect(report.screenOnlyQuestions).toEqual([]);
    expect(report.blockedRequests).toEqual([]);
    expect(report.figuresBelow300ppi).toEqual([]);
    expect(report.stats.figures).toBeGreaterThan(20);
    expect(report.stats.minFigurePpi).toBeGreaterThanOrEqual(300);
    // what Greg has given is filled in; the rest are still placeholders: never invented
    // (the ISBN comes from KDP at title setup)
    expect(Object.keys(report.placeholders)).toEqual(['[ISBN]']);
  });

  test('the document properties carry the real title and author, with no placeholder', () => {
    const core = strFromU8(files['docProps/core.xml']);
    expect(core).toContain('GCSE Mathematics');
    expect(core).toContain('Greg Wright');
    expect(core).not.toContain('[');
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
