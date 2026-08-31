// Single source of truth for what each page in the main nav should look
// like. Used by both the nav-behaviour specs and the per-page content specs.
export interface SitePage {
  /** Path served by the static test server, e.g. "/about.html". */
  path: string;
  /** Visible text of this page's link in the main nav / footer. */
  navLabel: string;
  /** Substring expected in <title>. */
  titleContains: string;
  /** Text expected in the page's <h1>. */
  heading: RegExp;
}

export const PAGES: SitePage[] = [
  {
    path: '/index.html',
    navLabel: 'Home',
    titleContains: 'Maths Tuition in Leominster',
    heading: /builds real understanding/i,
  },
  {
    path: '/about.html',
    navLabel: 'About',
    titleContains: 'About Your Tutor',
    heading: /career in IT, teaching now/i,
  },
  {
    path: '/lessons.html',
    navLabel: 'Lessons',
    titleContains: 'Maths Lessons',
    heading: /Leominster tutor/i,
  },
  {
    path: '/safeguarding.html',
    navLabel: 'Safeguarding',
    titleContains: 'Safeguarding',
    heading: /safety comes first/i,
  },
  {
    path: '/resources.html',
    navLabel: 'Resources',
    titleContains: 'Free Maths Resources',
    heading: /best free maths resources/i,
  },
  {
    path: '/contact.html',
    navLabel: 'Contact',
    titleContains: 'Contact',
    heading: /no-obligation chat/i,
  },
];

// Not in the primary nav — deliberately unlinked from anywhere on the site
// (see CLAUDE.md's "Build numbers" section). Kept out of PAGES above so it
// never gets pulled into the nav-behaviour specs, which assume every entry
// there has a real nav link.
export const UPDATES_PAGE: SitePage = {
  path: '/updates.html',
  navLabel: 'Updates',
  titleContains: 'Site Updates',
  heading: /site updates/i,
};

// Every generated page, including the ones without a primary nav link —
// used by specs that should run against literally everything (footer,
// canonical URLs).
export const ALL_PAGES: SitePage[] = [...PAGES, UPDATES_PAGE];
