// The hidden GCSE book pilot. Kept out of pages.ts on purpose: these pages are
// not in the nav, not in the sitemap and not linked from anywhere, so the
// nav/footer/canonical specs that loop over ALL_PAGES must never include them.
export interface BookPage {
  path: string;
  titleContains: string;
  heading: RegExp;
}

export const BOOK_TOPICS: BookPage[] = [
  { path: '/books/gcse/place-value.html', titleContains: 'Place value', heading: /^Place value$/ },
  { path: '/books/gcse/four-operations.html', titleContains: 'Add, subtract', heading: /Add, subtract, multiply, divide/ },
  { path: '/books/gcse/negative-numbers.html', titleContains: 'Negative numbers', heading: /^Negative numbers$/ },
  { path: '/books/gcse/fractions.html', titleContains: 'Fractions', heading: /^Fractions$/ },
  { path: '/books/gcse/solving-equations.html', titleContains: 'Solving equations', heading: /^Solving equations$/ },
  { path: '/books/gcse/pythagoras.html', titleContains: 'Pythagoras', heading: /Pythagoras/ },
];

export const BOOK_PAGES: BookPage[] = [
  { path: '/books/gcse/', titleContains: 'GCSE Maths Book', heading: /built from the ground up/i },
  { path: '/books/gcse/glossary.html', titleContains: 'Glossary', heading: /language of maths/i },
  { path: '/books/gcse/raise-your-grade.html', titleContains: 'Raise Your Grade', heading: /shift your results to the right/i },
  ...BOOK_TOPICS,
];
