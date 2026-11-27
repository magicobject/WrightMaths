import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './support/fixtures';

// Checks for the Vectors in two dimensions page that a general test cannot make:
//   - every typed key is RECOMPUTED here from the question's numbers (magnitudes and directions to their stated rounding);
//   - every wrong-answer value is recomputed from the slip its message names, and the message is checked for that slip;
//   - every drawn arrow is measured on the picture and compared with the vector it stands for;
//   - every label in a figure is nearer its own arrow than any other, and no text leaves its picture;
//   - every number written in a {m:...} calculation on the page is right.
const ROOT = join(__dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'src', 'pages', 'books', 'a-level', 'vectors-2d.html'), 'utf8');

type Vec = [number, number];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const mul = (k: number, a: Vec): Vec => [k * a[0], k * a[1]];
const mag = (a: Vec) => Math.hypot(a[0], a[1]);
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const direction = (v: Vec) => { const d = deg(Math.atan2(v[1], v[0])); return d < 0 ? d + 360 : d; };
const dp = (x: number, n: number) => String(Number(x.toFixed(n)));
const sig3 = (x: number) => String(Number(x.toPrecision(3)));
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** "x,y" as a student types a column vector. */
const pair = (v: Vec, n = 9) => `${dp(v[0], n)},${dp(v[1], n)}`;
/** A coefficient as a whole number or a fraction n/d (d up to 12). */
function coef(c: number): string {
  if (Math.abs(c - Math.round(c)) < 1e-9) return String(Math.round(c));
  for (let d = 2; d <= 12; d += 1) if (Math.abs(c * d - Math.round(c * d)) < 1e-9) return `${Math.round(c * d)}/${d}`;
  return String(c);
}
/** "3i-2j" or "3/4a+1/4b": the coefficients of two named vectors, written as a student types them. */
function combo(v: Vec, names: [string, string], n = 9): string {
  let out = '';
  v.forEach((c, k) => {
    const r = n === 9 ? c : Number(c.toFixed(n)); // 9 means "exact": keep fractions such as 2/3 unrounded
    if (Math.abs(r) < 1e-12) return;
    const body = Math.abs(r) === 1 ? names[k] : `${n === 9 ? coef(Math.abs(r)) : String(Math.abs(r))}${names[k]}`;
    out += `${r < 0 ? '-' : out ? '+' : ''}${body}`;
  });
  return out || '0';
}
const ij = (v: Vec, n = 9) => combo(v, ['i', 'j'], n);
/** A unit vector as fractions, "5/13,12/13". */
function unit(v: Vec): string {
  const m = mag(v);
  expect(Math.abs(m - Math.round(m)), `|${v}| must be a whole number to type as a fraction`).toBeLessThan(1e-9);
  const f = (x: number) => { const g = gcd(x, Math.round(m)); return Math.round(m) / g === 1 ? String(x / g) : `${x / g}/${Math.round(m) / g}`; };
  return `${f(v[0])},${f(v[1])}`;
}

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', minus: '-', ldquo: '"', rdquo: '"', rsquo: "'", nbsp: ' ', times: '*', deg: 'deg' };
const decode = (t: string) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);
const plain = (h: string) => decode(h.replace(/<[^>]+>/g, '').replace(/\{m:/g, '').replace(/\}/g, '')).replace(/\s+/g, ' ').trim();

/** Whether two typed answers have the same value: numbers (fractions, decimals, roots) or algebra in a, b, c, p, q, tried at two sets of values. */
function sameValue(x: string, y: string): boolean {
  const SAMPLES = [[2, 3, 5, 7, 11, 13, 17, 19], [1.5, -4, 2, 0.5, 3, -2, 6, 4]];
  const toFn = (t: string) => {
    let s = t.trim().replace(/\s+/g, '').replace(/^\((.*,.*)\)$/, '$1').replace(new RegExp(String.fromCharCode(0x221a), 'g'), 'sqrt');
    s = s.replace(/sqrt(\d+(?:\.\d+)?)/g, 'sqrt($1)').replace(/(\d)(?=[a-z(])/g, '$1*').replace(/\)(?=[a-z(\d])/g, ')*');
    return s.split(',').map((part) => (v: number[]) => new Function('sqrt', 'a', 'b', 'c', 'p', 'q', 'i', 'j', 'x', `return (${part});`)(Math.sqrt, ...v) as number);
  };
  try {
    const f = toFn(x);
    const g = toFn(y);
    return f.length === g.length && SAMPLES.every((v) => f.every((fn, k) => Math.abs(fn(v) - g[k](v)) < 5e-4 * Math.max(1, Math.abs(g[k](v)))));
  } catch { return false; }
}

type Wrong = { values: string[]; text: string; claimed: boolean };
type Question = { plain: string; mode: string; answers: string[]; wrongs: Wrong[]; block: string };
function questions(): Question[] {
  return SOURCE.split(/(?=<div class="q")/).filter((b) => b.startsWith('<div class="q"')).map((block) => {
    const attrs = /^<div class="q"([^>]*)>/.exec(block)?.[1] ?? '';
    const answers = decode(/data-answers="([^"]*)"/.exec(attrs)?.[1] ?? '').split(';').map((x) => x.trim()).filter(Boolean);
    const wrongList = /<ul class="wrong">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? '';
    const wrongs = [...wrongList.matchAll(/<li data-if="([^"]*)">([\s\S]*?)<\/li>/g)].map((m) => ({ values: decode(m[1]).split(';').map((x) => x.trim()).filter(Boolean), text: m[2], claimed: false }));
    return { plain: plain(/<p class="qtext">([\s\S]*?)<\/p>/.exec(block)?.[1] ?? ''), mode: /data-mode="([^"]*)"/.exec(attrs)?.[1] ?? 'value', answers, wrongs, block };
  });
}

