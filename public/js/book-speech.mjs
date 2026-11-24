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
  [/£\s?([\d.,]+)/g, '$1 pounds'],
  [/%/g, ' percent'],
  [/\+/g, ' plus '],
  [/(\d)\s?\/\s?(\d)/g, '$1 over $2'],
];

// Units are only spoken in full straight after a number, so ordinary words are never touched.
const UNITS = [
  [/(\d)\s?mm\b/g, '$1 millimetres'],
  [/(\d)\s?cm\b/g, '$1 centimetres'],
  [/(\d)\s?km\b/g, '$1 kilometres'],
  [/(\d)\s?kg\b/g, '$1 kilograms'],
  [/(\d)\s?ml\b/g, '$1 millilitres'],
  [/(\d)\s?m\b/g, '$1 metres'],
  [/(\d)\s?g\b/g, '$1 grams'],
];

/**
 * Plain text in, text for a voice out. A "?" is kept as a "?": voices raise their
 * pitch for it, and saying the words "question mark" is never wanted.
 */
export function toSpoken(text) {
  let out = String(text);
  for (const [pattern, say] of [...PRONOUNCE, ...SYMBOLS, ...UNITS]) out = out.replace(pattern, say);
  return out
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
