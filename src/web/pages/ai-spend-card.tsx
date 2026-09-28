/** @jsxImportSource hono/jsx */
import type { FC } from 'hono/jsx';
import { Button, Field, Hint, Input, Table, Tabs, Td, Tr } from '../ui';
import { formatUsd, SPEND_PERIODS, type SpendPeriod, type SpendView } from '../../ai-spend';
import type { AiBilling } from '../../ai-usage';

/**
 * Usage & cost on Settings → AI engine (ADR 0055): what every AI call was
 * for and what it spent, from the ledger. Three kinds of money side by side
 * and never added: a bill, what a plan covered (at API prices, an estimate),
 * and a local model's free calls.
 */
export interface AiSpendProps {
  period: SpendPeriod;
  view: SpendView;
  /** The monthly ceiling on billed money, in cents; null = none set. */
  budgetCents: number | null;
  /** Billed so far this UTC month, micro-dollars — what the budget reads. */
  billedThisMonthMicro: number;
}

const PERIOD_LABELS: Record<SpendPeriod, string> = {
  '7d': 'Last 7 days',
  month: 'This month',
  'last-month': 'Last month',
  year: 'This year',
};

const TOTALS: { billing: AiBilling; label: string; sub: (calls: number) => string }[] = [
  { billing: 'billed', label: 'Billed', sub: (n) => `${calls(n)} on pay-per-token keys` },
  { billing: 'plan', label: 'Covered by your plans', sub: (n) => `${calls(n)} — at API prices, an estimate, not a bill` },
  { billing: 'local', label: 'Local models', sub: (n) => `${calls(n)}, free` },
];

export const AiSpendCard: FC<AiSpendProps> = ({ period, view, budgetCents, billedThisMonthMicro }) => {
  const empty = view.rows.length === 0;
  return (
    <div class="space-y-4">
      <Tabs
        label="Period"
        tabs={SPEND_PERIODS.map((p) => ({
          href: `/settings?tab=ai&spend=${p}#usage`,
          label: PERIOD_LABELS[p],
          current: p === period,
        }))}
      />
      <dl class="grid gap-3 sm:grid-cols-3">
        {TOTALS.map((t) => {
          const total = view.totals[t.billing];
          return (
            <div class="rounded-lg border border-line px-4 py-3">
              <dt class="text-label text-ink-muted">{t.label}</dt>
              <dd class="mt-1 text-section tabular-nums text-ink">
                {t.billing === 'local' ? calls(total.calls) : `${t.billing === 'plan' ? '≈ ' : ''}${formatUsd(total.micro)}`}
              </dd>
              <dd data-ui="hint" class="mt-0.5 text-meta text-ink-faint">
                {t.billing === 'local' ? 'free' : t.sub(total.calls)}
              </dd>
            </div>
          );
        })}
      </dl>
      {view.notes.map((note) => (
        <p class="text-[13px] leading-5 text-ink-muted">{note}</p>
      ))}
      {empty ? (
        <Hint>
          No AI calls recorded in this period. The ledger starts with version 2.21.0: calls before it were counted,
          not priced.
        </Hint>
      ) : (
        <div class="overflow-hidden rounded-lg border border-line">
          <Table
            caption={`AI calls, ${PERIOD_LABELS[period].toLowerCase()}`}
            columns={['What for', 'Calls', 'Tokens in → out', 'Money']}
            widths={['w-[47%]', 'w-[12%]', 'w-[24%]', 'w-[17%]']}
            thClasses={['', 'text-right', 'text-right', 'text-right']}
          >
            {view.rows.map((r) => (
              <Tr>
                <Td>
                  <div class="text-ink">{r.feature}</div>
                  <div class="text-meta text-ink-faint">
                    {r.engine} · <span class="font-mono">{r.model || 'CLI default'}</span>
                  </div>
                </Td>
                <Td class="text-right tabular-nums" title={r.failed > 0 ? `${r.failed} did not answer` : undefined}>
                  {r.calls.toLocaleString('en-US')}
                  {r.failed > 0 && <div class="text-meta text-ink-faint">{r.failed} failed</div>}
                </Td>
                <Td class="whitespace-nowrap text-right tabular-nums text-ink-muted">
                  {compact(r.tokensIn)} → {compact(r.tokensOut)}
                </Td>
                <Td class="whitespace-nowrap text-right tabular-nums" title={MONEY_TITLE[r.billing]}>
                  {r.billing === 'local'
                    ? 'free'
                    : r.unpriced > 0 && r.micro === 0
                      ? 'not priced'
                      : `${r.billing === 'plan' ? '≈ ' : ''}${formatUsd(r.micro)}`}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}
      <form method="post" action="/settings/ai/budget" class="flex flex-wrap items-end gap-3">
        <Field
          label="Monthly budget for billed calls, USD"
          hint={
            budgetCents
              ? `Billed this month: ${formatUsd(billedThisMonthMicro)} of ${formatUsd(budgetCents * 10_000)} (${Math.round((billedThisMonthMicro / (budgetCents * 10_000)) * 100)} %).`
              : 'Empty = no budget. A plan or a local model never counts against it.'
          }
          class="w-72"
        >
          <Input type="number" name="budget" min="0" step="0.01" value={budgetCents ? (budgetCents / 100).toFixed(2) : ''} />
        </Field>
        <Button variant="secondary">Save budget</Button>
      </form>
      <Hint>
        A warning on your alert chats at 80 % and at 100 % of it, once each a month (UTC). Nothing is ever stopped: a
        missed match costs more than a cent.
      </Hint>
    </div>
  );
};

const MONEY_TITLE: Record<AiBilling, string> = {
  billed: 'Billed per token; our price from the dated table, or the vendor’s own figure',
  plan: 'Your plan covers this; the figure is what it would cost on the API',
  local: 'A local model costs nothing per call',
};

function calls(n: number): string {
  return `${n.toLocaleString('en-US')} call${n === 1 ? '' : 's'}`;
}

/** 1 204 → "1.2k", 3 400 000 → "3.4M": the table's tokens at a glance. */
function compact(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