// ---------- the recomputed keys, and the slip behind each wrong value ----------
type Slip = { value: string; says: RegExp };
type Check = { find: string; answer: string; also?: string[]; slips?: Slip[] };

const A: Vec = [2, 3]; // used by the mixed review
/** The slip of dividing by the sum of the components instead of the magnitude, as reduced fractions: (-8, 6) over 14 is -4/7,3/7. */
function unit14(v: Vec): string {
  const d = Math.abs(v[0]) + Math.abs(v[1]);
  const f = (x: number) => { const g = gcd(x, d); return `${x / g}/${d / g}`; };
  return `${f(v[0])},${f(v[1])}`;
}
/** Where C must be for A, B, C to be collinear, given AB and the x-distance of AC: AC is a multiple of AB. */
const collinearY = (a: Vec, b: Vec, cx: number) => a[1] + ((cx - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
const kForC = (() => { const c = sub(mul(3, [0, 1]), mul(2, [1, 0])); const bc = sub(c, [0, 1]); const ab = sub([0, 1], [1, 0]); return bc[0] / ab[0]; })();
const CHECKS: Check[] = [
  // warm-up and recap
  { find: 'Work out 5-(-3)', answer: String(5 - -3), slips: [{ value: String(5 - 3), says: /take away is/ }] },
  { find: 'two short sides of length 6 and 8', answer: String(Math.hypot(6, 8)), slips: [{ value: String(6 + 8), says: /added the two lengths/ }, { value: String(6 * 6 + 8 * 8), says: /square of the longest side/ }] },
  { find: 'tan theta=frac(3, 4)', answer: dp(deg(Math.atan(3 / 4)), 1), slips: [{ value: dp(deg(Math.atan(4 / 3)), 1), says: /You used/ }] },
  { find: 'Simplify 3(2x-1)+2(x+4)', answer: `${3 * 2 + 2}x+${3 * -1 + 2 * 4}`, slips: [{ value: `${3 * 2 + 2}x+${3 * 1 + 2 * 4}`, says: /\+3/ }] },
  { find: 'Share 30 in the ratio 2 : 3', answer: String((30 * 3) / 5), slips: [{ value: String((30 * 2) / 5), says: /smaller share/ }, { value: String((30 * 2) / 3), says: /5 parts/ }] },
  // 1. vectors and column vectors
  { find: 'Write the vector a shown as a column vector', answer: pair([4 - 1, 1 - 5]), slips: [{ value: pair([-(4 - 1), -(1 - 5)]), says: /opposite direction, from the head/ }, { value: pair([4 - 1, Math.abs(1 - 5)]), says: /goes down/ }] },
  { find: 'Write col(-5, 2) in i, j notation', answer: ij([-5, 2]), slips: [{ value: ij([5, 2]), says: /negative/ }, { value: ij([2, -5]), says: /swapped/ }] },
  { find: 'starts at (2, -1). It moves by col(-3, 4)', answer: pair(add([2, -1], [-3, 4])), slips: [{ value: pair(sub([2, -1], [-3, 4])), says: /subtracted the vector/ }, { value: pair([-3, 4]), says: /the vector itself/ }] },
  { find: 'Write -p in i, j notation', answer: ij(mul(-1, [7, -3])), slips: [{ value: ij([-7, -3]), says: /i part only/ }, { value: ij([7, 3]), says: /j part only/ }] },
  { find: 'The vector from P to Q is 3i + 2j', answer: pair(add([1, 1], [3, 2])), slips: [{ value: pair([3, 2]), says: /the vector, not the point/ }, { value: pair(sub([1, 1], [3, 2])), says: /subtracted/ }] },
  // 2. adding, subtracting, multiplying
  { find: 'Find col(3, -2) + col(-1, 5)', answer: pair(add([3, -2], [-1, 5])), slips: [{ value: pair(sub([3, -2], [-1, 5])), says: /subtracted the second vector/ }, { value: pair([3 - -1, -2 + 5]), says: /subtracted the tops/ }] },
  { find: 'the vector from A to B is col(4, 1)', answer: pair(add([4, 1], [-1, 3])), slips: [{ value: pair(sub([4, 1], [-1, 3])), says: /subtracted/ }, { value: pair(mul(-1, add([4, 1], [-1, 3]))), says: /from C to A/ }] },
  { find: 'find p - q', answer: ij(sub([2, 5], [4, -1])), slips: [{ value: ij(add([2, 5], [4, -1])), says: /<b>p<\/b> \+ <b>q<\/b>/ }, { value: ij([2 - 4, 5 - 1]), says: /5-1=4/ }] },
  { find: 'find 4a', answer: pair(mul(4, [2, -3])), slips: [{ value: pair([4 * 2, -3]), says: /only the top/ }, { value: pair([2 + 4, -3 + 4]), says: /added 4/ }] },
  { find: 'col(p, -9) is parallel to col(4, 6)', answer: String(4 * (-9 / 6)), slips: [{ value: String(4 * (9 / 6)), says: /not 1\.5/ }] },
  { find: 'find 2a + b', answer: ij(add(mul(2, [3, -1]), [-2, 4])), slips: [{ value: ij([2 * 3 + -2, -1 + 4]), says: /doubled the i part only/ }, { value: ij(add([3, -1], [-2, 4])), says: /did not double/ }] },
  // 3. magnitude, unit vectors, direction
  { find: 'Find the magnitude of col(6, 8)', answer: String(mag([6, 8])), slips: [{ value: String(6 + 8), says: /added the components/ }, { value: String(6 * 6 + 8 * 8), says: /magnitude squared/ }] },
  { find: 'exact magnitude of col(2, 7)', answer: `sqrt(${2 * 2 + 7 * 7})`, slips: [{ value: String(2 + 7), says: /added the components/ }, { value: `sqrt(${7 * 7 - 2 * 2})`, says: /45/ }] },
  { find: 'Find |a| when a = 4i - 9j', answer: sig3(mag([4, -9])), slips: [{ value: String(4 + 9), says: /ignoring the sign/ }, { value: sig3(Math.sqrt(81 - 16)), says: /8\.06/ }] },
  { find: 'unit vector in the direction of col(5, 12)', answer: unit([5, 12]), slips: [{ value: `5/${5 + 12},12/${5 + 12}`, says: /5\+12/ }] },
  { find: 'magnitude 15 that points in the same direction as col(3, 4)', answer: pair(mul(15 / mag([3, 4]), [3, 4])), slips: [{ value: pair(mul(mag([3, 4]), [3, 4])), says: /multiplied by 5/ }, { value: pair(mul(15, [3, 4])), says: /multiplied by 15/ }] },
  { find: 'Find the direction of col(4, 3)', answer: dp(direction([4, 3]), 1), slips: [{ value: dp(deg(Math.atan(4 / 3)), 1), says: /y-axis/ }, { value: String(3 / 4), says: /value of tan/ }] },
  { find: 'Find the direction of col(-4, 3)', answer: dp(direction([-4, 3]), 1), slips: [{ value: dp(deg(Math.atan(3 / 4)), 1), says: /acute angle in the triangle/ }, { value: dp(180 + deg(Math.atan(3 / 4)), 1), says: /added the acute angle/ }, { value: dp(deg(Math.atan(3 / -4)), 1), says: /calculator gives/ }] },
  // 4. position vectors
  { find: 'A is the point (3, 7) and B is the point (8, 2)', answer: pair(sub([8, 2], [3, 7])), slips: [{ value: pair(sub([3, 7], [8, 2])), says: /BA/ }, { value: pair(add([3, 7], [8, 2])), says: /added the coordinates/ }] },
  { find: 'vec(OA) = 2i + 3j and vec(OB) = 5i - j', answer: ij(sub([5, -1], [2, 3])), slips: [{ value: ij(sub([2, 3], [5, -1])), says: /BA/ }, { value: ij(add([2, 3], [5, -1])), says: /added the position vectors/ }] },
  { find: 'distance between A (1, -2) and B (5, 1)', answer: String(mag(sub([5, 1], [1, -2]))), slips: [{ value: String(4 + 3), says: /4 and 3/ }, { value: String(4 * 4 + 3 * 3), says: /distance squared/ }] },
  { find: 'exact length of PQ', answer: `sqrt(${5 * 5 + 4 * 4})`, slips: [{ value: String(5 + 4), says: /5 and 4/ }, { value: String(Math.sqrt(25 - 16)), says: /square root of 9 is 3/ }] },
  { find: 'A is (-4, 1) and B is (8, 7)', answer: pair(mul(0.5, add([-4, 1], [8, 7]))), slips: [{ value: pair(add([-4, 1], [8, 7])), says: /<b>a<\/b> \+ <b>b<\/b>/ }, { value: pair(mul(0.5, sub([8, 7], [-4, 1]))), says: /half of/ }] },
  { find: 'A is (0, 1) and B is (10, 6)', answer: pair(add([0, 1], mul(2 / 5, sub([10, 6], [0, 1])))), slips: [{ value: pair(add([0, 1], mul(3 / 5, sub([10, 6], [0, 1])))), says: /3 parts for AP/ }, { value: pair(mul(0.5, add([0, 1], [10, 6]))), says: /midpoint/ }, { value: pair(mul(2 / 5, sub([10, 6], [0, 1]))), says: /the vector/ }] },
  { find: 'vec(AB) is col(3, -2) and A is the point (1, 4)', answer: pair(add([1, 4], [3, -2])), slips: [{ value: pair(sub([1, 4], [3, -2])), says: /subtracted/ }, { value: pair([3, -2]), says: /itself/ }] },
  // 5. proof (a vector in terms of two named vectors is a pair of coefficients: a = (1, 0) and b = (0, 1))
  { find: 'Write vec(OM) in terms of a and b', answer: combo(add([1, 0], mul(0.5, sub([0, 1], [1, 0]))), ['a', 'b']), slips: [{ value: combo(mul(0.5, sub([0, 1], [1, 0])), ['a', 'b']), says: /AM/ }, { value: combo(add([1, 0], [0, 1]), ['a', 'b']), says: /full sum/ }] },
  { find: 'Find vec(AC) in terms of a and c', answer: combo(sub([0, 1], [1, 0]), ['a', 'c']), slips: [{ value: combo(sub([1, 0], [0, 1]), ['a', 'c']), says: /CA/ }, { value: combo(add([1, 0], [0, 1]), ['a', 'c']), says: /OB/ }] },
  { find: 'AP : PB = 1 : 3', answer: combo(add([1, 0], mul(1 / 4, sub([0, 1], [1, 0]))), ['a', 'b']), slips: [{ value: combo(add([1, 0], mul(3 / 4, sub([0, 1], [1, 0]))), ['a', 'b']), says: /3 parts with/ }, { value: combo(add([1, 0], mul(1 / 3, sub([0, 1], [1, 0]))), ['a', 'b']), says: /one third/ }] },
  { find: 'C (7, k) are collinear', answer: String(collinearY([1, 2], [3, 3], 7)), slips: [{ value: String(collinearY([1, 2], [3, 3], 7) - 2), says: /bottom number/ }] },
  { find: 'vec(OA) = 2a and vec(OB) = 3b', answer: combo(sub(mul(3, [0, 1]), mul(2, [1, 0])), ['a', 'b']), slips: [{ value: combo(sub(mul(2, [1, 0]), mul(3, [0, 1])), ['a', 'b']), says: /BA/ }, { value: combo(sub(mul(3, [0, 1]), [1, 0]), ['a', 'b']), says: /took away/ }] },
  { find: 'Find vec(AC) in terms of p and q', answer: combo(add([1, 0], [0, 1]), ['p', 'q']), slips: [{ value: combo(sub([1, 0], [0, 1]), ['p', 'q']), says: /DB/ }] },
  { find: 'k times vec(AB)', answer: String(3 / 1), slips: [{ value: coef(1 / 3), says: /other way round/ }, { value: String(6), says: /<b>b<\/b> part of/ }] },
  // flip
  { find: 'magnitude 12 and direction 25deg', answer: pair([12 * Math.cos(rad(25)), 12 * Math.sin(rad(25))], 1), slips: [{ value: pair([12 * Math.sin(rad(25)), 12 * Math.cos(rad(25))], 1), says: /swapped/ }] },
  { find: 'magnitude 7 and direction 140deg', answer: ij([7 * Math.cos(rad(140)), 7 * Math.sin(rad(140))], 1), slips: [{ value: ij([7 * Math.cos(rad(40)), 7 * Math.sin(rad(40))], 1), says: /acute angle/ }, { value: ij([7 * Math.sin(rad(140)), 7 * Math.cos(rad(140))], 1), says: /swapped/ }] },
  { find: 'P is the point (-1, 3) and Q is the point (4, -2)', answer: pair(sub([4, -2], [-1, 3])), slips: [{ value: pair(sub([-1, 3], [4, -2])), says: /QP/ }, { value: pair(add([-1, 3], [4, -2])), says: /added the coordinates/ }] },
  { find: 'Find the direction of col(-6, 6)', answer: dp(direction([-6, 6]), 1), slips: [{ value: dp(deg(Math.atan(6 / -6)), 1), says: /what the calculator gives/ }, { value: dp(deg(Math.atan(6 / 6)), 1), says: /acute angle in the triangle/ }, { value: dp(direction([-6, -6]), 1), says: /col\(-6, -6\)/ }] },
  // mixed review
  { find: 'find |a + b| to 3 significant figures', answer: sig3(mag(add(A, [-1, 4]))), slips: [{ value: sig3(mag(A) + mag([-1, 4])), says: /added the two magnitudes/ }, { value: sig3(mag(sub(A, [-1, 4]))), says: /You found/ }] },
  { find: 'Find |vec(OM)| to 3 significant figures', answer: sig3(mag(mul(0.5, add([1, 5], [7, -3])))), slips: [{ value: sig3(mag(mul(0.5, sub([7, -3], [1, 5])))), says: /half of/ }] },
  { find: 'unit vector in the direction of col(-8, 6)', answer: unit([-8, 6]), also: [pair(mul(1 / mag([-8, 6]), [-8, 6]), 1)], slips: [{ value: unit14([-8, 6]), says: /8\+6/ }, { value: unit([8, 6]), says: /lost the minus sign/ }] },
  { find: 'Find the direction of col(-5, -2)', answer: dp(direction([-5, -2]), 1), slips: [{ value: dp(deg(Math.atan(2 / 5)), 1), says: /acute angle/ }, { value: dp(180 - deg(Math.atan(2 / 5)), 1), says: /subtracted/ }] },
  { find: 'C (5, k) are collinear', answer: String(collinearY([2, 1], [8, 5], 5)), slips: [{ value: String(collinearY([2, 1], [8, 5], 5) - 1), says: /bottom number/ }] },
  // exam style
  { find: '|p + 2q|', answer: `sqrt(${Math.round(mag(add([4, -3], mul(2, [1, 2]))) ** 2)})`, slips: [{ value: `sqrt(${Math.round(mag(sub([4, -3], mul(2, [1, 2]))) ** 2)})`, says: /You found/ }, { value: String(6 + 1), says: /added the components/ }] },
  { find: 'A is the point (-1, 2) and B is the point (9, -3)', answer: pair(add([-1, 2], mul(3 / 5, sub([9, -3], [-1, 2])))), slips: [{ value: pair(add([-1, 2], mul(2 / 5, sub([9, -3], [-1, 2])))), says: /2 parts out of 5/ }, { value: pair(mul(3 / 5, sub([9, -3], [-1, 2]))), says: /the vector/ }] },
  { find: 'Find the angle between p and the positive x-axis', answer: dp(direction([-5, 12]), 1), slips: [{ value: dp(deg(Math.atan(12 / 5)), 1), says: /acute angle/ }, { value: dp(deg(Math.atan(12 / -5)), 1), says: /calculator gives/ }, { value: dp(180 + deg(Math.atan(12 / 5)), 1), says: /added the acute angle/ }] },
  { find: 'Find vec(OM) in terms of a and c', answer: combo(add([1, 0], mul(0.5, [0, 1])), ['a', 'c']), slips: [{ value: combo(add([0, 1], mul(0.5, [1, 0])), ['a', 'c']), says: /midpoint of CB/ }, { value: combo(add([1, 0], [0, 1]), ['a', 'c']), says: /reaches B/ }] },
  { find: 'Show that A, B and C are collinear by finding k', answer: String(kForC), slips: [{ value: '3', says: /in front of <b>b<\/b>/ }, { value: '-2', says: /in front of <b>a<\/b>/ }] },
];

test('every typed key is recomputed, and every wrong-answer value is tied to the slip its message names', async () => {
  const { matches } = await import('../public/js/book-answer.mjs');
  const qs = questions();
  const problems: string[] = [];
  const checked = new Set<Question>();
  for (const c of CHECKS) {
    const found = qs.filter((q) => q.plain.includes(c.find));
    if (found.length !== 1) { problems.push(`"${c.find}" matches ${found.length} questions`); continue; }
    const q = found[0];
    checked.add(q);
    if (!matches(c.answer, q.answers, q.mode)) problems.push(`${c.find}: the key does not accept the recomputed answer "${c.answer}" (keys: ${q.answers.join(' | ')})`);
    for (const k of q.answers) if (![c.answer, ...(c.also ?? [])].some((a) => sameValue(k, a))) problems.push(`${c.find}: key "${k}" is not the recomputed answer "${c.answer}"`);
    for (const s of c.slips ?? []) {
      const li = q.wrongs.find((w) => matches(s.value, w.values, q.mode));
      if (!li) { problems.push(`${c.find}: no wrong-answer entry accepts the slip value "${s.value}" (entries: ${q.wrongs.map((w) => w.values.join(' | ')).join(' / ')})`); continue; }
      li.claimed = true;
      if (!s.says.test(li.text)) problems.push(`${c.find}: the message for "${s.value}" does not name the slip ${s.says}: ${li.text.slice(0, 90)}`);
      if (matches(s.value, q.answers, q.mode)) problems.push(`${c.find}: the slip value "${s.value}" is also a right answer`);
      for (const v of li.values) if (!sameValue(v, s.value)) problems.push(`${c.find}: "${v}" is listed with the slip but is not the slip value "${s.value}"`);
    }
    for (const w of q.wrongs) if (!w.claimed) problems.push(`${c.find}: wrong-answer entry "${w.values.join(' | ')}" has no recomputed slip`);
  }
  for (const q of qs) if (q.answers.length > 0 && !checked.has(q)) problems.push(`no recomputed key for: ${q.plain.slice(0, 70)}`);
  expect(CHECKS.length).toBeGreaterThan(50);
  expect(problems).toEqual([]);
});

// ---------- multiple-choice keys that can be computed ----------
const options = (find: string) => {
  const q = questions().find((x) => x.plain.includes(find));
  expect(q, find).toBeTruthy();
  return [...(q as Question).block.matchAll(/<li( data-correct| data-why="([^"]*)")?>([\s\S]*?)<\/li>/g)].filter((m) => m[1]).map((m) => ({ correct: m[1] === ' data-correct', why: decode(m[2] ?? ''), text: plain(m[3]), raw: m[3] }));
};
/** i and j coefficients of text such as "4i - j" or "0.6i - 0.8j". */
function ijOf(text: string): Vec {
  const out: Vec = [0, 0];
  for (const t of text.replace(/\s+/g, '').replace(/^The vector/, '').match(/[+-]?\d*\.?\d*[ij]/g) ?? []) {
    const c = t.slice(0, -1);
    out[t.endsWith('i') ? 0 : 1] = c === '' || c === '+' ? 1 : c === '-' ? -1 : Number(c);
  }
  return out;
}
const colOf = (text: string): Vec => { const m = /col\((-?\d+), (-?\d+)\)/.exec(text); return [Number(m?.[1]), Number(m?.[2])]; };

test('multiple-choice keys: the vector in the correct option is the one asked for, and the reasons quote the right numbers', () => {
  // same vector as col(4, -1): the wrong options are (4, 1) and (-1, 4), as their reasons say
  const same = options('Which of these is the same vector as col(4, -1)');
  expect(same.map((o) => ijOf(o.text))).toEqual([[4, -1], [4, 1], [-1, 4]]);
  expect(same.map((o) => o.correct)).toEqual([true, false, false]);
  expect(same[1].why).toContain('(4, 1)');
  expect(same[2].why).toContain('(-1, 4)');
  // parallel to col(3, -6): only the correct option has a zero cross product; the reasons quote the ratios
  const par = options('Which of these vectors is parallel to col(3, -6)');
  expect(par.map((o) => { const v = colOf(o.raw); return v[0] * -6 - v[1] * 3 === 0; })).toEqual(par.map((o) => o.correct));
  expect(par[1].why).toContain('1 : 2');
  expect(par[2].why).toContain('2 : -1');
  // unit vector: only the correct option has magnitude 1; the reasons quote 0.71 and 1.41
  const un = options('Which of these is a unit vector');
  expect(un.map((o) => Math.abs(mag(ijOf(o.text)) - 1) < 1e-9)).toEqual(un.map((o) => o.correct));
  expect(un[1].why).toContain(dp(mag([0.5, 0.5]), 2));
  expect(un[2].why).toContain(dp(Math.SQRT2, 2));
  // spot the mistake: the magnitude of 3i - 4j is 5; start minus end is the opposite of end minus start; (2, 3) and (4, 5) are not parallel
  expect(options('Dan says').find((o) => o.correct)?.text).toContain(`is ${mag([3, -4])}`);
  expect(options('Meera says').find((o) => o.correct)?.text).toContain(`col(${sub([4, 6], [1, 2]).join(', ')})`);
  expect(plain(questions().find((q) => q.plain.includes('Meera says'))?.block ?? '')).toContain(`col(${sub([1, 2], [4, 6]).join(', ')})`);
  expect(2 * 5 - 3 * 4).not.toBe(0);
  expect(options('Sam says').find((o) => o.correct)?.text).toContain('frac(4, 2)=2');
});

test('the blanks in every "Now you finish it" are recomputed', () => {
  const expected = [
    ...[-2, 5], // col(-2, 5) in i, j
    ...mul(3, [-1, 3]), ...add([2, 1], mul(3, [-1, 3])), // a + 3b: 3b = (-3, 9), sum (-1, 10)
    dp(deg(Math.atan(4 / 3)), 1), dp(360 - deg(Math.atan(4 / 3)), 1), // direction of col(3, -4)
    ...[sub([7, 4], [3, 1])[1], mag(sub([7, 4], [3, 1]))], // AB = (4, 3), |AB| = 5
    ...[3, 3], // OB = 3 OA
  ].map(String);
  const blanks = [...SOURCE.matchAll(/class="blank" data-answers="([^"]*)"/g)].map((m) => m[1]);
  expect(blanks).toEqual(expected);
});

// ---------- every calculation written as {m:a=b=c} ----------
function frac(s: string): string {
  let out = s;
  for (;;) {
    const i = out.indexOf('frac(');
    if (i < 0) return out;
    let depth = 0;
    let comma = -1;
    let end = -1;
    for (let k = i + 4; k < out.length; k += 1) {
      if (out[k] === '(') depth += 1;
      else if (out[k] === ')') { depth -= 1; if (depth === 0) { end = k; break; } } else if (out[k] === ',' && depth === 1) comma = k;
    }
    if (comma < 0 || end < 0) return '';
    out = `${out.slice(0, i)}((${out.slice(i + 5, comma)})/(${out.slice(comma + 1, end)}))${out.slice(end + 1)}`;
  }
}
function evalPiece(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  s = frac(s);
  s = s.replace(/tan\^\(-1\)\(/g, 'ATAN(').replace(/sqrt\(/g, 'SQRT(');
  s = s.replace(/(\d*\.?\d*)\s*(cos|sin)\s*(\d+(?:\.\d+)?)deg/g, (_m, k, f, d) => `(${k || 1})*${f.toUpperCase()}(${d})`);
  s = s.replace(/(\d+(?:\.\d+)?)deg/g, '$1').replace(/\^/g, '**').replace(/(\d)\s*(?=SQRT|\()/g, '$1*').replace(/\)\s*(?=\d)/g, ')*');
  if (!/^[\d\s.+\-*/()]*$/.test(s.replace(/ATAN|SQRT|COS|SIN/g, ''))) return null;
  try {
    return new Function('ATAN', 'SQRT', 'COS', 'SIN', `return (${s});`)((x: number) => deg(Math.atan(x)), Math.sqrt, (d: number) => Math.cos(rad(d)), (d: number) => Math.sin(rad(d))) as number;
  } catch { return null; }
}
test('every calculation {m:a=b=c} on the page is right (to the rounding it shows)', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const m of SOURCE.matchAll(/\{m:([^}]*)\}/g)) {
    if (!/[=]/.test(m[1])) continue;
    const pieces = m[1].split(/~=|=/);
    const values = pieces.map(evalPiece);
    if (values.some((v) => v === null || !Number.isFinite(v))) continue;
    checked += 1;
    const nums = values as number[];
    if (Math.max(...nums) - Math.min(...nums) > 0.006) problems.push(`{m:${m[1]}} gives ${nums.join(' and ')}`);
  }
  expect(checked).toBeGreaterThan(60);
  expect(problems).toEqual([]);
});

// ---------- the pictures ----------
type Arrow = { name: string; from: Vec; vec: Vec; tail: Vec; tip: Vec; px: [number, number, number, number] };
type Label = { for: string; x: number; y: number; anchor: string; text: string };

/** Read the drawn geometry back from a figure's SVG: pixels to graph units by the grid and the axes, never by the code that drew it. */
function measure(svg: string) {
  const lines = [...svg.matchAll(/<line class="(grid|axis)" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"\/>/g)].map((m) => ({ cls: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5] }));
  const gx = [...new Set(lines.filter((l) => l.cls === 'grid' && l.x1 === l.x2).map((l) => l.x1))].sort((a, b) => a - b);
  const gy = [...new Set(lines.filter((l) => l.cls === 'grid' && l.y1 === l.y2).map((l) => l.y1))].sort((a, b) => a - b);
  const unitX = (gx[gx.length - 1] - gx[0]) / (gx.length - 1);
  const unitY = (gy[gy.length - 1] - gy[0]) / (gy.length - 1);
  const axisX = lines.find((l) => l.cls === 'axis' && l.x1 === l.x2)!.x1;
  const axisY = lines.find((l) => l.cls === 'axis' && l.y1 === l.y2)!.y1;
  const toGraph = (px: number, py: number): Vec => [(px - axisX) / unitX, (axisY - py) / unitY];
  const arrows: Arrow[] = [...svg.matchAll(/<g class="vec" data-name="([^"]*)" data-from="([^"]*)" data-vec="([^"]*)"><line class="[^"]*" x1="([\d.-]+)" y1="([\d.-]+)" x2="[\d.-]+" y2="[\d.-]+"\/><polygon points="([\d.-]+),([\d.-]+) /g)].map((m) => {
    const tail = toGraph(+m[4], +m[5]);
    const tip = toGraph(+m[6], +m[7]);
    return { name: m[1], from: m[2].split(',').map(Number) as Vec, vec: m[3].split(',').map(Number) as Vec, tail, tip, px: [+m[4], +m[5], +m[6], +m[7]] as [number, number, number, number] };
  });
  const labels: Label[] = [...svg.matchAll(/<text[^>]*data-for="([^"]*)" x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([\s\S]*?)<\/text>/g)].map((m) => ({ for: m[1], x: +m[2], y: +m[3], anchor: m[4], text: m[5].replace(/<[^>]+>/g, '').replace(/\u200b/g, '') }));
  return { arrows, labels, unitX, unitY };
}
const measured = (a: Arrow): Vec => sub(a.tip, a.tail);

// What each picture is meant to show, written here from the page's own numbers (not read from the figure code).
const STATED: Record<string, Record<string, Vec>> = {
  'vectors-2d-equal': { a1: [3, 2], a2: [3, 2] },
  'vectors-2d-components': { a: [4, -2] },
  'vectors-2d-ij': { v: [3, -2], i: [1, 0], j: [0, 1] },
  'vectors-2d-triangle': { a: [3, 1], b: [2, 3], sum: [5, 4] },
  'vectors-2d-parallelogram': { a: [4, 1], b: [1, 3], 'a-top': [4, 1], 'b-right': [1, 3], sum: [5, 4] },
  'vectors-2d-scalar': { a: [2, 1], 'two-a': [4, 2], 'neg-a': [-2, -1] },
  'vectors-2d-magnitude': { a: [5, 2] },
  'vectors-2d-direction': { a: [-3, 4] },
  'vectors-2d-position': { a: [2, 4], b: [6, 1], AB: [4, -3] },
  'vectors-2d-ratio': { AP: [2, 1], PB: [4, 2] },
  'vectors-2d-proof': { a: [6, 2], b: [2, 5], AB: [-4, 3], MN: [-2, 1.5] },
  'vectors-2d-collinear': { AB: [2, 1], BC: [4, 2] },
  'vectors-2d-flip': { v: [8 * Math.cos(rad(40)), 8 * Math.sin(rad(40))] },
  'vectors-2d-q-read': { a: [3, -4] },
  'vectors-2d-q-triangle': { AB: [4, 1], BC: [-1, 3] },
  'vectors-2d-q-pgram': { a: [5, 1], c: [1, 3] },
};

test('every drawn arrow goes from its tail to its tip by exactly the vector it stands for', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/vectors-2d.mjs');
  expect(Object.keys(FIGURES).sort()).toEqual(Object.keys(STATED).sort());
  const problems: string[] = [];
  let arrows = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const m = measure(make());
    expect(m.unitX, `${id}: the same pixels per unit on both axes`).toBeCloseTo(m.unitY, 0); // the height is a whole number of pixels, so the two differ by a fraction of one
    expect(m.arrows.map((a) => a.name).sort(), `${id}: every arrow is in the table`).toEqual(Object.keys(STATED[id]).sort());
    for (const a of m.arrows) {
      arrows += 1;
      const want = STATED[id][a.name];
      const got = measured(a);
      if (Math.hypot(got[0] - want[0], got[1] - want[1]) > 0.02) problems.push(`${id}/${a.name}: drawn as (${got.map((x) => x.toFixed(2))}) but stands for (${want})`);
      if (Math.hypot(a.vec[0] - want[0], a.vec[1] - want[1]) > 1e-9) problems.push(`${id}/${a.name}: data-vec (${a.vec}) is not (${want})`);
      const tail = Math.hypot(a.tail[0] - a.from[0], a.tail[1] - a.from[1]);
      if (tail > 0.02) problems.push(`${id}/${a.name}: tail drawn at (${a.tail.map((x) => x.toFixed(2))}) not at (${a.from})`);
    }
  }
  expect(arrows).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});

test('arrows that join, add or scale do so on the picture (triangle and parallelogram laws, position vectors, ratio, midpoints)', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/vectors-2d.mjs');
  const f = (id: string) => Object.fromEntries(measure((FIGURES as Record<string, () => string>)[id]()).arrows.map((a) => [a.name, a]));
  const near = (a: Vec, b: Vec) => expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.02);
  const t = f('vectors-2d-triangle'); // head to tail, and the sum joins the two ends
  near(t.b.tail, t.a.tip); near(t.sum.tail, t.a.tail); near(t.sum.tip, t.b.tip); near(measured(t.sum), add(measured(t.a), measured(t.b)));
  const p = f('vectors-2d-parallelogram'); // opposite sides are equal and the diagonal reaches the far corner
  near(measured(p['a-top']), measured(p.a)); near(measured(p['b-right']), measured(p.b)); near(p['a-top'].tail, p.b.tip); near(p['b-right'].tail, p.a.tip);
  near(p.sum.tip, p['a-top'].tip); near(p.sum.tip, p['b-right'].tip); near(measured(p.sum), add(measured(p.a), measured(p.b)));
  const s = f('vectors-2d-scalar');
  near(measured(s['two-a']), mul(2, measured(s.a))); near(measured(s['neg-a']), mul(-1, measured(s.a)));
  const pos = f('vectors-2d-position'); // AB is b - a, from the tip of a to the tip of b
  near(pos.AB.tail, pos.a.tip); near(pos.AB.tip, pos.b.tip); near(measured(pos.AB), sub(measured(pos.b), measured(pos.a)));
  const r = f('vectors-2d-ratio'); // P divides AB as 1 : 2
  near(r.PB.tail, r.AP.tip); near(measured(r.PB), mul(2, measured(r.AP)));
  const pr = f('vectors-2d-proof'); // M and N are midpoints, MN = half of AB
  near(pr.MN.tail, mul(0.5, measured(pr.a))); near(pr.MN.tip, mul(0.5, measured(pr.b))); near(measured(pr.MN), mul(0.5, measured(pr.AB))); near(measured(pr.AB), sub(measured(pr.b), measured(pr.a)));
  const c = f('vectors-2d-collinear');
  near(c.BC.tail, c.AB.tip); near(measured(c.BC), mul(2, measured(c.AB)));
  const q = f('vectors-2d-q-triangle');
  near(q.BC.tail, q.AB.tip);
  const g = f('vectors-2d-q-pgram');
  near(add(measured(g.a), measured(g.c)), [6, 4]); // the corner B that the page's dashed sides meet at
});

