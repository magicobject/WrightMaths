// The hidden A-level book pilot (/books/a-level/). Like the GCSE book (book-pages.ts) it is kept out of
// pages.ts: not in the nav, the sitemap or robots.txt, and not linked from any other page.
import type { BookPage } from './book-pages';

export const ALEVEL_HUB_PAGES: BookPage[] = [
  { path: '/books/a-level/', titleContains: 'A-level Pure Maths, Year 1', heading: /^A-level Pure Maths, built from the ground up$/ },
  { path: '/books/a-level/glossary.html', titleContains: 'Maths Glossary, Years 1 and 2', heading: /^The language of A-level pure maths$/ },
  { path: '/books/a-level/how-to-use.html', titleContains: 'How to use this book', heading: /^How to use this book$/ },
];

// Live topic pages are added here as each one is released (and only then: a page in this list must exist).
export const ALEVEL_TOPICS: BookPage[] = [
  { path: '/books/a-level/indices-surds.html', titleContains: 'Indices and surds', heading: /^Indices and surds$/ },
  { path: '/books/a-level/integration-basics.html', titleContains: 'Integration as reverse differentiation', heading: /^Integration as reverse differentiation$/ },
  { path: '/books/a-level/differentiation-basics.html', titleContains: 'Differentiation from first principles', heading: /^Differentiation from first principles$/ },
  { path: '/books/a-level/quadratics.html', titleContains: 'Quadratics', heading: /^Quadratics$/ },
  { path: '/books/a-level/straight-lines.html', titleContains: 'Straight lines', heading: /^Straight lines$/ },
  { path: '/books/a-level/circles.html', titleContains: 'Circles', heading: /^Circles$/ },
  { path: '/books/a-level/simultaneous.html', titleContains: 'Simultaneous equations', heading: /^Simultaneous equations$/ },
  { path: '/books/a-level/inequalities.html', titleContains: 'Inequalities', heading: /^Inequalities$/ },
  { path: '/books/a-level/trig-triangles.html', titleContains: 'Trigonometry in triangles', heading: /^Trigonometry in triangles$/ },
];

export const ALEVEL_PAGES: BookPage[] = [...ALEVEL_HUB_PAGES, ...ALEVEL_TOPICS];
