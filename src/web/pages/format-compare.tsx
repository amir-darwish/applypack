/** @jsxImportSource hono/jsx */
import type { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { Badge, Card, Hint, PageHeader, SectionTitle } from '../ui';
import type { DiffList, FormatComparison, FormatReading } from '../format-compare';
import { ParsedViewBlock } from './parsed-view-block';

/*
 * The same resume as two files, read side by side (TASKS R14): which one a
 * plain parser reads better, what each gives, and the lines where they
 * differ. Rendered from the upload, never stored.
 */

export interface FormatComparePageProps {
  resume: { id: number; name: string };
  /** The saved file's name and the uploaded one's. */
  files: [string, string];
  result: FormatComparison;
}

function verdict(r: FormatComparison): string {
  if (r.identical) return 'The two files read exactly alike: a parser gets the same text from either, so send whichever you like.';
  if (r.better === 'same') return 'A plain parser finds the same parts in both. Their text differs in the lines below — read them before you choose.';
  const [winner, loser] = r.better === 'a' ? [r.a, r.b] : [r.b, r.a];
  return `${winner.name[0]!.toUpperCase()}${winner.name.slice(1)} reads better: send it rather than ${loser.name} where a form lets you choose.`;
}

const Side: FC<{ reading: FormatReading; file: string }> = ({ reading, file }) => (
  <Card>
    <SectionTitle>{reading.label}</SectionTitle>
    <p class="-mt-2 mb-3 break-all text-xs text-ink-faint">{file}</p>
    <ParsedViewBlock view={reading.view} />
    {reading.warnings.length === 0 ? (
      <Hint>No parse warnings.</Hint>
    ) : (
      <ul class="space-y-1.5">
        {reading.warnings.map((w) => (
          <li class="text-sm text-ink-muted">
            <Badge tone="warn">warning</Badge> {w}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const More: FC<{ list: DiffList<unknown> }> = ({ list }) =>
  list.total > list.lines.length ? <li class="text-xs text-ink-faint">and {list.total - list.lines.length} more</li> : null;

const Lines: FC<{ title: string; list: DiffList<string> }> = ({ title, list }) =>
  list.total === 0 ? null : (
    <div>
      <h3 class="text-label text-ink">{title}</h3>
      <ul class="mt-1.5 space-y-1 font-mono text-xs leading-5 text-ink-muted">
        {list.lines.map((line) => (
          <li class="break-words">{line}</li>
        ))}
        <More list={list} />
      </ul>
    </div>
  );

export const FormatComparePage: FC<FormatComparePageProps> = ({ resume, files, result }) => {
  const { a, b, changed } = result;
  const differs = result.onlyA.total + result.onlyB.total + result.moved.total + changed.total > 0;
  return (
    <Layout title={`Two files — ${resume.name}`} active="resumes">
      <PageHeader
        title="Two files, one resume"
        meta={`${resume.name} · what a parser reads from each`}
        back={{ href: `/resumes/${resume.id}#ats`, label: 'Back to the resume' }}
      />
      <Card>
        <p class="text-sm leading-6 text-ink">{verdict(result)}</p>
        {result.reasons.length > 0 && (
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {result.reasons.map((reason) => (
              <li>{reason}</li>
            ))}
          </ul>
        )}
        <Hint class="mt-3">
          Measured in the order an ATS needs them — email and phone, roles with their dates, roles, sections, link and
          location, warnings — and the first that differs decides. The same plain reader as "What the ATS sees": no AI, and the uploaded file was not
          kept.
        </Hint>
      </Card>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <Side reading={a} file={files[0]} />
        <Side reading={b} file={files[1]} />
      </div>

      {!result.identical && (
        <Card class="mt-4">
          <SectionTitle>Where the text differs</SectionTitle>
          {differs ? (
            <div class="space-y-4">
              <Lines title={`Only in ${a.name}`} list={result.onlyA} />
              <Lines title={`Only in ${b.name}`} list={result.onlyB} />
              <Lines title="In both, in a different place" list={result.moved} />
              {changed.total > 0 && (
                <div>
                  <h3 class="text-label text-ink">Read differently</h3>
                  <ul class="mt-1.5 space-y-2 font-mono text-xs leading-5">
                    {changed.lines.map((pair) => (
                      <li class="break-words">
                        <div class="text-ink-muted">
                          {a.label}: {pair.a}
                        </div>
                        <div class="text-ink">
                          {b.label}: {pair.b}
                        </div>
                      </li>
                    ))}
                    <More list={changed} />
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Hint>The same lines in the same order — only spacing, capitals or the heading and bullet marks differ, and a parser reads past those.</Hint>
          )}
        </Card>
      )}
    </Layout>
  );
};
