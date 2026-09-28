/** @jsxImportSource hono/jsx */
import type { FC } from 'hono/jsx';
import { Card, Disclosure, SectionTitle, Table, Td, Tr } from '../ui';
import { reasonsText, stageCount, type FunnelReason, type FunnelView } from '../../funnel';
import type { SourceYield } from '../../jobs/funnel-store';

/**
 * The search funnel on /runs (TASKS §20 `search-funnel`): the stages over the
 * last 7 and 30 days, why the filter and the scoring set postings aside, and
 * what each source brought. Zero AI — the numbers every tick already writes.
 */
export const FunnelCard: FC<{ week: FunnelView; month: FunnelView; sources: SourceYield[] }> = ({ week, month, sources }) => (
  <section id="funnel" class="mb-8">
    <SectionTitle level="section">Search funnel</SectionTitle>
    <Card flush>
      <Table
        caption="Search funnel"
        columns={['Stage', 'Last 7 days', 'Last 30 days']}
        widths={['w-[47%]', 'w-[24%]', 'w-[28%]']}
        thClasses={['', 'text-right', 'text-right']}
      >
        {month.stages.map((stage) => (
          <Tr>
            <Td class="text-ink">{stage.label}</Td>
            <Td class="text-right tabular-nums text-ink">{count(stageCount(week, stage.key))}</Td>
            <Td class="text-right tabular-nums text-ink-muted">{count(stage.count)}</Td>
          </Tr>
        ))}
      </Table>
      <div class="space-y-1 border-t border-line px-3.5 py-3 text-note leading-5 text-ink-muted sm:px-5">
        <ReasonLine title="Set aside by the filter" reasons={month.filtered} />
        <ReasonLine title="Dismissed after scoring" reasons={month.dismissed} />
        {sources.length > 0 && (
          <Disclosure summary="By source, last 30 days" class="pt-1">
            <div class="mt-2 overflow-hidden rounded-lg border border-line">
              <Table
                caption="What each source brought in the last 30 days"
                columns={['Source', 'New', 'Matches']}
                widths={['w-[47%]', 'w-[24%]', 'w-[28%]']}
                thClasses={['', 'text-right', 'text-right']}
              >
                {sources.map((s) => (
                  <Tr>
                    <Td class="text-ink">{s.name}</Td>
                    <Td class="text-right tabular-nums">{count(s.stored)}</Td>
                    <Td class="text-right tabular-nums">{count(s.matches)}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </Disclosure>
        )}
      </div>
    </Card>
  </section>
);

/** "Set aside by the filter, 30 days: 4,900 without a title keyword, …" — nothing when nothing was. */
const ReasonLine: FC<{ title: string; reasons: FunnelReason[] }> = ({ title, reasons }) =>
  reasons.length > 0 ? (
    <p>
      <span class="font-medium text-ink">{title}, 30 days:</span> {reasonsText(reasons)}.
    </p>
  ) : null;

function count(n: number): string {
  return n.toLocaleString('en-US');
}
