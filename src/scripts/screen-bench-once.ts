import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { getAiRuntime } from '../ai-runtime';
import { askForJson } from '../ai-json';
import { config } from '../config';
import { createLimiter } from '../concurrency';
import { logger } from '../logger';
import { loadKeywordMatcher } from '../resume/keyword-matcher';
import { extractResumeText } from '../resume/resume-text';
import { anchorScreenReply } from '../screening/anchor';
import { gateConfusion, kendallTau, parseRanking, precisionAtK, stability, type GateWord } from '../screening/bench';
import {
  buildComparePrompt,
  buildScreenPrompt,
  COMPARE_MAX_TOKENS,
  COMPARE_TIMEOUT_MS,
  parseCompareResponse,
  parseScreenResponse,
  SCREEN_MAX_TOKENS,
  SCREEN_TIMEOUT_MS,
} from '../screening/prompts';
import { anchorCompareReply, comparisonView, readingsAgreement, secondOrder } from '../screening/comparison';
import { findLeaks, redactApplicant } from '../screening/redact';
import { readRubric } from '../screening/rubric';
import { orderVerdicts, scoreScreening } from '../screening/score';

/*
 * The screening bench (hr-screening-plan.md stage 0, plan §6 stage E): a
 * gold set — a posting, its criteria, resumes and a human's order — run
 * through the same redact → prompt → anchor → score path the screening
 * uses, with nothing written to the database. Prints, per set: the
 * table's order against the human's (Kendall τ, precision@5), the score
 * movement between runs (stability), the redaction leak check, the
 * tailoring pairs, and the gate confusion when expected.json says what a
 * human read. With --compare, the first run's top three are read head to
 * head twice, the second time in reverse (ADR 0051), and the line says how
 * far the two readings agree (TASKS E10) — two more calls a set. Spends AI;
 * hand-run, never CI.
 *
 *   npm run bench:screen                         # every set under src/screening/fixtures/gold
 *   npm run bench:screen -- --set qa-automation --runs 2 --out bench.json
 *   npm run bench:screen -- --set qa-automation --compare
 */

const GOLD = join(__dirname, '..', 'screening', 'fixtures', 'gold');
const RESUME_EXT = new Set(['.pdf', '.docx', '.md', '.txt']);

interface Run {
  scores: Record<string, number>;
  order: string[];
  gates: Record<string, Record<string, GateWord>>;
  leaks: Record<string, string[]>;
}

/** The head-to-head the bench reads with --compare: the table's top of the first run. */
const COMPARE_TOP = 3;

function flag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  return i === -1 ? null : (argv[i + 1] ?? null);
}

