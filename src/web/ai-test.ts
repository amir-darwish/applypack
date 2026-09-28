import { getAiProviderById } from '../ai-provider';
import {
  AI_PROVIDER_LABELS,
  providerUnusable,
  resolveAiEngine,
  type AiProviderId,
} from '../ai-engine';
import { resolveAiKey } from '../ai-keys';
import { billingFacts, getAiEngineEnv, openAiBase } from '../ai-runtime';
import { listServerModels, listsModel } from '../openai-models';
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
  const env = getAiEngineEnv(keys, settings.openAiBaseUrl);
  if (providerUnusable(provider, env)) {
    return { ok: false, text: `${label} has no credentials yet — paste a key, or set it in .env.` };
  }
  const engine = resolveAiEngine(settings.aiEngine, env);
  let model = engine.modelFor(provider, 'classifier');
  // TASKS S3: an OpenAI-compatible server says what it runs before anything is
  // asked of it — a wrong address or a model never pulled is named, not guessed.
  const base = openAiBase(settings.openAiBaseUrl);
  let offered: string[] | null = null;
  // Not every compatible server lists its models; the call below is still the test.
  let unlistable = '';
  let pickedForTest = false;
  if (provider === 'openai_api') {
    const listed = await listServerModels(base, resolveAiKey(provider, keys));
    if ('reason' in listed) {
      unlistable = ` Asked for its models: ${listed.reason}.`;
    } else {
      offered = listed.models;
      // No slot filled and no OPENAI_MODEL: the provider would ask for gpt-5-mini, which no local server has.
      if (offered.length > 0 && model.trim() === '') {
        model = offered[0]!;
        pickedForTest = true;
      }
    }
  }
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
    ...(provider === 'openai_api' && { baseUrl: base }),
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
    billing: billingOf(provider, billingFacts(keys, settings.openAiBaseUrl)),
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const offer = offered === null ? '' : offered.length === 0 ? ' The server lists no models yet — pull one first.' : ` The server offers ${offered.length === 1 ? '1 model' : `${offered.length} models`}: ${offered.slice(0, 5).join(', ')}${offered.length > 5 ? ', …' : ''}.`;
  if (attempt.text !== null) {
    const picked = pickedForTest ? ' No model is chosen yet, so the test used the first the server offers — pick one below.' : '';
    return { ok: true, text: `${label} works — replied in ${seconds}s (model ${model || 'CLI default'}).${picked}${offer}` };
  }
  const reason: string = failure ?? 'no reason reported — see the web container logs';
  // A model the server never pulled is the likeliest cause on a local server; the list says so.
  const unlisted = offered !== null && offered.length > 0 && model !== '' && !listsModel(offered, model) ? ` The server does not list "${model}".` : '';
  return {
    ok: false,
    text: `${label} test failed after ${seconds}s — ${reason}.${unlisted}${offer}${unlistable}`,
  };
}
