// The A-level glossary: Year 1 and Year 2 together, one list.
//
// Entry format (same as the GCSE glossary, src/book/glossary.mjs):
//   id        lower-case, hyphenated, unique
//   term      the word as it is shown (HTML entities allowed)
//   strand    an id from STRANDS in topics.mjs ('al-algebra' ...)
//   level     'Y1' or 'Y2': the year the term is first needed
//   def       ONE plain-English definition. It is also the hover pop-up, so it is plain text: no {m:...} shorthand
//   example   a string, or an array of strings; {m:...} maths shorthand and {term:id} links are allowed
//   watch     (optional) the common slip
//   flip      (optional) the reverse side of the idea
//   see       (optional) ids of related terms
//   aka       (optional) an array of other names, each a short string (used by search)
//
// One file per area in ./glossary/ (so the areas can be written in parallel); this file joins them.

import { TERMS as proof } from './glossary/proof.mjs';
import { TERMS as algebra } from './glossary/algebra.mjs';
import { TERMS as coordinate } from './glossary/coordinate.mjs';
import { TERMS as sequences } from './glossary/sequences.mjs';
import { TERMS as trigonometry } from './glossary/trigonometry.mjs';
import { TERMS as exponentials } from './glossary/exponentials.mjs';
import { TERMS as differentiation } from './glossary/differentiation.mjs';
import { TERMS as integration } from './glossary/integration.mjs';
import { TERMS as numerical } from './glossary/numerical.mjs';
import { TERMS as vectors } from './glossary/vectors.mjs';

export const GLOSSARY = [
  ...proof,
  ...algebra,
  ...coordinate,
  ...sequences,
  ...trigonometry,
  ...exponentials,
  ...differentiation,
  ...integration,
  ...numerical,
  ...vectors,
];
