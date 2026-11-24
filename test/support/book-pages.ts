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
];

export const BOOK_PAGES: BookPage[] = [
  { path: '/books/gcse/', titleContains: 'GCSE Maths Book', heading: /built from the ground up/i },
  { path: '/books/gcse/glossary.html', titleContains: 'Glossary', heading: /language of maths/i },
  { path: '/books/gcse/diagnostic.html', titleContains: 'Find Your Gaps', heading: /Where should I start/ },
  { path: '/books/gcse/practice.html', titleContains: 'Mixed Practice', heading: /^Give me five$/ },
  { path: '/books/gcse/command-words.html', titleContains: 'Question Words', heading: /What the question is asking you to do/ },
  { path: '/books/gcse/raise-your-grade.html', titleContains: 'Raise Your Grade', heading: /shift your results to the right/i },
  ...BOOK_TOPICS,
];
