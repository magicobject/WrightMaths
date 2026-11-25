// Pictures for A-level glossary terms (hover pop-up and glossary page). One inline SVG per term id, no requests.
// One file per area in ./term-figures/; this file joins them. Keys must be glossary term ids (the build checks).
import { FIGS as proof } from './term-figures/proof.mjs';
import { FIGS as algebra } from './term-figures/algebra.mjs';
import { FIGS as coordinate } from './term-figures/coordinate.mjs';
import { FIGS as sequences } from './term-figures/sequences.mjs';
import { FIGS as trigonometry } from './term-figures/trigonometry.mjs';
import { FIGS as exponentials } from './term-figures/exponentials.mjs';
import { FIGS as differentiation } from './term-figures/differentiation.mjs';
import { FIGS as integration } from './term-figures/integration.mjs';
import { FIGS as numerical } from './term-figures/numerical.mjs';
import { FIGS as vectors } from './term-figures/vectors.mjs';

export const TERM_FIGURES = {
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
};