test('the magnitude and direction written on pictures match the drawn arrows', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/vectors-2d.mjs');
  const F = FIGURES as Record<string, () => string>;
  const first = (id: string) => measure(F[id]()).arrows[0];
  const m = measured(first('vectors-2d-magnitude'));
  expect(mag(m)).toBeCloseTo(Math.sqrt(29), 1); // the label says root 29 and the caption says 5 and 2
  expect(measure(F['vectors-2d-magnitude']()).labels.map((l) => l.text).join('|')).toContain(`\u221a${Math.round(mag(m) ** 2)}`);
  const d = measured(first('vectors-2d-direction'));
  expect(direction(d)).toBeCloseTo(direction([-3, 4]), 1);
  const fl = measured(first('vectors-2d-flip'));
  expect(mag(fl)).toBeCloseTo(8, 1);
  expect(direction(fl)).toBeCloseTo(40, 1);
  expect(dp(fl[0], 2)).toBe('6.13'); // the worked example gives 6.13 and 5.14
  expect(dp(fl[1], 2)).toBe('5.14');
  for (const text of ['col(4, -2)', 'col(5, 4)', 'col(4, -3)', 'col(5, 2)', 'col(-3, 4)', 'col(6.13, 5.14)']) expect(SOURCE, text).toContain(`{m:${text}}`);
});

