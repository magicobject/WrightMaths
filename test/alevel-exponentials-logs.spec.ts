import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Exponentials and logarithms page that a general test cannot make:
//  - every typed answer is RECOMPUTED here, to the rounding the question states,
//  - every numeric wrong-answer value is recomputed from the slip its message names,
//  - the decimals shown in the working are recomputed,
//  - every figure's curves and marked points are compared with the equation they claim to show.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', 'exponentials-logs.html'), 'utf8');

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', hellip: '...' };
const decode = (t: string) => t.replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

// ---- the maths, written independently of the figure code ----
const ln = Math.log;
const E = Math.E;
const sf3 = (x: number) => Number(x.toPrecision(3));
const exact = (x: number) => x;
const dp = (n: number) => (x: number) => Number(x.toFixed(n));
const log2 = (x: number) => Math.log2(x);

type Slip = [string, number];
type Case = { find: string; key: number; round: (x: number) => number; wrongs?: Slip[] };
const C = (find: string, key: number, round: (x: number) => number, wrongs: Slip[] = []): Case => ({ find, key, round, wrongs });

const CASES: Case[] = [
  // warm-up and recap
  C('Write {m:2^(-3)} as a fraction', 1 / 8, exact, [['-8', -(2 ** 3)], ['1/6', 1 / (2 * 3)]]),
  C('Find the value of {m:2^3*2^4}', 128, exact, [['4096', 2 ** (3 * 4)], ['16384', 4 ** 7]]),
  C('{m:9^(frac(1,2))}', 3, exact, [['4.5', 9 / 2], ['81', 9 ** 2]]),
  C('{m:(2^3)^2}', 64, exact, [['32', 2 ** (3 + 2)], ['512', 2 ** (3 ** 2)]]),
  C('Use your calculator to find {m:e^2}', E ** 2, sf3, [['7.38', Math.floor(E ** 2 * 100) / 100], ['5.44', 2 * E]]),
  // 1 exponential functions
  C('when {m:x=-2} on the graph of {m:y=3^x}', 1 / 9, exact, [['-9', -(3 ** 2)], ['-6', 3 * -2], ['9', 3 ** 2]]),
  C('passes through {m:(0, 1)} and {m:(2, 9)}', Math.sqrt(9), exact, [['4.5', 9 / 2], ['81', 9 ** 2]]),
  C('y-intercept of {m:y=e^(2x)+5}', Math.exp(2 * 0) + 5, exact, [['5', 0 + 5], ['7', 2 * Math.exp(0) + 5]]),
  C('crosses the y-axis at {m:(0, -1)}. Find the value of c', -1 - Math.exp(0), exact, [['-1', -1], ['0', -1 + 1]]),
  // 2 logarithms
  C('Find the value of {m:log_2 32}', log2(32), exact, [['16', 32 / 2]]),
  C('{m:log_3 (frac(1,27))}', -3, exact, [['3', 3], ['27', 1 / (1 / 27)]]),
  C('{m:ln(e^4)+e^(ln 3)}', 4 + 3, exact, [['12', 4 * 3], ['57.6', sf3(E ** 4 + 3)]]),
  C('Solve {m:log_x 49=2}', 7, exact, [['98', 49 * 2], ['24.5', 49 / 2], ['2401', 49 ** 2]]),
  C('Solve {m:log_2 x=-3}', 1 / 8, exact, [['-8', -(2 ** 3)], ['8', 2 ** 3], ['-6', 2 * -3]]),
  // 3 the laws
  C('{m:log_2 12-log_2 3}', log2(12 / 3), exact, [['4', 12 / 3], ['3.17', sf3(log2(12 - 3))]]),
  C('Find the value of {m:3 log_2 4}', 3 * log2(4), exact, [['8', log2(4) ** 3], ['12', 3 * 4], ['64', 4 ** 3]]),
  C('{m:log_5 2+log_5 12.5}', Math.log(2 * 12.5) / ln(5), exact, [['25', 2 * 12.5]]),
  C('find {m:log_a 18}', 0.3 + 2 * 0.48, sf3, [['0.78', 0.3 + 0.48], ['1.74', 0.3 + 3 * 0.48], ['0.144', 0.3 * 0.48]]),
  C('Solve {m:ln x+ln 3=4}', E ** 4 / 3, sf3, [['164', sf3(3 * E ** 4)], ['54.6', sf3(E ** 4)]]),
  // 4 a^x = b
  C('Solve {m:2^x=50}', ln(50) / ln(2), sf3, [['25', 50 / 2], ['1.96', sf3(ln(50) / 2)], ['3.91', sf3(ln(50))]]),
  C('Solve {m:7^(x-1)=20}', 1 + ln(20) / ln(7), sf3, [['1.54', sf3(ln(20) / ln(7))]]),
  C('Solve {m:3^(2x)=7}', ln(7) / (2 * ln(3)), sf3, [['1.77', sf3(ln(7) / ln(3))]]),
  C('Solve {m:2^(x+1)=3^x}. Give x', ln(2) / (ln(3) - ln(2)), sf3, [['-1.71', sf3(ln(2) / (ln(2) - ln(3)))]]),
  C('Solve {m:3*2^x=48}', 4, exact, [['16', 48 / 3]]),
  // 5 e and ln
  C('Solve {m:e^(2x-1)=5}', (1 + ln(5)) / 2, sf3, [['2.61', sf3(1 + ln(5))], ['0.305', sf3((ln(5) - 1) / 2)]]),
  C('Solve {m:ln(3x+2)=4}', (E ** 4 - 2) / 3, sf3, [['18.2', sf3(E ** 4 / 3)], ['16.2', sf3(E ** 4 / 3 - 2)], ['0.667', sf3((4 - 2) / 3)]]),
  C('{m:y=e^(x-1)-3} crosses the x-axis', 1 + ln(3), sf3, [['1.1', sf3(ln(3))], ['0.0986', sf3(ln(3) - 1)]]),
  C('Solve {m:ln x=-2}', E ** -2, sf3, [['-7.39', sf3(-(E ** 2))], ['7.39', sf3(E ** 2)]]),
  C('Solve {m:ln(2x-1)=0}', 1, exact, [['0.5', (0 + 1) / 2]]),
  // 6 inequalities (the whole-number question; the others are in the next test)
  C('smallest whole number n for which {m:2.5^n>1000}', Math.ceil(ln(1000) / ln(2.5)), exact, [['7', Math.floor(ln(1000) / ln(2.5))], ['7.54', sf3(ln(1000) / ln(2.5))]]),
  // flip it
  C('Given that {m:log_a 64=3}', Math.cbrt(64), exact, [['192', 64 * 3], ['21.3', sf3(64 / 3)]]),
  C('passes through {m:(3, 125)}', Math.cbrt(125), exact, [['41.7', sf3(125 / 3)], ['375', 125 * 3]]),
  C('Given that {m:ln x=3}', E ** 3, sf3, [['1.1', sf3(ln(3))], ['8.15', sf3(3 * E)]]),
  // mixed review
  C('{m:log_10 0.001}', Math.log10(0.001), exact, [['3', 3]]),
  C('{m:log_2 40-log_2 5+log_2 4}', log2((40 / 5) * 4), exact, [['3', log2(40 / 5)], ['1', log2(40 / (5 * 4))]]),
  C('Solve {m:4^x=frac(1,4)}', -1, exact, [['1', 1]]),
  C('Solve {m:e^(0.5x)=12}', 2 * ln(12), sf3, [['2.48', sf3(ln(12))], ['1.24', sf3(ln(12) / 2)], ['24', 12 / 0.5]]),
  C('when {m:x=ln 2}', Math.exp(-ln(2)) + 3, exact, [['5', Math.exp(ln(2)) + 3], ['0.5', Math.exp(-ln(2))]]),
  // exam style
  C('Solve {m:5^(2x-1)=40}', (1 + ln(40) / ln(5)) / 2, sf3, [['1.15', sf3(ln(40) / ln(5) / 2)], ['3.29', sf3(1 + ln(40) / ln(5))]]),
  C('Solve {m:ln(2x+1)-ln 3=2}', (3 * E ** 2 - 1) / 2, sf3, [['3.19', sf3((E ** 2 - 1) / 2)], ['11.6', sf3((3 * E ** 2 + 1) / 2)]]),
  C('meets the line {m:y=5} at the point Q', -ln(2) / 2, sf3, [['0.347', sf3(ln(2) / 2)], ['-0.693', sf3(-ln(2))]]),
  C('Solve {m:2^x=5^(x-1)}', ln(5) / (ln(5) - ln(2)), sf3, [['-1.76', sf3(-ln(5) / (ln(5) - ln(2)))]]),
];

