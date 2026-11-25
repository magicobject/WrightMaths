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
  { path: '/books/a-level/integration-basics.html', titleContains: 'Integration as reverse differentiation', heading: /^Integration as reverse differentiation$/ },
];

export const ALEVEL_PAGES: BookPage[] = [...ALEVEL_HUB_PAGES, ...ALEVEL_TOPICS];
