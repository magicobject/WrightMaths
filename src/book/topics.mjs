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
// words:  the 4 to 6 glossary ids shown in the "Words you need" strip at the top of a live topic

export const STRANDS = {
  n: { name: 'Number', short: 'Number' },
  a: { name: 'Algebra', short: 'Algebra' },
  r: { name: 'Ratio, proportion and rates of change', short: 'Ratio' },
  g: { name: 'Geometry and measures', short: 'Geometry' },
  p: { name: 'Probability', short: 'Probability' },
  s: { name: 'Statistics', short: 'Statistics' },
};

export const TOPICS = [
  // Base layer: the ideas everything else rests on. (the whole base layer is written.)
  { id: 'place-value', title: 'Place value', strand: 'n', tier: 'F', status: 'live', needs: [], flip: 'Reading a number and writing it down', words: ['digit', 'place-value', 'decimal', 'round', 'decimal-place', 'significant-figure'] },
  { id: 'four-operations', title: 'Add, subtract, multiply, divide', strand: 'n', tier: 'F', status: 'live', needs: ['place-value'], flip: 'Multiplying and dividing; adding and subtracting', words: ['sum', 'difference', 'product', 'quotient', 'divisor', 'remainder'] },
  { id: 'negative-numbers', title: 'Negative numbers', strand: 'n', tier: 'F', status: 'live', needs: ['four-operations'], flip: 'Adding a negative and subtracting a positive', words: ['negative-number', 'number-line', 'integer', 'difference'] },
  { id: 'order-of-operations', title: 'Order of operations', strand: 'n', tier: 'F', status: 'live', needs: ['four-operations'], flip: 'Building a calculation and unpicking it', words: ['bidmas', 'operation', 'power', 'square-root'] },
  { id: 'factors-multiples', title: 'Factors and multiples', strand: 'n', tier: 'F', status: 'live', needs: ['four-operations'], flip: 'Factors and multiples are two views of the same facts', words: ['factor', 'multiple', 'prime-number', 'composite-number', 'hcf', 'lcm'] },
  { id: 'squares-roots', title: 'Squares and square roots', strand: 'n', tier: 'F', status: 'live', needs: ['factors-multiples'], flip: 'Squaring and square-rooting', words: ['square-number', 'square-root', 'cube-number', 'cube-root', 'power', 'irrational'] },
  { id: 'shapes-angles', title: 'Shapes and angles', strand: 'g', tier: 'F', status: 'live', needs: ['four-operations'], flip: 'Finding an angle and building a shape from angles', words: ['angle', 'acute-angle', 'obtuse-angle', 'reflex-angle', 'parallel', 'polygon'] },
  { id: 'algebra-basics', title: 'Algebra basics', strand: 'a', tier: 'F', status: 'live', needs: ['order-of-operations', 'negative-numbers'], flip: 'Substituting numbers in, and writing a rule from numbers', words: ['unknown', 'expression', 'term', 'coefficient', 'like-terms', 'substitute'] },

  // Pilot topics: written and live in the pilot edition.
  { id: 'fractions', title: 'Fractions', strand: 'n', tier: 'F', status: 'live', needs: ['factors-multiples', 'four-operations'], flip: 'Finding a fraction of an amount, and finding the whole from a fraction of it', words: ['fraction', 'numerator', 'denominator', 'equivalent-fractions', 'simplify-fraction', 'common-denominator'] },
  { id: 'solving-equations', title: 'Solving equations', strand: 'a', tier: 'F', status: 'live', needs: ['algebra-basics', 'negative-numbers'], flip: 'Solving an equation, and building one from a number puzzle', words: ['equation', 'unknown', 'solve', 'inverse-operation', 'expand'] },
  { id: 'pythagoras', title: "Pythagoras' theorem", strand: 'g', tier: 'F', status: 'live', needs: ['squares-roots', 'shapes-angles'], flip: 'Finding the long side, and finding a short side', words: ['hypotenuse', 'right-angle', 'pythagoras-theorem', 'pythagorean-triple', 'converse', 'square-root'] },

  // What the pilot topics unlock (planned).
  { id: 'percentages', title: 'Percentages', strand: 'n', tier: 'F', status: 'live', needs: ['fractions'], flip: 'Percentage increase, and reverse percentages', words: ['percentage','multiplier','reverse-percentage','decimal'] },
  { id: 'ratio', title: 'Ratio', strand: 'r', tier: 'F', status: 'live', needs: ['fractions'], flip: 'Sharing in a ratio, and finding the total from one share', words: ['ratio','proportion','unitary-method','best-buy'] },
  { id: 'rearranging-formulae', title: 'Rearranging formulae', strand: 'a', tier: 'F', status: 'live', needs: ['solving-equations', 'fractions'], flip: 'Substituting into a formula, and making a different letter the subject', words: ['formula','subject','substitute','inverse-operation'] },
  { id: 'simultaneous-equations', title: 'Simultaneous equations', strand: 'a', tier: 'F', status: 'live', needs: ['solving-equations'], flip: 'Solving, and checking the answer in both equations', words: ['simultaneous-equations','elimination','substitute','unknown'] },
  { id: 'quadratic-equations', title: 'Quadratic equations', strand: 'a', tier: 'H', status: 'live', needs: ['solving-equations', 'squares-roots'], flip: 'Factorising and expanding', words: ['quadratic','expand','factorise','root-of-equation'] },
  { id: 'trigonometry', title: 'Trigonometry', strand: 'g', tier: 'F', status: 'live', needs: ['pythagoras', 'ratio', 'rearranging-formulae'], flip: 'Finding a side, and finding an angle', words: ['hypotenuse','opposite','adjacent','soh-cah-toa'] },
  { id: 'percentage-change', title: 'Repeated percentage change', strand: 'r', tier: 'H', status: 'live', needs: ['percentages'], flip: 'Growth and depreciation, and working back to the start', words: ['compound-interest','multiplier','depreciation','percentage-change'] },

  // Next up (planned): the topics that stand on the ones above.
  { id: 'area-perimeter', title: 'Area and perimeter', strand: 'g', tier: 'F', status: 'planned', needs: ['four-operations', 'shapes-angles'], flip: 'Finding an area, and finding a missing length from the area' },
  { id: 'indices', title: 'Powers and indices', strand: 'n', tier: 'F', status: 'planned', needs: ['squares-roots', 'order-of-operations'], flip: 'Multiplying powers, and taking them apart again' },
  { id: 'sequences', title: 'Sequences', strand: 'a', tier: 'F', status: 'planned', needs: ['algebra-basics', 'negative-numbers'], flip: 'Continuing a pattern, and writing the rule for it' },
  { id: 'coordinates-graphs', title: 'Coordinates and straight-line graphs', strand: 'a', tier: 'F', status: 'planned', needs: ['algebra-basics', 'negative-numbers'], flip: 'Plotting from an equation, and finding the equation from the line' },
  { id: 'probability-basics', title: 'Probability', strand: 'p', tier: 'F', status: 'planned', needs: ['fractions'], flip: 'The chance something happens, and the chance it does not' },
  { id: 'averages', title: 'Averages and spread', strand: 's', tier: 'F', status: 'planned', needs: ['four-operations'], flip: 'Finding the mean, and finding a missing value from the mean' },
  { id: 'surds', title: 'Surds', strand: 'n', tier: 'H', status: 'planned', needs: ['squares-roots', 'factors-multiples'], flip: 'Simplifying a surd, and writing a number under a root' },
  { id: 'circles', title: 'Circles', strand: 'g', tier: 'F', status: 'planned', needs: ['area-perimeter', 'squares-roots'], flip: 'Finding the circumference or area, and finding the radius from it' },
];
