# GCSE book proofread, 25 November 2026

A full read of every book page (`src/pages/books/gcse/*.html`), the glossary and the topic data, done before the print edition. Every answer, accepted value, hint, worked solution and wrong-answer message was recomputed. Nothing has been fixed yet: this is the list to go through together.

Each finding gives its severity: **High** means wrong maths or misleading, **Medium** means confusing or inconsistent, **Low** means cosmetic. Line numbers are in the source file named in each heading. Print issues are grouped per page.

## Top of the list (High findings, plus decisions only Greg can make)

**Wrong maths or misleading**
- **circles line 232:** the wrong-answer message says "circumference or area both give 50.3". The full area for radius 8 is 201.1, and only a quarter of the area is 50.3. (checked)
- **sine-cosine-rules line 169:** the hint says "cos C = 0 ÷ 270". The denominator is 2×9×12 = 216. (checked)
- **ratio line 156:** one "wrong" option in Spot the mistake is actually a true statement.
- **inequalities lines 508–509:** both Flip-it figures show ≥ with a rightward arrow, while the text under them says < 4.
- **averages line 235:** the slip (÷52) and the correct method both round to 8%, and "8%" also appears in the wrong-answer list. Ask for 1 decimal place instead.
- **rearranging-formulae line 675:** a budget of "at most £300", but the accepted 4.9 h costs £300.20. The answer should be 4.8.
- **algebra-basics lines 661–668:** labelled [3 marks], but the mark scheme lists 4.
- **percentage-change line 585:** a double-escaped `&amp;minus;` shows as literal text on the page.
- **Answers given away by "Type it like…" examples:** in about 14 questions the format example is the answer (fractions 531, 537; foundation 543; rearranging 190, 196, 424; pythagoras 643, 650; algebra-basics 123, 296, 556; squares-roots 244, 250, 256).
- **simultaneous-equations:** one linear plus one quadratic equation, which Higher requires, is not taught anywhere.
- **constructions-loci:** there are no real compass constructions to draw, because the page says "you cannot draw on this screen". The print edition needs them.

**Tier and spec decisions (Greg)**
- Pages or sections labelled Higher but Foundation in the DfE spec: quadratic-equations (factorise and solve), percentage-change (compound interest, depreciation, reverse percentages), vectors (column vectors), bounds (error intervals), congruence in similarity, grouped mean in averages, and density units. Seven glossary terms are affected the same way. Because of the labels, the resit route skips percentage-change.
- sin²x + cos²x = 1 is labelled Higher on trigonometry, but it is A level. The ambiguous case is marked "beyond GCSE" while the same page teaches it.
- Prerequisites: inequalities (Foundation) needs quadratic-equations (Higher), and bearings needs trigonometry.
- parents line 30 still says "Enhanced DBS", which was just removed from the footer.
- algebraic-fractions has a section heading "Bigger bottoms", which may not suit a printed school book.

**Print edition, across the whole book**
Every page needs a print treatment for the same things:
- input boxes and "type / click / press" wording;
- hints, ladders, solutions, mark schemes and wrong-answer messages that sit right next to each question (they need an answers section);
- details/summary blocks;
- the screen-reader "text version" of figures, which states values the question asks the student to read;
- colour-only shading;
- tick boxes and links.

Also, the bearings scale drawings won't measure true when printed.

## Counts

| Group | Pages | High | Medium | Low |
|---|---|---|---|---|
| 1 | indices, hub and guide pages | 0 | 15 | 26 |
| 2 | compound-measures, quadratic-equations | 0 | 9 | 15 |
| 3 | bounds, inequalities, simultaneous-equations | 3 | 16 | 19 |
| 4 | direct-inverse-proportion, percentages, stretch | 0 | 15 | 22 |
| 5 | similarity, bearings, shapes-angles, factors-multiples | 0 | 12 | 39 |
| 6 | rearranging-formulae, pythagoras, algebra-basics, squares-roots | 13 | 21 | 22 |
| 7 | solving-equations, percentage-change, negative-numbers, fractions, foundation | 4 | 15 | 22 |
| 8 | four-operations, place-value, coordinates-graphs, transformations, order-of-operations, probability-basics | 0 | 19 | 50 |
| 9 | circle-theorems, sequences, constructions-loci, area-perimeter, averages, vectors, surds, algebraic-fractions | 2 | 23 | 36 |
| 10 | circles, sine-cosine-rules, iteration, functions-graphs, trigonometry, histograms, ratio, conditional-probability, raise-your-grade | 3 | 24 | 34 |
| 11 | glossary, topics, spec refs, routes, cross-book consistency | 1 | 16 | ~37 |

Severity was set by each group's own proofreader, so calibration varies a little: group 6 rated give-away format examples High where others rated them Medium.

---

# Findings by page

## indices (`src/pages/books/gcse/indices.html`)
- **[Typo] (Low)** line 69: "(More than one index are called indices.)" — awkward grammar → "(The plural of index is indices.)"
- **[Consistency] (Medium)** lines 384-386: "4<sup>&minus;3</sup> = {frac:1/4<sup>___</sup>}" / "= ___." / "{frac:1/___}" — this faded example uses bare "___" text, not `<span class="blank" data-answers>` like every other "Now you finish it" on the page, so nothing is checkable online → use blanks with data-answers 3, 64, 64.
- **[Wording] (Low)** line 452: "8<sup>2/3</sup>: root 3 first, then power 2." — "root 3" can be read as √3 → "cube root first, then square".
- **[Wording] (Low)** line 144: "On paper, &minus;5<sup>2</sup> has no brackets" — "On paper" is odd (and meaningless in print) → "As written, ...".
- **[Consistency] (Low)** line 576: "with no spaces or commas" — contradicts line 27 "The answer box ignores spaces" → drop "spaces or".
- **[Consistency] (Low)** lines 135, 579, 1096: "100000", "72000", "16000" — elsewhere the page uses thin-space grouping ("10 000", "32 000", "4 600 000") → "100 000", "72 000", "16 000" in prose/solutions.
- **[Consistency] (Low)** lines 114, 164, 348, 422, 614, 811, 915, 928, 934, 940, 946, 1001, 1133 (data-why texts): plain "2^5", "3 * 2", "2^5 x 2^1", "(-4)^2", "1/8", "45000" — wrong-answer reasons use caret/asterisk/x/hyphen-minus while the rest of the page uses sup, ×, − → use the same typeset notation (or confirm the renderer converts them; in print these will look like code).
- **[Consistency] (Medium)** line 719: "<h2>Adding and subtracting in standard form" — the only unnumbered teaching section between "7." and "8." → number it (e.g. "7b." or renumber 8→9) or fold into section 7.
- **[Spec] (Low)** lines 719, 735, 1159: Higher chip on adding/subtracting in standard form — in the DfE content (N9) calculating with standard form, including addition/subtraction, is not Higher-only (AQA/Edexcel set it on Foundation) → consider dropping the Higher label.
- **[Wording] (Medium)** line 941: "Put 2<sup>&minus;2</sup> and 2<sup>&minus;1</sup> in the pattern: what comes before 1?" — in the section 4 pattern (descending) these come after 1, and the clue does not lead to 2<sup>−3</sup> → "Carry on the pattern 2<sup>2</sup> = 4, 2<sup>1</sup> = 2, 2<sup>0</sup> = 1: what are 2<sup>−1</sup>, 2<sup>−2</sup>, 2<sup>−3</sup>?"
- **[Maths] (Medium)** line 1077: data-if="5x10^6": "The first part is 0.5, which is too small. Move the point and take 1 off the index." — a student who typed 5×10^6 has already moved the point; the slip is not adjusting the index → "You moved the point but did not take 1 off the index: 0.5 × 10^6 = 5 × 10^5."
- **[Consistency] (Low)** line 1061: markscheme "M1 ... M1 for 24 × 10<sup>8</sup> = 2.4 × 10<sup>9</sup> ... A1 for 2.4 × 10<sup>9</sup>" — second M1 and the A1 reward the same thing; 3 marks is generous for a one-step calculation → make it 2 marks (M1, A1) or have the second M1 be for 24 × 10<sup>8</sup>.
- **[Wording] (Low)** lines 927-928: "Jo says ... He multiplied" — fine, but "Jo" is usually read as female; check against intended pronoun (Mia "She", Ali/Sam "He").
- **[Print] (Medium)** whole page: all value/exact questions use typed answer boxes with "Type it like 3.2x10^5" instructions (about 70 questions), plus the "Units and typing" box (line 24-28), "Write your working on paper, then type the answer" (line 1056) and "Type just the number" phrases → print edition needs answer lines and the typing instructions removed; standard form should be asked as "a × 10<sup>n</sup>".
- **[Print] (Medium)** whole page: multiple-choice options rely on click-to-check data-why feedback; ladders ("Help, I'm stuck!"), solutions, details.recap and details.check-line answers are hidden on screen and would print next to the questions → move answers/clues to a back-of-book section.
- **[Print] (Low)** lines 36, 1164: "Skip to the lesson" link, "Back to the pyramid"/"Glossary" buttons, and the I can… checkboxes (1155-1160) / progress line (9) are screen-only.
- **[Print] (Low)** line 151: the sr-only "Text version of the picture" duplicates the chart; make sure it is hidden in print.
Checked: 105 questions (plus 9 worked and 7 faded examples, 6 figures)

## index (`src/pages/books/gcse/index.html`)
- **[Consistency] (Low)** lines 15 and 89: "Practice papers (grades 4 to 6)" / "Aiming for 7, 8 or 9?" vs "Grade 7&ndash;9 stretch papers" — mixed range styles → pick one ("grades 7 to 9").
- **[Wording] (Low)** line 102: "jump straight to exam style, going further and the checklist" — section names should match headings → "Exam style, Going further and the I can… checklist".
- **[Print] (Medium)** line 109: "Tap a teal word to see what it means" — colour-only meaning and tap interaction → print needs a different marker (bold/underline + glossary page reference).
- **[Print] (Low)** whole page: hub is mostly buttons/links (hero actions, "Give me five", "Clear my ticks on this device", the "Your marks" localStorage section, "Know the basics?" bar) — needs a print rewrite as a contents/introduction page.
Checked: 0 questions (hub page)

## how-to-use (`src/pages/books/gcse/how-to-use.html`)
- **[Wording] (Low)** line 41 vs index line 112: "Clue A ... Clue B" here, but the front page and topic pages call it "Give me a clue"/"Help, I'm stuck!" ladder — make sure the button label and clue labels match what the page actually shows.
- **[Wording] (Low)** line 100: "The search box at the top of each page is a combobox." — jargon for students → "is a search list".
- **[Wording] (Low)** line 105: "There is a timed set with a No clock choice and extra time..." — duplicates the Timed sets section and is out of place under "Using a screen reader" → move or delete.
- **[Print] (Medium)** whole page: describes screen-only features (Listen, Reading options, typing table, keyboard, ?q= URLs, Print buttons) → print edition needs its own short "How to use this book" (answers at the back, clues, mark schemes).
Checked: 0 questions (help page)

## teachers (`src/pages/books/gcse/teachers.html`)
- **[Consistency] (Low)** line 27: "The Grade 7&ndash;9 stretch papers have a timed set." — how-to-use line 112 says both Foundation and Stretch pages have timed sets → "The Foundation and Grade 7–9 practice papers have timed sets."
- **[Print] (Low)** lines 22-29: ?q=, #q12, ?review=1 and Print buttons are screen-only → print edition needs a teacher's note referencing page/question numbers instead.
Checked: 0 questions

## glossary (`src/pages/books/gcse/glossary.html`)
- **[Print] (Low)** lines 62-78: strand filter, search box and "Jump to" letters are screen-only → omit in print; consider letter headings instead.
Checked: 0 questions (entries come from `src/book/glossary.mjs`, not in scope)

## practice (`src/pages/books/gcse/practice.html`)
- **[Print] (Low)** whole page: randomised JS-only set with noscript fallback → no print equivalent; replace with a fixed mixed-practice section or omit.
Checked: 0 questions (generated)

## route (`src/pages/books/gcse/route.html`)
- **[Print] (Low)** line 133: "press &ldquo;Skip the basics&rdquo; at the top of its page" — screen-only → "skip to Exam style" in print.
Checked: 0 questions

## diagnostic (`src/pages/books/gcse/diagnostic.html`)
- **[Consistency] (Medium)** line 22: "3,640" — the book uses spaces/no separator for thousands, and how-to-use line 72 tells students a comma is read as a decimal point (5,60 → 5.60), so "3,640" could be read as 3.640 → "3640".
- **[Wording] (Low)** line 49: "Solve 3x + 5 = 20. Give the value of x." — fine, but line 46 uses the same expression 3x + 5 (x = 4 → 17); a student can get a cue from the previous question → use a different expression (e.g. 2x + 7 = 19).
- **[Print] (Medium)** whole page: answer boxes, "Show my results" scoring and topic suggestions are JS-only → print version needs an answer-and-topic key ("If you got Q7 wrong, start at Shapes and angles").
Checked: 11 questions

