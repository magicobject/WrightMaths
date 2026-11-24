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
  { id: 'area-perimeter', title: 'Area and perimeter', strand: 'g', tier: 'F', status: 'live', needs: ['four-operations', 'shapes-angles'], flip: 'Finding an area, and finding a missing length from the area', words: ['perimeter','area','volume','perpendicular-height'] },
  { id: 'indices', title: 'Powers and indices', strand: 'n', tier: 'F', status: 'live', needs: ['squares-roots', 'order-of-operations'], flip: 'Multiplying powers, and taking them apart again', words: ['power','base','indices-laws','standard-form'] },
  { id: 'sequences', title: 'Sequences', strand: 'a', tier: 'F', status: 'live', needs: ['algebra-basics', 'negative-numbers'], flip: 'Continuing a pattern, and writing the rule for it', words: ['sequence','nth-term','term-to-term-rule','common-difference'] },
  { id: 'coordinates-graphs', title: 'Coordinates and straight-line graphs', strand: 'a', tier: 'F', status: 'live', needs: ['algebra-basics', 'negative-numbers'], flip: 'Plotting from an equation, and finding the equation from the line', words: ['coordinates','gradient','y-intercept','midpoint'] },
  { id: 'probability-basics', title: 'Probability', strand: 'p', tier: 'F', status: 'live', needs: ['fractions'], flip: 'The chance something happens, and the chance it does not', words: ['probability','outcome','tree-diagram','independent-events'] },
  { id: 'averages', title: 'Averages and spread', strand: 's', tier: 'F', status: 'live', needs: ['four-operations'], flip: 'Finding the mean, and finding a missing value from the mean', words: ['mean','median','mode','range'] },
  { id: 'surds', title: 'Surds', strand: 'n', tier: 'H', status: 'live', needs: ['squares-roots', 'factors-multiples'], flip: 'Simplifying a surd, and writing a number under a root', words: ['surd','rational','rationalising','conjugate'] },
  { id: 'circles', title: 'Circles', strand: 'g', tier: 'F', status: 'live', needs: ['area-perimeter', 'squares-roots'], flip: 'Finding the circumference or area, and finding the radius from it', words: ['radius','diameter','circumference','pi'] },
  { id: 'inequalities', title: 'Inequalities', strand: 'a', tier: 'F', status: 'live', needs: ['solving-equations', 'coordinates-graphs', 'quadratic-equations'], flip: 'Solving an inequality, and showing it on a number line', words: ['inequality','number-line','integer','double-inequality'] },
  { id: 'direct-inverse-proportion', title: 'Direct and inverse proportion', strand: 'r', tier: 'F', status: 'live', needs: ['ratio', 'coordinates-graphs'], flip: 'Finding the rule from two values, and using the rule to find a missing value', words: ['direct-proportion','inverse-proportion','constant-of-proportionality','unitary-method'] },
  { id: 'similarity', title: 'Similar shapes', strand: 'g', tier: 'F', status: 'live', needs: ['ratio', 'shapes-angles'], flip: 'Scaling a shape up, and finding the scale factor from two shapes', words: ['similar-shapes','scale-factor','congruent','enlargement'] },
  { id: 'transformations', title: 'Transformations', strand: 'g', tier: 'F', status: 'live', needs: ['coordinates-graphs'], flip: 'Moving a shape, and describing the move from before and after', words: ['translation','reflection','rotation','enlargement'] },
  { id: 'vectors', title: 'Vectors', strand: 'g', tier: 'H', status: 'live', needs: ['coordinates-graphs', 'transformations'], flip: 'Writing a journey as a vector, and finding the journey from the vector', words: ['vector','column-vector','magnitude','scalar'] },
  { id: 'constructions-loci', title: 'Constructions and loci', strand: 'g', tier: 'F', status: 'live', needs: ['shapes-angles', 'circles'], flip: 'Drawing it accurately, and describing the shape from the rule', words: ['construction','locus','perpendicular-bisector','angle-bisector'] },
  { id: 'compound-measures', title: 'Speed, density and other compound measures', strand: 'r', tier: 'F', status: 'live', needs: ['ratio', 'rearranging-formulae'], flip: 'Finding the rate, and using the rate to find a distance, mass or time', words: ['speed','density','pressure','compound-measure'] },
  { id: 'bearings', title: 'Bearings', strand: 'g', tier: 'F', status: 'live', needs: ['shapes-angles', 'ratio', 'trigonometry'], flip: 'Finding a bearing, and using a bearing to find where you end up', words: ['bearing','back-bearing','compass-point'] },
  { id: 'sine-cosine-rules', title: 'Sine and cosine rules', strand: 'g', tier: 'H', status: 'live', needs: ['trigonometry', 'area-perimeter', 'bearings'], flip: 'Finding a side or angle in any triangle, and the area from two sides and the angle between', words: ['sine-rule','cosine-rule','included-angle','ambiguous-case'] },
  { id: 'circle-theorems', title: 'Circle theorems', strand: 'g', tier: 'H', status: 'live', needs: ['circles', 'shapes-angles'], flip: 'Using a theorem to find an angle, and giving the reason for it', words: ['angle-at-centre','cyclic-quadrilateral','tangent','angle-in-semicircle'] },
  { id: 'bounds', title: 'Bounds and error intervals', strand: 'n', tier: 'H', status: 'live', needs: ['place-value', 'four-operations', 'inequalities'], flip: 'Writing the limits of a rounded number, and finding the limits of a calculation', words: ['lower-bound','upper-bound','error-interval','truncation'] },
  { id: 'algebraic-fractions', title: 'Algebraic fractions', strand: 'a', tier: 'H', status: 'live', needs: ['fractions', 'quadratic-equations'], flip: 'Simplifying by factorising, and combining over a common denominator', words: ['algebraic-fraction','factorise','common-denominator','difference-of-two-squares'] },
  { id: 'iteration', title: 'Iteration', strand: 'a', tier: 'H', status: 'live', needs: ['rearranging-formulae', 'solving-equations'], flip: 'Repeating a rule to home in on a solution, and showing the solution lies in an interval', words: ['iteration','iterative-formula','root-of-equation','interval'] },
  { id: 'functions-graphs', title: 'Functions and graphs', strand: 'a', tier: 'H', status: 'live', needs: ['coordinates-graphs', 'quadratic-equations', 'transformations'], flip: 'Reading a graph from its equation, and finding the equation from the graph', words: ['function','parabola','turning-point','root-of-equation'] },
  { id: 'histograms-cumulative-frequency', title: 'Histograms, cumulative frequency and box plots', strand: 's', tier: 'H', status: 'live', needs: ['averages'], flip: 'Drawing the graph from a table, and reading a table back from the graph', words: ['cumulative-frequency','interquartile-range','box-plot','frequency-density'] },
  { id: 'conditional-probability', title: 'Conditional probability', strand: 'p', tier: 'H', status: 'live', needs: ['probability-basics'], flip: 'The chance of B given A, and the chance of A given B', words: ['conditional-probability','two-way-table','venn-diagram','independent-events'] },
];
