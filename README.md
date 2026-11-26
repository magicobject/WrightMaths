# Wright Maths Tuition

Static site for Wright Maths Tuition, live at [wrightmaths.uk](https://wrightmaths.uk) (Cloudflare Workers, auto-deploys on push to `main`).

## Quick start

```bash
npm install       # also wires up the pre-commit hook — see below
npm run build     # generate public/*.html from templates/ + src/
npm run serve     # serve public/ locally at http://localhost:4173
npm test          # run the unit tests, then the Playwright suite
```

## How the build works

The six pages you see live (`index`, `about`, `lessons`, `safeguarding`, `resources`, `contact`) plus the `404` page are **not** written by hand as full HTML files. Each one is assembled from three pieces by [scripts/build.mjs](scripts/build.mjs):

1. **[templates/header.html](templates/header.html)**, **[templates/footer.html](templates/footer.html)**, **[templates/page.html](templates/page.html)** — the shared page shell (nav, footer, `<head>`, the LocalBusiness structured data) with `{{PLACEHOLDER}}` tokens.
2. **[src/pages/\*.html](src/pages)** — just the `<section>` content unique to each page. No `<head>`, no header, no footer — the build script wraps that around it.
3. **[src/pages.config.mjs](src/pages.config.mjs)** — the single source of truth for the main nav, and each page's `<title>`, meta description, and canonical/robots behaviour.

Running `npm run build` reads all three and writes the finished files into `public/`, which is what Cloudflare actually serves (`wrangler.json` points `assets.directory` at `./public`).

## What to edit, and what never to touch

| Want to change... | Edit this | Never edit this |
|---|---|---|
| Page content (wording, sections) | `src/pages/<page>.html` | `public/<page>.html` |
| Nav items, page title/description | `src/pages.config.mjs` | `public/<page>.html` |
| Header/footer, shared `<head>` | `templates/*.html` | `public/<page>.html` |
| Styling | `public/css/style.css` (this one genuinely lives in `public/` — it isn't generated) | — |
| Favicon, images | `public/img/*` (also not generated) | — |
| Redirects, robots, sitemap | `public/_headers`, `public/robots.txt`, `public/sitemap.xml` (hand-maintained, not generated) | — |

**`public/*.html` is a build artefact.** Every one of those files opens with an auto-generated `DO-NOT-EDIT` HTML comment banner for exactly this reason: a hand-edit made directly to a file in `public/` will be **silently overwritten** the next time anyone runs `npm run build` — which happens automatically on every commit (see below). This has bitten us for real: several commits in this repo's history changed nothing but the build number because the actual wording edit was made to `public/` instead of `src/pages/`.

If you're not sure whether a file in `public/` is generated or hand-maintained, check whether it has a same-named counterpart under `src/pages/` — if it does, it's generated.

## Building the site, and no build numbers

`public/*.html` (and the search indexes) are build artefacts and are **not committed**. `npm run build` makes them from `templates/` and `src/`; Cloudflare runs the same command on every deploy (`build.command` in [wrangler.json](wrangler.json)), and `npm test` builds first. Each build stamps one random token on the css and js links (`style.css?v=...`) so browsers fetch fresh files after a deploy. The token is made at build time and never committed, which keeps pull requests small.

There is no build number, pre-commit hook, release tag or `/updates` page any more: git history and each pull request's description are the changelog.

## Tests

[Playwright](https://playwright.dev) specs in `test/` cover navigation state, 404 handling, and that each page renders its own title/heading/canonical URL (a regression guard — pages once served each other's content by mistake). `test/support/pages.ts` is the shared list of expected page metadata used across specs; add an entry there when adding a new page.

Unit tests in `test-unit/` (Node's built-in runner, `npm run test:unit`) cover the vulnerability watch below and guard the GitHub Actions workflows (actions pinned to commit SHAs, explicit permissions). `npm test` runs them first.

## Vulnerability watch

[.github/workflows/vuln-watch.yml](.github/workflows/vuln-watch.yml) runs [scripts/vuln-watch.mjs](scripts/vuln-watch.mjs) every day at 06:17 UTC (and on demand). It checks every installed package against the GitHub Advisory Database (`npm audit`) and [OSV](https://osv.dev), opens one `security-advisory` issue per advisory, and fails the run — so GitHub emails the owner — on anything high or critical. It never changes code itself. Run `node scripts/vuln-watch.mjs --dry-run` to see what it would report without touching GitHub. [.github/dependabot.yml](.github/dependabot.yml) proposes npm and Actions updates weekly as PRs.

## Deployment

Push to `main` — Cloudflare picks up the change and deploys `public/` automatically. There's no separate deploy step to run locally.
