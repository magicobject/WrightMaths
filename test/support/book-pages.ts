// The GCSE book (public since 27 Nov 2026). Kept out of pages.ts on purpose: these pages
// are not in the main nav and have their own shell, so the nav/footer/canonical specs
// that loop over ALL_PAGES must never include them.
export interface BookPage {
  path: string;
  titleContains: string;
  heading: RegExp;
}

export const BOOK_TOPICS: BookPage[] = [
  { path: '/courses/gcse/order-of-operations.html', titleContains: 'Order of operations', heading: /^Order of operations$/ },
  { path: '/courses/gcse/factors-multiples.html', titleContains: 'Factors and multiples', heading: /^Factors and multiples$/ },
  { path: '/courses/gcse/squares-roots.html', titleContains: 'Squares and square roots', heading: /^Squares and square roots$/ },
  { path: '/courses/gcse/shapes-angles.html', titleContains: 'Shapes and angles', heading: /^Shapes and angles$/ },
  { path: '/courses/gcse/algebra-basics.html', titleContains: 'Algebra basics', heading: /^Algebra basics$/ },
  { path: '/courses/gcse/place-value.html', titleContains: 'Place value', heading: /^Place value$/ },
  { path: '/courses/gcse/four-operations.html', titleContains: 'Add, subtract', heading: /Add, subtract, multiply, divide/ },
  { path: '/courses/gcse/negative-numbers.html', titleContains: 'Negative numbers', heading: /^Negative numbers$/ },
  { path: '/courses/gcse/fractions.html', titleContains: 'Fractions', heading: /^Fractions$/ },
  { path: '/courses/gcse/solving-equations.html', titleContains: 'Solving equations', heading: /^Solving equations$/ },
  { path: '/courses/gcse/pythagoras.html', titleContains: 'Pythagoras', heading: /Pythagoras/ },
  { path: '/courses/gcse/percentages.html', titleContains: 'Percentages', heading: /^Percentages$/ },
  { path: '/courses/gcse/ratio.html', titleContains: 'Ratio', heading: /^Ratio$/ },
  { path: '/courses/gcse/rearranging-formulae.html', titleContains: 'Rearranging formulae', heading: /^Rearranging formulae$/ },
  { path: '/courses/gcse/simultaneous-equations.html', titleContains: 'Simultaneous equations', heading: /^Simultaneous equations$/ },
  { path: '/courses/gcse/quadratic-equations.html', titleContains: 'Quadratic equations', heading: /^Quadratic equations$/ },
  { path: '/courses/gcse/trigonometry.html', titleContains: 'Trigonometry', heading: /^Trigonometry$/ },
  { path: '/courses/gcse/percentage-change.html', titleContains: 'Repeated percentage change', heading: /^Repeated percentage change$/ },
  { path: '/courses/gcse/inequalities.html', titleContains: 'Inequalities', heading: /^Inequalities$/ },
  { path: '/courses/gcse/bounds.html', titleContains: 'Bounds and error intervals', heading: /^Bounds\ and\ error\ intervals$/ },
  { path: '/courses/gcse/direct-inverse-proportion.html', titleContains: 'Direct and inverse proportion', heading: /^Direct\ and\ inverse\ proportion$/ },
  { path: '/courses/gcse/compound-measures.html', titleContains: 'Speed, density and other compound measures', heading: /^Speed,\ density\ and\ other\ compound\ measures$/ },
  { path: '/courses/gcse/similarity.html', titleContains: 'Similar shapes', heading: /^Similar\ shapes$/ },
  { path: '/courses/gcse/bearings.html', titleContains: 'Bearings', heading: /^Bearings$/ },
  { path: '/courses/gcse/transformations.html', titleContains: 'Transformations', heading: /^Transformations$/ },
  { path: '/courses/gcse/vectors.html', titleContains: 'Vectors', heading: /^Vectors$/ },
  { path: '/courses/gcse/constructions-loci.html', titleContains: 'Constructions and loci', heading: /^Constructions\ and\ loci$/ },
  { path: '/courses/gcse/circle-theorems.html', titleContains: 'Circle theorems', heading: /^Circle\ theorems$/ },
  { path: '/courses/gcse/surds.html', titleContains: 'Surds', heading: /^Surds$/ },
  { path: '/courses/gcse/algebraic-fractions.html', titleContains: 'Algebraic fractions', heading: /^Algebraic\ fractions$/ },
  { path: '/courses/gcse/sine-cosine-rules.html', titleContains: 'Sine and cosine rules', heading: /^Sine\ and\ cosine\ rules$/ },
  { path: '/courses/gcse/iteration.html', titleContains: 'Iteration', heading: /^Iteration$/ },
  { path: '/courses/gcse/functions-graphs.html', titleContains: 'Functions and graphs', heading: /^Functions\ and\ graphs$/ },
  { path: '/courses/gcse/conditional-probability.html', titleContains: 'Conditional probability', heading: /^Conditional\ probability$/ },
  { path: '/courses/gcse/histograms-cumulative-frequency.html', titleContains: 'Histograms, cumulative frequency and box plots', heading: /^Histograms,\ cumulative\ frequency\ and\ box\ plots$/ },
  { path: '/courses/gcse/area-perimeter.html', titleContains: 'Area and perimeter', heading: /^Area and perimeter$/ },
  { path: '/courses/gcse/circles.html', titleContains: 'Circles', heading: /^Circles$/ },
  { path: '/courses/gcse/probability-basics.html', titleContains: 'Probability', heading: /^Probability$/ },
  { path: '/courses/gcse/averages.html', titleContains: 'Averages and spread', heading: /^Averages and spread$/ },
  { path: '/courses/gcse/sequences.html', titleContains: 'Sequences', heading: /^Sequences$/ },
  { path: '/courses/gcse/coordinates-graphs.html', titleContains: 'Coordinates and straight-line graphs', heading: /^Coordinates and straight-line graphs$/ },
  { path: '/courses/gcse/indices.html', titleContains: 'Powers and indices', heading: /^Powers and indices$/ },
];

export const BOOK_PAGES: BookPage[] = [
  { path: '/courses/gcse/', titleContains: 'GCSE Maths Book', heading: /built from the ground up/i },
  { path: '/courses/gcse/glossary.html', titleContains: 'Glossary', heading: /language of maths/i },
  { path: '/courses/gcse/diagnostic.html', titleContains: 'Find Your Gaps', heading: /Where should I start/ },
  { path: '/courses/gcse/practice.html', titleContains: 'Mixed Practice', heading: /^Give me five$/ },
  { path: '/courses/gcse/command-words.html', titleContains: 'Question Words', heading: /What the question is asking you to do/ },
  { path: '/courses/gcse/route.html', titleContains: 'Study Routes', heading: /^Which route is for you\?$/ },
  { path: '/courses/gcse/foundation.html', titleContains: 'Practice Papers for Grades 4 to 6', heading: /^Practice papers for grades 4 to 6$/ },
  { path: '/courses/gcse/stretch.html', titleContains: 'Stretch Papers', heading: /^Stretch papers for grades 7, 8 and 9$/ },
  { path: '/courses/gcse/teachers.html', titleContains: 'For Teachers', heading: /Using the book in a classroom/ },
  { path: '/courses/gcse/parents.html', titleContains: 'Parents and Carers', heading: /guide for parents and carers/i },
  { path: '/courses/gcse/how-to-use.html', titleContains: 'How to Use This Book', heading: /^How to use this book$/ },
  { path: '/courses/gcse/raise-your-grade.html', titleContains: 'Raise Your Grade', heading: /move up a grade/i },
  ...BOOK_TOPICS,
];