function questions() {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const raw = /<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongs = [...(/<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '').matchAll(/data-if="([^"]*)"/g)].flatMap((m) => decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean));
    const mode = /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? '';
    return { raw, text: decode(raw), answers, wrongs, mode, block, type: /data-type="([^"]*)"/.exec(attrs)?.[1] ?? '' };
  });
}
const num = (t: string) => (t.includes('/') ? t.split('/').map(Number).reduce((a, b) => a / b) : Number(t));
const same = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

test('every typed numeric answer is recomputed to its stated rounding, and every slip value is recomputed from its message', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of CASES) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    const want = c.round(c.key);
    for (const a of q.answers) if (!same(num(a), want)) problems.push(`"${c.find}": the page accepts ${a}, recomputed ${want}`);
    if (q.answers.length === 0) problems.push(`"${c.find}": no answer`);
    // every numeric wrong-answer entry on the question must be one of the listed slips, so no value is left untied
    const listed = new Set(c.wrongs?.map(([text]) => num(text)));
    for (const w of q.wrongs) if (![...listed].some((v) => same(v, num(w)))) problems.push(`"${c.find}": wrong-answer value ${w} is not tied to a slip in this test`);
    for (const [text, slip] of c.wrongs ?? []) {
      if (!q.wrongs.some((w) => same(num(w), num(text)))) problems.push(`"${c.find}": no wrong-answer entry for ${text}`);
      if (!same(num(text), slip) && !same(num(text), sf3(slip))) problems.push(`"${c.find}": ${text} is not what its slip gives (${slip})`);
      if (same(num(text), want)) problems.push(`"${c.find}": the slip value ${text} is the right answer`);
    }
  }
  expect(CASES.length).toBeGreaterThan(40);
  expect(problems).toEqual([]);
});

