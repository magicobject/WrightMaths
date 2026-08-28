# Wright Maths Tuition

Static site for Wright Maths Tuition, live at [wrightmaths.uk](https://wrightmaths.uk) (Cloudflare Workers, auto-deploys on push to `main`).

## Quick start

```bash
npm install       # also wires up the pre-commit hook — see below
npm run build     # generate public/*.html from templates/ + src/
npm run serve     # serve public/ locally at http://localhost:4173
npm test          # run the Playwright suite
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

## The pre-commit hook and the build number in the footer

Every page's footer shows a build number like `Build 2026.08.27.003` (format `yyyy.mm.dd.NNN`, where `NNN` counts commits made that day, stored in [build-number.json](build-number.json)).

This is maintained automatically, not by hand. `npm install` runs the `prepare` script, which points git at the tracked [.githooks/pre-commit](.githooks/pre-commit) hook. On every commit, that hook:

1. Runs [scripts/bump-build-number.mjs](scripts/bump-build-number.mjs), which increments today's counter in `build-number.json`.
2. Runs `npm run build`, regenerating every file in `public/` — including stamping the new build number into each footer and cache-busting `css/style.css?v=...`.
3. Stages the results (`git add public build-number.json`) so they're included in the commit you're about to make.

In other words: **you never bump the build number or rebuild `public/` yourself** — just edit source files under `src/`/`templates/` and commit as normal. If you ever see a commit whose diff is *only* a build-number/cache-bust change with none of your actual edits, that's the signal an edit was made directly to `public/` and got overwritten — go make the change in `src/pages/` instead.

## Tests

[Playwright](https://playwright.dev) specs in `test/` cover navigation state, the footer build-number format, 404 handling, and that each page renders its own title/heading/canonical URL (a regression guard — pages once served each other's content by mistake). `test/support/pages.ts` is the shared list of expected page metadata used across specs; add an entry there when adding a new page.

## Deployment

Push to `main` — Cloudflare picks up the change and deploys `public/` automatically. There's no separate deploy step to run locally.