test('every label in a picture is nearer its own arrow than any other arrow', async () => {
  const { FIGURES } = await import('../src/book/alevel/figures/vectors-2d.mjs');
  const segDist = (px: number, py: number, [x1, y1, x2, y2]: number[]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  const problems: string[] = [];
  let labelled = 0;
  for (const [id, make] of Object.entries(FIGURES) as [string, () => string][]) {
    const m = measure(make());
    for (const l of m.labels) {
      labelled += 1;
      const width = l.text.length * 13; // 24px bold, about 13px a letter
      const cx = l.x + (l.anchor === 'start' ? width / 2 : l.anchor === 'end' ? -width / 2 : 0);
      const cy = l.y - 8;
      const own = m.arrows.find((a) => a.name === l.for);
      if (!own) { problems.push(`${id}: label "${l.text}" names no arrow "${l.for}"`); continue; }
      const mine = segDist(cx, cy, own.px);
      for (const other of m.arrows.filter((a) => a !== own)) {
        const d = segDist(cx, cy, other.px);
        if (d < mine) problems.push(`${id}: label "${l.text}" is ${Math.round(d)}px from "${other.name}" but ${Math.round(mine)}px from its own "${own.name}"`);
      }
    }
  }
  expect(labelled).toBeGreaterThan(30);
  expect(problems).toEqual([]);
});

test('a question figure describes the picture without giving the answer', async () => {
  const src = readFileSync(join(ROOT, 'src', 'book', 'alevel', 'figures', 'vectors-2d.mjs'), 'utf8');
  const descs = [...src.matchAll(/'(vectors-2d-q-[a-z]+)': \(\) => \{[\s\S]*?desc: '((?:[^'\\]|\\.)*)'/g)];
  expect(descs.length).toBe(3);
  for (const d of descs) expect(d[2], d[1]).not.toMatch(/\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)|\bminus\b|-\d/);
});

test('no figure text leaves its picture', async ({ page }) => {
  await page.goto('/books/a-level/vectors-2d.html');
  const outside = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll('main svg.graph-svg')) {
      const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
      for (const t of svg.querySelectorAll('text')) {
        const b = (t as SVGGraphicsElement).getBBox();
        if (b.x < vb[0] - 0.5 || b.y < vb[1] - 0.5 || b.x + b.width > vb[2] + 0.5 || b.y + b.height > vb[3] + 0.5) out.push(`${svg.querySelector('title')?.textContent}: "${t.textContent}"`);
      }
    }
    return out;
  });
  expect(outside).toEqual([]);
});

test('the topic stays inside its scope: no scalar product, no third dimension in the lessons', () => {
  const text = plain(SOURCE.replace(/<!--[\s\S]*?-->/g, ' '));
  expect(text).not.toMatch(/scalar product|dot product|cross product|\bk-component|3D\b|three-dimensional|Further/i);
  // the hero names the next topic once, and that is all
  expect((text.match(/three dimensions/gi) ?? []).length).toBe(1);
});