test('every typed numeric question on the page has a recomputed case', () => {
  const uncovered = questions()
    .filter((q) => q.mode === 'value')
    .filter((q) => !CASES.some((c) => q.raw.includes(c.find)))
    .map((q) => q.text.slice(0, 80));
  expect(uncovered).toEqual([]);
});

// ---- inequality answers: direction and boundary ----
const ineq = (t: string) => {
  const a = /^x(<=|>=|<|>)(-?[\d.]+)$/.exec(t);
  if (a) return { dir: a[1], b: Number(a[2]) };
  const b = /^(-?[\d.]+)(<=|>=|<|>)x$/.exec(t);
  if (b) return { dir: { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[b[2] as '<'], b: Number(b[1]) };
  return null;
};
type Ineq = { find: string; dir: string; b: number; wrongs: { dir: string; b: number }[] };
const INEQS: Ineq[] = [
  { find: 'Solve {m:-2x<8}', dir: '>', b: 8 / -2, wrongs: [{ dir: '<', b: 8 / -2 }] },
  { find: 'Solve {m:3^x>20}', dir: '>', b: ln(20) / ln(3), wrongs: [{ dir: '<', b: ln(20) / ln(3) }, { dir: '>', b: 20 / 3 }] },
  { find: 'Solve {m:0.8^x<0.3}', dir: '>', b: ln(0.3) / ln(0.8), wrongs: [{ dir: '<', b: ln(0.3) / ln(0.8) }] },
  { find: 'Solve {m:e^(x+2)<10}', dir: '<', b: ln(10) - 2, wrongs: [{ dir: '<', b: ln(10) + 2 }, { dir: '>', b: ln(10) - 2 }] },
  { find: 'Solve {m:1.2^x>=5}', dir: '>=', b: ln(5) / ln(1.2), wrongs: [{ dir: '<=', b: ln(5) / ln(1.2) }, { dir: '>=', b: 5 / 1.2 }] },
  { find: '{m:2^(3x)>50}', dir: '>', b: ln(50) / ln(2) / 3, wrongs: [{ dir: '>', b: ln(50) / ln(2) }, { dir: '<', b: ln(50) / ln(2) / 3 }] },
];
test('every inequality answer has the right direction and boundary, and every slip is the reversed sign or the named wrong boundary', () => {
  const qs = questions();
  const problems: string[] = [];
  for (const c of INEQS) {
    const hits = qs.filter((q) => q.raw.includes(c.find));
    if (hits.length !== 1) { problems.push(`"${c.find}" matches ${hits.length} questions`); continue; }
    const q = hits[0];
    for (const a of q.answers) {
      const r = ineq(a.replace(/\s+/g, ''));
      if (!r || r.dir !== c.dir || !same(r.b, sf3(c.b))) problems.push(`"${c.find}": the page accepts ${a}, recomputed ${c.dir}${sf3(c.b)}`);
    }
    const found: string[] = [];
    for (const w of q.wrongs) {
      const r = ineq(w.replace(/\s+/g, ''));
      if (!r) { problems.push(`"${c.find}": cannot read the wrong answer ${w}`); continue; }
      if (r.dir === c.dir && same(r.b, sf3(c.b))) problems.push(`"${c.find}": the wrong answer ${w} is the right answer`);
      const ok = c.wrongs.some((s) => s.dir === r.dir && same(r.b, sf3(s.b)));
      if (!ok) problems.push(`"${c.find}": the wrong answer ${w} is not one of the named slips`);
      found.push(`${r.dir}${r.b}`);
    }
    for (const s of c.wrongs) if (!found.includes(`${s.dir}${sf3(s.b)}`)) problems.push(`"${c.find}": no wrong-answer entry for ${s.dir}${sf3(s.b)}`);
  }
  const unlisted = qs.filter((q) => q.mode === 'exact' && q.answers.some((a) => /[<>]/.test(a))).filter((q) => !INEQS.some((c) => q.raw.includes(c.find))).map((q) => q.text.slice(0, 60));
  expect(unlisted).toEqual([]);
  expect(problems).toEqual([]);
});

test('the exact-form questions: the right forms are equal in value and every wrong form is the slip its message names', () => {
  const qs = questions();
  const find = (s: string) => {
    const hits = qs.filter((q) => q.raw.includes(s));
    expect(hits.length, s).toBe(1);
    return hits[0];
  };
  const entries = (q: ReturnType<typeof find>) => q.wrongs;

  // e^x = 4: ln 4 = 2 ln 2; the slips are e^4 (54.6) and the decimal 1.386
  const a = find('Solve {m:e^x=4}');
  expect(a.answers.map((x) => x.replace(/\s/g, ''))).toEqual(['ln4', 'ln(4)', '2ln2', '2ln(2)']);
  expect(2 * ln(2)).toBeCloseTo(ln(4), 12);
  expect(entries(a).map((w) => (w.startsWith('e^') ? E ** Number(w.slice(2)) : Number(w))).map((v) => sf3(v)).sort()).toEqual([1.39, 1.39, 54.6, 54.6].sort());
  expect(sf3(ln(4))).toBe(1.39);
  expect(entries(a)).toContain('1.386');
  expect(Number('1.386')).toBeCloseTo(ln(4), 3);

  // the curve y = e^(2x) - 4 meets the x-axis at ln 2; slips: ln 4 (no halving), 2 (2x = 4), 0.693 (a decimal)
  const b = find('exact x-coordinate of P');
  expect(b.answers.map((x) => x.replace(/\s/g, ''))).toEqual(['ln2', 'ln(2)']);
  expect(Math.exp(2 * ln(2)) - 4).toBeCloseTo(0, 12);
  expect(entries(b).map((w) => w.replace(/\s/g, ''))).toEqual(['ln4', 'ln(4)', '2', '0.693']);
  expect(sf3(ln(2))).toBe(0.693);
  expect(ln(4) / 2).toBeCloseTo(ln(2), 12); // the slip "forgot to divide by 2" really is ln 4 over 2

  // 2 log_a 3 + log_a 4 = log_a 36; slips log_a 10 (2*3+4) and log_a 144 ((3*4)^2)
  const c = find('Write {m:2 log_a 3+log_a 4} as a single logarithm');
  expect(c.answers).toEqual(['log_a 36', 'log_a(36)']);
  expect(3 ** 2 * 4).toBe(36);
  expect(entries(c)).toEqual(['log_a 10', 'log_a(10)', 'log_a 144', 'log_a(144)']);
  expect(2 * 3 + 4).toBe(10);
  expect((3 * 4) ** 2).toBe(144);

  // log_a 45 = 2p + q with p = log_a 3, q = log_a 5; slips p + q (that is log_a 15) and pq
  const d = find('write {m:log_a 45} in terms of p and q');
  expect(d.answers).toEqual(['2p+q', 'q+2p']);
  const p = ln(3);
  const q5 = ln(5);
  expect(2 * p + q5).toBeCloseTo(ln(45), 12);
  expect(p + q5).toBeCloseTo(ln(15), 12);
  expect(entries(d)).toEqual(['p+q', 'pq']);
});

test('the decimals shown in the working are recomputed to the places shown', () => {
  const body = decode(SOURCE.replace(/<!--[\s\S]*?-->/g, ''));
  // A table of statements as written in {m:...}, each with its true value and the number of decimal places shown.
  const SHOWN: [string, number, number][] = [
    ['frac(ln 10, ln 2)=3.3219', ln(10) / ln(2), 4],
    ['frac(ln 30, ln 5)=2.1133', ln(30) / ln(5), 4],
    ['2x=1.1133', ln(30) / ln(5) - 1, 4],
    ['x=0.5566', (ln(30) / ln(5) - 1) / 2, 4],
    ['frac(ln 2, ln 3-ln 2)=1.7095', ln(2) / (ln(3) - ln(2)), 4],
    ['frac(3.4012, 1.3863)=2.4534', ln(30) / ln(4), 4],
    ['ln 5=1.6094', ln(5), 4],
    ['x=1.3047', (1 + ln(5)) / 2, 4],
    ['e^4=54.598', E ** 4, 3],
    ['x=17.533', (E ** 4 - 2) / 3, 3],
    ['ln 0.2=-1.6094', ln(0.2), 4],
    ['3x+1=ln 10=2.3026', ln(10), 4],
    ['3x=2.3026-1=1.3026', ln(10) - 1, 4],
    ['x=0.4342', (ln(10) - 1) / 3, 4],
    ['frac(ln 0.2, ln 0.5)=2.3219', ln(0.2) / ln(0.5), 4],
    ['ln 0.5=-0.693', ln(0.5), 3],
    ['frac(ln 100, ln 1.5)=11.358', ln(100) / ln(1.5), 3],
    ['1.5^11=86.5', 1.5 ** 11, 1],
    ['1.5^12=129.7', 1.5 ** 12, 1],
    ['frac(ln 20, ln 3)=2.7268', ln(20) / ln(3), 4],
    ['frac(ln 0.3, ln 0.8)=5.3955', ln(0.3) / ln(0.8), 4],
    ['ln 0.8=-0.2231', ln(0.8), 4],
    ['frac(ln 1000, ln 2.5)=7.539', ln(1000) / ln(2.5), 3],
    ['2.5^7=610.4', 2.5 ** 7, 1],
    ['2.5^8=1525.9', 2.5 ** 8, 1],
    ['x+2<ln 10=2.3026', ln(10), 4],
    ['x<0.3026', ln(10) - 2, 4],
    ['frac(3.9120, 1.0986)=3.5609', ln(50) / ln(3), 4],
    ['frac(ln 50, ln 2)=5.6439', ln(50) / ln(2), 4],
    ['x>1.8813', ln(50) / ln(2) / 3, 4],
    ['2x-1=frac(ln 40, ln 5)=2.2920', ln(40) / ln(5), 4],
    ['2x=3.2920', 1 + ln(40) / ln(5), 4],
    ['x=1.6460', (1 + ln(40) / ln(5)) / 2, 4],
    ['3e^2=22.167', 3 * E ** 2, 3],
    ['2x=21.167', 3 * E ** 2 - 1, 3],
    ['x=10.584', (3 * E ** 2 - 1) / 2, 3],
    ['x=-frac(ln 2, 2)=-0.3466', -ln(2) / 2, 4],
    ['x=frac(ln 5, ln 5-ln 2)=1.7565', ln(5) / (ln(5) - ln(2)), 4],
    ['frac(ln 7, ln 3)=1.7712', ln(7) / ln(3), 4],
    ['x=0.8856', ln(7) / (2 * ln(3)), 4],
    ['x-1=frac(ln 20, ln 7)=1.5395', ln(20) / ln(7), 4],
    ['x=2.5395', 1 + ln(20) / ln(7), 4],
    ['x=frac(ln 9, ln 4)=1.585', ln(9) / ln(4), 3],
    ['x-1=ln 3=1.0986', ln(3), 4],
    ['x=2.0986', 1 + ln(3), 4],
    ['2x-1=ln 5=1.6094', ln(5), 4],
    ['2x=2.6094', 1 + ln(5), 4],
    ['3x=52.598', E ** 4 - 2, 3],
    ['x=17.533', (E ** 4 - 2) / 3, 3],
    ['e^(-2)=frac(1, e^2)=0.1353', E ** -2, 4],
    ['x=e^3=20.0855', E ** 3, 4],
    ['0.5x=ln 12=2.4849', ln(12), 4],
    ['x=2*2.4849=4.9698', 2 * ln(12), 4],
    ['frac(ln 5, ln 1.2)=8.8275', ln(5) / ln(1.2), 4],
    ['x=18.199', E ** 4 / 3, 3],
    ['3x=e^4=54.598', E ** 4, 3],
  ];
  const problems: string[] = [];
  let checked = 0;
  for (const [frag, value, places] of SHOWN) {
    const m = /(-?\d+\.\d+)$/.exec(frag);
    const shown = m ? m[1] : null;
    if (!shown) continue;
    const text = frag.replace(/\s+/g, ' ');
    if (!body.includes(text) && !body.includes(frag)) { problems.push(`not on the page: ${frag}`); continue; }
    checked += 1;
    if (Number(shown) !== Number(value.toFixed(places)) || (shown.split('.')[1] ?? '').length !== places) problems.push(`${frag}: recomputed ${value.toFixed(places)}`);
  }
  expect(checked).toBeGreaterThan(50);
  expect(problems).toEqual([]);
});

test('every ln N = value, e^N = value and frac(ln A, ln B) = value written on the page is right to the places shown', () => {
  const problems: string[] = [];
  let checked = 0;
  const check = (what: string, shown: string, value: number) => {
    const places = (shown.split('.')[1] ?? '').length;
    checked += 1;
    if (Number(shown) !== Number(value.toFixed(places))) problems.push(`${what}=${shown} should be ${value.toFixed(places)}`);
  };
  for (const m of SOURCE.matchAll(/\{m:([^}]*)\}/g)) {
    const t = m[1];
    for (const x of t.matchAll(/frac\(ln (\d+(?:\.\d+)?), ln (\d+(?:\.\d+)?)\)=(-?\d+\.\d+)(?![\d.])/g)) check(`ln ${x[1]} / ln ${x[2]}`, x[3], ln(Number(x[1])) / ln(Number(x[2])));
    for (const x of t.matchAll(/(?:^|[=\s])ln (\d+(?:\.\d+)?)=(-?\d+\.\d+)(?![\d.])/g)) check(`ln ${x[1]}`, x[2], ln(Number(x[1])));
    for (const x of t.matchAll(/(?:^|[=\s])e\^(\(-?\d+(?:\.\d+)?\)|-?\d+(?:\.\d+)?)=(-?\d+\.\d+)(?![\d.])/g)) check(`e^${x[1]}`, x[2], E ** Number(x[1].replace(/[()]/g, '')));
  }
  expect(checked).toBeGreaterThan(12);
  expect(problems).toEqual([]);
});

