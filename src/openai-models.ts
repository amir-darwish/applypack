import { z } from 'zod';

/*
 * The models an OpenAI-compatible server offers (TASKS S3): `GET {base}/models`,
 * asked by the engine's Test, by the engine probe when the server is on this
 * machine (ai-runtime.ts) and by the wizard's local-model card. What it
 * answered is kept in memory for the model fields' suggestions; a restart
 * forgets it until the next ask. Nothing here spends AI.
 */

const LIST_TIMEOUT_MS = 5_000;
/** A server on this machine that has not answered in this long is not running. */
export const LOCAL_LIST_TIMEOUT_MS = 1_500;
/** A bound on what one answer may put in memory; an aggregator lists a few hundred. */
const MAX_MODELS = 500;
/** Servers remembered for the suggestions — the stored one, and what the wizard found. */
const MAX_KNOWN_SERVERS = 8;

/**
 * Where the two common local servers listen out of the box (TASKS S1). The
 * second host is the machine itself as a container sees it (Docker Desktop;
 * on Linux, compose's `host-gateway`).
 */
const LOCAL_SERVERS = [
  { name: 'Ollama', port: 11434 },
  { name: 'LM Studio', port: 1234 },
] as const;
const LOCAL_HOSTS = ['127.0.0.1', 'host.docker.internal'] as const;

/** Names that serve embeddings, speech or ranking, not chat — never picked for the user. */
const NOT_A_CHAT_MODEL = /embed|minilm|rerank|whisper|\bbge\b|\btts\b/i;

const ModelListSchema = z.object({ data: z.array(z.object({ id: z.string() }).passthrough()) }).passthrough();

/** `{ data: [{ id }] }` → the ids, sorted, at most MAX_MODELS; anything else → null. */
export function parseModelList(raw: unknown): string[] | null {
  const parsed = ModelListSchema.safeParse(raw);
  if (!parsed.success) return null;
  return [...new Set(parsed.data.data.map((m) => m.id.trim()).filter((id) => id.length > 0))].sort().slice(0, MAX_MODELS);
}

const known = new Map<string, string[]>();

/** The models the last list of this server named; [] when it was never asked. */
export function knownModels(base: string): string[] {
  return known.get(base) ?? [];
}

/** Whether the server's list names `model` — Ollama answers "llama3.1" with its ":latest" tag. */
export function listsModel(models: readonly string[], model: string): boolean {
  return models.includes(model) || models.includes(`${model}:latest`);
}

/** The model to offer first: the first that is not an embedding or speech model, else the first. */
export function preferredModel(models: readonly string[]): string | null {
  return models.find((m) => !NOT_A_CHAT_MODEL.test(m)) ?? models[0] ?? null;
}

export interface LocalServer {
  name: string;
  base: string;
  models: string[];
}

/**
 * The local servers answering at their default addresses, with what they run
 * — one request per address, all at once, so the wizard waits at most
 * LOCAL_LIST_TIMEOUT_MS. A server found on both hosts is listed once.
 */
export async function findLocalServers(): Promise<LocalServer[]> {
  const candidates = LOCAL_SERVERS.flatMap((s) => LOCAL_HOSTS.map((h) => ({ name: s.name, base: `http://${h}:${s.port}/v1` })));
  const answers = await Promise.all(
    candidates.map(async (c) => ({ ...c, listed: await listServerModels(c.base, undefined, LOCAL_LIST_TIMEOUT_MS) })),
  );
  const found: LocalServer[] = [];
  for (const a of answers) {
    if ('models' in a.listed && !found.some((f) => f.name === a.name)) found.push({ name: a.name, base: a.base, models: a.listed.models });
  }
  return found;
}

/** Asks the server for its models. The reason is a sentence for the flash when it could not. */
export async function listServerModels(
  base: string,
  apiKey: string | undefined,
  timeoutMs = LIST_TIMEOUT_MS,
): Promise<{ models: string[] } | { reason: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${base}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      // "http://127.0.0.1:11434" instead of ".../v1" is the usual slip; the address is saved as typed.
      const hint = resp.status === 404 && new URL(base).pathname === '/' ? ` — these servers answer under /v1: try ${base}/v1` : '';
      return { reason: `${base}/models answered HTTP ${resp.status}${hint}` };
    }
    const models = parseModelList(await resp.json().catch(() => null));
    if (models === null) return { reason: `${base}/models did not answer with a model list` };
    if (!known.has(base) && known.size >= MAX_KNOWN_SERVERS) known.clear();
    known.set(base, models);
    return { models };
  } catch {
    return { reason: `nothing answered at ${base} — is the server running?` };
  } finally {
    clearTimeout(timer);
  }
}
