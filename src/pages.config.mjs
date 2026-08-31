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
    slug: '404',
    title: 'Page Not Found | Wright Maths Tuition',
    description: "This page couldn't be found. Find your way back to Wright Maths Tuition's home, lessons, resources or contact page.",
    active: null,
    canonical: false,
    robots: 'noindex',
  },
];
