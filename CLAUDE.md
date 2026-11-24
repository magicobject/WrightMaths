# Standing instructions for this repo

These apply to every change here, not just when explicitly asked for.

## Before any push to origin
- Run `npm test` (Playwright suite) and `npm audit --omit=dev`. Fix real findings — don't suppress, downgrade, or skip them to get a push out.
- Whenever the whole suite (`npm test`) is run, report the number of tests run and the time taken, prefixed with this repo's name (e.g. "WrightMaths: 28 tests passed in 8.7s") — the count and duration are in Playwright's own summary line, the name prefix makes it scannable when work spans multiple sites in one session — a quick way to notice a regression in either coverage or speed, in the right project.

## Accessibility
- This repo doesn't have an axe-core accessibility suite yet (unlike its sibling sites — see kington-parishes, kingtonfoodbank, MediaWright for the pattern: `@axe-core/playwright` in `test/accessibility.spec.ts`, driven by `test/support/pages.ts`). If accessibility work comes up here, set that up first rather than fixing issues ad hoc, so there's a regression test afterwards.
- Any new heading needs to fit the existing outline (no skipped levels — h1 → h2 → h3, not h1 → h3).
- Any new text/background color pairing must clear WCAG AA contrast (4.5:1 for normal text, 3:1 for large text/UI components) — compute it (relative luminance), don't eyeball it.
- Every `<iframe>` needs a `title`; `aria-label` only belongs on elements with an ARIA role, never a bare `<div>`.

## Security
- Keep `npm audit --omit=dev` clean (no unresolved high/critical) before any push.
- Don't add third-party scripts, trackers, or embeds without checking what they contribute to CSP/privacy first.

## Build pipeline
- `public/*.html` is generated from `templates/*.html` + `src/pages/*.html` + `src/pages.config.mjs` by `scripts/build.mjs` — never hand-edit it, edit the source and run `npm run build`.
- `public/css/style.css` is the one thing in `public/` that's hand-maintained, not generated.
- The pre-commit hook bumps the build number and regenerates `public/` automatically on every commit — never do either by hand.

## Build numbers: tag every commit, and log it on /updates.html
The pre-commit hook bumps `build-number.json` on every commit (same date → counter +1; new date → counter resets to 1). Two more things go with that, both driven by the *same* build number:
1. **Before committing**, work out what the new build number will be (read `build-number.json`, apply the same same-date/new-date rule above) and add a new entry at the *top* of the changelog in `src/pages/updates.html` — that build number, today's date, and a one-line summary of the change. Newest entry first. Include this file in the commit like any other source change.
2. **After committing**, tag it with that same build number and push the tag: `git tag build-<date>.<NNN>` (e.g. `build-2026.08.31.007`, matching the footer's "Build 2026.08.31.007" text exactly), then `git push origin build-<date>.<NNN>`.

`/updates.html` is a real, reachable page — it's just not linked from anywhere on the site (not in the nav, not the footer, not any sitemap), and is marked `robots: noindex` in `src/pages.config.mjs` for exactly that reason. It's a build log for whoever knows the URL, not user-facing content.

## Data kept in sync by hand
Unlike kington-parishes/kingtonfoodbank, this repo has no `site.config.mjs` centralizing contact details — phone (`+447449301083` / `07449 301083`) and email (`info@wrightmaths.uk`) are hardcoded independently in three places: `templates/footer.html`, `src/pages/contact.html`, and the JSON-LD `ProfessionalService` block in `templates/page.html`. Nothing tests that they agree. Change one, change all three.

## The GCSE book (hidden pilot at `/books/gcse/`)
A colourful, interactive online GCSE maths textbook, built from the same source for a later print edition. Read `docs/book-authoring.md` before adding a topic or a term; the plan is `docs/textbook-plan.md`.
- **Hidden on purpose.** Not in the nav, the footer, `sitemap.xml` or `robots.txt`, and no other page links to it; every book page is `noindex`. `test/book.spec.ts` fails if any existing page, the sitemap or robots mentions it. Don't link it until Greg says.
- **Topic graph and glossary are single sources.** `src/book/topics.mjs` (what each topic `needs`; layer and unlocks are derived) and `src/book/glossary.mjs`. The build fails on an unknown prerequisite, a cycle, an unknown `{term:...}` or a live topic with no page.
- **Never hand-edit `public/books/`**; edit `src/pages/books/gcse/*.html` and rebuild. `public/css/book.css` and `public/js/book*.{mjs,js}` are hand-maintained.
- **Every topic** has Check-your-knowledge sets after each chunk, a Flip-it section, a "Help, I'm stuck!" ladder on every question, and wrong-answer messages for the common slips. `test/book.spec.ts` enforces minimum counts.
- **No third-party requests, ever, from book pages** (no web fonts, no CDN): tested on every page. Listen uses on-device voices only unless the student picks an online one. See "Privacy and accessibility rules" in `docs/book-authoring.md`.
- **Question figures:** `<figure class="figure qfig">` after the qtext, with a title and desc that do not give the answer; keep recap questions in `details.recap` and faded answers in `details.check-line`.
- **Children's data:** no accounts, no analytics, nothing sent anywhere; progress is `localStorage` only (`wm-gcse-v1`). Adding anything that sends data needs `security-architect` and `security-engineer` first.
- **Maths accuracy gate.** A topic isn't released until someone other than its author has checked every answer, wrong-answer message, hint and solution.
- **axe-core now runs on every page** (`test/accessibility.spec.ts`). The main site's pages are exempted from the colour-contrast rule only, for two known failures in `style.css` (gold `.kicker`, footer paragraph); the book's pages are checked against every rule, in interactive states and at 320px.

