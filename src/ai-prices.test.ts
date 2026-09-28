import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalModel, costMicroUsd, priceOf, pricedModels } from './ai-prices';
import { NO_USAGE, type AiUsage } from './ai-usage';
import { PROVIDER_MODEL_OPTIONS } from './ai-engine';

const usage = (u: Partial<AiUsage>): AiUsage => ({ ...NO_USAGE, ...u });

test("the vendor's own worked example, to the cent", () => {
  // Anthropic's pricing page, Opus 5: 50,000 input + 15,000 output = $0.25 + $0.375.
  assert.equal(costMicroUsd('claude-opus-5', usage({ inputTokens: 50_000, outputTokens: 15_000 })), 625_000);
  // The same call with 40,000 of the input read from the cache: $0.05 + $0.02 + $0.375.
  assert.equal(
    costMicroUsd('claude-opus-5', usage({ inputTokens: 10_000, cacheReadTokens: 40_000, outputTokens: 15_000 })),
    445_000,
  );
});

test('the cache multipliers the page states', () => {
  // Five-minute write ×1.25, one-hour write ×2, read ×0.1 — Haiku 4.5 at $1 input.
  assert.equal(costMicroUsd('claude-haiku-4-5', usage({ cacheWriteTokens: 1_000_000 })), 1_250_000);
  assert.equal(costMicroUsd('claude-haiku-4-5', usage({ cacheWrite1hTokens: 1_000_000 })), 2_000_000);
  assert.equal(costMicroUsd('claude-haiku-4-5', usage({ cacheReadTokens: 1_000_000 })), 100_000);
  // "0.025x on Claude Fable 5.1; 0.05x on Claude Opus 5.5": $0.25 and $0.20 per million.
  assert.equal(costMicroUsd('claude-fable-5-1', usage({ cacheReadTokens: 1_000_000 })), 250_000);
  assert.equal(costMicroUsd('claude-opus-5-5', usage({ cacheReadTokens: 1_000_000 })), 200_000);
});

test('a web search is $10 per 1,000 on top of the tokens, a fetch is free', () => {
  assert.equal(costMicroUsd('claude-sonnet-5', usage({ inputTokens: 1_000, outputTokens: 100, webSearches: 3 })), 2_000 + 1_000 + 30_000);
});

test('Gemini Pro prices a long prompt at its higher tier, every token of it', () => {
  assert.equal(costMicroUsd('gemini-2.5-pro', usage({ inputTokens: 100_000, outputTokens: 1_000 })), 125_000 + 10_000);
  assert.equal(costMicroUsd('gemini-2.5-pro', usage({ inputTokens: 250_000, outputTokens: 1_000 })), 625_000 + 15_000);
});

test('a dated snapshot or a context tag is the same model, a near name is not', () => {
  assert.equal(canonicalModel('claude-haiku-4-5-20251001'), 'claude-haiku-4-5');
  assert.equal(canonicalModel('gpt-5-mini-2025-08-07'), 'gpt-5-mini');
  assert.equal(canonicalModel('claude-sonnet-5[1m]'), 'claude-sonnet-5');
  assert.equal(priceOf('gpt-5.1-codex'), null);
  assert.equal(priceOf('anthropic/claude-sonnet-5'), null);
  assert.ok(priceOf('Claude-Opus-5'));
});

test('unpriced means unpriced: an unknown model or no usage is null, never 0', () => {
  assert.equal(costMicroUsd('qwen2.5:14b', usage({ inputTokens: 5_000, outputTokens: 500 })), null);
  assert.equal(costMicroUsd('claude-opus-5', NO_USAGE), null);
  assert.equal(costMicroUsd(null, usage({ inputTokens: 1 })), null);
  // Reported zero is a price: the call happened and cost nothing measurable.
  assert.equal(costMicroUsd('claude-opus-5', usage({ inputTokens: 0, outputTokens: 0 })), 0);
});

test('every model the engine pickers offer has a price', () => {
  for (const [engine, models] of Object.entries(PROVIDER_MODEL_OPTIONS)) {
    for (const model of models) assert.ok(priceOf(model), `${engine}: ${model} has no row in ai-prices.ts`);
  }
  assert.ok(pricedModels().length > 20);
});
