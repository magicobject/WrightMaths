// Single source of truth for the GCSE book's topic graph.
//
// Maths is a pyramid: every topic stands on others. Each topic declares what
// it needs (`needs`); "unlocks" and each topic's layer are DERIVED by
// scripts/book-lib.mjs, never written by hand. The build fails if a `needs`
// id does not exist, if there is a cycle, or if a `live` topic has no page.
//
// status: 'live'    = has a page in src/pages/books/gcse/<id>.html
//         'planned' = shown greyed on the pyramid, no page yet
// strand: n Number, a Algebra, r Ratio, g Geometry, p Probability, s Statistics
// tier:   'F' = Foundation and Higher, 'H' = Higher only
// flip:   the reverse side of this topic (plain text, shown on the page and map)

export const STRANDS = {
  n: { name: 'Number', short: 'Number' },
  a: { name: 'Algebra', short: 'Algebra' },
  r: { name: 'Ratio, proportion and rates of change', short: 'Ratio' },
  g: { name: 'Geometry and measures', short: 'Geometry' },
  p: { name: 'Probability', short: 'Probability' },
  s: { name: 'Statistics', short: 'Statistics' },
};

export const TOPICS = [
  // Base layer: the ideas everything else rests on.
  { id: 'place-value', title: 'Place value', strand: 'n', tier: 'F', status: 'planned', needs: [], flip: 'Reading a number and writing it down' },
  { id: 'four-operations', title: 'Add, subtract, multiply, divide', strand: 'n', tier: 'F', status: 'planned', needs: ['place-value'], flip: 'Multiplying and dividing; adding and subtracting' },
  { id: 'negative-numbers', title: 'Negative numbers', strand: 'n', tier: 'F', status: 'planned', needs: ['four-operations'], flip: 'Adding a negative and subtracting a positive' },
  { id: 'order-of-operations', title: 'Order of operations', strand: 'n', tier: 'F', status: 'planned', needs: ['four-operations'], flip: 'Building a calculation and unpicking it' },
  { id: 'factors-multiples', title: 'Factors and multiples', strand: 'n', tier: 'F', status: 'planned', needs: ['four-operations'], flip: 'Factors and multiples are two views of the same facts' },
  { id: 'squares-roots', title: 'Squares and square roots', strand: 'n', tier: 'F', status: 'planned', needs: ['factors-multiples'], flip: 'Squaring and square-rooting' },
  { id: 'shapes-angles', title: 'Shapes and angles', strand: 'g', tier: 'F', status: 'planned', needs: ['four-operations'], flip: 'Finding an angle and building a shape from angles' },
  { id: 'algebra-basics', title: 'Algebra basics', strand: 'a', tier: 'F', status: 'planned', needs: ['order-of-operations', 'negative-numbers'], flip: 'Substituting numbers in, and writing a rule from numbers' },

  // Pilot topics: written and live in the pilot edition.
  { id: 'fractions', title: 'Fractions', strand: 'n', tier: 'F', status: 'live', needs: ['factors-multiples', 'four-operations'], flip: 'Finding a fraction of an amount, and finding the whole from a fraction of it' },
  { id: 'solving-equations', title: 'Solving equations', strand: 'a', tier: 'F', status: 'live', needs: ['algebra-basics', 'negative-numbers'], flip: 'Solving an equation, and building one from a number puzzle' },
  { id: 'pythagoras', title: "Pythagoras' theorem", strand: 'g', tier: 'F', status: 'live', needs: ['squares-roots', 'shapes-angles'], flip: 'Finding the long side, and finding a short side' },

  // What the pilot topics unlock (planned).
  { id: 'percentages', title: 'Percentages', strand: 'n', tier: 'F', status: 'planned', needs: ['fractions'], flip: 'Percentage increase, and reverse percentages' },
  { id: 'ratio', title: 'Ratio', strand: 'r', tier: 'F', status: 'planned', needs: ['fractions'], flip: 'Sharing in a ratio, and finding the total from one share' },
  { id: 'rearranging-formulae', title: 'Rearranging formulae', strand: 'a', tier: 'F', status: 'planned', needs: ['solving-equations'], flip: 'Substituting into a formula, and making a different letter the subject' },
  { id: 'simultaneous-equations', title: 'Simultaneous equations', strand: 'a', tier: 'F', status: 'planned', needs: ['solving-equations'], flip: 'Solving, and checking the answer in both equations' },
  { id: 'quadratic-equations', title: 'Quadratic equations', strand: 'a', tier: 'H', status: 'planned', needs: ['solving-equations', 'squares-roots'], flip: 'Factorising and expanding' },
  { id: 'trigonometry', title: 'Trigonometry', strand: 'g', tier: 'F', status: 'planned', needs: ['pythagoras', 'ratio'], flip: 'Finding a side, and finding an angle' },
  { id: 'percentage-change', title: 'Repeated percentage change', strand: 'r', tier: 'H', status: 'planned', needs: ['percentages'], flip: 'Growth and depreciation, and working back to the start' },
];
