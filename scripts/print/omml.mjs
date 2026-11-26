// Maths for Word (OMML) from the walker's runs. GCSE needs only: fractions, column vectors (a bracketed matrix),
// and powers and subscripts. The book has no MathML, so that is all this handles.

import { BuilderElement, Math as OMath, MathFraction, MathRun, MathSubScript, MathSuperScript } from 'docx';

const el = (name, children = [], val) => new BuilderElement({
  name,
  children,
  ...(val === undefined ? {} : { attributes: { val: { key: 'm:val', value: val } } }),
});

/** Plain text of a list of runs (used for the Word text and for checks): "3/4", "(x + 1)/2", "(4, -1)". */
export function runsToText(runs) {
  return runs.map((r) => {
    if (r.x === 'frac') {
      const part = (rs) => { const t = runsToText(rs).trim(); return /^[\w.]+$/.test(t) ? t : `(${t})`; };
      return `${part(r.num)}/${part(r.den)}`;
    }
    if (r.x === 'cvec') return `(${r.rows.map((row) => runsToText(row).trim()).join(', ')})`;
    if (r.x === 'blank') return '____';
    if (r.x === 'ref') return runsToText(r.runs);
    if (r.x === 'br') return ' ';
    return r.sup ? `^${r.t}` : r.t ?? '';
  }).join('').replaceAll('\u2212', '-');
}

// The last "thing" a power attaches to: a closing bracket group, or the last character.
function splitBase(text) {
  const t = text.trimEnd();
  if (t.endsWith(')')) {
    let depth = 0;
    for (let i = t.length - 1; i >= 0; i -= 1) {
      if (t[i] === ')') depth += 1;
      if (t[i] === '(') depth -= 1;
      if (depth === 0) return [t.slice(0, i), t.slice(i)];
    }
  }
  return [t.slice(0, -1), t.slice(-1)];
}

/** The inside of an equation: an array of OMML components for a list of runs. */
export function mathChildren(runs) {
  const out = [];
  let pending = '';
  const flush = () => { if (pending) out.push(new MathRun(pending)); pending = ''; };
  for (const r of runs) {
    if (r.sup || r.sub) {
      let base;
      if (pending.trim()) {
        const [head, tail] = splitBase(pending);
        pending = head;
        flush();
        base = [new MathRun(tail)];
      } else {
        flush();
        base = [out.length ? out.pop() : new MathRun(' ')];
      }
      const script = [new MathRun(r.t)];
      out.push(r.sup ? new MathSuperScript({ children: base, superScript: script }) : new MathSubScript({ children: base, subScript: script }));
    } else if (r.x === 'frac') {
      flush();
      out.push(new MathFraction({ numerator: mathChildren(r.num), denominator: mathChildren(r.den) }));
    } else if (r.x === 'cvec') {
      flush();
      out.push(matrixBrackets(r.rows));
    } else if (r.x === 'ref') {
      flush();
      out.push(...mathChildren(r.runs));
    } else {
      pending += r.x ? runsToText([r]) : r.t;
    }
  }
  flush();
  return out;
}

/** A bracketed matrix with one column: a column vector. `rows` is a list of runs lists. */
export function matrixBrackets(rows) {
  const cells = rows.map((row) => el('m:mr', [el('m:e', mathChildren(row))]));
  const matrix = el('m:m', [
    el('m:mPr', [el('m:mcs', [el('m:mc', [el('m:mcPr', [el('m:count', [], '1'), el('m:mcJc', [], 'center')])])])]),
    ...cells,
  ]);
  return el('m:d', [el('m:dPr', [el('m:begChr', [], '('), el('m:endChr', [], ')')]), el('m:e', [matrix])]);
}

/** One inline equation for a paragraph: a fraction or a column vector, with any text around it already outside. */
export function equation(run) {
  return new OMath({ children: mathChildren([run]) });
}