test('every "Now you finish it" blank holds the recomputed value', () => {
  const blanks = [...SOURCE.matchAll(/<span class="blank" data-answers="([^"]*)">/g)].map((m) => m[1].split(';'));
  const want: [number, (x: number) => number][] = [
    [3, exact], // the asymptote of y = e^(x-1) + 3
    [Math.exp(-1) + 3, sf3],
    [log2(64), exact],
    [-2, exact],
    [18 / 2, exact],
    [log2(9) / log2(3), exact], // log_3 9
    [ln(30) / ln(4), sf3],
    [ln(10) - 1, exact], // 3x = ln 10 - 1, accepted to 4, 3, 2 and 1 decimal places below
    [(ln(10) - 1) / 3, sf3],
    [ln(50) / ln(3), sf3],
  ];
  expect(blanks.length).toBe(want.length);
  blanks.forEach((answers, i) => {
    const [value, round] = want[i];
    for (const a of answers) {
      if (i === 7) expect(Math.abs(Number(a) - value), `blank ${i}: ${a}`).toBeLessThan(0.0051);
      else expect(same(Number(a), round(value)), `blank ${i}: ${a} should be ${round(value)}`).toBe(true);
    }
  });
});

test('every simple sum written as {m:a*b=c} or {m:a+b=c} on the page is right', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:(-?\d+(?:\.\d+)?)([-+*])(-?\d+(?:\.\d+)?)=(-?\d+(?:\.\d+)?)\}/g)) {
    const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    const got = op === '+' ? a + b : op === '-' ? a - b : a * b;
    checked += 1;
    if (Math.abs(got - c) > 1e-9) problems.push(`${m[0]} should end in ${got}`);
  }
  expect(checked).toBeGreaterThan(3);
  expect(problems).toEqual([]);
});

