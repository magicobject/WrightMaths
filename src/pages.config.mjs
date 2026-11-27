// Single source of truth for the main nav and per-page <head> metadata.
// Edit this file (and src/pages/*.html for content) — public/*.html is generated
// by scripts/build.mjs and should not be hand-edited.

export const NAV = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'lessons.html', label: 'Lessons' },
  { href: 'safeguarding.html', label: 'Safeguarding' },
  { href: 'resources.html', label: 'Resources' },
  { href: 'books/', label: 'Books' },
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
    slug: 'books/index',
    title: 'Maths Books | Wright Maths Tuition',
    description: 'Free online maths books written by a tutor, starting with a GCSE maths book built from the ground up.',
    active: 'books/',
    canonicalPath: 'books/',
    base: '../', // this page lives one folder down, so its stylesheet and script are one level up
  },
  // ---- The GCSE book at /books/gcse/ (public since 27 Nov 2026) ----
  // Linked from the Books page and listed in sitemap.xml. Its answer keys stay noindex.
  // Topic pages are generated from src/book/topics.mjs, not listed here.
  {
    slug: 'books/gcse/index',
    searchSections: false,
    searchWords: 'home hub contents pyramid map',
    book: 'hub',
    title: 'GCSE Maths Book | Wright Maths Tuition',
    description: 'A colourful, interactive GCSE maths book: every idea from both sides, every term explained, and help whenever you are stuck.',
    canonicalPath: 'books/gcse/',
  },
  {
    slug: 'books/gcse/audio-review',
    title: 'Listen Recordings Review | Wright Maths Tuition',
    description: 'Private working page for listening to the GCSE book recordings and flagging any that sound wrong. Not linked from anywhere.',
    active: null,
    base: '../../',
    robots: 'noindex, nofollow',
    extraCss: ['css/audio-review.css'],
    extraModuleScripts: ['js/audio-review.mjs'],
  },
  {
    slug: 'books/gcse/glossary',
    searchWords: 'dictionary words definitions terms vocabulary',
    book: 'glossary',
    title: 'Maths Glossary | GCSE Maths Book | Wright Maths Tuition',
    description: 'Every mathematical term in the GCSE book, in plain English, with an example, a warning about common traps and the reverse side of the idea.',
  },
  {
    slug: 'books/gcse/diagnostic',
    searchWords: 'quiz test gaps where to start where do i start',
    book: 'diagnostic',
    title: 'Find Your Gaps | GCSE Maths Book | Wright Maths Tuition',
    description: 'Eleven quick questions, one for each foundation topic, to show you which GCSE maths topic to start with and how far you have come.',
  },
  {
    slug: 'books/gcse/practice',
    searchWords: 'mixed questions revision',
    book: 'practice',
    title: 'Mixed Practice | GCSE Maths Book | Wright Maths Tuition',
    description: 'Five mixed questions at a time from across the GCSE book, favouring the ones you have not finished yet.',
  },
  {
    slug: 'books/gcse/command-words',
    searchWords: 'command words question words exam',
    book: 'commands',
    title: 'Question Words Explained | GCSE Maths Book | Wright Maths Tuition',
    description: 'What work out, calculate, show that, explain and the other exam question words ask you to do, with a short example of each.',
  },
  {
    slug: 'books/gcse/stretch',
    searchWords: 'higher tier grade 9 harder papers',
    book: 'stretch',
    title: 'Grade 7 to 9 Stretch Papers | GCSE Maths Book | Wright Maths Tuition',
    description: 'Real-paper style questions for Higher tier students aiming at grades 7, 8 and 9, with calculator and non-calculator labels and a mark scheme you tick off yourself.',
  },
  {
    slug: 'books/gcse/route',
    searchWords: 'plan timetable weeks revision schedule',
    book: 'route',
    title: 'Study Routes | GCSE Maths Book | Wright Maths Tuition',
    description: 'Week-by-week routes through the GCSE maths book: a resit to grade 4, the whole book in 12 weeks, a short route for a few weak topics, and a grade 7 to 9 top-up.',
  },
  {
    slug: 'books/gcse/foundation',
    searchWords: 'foundation tier practice papers exam timed',
    book: 'foundation',
    title: 'Practice Papers for Grades 4 to 6 | GCSE Maths Book | Wright Maths Tuition',
    description: 'Real-paper style questions for grades 4, 5 and 6, with calculator and non-calculator labels, a mark scheme you tick off yourself and a timed set.',
  },
  {
    slug: 'books/gcse/teachers',
    searchWords: 'teacher answer key answers mark scheme classroom worksheet printable',
    book: 'teachers',
    title: 'For Teachers | GCSE Maths Book | Wright Maths Tuition',
    description: 'How to use the GCSE maths book in a classroom: printable worksheets, a teacher answer key for every topic, mark schemes, and what is stored.',
  },
  {
    slug: 'books/gcse/parents',
    searchSections: false,
    searchWords: 'parent carer help child',
    book: 'parents',
    title: 'A Guide for Parents and Carers | GCSE Maths Book | Wright Maths Tuition',
    description: 'How to help your child use the GCSE maths book: where to start, what to say when they are stuck, what is stored on their device, and what the grades mean.',
  },
  {
    slug: 'books/gcse/how-to-use',
    searchWords: 'help listen accessibility dyslexia screen reader typing sqrt pi print homework words',
    book: 'how-to-use',
    title: 'How to Use This Book | GCSE Maths Book | Wright Maths Tuition',
    description: 'Plain-English help for the GCSE maths book: the Listen button and reading options, how to type answers, getting clues, timed sets, printing and the everyday words in questions.',
  },
  {
    slug: 'books/gcse/raise-your-grade',
    searchWords: 'grades improve marks method',
    book: 'grades',
    title: 'How to Raise Your Grade | GCSE Maths Book | Wright Maths Tuition',
    description: 'What changes at each step from grade 1 to grade 9, and the habits that move your results to the right.',
  },
  {
    slug: '404',
    base: '/', // served at any depth (e.g. /books/gcse/bad), so links and assets must be root-absolute
    title: 'Page Not Found | Wright Maths Tuition',
    description: "This page couldn't be found. Find your way back to Wright Maths Tuition's home, lessons, resources or contact page.",
    active: null,
    canonical: false,
    robots: 'noindex',
  },
];
