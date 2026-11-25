// The hidden GCSE book pilot. Kept out of pages.ts on purpose: these pages are
// not in the nav, not in the sitemap and not linked from anywhere, so the
// nav/footer/canonical specs that loop over ALL_PAGES must never include them.
export interface BookPage {
  path: string;
  titleContains: string;
  heading: RegExp;
}

export const BOOK_TOPICS: BookPage[] = [
  { path: '/books/gcse/order-of-operations.html', titleContains: 'Order of operations', heading: /^Order of operations$/ },
  { path: '/books/gcse/factors-multiples.html', titleContains: 'Factors and multiples', heading: /^Factors and multiples$/ },
  { path: '/books/gcse/squares-roots.html', titleContains: 'Squares and square roots', heading: /^Squares and square roots$/ },
  { path: '/books/gcse/shapes-angles.html', titleContains: 'Shapes and angles', heading: /^Shapes and angles$/ },
  { path: '/books/gcse/algebra-basics.html', titleContains: 'Algebra basics', heading: /^Algebra basics$/ },
  { path: '/books/gcse/place-value.html', titleContains: 'Place value', heading: /^Place value$/ },
  { path: '/books/gcse/four-operations.html', titleContains: 'Add, subtract', heading: /Add, subtract, multiply, divide/ },
  { path: '/books/gcse/negative-numbers.html', titleContains: 'Negative numbers', heading: /^Negative numbers$/ },
  { path: '/books/gcse/fractions.html', titleContains: 'Fractions', heading: /^Fractions$/ },
  { path: '/books/gcse/solving-equations.html', titleContains: 'Solving equations', heading: /^Solving equations$/ },
  { path: '/books/gcse/pythagoras.html', titleContains: 'Pythagoras', heading: /Pythagoras/ },
  { path: '/books/gcse/percentages.html', titleContains: 'Percentages', heading: /^Percentages$/ },
  { path: '/books/gcse/ratio.html', titleContains: 'Ratio', heading: /^Ratio$/ },
  { path: '/books/gcse/rearranging-formulae.html', titleContains: 'Rearranging formulae', heading: /^Rearranging formulae$/ },
  { path: '/books/gcse/simultaneous-equations.html', titleContains: 'Simultaneous equations', heading: /^Simultaneous equations$/ },
  { path: '/books/gcse/quadratic-equations.html', titleContains: 'Quadratic equations', heading: /^Quadratic equations$/ },
  { path: '/books/gcse/trigonometry.html', titleContains: 'Trigonometry', heading: /^Trigonometry$/ },
  { path: '/books/gcse/percentage-change.html', titleContains: 'Repeated percentage change', heading: /^Repeated percentage change$/ },
  { path: '/books/gcse/inequalities.html', titleContains: 'Inequalities', heading: /^Inequalities$/ },
  { path: '/books/gcse/bounds.html', titleContains: 'Bounds and error intervals', heading: /^Bounds\ and\ error\ intervals$/ },
  { path: '/books/gcse/direct-inverse-proportion.html', titleContains: 'Direct and inverse proportion', heading: /^Direct\ and\ inverse\ proportion$/ },
  { path: '/books/gcse/compound-measures.html', titleContains: 'Speed, density and other compound measures', heading: /^Speed,\ density\ and\ other\ compound\ measures$/ },
  { path: '/books/gcse/similarity.html', titleContains: 'Similar shapes', heading: /^Similar\ shapes$/ },
  { path: '/books/gcse/bearings.html', titleContains: 'Bearings', heading: /^Bearings$/ },
  { path: '/books/gcse/transformations.html', titleContains: 'Transformations', heading: /^Transformations$/ },
  { path: '/books/gcse/vectors.html', titleContains: 'Vectors', heading: /^Vectors$/ },
  { path: '/books/gcse/constructions-loci.html', titleContains: 'Constructions and loci', heading: /^Constructions\ and\ loci$/ },
  { path: '/books/gcse/circle-theorems.html', titleContains: 'Circle theorems', heading: /^Circle\ theorems$/ },
  { path: '/books/gcse/surds.html', titleContains: 'Surds', heading: /^Surds$/ },
  { path: '/books/gcse/algebraic-fractions.html', titleContains: 'Algebraic fractions', heading: /^Algebraic\ fractions$/ },
  { path: '/books/gcse/sine-cosine-rules.html', titleContains: 'Sine and cosine rules', heading: /^Sine\ and\ cosine\ rules$/ },
  { path: '/books/gcse/iteration.html', titleContains: 'Iteration', heading: /^Iteration$/ },
  { path: '/books/gcse/functions-graphs.html', titleContains: 'Functions and graphs', heading: /^Functions\ and\ graphs$/ },
  { path: '/books/gcse/conditional-probability.html', titleContains: 'Conditional probability', heading: /^Conditional\ probability$/ },
  { path: '/books/gcse/histograms-cumulative-frequency.html', titleContains: 'Histograms, cumulative frequency and box plots', heading: /^Histograms,\ cumulative\ frequency\ and\ box\ plots$/ },
  { path: '/books/gcse/area-perimeter.html', titleContains: 'Area and perimeter', heading: /^Area and perimeter$/ },
  { path: '/books/gcse/circles.html', titleContains: 'Circles', heading: /^Circles$/ },
  { path: '/books/gcse/probability-basics.html', titleContains: 'Probability', heading: /^Probability$/ },
  { path: '/books/gcse/averages.html', titleContains: 'Averages and spread', heading: /^Averages and spread$/ },
  { path: '/books/gcse/sequences.html', titleContains: 'Sequences', heading: /^Sequences$/ },
  { path: '/books/gcse/coordinates-graphs.html', titleContains: 'Coordinates and straight-line graphs', heading: /^Coordinates and straight-line graphs$/ },
  { path: '/books/gcse/indices.html', titleContains: 'Powers and indices', heading: /^Powers and indices$/ },
];

export const BOOK_PAGES: BookPage[] = [
  { path: '/books/gcse/', titleContains: 'GCSE Maths Book', heading: /built from the ground up/i },
  { path: '/books/gcse/glossary.html', titleContains: 'Glossary', heading: /language of maths/i },
  { path: '/books/gcse/diagnostic.html', titleContains: 'Find Your Gaps', heading: /Where should I start/ },
  { path: '/books/gcse/practice.html', titleContains: 'Mixed Practice', heading: /^Give me five$/ },
  { path: '/books/gcse/command-words.html', titleContains: 'Question Words', heading: /What the question is asking you to do/ },
  { path: '/books/gcse/route.html', titleContains: 'Study Routes', heading: /^Which route is for you\?$/ },
  { path: '/books/gcse/foundation.html', titleContains: 'Practice Papers for Grades 4 to 6', heading: /^Practice papers for grades 4 to 6$/ },
  { path: '/books/gcse/stretch.html', titleContains: 'Stretch Papers', heading: /^Stretch papers for grades 7, 8 and 9$/ },
  { path: '/books/gcse/teachers.html', titleContains: 'For Teachers', heading: /Using the book in a classroom/ },
  { path: '/books/gcse/parents.html', titleContains: 'Parents and Carers', heading: /guide for parents and carers/i },
  { path: '/books/gcse/how-to-use.html', titleContains: 'How to Use This Book', heading: /^How to use this book$/ },
  { path: '/books/gcse/raise-your-grade.html', titleContains: 'Raise Your Grade', heading: /move up a grade/i },
  ...BOOK_TOPICS,
];