test('no equation holds an ellipsis or a not-equals written with an exclamation mark', () => {
  const bad = [...SOURCE.matchAll(/\{md?:([^}]*)\}/g)].map((m) => m[1]).filter((t) => /(\.\.\.|…|&hellip;|!=)/.test(t));
  expect(bad).toEqual([]);
});

// ---- figures ----
// GEOM, CURVES and POINTS are filled as each figure is drawn, so draw them all before reading them.
async function figureModule() {
  const mod = await import('../src/book/alevel/figures/exponentials-logs.mjs');
  for (const id of Object.keys(mod.FIGURES)) mod.FIGURES[id]();
  return mod;
}
test('each figure curve is drawn from its equation, and each marked point lies on its curve and carries its own coordinates', async () => {
  const { FIGURES, GEOM, CURVES, POINTS } = await figureModule();
  const ids = Object.keys(FIGURES);
  expect(ids.length).toBeGreaterThanOrEqual(10);
  const EXPECTED: Record<string, ((x: number) => number)[]> = {
    'exponentials-logs-powers': [(x) => 2 ** x, (x) => 0.5 ** x],
    'exponentials-logs-e': [(x) => Math.exp(x), (x) => 2 ** x, (x) => 3 ** x],
    'exponentials-logs-shift': [(x) => Math.exp(-x) + 2],
    'exponentials-logs-inverse': [(x) => Math.exp(x), (x) => Math.log(x)],
    'exponentials-logs-solve': [(x) => 2 ** x],
    'exponentials-logs-region': [(x) => 2 ** x],
    'exponentials-logs-crossing': [(x) => Math.exp(2 * x) - 4],
    'exponentials-logs-flip': [(x) => 2 ** x, (x) => Math.log2(x)],
    'exponentials-logs-q-base': [(x) => 3 ** x],
    'exponentials-logs-q-shift': [(x) => Math.exp(2 * x) - 2],
  };
  expect(Object.keys(EXPECTED).sort()).toEqual([...ids].sort());
  const CLASSES: Record<string, string[]> = { curve: ['curve'], 'curve-b': ['curve-b'], 'curve-c': ['curve-c'] };
  void CLASSES;
  for (const id of ids) {
    const svg: string = FIGURES[id]();
    const g = GEOM[id];
    const toX = (px: number) => g.xmin + ((px - g.left) / (g.width - g.left - g.right)) * (g.xmax - g.xmin);
    const toY = (py: number) => g.ymax - ((py - g.top) / (g.height - g.top - g.bottom)) * (g.ymax - g.ymin);
    // the viewBox is the size the geometry says
    expect(svg, id).toContain(`viewBox="0 0 ${g.width} ${g.height}"`);
    // the curves drawn, in order, are the curves listed, and the listed ones are the equations above
    const paths = [...svg.matchAll(/<path class="(curve(?:-b|-c)?)" d="([^"]+)"/g)];
    expect(paths.length, id).toBe(EXPECTED[id].length);
    expect(CURVES[id].length, id).toBe(EXPECTED[id].length);
    paths.forEach((p, k) => {
      expect(p[1], `${id} curve ${k}`).toBe(CURVES[id][k].cls);
      const pts = [...p[2].matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      expect(pts.length, `${id} curve ${k} has points`).toBeGreaterThan(50);
      const tolerance = 0.02 * (g.ymax - g.ymin);
      for (const [px, py] of pts) {
        const x = toX(px);
        expect(Math.abs(toY(py) - EXPECTED[id][k](x)), `${id} curve ${k} at x=${x.toFixed(2)}`).toBeLessThan(tolerance);
      }
    });
    // the marked points
    const circles = [...svg.matchAll(/<circle class="pt(?:-open)?" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map((m) => [toX(Number(m[1])), toY(Number(m[2]))]);
    expect(circles.length, id).toBe(POINTS[id].length);
    POINTS[id].forEach((pt: { x: number; y: number; on: number | null }, k: number) => {
      expect(Math.abs(circles[k][0] - pt.x), `${id} point ${k} x`).toBeLessThan(0.02);
      expect(Math.abs(circles[k][1] - pt.y), `${id} point ${k} y`).toBeLessThan(0.05);
      if (pt.on !== null) expect(Math.abs(EXPECTED[id][pt.on](pt.x) - pt.y), `${id} point ${k} lies on its curve`).toBeLessThan(1e-9);
    });
    // a point's label shows its own coordinates (where the label is numbers), with a true minus sign
    const texts = [...svg.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/​/g, '').replace(/−/g, '-'));
    for (const t of texts) {
      const m = /^\((-?[\d.]+), (-?[\d.]+)\)$/.exec(t);
      if (!m) continue;
      const hit = POINTS[id].some((pt: { x: number; y: number }) => Math.abs(pt.x - Number(m[1])) < 0.006 && Math.abs(pt.y - Number(m[2])) < 0.006);
      expect(hit, `${id}: label ${t} matches a marked point`).toBe(true);
    }
  }
});

test('the labels that name a point by a log or by x = a number are right', async () => {
  const { FIGURES, POINTS } = await figureModule();
  const strip = (s: string) => [...s.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/​/g, '').replace(/−/g, '-'));
  // the solve and region pictures: the crossing of y = 2^x with y = 10 is at x = log_2 10 = 3.32
  for (const id of ['exponentials-logs-solve', 'exponentials-logs-region']) {
    expect(POINTS[id][0].x).toBeCloseTo(ln(10) / ln(2), 12);
    expect(2 ** POINTS[id][0].x).toBeCloseTo(10, 9);
    expect(strip(FIGURES[id]()).some((t) => t === 'x = 3.32')).toBe(true);
    expect(sf3(POINTS[id][0].x)).toBe(3.32);
  }
  // the crossing picture: (0, -3) and (ln 2, 0) on y = e^(2x) - 4
  const crossing = POINTS['exponentials-logs-crossing'];
  expect(crossing[0]).toMatchObject({ x: 0, y: -3 });
  expect(crossing[1].x).toBeCloseTo(ln(2), 12);
  expect(strip(FIGURES['exponentials-logs-crossing']())).toContain('(ln 2, 0)');
  // the mirror pictures: each point on one curve has its swapped point on the other
  for (const id of ['exponentials-logs-inverse', 'exponentials-logs-flip']) {
    const [a, b] = POINTS[id];
    expect([a.x, a.y]).toEqual([b.y, b.x]);
  }
  expect(POINTS['exponentials-logs-flip'][0]).toMatchObject({ x: 3, y: 8 });
  // the asymptote labels name the right horizontal line
  expect(strip(FIGURES['exponentials-logs-shift']())).toContain('asymptote y = 2');
  expect(strip(FIGURES['exponentials-logs-crossing']())).toContain('asymptote y = -4');
  expect(Math.exp(-50) + 2).toBeCloseTo(2, 12);
  expect(Math.exp(2 * -30) - 4).toBeCloseTo(-4, 12);
  // the question figures: the page asks for a = 3 and c = -2 and the pictures were drawn from those values
  expect(POINTS['exponentials-logs-q-base'].map((p: { x: number; y: number }) => [p.x, p.y])).toEqual([[0, 1], [2, 9]]);
  expect(POINTS['exponentials-logs-q-shift'][0]).toMatchObject({ x: 0, y: -1 });
});

test('a question figure describes the picture and never gives the answer away', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/exponentials-logs.mjs');
  const ids = Object.keys(FIGURES).filter((id) => id.startsWith('exponentials-logs-q-'));
  expect(ids.length).toBe(2);
  for (const id of ids) {
    const svg = FIGURES[id]();
    const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(svg)?.[1] ?? '';
    expect(desc, id).not.toMatch(/answer|solution/i);
    // the question asks for a (answer 3) and for c (answer -2): neither value may appear in a description
    expect(desc, id).not.toMatch(/\ba (?:is|equals) 3\b|\bc (?:is|equals) (?:minus )?2\b|\bbase 3\b|asymptote/i);
    const text = [...svg.matchAll(/<text [^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    expect(text.join(' '), id).not.toMatch(/asymptote|= 3\b|c = -2/);
  }
  // the page puts each question figure straight after its question text, and the question does not name the answer
  const qs = SOURCE.split(/(?=<div class="q")/).filter((b) => /\{fig:exponentials-logs-q-/.test(b.split('<ol class="ladder">')[0]));
  expect(qs.length).toBe(2);
});

test('equal-scale pictures use the same scale on both axes', async () => {
  const { GEOM } = await figureModule();
  for (const id of ['exponentials-logs-powers', 'exponentials-logs-e', 'exponentials-logs-inverse', 'exponentials-logs-flip']) {
    const g = GEOM[id];
    const px = (g.width - g.left - g.right) / (g.xmax - g.xmin);
    const py = (g.height - g.top - g.bottom) / (g.ymax - g.ymin);
    expect(py / px, id).toBeCloseTo(1, 6);
  }
});

test('every figure keeps its text inside its picture, on a phone and on a desktop', async ({ page }) => {
  for (const width of [320, 1100]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/books/a-level/exponentials-logs.html');
    const problems = await page.evaluate(() => {
      const out: string[] = [];
      for (const svg of document.querySelectorAll('main svg.graph-svg')) {
        const box = svg.getBoundingClientRect();
        const name = svg.querySelector('title')?.textContent ?? '';
        for (const t of svg.querySelectorAll('text')) {
          const b = t.getBoundingClientRect();
          if (!(t.textContent ?? '').trim()) continue;
          if (b.left < box.left - 1 || b.right > box.right + 1 || b.top < box.top - 1 || b.bottom > box.bottom + 1) out.push(`${name}: "${(t.textContent ?? '').trim()}" is outside the picture`);
        }
      }
      return out;
    });
    expect(problems, `width ${width}`).toEqual([]);
  }
});

test('a defined word is linked with its plain name, with no bracketed extra in the link text', async ({ page }) => {
  await page.goto('/books/a-level/exponentials-logs.html');
  const texts = await page.locator('main a.term:not(.words-strip a)').allTextContents();
  expect(texts.length).toBeGreaterThan(15);
  expect(texts.filter((t) => t.includes('('))).toEqual([]);
});

test('the page keeps change of base out: the formula and its name do not appear', () => {
  const text = SOURCE.replace(/\{m:[^}]*\}/g, ' ');
  // the page says once, in its opening note, that it does not use change of base
  expect((text.match(/change of base/gi) ?? []).length).toBe(1);
  expect(SOURCE).not.toMatch(/frac\(log_b x, log_b a\)/);
});
