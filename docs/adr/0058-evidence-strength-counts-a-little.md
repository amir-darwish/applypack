# 0058 — How strongly the text shows a term counts, a little (score v6)

**Status:** Accepted (2026-09-28). TASKS R7, with R8 beside it; the plan's
question Q18. Amends ADR 0012 (the deterministic score) and ADR 0045 (the
text decides presence).

## Context

Since v1.70.0 every keyword carries an `evidence` grade, read off the resume
text by `evidence.ts` and never asked of the model:

- `listed`: named on a list of terms — a skills line, a stack line.
- `described`: inside a sentence about work that was done.
- `measured`: that sentence also carries a number.

The badge ("skills line only", "with a number") and the advice ladder
("Show Kafka in a bullet, not only on the skills line") read it. The score did
not: `evidence.ts` said so on purpose — one scoring change at a time, and this
one wanted measuring first.

The cost of not counting it was a number that disagreed with its own page.
A resume that names Kafka on a skills line and a resume that says "ran the
Kafka pipeline for 2M events a day" earned the same credit. Meanwhile the
line under the score said the first "proves nothing to a human reader" and
`readyToApply` refused to say "send it". A recruiter reads the two completely
differently, and so does every screening rubric, ours included (the employer
side's rungs start at `listed`).

## Measurement

Measured before choosing, by pure recompute: no AI call. Two local backups
(2026-09-04 and 2026-09-21) were restored into scratch databases. Every
stored comparison with a text snapshot (31 rows, 8 resume–posting pairs) was
graded again off its own snapshot and scored with a factor on each present
term whose best evidence is `listed`:

| factor | rows moved | median | worst | mean |
| --- | --- | --- | --- | --- |
| 0.90 | 26 of 31 | −2 | −3 | −1.5 |
| **0.85** | 28 of 31 | −2 | −5 | −2.4 |
| 0.80 | 28 of 31 | −3 | −7 | −3.1 |
| 0.75 | 28 of 31 | −4 | −9 | −3.9 |

The worst rows were resumes that list ten or eleven of the posting's must-haves
on a skills line and show none at work. On the two pairs with five and six
stored runs, the spread `variance:compare` reads moved by at most one point.
The grade is deterministic off the text, so it adds no model variance of its
own; it only follows which terms the run calls present.

## Decision

- **Score v6: a `present` term whose best evidence is `listed` earns
  `SCORING.listedCredit` = 0.85 of its credit.** `described` and `measured`
  earn all of it. The factor multiplies the term's credit, before the
  requirement weight and before an either/or group folds (a group takes its
  best member). A term that is not written (`add`, `ask_user`, `cannot_claim`)
  is untouched.
- **It moves nothing else.** The primary-stack cap asks whether the candidate
  HAS the stack, and a listed term is had. The ceiling keeps full credit,
  because writing the work the term was used for is the edit that earns it —
  the advice the page already gives.
- **The live ring agrees with the stored number.** `src/web/public/evidence.mjs`
  is the browser copy of `evidence.ts`. `target.mjs:scoreKeywords` grades every
  row on every keystroke, and `score.mjs:entriesFromLive` applies the same
  factor. `src/web/evidence.test.ts` runs both graders over one corpus, and
  `src/web/score.test.ts` holds the live and the server score equal, edit by
  edit.
- **Every write path grades.** `match.ts` already did. `keyword-overrides.ts:
  addKeyword` grades a term the user types. `store.ts:rescoreMatchKeywords`
  grades any row that has no grade yet (`evidence.ts:withEvidence`), off the
  text that comparison judged.
- **A row scored before v6 keeps its number until it is scored again.** A
  keyword with no grade earns full credit. "Shown at work" moves from what the
  score does not count to what made the number on v6 rows only. The targeted
  view's live ring is a live reading, as at every earlier version bump: it
  reads any row with today's formula, so on an older row it can sit a few
  points under the stored number until the next analysis or keyword edit
  stores a v6 one.

## What is not counted: recency (R8)

Each present term also shows how long and how lately the dated roles name it
(`src/resume/usage.ts`, over `structure-from-text.ts` and `screening/dates.ts`):
"3.8 yrs at work · 6 yrs ago" beside the keyword, amber past 36 months (the
employer side's "within 36 months" rule). It is read on every view, never
stored, and **not scored**. A term used six years ago is still a term the
candidate has, and how much a posting minds is the posting's to say. The
employer side makes it an explicit rubric choice for the same reason
(ADR 0050). Counting it would need its own measurement and its own ADR.

## Consequences

- Most comparisons read a few points lower than the same row under v5. The
  measurement's median is −2; the worst is about −5 on the stored rows, and
  60 × 0.15 = 9 points at the very most.
- The number now moves when the candidate moves a term from the skills line
  into a bullet — the edit the page has always asked for.
- Two graders to keep in step, the way `score.ts` and `score.mjs` already are.
  The parity test fails the build the moment they disagree.
