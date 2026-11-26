import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

// The Word build walks each page with JavaScript off, in print media. This runs the walker on a fixture page that has
// one of everything it must handle (see scripts/print/walker-page.js) and checks the tree it makes.

const ROOT = join(__dirname, '..');
type Node = { t?: string; x?: string; kind?: string; n?: number; runs?: Node[]; blocks?: Node[]; body?: Node[]; [k: string]: unknown };

function walk(path: string, features = '') {
  const out = execFileSync('node', ['scripts/print/walk-page.mjs', path, features], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out) as { blocks: Node[]; unknown: { tag: string }[]; qCount: number; jsRan: string | null; blocked: string[]; figures: Record<string, { pxWidth: number; cssWidth: number }> };
}
function* all(nodes: Node[] | undefined): Generator<Node> {
  for (const n of nodes ?? []) {
    yield n;
    yield* all(n.blocks);
    yield* all(n.body);
    yield* all(n.runs);
  }
}
const text = (runs: Node[] = []) => runs.map((r) => (r.t as string) ?? '').join('');

test.describe('the print walker', () => {
  const tree = walk('/__fixtures/print-walker.html');
  const nodes = [...all(tree.blocks)];

  test('runs with JavaScript off, and blocks every request that is not to our own server', () => {
    expect(tree.jsRan).toBeNull();
    expect(tree.blocked).toEqual(['https://example.invalid/outside.css']);
  });

  test('an element it does not know goes to the unknown report instead of being guessed at', () => {
    expect(tree.unknown.map((u) => u.tag)).toEqual(['marquee']);
  });

  test('screen-only parts are left out: Listen, buttons, crumbs, progress, sr-only, eyebrow', () => {
    const everything = JSON.stringify(tree.blocks);
    for (const word of ['Listen words', 'Start button', 'Crumb', 'progress words', 'screen reader only', 'Number"']) expect(everything).not.toContain(word);
  });

  test('data-print replaces an element, or removes it when empty', () => {
    const everything = JSON.stringify(tree.blocks);
    expect(everything).toContain('Printed instead');
    expect(everything).not.toContain('Screen words that should not print');
    expect(everything).not.toContain('Nothing should print');
    expect(everything).not.toContain('Type it like 3/8');
  });

  test('data-print-if keeps an element only when every feature it names is in force', () => {
    const shown = (features: string) => {
      const json = JSON.stringify(walk('/__fixtures/print-if.html', features).blocks);
      return ['Only with alpha.', 'Only with alpha and beta.', 'and beta only', 'Item with alpha', 'Item always'].filter((w) => json.includes(w));
    };
    expect(shown('')).toEqual(['Item always']);
    expect(shown('alpha')).toEqual(['Only with alpha.', 'Item with alpha', 'Item always']);
    expect(shown('beta')).toEqual(['and beta only', 'Item always']);
    expect(shown('alpha,beta')).toEqual(['Only with alpha.', 'Only with alpha and beta.', 'and beta only', 'Item with alpha', 'Item always']);
  });

  test('maths: fractions, column vectors, powers and subscripts, blanks', () => {
    expect(nodes.filter((n) => n.x === 'frac')).toHaveLength(2);
    const vec = nodes.find((n) => n.x === 'cvec') as Node & { rows: Node[][] };
    expect(vec.rows.map((r) => text(r))).toEqual(['4', '\u22121']);
    expect(nodes.some((n) => n.sup === true && n.t === '2')).toBe(true);
    expect(nodes.some((n) => n.sub === true && n.t === '2')).toBe(true);
    expect(nodes.find((n) => n.x === 'blank')).toMatchObject({ answers: '11' });
  });

  test('boxes, lists, tables and figures', () => {
    expect(nodes.filter((n) => n.t === 'box').map((n) => n.kind)).toEqual(['bys', 'words', 'key', 'worked', 'faded']);
    expect(nodes.filter((n) => n.t === 'list').map((n) => n.kind)).toEqual(['needs', 'tick', 'checklist', 'steps', 'steps', 'facts']);
    expect(nodes.find((n) => n.t === 'table')).toBeTruthy();
    expect(nodes.filter((n) => n.t === 'fig')).toHaveLength(2);
    // 3x screenshots: 300 ppi when placed at css width / 100 inches
    for (const f of Object.values(tree.figures)) expect(f.pxWidth).toBe(f.cssWidth * 3);
  });

  test('the answer check of a faded example and the recap are kept as their own nodes', () => {
    expect(nodes.some((n) => n.t === 'check')).toBe(true);
    expect(nodes.find((n) => n.t === 'recap')).toBeTruthy();
  });

  test('questions: numbered in page order, with options, tags, hints, slips and solution', () => {
    const qs = nodes.filter((n) => n.t === 'q') as (Node & { options: { correct: boolean; why: string }[]; tags: { marks: string; calc: string; grade: string; from: string[] }; ladder: unknown[]; wrong: { if: string }[]; solution: Node[]; screenOnly: string; marks: number })[];
    expect(qs.map((q) => q.n)).toEqual([1, 2, 3, 4]);
    const mc = qs[1];
    expect(mc.options.map((o) => o.correct)).toEqual([true, false]);
    expect(mc.options[1].why).toBe('Use a common denominator.');
    expect(mc.tags).toEqual({ marks: '[2 marks]', calc: 'Non-calculator', grade: 'Grade 4', from: ['fractions.html'] });
    expect(mc.ladder).toHaveLength(2);
    expect(mc.wrong[0].if).toBe('21/35');
    expect(mc.solution.some((n) => n.kind === 'markscheme')).toBe(true);
    expect(qs[3].screenOnly).toMatch(/drag/);
    expect(tree.qCount).toBe(4);
  });
});
