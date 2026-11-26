// Typed answers (data-answers, data-if) are written the way a student would type them: x^2, 2sqrt7, +-.
// In print they become proper symbols: x with a power, 2 followed by a root sign, a plus-or-minus sign.

/** "2sqrt(3)" -> "2\u221a3", "x<=3" -> "x\u22643", "+-" -> "\u00b1", "10pi" -> "10\u03c0". */
export function prettySymbols(text) {
  return String(text)
    .replace(/sqrt\(([^()]*)\)/g, (_, inner) => (/^[\w.]+$/.test(inner) ? `\u221a${inner}` : `\u221a(${inner})`))
    .replace(/sqrt(?=\()/g, '\u221a')
    .replace(/sqrt/g, '\u221a')
    .replaceAll('+-', '\u00b1')
    .replaceAll('<=', '\u2264')
    .replaceAll('>=', '\u2265')
    .replace(/(?<![A-Za-z])pi(?![A-Za-z])/g, '\u03c0')
    .replace(/(?<=\d)pi(?![A-Za-z])/g, '\u03c0')
    .replaceAll(/(?<=\w)\*(?=\w)/g, '\u00d7');
}

/** Runs for a typed answer: powers (x^2, 10^-3, x^(n+1)) become superscript runs. */
export function answerRuns(text) {
  const runs = [];
  const re = /\^(-?[A-Za-z0-9.]+|\([^()]*\))/g;
  let last = 0;
  const s = prettySymbols(text);
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) runs.push({ t: s.slice(last, m.index) });
    runs.push({ t: m[1].replace(/^\((.*)\)$/, '$1'), sup: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) runs.push({ t: s.slice(last) });
  return runs;
}

/** The letter for the nth option of a multiple-choice question: A, B, C... */
export const optionLetter = (index) => String.fromCharCode(65 + index);
