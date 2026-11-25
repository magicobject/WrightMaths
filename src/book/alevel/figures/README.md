# A-level book figures

One file per topic: `figures/<topic-id>.mjs`, exporting `FIGURES = { '<topic-id>-<name>': () => svgString }`.
Draw with `plane()` / `numberLine()` from `../figure-lib.mjs`. A page uses a figure with `{fig:<topic-id>-<name>}`.
See `docs/alevel-book-authoring.md` for the rules (one idea per figure, labels on the picture, a `desc` that does not give away a question's answer).
