import { getAiProviderById } from '../ai-provider';
import {
  AI_PROVIDER_LABELS,
  providerUnusable,
  resolveAiEngine,
  type AiProviderId,
} from '../ai-engine';
import { resolveAiKey } from '../ai-keys';
import { billingFacts, getAiEngineEnv } from '../ai-runtime';
import { recordAiCall } from '../ai-ledger';
import { billingOf } from '../ai-usage';
import { getAiKeys, getSettings } from '../settings';

const ENGINE_TEST_TIMEOUT_MS = 90_000;

export interface EngineTestResult {
  ok: boolean;
  text: string;
}

/** One tiny live call through `provider` — the Test button on /settings and the wizard's step 1. */
export async function testAiEngine(provider: AiProviderId): Promise<EngineTestResult> {
  const label = AI_PROVIDER_LABELS[provider];
  let backend;
  try {
    backend = getAiProviderById(provider);
  } catch (err) {
    return {
      ok: false,
      text: `${label} test failed: ${err instanceof Error ? err.message : 'not configured'}.`,
    };
  }
  const [settings, keys] = await Promise.all([getSettings(), getAiKeys()]);
  const env = getAiEngineEnv(keys);
  if (providerUnusable(provider, env)) {
    return { ok: false, text: `${label} has no credentials yet — paste a key, or set it in .env.` };
  }
  const engine = resolveAiEngine(settings.aiEngine, env);
  const model = engine.modelFor(provider, 'classifier');
  const started = Date.now();
  // The reason a call failed is otherwise only in the logs: complete()
  // answers null so one bad job never stops a tick. A test button, though,
  // exists to name the cause — "credit balance too low" is not "see logs".
  let failure: string | null = null;
  const attempt = await backend.complete({
    system: 'You are a connectivity test. Reply with exactly: OK',
    user: 'Reply with exactly: OK',
    maxTokens: 20,
    label: 'engine-test',
    model,
    timeoutMs: ENGINE_TEST_TIMEOUT_MS,
    apiKey: resolveAiKey(provider, keys),
    onError: (reason) => {
      failure = reason;
    },
  });
  // A test is a real call on the user's money: it goes in the ledger like any other (ADR 0055).
  await recordAiCall({
    at: new Date(started),
    durationMs: Date.now() - started,
    engine: provider,
    model,
    feature: 'engine-test',
    outcome: attempt.outcome,
    spend: attempt.spend,
    viaFallback: false,
    billing: billingOf(provider, billingFacts(keys)),
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (attempt.text !== null) {
    return { ok: true, text: `${label} works — replied in ${seconds}s (model ${model || 'CLI default'}).` };
  }
  const reason: string = failure ?? 'no reason reported — see the web container logs';
  return {
    ok: false,
    text: `${label} test failed after ${seconds}s — ${reason}.`,
  };
}