async function runSet(
  dir: string,
  runs: number,
  compare: boolean,
): Promise<{ name: string; runs: Run[]; ranking: string[]; expected: Record<string, Record<string, GateWord>> | null; agreement: ReturnType<typeof readingsAgreement> | null }> {
  const name = basename(dir);
  const posting = readFileSync(join(dir, 'posting.txt'), 'utf8');
  const rubric = readRubric(JSON.parse(readFileSync(join(dir, 'rubric.json'), 'utf8')));
  const ranking = parseRanking(readFileSync(join(dir, 'ranking.txt'), 'utf8'));
  const expected = existsSync(join(dir, 'expected.json')) ? (JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8')) as Record<string, Record<string, GateWord>>) : null;
  const files = readdirSync(join(dir, 'resumes'))
    .filter((f) => RESUME_EXT.has(extname(f).toLowerCase()))
    .sort();
  const runtime = await getAiRuntime();
  const matcher = await loadKeywordMatcher();
  // The same pacing as the screening's batch — thirty resumes are thirty calls, AI_CONCURRENCY at a time.
  const limit = createLimiter(config.AI_CONCURRENCY);
  const job = { id: 0, title: posting.split('\n')[0] ?? name, companyName: name, location: '', description: posting };
  const texts: { file: string; number: number; redacted: string; identity: { name: string | null; email: string | null; phone: string | null } }[] = [];
  for (const [i, file] of files.entries()) {
    const text = await extractResumeText(file, readFileSync(join(dir, 'resumes', file)));
    const red = redactApplicant(text, i + 1);
    texts.push({ file, number: i + 1, redacted: red.text, identity: { name: red.name, email: red.email, phone: red.phone } });
  }
  const out: Run[] = [];
  for (let r = 0; r < runs; r++) {
    const run: Run = { scores: {}, order: [], gates: {}, leaks: {} };
    const verdicts: { number: number; file: string; gateBucket: 'pass' | 'ask' | 'fail'; score: number; confidence: 'high' | 'medium' | 'low' }[] = [];
    await Promise.all(
      texts.map((t) => limit(async () => {
        const started = Date.now();
        const answer = await askForJson(
          runtime,
          { ...buildScreenPrompt({ rubric, job, applicantText: t.redacted, number: t.number }), maxTokens: SCREEN_MAX_TOKENS, label: 'screening-bench', role: 'resume', timeoutMs: SCREEN_TIMEOUT_MS },
          parseScreenResponse,
          { set: name, file: t.file },
        );
        if (!answer) {
          process.stdout.write(`  ${t.file}: no answer\n`);
          return;
        }
        const anchored = anchorScreenReply(answer.data, t.redacted, rubric, matcher);
        const bd = scoreScreening({ rubric, reply: anchored.reply, textChars: t.redacted.length, now: new Date() });
        run.scores[t.file] = bd.score;
        run.gates[t.file] = Object.fromEntries(bd.rows.filter((row) => row.mode === 'gate').map((row) => [row.id, (row.gate ?? 'unknown') as GateWord]));
        run.leaks[t.file] = findLeaks(t.redacted, t.identity);
        verdicts.push({ number: t.number, file: t.file, gateBucket: bd.gateBucket, score: bd.score, confidence: bd.confidence.band });
        process.stdout.write(`  run ${r + 1} ${t.file}: ${bd.score} ${bd.gateBucket} (${Math.round((Date.now() - started) / 1000)} s, ${answer.model})\n`);
      })),
    );
    run.order = orderVerdicts(verdicts).map((v) => v.file);
    out.push(run);
  }
  let agreement: ReturnType<typeof readingsAgreement> | null = null;
  const top = (out[0]?.order ?? []).slice(0, COMPARE_TOP).map((f) => texts.find((t) => t.file === f)!);
  if (compare && top.length >= 2) {
    const shortlist = new Map(top.map((t) => [t.number, t.redacted]));
    const reading = async (shown: typeof top) => {
      const answer = await askForJson(
        runtime,
        { ...buildComparePrompt({ rubric, job, applicants: shown.map((t) => ({ number: t.number, text: t.redacted })) }), maxTokens: COMPARE_MAX_TOKENS, label: 'screening-bench', role: 'resume', timeoutMs: COMPARE_TIMEOUT_MS },
        parseCompareResponse,
        { set: name, compare: shown.map((t) => t.file) },
      );
      return answer ? { shown: shown.map((t) => t.number), reply: anchorCompareReply(answer.data, shortlist, rubric, matcher).reply } : null;
    };
    const [a, b] = await Promise.all([reading(top), reading(secondOrder(top))]);
    if (a && b) agreement = readingsAgreement(comparisonView({ v: 1, readings: [a, b] }, rubric));
  }
  return { name, runs: out, ranking, expected, agreement };
}

function report(set: Awaited<ReturnType<typeof runSet>>): void {
  const first = set.runs[0];
  if (!first) return;
  const lines: string[] = [`== ${set.name}: ${Object.keys(first.scores).length} resumes, ${set.runs.length} run${set.runs.length === 1 ? '' : 's'}`];
  lines.push(`  human:  ${set.ranking.join(' › ')}`);
  lines.push(`  table:  ${first.order.join(' › ')}`);
  const tau = kendallTau(set.ranking, first.order);
  const p5 = precisionAtK(set.ranking, first.order, 5);
  lines.push(`  Kendall τ ${tau === null ? 'n/a' : tau} · precision@${p5.k} ${p5.hit}/${p5.k}`);
  if (set.runs.length > 1) {
    const s = stability(first.scores, set.runs[1]!.scores);
    lines.push(`  stability run 1 → 2: mean |Δ| ${s.mean}, max ${s.max}${s.moved[0] ? ` (${s.moved[0].id} ${s.moved[0].delta > 0 ? '+' : ''}${s.moved[0].delta})` : ''}`);
  }
  const leaked = Object.entries(first.leaks).filter(([, l]) => l.length > 0);
  lines.push(`  redaction: ${leaked.length === 0 ? 'nothing identifying reached the model' : leaked.map(([f, l]) => `${f}: ${l.join(', ')}`).join('; ')}`);
  const pairs = Object.keys(first.scores).filter((f) => /\.tailored\.[a-z]+$/.test(f));
  for (const t of pairs) {
    const original = t.replace(/\.tailored(\.[a-z]+)$/, '$1');
    if (original in first.scores) lines.push(`  tailoring: ${original} ${first.scores[original]} → ${t} ${first.scores[t]} (Δ ${first.scores[t]! - first.scores[original]!})`);
  }
  if (set.expected) {
    const pairsG: { expected: GateWord; got: GateWord }[] = [];
    for (const [file, gates] of Object.entries(set.expected)) for (const [id, want] of Object.entries(gates)) if (first.gates[file]?.[id]) pairsG.push({ expected: want, got: first.gates[file]![id]! });
    const g = gateConfusion(pairsG);
    lines.push(`  gates: ${g.agree}/${g.total} as the human read them${g.total > 0 ? ` (pass read as unknown: ${g.matrix.pass.unknown}, unknown read as pass: ${g.matrix.unknown.pass}, fail read as pass: ${g.matrix.fail.pass})` : ''}`);
  }
  const a = set.agreement;
  if (a) {
    lines.push(
      `  readings (top ${COMPARE_TOP}, twice): first place ${a.firstAgree ? 'agreed' : 'differed'}, order ${a.orderAgree ? 'agreed' : 'differed'}, ${a.criteriaDisagree} of ${a.criteriaAnswered} criteria disagree`,
    );
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const only = flag(argv, '--set');
  const runs = Math.max(1, Number(flag(argv, '--runs') ?? 1));
  const outFile = flag(argv, '--out');
  const sets = readdirSync(GOLD, { withFileTypes: true })
    .filter((e) => e.isDirectory() && (!only || e.name === only))
    .map((e) => join(GOLD, e.name));
  if (sets.length === 0) throw new Error(`no gold set${only ? ` named ${only}` : ''} under ${GOLD}`);
  const results = [];
  for (const dir of sets) {
    const set = await runSet(dir, runs, argv.includes('--compare'));
    report(set);
    results.push(set);
  }
  if (outFile) writeFileSync(outFile, JSON.stringify(results, null, 2));
}

main().catch((err) => {
  logger.error({ err }, 'bench:screen failed');
  process.exitCode = 1;
});
