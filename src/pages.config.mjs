// Single source of truth for the main nav and per-page <head> metadata.
// Edit this file (and src/pages/*.html for content) — public/*.html is generated
// by scripts/build.mjs and should not be hand-edited.

export const NAV = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'lessons.html', label: 'Lessons' },
  { href: 'safeguarding.html', label: 'Safeguarding' },
  { href: 'resources.html', label: 'Resources' },
  { href: 'contact.html', label: 'Contact' },
];

export const PAGES = [
  {
    slug: 'index',
    title: 'Maths Tuition in Leominster &amp; Online | Wright Maths Tuition',
    description: 'One-to-one maths tuition in Leominster and online, GCSE through to degree level. DBS-checked tutor with a maths degree, a PGCE and years of exam-board experience.',
    active: 'index.html',
  },
  {
    slug: 'about',
    title: 'About Your Tutor &amp; Enhanced DBS Check | Wright Maths Tuition, Leominster',
    description: 'Meet your maths tutor: BSc Maths (Manchester), MPhil Computational Chemistry (Aberystwyth), PGCE (Worcester), a career in IT, and an enhanced DBS check held for full peace of mind.',
    active: 'about.html',
  },
  {
    slug: 'lessons',
    title: 'Maths Lessons: GCSE, A Level, IB &amp; Beyond | Wright Maths Tuition, Leominster',
    description: "One-to-one maths lessons in Leominster and online. GCSE, A Level, IB Diploma and beyond, matched to exam board specification and each student's own gaps.",
    active: 'lessons.html',
  },
  {
    slug: 'safeguarding',
    title: 'Safeguarding &amp; Child Protection | Wright Maths Tuition, Leominster',
    description: 'How Wright Maths Tuition keeps students safe: Enhanced DBS check, parent access to every lesson, online session conduct, and what to do if you have a concern.',
    active: 'safeguarding.html',
  },
  {
    slug: 'resources',
    title: 'Free Maths Resources: GCSE, A Level, IB &amp; Beyond | Wright Maths Tuition',
    description: 'A curated list of the best free maths resources for GCSE, A Level, IB and university-level study, hand-picked by a Leominster-based maths tutor.',
    active: 'resources.html',
  },
  {
    slug: 'contact',
    title: 'Contact | Maths Tuition in Leominster &amp; Online — Wright Maths Tuition',
    description: 'Get in touch to arrange a free first chat about maths tuition in Leominster or online — GCSE, A Level, IB and beyond.',
    active: 'contact.html',
    cta: { href: 'tel:+447449301083', text: 'Call now' },
  },
  {
    slug: 'updates',
    title: 'Site Updates | Wright Maths Tuition',
    description: 'Internal build changelog for wrightmaths.uk — not linked from anywhere on the site.',
    active: null,
    robots: 'noindex',
  },
  {
    slug: 'books/index',
    title: 'Maths Books | Wright Maths Tuition',
    description: 'Free online maths books written by a tutor, starting with a GCSE maths book built from the ground up.',
    active: null,
    robots: 'noindex',
    canonicalPath: 'books/',
    base: '../', // this page lives one folder down, so its stylesheet and script are one level up
  },
  // ---- The GCSE book: hidden pilot at /books/gcse/ ----
  // Not in NAV, not in sitemap.xml, not linked from any other page, and
  // noindex. Topic pages are generated from src/book/topics.mjs, not listed here.
  {
    slug: 'books/gcse/index',
    book: 'hub',
    title: 'GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'A colourful, interactive GCSE maths book: every idea from both sides, every term explained, and help whenever you are stuck.',
    canonicalPath: 'books/gcse/',
  },
  {
    slug: 'books/gcse/glossary',
    book: 'glossary',
    title: 'Maths Glossary | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'Every mathematical term in the GCSE book, in plain English, with an example, a warning about common traps and the reverse side of the idea.',
  },
  {
    slug: 'books/gcse/diagnostic',
    book: 'diagnostic',
    title: 'Find Your Gaps | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'Eleven quick questions, one for each foundation topic, to show you which GCSE maths topic to start with and how far you have come.',
  },
  {
    slug: 'books/gcse/practice',
    book: 'practice',
    title: 'Mixed Practice | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'Five mixed questions at a time from across the GCSE book, favouring the ones you have not finished yet.',
  },
  {
    slug: 'books/gcse/command-words',
    book: 'commands',
    title: 'Question Words Explained | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'What work out, calculate, show that, explain and the other exam question words ask you to do, with a short example of each.',
  },
  {
    slug: 'books/gcse/stretch',
    book: 'stretch',
    title: 'Grade 7 to 9 Stretch Papers | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'Real-paper style questions for Higher tier students aiming at grades 7, 8 and 9, with calculator and non-calculator labels and a mark scheme you tick off yourself.',
  },
  {
    slug: 'books/gcse/foundation',
    book: 'foundation',
    title: 'Practice Papers for Grades 4 to 6 | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'Real-paper style questions for grades 4, 5 and 6, with calculator and non-calculator labels, a mark scheme you tick off yourself and a timed set.',
  },
  {
    slug: 'books/gcse/teachers',
    book: 'teachers',
    title: 'For Teachers | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'How to use the GCSE maths book in a classroom: printable worksheets, a teacher answer key for every topic, mark schemes, and what is stored.',
  },
  {
    slug: 'books/gcse/parents',
    book: 'parents',
    title: 'A Guide for Parents and Carers | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'How to help your child use the GCSE maths book: where to start, what to say when they are stuck, what is stored on their device, and what the grades mean.',
  },
  {
    slug: 'books/gcse/raise-your-grade',
    book: 'grades',
    title: 'How to Raise Your Grade | GCSE Maths Book (pilot) | Wright Maths Tuition',
    description: 'What changes at each step from grade 1 to grade 9, and the habits that move your results to the right.',
  },
  {
    slug: '404',
    title: 'Page Not Found | Wright Maths Tuition',
    description: "This page couldn't be found. Find your way back to Wright Maths Tuition's home, lessons, resources or contact page.",
    active: null,
    canonical: false,
    robots: 'noindex',
  },
];
