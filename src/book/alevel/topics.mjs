// Single source of truth for the A-level book's topic graph (see docs/alevel-pure-syllabus.md, section 4).
//
// Same rules as src/book/topics.mjs: each topic declares what it needs (`needs`); "unlocks" and the layer are
// DERIVED by scripts/book-lib.mjs, never written by hand. The build fails on an unknown prerequisite, a cycle,
// a live topic with no page, or a planned topic that already has one.
//
// status: 'live'    = has a page in src/pages/courses/a-level/<id>.html
//         'planned' = shown greyed on the pyramid with "coming soon", no page yet
// year:   1 = Year 1 (AS and first year), 2 = Year 2 (A-level only). The split follows the DfE content.
// flip:   the reverse side of this topic (plain text, shown on the page and the map)
// words:  the glossary ids shown in the "Words you need" strip at the top of a live topic

export const STRANDS = {
  'al-proof': { name: 'Proof', short: 'Proof' },
  'al-algebra': { name: 'Algebra and functions', short: 'Algebra and functions' },
  'al-coordinate': { name: 'Coordinate geometry', short: 'Coordinate geometry' },
  'al-sequences': { name: 'Sequences and series', short: 'Sequences and series' },
  'al-trigonometry': { name: 'Trigonometry', short: 'Trigonometry' },
  'al-exponentials': { name: 'Exponentials and logarithms', short: 'Exponentials and logs' },
  'al-differentiation': { name: 'Differentiation', short: 'Differentiation' },
  'al-integration': { name: 'Integration', short: 'Integration' },
  'al-numerical': { name: 'Numerical methods', short: 'Numerical methods' },
  'al-vectors': { name: 'Vectors', short: 'Vectors' },
};

const t = (id, title, strand, year, needs, flip, extra = {}) => ({ id, title, strand: `al-${strand}`, year, tier: 'F', status: 'planned', needs, flip, words: [], ...extra });

