// Turning book text into text a voice reads well. Pure functions with no page or
// browser dependencies, so they are unit-tested here and can also be used by the
// build step that makes recorded audio (one "say it this way" table for both).

// A function's argument: a plain value or letter is said as it is; anything longer keeps its brackets.
const bracketed = (arg) => (/^\s*[\w−-]+\s*$/.test(arg) ? arg.trim() : `(${arg.trim()})`);

const PRONOUNCE = [
  [/\bBIDMAS\b/g, 'bid mass'],
  [/\bBODMAS\b/g, 'bod mass'],
  [/\bSOH CAH TOA\b/g, 'soh cah toa'],
  [/\bGCSEs?\b/g, 'G C S E'],
  [/\be\.g\./gi, 'for example'],
  [/\bi\.e\./gi, 'that is'],
  [/\betc\./gi, 'et cetera'],
  [/π/g, ' pi '],
  // Function notation: f(x) is "f of x", f(4) is "f of 4", f(x + 1) keeps its brackets: "f of (x plus 1)".
  // fg(x) is "f of g of x" (f applied to g(x)), f with a -1 power is "f inverse", and P(red) is "the probability of red".
  [/(?<![A-Za-z0-9])([fgh])⁻¹(?=\()/g, '$1 inverse'],
  [/(?<![A-Za-z0-9])P\(([^()]*)\)/g, (match, arg) => `the probability of ${arg.trim()}`],
  [/(?<![A-Za-z0-9])([fgh])([fgh])\(([^()]*)\)/g, (match, outer, inner, arg) => `${outer} of ${inner} of ${bracketed(arg)}`],
  [/(?<![A-Za-z0-9])([fgh])( inverse)?\(([^()]*)\)/g, (match, name, inverse = '', arg) => `${name}${inverse} of ${bracketed(arg)}`],
];

const SYMBOLS = [
  [/−|–/g, ' minus '],
  [/(^|[\s(=])-(?=\d)/g, '$1 minus '],
  [/×/g, ' times '],
  [/÷/g, ' divided by '],
  [/≈/g, ' is about '],
  [/≡/g, ' is identically equal to '],
  [/≤/g, ' is less than or equal to '],
  [/≥/g, ' is greater than or equal to '],
  [/≠/g, ' is not equal to '],
  [/</g, ' is less than '],
  [/>/g, ' is greater than '],
  [/=/g, ' equals '],
  [/(?<=\s)-(?=\s)/g, ' minus '],
  [/²/g, ' squared'],
  [/³/g, ' cubed'],
  [/\^2/g, ' squared'],
  [/\^3/g, ' cubed'],
  [/∛/g, ' cube root of '],
  [/√/g, ' square root of '],
  [/x10\^(-?)/g, (m, neg) => ` times ten to the power of ${neg ? 'minus ' : ''}`], // typed standard form, "3.2x10^5"
  [/°C/g, ' degrees Celsius'],
  [/°/g, ' degrees'],
  [/£\s?(\d+(?:[.,]\d+)*)/g, (match, amount) => {
    // Not a full stop after the number: "£15." is 15 pounds. Two decimal places read as pounds and pence.
    const money = /^(\d+)\.(\d\d)$/.exec(amount.replace(/,/g, ''));
    if (!money) return `${amount} pounds`;
    const pence = Number(money[2]);
    if (money[1] === '0') return `${pence} pence`;
    return pence === 0 ? `${money[1]} pounds` : `${money[1]} pounds ${pence}`;
  }],
  [/%/g, ' percent'],
  [/\+/g, ' plus '],
  [/(\d)\s?\/\s?(\d)/g, '$1 over $2'],
];

// Units are only spoken in full straight after a number, so ordinary words are never touched.
// One of anything is singular ("1 centimetre"), and so is a unit that describes the noun after it
// ("a 3 metre length", "a 6 metre pole"); everything else is plural ("3 metres long").
const UNIT_NAMES = {
  mm: ['millimetre', 'millimetres'], cm: ['centimetre', 'centimetres'], km: ['kilometre', 'kilometres'],
  kg: ['kilogram', 'kilograms'], ml: ['millilitre', 'millilitres'], m: ['metre', 'metres'], g: ['gram', 'grams'],
};
const DESCRIBES_A_THING = new Set([
  'length', 'pole', 'ladder', 'reel', 'pipe', 'weight', 'door', 'side', 'rod', 'beam', 'plank', 'cable', 'rope',
  'fence', 'wall', 'bar', 'tube', 'board', 'square', 'cube', 'ramp', 'wire', 'strip', 'sheet', 'tile', 'run',
]);
const UNITS = [
  [/(\d[\d.,]*)\s?(mm|cm|km|kg|ml|m|g)\b/g, (match, number, unit, offset, whole) => {
    const next = /^\s+([a-z]+)/i.exec(whole.slice(offset + match.length))?.[1]?.toLowerCase();
    const [one, many] = UNIT_NAMES[unit];
    return `${number} ${number === '1' || DESCRIBES_A_THING.has(next) ? one : many}`;
  }],
];

const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = ['', ' thousand', ' million', ' billion'];

const underThousand = (n) => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const restWords = rest < 20 ? (rest === 0 ? '' : SMALL[rest]) : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${SMALL[rest % 10]}` : ''}`;
  if (!hundreds) return restWords;
  return `${SMALL[hundreds]} hundred${restWords ? ` and ${restWords}` : ''}`;
};

/**
 * A whole number as British English words: 4872 is "four thousand, eight hundred and seventy-two".
 * A number with a leading zero (a bearing such as 045) or too many digits is read digit by digit.
 */
export function numberToWords(digits) {
  const text = String(digits);
  if (!/^\d+$/.test(text)) return text;
  if ((text.length > 1 && text.startsWith('0')) || text.length > 12) return [...text].map((d) => SMALL[Number(d)]).join(' ');
  let n = Number(text);
  if (n === 0) return 'zero';
  const groups = [];
  while (n > 0) { groups.unshift(n % 1000); n = Math.floor(n / 1000); }
  const parts = groups.map((g, i) => (g ? `${underThousand(g)}${SCALES[groups.length - 1 - i]}` : ''));
  const last = groups[groups.length - 1];
  // "one thousand and five", "two million, three hundred": the last small group is joined with "and" when it has no hundreds
  const words = parts.filter(Boolean);
  if (words.length > 1 && last > 0 && last < 100) return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
  return words.join(', ');
}

// A number on its own, with thousands separators (4,872 or 10 000) and decimals: not part of a word or a label like x2 or T0.
const NUMBER = /(?<![\w.,])(\d{1,3}(?:[, ]\d{3})+|\d+)(?:\.(\d+))?(?!\d)(?!(?:st|nd|rd|th)\b)/g;

/** Every number in the text as words, so a voice never has to guess: "0.643" is "zero point six four three". */
export function numbersToWords(text) {
  return String(text).replace(NUMBER, (match, whole, decimals, offset, all) => {
    const digits = whole.replace(/[, ]/g, '');
    const spoken = numberToWords(digits);
    const words = decimals ? `${spoken} point ${[...decimals].map((d) => SMALL[Number(d)]).join(' ')}` : spoken;
    return /[A-Za-z]/.test(all[offset + match.length] ?? '') ? `${words} ` : words; // 5x is "five x"
  });
}


// Coordinates and other bracketed pairs: "(3, 4)" is "three comma four", "(-2, 5)" is "minus two comma five".
const COORD_ITEM = String.raw`[-−–]?\d[\d.]*|[A-Za-z]`;
const COORDINATE = new RegExp(String.raw`(?<![a-z0-9])\(\s*(${COORD_ITEM})\s*,\s*(${COORD_ITEM})(?:\s*,\s*(${COORD_ITEM}))?\s*\)`, 'g');
const minusWord = (item) => item.replace(/^[-−–]/, 'minus ');
export function coordinatesToWords(text) {
  return String(text).replace(COORDINATE, (match, a, b, c) => ` ${[a, b, c].filter((x) => x !== undefined).map(minusWord).join(' comma ')} `);
}

// Ratios: "2 : 3" and "2:3" are "2 to 3", "1 : 2 : 5" is "1 to 2 to 5" (Greg, 26 Nov 2026). The colon has the same
// spacing on both sides, so a sentence colon ("is 3: 8 minus 5") is left alone. A clock time such as 09:15 is not a
// ratio and is left alone too (how times sound is still undecided).
const RATIO_NUM = String.raw`\d+(?:[ ,]\d{3})*(?:\.\d+)?`;
const RATIO = new RegExp(String.raw`(?<![\d.:])${RATIO_NUM}(?:(?: : |:)${RATIO_NUM})+(?![\d:])`, 'g');
export function ratiosToWords(text) {
  return String(text).replace(RATIO, (match) => {
    if (/^\d{1,2}:\d{2}$/.test(match) && Number(match.split(':')[0]) < 24) return match;
    return match.split(/ : |:/).join(' to ');
  });
}

// Piper reads a bare "A" as the article "uh" and "ay" as "eye". "eigh" is the letter name, as in "hay" without the h.
const LETTER_A = 'eigh';
const OPERATOR_WORDS = new Set(['equals', 'plus', 'minus', 'times', 'over', 'squared', 'cubed', 'comma', 'divided']);
const AFTER_OPERATOR_OK = new Set([...'abcdefghijklmnopqrstuvwxyz']);
const NUMBER_WORDS = new Set([...SMALL, ...TENS.filter(Boolean)]);
const A_AFTER_SIGN = new Set(['is', 'and', 'means', 'comes', 'gives', 'to', 'has', 'when', 'where']);
const A_STARTS_A_NAME =new Set(['is', 'are', 'and', 'has', 'lies', 'to', 'then', 'be', ...OPERATOR_WORDS]);

/**
 * The letter A (a variable, a point or a label) is said as the letter name, never as the article:
 * "A equals three", "pipe A", "a plus b", "vector a" but not "a tube of paint" or "plus a bit".
 */
export function sayLetterA(text) {
  return String(text).replace(/\b[Aa]\b/g, (letter, offset, whole) => {
    const before = whole.slice(0, offset);
    const after = whole.slice(offset + 1);
    if (/^\.[A-Za-z]/.test(after) || /^[-'’]?\w/.test(after) && !/^-\w/.test(after)) return letter; // "a.m.", "a's"
    const prev = /([A-Za-z]+)([^A-Za-z]*)$/.exec(before);
    const next = /^([^A-Za-z]*)([A-Za-z]+)?(?:[^A-Za-z]+([A-Za-z]+))?/.exec(after);
    const prevWord = prev?.[1]?.toLowerCase();
    const nextGap = next?.[1] ?? '';
    const nextWord = nextGap.trim() === '' ? next?.[2]?.toLowerCase() : undefined;
    const next2 = nextWord ? next?.[3]?.toLowerCase() : undefined;
    const sentenceStart = !prev || /[.?!:]/.test(prev[2]);
    const sayIt = () => LETTER_A;
    // The article never comes straight before a stop or comma, or straight after a bracket: "find a.", "side a,", "(3 + 2) times a"
    if (letter === 'a' && /^\s*([.,;:?!)]|$)/.test(after) && !/\b(of|in|on|at)\s*$/i.test(before)) return sayIt();
    // "side a along the bottom", "in terms of a and b"
    if (letter === 'a' && prevWord === 'side' && prev[2].trim() === '') return sayIt();
    if (letter === 'a' && nextWord === 'and' && /^\s*and\s+[a-z]\b(?![\w'-])/.test(after)) return sayIt();
    // After a sign, "a" followed by is/and/means... is the letter: "times a is written", "OA equals a and"
    if (letter === 'a' && prevWord && ['equals', 'times'].includes(prevWord) && prev[2].trim() === '' && nextWord && A_AFTER_SIGN.has(nextWord)) return sayIt();
    if (letter === 'A') {
      if (!sentenceStart) return sayIt();
      return nextWord && A_STARTS_A_NAME.has(nextWord) ? sayIt() : letter; // "A tube of paint" is the article
    }
    const nextIsOperator = nextWord && OPERATOR_WORDS.has(nextWord)
      && (nextWord !== 'plus' && nextWord !== 'minus' || (next2 && (AFTER_OPERATOR_OK.has(next2) || NUMBER_WORDS.has(next2))));
    if (nextIsOperator) return sayIt();
    if (prevWord && NUMBER_WORDS.has(prevWord) && prev[2].trim() === '' && (nextWord === undefined && !/^[A-Za-z]/.test(after.trim()) || nextWord && OPERATOR_WORDS.has(nextWord))) return sayIt(); // "3a"
    if (prevWord && ['equals', 'times', 'comma', 'vector', 'plus', 'minus', 'over'].includes(prevWord) && prev[2].trim() === '') {
      const ends = nextWord === undefined && !/^[A-Za-z]/.test(after.trim());
      if (ends || (nextWord && (OPERATOR_WORDS.has(nextWord) || nextWord.length === 1 || nextWord === 'as'))) return sayIt(); // "a times a as simply as possible"
    }
    return letter;
  });
}

/**
 * Plain text in, text for a voice out. A "?" is kept as a "?": voices raise their
 * pitch for it, and saying the words "question mark" is never wanted.
 */
export function toSpoken(text) {
  let out = ratiosToWords(coordinatesToWords(text));
  // The pronunciation table runs twice so a function inside a function, f(g(x)), is reached from the inside out.
  for (const [pattern, say] of [...PRONOUNCE, ...PRONOUNCE, ...SYMBOLS, ...UNITS]) out = out.replace(pattern, say);
  out = out.replace(/(?<=[A-Za-z)])-(?=\d)/g, ' minus '); // "3k-7", "x^2-4" and "(x+1)^2-5" are subtractions, not hyphens
  out = out
    .replace(/\bx0\b/g, 'x nought') // iteration: x0, x1, xn, x(n+1)
    .replace(/\bx([1-9])\b/g, 'x $1')
    .replace(/(\b|(?<=\d))xn\b/g, ' x n')
    .replace(/\bab\b/g, 'eigh bee') // letters side by side multiply: say each letter
    .replace(/\bxy\b/g, 'x y')
    .replace(/\)\(/g, ') times (') // (x + 2)(x + 3): brackets side by side multiply
    .replace(/(\d|\b[a-z])\(/g, '$1 times (') // 3(x + 4), n(n + 1)
    .replace(/\)([a-z])\b/g, ') times $1'); // (3 + 2)a
  out = sayLetterA(numbersToWords(out));
  return out
    .replace(/[“”]/g, '') // quotation marks are not spoken
    .replace(/[‘’]/g, "'")
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/…|\.{3}/g, ', ')
    .replace(/\s+([,.;:?!])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Short sentences in turn sound natural; each says whether it is a question so the voice can lift its pitch. */
export function splitSentences(text) {
  return String(text)
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ text: s, question: /\?$/.test(s) }));
}
