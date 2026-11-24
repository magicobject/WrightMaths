// Turning book text into text a voice reads well. Pure functions with no page or
// browser dependencies, so they are unit-tested here and can also be used by the
// build step that makes recorded audio (one "say it this way" table for both).

const PRONOUNCE = [
  [/\bBIDMAS\b/g, 'bid mass'],
  [/\bBODMAS\b/g, 'bod mass'],
  [/\bSOH CAH TOA\b/g, 'soh cah toa'],
  [/\bGCSEs?\b/g, 'G C S E'],
  [/\be\.g\./gi, 'for example'],
  [/\bi\.e\./gi, 'that is'],
  [/\betc\./gi, 'et cetera'],
  [/π/g, ' pi '],
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
  [/²/g, ' squared'],
  [/³/g, ' cubed'],
  [/\^2/g, ' squared'],
  [/\^3/g, ' cubed'],
  [/√/g, ' square root of '],
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

/**
 * Plain text in, text for a voice out. A "?" is kept as a "?": voices raise their
 * pitch for it, and saying the words "question mark" is never wanted.
 */
export function toSpoken(text) {
  let out = String(text);
  for (const [pattern, say] of [...PRONOUNCE, ...SYMBOLS, ...UNITS]) out = out.replace(pattern, say);
  out = numbersToWords(out);
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
