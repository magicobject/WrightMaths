// The page shell shared by every build script: header, footer, <head> extras and fonts around a page's content.
// scripts/build.mjs (the site and the GCSE book) and scripts/build-alevel.mjs (the A-level book) both use it,
// so a change to the header or footer is made once.

import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

// Links that already point somewhere absolute are left alone; site-relative
// ones get the page's base ("" for top-level pages, "../../" for a book).
const isAbsolute = (href) => /^(tel:|mailto:|https?:|#|\/)/.test(href);
export const withBase = (href, base) => (isAbsolute(href) ? href : `${base}${href}`);

// The cache-busting token on css/js links ("style.css?v=...") is made fresh each time the site is built and is never
// committed (public/*.html is not in git). WM_BUILD_ID pins it, for example to compare two builds.
let buildId;
export function readBuildId() {
  buildId ??= process.env.WM_BUILD_ID || randomBytes(4).toString('hex');
  return buildId;
}

export function loadShell(root) {
  const read = (path) => readFileSync(join(root, path), 'utf8');
  return {
    pageTemplate: read('templates/page.html'),
    headerTemplate: read('templates/header.html').trimEnd(),
    footerTemplate: read('templates/footer.html').trimEnd(),
    buildId: readBuildId(),
  };
}

/**
 * Wrap `content` in the site shell.
 * merged: the page's settings (base, active, cta, title, description, robots, canonical*, extraCss, extraBootScripts, extraModuleScripts, slug)
 * isBook: book pages load no third-party fonts and get a skip link and the book's search box.
 * searchBox: HTML for the header search box ('' when not a book page).
 */
export function renderShell({ shell, nav, merged, content, isBook, searchBox = '' }) {
  const { pageTemplate, headerTemplate, footerTemplate, buildId } = shell;
  const base = merged.base ?? '';
  const cta = merged.cta ?? { href: 'contact.html', text: 'Get in touch' };

  const renderNavItems = (activeHref) => nav.map(({ href, label }) => {
    const current = href === activeHref ? ' aria-current="page"' : '';
    return `        <li><a href="${withBase(href, base)}"${current}>${label}</a></li>`;
  }).join('\n');

  const footer = footerTemplate.replace('{{FOOTER_NAV_ITEMS}}', () =>
    nav.map(({ href, label }) => `        <li><a href="${withBase(href, base)}">${label}</a></li>`).join('\n'),
  );
  const header = headerTemplate
    .replace('{{NAV_ITEMS}}', () => renderNavItems(merged.active))
    .replace('{{CTA_HREF}}', () => withBase(cta.href, base))
    .replace('{{CTA_TEXT}}', () => cta.text)
    .replace('{{SEARCH}}', () => searchBox);

  let extraHead = '';
  if (merged.robots) extraHead += `<meta name="robots" content="${merged.robots}">\n`;
  if (merged.canonical !== false) {
    const canonicalPath = merged.canonicalPath ?? `${merged.slug}.html`;
    extraHead += `<link rel="canonical" href="https://wrightmaths.uk/${canonicalPath}">\n`;
  }
  for (const css of merged.extraCss ?? []) {
    extraHead += `<link rel="stylesheet" href="${base}${css}?v={{BUILD_ID}}">\n`;
  }
  for (const js of merged.extraBootScripts ?? []) {
    extraHead += `<script src="${base}${js}?v={{BUILD_ID}}"></script>\n`;
  }
  const extraScripts = (merged.extraModuleScripts ?? [])
    .map((js) => `\n<script type="module" src="${base}${js}?v={{BUILD_ID}}"></script>`)
    .join('');

  // Book pages load no third-party fonts: a child's IP address must not go to Google. They use the system font stack.
  const fonts = isBook ? '' : [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">',
    '',
  ].join('\n');
  const skip = isBook ? '<a class="skip-link" href="#main">Skip to the content</a>\n' : '';
  const body = isBook ? content.replace('<main class="book', '<main id="main" tabindex="-1" class="book') : content;

  return pageTemplate
    .replace('{{FONTS}}', () => fonts)
    .replace('{{SKIP}}', () => skip)
    .replace('{{TITLE}}', () => merged.title)
    .replace('{{DESCRIPTION}}', () => merged.description)
    .replace('{{EXTRA_HEAD}}', () => extraHead)
    .replace('{{HEADER}}', () => header)
    .replace('{{CONTENT}}', () => body)
    .replace('{{FOOTER}}', () => footer)
    .replace('{{EXTRA_SCRIPTS}}', () => extraScripts)
    .replaceAll('{{BASE}}', base)
    .replaceAll('{{BUILD_ID}}', buildId);
}
