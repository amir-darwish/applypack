import { factCheck, type FactClaim } from './fact-check';
import type { ResumeReviewResult } from './prompts';

/*
 * The strength review's "example" rewrites through the fact gate a match
 * suggestion and a letter already pass (TASKS R3, ADR 0020). The prompt asks
 * for rewrites built only from the resume's own facts; this checks that it
 * got them. A blocked example is not shown: the advice keeps its fix, and the
 * fact the rewrite reached for becomes the question — asking is the honest
 * path to a stronger line. Pure: review.ts passes the sources.
 */

type ReviewAdvice = ResumeReviewResult['advice'][number];

/** The question a rewrite that reached past the resume should have asked instead. */
function questionFor(claim: FactClaim): string {
  switch (claim.kind) {
    case 'metric':
      return `The example used ${claim.text}, which the resume does not show. What is the real figure here?`;
    case 'tool':
      return `The example named ${claim.text}, which the resume does not. Did you use it here?`;
    default:
      return `The example named "${claim.text}", which the resume does not show. Is that right?`;
  }
}

export function gateReviewAdvice(
  advice: readonly ReviewAdvice[],
  /** The resume's text, and the figures the candidate supplied in earlier answers. */
  sources: string[],
): { advice: ReviewAdvice[]; blocked: number } {
  let blocked = 0;
  const gated = advice.map((a) => {
    if (!a.example) return a;
    const check = factCheck({ text: a.example, sources });
    if (check.verdict !== 'block') return a;
    blocked++;
    const claim = check.claims.find((c) => c.status === 'unsupported');
    return { ...a, example: null, ask: a.ask ?? (claim ? questionFor(claim) : null) };
  });
  return { advice: gated, blocked };
}
