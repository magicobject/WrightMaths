// The non-topic pages of the A-level book (hidden pilot at /books/a-level/). Topic pages come from the graph in
// topics.mjs, not from this list. Like the GCSE book: noindex, not in the nav, the footer, the sitemap or robots.txt.

const TITLE_TAIL = 'A-level Maths Book (pilot) | Wright Maths Tuition';

export const ALEVEL_PAGES = [
  {
    slug: 'books/a-level/index',
    searchSections: false,
    searchWords: 'home hub contents pyramid map',
    book: 'hub',
    title: `A-level Pure Maths, Year 1 | ${TITLE_TAIL}`,
    description: 'An online A-level pure maths book. Year 1 first: every idea explained from both sides, every term defined, and large clear diagrams.',
    canonicalPath: 'books/a-level/',
  },
  {
    slug: 'books/a-level/glossary',
    searchWords: 'dictionary words definitions terms vocabulary notation',
    book: 'glossary',
    title: `Maths Glossary, Years 1 and 2 | ${TITLE_TAIL}`,
    description: 'Every term in A-level pure maths, Year 1 and Year 2, in plain English, with an example, a warning about common slips and the reverse side of the idea.',
  },
  {
    slug: 'books/a-level/how-to-use',
    searchWords: 'help guide instructions accessibility keyboard print notation arcsin',
    book: 'guide',
    title: `How to use this book | ${TITLE_TAIL}`,
    description: 'How the A-level book is laid out, how to use the hints, how your progress is saved on your own device, and how the maths is written.',
  },
];

// What each topic page gets in its title and description.
export const alevelTopicTitle = (t) => `${t.title} | ${TITLE_TAIL}`;
export const alevelTopicDescription = (t) => `A-level pure maths, Year ${t.year}: ${t.title}. Explanations, worked examples, large diagrams and check-your-knowledge questions with help when you are stuck.`;
export const alevelKeyTitle = (t) => `${t.title}: teacher answer key | ${TITLE_TAIL}`;