export const TOPICS = [
  // Proof
  t('proof-methods', 'Proof: direct, exhaustion, counterexample', 'proof', 1, [], 'Proving a statement is always true, and finding one example that shows it is false', { aka: 'proof prove deduction exhaustion counterexample disprove implies if and only if therefore even odd consecutive integers', status: 'live', words: ['statement', 'proof', 'proof-by-deduction', 'proof-by-exhaustion', 'counterexample', 'implies', 'if-and-only-if', 'therefore', 'converse', 'even-number', 'odd-number', 'consecutive-integers', 'multiple', 'square-number', 'completing-the-square', 'set-notation', 'element-of', 'union', 'intersection', 'empty-set'] }),
  t('proof-contradiction', 'Proof by contradiction', 'proof', 2, ['proof-methods'], 'Assuming the opposite and showing that it cannot be true'),

  // Algebra and functions
  t('indices-surds', 'Indices and surds', 'algebra', 1, [], 'Writing a root as a power, and a power as a root', { aka: 'powers roots surds rationalise denominator fractional index negative index exact', status: 'live', words: ['index', 'laws-of-indices', 'negative-index', 'fractional-index', 'surd', 'like-surds', 'rationalise-denominator', 'conjugate-surd'] }),
  t('quadratics', 'Quadratics', 'algebra', 1, ['indices-surds'], 'Solving a quadratic, and building a quadratic from its solutions', { aka: 'quadratic equation completing the square discriminant factorise formula', status: 'live', words: ['quadratic', 'root', 'completing-the-square', 'quadratic-formula', 'discriminant', 'vertex'] }),
  t('simultaneous', 'Simultaneous equations', 'algebra', 1, ['quadratics'], 'Solving two equations together, and seeing where two graphs cross', { aka: 'simultaneous linear quadratic substitution elimination intersection graphs meet tangent', status: 'live', words: ['simultaneous-equations', 'linear-equation', 'substitution', 'elimination', 'point-of-intersection', 'discriminant', 'tangent'] }),
  t('inequalities', 'Inequalities', 'algebra', 1, ['quadratics', 'straight-lines'], 'Solving an inequality, and shading the region it describes', { aka: 'inequality interval notation set notation number line region shading quadratic inequality critical values', status: 'live', words: ['inequality', 'strict-inequality', 'interval', 'interval-notation', 'set-notation', 'union', 'intersection', 'critical-values', 'region', 'boundary', 'discriminant'] }),
  t('polynomials', 'Polynomials and the factor theorem', 'algebra', 1, ['quadratics'], 'Dividing to find a factor, and multiplying factors back into a polynomial', { aka: 'polynomial factor theorem remainder theorem algebraic division long division cubic factorise solve root coefficient quotient remainder', status: 'live', words: ['polynomial', 'coefficient', 'degree', 'constant-term', 'cubic', 'quartic', 'polynomial-division', 'quotient', 'remainder', 'factor-theorem', 'remainder-theorem', 'root', 'repeated-root', 'discriminant'] }),
  t('graphs-polynomials', 'Graphs of polynomials and reciprocals', 'algebra', 1, ['polynomials'], 'Reading roots from a graph, and sketching a graph from its equation', { aka: 'sketch cubic quartic reciprocal asymptote roots repeated root touch cross end behaviour y-intercept intersection graphs meet a over x proportion proportional direct inverse k square root', status: 'live', words: ['sketch', 'end-behaviour', 'leading-term', 'multiplicity', 'repeated-root', 'root', 'cubic', 'quartic', 'y-intercept', 'asymptote', 'reciprocal-graph', 'branch', 'inversely-proportional', 'point-of-intersection', 'point-of-inflection', 'proportional'] }),
  t('graph-transformations', 'Transformations of graphs', 'algebra', 1, ['graphs-polynomials'], 'Moving a graph, and finding the equation of the moved graph'),
  t('functions', 'Functions', 'algebra', 2, ['graph-transformations'], 'Applying a function, and undoing it with its inverse'),
  t('modulus', 'The modulus function', 'algebra', 2, ['functions', 'inequalities'], 'Distance from zero, and distance from any number'),
  t('algebraic-fractions', 'Algebraic fractions and partial fractions', 'algebra', 2, ['polynomials'], 'Combining fractions into one, and splitting one into partial fractions'),

  // Coordinate geometry
  t('straight-lines', 'Straight lines', 'coordinate', 1, [], 'Finding an equation from a graph, and drawing a graph from an equation', { aka: 'gradient intercept y=mx+c parallel perpendicular midpoint distance equation of a line', status: 'live', words: ['gradient', 'y-intercept', 'x-intercept', 'equation-of-a-line', 'point-gradient-form', 'general-form-of-a-line', 'parallel-lines', 'perpendicular', 'negative-reciprocal', 'line-segment', 'midpoint', 'distance', 'perpendicular-bisector', 'linear-model'] }),
  t('circles', 'Circles', 'coordinate', 1, ['straight-lines', 'quadratics'], 'From a centre and a radius to an equation, and from an equation back to a centre and a radius', { aka: 'circle equation centre radius tangent normal chord semicircle discriminant circumcircle', status: 'live', words: ['circle', 'centre', 'radius', 'diameter', 'chord', 'tangent', 'normal', 'point-of-contact', 'circle-equation', 'circle-general-form', 'angle-in-semicircle', 'chord-bisector-property', 'tangent-radius-property', 'line-circle-intersection', 'circumcircle', 'circles-meet'] }),
  t('parametric', 'Parametric equations', 'coordinate', 2, ['functions', 'trig-identities'], 'From a parameter to a point, and from the points back to a single equation'),

  // Sequences and series
  t('binomial-positive', 'Binomial expansion (positive whole-number powers)', 'sequences', 1, ['indices-surds'], 'Expanding a bracket raised to a power, and spotting which bracket an expansion came from', { aka: 'binomial expansion pascals triangle nCr factorial coefficient general term approximation expand bracket power', status: 'live', words: ['binomial', 'factorial', 'ncr', 'pascals-triangle', 'binomial-expansion', 'general-term', 'ascending-powers', 'coefficient', 'constant-term'] }),
  t('sequences', 'Sequences and recurrence relations', 'sequences', 2, ['functions'], 'Finding terms from a rule, and finding the rule from terms'),
  t('series-arithmetic', 'Arithmetic sequences and series', 'sequences', 2, ['sequences'], 'Adding up equal steps, and finding how many steps are needed'),
  t('series-geometric', 'Geometric sequences and series', 'sequences', 2, ['sequences', 'indices-surds'], 'Adding up repeated multiplying, and finding when the total stops growing'),
  t('binomial-general', 'Binomial expansion (fractional and negative powers)', 'sequences', 2, ['binomial-positive', 'algebraic-fractions'], 'Expanding with a fractional or negative power, and knowing when the expansion works'),

  // Trigonometry
  t('trig-triangles', 'Trigonometry in triangles', 'trigonometry', 1, [], 'Finding a missing length or angle, and choosing the right rule', { aka: 'sine rule cosine rule area of a triangle ambiguous case bearings triangle missing side angle', status: 'live', words: ['sine', 'cosine', 'included-angle', 'sine-rule', 'cosine-rule', 'area-of-triangle-sine', 'ambiguous-case', 'bearing'] }),
  t('trig-graphs', 'Trigonometric graphs and exact values', 'trigonometry', 1, ['trig-triangles'], 'Reading values from a graph, and drawing a graph from values'),
  t('trig-identities', 'Trigonometric identities and equations', 'trigonometry', 1, ['trig-graphs', 'quadratics'], 'Solving an equation for the angle, and showing that two expressions are the same'),
  t('radians', 'Radians, arcs and sectors', 'trigonometry', 2, ['trig-graphs'], 'Measuring an angle in degrees, and measuring it in radians'),
  t('trig-reciprocal-inverse', 'Reciprocal and inverse trigonometric functions', 'trigonometry', 2, ['functions', 'trig-identities'], 'A function and its reciprocal, and a function and its inverse'),
  t('trig-compound', 'Addition formulae, double angles and the R-form', 'trigonometry', 2, ['trig-reciprocal-inverse'], 'Splitting an angle sum, and combining a sum into one wave'),

  // Exponentials and logarithms
  t('exponentials-logs', 'Exponentials and logarithms', 'exponentials', 1, ['indices-surds'], 'Raising a number to a power, and taking a logarithm to get the power back', { aka: 'exponential logarithm log ln e to the x natural logarithm laws of logarithms solving a to the x take logs inverse', status: 'live', words: ['exponential-function', 'base-number', 'euler-number', 'natural-exponential', 'asymptote', 'logarithm', 'natural-logarithm', 'common-logarithm', 'log-argument', 'log-exp-inverse', 'log-product-law', 'log-quotient-law', 'log-power-law', 'taking-logs', 'exponential-equation', 'log-graph', 'increasing-function'] }),
  t('exp-modelling', 'Exponential modelling', 'exponentials', 1, ['exponentials-logs', 'straight-lines'], 'Predicting from a model, and finding the model from data'),

  // Differentiation
  t('differentiation-basics', 'Differentiation from first principles', 'differentiation', 1, ['graph-transformations', 'indices-surds'], 'From a curve to its gradient, and from a gradient back to the curve', { status: 'live', words: ['gradient-of-curve', 'chord-of-curve', 'limit', 'first-principles', 'derivative', 'power-rule'] }),
  t('differentiation-applications', 'Tangents, normals and stationary points', 'differentiation', 1, ['differentiation-basics', 'straight-lines'], 'Finding where the gradient is zero, and deciding whether that point is a top, a bottom or neither'),
  t('differentiation-standard', 'Differentiating standard functions', 'differentiation', 2, ['differentiation-basics', 'exponentials-logs', 'trig-compound', 'radians'], 'Differentiating a function, and recognising what was differentiated'),
  t('differentiation-rules', 'The chain, product, quotient and inverse rules', 'differentiation', 2, ['differentiation-standard'], 'Taking a function apart to differentiate it, and building it back up'),
  t('differentiation-implicit-param', 'Implicit and parametric differentiation', 'differentiation', 2, ['differentiation-rules', 'parametric'], 'A curve given by one equation, and a curve drawn by a moving point'),
  t('curve-sketching', 'Convexity and points of inflection', 'differentiation', 2, ['differentiation-rules'], 'Reading the shape from the derivatives, and the derivatives from the shape'),

  // Integration
  t('integration-basics', 'Integration as reverse differentiation', 'integration', 1, ['differentiation-basics'], 'Differentiating and integrating undo each other', { status: 'live', words: ['integrate', 'antiderivative', 'constant-of-integration', 'integrand', 'with-respect-to', 'integrate-powers'] }),
  t('definite-integrals', 'Definite integrals and area', 'integration', 1, ['integration-basics'], 'Finding an area from an integral, and an integral from an area'),
  t('area-between-curves', 'Area between curves and integration as a limit', 'integration', 2, ['definite-integrals'], 'The upper curve minus the lower curve, and the area it encloses'),
  t('integration-standard', 'Integrating standard functions', 'integration', 2, ['integration-basics', 'differentiation-standard'], 'Integrating a standard function, and checking by differentiating'),
  t('integration-substitution', 'Integration by substitution', 'integration', 2, ['integration-standard', 'differentiation-rules'], 'Changing the variable, and changing it back'),
  t('integration-parts', 'Integration by parts', 'integration', 2, ['integration-standard', 'differentiation-rules'], 'Splitting a product, and handing one part to the other'),
  t('integration-fractions', 'Integrating with partial fractions', 'integration', 2, ['integration-standard', 'algebraic-fractions'], 'Splitting a fraction, and integrating each piece'),
  t('differential-equations', 'First-order differential equations', 'integration', 2, ['integration-substitution', 'exp-modelling'], 'From a rate of change to a formula, and from a formula back to its rate of change'),

  // Numerical methods
  t('roots-change-of-sign', 'Locating roots', 'numerical', 2, ['functions'], 'A change of sign shows a root is there, and a root is not always a change of sign'),
  t('iteration', 'Iterative methods and Newton-Raphson', 'numerical', 2, ['roots-change-of-sign', 'differentiation-standard', 'sequences'], 'Repeating a rule to home in on a root'),
  t('trapezium-rule', 'The trapezium rule', 'numerical', 2, ['definite-integrals'], 'Estimating an area, and deciding whether the estimate is too big or too small'),

  // Vectors
  t('vectors-2d', 'Vectors in two dimensions', 'vectors', 1, [], 'A vector as a journey, and a vector as an arrow', { aka: 'vector column vector i j notation magnitude direction unit vector position vector triangle law parallelogram law collinear parallel ratio proof', status: 'live', words: ['vector', 'scalar', 'vector-notation', 'column-vector', 'component', 'i-j-notation', 'unit-vector', 'magnitude', 'direction-of-a-vector', 'vector-addition', 'parallelogram-law', 'vector-subtraction', 'negative-vector', 'scalar-multiple', 'parallel-vectors', 'position-vector', 'collinear', 'dividing-in-a-ratio', 'vector-proof'] }),
  t('vectors-3d', 'Vectors in three dimensions', 'vectors', 2, ['vectors-2d'], 'Moving in three directions at once'),
];
