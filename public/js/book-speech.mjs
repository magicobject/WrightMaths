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
  [/£\s?(\d+(?:[.,]\d+)*)/g, '$1 pounds'], // not a full stop after the number: "£15." is 15 pounds.
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

/**
 * Plain text in, text for a voice out. A "?" is kept as a "?": voices raise their
 * pitch for it, and saying the words "question mark" is never wanted.
 */
export function toSpoken(text) {
  let out = String(text);
  for (const [pattern, say] of [...PRONOUNCE, ...SYMBOLS, ...UNITS]) out = out.replace(pattern, say);
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
