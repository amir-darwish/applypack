# The resume summary

What a summary is for, what the people who read resumes for a living say a
good one looks like, and where ApplyPack applies each rule. The prompt rules
(`prompts.ts:RULE_SUMMARY_STYLE`) and the card's checklist
(`summary-guide.ts`) both come from this page.

## What it is for

A recruiter's first pass over a resume takes 6 to 8 seconds. The title, the
headline and the summary take about a quarter of it; the current role takes
most of the rest. In that time the summary has one job: answer "is this the
person for **this** role?" before the reader moves down to the experience.

The ATS reads the summary too. Recruiters search their ATS by job title and
by skills, and the summary sits in the top third of page one, where the
posting's words count most.

It is not a career history and it is not an objective. "Seeking a challenging
role" says what the candidate wants. The summary should say what the employer
gets.

## What a good one looks like

The guides below agree on most of it:

| | Rule |
| --- | --- |
| Length | 2–4 sentences, three is the norm, about 40–75 words (five lines at most). Four or five sentences start to read as a block the eye skips |
| Sentence 1 | Who: the role in the posting's own words, the years, the core stack |
| Sentence 2 | Proof: one real result, with a number, aimed at what this employer screens for |
| Sentence 3 | Fit: what the candidate brings to this role's main responsibilities, in the posting's vocabulary |
| Keywords | Two to four of the posting's must-haves, spelled as the posting spells them |
| Voice | Implied first person: no "I", "my", "me", no name |
| Never | An objective, what the candidate wants, a list of ten technologies, the years twice, adjectives with nothing behind them ("passionate", "results-driven", "team player"), a claim the candidate cannot back in an interview |

Two warnings recur. A generic summary, the kind a hundred other engineers
could have written, is worse than none, and recruiters say they spot
AI-written ones at once. Every phrase therefore has to come from the resume's
own facts. And a summary that names what the candidate does not have is a
claim they will have to defend in the interview.

## How ApplyPack applies it

- **The wording.** When the comparison grades the summary below `strong` (it
  names fewer than two of the posting's must-haves), the report owes one
  high-priority action with a complete new summary. A resume without a summary
  gets one as an addition under the headline. The prompt's SUMMARY RULES hold
  the table above. One rule came from a live failure: when the posting offers
  alternatives ("PHP and/or Java"), the summary names only the one the resume
  has.
- **The gate.** The wording passes `replacement-gate.ts` like every other
  suggestion: no invented figure, no `cannot_claim` keyword. When the gate
  refuses a title or summary wording, `rewrite.ts:rewriteRefusedLeads` asks
  once more with the refusal in sight, so the card is not left with an
  instruction and no text.
- **The checklist.** `summary-guide.ts` checks the summary against the table
  on every render, with no AI: the role, the years, the core stack, the
  must-haves, one number, the length, the voice, and the posting's terms the
  resume cannot back. It sits above the summary card with the brief's "read
  first by" line, and it runs the same checks on the suggested summary
  ("yours: 5 of 8 · the suggestion below: 8 of 8"). The user sees what this
  reader looks for, not only our version of it. It reads the text the
  comparison analysed, so an edit in the editor shows up after the next
  analysis.

## Sources

- Ladders, *Eye-Tracking Study* (2018): 7.4 seconds on average; title,
  current role and dates first. https://www.theladders.com/career-advice/you-only-get-6-seconds-of-fame-make-it-count
- HR Dive on the same study: https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/
- Jobscan, *How to Write a Resume Summary*: two to five sentences, the job
  title from the posting, two or three of its skills, one quantified result;
  recruiters filter by skills and title. https://www.jobscan.co/blog/resume-summary/
- Indeed Career Guide, *Writing a Resume Summary*: three to five sentences,
  placed under the contact line, no pronouns. https://www.indeed.com/career-advice/resumes-cover-letters/writing-a-resume-summary-with-examples
- Austen McDonald and Neo Kim, *Software Engineer Resume*: always include
  one, two or three sentences, tailored, never generic or AI-flavoured.
  https://newsletter.systemdesign.one/p/software-engineer-resume
- The Interview Guys, *Software Engineer Resume Summary Examples*: role and
  level, then strengths, then one achievement, then what the candidate brings;
  mirror the posting's technology names. https://blog.theinterviewguys.com/software-engineer-resume-summary-examples/
