import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SPARK_DAYS, kpiTrends, overviewHref, readStackParam, statusMoment, topTerms, type KpiRow } from './overview-numbers';

const NOW = new Date('2026-09-30T15:00:00Z');
const at = (iso: string) => new Date(iso);

function row(status: KpiRow['status'], fetchedAt: string, extra: Partial<KpiRow> = {}): KpiRow {
  return { status, fetchedAt: at(fetchedAt), alertedAt: null, appliedAt: null, ...extra };
}

describe('when a job took its status', () => {
  it('an alerted job by its alert, an applied one by the application, the rest by the day they were found', () => {
    const found = '2026-09-20T10:00:00Z';
    assert.equal(statusMoment(row('ALERTED', found, { alertedAt: at('2026-09-21T08:00:00Z') })).toISOString(), '2026-09-21T08:00:00.000Z');
    assert.equal(statusMoment(row('APPLIED', found, { appliedAt: at('2026-09-29T09:00:00Z') })).toISOString(), '2026-09-29T09:00:00.000Z');
    assert.equal(statusMoment(row('SAVED', found, { alertedAt: at('2026-09-21T08:00:00Z') })).toISOString(), '2026-09-20T10:00:00.000Z');
    assert.equal(statusMoment(row('NEW', found)).toISOString(), '2026-09-20T10:00:00.000Z');
  });

  it('a row that lost its date falls back to the day it was found', () => {
    assert.equal(statusMoment(row('APPLIED', '2026-09-20T10:00:00Z')).toISOString(), '2026-09-20T10:00:00.000Z');
  });
});

describe('the status cards', () => {
  const rows: KpiRow[] = [
    row('ALERTED', '2026-09-29T20:00:00Z', { alertedAt: at('2026-09-30T14:00:00Z') }),
    row('ALERTED', '2026-09-29T20:00:00Z', { alertedAt: at('2026-09-29T20:05:00Z') }),
    row('ALERTED', '2026-09-10T20:00:00Z', { alertedAt: at('2026-09-10T20:05:00Z') }),
    // Found three weeks ago, applied to this morning: it moved today.
    row('APPLIED', '2026-09-08T10:00:00Z', { appliedAt: at('2026-09-30T09:00:00Z') }),
    row('SAVED', '2026-09-30T01:00:00Z'),
  ];
  const kpi = kpiTrends(rows, NOW);

  it('counts what took the status in the last 24 hours', () => {
    assert.equal(kpi.ALERTED.last24h, 2);
    assert.equal(kpi.APPLIED.last24h, 1);
    assert.equal(kpi.SAVED.last24h, 1);
    assert.equal(kpi.NEW.last24h, 0);
  });

  it('draws a fortnight, today last, and leaves older days out', () => {
    assert.equal(kpi.ALERTED.spark.length, SPARK_DAYS);
    assert.deepEqual(kpi.ALERTED.spark.slice(-2), [1, 1]);
    assert.equal(kpi.ALERTED.spark.reduce((a, b) => a + b, 0), 2);
    assert.deepEqual(kpi.NEW.spark, Array(SPARK_DAYS).fill(0));
  });
});

describe('technologies', () => {
  it('counts a job once per term, most named first, the alphabet breaking a tie', () => {
    const terms = topTerms(
      [{ techMatch: ['react', 'typescript', 'React'] }, { techMatch: ['typescript', ' node '] }, { techMatch: ['react'] }, { techMatch: [] }],
      3,
    );
    assert.deepEqual(terms, [
      { term: 'react', count: 2, share: 100 },
      { term: 'typescript', count: 2, share: 100 },
      { term: 'node', count: 1, share: 50 },
    ]);
  });

  it('keeps the first `max` and says nothing of nothing', () => {
    assert.equal(topTerms([{ techMatch: ['a', 'b', 'c'] }], 2).length, 2);
    assert.deepEqual(topTerms([], 5), []);
    assert.deepEqual(topTerms([{ techMatch: ['', '  '] }], 5), []);
  });
});

describe('the Overview link', () => {
  it('keeps the defaults out of the URL', () => {
    assert.equal(overviewHref({ range: '30d', stack: null }), '/');
    assert.equal(overviewHref({ range: '7d', stack: null }), '/?range=7d');
    assert.equal(overviewHref({ range: '30d', stack: 'node.js' }), '/?stack=node.js');
    assert.equal(overviewHref({ range: '7d', stack: 'c#' }), '/?range=7d&stack=c%23');
  });

  it('reads a technology back as a tag, or not at all', () => {
    assert.equal(readStackParam('React'), 'react');
    assert.equal(readStackParam(' next.js '), 'next.js');
    assert.equal(readStackParam('c#'), 'c#');
    assert.equal(readStackParam('.net'), '.net');
    assert.equal(readStackParam('ci/cd'), 'ci/cd');
    assert.equal(readStackParam(''), null);
    assert.equal(readStackParam(undefined), null);
    assert.equal(readStackParam('<script>'), null);
    assert.equal(readStackParam('a'.repeat(41)), null);
  });
});