## parents (`src/pages/books/gcse/parents.html`)
- **[Consistency] (Medium)** line 24: "start on Ratio or Algebra basics, whichever one Find my gaps points to" — Find my gaps has no Ratio question and can suggest any of 11 topics (place value, fractions, Pythagoras...), so it can never point to Ratio → "start on the first topic Find my gaps suggests".
- **[Consistency] (Medium)** line 30: "a maths tutor with a current Enhanced DBS check" — commit 31a75c09 just removed the Enhanced DBS wording from the footer; check whether it should also go here (Greg's call).
- **[Wording] (Low)** line 36: "Anyone who uses the same browser on the same device can see them." — "them" after a long list of singular nouns → "can see all of this".
- **[Print] (Low)** line 76: "Hover over or tap any highlighted word" — screen-only → in print, "words in bold are in the glossary".
Checked: 0 questions

## command-words (`src/pages/books/gcse/command-words.html`)
- **[Maths] (Medium)** line 235: data-why "This rounds only one number and adds when it should multiply." for "49 + 20 = 69" — both numbers were rounded (48.7→49, 19.8→20), just not to 1 significant figure → "This rounds 48.7 to 49, not to 1 significant figure, and adds when it should multiply."
- **[Spec] (Medium)** line 112: "Calculate ... You may use a calculator." — "Calculate" appears on non-calculator papers too; whether a calculator is allowed depends on the paper → "the same as work out. Show your working. (On a calculator paper you can use one.)"
- **[Consistency] (Low)** lines 133-134, 227-228: rule says "write a sentence that uses the word because", but the model answers (line 134 "Its only factor is 1...", line 228 "60 + 70 + 40 = 170, which is not 180.") do not use "because" → rewrite the models with "because".
- **[Consistency] (Low)** lines 139, 234, 238: "1,000" — book style elsewhere is "1000"/"1 000" → "1000".
- **[Wording] (Low)** line 225: data-why "This is a fact about squares and rectangles, not triangles." — the option "All the angles must be 90°" is about the angles of squares/rectangles; ok, but "All the angles must be 90°" is a strange distractor for a triangle → acceptable; consider "The angles must all be equal."
- **[Print] (Low)** lines 200-239: 4 MC questions use click-to-check feedback, ladders and hidden solutions → answers to the back in print.
Checked: 4 questions (plus 17 worked command-word examples)


## compound-measures (`src/pages/books/gcse/compound-measures.html`)
- **[Wording] (Medium)** line 836: `40 ÷ 60 = ___ hours (as a fraction, {frac:2/3})` — the prompt prints the answer the blank asks for, so the blank tests nothing (and a decimal like 0.667 is not accepted) → drop "(as a fraction, 2/3)" and say "give it as a fraction", or accept 0.667/0.67 too.
- **[Consistency] (Low)** line 745: blank `£<span ... data-answers="4.2">` — the house rule (line 27) says money has two decimal places, like 12.50, but the blank expects 4.2 → accept "4.20;4.2".
- **[Wording] (Low)** line 473: `That divides by 2000 or uses a wrong volume.` — a vague message with no real slip behind it (300 ÷ 2000 is not a likely volume) → e.g. "Check the volume: 10 × 5 × 4 = 200 cm³, not 2000."
- **[Wording] (Low)** line 688: option `The 25 m reel, at £1.30 per metre, which is a smaller reel` — awkward → "The 25 m reel, because it costs less in total".
- **[Wording] (Low)** line 860: `The same tap fills litres at 9 litres per minute.` — "fills litres at" is clumsy → "The same tap runs at 9 litres per minute."
- **[Wording] (Low)** line 878: `the area of the table legs in contact with the floor ... 0.25 m²` — 0.25 m² of leg contact is unrealistic for table legs → use a box or a crate resting on the floor, or a much smaller area.
- **[Typo] (Low)** line 466: `density is 1.33 g/cm³ which is more than` — needs a comma before "which".
- **[Consistency] (Low)** line 994: the 3-mark hydraulic jack question, with a mark scheme, sits in "On the job" rather than in "Exam style" → move it, or drop the marks label to match the rest of that section.
- **[Figure] (Low)** lines 805–806: the flip-figure box labels use different font sizes (`font-size:10px` vs `11px`) for the same kind of label → make them the same.
- **[Spec] (Low)** lines 493 and 518: the `Higher` chip on density in kg/m³ — converting compound units (g/cm³ ↔ kg/m³) is in the Foundation spec too (N13/R1) → consider removing the chip or marking it "harder".
- **[Print] (Medium)** the whole page: about 80 questions use typed-answer boxes, and the faded examples use `span.blank` inputs. Answers, ladders, wrong-answer messages and solutions sit next to the questions, and "Check my answer" plus the recap use `details`. Multiple-choice answers rely on clickable options with hidden `data-why` text → print needs answer lines, with ladders and solutions moved to an answers section.
- **[Print] (Medium)** lines 26–27, 45 and 1008: `type the number only`, `Type a rule such as ... s*t`, `Type your answer like m/k`, `then type the answer` — on-screen typing instructions → for print, use "write" and normal notation (s × t, d ÷ s).
- **[Print] (Low)** line 36 `Skip to the lesson` link, line 9 progress line, lines 1096–1103 checkbox checklist, line 1106 buttons: screen-only → print treatment (a tick-box list, no links or buttons).

Checked: 88 questions (plus 10 faded examples and 17 worked examples)

## quadratic-equations (`src/pages/books/gcse/quadratic-equations.html`)
- **[Spec] (Medium)** line 5: `Algebra · Higher` — expanding double brackets, factorising x² + bx + c, the difference of two squares and solving by factorising (sections 1–7) are Foundation content (A4, A18). Only the a ≠ 1 factorising and the quadratic formula are Higher-only, and "Going further" already carries its own Higher chip (line 954) → change the eyebrow to "Algebra · Foundation, with Higher parts".
- **[Wording] (Medium)** line 641: `Size is not the reason. Many solutions are smaller. The reason is that a width is a real length.` — "Many solutions are smaller" does not make sense → "Being smaller is not the reason. The reason is that a width is a real length, so it cannot be negative."
- **[Wording] (Low)** line 38: `<li data-if="132">Close. Try 13 × 10 = 130 ...` — 132 is not a likely slip for 13², and "Close" is misleading → replace it with a common slip, e.g. 139 (130 + 9, forgetting that 13 × 3 is 39), with the message "13 × 3 is 39, not 9."
- **[Consistency] (Low)** lines 295 and 835: `data-if="(x-9)(x-9);(x-9)(x-9)"` and `"(x-12)(x-12);(x-12)(x-12)"` — the same entry appears twice, so the (x+9)(x+9) and (x+12)(x+12) slips are not caught → add those as separate wrong answers ("that is x² + 18x + 81") or remove the duplicate. Line 47 also lists `4x-12` and `-12+4x` twice.
- **[Consistency] (Low)** lines 970 and 1015: `there are no solutions` vs `no real solutions` — mixed terminology → use "no real solutions" both times (Higher), or "no solutions" both times.
- **[Consistency] (Low)** line 8: `<p class="where-use">` — the sibling pages (compound-measures) use `<p class="lead"><b>Where you will use this:</b>`, so the hero styling differs → use the same class.
- **[Wording] (Low)** lines 72 and 674: `Try it: ... (x + 1)(x + 4) in your head` and `Try it: write a quadratic with solutions 1 and 6.` — no answer is given anywhere → add a check-line (x² + 5x + 4; x² − 7x + 6 = 0).
- **[Wording] (Low)** line 19: `which come from the earlier pages` — vague, and meaningless on paper → name the topics (e.g. "Rearranging equations" and "Squares and square roots").
- **[Print] (Medium)** the whole page: about 70 questions use typed-answer boxes with caret notation (`Type it like x^2+3x+2`, `Type both answers with "and" between them`), and the faded examples use `span.blank` inputs. Ladders, wrong-answer messages and solutions sit next to the questions, and "Check my answer" plus the recap use `details`. Multiple-choice answers rely on clickable options with hidden `data-why` → print needs answer lines in normal notation (x²), with solutions moved to an answers section.
- **[Print] (Medium)** lines 61 and 846: `Typing tip: write x squared as x^2` and `then type the answer` — screen-only instructions → remove them or reword for print.
- **[Print] (Low)** line 27 `Skip to the lesson` link, line 9 progress line, lines 1064–1072 checkbox checklist, line 1075 buttons: screen-only → print treatment.

Checked: 83 questions (plus 8 faded examples and 15 worked examples)


## bounds (`src/pages/books/gcse/bounds.html`)
- **[Maths] (Medium)** line 279: "Truncating never rounds down, only cuts off." — For positive numbers, truncating always rounds down (it never rounds up). This contradicts line 788 ("Cutting digits off can only make a number smaller"). → "Truncating never rounds up. It only cuts digits off."
- **[Maths] (Medium)** line 267: "When a number is truncated, nothing is rounded down." — Same slip in reverse: truncation is the thing that rounds down. → "When a number is truncated, nothing is rounded up, so the true value is at least 12."
- **[Consistency] (Medium)** lines 477-479: "Greatest time = greatest distance &divide; ___ speed." / "Greatest distance: ___. Smallest speed: ___." / "___ &divide; ___ = ___ hours." — Every other "Now you finish it" on the page uses `<span class="blank" data-answers>` answer boxes. These are plain text, so on screen nothing can be typed or checked. → Change to blank spans (smallest; 155; 55; 155; 55; 2.82).
- **[Spec] (Medium)** line 5: "Number &middot; Higher", and topics.mjs `tier: 'H'` — In GCSE 9-1 (N15), error intervals for rounding and truncation are Foundation content. Only bounds in calculations and "justified accuracy" are Higher. A Foundation student would skip sections 1-3. → Label it "Foundation, with Higher parts" and put Higher chips on sections 4-7, the Flip it items that use calculations, and the Higher exam questions.
- **[Wording] (Low)** line 525: "A calculator might show a speed of 8.0 exactly. But if the distance and time were rounded, you cannot be sure of all those digits." — "8.0" has hardly any digits, so "all those digits" makes no sense. → Use a long display, for example "8.072289…".
- **[Consistency] (Low)** lines 766, 818: `<span class="chip chip-higher">Higher</span>` — The whole page is already labelled Higher, so these chips add nothing. They will make sense once the tier fix above is made. → Keep the chips only after relabelling the page.
- **[Wording] (Low)** line 843: "What is the smallest possible value of the board length &divide; the shelf length? … Can she be certain of getting 4 shelves?" — Two questions but only one numeric box. The yes/no part is not checked, and the A1 mark scheme mixes both parts. → Split it into (a) and (b), or drop the second question from the qtext and keep it in the solution.
- **[Print] (Medium)** whole page — All 52 auto-marked questions use typed answer boxes or multiple choice with hidden `data-why` reasons. Typing instructions assume a screen: line 26 "Type an error interval with &lt; and &lt;=… The answer box also accepts the &le; sign if you paste it", line 184 "Type it like 2.5&lt;=x&lt;3.5", line 812, and line 740 "then type the answer". → For print, use "Write…" wording with the &le; symbol, answer lines, and answers at the back.
- **[Print] (Medium)** whole page — Hints ("Help, I'm stuck!" ladders), wrong-answer messages, solutions and mark schemes sit right next to each question. The "Check my answer" `<details>` items (lines 104, 175, 250, 325, 405, 481, 550, 621) and the recap `<details>` (line 43) open on click. → Move solutions and hints to an answers section. Show the recap block expanded.
- **[Print] (Low)** whole page — "Skip to the lesson" link (line 36), the `data-topic-progress` line, the "I can…" checkboxes (lines 873-879), and the "Back to the pyramid" and "Glossary" buttons (line 883) only make sense on screen. Line 739 "Question words explained" is a link with no page reference. → Hide these in print, or give page numbers.
- **[Print] (Low)** number-line figures (lines 77, 157, 232) — Included and excluded ends are told apart by filled and open circles. The filled one is magenta, the open one white. In greyscale print the fill is fine, but check that the thin outline still shows. The muted captions already explain them. → No change needed beyond a greyscale print check.

Checked: 52 auto-marked and show-that questions, plus 9 worked or faded examples and 3 Spot the mistake items.

## inequalities (`src/pages/books/gcse/inequalities.html`)
- **[Figure] (High)** line 508: Forwards flip figure says "2x + 3 &ge; 11 gives x &ge; ?" and draws a dot with an arrow to the right. The text under it says "2x + 3 &lt; 11, x = ?" and "Solve: x &lt; 4". The figure and the text give opposite signs and directions. → Make them match: change the figure label to "2x + 3 &lt; 11 gives x &lt; ?" with an open circle and a left arrow, or change the text to &ge;.
- **[Figure] (High)** line 509: Backwards flip figure says "2x + 3 &ge; k, so k = ?" with a filled dot at 4 and an arrow to the right. The text says "x &lt; 4, so 2x + 3 &lt; k". Same mismatch: wrong sign, wrong circle and wrong direction. Its desc also says "filled dot … arrow heading right". → Make the figure, the desc and the text agree.
- **[Wording] (Medium)** line 147: "The arrow points the same way as the pointed end of the sign." — This is only true when x is written on the left. For 5 &gt; x the pointed end points right but the arrow goes left. Students are taught to accept answers like 4&gt;x, so the rule would mislead them. → Add "when x is written first, as in x &gt; 2".
- **[Consistency] (Medium)** lines 93, 233-235, 394-395: "a ___ 12", "start at ___", "&le; becomes ___", "x ___ &minus;5" — Plain-text blanks, not `<span class="blank">` boxes like the other faded examples on this page and in the book. → Change them to blank spans (&lt;; &minus;2; 1; &minus;2, &minus;1, 0, 1; &ge;; &ge;).
- **[Spec] (Medium)** whole page — Higher GCSE (A22) also needs set notation for solution sets, for example {x : x &gt; 3}. Representing inequalities as regions on a graph is also tested at both tiers in most specs. Neither is covered here or in any other live topic (grep of `src/pages/books/gcse` found no matches). → Add a short set-notation section (Higher) and a graphical regions section, or plan a separate topic.
- **[Consistency] (Medium)** topics.mjs line 58: `tier: 'F'` with `needs: [..., 'quadratic-equations']` — A Foundation topic depends on a Higher prerequisite, only because of the Higher section 7. A Foundation student is told they need quadratic equations first. → Drop that prerequisite and point to it from section 7 only, or flag it as Higher-only.
- **[Wording] (Low)** line 713: "The line y = 2x + 1 is a straight line graph." — Says the same thing twice. → "Look at the graph of y = 2x + 1."
- **[Typo] (Low)** lines 633, 639, 645, 652, 658, 815: `<p class="qtext"> <span class="chip` has a leading space, and line 764 "[4 marks]  <span" has a double space. → Remove the extra spaces.
- **[Consistency] (Low)** lines 633-658 — Every question in "Check your knowledge: quadratic inequalities" has its own Higher chip, even though the h2 (line 631) already has one. → Keep only the chip on the heading.
- **[Print] (Medium)** whole page — All 47 auto-marked questions use answer boxes or multiple choice with hidden reasons. Typing instructions assume a screen: line 25 "Type &lt;=… paste them", lines 110, 116, 174, 181, 495, 633-658, 740 "Type it like…", and line 738 "type the answer". Some answers are "Type yes or no" (lines 201, 575). → Use "Write…" wording and &le;/&ge; symbols, with answers at the back.
- **[Print] (Medium)** whole page — Hint ladders, wrong-answer messages, solutions and mark schemes sit next to each question, and `<details>` "Check my answer" and recap blocks open on click. → Move them to an answers section.
- **[Print] (Medium)** lines 175, 182, 189, 202, 471: the "read the number line" questions keep the answer in `sr-only` text ("…an open circle on 1…"). That is fine on screen, but make sure the print stylesheet does not show sr-only text. Open versus filled circles rely on the fill: magenta against white, which should survive greyscale. → Check that sr-only text stays hidden in print.
- **[Print] (Low)** lines 593-594: the quadratic sketches show the solution region only as a thick blue highlight on the axis (between versus outside). The meaning depends on colour and line weight. → Add labels such as "curve below axis" and "curve above axis", or hatching.
- **[Print] (Low)** "Skip to the lesson" (line 36), the progress line, the "I can…" checkboxes, the buttons (line 880), and links such as "see <a>Quadratic equations</a>" (line 586) and "Question words explained" (line 737) have no page references. → Hide them in print or add page numbers.

Checked: 47 auto-marked and show-that questions, plus 12 worked or faded examples and 3 Spot the mistake items.

## simultaneous-equations (`src/pages/books/gcse/simultaneous-equations.html`)
- **[Spec] (High)** section 7, lines 512-559: "Harder pairs Higher" — The Higher GCSE (A19) requires solving one linear and one quadratic equation simultaneously, for example y = x + 1 and x&sup2; + y&sup2; = 13. That is not taught here or in any other topic. It only appears as an untaught Grade 8 question in stretch.html (line 384). → Add a Higher section with a worked example, a faded example and practice. Algebraic and graphical interpretation: intersections of a line and a curve.
- **[Wording] (Medium)** line 492: "Work out the value of x &minus; y at (1, 4). Then say whether (1, 4) is also on the line x &minus; y = 1." — Two questions, but only the number is checked. The answer box gets "-3" and the yes/no part is ignored. → Drop the second sentence from the qtext, or split it into two parts.
- **[Wording] (Low)** line 637: "Work out 2x + y for her numbers. Is she right?" — Same problem: the yes/no part is not checked. → Split it, or leave "Is she right?" to the solution.
- **[Wording] (Low)** line 617: option "x + y = 5 and x &minus; y = 5, a matching pair" and line 618 "x + y = 6 and x &minus; y = &minus;1, adding up to 6". The tacked-on reasons are confusing and do not fit the question ("Which pair has x = 2, y = 3 as its solution?"). → Remove the trailing phrases.
- **[Consistency] (Low)** line 762: "Multiply (1) by 2 … and (2) by 5" — The question and solution never label the equations (1) and (2) before using the labels. The same happens at line 448: "(2) &minus; (1) &times; 2". → Label them when they are first written: "(1) 5p + 3s = 67 and (2) 2p + 5s = 61".
- **[Consistency] (Low)** line 849: the Higher chip is at the end of the qtext, but everywhere else in the book it comes first. Line 855 (expanding (x + y)&sup2; to find x&sup2; + y&sup2;) is at least as hard and has no chip. → Move the chip to the start and add one to line 855.
- **[Consistency] (Low)** line 25: "Have a go before you read anything. Wrong answers are welcome…" and line 37 "Quick recap of the layer below". Sister pages say "Quick warm-up. No marks…" and "Quick recap of earlier topics". → Use the same wording on every page.
- **[Typo] (Low)** lines 504, 505, 654: "line's", "someone else's" — Straight apostrophes, where the rest of the book uses &rsquo;. → Use &rsquo;.
- **[Figure] (Low)** line 28: the label "together: 11" sits beside the top ("bigger") bar only, so it reads as if the bigger number is 11. → Put a brace across both bars, or place the label between them.
- **[Wording] (Low)** line 842: accepted answers are only "(s+d)/2" and "s/2+d/2". Equally correct forms such as "(d+s)/2" or "0.5(s+d)" are marked wrong. → Add the common equivalent forms.
- **[Print] (Medium)** whole page — All 46 auto-marked questions use answer boxes or multiple choice with hidden reasons. Typing instructions assume a screen: line 81 "type x first, then y, with a comma and no brackets", the intros at lines 170, 258, 337, 534 and 691, and line 742 "type the answer". → For print, use "x = ___, y = ___" answer lines.
- **[Print] (Medium)** whole page — Hint ladders, wrong-answer messages, solutions and mark schemes sit next to each question. The "Check my answer" and recap `<details>` open on click. → Move them to an answers section.
- **[Print] (Low)** graph figures (lines 473, 486, 823) — The two lines are told apart by solid navy versus dashed magenta. The dash pattern survives greyscale, so this is fine, but the flip figure text at line 568 is 10px and may be too small in print. → Check the size in print.
- **[Print] (Low)** progress line, "I can…" checkboxes, buttons (line 876) and the "Question words explained" link (line 741) are for screen only. → Hide them in print or add page numbers.

Checked: 46 auto-marked questions, plus 12 worked or faded examples and 3 Spot the mistake items.


## direct-inverse-proportion (`src/pages/books/gcse/direct-inverse-proportion.html`)
- **[Wording] (Medium)** line 121: "A merchant sells building sand in direct proportion to its weight. 3 bags cost &pound;21." — the question is about bags, not weight, so the proportion it states is not the one being used (and bags may differ in weight) → "The cost of building sand is in direct proportion to the number of bags. 3 bags cost £21."
- **[Wording] (Medium)** line 302: "The litres of petrol bought and the price at one pump on one day" — "price" is ambiguous: the price per litre is fixed, and only the total cost rises. The why text ("More litres cost more money") relies on the reader taking it as total cost → "The litres of petrol bought and the total cost at one pump on one day".
- **[Wording] (Medium)** line 385: "Litres of petrol and its price at one pump" — same ambiguity → "Litres of petrol bought and the total cost at one pump".
- **[Maths] (Medium)** line 429: `data-if="160"` "That is the amount for 4 people. The question asks for 9 people." — 160 comes from the inverse slip 240 × 6 ÷ 9 (scaling the wrong way round), and the message does not explain that slip → "That is the wrong way round. More people need more flour, so the answer must be more than 240 g."
- **[Wording] (Medium)** line 487: "x = 4 (taking the positive value, since x is a length or speed)" — in this example x is abstract, not a length or speed → "x = 4 (or −4; take the positive value if x must be positive)", or say in the question that x is positive.
- **[Spec] (Medium)** line 851: "(Higher) use y = kx&sup2; and y = k/x&sup2;" — inverse proportion to x² is never taught. Section 6 only covers y = kx², and the one inverse-square question (line 542) arrives without an example. Higher GCSE expects both → add a short worked example of y = k/x² in section 6, or drop it from the I can list.
- **[Figure] (Medium)** line 207: the "Which line shows direct proportion?" figure (dp5) is the same as the teaching figure on line 160 (dp2), with the same lines A and B. The teaching text just before it explains that B is the taxi line starting above the origin, so the answer is in view → redraw dp5 (for example swap which line passes through the origin, or change the slopes).
- **[Figure] (Low)** line 160: the taxi paragraph on line 159 introduces the figure "Two straight lines", but the figure's axes are a plain x and y and neither line is named as the taxi → label line B "Taxi fare" and the axes "Miles" and "Fare (£)", or say in the text "Line B is the taxi."
- **[Figure] (Low)** line 235: the dp6 SVG has an empty x-axis label `<text ...> </text>` left in. "Workers" is placed separately underneath → remove the empty text element.
- **[Figure] (Low)** line 556: the Backwards flip box reads "x = 8, y = 40, rule = ?" but the figure says "k = ?". The figure desc has the arrow running "from the box "k = ?" to the box "x = 8, y = 40"", which is the opposite direction to the forwards box (from the known values to the unknown) → make the text and the figure agree ("k = ?"), and point the arrow from the known box to the unknown one.
- **[Consistency] (Low)** line 537: "Doubling x multiplies x&sup2; by 2 x 2 = 4." — uses the letter x for times → "2 &times; 2 = 4".
- **[Wording] (Low)** line 706: "Real jobs from the building trades: plumbing, electrics and carpentry." — the set has pumps, concrete, plasterers and decking, and no plumbing → "Real jobs from the building trades" (drop the list) or list the trades actually used.
- **[Consistency] (Low)** line 744: "[3 marks]" and a mark scheme on a question in "On the job", while every other on-the-job question has no marks → either move it to Exam style or drop the marks label.
- **[Print] (Medium)** the whole page: every value question (about 60) uses an answer box ("Type it like 3:4", "type the number only", "Write your working on paper, then type the answer"). The 7 "Now you finish it" examples use typed blanks. The "Help, I'm stuck!" ladders, wrong-answer messages, solutions, "Check my answer" and the recap are all hidden in details or JS. Multiple-choice answers are chosen on screen. The "I can…" list uses checkboxes. "Skip to the lesson" is an in-page link. Print needs answer lines, the typing instructions rewritten, and solutions/hints moved to an answers section away from the questions.
- **[Print] (Low)** line 371: the `sr-only` text version of the A/B/C graphs is hidden on screen and gives the answer away. Keep it out of print.
- **[Print] (Low)** lines 158, 160, 207: lines A and B are both drawn in the same colour (#ad1f5c), which is fine because they have letter labels. Check that the grey grid (#d3d9e3) survives greyscale print.

Checked: 73 questions (plus 7 faded examples, 9 worked examples, 6 figures)

## percentages (`src/pages/books/gcse/percentages.html`)
- **[Maths] (Medium)** line 48: `data-if="5"` "That is 60 divided by 12. Divide 60 by the denominator, 5." — no plausible slip leads to "60 ÷ 12" (12 is the right answer). 5 is most likely typing the denominator → "5 is the denominator. Divide 60 by 5 to find one fifth."
- **[Wording] (Medium)** line 389: "That is <i>repeated</i> percentage change, and it has its own page after this one." — on paper "after this one" is vague, and that page is Higher only → "…see the Higher topic Repeated percentage change."
- **[Consistency] (Low)** line 5: "Number &middot; Foundation and Higher" — topics.mjs has percentages as tier F and the page has no Higher chips → "Number · Foundation", or tag the parts meant to be Higher.
- **[Wording] (Low)** line 773: the hint "Which comes first, the discount or the VAT?" — with multipliers the order does not change the answer (95 × 0.9 × 1.2 = 95 × 1.2 × 0.9), so the hint suggests a trap that is not there → "The discount is taken off the price before VAT; then VAT is added."
- **[Wording] (Low)** line 762: the on-the-job intro "plumbing, electrics and carpentry" — there is no carpentry question in the set → drop "and carpentry", or add a carpentry item.
- **[Consistency] (Low)** lines 762–788: the answer-format instructions vary: "Type it like 42.75", "Type it like 12.50", "Give your answer in pounds, like 4.50", "Answer in pounds", "without the £". The accepted answers also differ: `data-answers="101.40"`, `"112.20"`, `"88.80"` list only the 2 dp form, while others list "17.40;17.4". Line 788 wants "12.5" typed without %, but sections 1–3 ask for "12%" style → pick one money phrasing and one percentage phrasing for the page, and list both 2 dp and short forms in every money answer.
- **[Consistency] (Low)** lines 764, 773, 787, 788: "[3 marks]" and mark schemes on questions outside Exam style ("On the job", "In the shop") → either keep the marks for exam-style items only, or explain in the intro that some set questions are marked.
- **[Typo] (Low)** line 166: figure desc "Three parts are shaded.  " has a double space at the end → trim it.
- **[Print] (Medium)** the whole page: every value question uses an answer box ("Give your answer like 12%", "Type it like 42.75", "Write your working on paper, then type the answer"). The 5 "Now you finish it" examples use typed blanks. Ladders, wrong-answer messages, solutions, "Check my answer" and the recap are hidden in details or JS. Multiple-choice is chosen on screen. "I can…" uses checkboxes. "Skip to the lesson" is an in-page link. Print needs answer lines, the typing instructions rewritten, and an answers section separate from the questions.
- **[Print] (Low)** lines 72, 112, 166, 221, 422, 513: the bar and hundred-square figures show shading in pink only. Line 111 says "some are shaded", so check the pink still reads as shading in greyscale (add a hatch or a darker fill).

Checked: 68 questions (plus 5 faded examples, 8 worked examples)

## stretch (`src/pages/books/gcse/stretch.html`)
- **[Wording] (Medium)** line 7: "Each is one question worth 3 to 6 marks" — no question is worth 6 marks. The highest is 5 (lines 402, 468, 511, 708, 744) → "3 to 5 marks".
- **[Maths] (Medium)** line 471: `data-if="1190"` "That uses 24 + 10 = 34 m for the path." — 34 × 35 = 1190 is the before-VAT figure. A student who makes the 34 m slip and still adds VAT types 1428, which gets no message → add `data-if="1428"` with the same message, and keep 1190 with "…and leaves out the VAT too".
- **[Consistency] (Medium)** line 212: "Give your answer in pounds, with the pence as a decimal, for example 121.6 for &pound;121.60." — this goes against the book-wide rule that money has 2 decimal places (percentages line 26; direct proportion line 26) → ask for "121.60" and accept both 121.6 and 121.60.
- **[Consistency] (Low)** line 365: "Type your answer in pounds, such as 3.20" but only `data-answers="14.5"` is listed → add 14.50 to the accepted answers (value mode may already accept it, but say so explicitly).
- **[Consistency] (Low)** line 605: `data-answers="13/28" data-mode="value"` — the other fraction answers in the book use exact mode. Check that value mode parses "13/28" and also accepts 26/56, which the mark scheme allows ("oe, such as 26/56").
- **[Consistency] (Low)** line 766: "(20 ÷ 10)" uses a literal ÷ character where the rest of the source uses `&divide;` → `&divide;` (cosmetic, same rendering).
- **[Consistency] (Low)** line 256: "Answer: 27/8 (which is 3 {frac:3/8})." — the plain slash form sits next to a typeset fraction → "{frac:27/8}".
- **[Consistency] (Low)** line 120: "&pound;11 475" and "&pound;15 000" use a space as the thousands separator, while elsewhere (lines 136, 468) large amounts have no separator ("&pound;4000", "&pound;4410", "&pound;1092"), and percentages line 427 accepts "1,140" → pick one house style for thousands.
- **[Wording] (Low)** line 692: `data-if="3"` "x = 3 would make a denominator zero, so it cannot be a solution. Solve the quadratic you get after clearing the fractions." — this is fine, but 3 is an unlikely slip. If kept, "Solve the quadratic…" is the useful part. Optional.
- **[Print] (Medium)** the whole page: line 20 "press the button to see the mark scheme. Tick every mark you earned… The ticks are counted on screen only." and line 22 "Some questions have a box for a final answer. Those mark the answer for you". All 40 mark schemes and clues sit behind buttons or details, and there are on-screen tick boxes and answer boxes (about 20 questions). Print needs the instructions rewritten ("turn to the mark schemes at the back"), answer lines, and the mark schemes moved to a separate answers section so they do not appear next to the questions.
- **[Print] (Low)** the whole page: the "Uses: <topic>" tags are links. On paper they read as topic names, which is fine, but give page numbers in print.

Checked: 40 questions (12 Higher-topic, 28 mixed)


## similarity (`src/pages/books/gcse/similarity.html`)
- **[Spec] (Medium)** line 503: `6. Proving triangles congruent <span class="chip chip-higher">Higher</span>`. The congruence criteria SSS, SAS, ASA and RHS are on the Foundation tier (G5 is not bold in the DfE content), so the Higher chip is wrong here and on lines 544, 557 and 753. → Remove the Higher chips from section 6. Only the area and volume scale factors (G19) are Higher-only.
- **[Consistency] (Medium)** lines 222 and 254: the figure desc says "The base BC is labelled x" and the SVG labels BC as x, but the questions say "Find BC" and never mention x. → Either label the base "BC = ?" in the figure, or write "Find BC (marked x)".
- **[Figure] (Low)** line 261: the model truss figure labels only the bases (30 cm and 4.5 m). The 12 cm height given in the text is not drawn. → Add a dashed height line labelled 12 cm on the model and "?" on the real truss.
- **[Consistency] (Low)** lines 435, 438, 477, 485, 490, 714, 753: cubes are written `k<sup>3</sup>` but squares use `&sup2;` (k²). They render at different sizes and heights. → Use `&sup3;` throughout, or `<sup>2</sup>` throughout.
- **[Consistency] (Low)** lines 475, 481, 487, 493, 558: the Higher chip is repeated inside each qtext, but the MC questions in the same Higher sections (lines 545, 551) have no chip. → Use one rule everywhere: chip on the section heading only, or on every question.
- **[Wording] (Low)** line 560: "so it is equal to B, not the angles on a line." is ungrammatical. → "...so it equals angle B. 180 − 55 would be the angle on a straight line next to it."
- **[Wording] (Low)** line 680 markscheme: "M1 for the scale factor 9 / 6 = 1.5 (or 9 / 6)" is redundant. → "(or 6 / 9 used to divide)", or delete the bracket.
- **[Wording] (Low)** line 723: "Fold it in half across its long side" is ambiguous, because folding across the long side halves the long side. → "Fold it in half so the long side is halved".
- **[Consistency] (Low)** line 649: the answer 342 is a whole number of pounds, but the key on line 27 says "Money is 2 decimal places", and other money questions ask "like 12.50". → Ask "Give your answer in pounds, like 12.50" and accept 342 and 342.00.
- **[Maths] (Low)** line 190: the wrong-answer message only matches 0.29. A student who types 0.286 gets no message. → `data-if="0.29;0.286;0.2857"`.
- **[Print] (Medium)** whole page: 54 questions use typed input boxes, MC options, "Help, I'm stuck!" ladders, `details` recap and "Check my answer" blocks (7 faded examples, 20 blanks). Solutions and wrong-answer messages would print next to the questions. There are also the "I can" checkboxes, "Skip to the lesson" (line 36), "Type yes or no" / "type 2:3" instructions (lines 27, 45, 118, 125, 247), "Write your working on paper, then type the answer" (line 662), and "Back to the pyramid" / "Glossary" buttons. → Print treatment: answer lines instead of inputs, solutions moved to the back, and typing instructions removed.
- **[Print] (Low)** lines 81, 119, 126, 233: figures are captioned "drawn to the same scale", but the print size is not tied to cm. → Say "drawn to the same scale (not actual size)".

Checked: 54 questions (plus 7 faded examples and 9 worked examples)

## bearings (`src/pages/books/gcse/bearings.html`)
- **[Maths] (Medium)** line 109: `data-if="450"` says "That looks like adding 360 and 90". A student who mixes up north as 360 would average the two, (360 + 90) / 2 = 225, not type 450. → Change to `data-if="225"` with "That treats north as 360. Here north is 000, so (0 + 90) / 2 = 45." The section's faded example (line 89) teaches north = 360, which invites exactly this slip.
- **[Consistency] (Low)** line 472: the ladder says "Use tan⁻¹ on your calculator", but the question has no `data-calc` attribute, so no calculator appears (all the other tan⁻¹ questions have `data-calc="scientific"`). → Add `data-calc="scientific"`, or reword it as a non-calculator question (10 ÷ 10 = 1, so the angle is 45°).
- **[Wording] (Low)** lines 216 and 217: "the answer must end up between 000° and 360°". 360 is never written as a bearing. → "from 000° up to (but not including) 360°".
- **[Wording] (Low)** line 695: "A bearing is a number of degrees from 000 to 360" (same point). Also "can never be mixed up with 450 or 4.5" is a weak reason. → "from 000° to 359°", and give a clearer example, such as 045 cannot be read as 45 written carelessly as 4 5.
- **[Wording] (Low)** line 498: "130° is south-east". South-east is 135°. → "130° is in the south-east quarter (between east and south)".
- **[Consistency] (Low)** line 676 markscheme: C1 is given for computing 220 and the subtraction, and then M1 for "angle ABC = 90°, so AC² = 6² + 8²". The labels look swapped against usual exam style, where the communication mark goes on stating the right angle. → M1 for 220 − 130, C1 for "angle ABC = 90° so the triangle is right-angled", M1 for AC² = 100, A1.
- **[Spec] (Low)** line 488: the Higher chip on "Two-step bearings problems". Right-angled trigonometry and bearings over 090° are both on the Foundation tier (G15 and G20 are not bold). → Consider dropping the Higher chip, or keep it only on the two-leg journey.
- **[Wording] (Low)** line 51: "One angle is 70°. What is the alternate angle" has no figure, so it is unclear which angle is meant. → Add a small figure, or say "the angle alternate to it".
- **[Figure] (Low)** line 424 (flip-it forwards SVG): the "040°" label is placed left of the north line, while the marked angle is to the right of it. → Move the label to x≈80.
- **[Print] (Medium)** lines 293, 329 and 336: the scale drawing is labelled "3 cm" and "4 cm" with "Scale: 1 cm to 2 km". In print the legs will not measure 3 cm and 4 cm, and the section teaches measuring with a ruler and protractor (lines 281 to 287). → Print the figure at true size (and say so), or caption it "Not actual size".
- **[Print] (Medium)** whole page: 55 questions use typed input boxes and MC options, with ladders, solutions, wrong-answer messages and `details` (recap, 7 "Check my answer" blocks). The page also has "Type it like 007" (line 193), "You can type either 045 or 45 in the answer box" (line 25), "Write your working on paper, then type the answer" (line 654), the "Skip to the lesson" link, the calculator widgets (`data-calc`), the "I can" checkboxes and the nav buttons. → Standard print treatment.
- **[Print] (Low)** lines 141 to 750: the colour of the angle arcs (pink and blue) carries meaning in the back bearing figure (line 211, bearing vs back bearing). → The labels already differ, so this is fine. Just check it in greyscale.

Checked: 55 questions (plus 7 faded examples and 9 worked examples)

## shapes-angles (`src/pages/books/gcse/shapes-angles.html`)
- **[Maths] (Medium)** line 170: `data-if="295"`: "You added to 360." The answer 295 comes from 360 − 65. → "You took 65 from 360. A straight line is 180°."
- **[Maths] (Low)** line 719: `data-if="103"`: "You used 180°." 103 is 283 − 180, which is not what using 180 as the total gives (that would be negative). → Reword to "That is 283 − 180. Angles round a point add to 360°, so x = 360 − 283", or drop the message.
- **[Consistency] (Medium)** line 19: `{term:unknown|Algebra basics} explains it fully` makes the link text read like a topic name, but it links to the glossary entry "Unknown (variable)". → "See {term:unknown|unknown} in the glossary", or link the real algebra topic.
- **[Spec] (Medium)** lines 690 to 695 (Going further): five people round a circular table, counting circular arrangements (answer 24). This is counting and combinatorics, not shapes and angles, and circular permutations are beyond GCSE. → Move it to a counting or product-rule topic, or replace it with an angle problem (for example, an interior-angle polygon chain).
- **[Wording] (Low)** line 718 intro: "Prices are typical, so check them with your own supplier." No question in this section has a price. → Delete the sentence.
- **[Wording] (Low)** lines 456 and 478: "The angle marked x is 70°, the same as the angle marked 70°." reads awkwardly. → "Angle x is 70°, the same as the marked angle."
- **[Figure] (Low)** line 718 SVG: the dashed `<line>` has `stroke-width` twice (`stroke-width="2" ... stroke-width="1.5"`), which is invalid markup. → Keep one.
- **[Consistency] (Low)** line 5: the eyebrow says "Foundation and Higher", but nothing on the page is chipped Higher, and sibling pages use "Foundation, with Higher parts". → "Foundation".
- **[Consistency] (Low)** lines 620 and 681: "2,340°" and "1,800°" use comma thousands separators. Similarity writes "100 000" and "1350". → Pick one book-wide style.
- **[Consistency] (Low)** line 26: the warm-up intro is shorter than on other pages, and there is no "Skip to the lesson" link. The "Spot the mistake" section (line 551) has no intro sentence. Sections have no "Now you finish it" faded examples, while sibling pages have them after every worked example. The "On the job" section (line 718) comes after "Why it works", but elsewhere it comes before the exam questions. → Align with the house page shape.
- **[Consistency] (Low)** lines 632, 646, 659: the exam questions are labelled (a), (b), (c), but they are unrelated separate questions. → Drop the part letters or number them 1 to 3.
- **[Print] (Low)** lines 87, 149, 218, 307, 413: the "Try it:" prompts have no answer anywhere. On screen that is fine, but in print students have no way to check. → Add the answers at the back.
- **[Print] (Medium)** whole page: 54 questions use input boxes and MC options, with ladders, solutions, wrong-answer messages and the `details` recap. The page also has "Write your working on paper, then type the answer" (line 630), the "I can" checkboxes and the nav buttons. → Standard print treatment.
- **[Print] (Low)** lines 382 to 411: the F, Z and C shape figures rely on a thick coloured highlight path. In greyscale they rely on line thickness only. → Check contrast in greyscale.

Checked: 54 questions (plus 5 worked examples)

## factors-multiples (`src/pages/books/gcse/factors-multiples.html`)
- **[Figure] (Medium)** line 358: the flip-it desc says "The small number 3 is circled.", but there is no circle in the SVG (just three boxes of four dots). → Circle or highlight the 3 groups, or reword the desc.
- **[Figure] (Low)** line 364: the desc says "with arrows joining them", but there is only one short arrow, and it overlaps the "?" box (line y1=82 to 96, box at y=90). → Fix the desc, or draw the arrows. End the arrow at y=88.
- **[Wording] (Low)** line 453: the solution repeats itself: "1 has only one. So 1 has only one factor, but a prime needs two". "Composite" is used without being introduced. → "A prime has exactly two different factors. 1 has only one, so it is not prime. (It is not composite either.)"
- **[Wording] (Low)** line 184: "Every other whole number bigger than 1 is built from primes by multiplying". "Every other" can be misread as "every second". → "Every whole number bigger than 1 that is not prime is built from primes by multiplying".
- **[Wording] (Low)** line 24: "The recap below is from Add, subtract, multiply, divide, the layer this stands on." is clumsy. → "The recap below is from the topic Add, subtract, multiply, divide."
- **[Wording] (Low)** line 700: the ladder says "Start from 2, 3, 5, 7 and 11" and "up to about 9", but 11 is past √91 ≈ 9.5 (the option on line 698 says 9.5). → "Start from 2, 3, 5 and 7: the primes up to √91 ≈ 9.5."
- **[Consistency] (Low)** line 523: "[1 mark]" is in the qtext, but the question has no `data-marks="1"` (the other exam questions have it). → Add `data-marks="1"`.
- **[Consistency] (Low)** lines 521 and 654 to 667: the exam section lacks the standard "Question words explained" link and the "Write your working on paper" line. The Going-further proof questions use a different tag style (`qtag` with "[3 marks]", "Non-calculator", "Grade 8") from every other exam question. → Align with one format.
- **[Spec] (Low)** lines 654 and 667: the algebraic proof questions (n² + n even, n³ − n a multiple of 6, using the difference of two squares) are Higher-only content (A6 bold) but carry no Higher chip. → Add `chip-higher`.
- **[Consistency] (Low)** lines 35 to 49: the recap questions have no wrong-answer messages ("Last time:" appears on the first one only). → Add the common slip for each (for example 8 × 7 = 54 or 63), and use "Last time:" on all or none.
- **[Consistency] (Low)** lines 131, 169, 176: "4,563" uses a comma separator, but other pages use a space ("100 000"). → Pick one book-wide.
- **[Consistency] (Low)** whole page: there are no "Now you finish it" faded examples, and section 5 ("Using it in real situations") has no worked example. → Add them for house consistency.
- **[Print] (Medium)** whole page: 67 questions use input boxes and MC options, with ladders, solutions, wrong-answer messages and the `details` recap. The page also has the "I can" checkboxes and the nav buttons. → Standard print treatment.

Checked: 67 questions (plus 6 worked examples)


## rearranging-formulae (`src/pages/books/gcse/rearranging-formulae.html`)
- **[Wording] (High)** line 190: "Type your answer like w = A/l." — the typing example is the exact answer (data-answers `a/l`) → use a neutral pattern, e.g. "Type your answer like w = B/k".
- **[Wording] (High)** line 196: "Type your answer like P = E/t." — the example is the answer (`e/t`) → e.g. "like P = B/k".
- **[Wording] (High)** line 424: "Type your answer like u = v-at." — the example is the answer (`v-at`) → e.g. "like u = p-qr".
- **[Maths] (High)** line 675: "A customer can spend at most &pound;300 ... find the number of hours, to 1 decimal place" with answer 4.9 — 65 + 48 × 4.9 = £300.20, which is over the budget. With "at most", 4.896... should be rounded down to 4.8 → either accept 4.8 and explain rounding down for a limit, or drop "at most" ("The customer pays £300").
- **[Consistency] (Medium)** line 259: "Divide both sides by 5: n = ___." — a plain-text blank with no `<span class="blank" data-answers=...>`, unlike every other "Now you finish it" → make it a real blank (accept (T+7)/5 and similar), or say the answer is in Check my answer.
- **[Wording] (Medium)** line 587: "Show that Ali is right when y = 14." — one value cannot show a rearrangement is right, and the solution itself says "One example is a check, not a proof". 3 marks for one substitution and one check is also generous → reword to "Check Ali's formula using y = 14" (2 marks), or ask for the rearrangement as the proof.
- **[Consistency] (Medium)** lines 599–611: 4 marks for a single substitution, and the mark scheme gives two separate M1s for (210 − 30) ÷ 12 and 180 ÷ 12 (the same step twice) → 3 marks: M1 set-up/rearrange, M1 180 ÷ 12, A1 15.
- **[Wording] (Medium)** line 510: "Zed has exactly the 700 points needed to finish one level. Which level is it?" — awkward and unclear → "Zed needs 700 points to finish a level. Which level is it?"
- **[Wording] (Medium)** line 672: "Real jobs from the building trades: plumbing, electrics and carpentry. Prices are typical, so check them with your own supplier." — this set has no carpentry question and no supplier prices (only call-out and hourly rates) → change to "plumbing and electrics". The supplier sentence reads oddly in a textbook.
- **[Consistency] (Low)** line 683: the Ohm's law question (V = 230, R = 46, I = 5, the same wrong answers 10580 and 0.2) is a repeat of line 404 → change the numbers (e.g. V = 230, R = 23).
- **[Consistency] (Low)** line 673 (and 672–684): "r<sup>2</sup>", "mm<sup>2</sup>" and "(Check: ... &#10003;.)" — the rest of the page uses &sup2; and a different check style → use &sup2; throughout.
- **[Consistency] (Low)** lines 115, 417: "The distance round a circle is C = 2πr" — the word "circumference" never appears. GCSE papers use it → add "(the circumference)" the first time.
- **[Consistency] (Low)** lines 548–575: Exam parts (a), (b) and (c) share one context, but the next two exam questions have no labels or question numbers → number the questions (1(a)–(c), 2, 3) to match a real paper.
- **[Print] (Medium)** Every question uses typed input boxes and value or exact checking. Lines 175, 342 and 547 tell the student how to type algebra ("use / for divide and * for times", "Type a square root as sqrt( )", "type the answer"), and many qtexts say "Type your answer like…". All of this needs print wording ("Write…").
- **[Print] (Medium)** Hints (ladder), wrong-answer messages, solutions, "Check my answer" and the recap are all hidden details/summary or reveal-on-click, and mark schemes sit straight under each exam question. For print they need a separate answers section.
- **[Print] (Low)** The I can… checkboxes, the progress line and links (command-words.html, "Back to the pyramid", Glossary) are screen-only.

Checked: 61 questions + 3 faded examples

## pythagoras (`src/pages/books/gcse/pythagoras.html`)
- **[Wording] (High)** line 643: "(Type it like 3√2 or 3sqrt2.)" — the typing example is the answer → use a neutral example such as 7√3.
- **[Wording] (High)** line 650: "(Type it like 5√2 or 5sqrt2.)" — the example is the answer → e.g. "like 7√3".
- **[Wording] (Medium)** line 646: `data-if="√18"` "Correct, but it can be simplified" — a wrong-answer message that starts "Correct" contradicts being marked wrong → "Not fully simplified yet: √18 = √9 × √2 = 3√2."
- **[Consistency] (Medium)** lines 575–603: "(a)" is a TV-screen question, while "(b)" and "(c)" are the flagpole. Parts of one question should share a context → make (a) Question 1 and (b)/(c) Question 2(a)/(b).
- **[Figure] (Low)** line 661: the dashed `<line>` elements have `stroke-width` twice (`stroke-width="2" ... stroke-width="1.5"`), which is invalid duplicate-attribute markup → keep one.
- **[Figure] (Low)** lines 469, 476, 483: the cuboid drawings are identical whatever the dimensions (for example the 6 cm height is drawn shorter than the 3 cm width). They are captioned "Not drawn to scale", but a rough proportion would help → scale the faces roughly, or accept as is.
- **[Consistency] (Low)** lines 8, 658, 669: "3-4-5 triangle" and "60 : 80 : 100" against "3, 4, 5" elsewhere → use one style ("3, 4, 5").
- **[Consistency] (Low)** lines 378, 383, 649 (and recap 44, 54): no wrong-answer messages, which the house rules ask for (for example 6, 8, 14 or a forgotten root; 5 + 13 = 18) → add one or two.
- **[Consistency] (Low)** line 658 intro: "Prices are typical, so check them with your own supplier." — only one question has a price → trim it.
- **[Print] (Medium)** All typed-answer questions use input boxes, and the calculator button (data-calc) is screen-only. The MC options give feedback on click (data-why), and "(Type it like …)" is used.
- **[Print] (Medium)** Hints, wrong-answer messages, solutions, the recap and "Check my answer" are hidden or reveal-on-click, and mark schemes follow each exam question. They need moving to an answers section.
- **[Print] (Low)** The proof figures and some figures rely on fill colour only to tell the regions apart (prf1/prf2 pastel squares, the pink diagonal in the cuboids). That is fine on paper in colour, but needs checking in greyscale.

Checked: 50 questions + 1 faded example

## algebra-basics (`src/pages/books/gcse/algebra-basics.html`)
- **[Wording] (High)** line 123: "(Type it like 3b+2.)" — the example is the answer (`3b+2`) → e.g. "like 4k+5".
- **[Wording] (High)** line 296: "(Type it like 3x+12.)" — the example is the answer → e.g. "like 5p+7".
- **[Wording] (High)** line 556: "(Type it like 5x+3.)" — the example is the answer to the 3-mark exam question → e.g. "like 4k-2".
- **[Consistency] (High)** lines 661–668: the question says "[3 marks]", but the mark scheme lists four marks (M1, M1, M1, A1) → make it 4 marks, or merge two M1s.
- **[Wording] (Medium)** line 660: "The number of 0.5 m square tiles" — "0.5 m square" can be read as 0.5 m² in area → "square tiles that are 0.5 m by 0.5 m".
- **[Wording] (Medium)** line 134: "follow the order of operations (BIDMAS): powers before multiplying, brackets first." — the order is muddled → "brackets first, then powers, then multiplying and dividing, then adding and subtracting".
- **[Consistency] (Medium)** lines 573 and 591: two separate sections both headed "Going further" ("Going further" and "Going further: double brackets") → merge them, or rename the second "Stretch: double brackets".
- **[Consistency] (Medium)** lines 531–556: exam parts (a), (b) and (c) are unrelated questions labelled as parts of one → number them 1, 2, 3.
- **[Consistency] (Low)** line 36: "Last time: work out 3 + 4 × 2." — only the first recap question has the "Last time:" prefix → drop it, or use it on every recap question.
- **[Consistency] (Low)** line 670: "r<sup>2</sup>", "cm<sup>3</sup>" against &sup2;/&sup3; elsewhere → use one form.
- **[Wording] (Low)** line 156: `data-if="27"` "That puts 4 next to the 2 to make 24." — the student typed 27, so they need the full step → "That reads 2x as 24, then adds 3 to get 27."
- **[Print] (Medium)** Every question is a typed input or a click-MC, with "(Type it like …)" in most qtexts. Line 25 says "open the recap", and the kitchen-scale and function-machine figures are fine for print.
- **[Print] (Medium)** Hints, wrong-answer messages, solutions and the recap are hidden or reveal-on-click, and mark schemes sit under the exam questions. They need an answers section.
- **[Print] (Low)** Line 228 figcaption "3a (pink) and 2a (blue)" and line 265 "Pink and blue tiles…" — the meaning depends on colour. In greyscale print the two groups look the same → add a pattern or a label, or rely on the gap only.

Checked: 61 questions

## squares-roots (`src/pages/books/gcse/squares-roots.html`)
- **[Wording] (High)** line 244: "(Type it like 3√5 or 3sqrt5.)" — the example is the answer → use a neutral example such as 7√11.
- **[Wording] (High)** line 250: "(Type it like 5√3 or 5sqrt3.)" — the example is the answer → neutral example.
- **[Wording] (High)** line 256: "(Type it like 6√2 or 6sqrt2.)" — the example is the answer → neutral example.
- **[Wording] (Medium)** line 598: "Confusing square (two lots) and cube (three lots)." — "two lots" is the wording for doubling, the very trap at line 594 → "Confusing square (the number used twice in a multiplication) and cube (three times)".
- **[Consistency] (Medium)** lines 444–469: exam "(a)", "(b)" and "(c)" are unrelated questions, and line 442 "No calculator for (a) and (b)" depends on that labelling → number them as separate questions, and tag them calculator or non-calculator.
- **[Consistency] (Low)** line 558: this question uses `qtag` chips ("[3 marks]", "Non-calculator", "Grade 8") that no other question in these pages uses. a and b are not italic, though n is italic elsewhere on this page → make the styling consistent.
- **[Consistency] (Low)** lines 268, 293, 555: "1,000", "17,161" with commas, while pythagoras.html uses "10 000" (a space) → pick one house style for large numbers.
- **[Consistency] (Low)** line 7: no "Where you will use this:" lead, which the other three pages have → add one.
- **[Consistency] (Low)** line 34: "Last time:" prefix on the first recap question only.
- **[Consistency] (Low)** lines 503, 527, 532: "1/3" and "p/q" with a slash in running text, where the page otherwise uses {frac:...} → use {frac:p/q}.
- **[Consistency] (Low)** lines 606–612: the I can… list leaves out the cube/cube-root and (Higher) surd-simplifying sections → add "find cubes and cube roots" and "simplify a surd (Higher)".
- **[Consistency] (Low)** lines 45–48, 289–293: some questions have no wrong-answer message or only a trivial one (for example 49 ÷ 7 has none).
- **[Print] (Medium)** All answers are typed inputs or click-MC, and "(Type it like …)" and the calculator button appear.
- **[Print] (Medium)** Hints, wrong-answer messages, solutions and the recap are hidden or reveal-on-click, and mark schemes sit under the exam questions. They need moving to an answers section.

Checked: 53 questions


## solving-equations (`src/pages/books/gcse/solving-equations.html`)
- **[Figure] (Medium)** line 324: Backwards flip figure desc "The box with the question mark is the one to find." — neither box in the Backwards figure has a question mark (boxes are "words" and "3x − 4 = 11"), so the desc is wrong for screen-reader and print alt text → drop the sentence, or say "The words box is the one to write".
- **[Wording] (Medium)** line 386: data-why "Multiplying makes 3x bigger. 3x is undone by dividing, and that is not where he slipped." — muddled: the first sentence doesn't explain anything → "Multiplying by 3 would not remove the 3; 3x is undone by dividing. Anyway, his slip is in the + 5 step."
- **[Maths] (Low)** line 261: wrong-answer data-if="-5" "Both numbers went negative. Add 2 to both sides: 2x = 8 + 2." — doesn't name a clear slip (−5 comes from 2x = −8 − 2) → "You got 2x = −10. The −2 moves across as +2: 2x = 8 + 2 = 10."
- **[Maths] (Low)** line 162: data-if="4.25" "You divided 21 by 4 but not the 1." — 4.25 = 21 ÷ 4 − 1, so the student divided 21 by 4 and then took 1 → "You divided 21 by 4 and then took away 1. Take 1 away first, then divide."
- **[Consistency] (Medium)** line 587: section "Check your knowledge: on the job" (6 questions, one with [3 marks] and a mark scheme) comes after "Going further" and just before "I can…". It isn't one of the standard section names, and it breaks the page order (exam questions with marks outside Exam style) → move it before Spot the mistake or Mixed review, or into Exam style if it keeps marks.
- **[Consistency] (Low)** lines 476, 485, 491, 497, 524: one-mark parts (Q1(c), Q2(a)/(b)/(c), Q3(b)) have "[1 mark]" in the text but no `data-marks`, unlike the 2/3-mark parts → add data-marks="1" so the tallied total (15) matches.
- **[Consistency] (Low)** line 53: the caption says "a 7 g weight … a 12 g weight", but the figure labels say just "7" and "12", and the rest of the section uses plain numbers → drop the "g" or add it to the labels.
- **[Wording] (Low)** line 8: "comparing two tradesmen" — gendered, and later questions use "she" for the electrician → "comparing two tradespeople".
- **[Print] (Medium)** whole page: all ~45 value questions use typed-answer boxes; MC questions rely on clickable options with data-why feedback; "Help, I'm stuck!" ladders, wrong-answer messages and solutions are hidden or interactive; the faded example has a blank; the recap sits inside `<details>`; the "I can…" checklist uses checkboxes. The answers need moving to the back of the book, with the hints as numbered footnotes.
- **[Print] (Medium)** lines 447, 452, 588, 597: "Write your working on paper, then type the answer.", "(Type it like 6x-1.)", "Type it like 2.5.", "Type it like 4.50." — screen-only instructions → reword for print ("Give your answer as…").
- **[Print] (Low)** line 9: `data-topic-progress` progress line and the links "Back to the pyramid" / "Glossary" (line 615) mean nothing on paper.
Checked: 47 questions

## percentage-change (`src/pages/books/gcse/percentage-change.html`)
- **[Typo] (High)** line 585: data-why "…so the second factor is 1 &amp;minus; x/100." — the entity is double-escaped, so it shows as the literal text "&minus;" → "1 &minus; x/100".
- **[Spec] (Medium)** line 5 (and every h2 chip): the whole page is labelled "Ratio · Higher", but compound interest, depreciation, percentage change and reverse percentages (sections 1–3 and most of Flip it) are Foundation content in GCSE (9–1) R9/R16. Only finding the rate with a root, and the algebraic Going further, are Higher. foundation.html even uses compound interest as a Grade 6 question that links here → label it "Foundation and Higher" and put Higher chips only on the root/rate parts.
- **[Wording] (Low)** line 59: "On the last page, simple interest paid…" — "the last page" is vague, and on paper it won't be the facing page → "In Percentages, simple interest…".
- **[Maths] (Low)** line 532: data-if="102.06" "That works forwards from £113.40." — 102.06 is 113.40 × 0.9, so the student applied only the fall to the final price. That isn't really "working forwards" (forwards with both changes would be 112.53) → "You took 10% off £113.40. Work backwards: divide by the overall multiplier."
- **[Consistency] (Low)** lines 125, 131, 242, 375 and others: large numbers are written without separators (12000, 13310, 10000), yet the accepted answers include "6,655", "10,000" and "3,200", and foundation.html uses "90 000" → pick one house style (UK usually 12 000 or 12,000) and apply it everywhere.
- **[Consistency] (Low)** line 509: Exam (b) "[1 mark]" has no data-marks, unlike (a) and the other exam questions → add data-marks="1".
- **[Print] (Medium)** whole page: typed-answer boxes on all value questions; clickable MC options with data-why feedback; hidden ladders, wrong-answer messages and solutions; faded-example blanks (lines 82–84, 169–171, 254–255, 340–341) with "Check my answer" `<details>`; recap in `<details>`; checklist checkboxes. Answers need moving to the back.
- **[Print] (Medium)** lines 26, 492, 493: the "Skip to the lesson" anchor link, the "Question words explained" link and "…then type the answer." are screen-only → remove them or reword for print ("see page N").
- **[Print] (Low)** many qtext lines: "Give your answer like 12%." / "like 4.50." are typing-format instructions → in print, "Give your answer as a percentage" / "to the nearest penny".
Checked: 44 questions

## negative-numbers (`src/pages/books/gcse/negative-numbers.html`)
- **[Consistency] (Medium)** line 18: "{term:unknown|Algebra basics} explains it fully." — the link goes to the glossary entry "Unknown (variable)" but its text reads "Algebra basics", as if it pointed to the topic page. Algebra basics also comes after this topic (it needs negative-numbers), so a student here hasn't met it → "…the glossary entry {term:unknown|unknown} explains it; Algebra basics covers it fully later."
- **[Wording] (Medium)** line 520: "What is its new depth in metres? Type it with a minus sign." — a depth is normally given as positive (75 m deep), so asking for a negative depth is contradictory → "What is its new position relative to sea level, in metres?" or "new height (a negative number)".
- **[Figure] (Low)** line 319: the Forwards flip figure's arrow ends at x=272.7, but the "3" tick (and the "?" label) is at x=276.7, so the arrowhead lands short of 3. The same path is reused in the Backwards figure (line 320), where the dot is at 276.7 → end the path at 276.7.
- **[Wording] (Low)** line 466: the solution is only "12." → "6 − (−6) = 6 + 6 = 12.", matching the other solutions.
- **[Consistency] (Low)** lines 499–531: the Exam style block doesn't state its total marks, and part (a) "[1 mark]" has no data-marks, unlike solving-equations → add data-marks="1" and a line such as "5 marks in all".
- **[Print] (Medium)** whole page: typed-answer boxes; clickable MC options (number line, Spot the mistake, Going further) with data-why feedback; hidden ladders, wrong-answer messages and solutions; recap in `<details>`; checklist checkboxes. The figures use the pink dot colour for "start", but each has a text label, so that's fine.
- **[Print] (Low)** lines 26, 497, 498: the "Skip to the lesson" link, the "Question words explained" link and "…then type the answer." are screen-only.
Checked: 48 questions

## fractions (`src/pages/books/gcse/fractions.html`)
- **[Maths] (High)** line 531: "How much narrower than the hole is the bit? Type it as 1/8." — the format example is the answer itself → "Type it like 3/16." (or "Give your answer as a fraction").
- **[Maths] (High)** line 537: "What fraction of the day is left? Type it as 5/12." — the format example is the answer → "Type it like 3/16."
- **[Maths] (Low)** line 200: data-if="2/2" "You subtracted the numerators and the denominators." — doing that to 3/4 − 1/6 gives 2/(−2), not 2/2, so the message doesn't match the slip (2/2 = 1 would only come from 6 − 4) → drop this trigger or reword: "You subtracted the bigger denominator from the smaller…".
- **[Consistency] (Medium)** lines 528 and 563: two extra sections ("Check your knowledge: on the job" and "Check your knowledge: on the pitch", including two [3 marks] questions with mark schemes) come after Going further, outside the standard page order → move them into Mixed review or Exam style.
- **[Consistency] (Low)** lines 563, 565: the solutions write fractions as plain "2/5", "3/5 = 18/30 …", while the rest of the page uses {frac:…} → use {frac:} so they print stacked.
- **[Wording] (Low)** line 8: "socket sizes such as 5/8 and 3/4 of an inch" — fine for drill bits and sockets, but the later question (line 531) has "A socket box needs a hole 3/4 of an inch wide". UK electrical back boxes and knockouts are metric (20 mm), so this can mislead trade students → consider "A bolt needs a hole…".
- **[Print] (Medium)** whole page: typed-answer boxes; clickable MC options with data-why feedback; hidden ladders, wrong-answer messages and solutions; faded-example blanks (lines 167–168) and "Check my answer" `<details>`; recap in `<details>`; checklist checkboxes.
- **[Print] (Medium)** lines 26, 452, 453: the "Skip to the lesson" link, the "Question words explained" link and "…then type the answer." are screen-only. "Type it like 1.5 / 42 / 3/4" (lines 543, 549, 563, 565) are typing instructions.
- **[Print] (Low)** lines 30, 128, 391, 421: the bar and pizza figures tell parts apart by fill colour (pink, blue, green). The legend or label text covers most of them, but the pizza relies on pink versus blue → add a pattern or a label in each slice for greyscale print.
Checked: 52 questions

## foundation (`src/pages/books/gcse/foundation.html`)
- **[Maths] (Medium)** line 48: data-if="4 4/7" "That looks like adding the numerators (1 + 3) and the denominators (3 + 4)." — that slip gives 2 + 1 = 3 wholes, so 3 4/7, not 4 4/7 → change the trigger to "3 4/7" (and maybe add "31/7").
- **[Consistency] (Medium)** lines 7, 543–548: the intro says the questions are "worth 2 to 5 marks each", but four of the six Everyday contexts questions (543, 544, 545, 547) have no marks tag, no data-marks and no mark scheme → add marks and mark schemes, or change the intro.
- **[Consistency] (Low)** lines 35–40, 372–378: answers written as plain "35/100", "7/20", "13/20" in the solutions and mark schemes, while line 50 onwards uses {frac:} → be consistent ({frac:} prints stacked).
- **[Wording] (Low)** line 179: "A paint store" — US usage → "A paint shop" / "A DIY shop".
- **[Consistency] (Low)** line 332: the prism-volume question is tagged "Uses: Area and perimeter". Volume is listed among that topic's words, so that's acceptable, but there's no Volume link → confirm the intended topic.
- **[Print] (Medium)** line 20: "press the button to see the mark scheme. Tick every mark you earned. … The ticks are saved only on this device." and line 22: "Some questions have a box for a final answer, and those mark the answer for you." — screen-only. Every question's mark scheme and solution is hidden, the clue ladders are interactive, and the "Uses:" chips are links → rewrite the instructions for print and put the mark schemes at the back.
- **[Print] (Low)** line 433: the bar chart's exact values are only in the sr-only text, and the bars at 9, 7 and 3 end between gridlines with no minor ticks → on paper, add minor gridlines at every 1 so the values can be read accurately (the ladder says "some bars end between the lines").
- **[Maths] (High)** line 543: "Type it in 24-hour time, like 12:05." — the format example is the answer (12:05) → use another example, such as "like 09:40".
Checked: 31 questions


## four-operations (`src/pages/books/gcse/four-operations.html`)
- **[Figure] (Medium)** lines 263, 268: Flip-it "Backwards" figures (`631 − 289` → `?`, `144 ÷ 6` → `?`): the arrow runs from the "?" box and its head points at the known calculation box, so the arrow says "? leads to 631 − 289", the reverse of the meaning (the calculation should lead to the unknown) → point the arrowhead at the "?" box, or put the "?" box on the left.
- **[Maths] (Low)** line 227: wrong answer `402`, "You missed the carry. 25 ÷ 6 = 4 remainder 1, then 12 ÷ 6." No likely short-division slip on 252 ÷ 6 gives 402 (writing a 0 for "2 ÷ 6 doesn't go" gives 042 = 42), so the message doesn't match a real slip → swap in a common slip, e.g. `41` (remainder dropped: 25 ÷ 6 = 4, then 2 ÷ 6 = 0 r 2 …) or `4.2`, or remove it.
- **[Wording] (Low)** line 121: wrong answer `33.62` only says "Check by adding back: 33.62 + 17.38 = 51." and never names the slip (forgetting the exchange in the units) → add "You did not exchange from the 50: 50.00 − 17.38 needs exchanges in every column."
- **[Wording] (Low)** line 419: wrong answer `960`, "Check: 25 × 8 = 200, so 800 + 200." 960 doesn't match a clear slip (it isn't 25 × 8 = 160), so the message isn't diagnostic → use `960` with "25 × 8 is 200, not 160", or choose a likelier slip such as `1025` (125 + 900).
- **[Figure] (Low)** line 340 (fo7): the £3 fee bar is 33.3 wide and each £8.50 bar is 66.7 wide (a 2:1 ratio, but 8.50 : 3 is about 2.8:1). The other bar models in this file are drawn to proportion → make the fee bar about 23.5 wide, or label the figure "not to scale".
- **[Consistency] (Low)** line 107: "You cannot take 8 ones from 3 ones … ten ones" while the rest of the page (and place-value) says "units" → use one word throughout ("units" to match the column headings, or switch the whole book to "ones").
- **[Consistency] (Low)** line 60: the bold definition of "product" appears in section 1 (adding and subtracting) and is then given again in section 2, line 137 → drop it from section 1.
- **[Print] (Medium)** every question uses a typed answer box, and the "Now you finish it" step uses an inline blank (line 83). The ladders, wrong-answer messages, solutions, the `details.recap` (line 34) and the `details.check-line` (line 85) are hidden on screen, so on paper the answers would sit next to the questions → print the answers in a back-of-book or end-of-chapter answers section.
- **[Print] (Low)** line 443: "Write your working on paper, then type the answer." and line 26 "Skip to the lesson" are screen-only → reword for print ("Write your answer"), and drop the skip link.
- **[Print] (Low)** line 442: the "Question words explained" link and the "Back to the pyramid" / "Glossary" buttons (line 537) mean nothing on paper → give a page reference instead. The "I can…" checkboxes (lines 529–533) are fine as tick boxes.
- **[Print] (Low)** lines 446, 473: the figure descriptions say "shown in blue / shown in orange". The labels carry the meaning, so this is fine, but don't rely on colour in the print caption.
Checked: 43 questions (plus 2 worked examples and 1 faded example)

## place-value (`src/pages/books/gcse/place-value.html`)
- **[Maths] (Medium)** line 302: `data-answers="4;4.00"` accepts `4`, but the solution says "Keep the zeros when the question asks for 2 d.p." The question asks for 2 d.p., so `4` should not be accepted (GCSE mark schemes want 4.00) → accept only `4.00`, and give `4` its own wrong-answer message: "Give 2 decimal places: 4.00."
- **[Figure] (Medium)** line 325: Flip-it "Backwards" figure: the arrow runs from the "?" box and its head points at "in words", the reverse of the meaning (you start from the words and find the digits) → point the arrow at the "?" box.
- **[Figure] (Low)** line 324: the forwards figure's description says "The box with the question mark is the one to find", but neither box has a question mark ("52,684" and "values") → remove that sentence from the description, or mark the "values" box as the unknown.
- **[Figure] (Low)** line 331: the title "Backwards: unknown  and 40" has a double space, and the box text is "? " with a trailing space → tidy both.
- **[Wording] (Low)** line 312: both ladder rungs end with the same question, "What does the rule say for a 5?" → make rung 2 different, e.g. "A 5 counts as '5 or more', so round up."
- **[Wording] (Low)** line 396: the option "Nothing is wrong: she added a zero at the end." doesn't describe Zoe's answer (6.07 → 6.70 is not adding a zero at the end, which would be 6.070) → reword, e.g. "Nothing is wrong: the 7 moved one place, which is × 10."
- **[Wording] (Low)** line 125: "Each column is ten times smaller than the one to its left" is a phrase many people find ambiguous → "Each column is worth one tenth of the column to its left."
- **[Consistency] (Low)** line 185: the heading "Multiplying and dividing by 10, 100, 1000" and the figure text "÷ 1000" (line 235) have no comma, but the body text uses "1,000" → use 1,000 everywhere.
- **[Consistency] (Low)** lines 453, 459: exam parts (a) and (b) say "[1 mark]" but have no `data-marks` attribute, while (c) has one → add `data-marks="1"`. Also, the exam stem (line 450) is a `p.muted`, where four-operations uses a `ul.facts` stem → use the same stem style.
- **[Print] (Medium)** every question uses a typed answer box or a shuffled multiple-choice list. The faded examples use inline blanks (lines 203, 264). The recap `details`, `details.check-line`, ladders, wrong-answer messages and solutions sit next to each question, so the answers would print on the same page → move answers to an answers section.
- **[Print] (Low)** line 452: "Write your working on paper, then type the answer." and line 429 "Type the number." → reword for print ("Write the number").
- **[Print] (Low)** line 451: the "Question words explained" link, the "Skip to the lesson" link (line 26) and the pyramid/glossary buttons are screen-only → give page references.
Checked: 41 questions (plus 3 worked examples and 2 faded examples)

## coordinates-graphs (`src/pages/books/gcse/coordinates-graphs.html`)
- **[Figure] (Medium)** line 380: the Flip-it "Plotting from an equation" figure is labelled "y = 2x + 1", but the text under it says "y = 2x − 1 → a line" → make them agree (y = 2x − 1 is the line used elsewhere in the section).
- **[Consistency] (Medium)** lines 433–437: the exam section labels its first three parts (a), (b), (c) (A and B, line L parallel to AB). The next two questions have no part letter, and the fourth reuses the name "Line L" for a different line (y = 3x − 2) → label them (d) and (e), or make them separate questions, and rename the new lines (e.g. lines P and Q, with the crossing point called R).
- **[Wording] (Low)** lines 33, 34: "The sum adds 1." and "The sum takes 2 away." call an expression "the sum" (in a sum, nothing is taken away) → "The expression adds 1" / "The calculation takes 2 away". Line 322 ("Which sum gives that?") has the same issue → "Which calculation gives that?"
- **[Spec] (Low)** line 78: the heading "The midpoint of a line" and line 79 "exactly halfway along it": a line has no midpoint, a line segment does → "The midpoint of a line segment".
- **[Consistency] (Low)** line 133: in the worked table of values, the row header is "3x + 2" (other tables use "y"), and only the first cell shows full working ("3 × (−2) + 2 = −4") → use "y" as the header and plain values, with the working in the steps.
- **[Consistency] (Low)** lines 284–285: the perpendicular "Now you finish it" uses plain "___" with no `span.blank` answer, unlike every other faded example → add `<span class="blank" data-answers="1/5">` and `data-answers="-1/5"`.
- **[Wording] (Low)** line 466: "Prices are typical, so check them with your own supplier." There are no supplier prices in these questions (they are formula costs), so the sentence reads oddly in a maths book → remove it, or say "The prices are made up for practice."
- **[Consistency] (Low)** line 466: "Check your knowledge: on the job" comes after "Going further", so the page order differs from the other topics → move it before Exam style/Going further, or keep it consistent across the book.
- **[Print] (Medium)** every question has a typed answer box ("Type it like (2, 5)", "Type it like y = 2x + 5", "Type yes or no", and so on). There are 9 faded examples with inline blanks, plus `details.recap`, `details.check-line`, ladders, wrong-answer messages and solutions on the same page → move answers to an answers section, and change "Type it like" to "Write it like".
- **[Print] (Medium)** lines 70–72, 199–201, 259, 327, 369, 371, 408: the `sr-only` text versions say "it may give away the answer". If print CSS ever reveals `sr-only`, they give the answers away → keep them hidden in print.
- **[Print] (Low)** line 432: "Write your working on paper, then type the answer." The "Question words explained" link (line 431), the "Simultaneous equations" link (line 300, link text only), "Skip to the lesson" and the pyramid buttons are screen-only → give page references.
- **[Print] (Low)** line 42: the quadrant numbers are drawn only in pink (`fill:#ad1f5c`), and line 81 uses pink for the segment and M. The labels carry the meaning, so this is OK, but check the contrast in greyscale print.
Checked: 61 questions (plus 10 worked examples and 9 faded examples)

## transformations (`src/pages/books/gcse/transformations.html`)
- **[Figure] (Medium)** line 139 (worked example, reflect in y = x): the figure description says the solid triangle "is below the line. Its dashed mirror image is above the line." But A(1, 2) is above y = x, B(4, 2) is below it, and C(4, 4) is on it, so the triangle straddles the line, and so does its image (A′(2, 1) is below) → "The triangle has one corner above the line, one below and one on it; its dashed mirror image swaps sides."
- **[Maths] (Medium)** line 212: wrong answer `17`, "That adds 2 to each side." Adding 2 to each side of 3, 4, 5 gives 5 + 6 + 7 = 18, not 17 → change the trigger to `18` (or explain 17 another way).
- **[Wording] (Low)** line 208: wrong answer `5,6`, "That adds 3 to x." The slip adds 3 to both coordinates → "That adds 3 to each coordinate. An enlargement multiplies."
- **[Consistency] (Medium)** line 413: the Higher exam question (P(2, 3) reflected in the x-axis then rotated 90° clockwise) is word-for-word the worked example at line 283, answer included → change the numbers (e.g. P(1, 4)).
- **[Consistency] (Low)** line 411: "[3 marks]" for rotating one point about the origin is generous next to the 2-mark translation at line 408 → make it 2 marks (M1 for the rule, A1 for the answer).
- **[Consistency] (Low)** line 50 and other descriptions: "A dash", while the text teaches "A prime" (line 49) → "A prime" in the descriptions too.
- **[Consistency] (Low)** line 5: the eyebrow "Foundation, with Higher parts" differs from the other topics' "Foundation and Higher". Line 442 "Check your knowledge: going further" differs from the other pages' "Going further". Exam questions (lines 408–413) have no (a)/(b) part letters → align with the house style.
- **[Spec] (Medium)** lines 26, 100, 356, 443: translation vectors are typed and printed in row form, "typed (3, -3)". GCSE requires column vectors, and in print a row pair looks like a coordinate → in the print edition, show the answer as a column vector and drop "typed (…)". Keep the row form only as the on-screen input hint.
- **[Print] (Medium)** every question has a typed answer box or a shuffled multiple-choice list. There are 9 faded examples with inline blanks, `details.check-line`, ladders, wrong-answer messages and solutions on the same page, and the `sr-only` text versions "may give away the answer" → move answers to an answers section, and keep `sr-only` hidden in print.
- **[Print] (Low)** line 407: "write your answer on paper and then open the mark scheme to check it", "Type it like (2, 5)" throughout, and line 197 "Type a fraction scale factor as 1/2" are screen-only → reword for print.
- **[Print] (Low)** line 80 and others: the column vectors are two stacked `aria-hidden` spans with an `aria-label`. Check that they print with brackets and stacked numbers (the print stylesheet must not flatten them to "3−2").
- **[Print] (Low)** "solid" and "dashed" triangles carry the object/image meaning, which survives greyscale. "Question words explained", "Skip to the lesson" and the pyramid buttons are screen-only.
Checked: 92 questions (plus 14 worked examples and 9 faded examples)

## order-of-operations (`src/pages/books/gcse/order-of-operations.html`)
- **[Figure] (Low)** line 213: the backwards Flip-it figure's description says "The box with the question mark is the one to find", but neither box has a "?" ("2 3 4" and "= 20"), and the title "Backwards: 2 3 4 and = 20" is awkward → drop the sentence and retitle, e.g. "Backwards: put brackets in 2 3 4 to make 20".
- **[Wording] (Low)** line 271 and line 276: "He added first, not multiplied first." is ungrammatical → "He added before multiplying."
- **[Wording] (Low)** line 257: "Leo works out the total for a relay kit as 9 + 18 ÷ 3" (the "relay kit" context means nothing) → drop the context or make it real (e.g. "9 cones plus 18 bibs shared between 3 teams").
- **[Consistency] (Medium)** line 407: the Higher section "Negatives, powers and hidden brackets" sits after "Going further" with no section number, and its three questions are not in a "Check your knowledge" block → make it a numbered section (e.g. "3.") before Flip it, with its own check-your-knowledge heading.
- **[Consistency] (Low)** line 7: this is the only page of the six without a "Where you will use this:" lead → add one.
- **[Consistency] (Low)** line 343: exam part (a) says "[1 mark]" but has no `data-marks`. Parts (b) and (c) have it → add `data-marks="1"`.
- **[Print] (Medium)** every question has a typed answer box or a multiple-choice list. The faded example has an inline blank (line 158). `details.recap`, `details.check-line`, ladders, wrong-answer messages and solutions are on the same page → move answers to an answers section.
- **[Print] (Low)** line 342: "Write your working on paper, then type the answer." The "Question words explained" link, "Skip to the lesson" and the pyramid buttons are screen-only → reword, or give page references.
Checked: 37 questions (plus 2 worked examples and 1 faded example)

## probability-basics (`src/pages/books/gcse/probability-basics.html`)
- **[Figure] (Medium)** line 305: the Flip-it "Forwards" figure's description says "Twenty counters in four rows of five", but the SVG draws two rows of ten (y = 36 and 62, x = 28…244) → "Twenty counters in two rows of ten, with five of them red".
- **[Typo] (Medium)** line 248: the `data-why` text uses double-escaped `&amp;ldquo;` / `&amp;rdquo;` (the only place in these six files). It reaches the page as the literal text "&ldquo;or&rdquo;" unless the feedback is written with `innerHTML` → use `&ldquo;` / `&rdquo;` like every other attribute.
- **[Wording] (Low)** line 169: "A fair coin often gives 7 heads in 10." P(exactly 7) is about 12% and P(7 or more) about 17%, so "often" overstates it → "A fair coin can easily give 7 heads in 10."
- **[Wording] (Low)** line 115: wrong answer `3/4`, "you may have taken away from the wrong total" is vague (3/4 comes from putting 3 over 7 − 3) → "That puts 3 over 7 − 3. Write 1 as 7/7 and subtract: 7/7 − 3/7."
- **[Wording] (Low)** lines 215, 322: "What does 'and' mean for the sum?" and "Which sum gives that?" use "sum" for a calculation → "calculation".
- **[Wording] (Low)** line 356: "RCDs" is unexplained jargon → "two RCDs (safety switches)".
- **[Consistency] (Low)** lines 205–208: the "Two-way tables" h3 sits inside section 7, "Multiplying chances: independent events", but two-way tables have nothing to do with independence → give it its own numbered section, or move it next to "Listing outcomes".
- **[Consistency] (Low)** lines 156, 168, 372: "4000", "5000" have no thousands comma, while the other topics write "1,000", "4,082" → "4,000", "5,000".
- **[Consistency] (Low)** lines 35–36: the "Skip to the lesson" link comes before the intro line, the reverse of the other pages, and line 38 says "Quick recap of the layer below" (coordinates-graphs says the same) where the others say "earlier topics" → pick one wording and one order.
- **[Spec] (Low)** line 27: "Give fractions in their simplest form unless the question says otherwise." GCSE mark schemes normally accept an unsimplified correct probability (for example 5/10), and the page's exact-mode boxes reject it (with a kind message). That's fine for practice, but don't tell students simplification is required in the exam → add "(in the exam an unsimplified fraction usually still scores, but simplifying is good practice)."
- **[Print] (Medium)** every question has a typed answer box ("Type a number", "Type the letter", "Type it like 42.75"). There are 11 faded examples with inline blanks, plus `details.recap`, `details.check-line`, ladders, wrong-answer messages and solutions on the same page, and the `sr-only` text version at line 71 "may give away the answer" → move answers to an answers section, and keep `sr-only` hidden.
- **[Print] (Low)** line 71: "A pink marker sits on one of the ticks" relies on colour in the description (the "?" label is enough) → "A marker…". Line 305 "five of them red" depends on colour fill to show which counters are red → mark the red counters with an R as well, as line 91 does.
- **[Print] (Low)** lines 141, 219, 220: "Use the table above" / "the same table" may not hold if the table falls on a different printed page → name the table ("the two-dice table in section 4").
- **[Print] (Low)** line 367: "Write your working on paper, then type the answer." The "Question words explained" link, "Skip to the lesson", the pyramid buttons, and the table's "scroll sideways if it does not fit" label are screen-only.
Checked: 96 questions (plus 14 worked examples and 11 faded examples)


# Proofread g09

## circle-theorems (`src/pages/books/gcse/circle-theorems.html`)
- **[Consistency] (Medium)** line 205: "Let the angle between the tangent AS and the chord AB be y" … "Draw the diameter AD" — the proof uses y and a point D, but the figure directly below (line 206) marks the angles x and has no D or diameter. → Use x in the proof (or relabel the figure to y), and either draw the dashed diameter AD on the figure or add a second figure for the proof.
- **[Wording] (Medium)** line 223 (mc, option "Angle TAB"): data-why "This is on the other side of the tangent, and it is not in a segment at all." — TAB is not on the other side of the tangent; it is the other tangent–chord angle at A. → "Angle TAB is also an angle between the tangent and the chord, on the other side of AB. It is not in a segment: its corner is at A, not on the circle away from A."
- **[Spec] (Medium)** line 255 ("A line from the centre to a chord? It bisects the chord"), line 389 ("A line from the centre cuts a chord in half") and line 421 (I can "use the fact that a line from the centre bisects a chord") — only the PERPENDICULAR from the centre bisects a chord (any line from the centre to a chord does not). → Say "the perpendicular from the centre to a chord bisects it" in all three places, matching Theorem 8.
- **[Figure] (Low)** line 287: the figure labels include O, but its desc ("A circle with a straight line TS touching it … A third point C …") does not mention O or the line(s) from O, and the question needs angle AOB. → Add "The centre O is marked and joined to A and to B" to the desc (and check OA, OB are drawn).
- **[Maths] (Low)** line 62 (mc, option "A sector"): data-why "A chord does not pass through the centre." — a diameter is a chord that does. → "A chord does not usually pass through the centre."
- **[Maths] (Low)** line 354: wrong-answer 11.7 "That adds the squares" — √(8.5² + 8²) = 11.66 is the half-chord from adding; doubling would give 23.3. The message is fine as is, but a student who adds AND doubles gets 23.3 with no message. → Optionally add data-if="23.3".
- **[Consistency] (Low)** line 263: heading "Check your knowledge: giving the reason" follows section "9. Choosing the right theorem". → Rename to "Check your knowledge: choosing the right theorem" (or rename section 9), so the CYK heading matches its chunk like every other section.
- **[Print] (Medium)** whole page: every numeric question uses an answer input box, every mc uses clickable options, every "Now you finish it" uses typed blanks with a "Check my answer" details, and hints/solutions/mark schemes sit in hidden ladders/solution blocks directly under each question (answers would print on the same page as the question). Needs an answers-at-back treatment.
- **[Print] (Medium)** line 376: "Write your working and your reasons on paper, then type the answer." — screen-only. → Print: "Write your working and your reasons."
- **[Print] (Low)** line 37 "Skip to the lesson" link, line 39 recap in a collapsed details ("skip if you are happy"), line 375 "Question words explained" link, the "I can…" tick boxes and line 425 "Come back in a week and tick again", and the {term:} pop-up links: all screen-only; need print text (page references, printed tick boxes).
- Checked: 90 questions, plus 7 faded examples and all worked examples.

## sequences (`src/pages/books/gcse/sequences.html`)
- **[Maths] (Medium)** line 248 (pipe halving): wrong answer data-if="-160" "That looks like subtracting 80 each time." — subtracting 80 from 640, 320, 160, 80 never gives −160 (80 − 80 = 0, then −80); no plausible slip produces −160. → Replace with data-if="10" ("That is the 7th length. Count again: 640 is the 1st.") or data-if="0" ("That takes 80 away from 80. The lengths halve each time.").
- **[Consistency] (Low)** line 381: intro "Real jobs from the building trades: carpentry, electrics and plumbing" — line 383 is a tiler. → "carpentry, tiling, electrics and plumbing". Also "Prices are typical, so check them with your own supplier" — only line 385 has a price and it is a labour charge, not a supplier price. → Drop or reword the sentence.
- **[Wording] (Low)** line 351: "Pattern n of a row of matchstick squares uses 3n + 1 matchsticks." — awkward. → "A row of n matchstick squares (pattern n) uses 3n + 1 matchsticks."
- **[Print] (Low)** line 285: the dots are told apart only as "dark dots" and "pink dots" — in a greyscale print the two kinds may look the same. → Use a different shape (e.g. hollow rings) for the 2 extra dots as well as colour.
- **[Print] (Low)** lines 70 and 167: the visible "Text version of the picture, for people who cannot see it (it may give away the answer)" paragraph duplicates the figure on paper. → Hide it in print (keep for screen readers).
- **[Print] (Medium)** whole page: all 60 questions use answer boxes or clickable options, with typed formats ("Type it like n^2 + 3n", "Type yes or no", "with a comma between them, like 8, 6") that only make sense on screen; 7 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit straight under each question. Lines 348 and 350 ("then type the answer", "Type yes or no, then show your working on paper") need print wording. Skip link (line 32), collapsed recap, Question words link (347), "I can…" ticks and "tick again" (400) are screen-only.
- Checked: 60 questions, plus 7 faded examples and all worked examples.

## constructions-loci (`src/pages/books/gcse/constructions-loci.html`)
- **[Figure] (Medium)** line 240: the plan of the triangular prism is drawn (and described) as a plain rectangle — the ridge of the prism is a visible edge from above, so the plan should be a rectangle with a line down the middle (two 3 cm × 10 cm strips). The page itself says (line 238) "Only the edges you can see are drawn", and GCSE mark schemes expect the ridge line. → Add a line along the middle of the plan rectangle and update the desc ("a rectangle with a line down the middle, where the ridge is").
- **[Figure] (Low)** lines 213/224 (garden): the circle round A (radius 4, centre (4, 3)) leaves TWO parts of A's side outside the circle (the top-left and bottom-left corners), but only the bottom-left one is labelled R; the text version says "Region R is in the bottom left corner". A student may ask which region the top-left corner is. → Make the garden less tall so only one corner region exists, or label both corners R (and say so in the text version).
- **[Wording] (Low)** line 302 (mc, first option): "AX = BX, because both are arcs with the same radius" — AX and BX are line segments (radii), not arcs. → "AX = BX, because both are radii of arcs with the same radius".
- **[Wording] (Low)** line 314 hint: "Two arcs with the same centre are in the same place every time." — unclear. → "Two arcs drawn from the same centre can never cross."
- **[Wording] (Low)** line 327: "Point X is on the perpendicular bisector of a line AB … How far along AB from A is the foot of the bisector?" — X is never used. → Drop X: "The perpendicular bisector of AB meets AB at M. AB is 14 cm. How far is M from A?"
- **[Wording] (Low)** line 354: "A tent is a triangular prism … a base of 8 cm and a height of 3 cm … 12 cm long" — a tent in centimetres. → "A model tent …" or use metres.
- **[Wording] (Low)** line 212: "To draw something, divide the real length by the scale." — "the scale" is "1 cm to 2 m"; dividing by it is unclear. → "divide the real length by the number of metres each 1 cm stands for".
- **[Consistency] (Low)** lines 339 and 340: circle-circumference/area cost questions have no data-calc="yes", while every other π question on the page (41, 203, 204, 229, 283, 335–337, 350, 351, 353, 382) does. → Add data-calc="yes".
- **[Print] (Low)** line 83: legend "Pink arcs: construction arcs" — colour-only on a greyscale print. → "Arcs: construction arcs" or mark them by line style.
- **[Print] (High)** line 27: "You cannot draw on this screen, so the questions here ask you to work out lengths and angles, put steps in order, or say which construction or region you can see." and lines 101–102 "Paper task … Do this on paper, then type or tick what you found." — in print the student CAN draw; the print edition needs real construction exercises (with space and given lengths) and this paragraph rewritten, or the topic will teach constructions without anyone constructing.
- **[Print] (Medium)** whole page: all 82 questions use answer boxes or clickable options; 4 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit under each question. "Text version of the picture … (it may give away the answer)" paragraphs (lines 63, 64, 224, 279–281) duplicate figures on paper and some state the reading (40, 50) that the question asks for, so they must be hidden in print. Line 349 "then type the answer", skip link (36), collapsed recap (38), Question words link (348), "I can…" ticks and "tick again" (399) are screen-only.
- Checked: 82 questions, plus 4 faded examples and all worked examples.

## area-perimeter (`src/pages/books/gcse/area-perimeter.html`)
- **[Maths] (Medium)** line 256 (concrete path, asks for the cost): wrong answer data-if="18" "That looks like using 1 m for the thickness instead of 0.1 m." — that slip gives a volume of 18 m³ but a COST of 18 × 125 = £2250, so a student making it would type 2250, not 18. (Compare line 370, which correctly uses the cost, 975.) → Change to data-if="2250" (and optionally keep 18 with "That is a volume with 1 m for the thickness; the question asks for the cost").
- **[Maths] (Low)** line 283: wrong answer data-if="12" "That looks like 2 × 24 ÷ 4." — not a recognisable slip, and the message does not say what went wrong. 12 is most likely 24 ÷ 2 (halving the area instead of dividing by ½ × 8). → "That halves the area. Work out {frac:1/2} × 8 = 4 first, then 24 ÷ 4."
- **[Consistency] (Low)** line 366: intro "Real jobs from the building trades: plumbing, electrics and carpentry" — line 371 is a plasterer. → Add "plastering". 
- **[Wording] (Low)** line 157: the worked example says "Find the area and the perimeter of this shape" but the figure comes after the example (line 158). → Put the figure before the worked example, or say "the shape below".
- **[Print] (Medium)** whole page: all 89 questions use answer boxes or clickable options, many with screen-only instructions ("Type it like 12.50", "Type it like 5000"); 8 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit under each question. Lines 320 and 376 ("Write your working on paper, then type the answer", "Work on paper, then type the answer"), skip link (36), collapsed recap (38), Question words link (319), "I can…" ticks and "tick again" (393) are screen-only.
- Checked: 89 questions, plus 8 faded examples and all worked examples.

## averages (`src/pages/books/gcse/averages.html`)
- **[Maths] (High)** line 235: "What percentage more did Shop B sell than Shop A? Give your answer to the nearest whole number, like 12%." with data-answers="8%;8" and wrong answer data-if="7.7;7.7%;8%" "You divided by 52." — dividing by 52 gives 7.69…%, which ALSO rounds to 8% to the nearest whole number, so the question cannot tell the right method from the slip, and the wrong-answer list contains "8%", the accepted answer (the student typing the right answer may be told they divided by 52, depending on which check runs first). → Ask "to 1 decimal place" (answer 8.3%; accept 8.3;8.3%), and keep data-if="7.7;7.7%" for dividing by 52. Update the worked example (line 227, "≈ 8%") to 8.3% to match.
- **[Spec] (Medium)** line 243: "8. Estimating the mean from a grouped table" is chipped Higher (also lines 259, 338, and I can "(Higher)" line 387) — estimating the mean, and the modal class, from a grouped frequency table is on the Foundation tier of GCSE (9–1) Maths (all boards). → Remove the Higher chips/labels.
- **[Maths] (Low)** line 153: wrong answer data-if="12.1" "That is the first time, or close to it." — 12.1 is also the MEDIAN of the five times (11.9, 12.0, 12.1, 12.4, 12.6), which is the likely slip. → "That is the median, the middle time. The mean is the total ÷ 5."
- **[Consistency] (Low)** line 119: table titled "Which average to use" includes a row for Range, which the page stresses is not an average (line 54). → Title "Which average (or measure of spread) to use".
- **[Typo] (Low)** line 274: figure title "Backwards: unknown , 5, 6, 9" and label "? , 5, 6, 9" — stray space before the comma. → "?, 5, 6, 9".
- **[Print] (Medium)** lines 166–208: the scatter-graph and bar-chart questions depend on the line of best fit being drawn in pink (#ad1f5c) against navy points; fine in greyscale only if line weight differs — check in a greyscale proof. Pictogram key uses symbols with half-symbols; check the half symbol prints clearly.
- **[Print] (Medium)** whole page: all 79 questions use answer boxes or clickable options, with screen-only formats ("Type Ali or Bea", "Type it like 42.75", "like 12%"); 7 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit under each question. "Text version of the picture … (it may give away the answer)" paragraphs (lines 176–179, 217, 234) print the bar heights / symbol counts the question asks the student to read, so they must be hidden in print. Line 334 "then type the answer", skip link (35), collapsed recap (38), Question words link (333), "I can…" ticks and "tick again" (389) are screen-only.
- Checked: 79 questions, plus 7 faded examples and all worked examples (scatter-graph line and points checked against the SVG coordinates: line is 30 + 6h, so 54, 66 and 5 h readings are right; car line gives 7 at 5 years).

## vectors (`src/pages/books/gcse/vectors.html`)
- **[Spec] (Medium)** line 5 "Geometry · Higher" (and tier 'H' in topics.mjs): column vectors, adding/subtracting vectors and multiplying by a scalar (sections 1–3, and describing translations) are on the Foundation tier of GCSE (9–1); only vector geometric arguments and proofs (sections 5–7) are Higher only. → Label the page "Foundation, with Higher parts" and chip sections 5–7 (and the proof/collinearity exam questions) Higher, as constructions-loci does.
- **[Consistency] (Low)** line 356: heading "Check your knowledge: going further" — every other page in this batch uses plain "Going further". → "Going further".
- **[Wording] (Low)** line 311: "a straight brace from the foot of a post to a point 1.5 m along the wall and 2 m up" — the geometry is unclear (along which wall from where?). → "A brace runs from a point on the floor to a point on a post. It goes 1.5 m across and 2 m up. How long is it?"
- **[Wording] (Low)** line 27: "In your exam you write it with an arrow over the letters, or you underline it." — and line 26 "You type them as plain letters" — a single-letter vector (a) is underlined when handwritten; AB gets an arrow. As written it reads as if either is fine for either. → "In your exam, write AB with an arrow over it, and underline a single letter such as a."
- **[Print] (Medium)** lines 24–27 ("Typing vectors": "Type a column vector as a pair … like (3, -2)", "You type them as plain letters"), line 113 "(Type a half as 1/2.)", line 320 ("then type the answer … then open the mark scheme to check it"): all screen-only and they contradict the printed column-vector notation. → Print edition: drop the typing box, show answers as column vectors.
- **[Print] (Medium)** whole page: all 82 questions use answer boxes or clickable options, almost all with "Type it like (3, -2)" / "Type it in letters, like 2a + b"; 8 faded examples use typed blanks written as "([BLANK], [BLANK])" rather than a column; hints, solutions and mark schemes sit under each question. Bold vector letters (a, b) must stay bold in the print font. Line 67 "Text version … (it may give away the answer)" prints the coordinates the question asks for. Skip link (36), collapsed recap (38), Question words link (319), "I can…" ticks and "tick again" (375) are screen-only.
- Checked: 82 questions, plus 8 faded examples and all worked examples.

## surds (`src/pages/books/gcse/surds.html`)
- **[Maths] (Medium)** line 39: "A whole number, a fraction or a decimal that stops is a rational number." — recurring decimals (0.333…) are rational too; as written, a student could conclude a repeating decimal is irrational, which conflicts with line 7 ("never ends and never repeats"). → "A whole number, a fraction, or a decimal that stops or repeats, is a rational number."
- **[Maths] (Low)** line 169: wrong answer data-if="8+3" "That is missing the two surd pieces" — a student who misses the surd pieces would type 11, not "8+3". → data-if="11".
- **[Consistency] (Low)** line 184 "Two-part denominators Higher" chip, lines 201–202 and 300 "Higher" labels, line 354 "Higher", and I can "(Higher) rationalise a two-part denominator" (line 368) — the whole page is already "Number · Higher" (tier H), so these chips imply the rest is not Higher. → Drop the inner Higher chips (or relabel the page "Higher" with no inner chips).
- **[Wording] (Low)** line 270 hint: "Surds behave like letters. Do 2x + x work out as x²?" — ungrammatical, and the analogy does not match the slip (adding under the root). → "Surds behave like letters: x + y is not one letter, so √8 + √2 is not one root."
- **[Wording] (Low)** line 182 (faded example): "Can 4 and the denominator be simplified?" then "The 4 and 3 share no factor, so this is the answer. In surd form it is 4√3/3." — the last sentence repeats the answer. → Drop "In surd form it is 4√3/3."
- **[Wording] (Low)** line 352: heading "Check your knowledge: stretch, is √2 a fraction?" — awkward and unlike other section names. → "Going further: is √2 a fraction?" (or fold it into Going further).
- **[Consistency] (Low)** line 332: "show" question has no data-marks, unlike every other show question on the page. → Add data-marks (e.g. 3).
- **[Consistency] (Low)** lines 341 and 345: "Use the full calculator value …" but no data-calc="yes", while 344 and 346 on the same set have it. → Add data-calc="yes".
- **[Print] (Medium)** lines 19, 43, 78, 163, 179, 196, 222, 256, 294 ("How to type surds on this page: type 3sqrt2 …", "Type answers like 3sqrt2", "Typing tip", "Type fractions like sqrt3/3"): screen-only and would look like errors in a printed maths book. → Remove in print.
- **[Print] (Medium)** whole page: all 79 questions use answer boxes or clickable options; 9 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit under each question. Line 294 "then type the answer", skip link (26), collapsed recap (28), Question words link (293), "I can…" ticks and "tick again" (371) are screen-only.
- Checked: 79 questions, plus 9 faded examples and all worked examples.

## algebraic-fractions (`src/pages/books/gcse/algebraic-fractions.html`)
- **[Wording] (Medium)** lines 149 and 161: section heading "Bigger bottoms" / "Check your knowledge: bigger bottoms" — slang for denominator, with an unfortunate second meaning for a printed school textbook, and not the glossary term (the page itself teaches "denominator"). → "Brackets in the denominator".
- **[Wording] (Low)** line 8: "two resistors in parallel in an electrical circuit. In each one, the rates add as fractions." — resistances are not rates; for resistors it is the reciprocals that add (as line 346 says correctly). → "In each one, you add fractions: the rates for pipes and workers, the reciprocals for resistors."
- **[Consistency] (Low)** lines 149/161 "Higher" chips, lines 190, 191, 213, 304, 305, 351 "Higher" labels, and I can "(Higher) …" (lines 363, 366) — the whole page is "Algebra · Higher" (tier H), so these labels imply the rest is not. → Drop them (same issue as surds).
- **[Consistency] (Low)** line 337: "show" question has no data-marks, unlike the other show questions. → Add data-marks.
- **[Print] (Medium)** lines 19, 53, 78, 109, 137, 162, 185, 260 ("How to type algebraic fractions on this page …", "Type fractions like 2x/3. Use brackets …", "Type answers like (2x+3)/((x+1)(x+2))", "type them like 2,3"), line 299 "then type the answer", line 230 "then tick the solution when you are happy" — screen-only; in print the answers should be shown as stacked fractions. Several wrong-answer messages are about typing only (line 56 data-if "1/2x" "put it in brackets: 1/(2x)"; line 327 trap "1/2x means ½ × x") and make no sense on paper with stacked fractions.
- **[Print] (Medium)** whole page: all 77 questions use answer boxes or clickable options; 8 faded examples use typed blanks + "Check my answer"; hints, solutions and mark schemes sit under each question. Skip link (26), collapsed recap (28), Question words link (298), "I can…" ticks and "tick again" (368) are screen-only.
- Checked: 77 questions, plus 8 faded examples and all worked examples.


# Proofread findings: group 10

## circles (`src/pages/books/gcse/circles.html`)
- **[Maths] (High)** line 232: "That is the whole circle (circumference or area both give 50.3)" — for r = 8 the full circumference is 50.3 but the full area is 64π = 201.1, so the area does not give 50.3 → "That is the whole circumference, 2 × π × 8. The arc is a quarter of it."
- **[Spec] (Medium)** line 363: "(Higher) find arc lengths and sector areas, give answers in terms of π, and find the volume of a cylinder" — answers in terms of π and cylinder volume are Foundation content (sections 6 and 7 carry no Higher chip, rightly) → move "give answers in terms of π, and find the volume of a cylinder" to its own unlabelled I can line; keep only arcs and sectors as Higher.
- **[Consistency] (Medium)** lines 129, 290, 302, 347: calculator money questions ("Paving costs £42 per m²", "Rugs ... £30 per m²", "£8.50 per metre", "board costs £42 per m²") have no `data-calc="yes"`, unlike every other π calculation on the page (e.g. line 349) → add `data-calc="yes"`.
- **[Consistency] (Low)** line 88: blank `data-answers="22"` while the check line says "22.0 cm to 1 d.p." — add 22.0 as an accepted answer (as line 291 does: "22.0;22").
- **[Wording] (Low)** line 102: wrong-answer "That is a tiny area. Use the circumference." — unclear what slip it names → "That looks like the area, π × 0.35². Distance travelled is the circumference."
- **[Wording] (Low)** line 301: mark scheme "A1 for 62.8 (accept 62.8)" — the accept note repeats the answer → drop "(accept 62.8)" or give a real range, e.g. "(accept 62.8 to 62.9)".
- **[Consistency] (Low)** line 162: "Circles inside other shapes" is the only unnumbered teaching h2 between numbered sections 4 and 5 → number it or note it as an extra.
- **[Figure] (Low)** line 188: flip figure desc "10 units long" while the text says "d = 10 cm" → "10 cm long".
- **[Print] (Medium)** page-wide: all value questions use typed input boxes, MC options are click-to-choose, faded examples use blanks, hints/solutions/check lines are hidden in details (solutions would print beside questions), "Skip to the lesson" link (line 36), "Write your working on paper, then type the answer" (line 300), "Type the number that goes in front of the π" (lines 260–267), I can checkboxes (lines 358–363) — all need a print treatment (answer lines, answers section at the back).

Checked: 76 questions

## sine-cosine-rules (`src/pages/books/gcse/sine-cosine-rules.html`)
- **[Maths] (High)** line 169: hint "cos C = 0 ÷ 270. Which angle has cosine 0?" — the denominator is 2 × 9 × 12 = 216 (the solution correctly says 0/216) → "cos C = 0 ÷ 216".
- **[Wording] (Medium)** line 83: "Do you need the sine rule or the cosine rule?" — the options answer a yes/no question ("No. It has a right angle…", "Yes, the sine rule…") → "Do you need the sine rule or the cosine rule here, or neither?" or "Do you need either of the new rules?".
- **[Spec] (Medium)** lines 298, 301: "Stretch: beyond GCSE." — finding the obtuse angle from a sine (the ambiguous case, and the obtuse angle from ½ab sin C) is examinable at GCSE Higher; the page itself teaches it in section 4 (line 122) → drop "beyond GCSE" (call it "Stretch" only), or keep the label but make it consistent with section 4.
- **[Maths] (Low)** line 42: wrong-answer "That looks like 6 + 1.5 or 6 × 1.5" for data-if="9" — 6 + 1.5 = 7.5, not 9 → "That looks like 6 × 1.5."
- **[Consistency] (Low)** line 218: back-bearing question carries `data-calc="scientific"` though it needs no calculator → drop it (or leave, but it signals a calculator question).
- **[Wording] (Low)** line 202: "(There is more on bearings on the Bearings page.)" — plain text with no link; on screen add a link, in print give the topic name/page number.
- **[Print] (Medium)** page-wide: all value questions are typed input boxes, MC options click-to-choose, faded blanks, hidden hints/solutions/check lines in details, "Skip to the lesson" link (line 37), "Type one small letter, like a" / "Type the name of the rule" / "Type it as a number, like 075" / "Type the cost like 42.75" prompts (lines 61–65, 81–82, 216, 218, 255–259), "Write your working on paper, then type the answer" (line 266), I can checkboxes (lines 307–312) — need a print treatment (answer lines, answers at the back).

Checked: 75 questions

## iteration (`src/pages/books/gcse/iteration.html`)
- **[Maths] (Medium)** line 175: distractor "It is 1.205, because that value is closest to 0." — f(1.215) = 0.009 is closer to 0 than f(1.205) = −0.045, so the distractor's own premise is false → "It is 1.215, because f(1.215) is closest to 0." (update the WHY to match).
- **[Maths] (Medium)** line 42: wrong-answer for 1: "That looks like 2³ as 6, or a sign slip." — 6 + 2 − 3 = 5, not 1; 1 comes from reading x³ as x (2 + 2 − 3) → "That looks like 2³ worked out as 2. 2³ = 2 × 2 × 2 = 8."
- **[Consistency] (Medium)** line 65: WHY text "The start value is only x₀. The xⁿ changes at every step" — "xⁿ" is a power (x to the n), not the subscript xₙ used everywhere else; x₀ also uses a Unicode subscript instead of the page's `<sub>` markup → "xₙ" with `<sub>n</sub>`.
- **[Maths] (Low)** line 177: solution "x4 and x5 both round to 4.65" — x3 = 4.6477… already rounds to 4.65, so x3 and x4 are the first two in a row that agree → "x3 and x4 both round to 4.65".
- **[Maths] (Low)** line 176: solution "x3 and x4 agree: 0.2016… ≈ 0.202" — x2 = 0.2016 and x3 = 0.20163… already agree to 3 d.p. → "x2 and x3 agree".
- **[Consistency] (Low)** line 230: "x2 = 2.7651, x3 = 2.7866" — truncated values shown without the "…" used everywhere else → "x2 = 2.7650…, x3 = 2.7865…" (true values 2.765095…, 2.786592…).
- **[Consistency] (Low)** lines 43, 116, 118: `data-calc="yes"` on questions that need no calculator (rounding 1.21347; f(1) = 1 − 5 + 1; reading the lower end of an interval) → remove.
- **[Print] (Medium)** page-wide: typed input boxes on every value question, click-to-choose MC options, faded blanks, hidden hints/solutions/check lines in details, "Skip to the lesson" link (line 37), "Type it like 1234.50" / "Type yes or no" / "Type your answer to part (b)" prompts, "Write your working on paper, then type the answer" (line 246), the sr-only text version on line 277 (invisible on screen and absent in print — fine, but the figure must carry the values in print), I can checkboxes (lines 285–290).

Checked: 68 questions

## functions-graphs (`src/pages/books/gcse/functions-graphs.html`)
- **[Consistency] (Medium)** lines 122–128: "y = 2^x" written with a caret in MC options, WHY messages, solutions and question text ("on the graph of y = 2^x"), while the teaching text and other questions use a superscript (2<sup>x</sup>, k<sup>x</sup>) — the caret is a keyboard form and looks wrong on paper → use `2<sup>x</sup>` in all displayed text (keep ^ only in "Type it like" hints).
- **[Consistency] (Medium)** lines 5, 157, 277: the hero says "Algebra · Higher" for the whole page, but only section 6 and one Going further question carry a Higher chip, and there is no "This whole page is for the Higher tier" line (as on iteration and sine-cosine-rules). Quadratic graphs, cubic/reciprocal recognition and reading solutions are also Foundation content → either state the whole page is Higher and drop the odd chips, or label the hero "Foundation, with Higher parts" and chip sections 1–2 (function notation, composite/inverse) and 6 as Higher.
- **[Wording] (Low)** line 50: wrong-answer for −11: "Squares are never negative: (−3)² = 9, and 9 + 2 = 11." — doesn't name the slip (−11 comes from −(9 + 2), i.e. treating −3² as −9 and adding −2) → "That looks like −(3² + 2). Square the −3 in brackets: (−3)² = 9."
- **[Wording] (Low)** line 99: wrong-answer for (4, 28): "Check the sign: 16 − 32 + 12 = −4." — 28 does not come from a sign slip in an obvious way (16 + 12 = 28 drops the −32 term) → "That leaves out the −8x term: 16 − 32 + 12 = −4."
- **[Typo] (Low)** line 73: wrong-answer key "x/3-4;x/3-4" lists the same value twice → one copy only.
- **[Wording] (Low)** line 213: solution "each point on the old graph is reached 3 sooner" — vague for a GCSE student → "f(x + 3) gives at x the value f gave at x + 3, so every point is 3 further left."
- **[Print] (Medium)** page-wide: typed input boxes on every value/exact question, "Type it like (3, 1)" / "Type it like y = x^2 + 3x − 4" / "Type your answer like 1 or 4" prompts, click-to-choose MC, faded blanks, hidden hints/solutions/check lines, sr-only text versions (lines 97–153, 183, 201) that hold exact values a print reader would only get from a well-labelled grid, "Skip to the lesson" link (line 33), "Write your working on paper, then type the answer" (line 241), I can checkboxes (lines 283–289).

Checked: 74 questions

## trigonometry (`src/pages/books/gcse/trigonometry.html`)
- **[Spec] (Medium)** line 259: "Higher For an acute angle x, sin x = 5/13. Use sin²x + cos²x = 1 to find cos x." — the identity sin²x + cos²x = 1 is not in the GCSE (9–1) content; it is A level. Labelled "Higher" it suggests it is examinable → label "Stretch: beyond GCSE" (as other pages do), or reword to use Pythagoras on a 5–12–13 triangle.
- **[Consistency] (Low)** line 106: faded blank accepts "35" while the check line says "35.0° to 1 decimal place" → add 35.0 as an accepted answer.
- **[Wording] (Low)** line 207: wrong-answer "10.3: You used the whole width, 8.4 m" — the question asks for 2 d.p., so that slip types as 10.25, which this message will not catch → data-if "10.25;10.3".
- **[Consistency] (Low)** lines 262–274: on-the-job questions switch to θ and "..." (three full stops: "1.43...", "24.22...", "136.17...") and rounded intermediates without an ellipsis ("0.9 ÷ 0.6428", "2.4 × 0.5736"), while the rest of the page uses x and "…" → use x (or the figure's "?") and "…" throughout.
- **[Consistency] (Low)** line 155: "Exact values of sin, cos and tan Higher" is an unnumbered teaching h2 after Flip it, while sections 1–5 are numbered → number it 6, or place it before Flip it.
- **[Print] (Medium)** page-wide: typed input boxes on every value/exact question ("Type two letters, like PQ", "Give your answer as a fraction, like 2/3", "so type 25"), click-to-choose MC, faded blanks, hidden hints/solutions/check lines in details, "Skip to the lesson" link (line 27), "Write your working on paper, then type the answer" (line 198), "Try it" prompts that rely on an on-screen calculator, I can checkboxes (lines 281–286).

Checked: 73 questions

## histograms-cumulative-frequency (`src/pages/books/gcse/histograms-cumulative-frequency.html`)
- **[Consistency] (Medium)** line 262: "The delivery times have a median of 29 minutes and an interquartile range of 16 minutes." — the page's own readings of the delivery-times curve give IQR = 37 − 22 = 15 (lines 84, 230) → "an interquartile range of 15 minutes" and new IQR 30 (update data-answers to 30, the wrong-answer 42 → 40, and the 16 wrong-answer → 15). Or say plainly that these are different data.
- **[Wording] (Low)** line 207: Dee's WHY says "so he is right" — the other Spot-the-mistake names use matching pronouns; "Dee" reads as female and the mix jars → "so Dee is right".
- **[Wording] (Low)** line 24: key box headed "Units and money" but most of it is about reading values off graphs → "Units, readings and money".
- **[Consistency] (Low)** lines 5, 154–177: hero says "Statistics · Higher" (all content here is Higher), yet only section 7 and its checks carry a Higher chip, which implies sections 1–6 are not Higher → drop the section chips or add a "This whole page is for the Higher tier" line as on other Higher pages.
- **[Figure] (Low)** line 85: worked example reads "about 72" deliveries at 45 minutes; linear reading between (40, 66) and (50, 76) gives 71, and the curve drawn through these points is close to that → check the drawn curve, or say "about 71–72".
- **[Print] (Medium)** page-wide: every value question is a typed input box; faded blanks are inside tables (lines 47, 162) and need printed answer cells; graph-reading questions accept a range that a printed answer key must state; the numbers for every graph question are only in sr-only text versions (e.g. lines 90–99, 116–117, 147–149, 171–179), so the printed graphs must be gridded finely enough to read them; tables sit in sideways-scrolling regions ("scroll sideways if it does not fit"); hidden hints/solutions/check lines; "Skip to the lesson" link (line 32); "Write your working on paper, then type the answer" (line 229); I can checkboxes (lines 268–274).

Checked: 74 questions

## ratio (`src/pages/books/gcse/ratio.html`)
- **[Maths] (High)** line 156: distractor "She should have multiplied both sides by 2 (not added 3), to get 6 : 10, an equivalent ratio." — this statement is true (it is the page's own solution), yet it is marked wrong; its WHY ("Subtracting also changes the ratio…") belongs to a different option → replace with a false option, e.g. "She should have subtracted 3 from both sides instead, to get 0 : 2."
- **[Consistency] (Medium)** line 27: warm-up asks "What fraction of the counters are red?" in value mode, with a wrong-answer "12/20: Right value. 12 and 20 both divide by 4." — in value mode 12/20 is accepted as correct, so this message never shows and simplest form is never asked for → either say "in its simplest form" and use data-mode="exact", or drop the 12/20 message.
- **[Consistency] (Low)** lines 113, 127: money answers given as "£5.60, so 5.6 in pounds" and "£0.7 (70p)" — breaks the 2-decimal-place money rule used elsewhere (e.g. line 118 "Type it like 12.50") → "£5.60" and "£0.70 (70p)"; prompts "Type it like 4.50" and "Type it like 0.55" are fine.
- **[Consistency] (Low)** line 126: options mix unit styles: "250 grams", "400 g", "1 kilogram" → "250 g", "400 g", "1 kg" (or all in words).
- **[Wording] (Low)** line 226: wrong-answer for 60: "there are 10 000 cm² in 1 m², not 100 000 or 100" — 60 comes from dividing by 100 000, which is not an obvious slip; message is hard to follow → "That divides by 100 000. 1 m² = 100 cm × 100 cm = 10 000 cm²."
- **[Spec] (Low)** line 5: hero says "Foundation and Higher" but no section or question carries a Higher chip; the Going further items (combining a : b and b : c, ages problem with algebra) are Higher → chip them Higher.
- **[Print] (Medium)** page-wide: typed input boxes on every value/exact question ("like 2:5", "Type it like 12.50", "Type it like 12"), click-to-choose MC, faded blanks, hidden hints/solutions/check lines, "Skip to the lesson" link (line 26), "Write your working on paper, then type the answer" (line 173) and "Work on paper, then type the answer" (line 251), bar models use colour only to tell the parts apart (lines 59, 63–65, 174, 231, 251 — "one colour… another colour"); in greyscale print they need labels or hatching, I can checkboxes (lines 261–266).

Checked: 74 questions

## conditional-probability (`src/pages/books/gcse/conditional-probability.html`)
- **[Figure] (Low)** lines 125, 133–137: figure title/desc "The same test on 1000 parts | The same tree of 1000 parts…" — line 125 is the first time the tree appears, so "the same" refers to nothing → "A tree of 1000 parts…" at line 125 (keep "the same" for the repeats).
- **[Figure] (Low)** lines 144–145: flip figures carry the text fragments "given A:" and "the bottom" — on their own (and in print) "the bottom" is meaningless → "given A: A is the denominator" (or "A goes on the bottom").
- **[Consistency] (Low)** lines 5, 122, 193–197, 227: hero says "Probability · Higher" for the whole page, but section 5 and some exam questions carry their own Higher chip, implying the rest is not Higher → drop the extra chips or add the "This whole page is for the Higher tier" line used on other Higher pages.
- **[Consistency] (Low)** line 54 and others: two-way tables use a hard-coded pink header fill (#fbe3ee) with navy borders — colour-only header styling; fine on screen, but check in greyscale print that the header row/column still reads as headers (they are `th`, so bold helps).
- **[Print] (Medium)** page-wide: every value/exact answer is a typed input box ("Give your answer as a fraction in its simplest form, like 3/10"), click-to-choose MC, faded blanks, hidden hints/solutions/check lines, "Skip to the lesson" link (line 32), "Write your working on paper, then type the answer" (line 191), the class two-way table is repeated in full inside each of five questions (lines 49–53) and the machines table in three (lines 112–114) — wasteful on paper; print once and refer to it, I can checkboxes (lines 233–238).

Checked: 65 questions

## raise-your-grade (`src/pages/books/gcse/raise-your-grade.html`)
- **[Consistency] (Medium)** line 48: "then the "Last time" questions at the top of Fractions" — fractions.html has no "Last time" section; the top section is "Warm-up: what do you already know?" with a "Quick recap of the layer below" → "then the Warm-up questions at the top of Fractions".
- **[Spec] (Medium)** line 116: "Most GCSE maths courses have two or three papers of equal weight, and at least one is without a calculator." — the page says "In England" (line 23); every English board (AQA, Edexcel, OCR) sets three papers of equal weight, one of them non-calculator → "In England there are three papers of equal weight; Paper 1 is non-calculator."
- **[Consistency] (Medium)** lines 134–198: the five MC questions have a WHY on only one wrong option (line 179); the house rule is a wrong-answer message for each common slip → add data-why to the other ten distractors.
- **[Wording] (Low)** line 179: WHY "Guessing the method wastes the marks: the answer is given, the working is the answer." does not match the option it is on ("Find some different answer, to be safe") → "The answer is given to you. Finding a different one loses the marks; the working is what earns them."
- **[Wording] (Low)** line 117: "Write down wants no working." — slightly too strong; "Write down" means little or no working is needed, and a line of working is never penalised → "Write down needs little or no working."
- **[Print] (Medium)** page-wide: "Find my next step" / "Back to the pyramid" buttons (lines 9–10), click-to-choose MC with hidden hints and solutions (lines 134–198), links whose targets need page numbers in print (Fractions, Solving equations, Mixed practice, Pythagoras, Question words, "get in touch" on line 208), "Put a reminder in your phone" is fine; <a href="practice.html">Mixed practice</a> ("five questions… chosen for you") is an on-screen tool with no print equivalent.

Checked: 5 questions


# g11: data files and cross-book consistency

Every worked number in the glossary (290 terms: def, example, watch and flip) was recomputed and was correct unless listed below. There are no duplicate ids, no broken `see:` links and no unknown `words` ids in topics.

## glossary (`src/book/glossary.mjs`)
- **[Consistency] (Medium)** Thousands separators vary within the glossary. `significant-figure` (l.219) has "4 372", "4 400" and "0.003 862"; `depreciation` (l.186) has "&pound;10 000"; `volume` (l.1488) has "1 000 000"; `map-scale` (l.1156) has "50 000". But `digit`/`place-value` (l.227) have "4,082", `salary` (l.440) has "&pound;24,000", and `divisible`/`round` have "4,563" and "3,468". Others have no separator at all ("&pound;1000", "2000", "4600"). → Pick one house style (a thin space is the UK exam-board convention) and apply it in the glossary and in the pages (see Cross-book).
- **[Spec] (Medium)** l.1653 `sector` is level H, and l.1670 `cylinder` is H, but `arc` (l.1621) is F. Under the DfE spec, arc length and sector area (G18) and the volume of a cylinder, a right prism (G16), are Foundation. The circles page (an F topic) links both terms. → Set both to F.
- **[Spec] (Medium)** l.899 `exact-trig-values` is level H. Exact values of sin and cos (0, 30, 45, 60, 90 degrees) and tan (0, 30, 45, 60) are Foundation (G21). The F trigonometry page links the term. → Set to F.
- **[Spec] (Medium)** l.2729 `vector`, `magnitude` and `scalar` are H, but `column-vector` (l.2633) is F. Column vectors, adding them and multiplying by a scalar are Foundation (G24/G25). Magnitude is fine as H. → Set `vector` and `scalar` to F.
- **[Spec] (Low)** l.1408 `compound-interest` and l.186 `depreciation` are nH. Compound interest, growth and decay (R16) are Foundation; only general iteration is Higher. The same tier problem affects the percentage-change topic below. Also `simple-interest` and `compound-interest` are strand n, while the percentage-change topic is strand r. → Set to F and decide the strand.
- **[Spec] (Low)** l.1897 `class-midpoint` and l.1911 `modal-class` are H. Estimating a mean from grouped data and the modal class are Foundation (S4). The averages page (F) links them. → Set to F.
- **[Spec] (Low)** l.843 `tangent` and l.2895 `segment` are H. Tangent, chord, arc, sector and segment are all Foundation vocabulary (G9). → Set to F. The tangent's theorems stay H on the circle-theorems page.
- **[Spec] (Low)** l.92 `indices-laws` is H, and l.731 `identity` is H. Laws of indices for integer powers (N7) and the ≡ symbol (A3) are Foundation. `expand` and `factorise` (F) embed `{term:identity}`, and the F indices topic lists `indices-laws` in its words strip, so an F page shows a Higher-only word. → Set to F, and keep negative and fractional powers flagged as Higher in the def.
- **[Spec] (Low)** l.652 `quadratic` is F, while the quadratic-equations topic is H. Each is defensible on its own, but they should agree (see topics).
- **[Maths] (Low)** l.76 `square-root` def says "The positive number that, multiplied by itself, gives…", but √0 = 0 is not positive. → "The number (0 or more) that…" or "The non-negative number…".
- **[Wording] (Medium)** l.880 `sine-rule` example states a problem ("Find side b…") and never gives the answer. Every other example finishes. → Add "b = 6 sin 45° ÷ sin 30° = 8.49 (to 2 d.p.)".
- **[Consistency] (Medium)** l.2633 `column-vector` example "In text we type it as (3, -2)." uses a hyphen-minus. It also writes a vector exactly like a coordinate, and `vector` (l.2729) writes "B − A = (4, 3)" and "(5, −12)" the same way. This is fine as a typing hint on screen, but for print it confuses vectors with points. → In the glossary, use the stacked column form in examples, mark the typed form as on-screen typing only, and use &minus;.
- **[Consistency] (Low)** Superscripts are mixed. `scale-factor` (l.764) has "k&sup2;" and then "k<sup>3</sup>". `compound-measure`, `density` and `pressure` (l.2346, 2417, 2435) use "cm<sup>3</sup>" and "m<sup>2</sup>", while `volume`, `area` and every page use &sup2;/&sup3;. The two render with different sizes and baselines. → Use &sup2;/&sup3; throughout.
- **[Consistency] (Low)** Half is mixed: `perpendicular-height`, `trapezium` and `semicircle` use &frac12;, `arc` uses &frac14;, `sector` uses &frac15;, and `included-angle` uses {frac:1/2}. → Use {frac:} consistently.
- **[Consistency] (Low)** l.3000 `iteration` example ends "7, 15, 31, ..." with ASCII dots; everywhere else uses &hellip;. l.3076 `asymptote` writes "y = 1/x" with a slash instead of {frac:1/x}.
- **[Wording] (Low)** l.3105 `conditional-probability` def says "The event you already know about is the denominator of the fraction." An event is not a denominator. → "The number of outcomes in the event you already know about goes in the denominator."
- **[Wording] (Low)** l.2928 `rational` def says "a whole number as the numerator and a whole number as the denominator". This leaves out negatives (−3/4) and zero denominators. → "an integer over a non-zero integer".
- **[Wording] (Low)** l.412 `sketch` watch says "Draw means accurate, with a ruler and compasses." Draw does not always need compasses. → "Draw means accurate, with a ruler (and a protractor or compasses where needed)."
- **[Wording] (Low)** l.2503 `enlargement` def does not mention the centre of enlargement, which GCSE requires for a full description. → Add "about a fixed point called the centre of enlargement".
- **[Consistency] (Low)** 22 terms are never linked with {term:} from any page: quotient, wage, salary, pence, profit, loss, discount, deposit, commission, raffle, tip, work-shift, composite-number, factor-tree, digit-sum, consecutive, completing-the-square, simplify, frustum, interior-angle, exterior-angle, diagonal and tolerance. Some appear only in "words" strips. interior-angle and exterior-angle even have figures, yet shapes-angles never links them. → Link them where the pages use the words, or accept glossary-only entries.
- **[Print] (Low)** The `watch` and `flip` fields and the term figures are designed for the pop-up. Check the print glossary/index includes them, and that "Use the Ans button" / "press SHIFT" (calculator-specific) is acceptable in print.
Checked: 290 terms

## topics (`src/book/topics.mjs`)
- **[Consistency] (High)** l.58 `inequalities` is tier F but `needs: [..., 'quadratic-equations']`, a Higher-only topic. A Foundation student is told to finish a Higher topic first, and the pyramid puts inequalities above it. → Drop quadratic-equations from needs; the quadratic-inequality part is a Higher extension within the page.
- **[Consistency] (Medium)** l.65 `bearings` (F) needs `trigonometry`. Foundation bearings (measuring, three figures, back bearings) need no trig. Only the trig/sine-rule bearing questions do, and sine-cosine-rules already needs bearings. → Needs only shapes-angles and ratio (scale drawing). If the trig section stays, mark it Higher.
- **[Spec] (Medium)** l.45 `quadratic-equations` is tier H. Expanding double brackets, factorising x² + bx + c and solving by factorising are Foundation (A4/A18); only a ≠ 1, completing the square and the formula are Higher. Foundation students on the resit route never see it. → Tier F with Higher chips, or split.
- **[Spec] (Medium)** l.47 `percentage-change` (Repeated percentage change) is tier H, but compound interest, depreciation and repeated percentage change are Foundation (R16). This is also why the resit-to-grade-4 route skips it. → Tier F.
- **[Spec] (Low)** l.62 `vectors` is tier H, but column vectors, addition and scalar multiples are Foundation (G24/G25); only vector proof is Higher. → Tier F with Higher chips on the proof section.
- **[Spec] (Low)** l.68 `bounds` is tier H, but error intervals and truncation (N15) are Foundation; only bounds in calculations (N16) are Higher. → Note it, or tier F with Higher chips.
- **[Consistency] (Low)** l.63 `constructions-loci` needs `circles`. Constructions use compasses, but nothing on the circles topic (π, area) is a prerequisite. → Needs shapes-angles only, or note why.
- **[Wording] (Low)** l.45 the quadratic-equations flip "Factorising and expanding" has no verb pattern like the others ("Finding…, and finding…"), and it describes factorising/expanding rather than solving. → "Solving by factorising, and building the equation from its roots".
- **[Wording] (Low)** l.27 the four-operations flip "Multiplying and dividing; adding and subtracting" is the only one that uses a semicolon. → "Adding and subtracting, and multiplying and dividing".
- **[Consistency] (Low)** l.25 and l.40 and l.49: the comments "What the pilot topics unlock (planned)" and "Next up (planned)" are stale, because every topic is now `live`. These are source comments only.
Checked: 42 topics

## spec-refs (`src/book/spec-refs.mjs`)
- **[Spec] (Medium)** `probability-basics` maps to P6–P9 only. It leaves out P1–P5 (recording outcomes, relative frequency, the 0–1 scale, P(not A) = 1 − P(A), expected outcomes), which are its core. Its own flip is P4. P9 (conditional) belongs to conditional-probability. → ["P1","P2","P3","P4","P5","P6","P7","P8"].
- **[Spec] (Low)** `conditional-probability` maps to P9 only, but tree diagrams for dependent events are P8. → Add P8.
- **[Spec] (Low)** `similarity` maps to G5 (triangle congruence criteria) but leaves out G6 (proofs using congruence and similarity). G5 fits only if the page teaches SSS/SAS/ASA/RHS. → Check the page, and add G6 if proofs are there.
- **[Spec] (Low)** `averages` maps to S6 (scatter graphs). Check the averages page covers scatter/correlation; if it does not, remove S6, which would leave scatter graphs unmapped anywhere, so consider a planned topic. `place-value` maps to N15 (rounding), which is right, but N13 (standard units, money, time) is never mapped.
- **[Spec] (Low)** `transformations` leaves out G24 (translations as column vectors), which the page teaches. → Add G24. `circles` leaves out G9's circle-theorem part, which is fine.
- **[Spec] (Low)** No topic maps N5 (systematic listing / product rule), A6 (identities, argument), A7 (functions), A15/A16 (area under graphs, circle equation), R2 (scale factors/diagrams/maps), R8 (ratio to linear functions), R15 (gradients of curves) or G6, G11–G14, S1, S5. These are gaps to note if the book claims full spec coverage.
- The statement paraphrases match the DfE numbering (N1–16, A1–25, R1–16, G1–25, P1–9, S1–6).
Checked: 42 topic mappings, 66 statements

## route (`src/book/route.mjs`)
- **[Wording] (Low)** l.97 the `full` blurb says "Four topics a week", but weeks 11 and 12 hold 2 topics plus papers and papers only. → "About four topics a week".
- **[Consistency] (Low)** l.116 the `weak` blurb says "the 'Check your knowledge' questions at the end of a topic", but Check your knowledge sets come after every chunk. The end-of-topic set is "Check your knowledge: mixed review". → Name that set.
- **[Spec] (Low)** The `resit` route (grade 4) leaves out coordinates-graphs, indices, circles and percentage-change, which are all common grade 3–4 content (percentage-change only because it is wrongly tiered H). → Consider them once tiers are fixed.
- The full route contains all 42 live topics exactly once, which I checked.
Checked: 4 routes

## term-figures (`src/book/term-figures.mjs`)
- **[Figure] (Medium)** l.68 `regular-polygon` has hexagon points (80,8),(124,30),(124,70),(80,92),(36,70),(36,30). Its slanted sides are about 49.2 and its vertical sides 40, so it is not regular, yet it is labelled "all equal". → Use pt() on a radius of 44 at 30°+60°k.
- **[Figure] (Low)** l.58 `chord`: the endpoints (48,78) and (120,38) are 42.5 and 41.8 from the centre, against a radius of 40, so the chord pokes past the circle. → Compute the endpoints with pt(80,50,40,θ).
- **[Figure] (Low)** l.47 `interior-angle`: the arcs at (30,80) and (130,80) span 0–31° and 148–180°, but the true angles are about 40.6° and 63.4° (116.6–180°). The arcs cover only part of each angle. → Use arc ends that match the sides.
- The alternate, corresponding, co-interior, vertically-opposite, reflection, number-line, place-value, fraction (3 of 8), tangent, hypotenuse and exterior-angle figures are all correct.
Checked: 33 figures

## Cross-book consistency
Swept the visible text of all 54 `src/pages/books/gcse/*.html` files, with tags and scripts stripped.
- **[Consistency] (Medium)** Thousands separators. Comma style ("4,563", "1,456", "6,003"): place-value (77 lines), four-operations (39), factors-multiples, squares-roots, shapes-angles, iteration, functions-graphs, command-words, diagnostic. Space style ("10 000 cm²", "35 000", "1 000 000"): area-perimeter (13), indices (32), compound-measures (13), similarity (12), bearings (7), ratio, pythagoras, averages, surds, foundation, stretch. Money usually has no separator ("&pound;1000" ×19, "&pound;5760", "&pound;6461"). → One house rule: no separator for 4 digits, a thin space from 5 digits, and the same for money.
- **[Consistency] (Medium)** In the worked solutions on `sine-cosine-rules.html` lines 171 and 250, "{frac:-47/70} = -0.6714&hellip;" and "{frac:-5/160} = -0.0312&hellip;" use a hyphen-minus in printed maths. Every other page uses &minus;; iteration and quadratic-equations use {frac:&minus;…}. The values themselves are correct. → &minus;.
- **[Consistency] (Low)** `simultaneous-equations.html` l.209 has "Answer: -2,11" in a worked solution. Typed-answer hints elsewhere ("Type it like (3, -2)" in transformations and vectors, "-2,5" in simultaneous) use hyphen-minus on purpose and consistently; that is fine on screen but meaningless on paper (see Print). In solutions, use &minus; and normal notation (x = &minus;2, y = 11).
- **[Consistency] (Low)** `indices.html` lines 880 and 886: the wrong-answer messages "Write it as 3^2" and "Break it down as 3^2 × 5" use caret notation in feedback text. → 3&sup2;, unless the student is being told what to type, in which case say "type 3^2".
- **[Consistency] (Medium)** Section heading names. Every topic page has Warm-up, Flip it, Spot the mistake, Exam style, Why it works, Common traps and I can… (42 of 42). But `transformations.html` l.442 and `vectors.html` l.356 title the section "Check your knowledge: going further" where the other 40 have "Going further". `algebra-basics.html` has two (l.573 "Going further" and l.591 "Going further: double brackets"). Four pages have a trailing space in the heading source "Going further " (iteration l.276, percentage-change l.567, quadratic-equations l.954, sine-cosine-rules l.298), which is harmless. → Rename the two to "Going further".
- **[Consistency] (Low)** Chunk numbering: `transformations.html` uses "3b. Reflecting in the line y = x" and "5b. Negative scale factors and area". No other page uses sub-lettered h2s. Several pages add unnumbered h2 chunks: "Bigger bottoms" (algebraic-fractions), "Short proofs" (circle-theorems), "Circles inside other shapes" (circles), "Density in kg/m³" (compound-measures), "Adding and subtracting in standard form" (indices), "Negatives, powers and hidden brackets" (order-of-operations), "A proof you can check" (pythagoras), "Exact values of sin, cos and tan" (trigonometry). → Number them like the other chunks, or make them h3s, so the print contents list reads consistently.
- **[Consistency] (Medium)** Marks labels. The house style is "[N marks]" in a qtag (44 pages), and the singular "[1 mark]" is correctly used on 6. But `solving-equations.html` lines 449, 483, 508 and 531 use "Question 1 (5 marks): perimeter" in h3 headings, the only round-bracket marks on any page. → "[5 marks]".
- **[Consistency] (Low)** Tier labels are consistent: 165 instances of `chip chip-higher` "Higher" and no "H" or "Higher only" variants. Grade and paper tags ("Grade 8", "Non-calculator", "Paper task") appear on only a handful of questions. This is fine, but note it for print.
- **[Consistency] (Low)** Units. Visible text consistently uses symbols with a space ("5 cm", "4 m", "60 km/h"), with no unspaced "5cm" anywhere. Figure descriptions spell out "centimetres"/"metres" on purpose for screen readers. Squared and cubed units are almost all &sup2;/&sup3;, except `compound-measures.html` (one each of cm<sup>3</sup>, m<sup>2</sup>, m<sup>3</sup>) and the glossary (above). → Use &sup2;/&sup3;. No "cm^2" appears in prose; the only carets are typing hints.
- **[Consistency] (Low)** Spelling. I found no American spellings in the visible text: no color, center, meter, gray or program, and no -ize words except "size" and "prize".
- **[Consistency] (Low)** Multiplication. No "3 x 4" in visible prose; × is used throughout. The only x-for-times is the typing hint "3.2x10^5" for standard form, which is fine on screen and needs a print treatment.
- **[Print] (Medium)** Across the whole book, "Type it like (3, -2)", "Type them like (2, 5)", "type x first, then y, with a comma and no brackets, like 4,1" and "Type x squared as x^2" are on-screen answer-box instructions in question text: about 40 in vectors and transformations, plus coordinates-graphs, simultaneous-equations, sequences, functions-graphs, quadratic-equations and indices. On paper they are noise, and they teach a non-standard notation. → Put typing hints in a screen-only element (a class hidden by @media print) rather than in the question text.


