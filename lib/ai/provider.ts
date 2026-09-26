// The only module that knows OpenRouter exists.
//
// Everything above this talks in classifyBatch / reconcile / personalizeNetwork.
// The model is configuration, not an assumption baked through the code, and the
// key lives in this browser like the rest of the workspace.

import type { AiSettings } from "./types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type FailureKind = "rate-limit" | "timeout" | "auth" | "provider" | "malformed" | "no-key";

export class ProviderError extends Error {
  readonly kind: FailureKind;
  /** Whether trying the same request once more could plausibly work. */
  readonly retryable: boolean;

  constructor(kind: FailureKind, message: string, retryable: boolean) {
    super(message);
    this.kind = kind;
    this.retryable = retryable;
  }
}

export interface ChatRequest {
  system: string;
  user: string;
  /** Hard ceiling on the reply, so a runaway response cannot hang the run. */
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * One request. Returns parsed JSON, because every call in this layer asks for
 * JSON and free-form prose is never acceptable.
 */
export async function chatJson(settings: AiSettings, req: ChatRequest): Promise<unknown> {
  if (!settings.apiKey) throw new ProviderError("no-key", "No OpenRouter key set", false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? 120_000);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
        "X-Title": "LinkedIn Intelligence",
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0,
        max_tokens: req.maxTokens ?? 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
    });
  } catch (err) {
    throw new ProviderError(
      controller.signal.aborted ? "timeout" : "provider",
      controller.signal.aborted ? "The request timed out" : `Could not reach OpenRouter: ${String(err)}`,
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    throw new ProviderError("auth", "OpenRouter rejected the key", false);
  }
  if (res.status === 429) {
    throw new ProviderError("rate-limit", "OpenRouter rate limit reached", true);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProviderError("provider", `OpenRouter returned ${res.status}. ${body.slice(0, 200)}`, res.status >= 500);
  }

  let payload: { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    throw new ProviderError("malformed", "OpenRouter sent a response that was not JSON", true);
  }

  if (payload.error?.message) throw new ProviderError("provider", payload.error.message, false);

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new ProviderError("malformed", "The model returned an empty reply", true);
  }

  return parseJsonLoosely(content);
}

/**
 * Models occasionally wrap JSON in prose or a code fence even when asked not to.
 * This recovers the object where it can and fails honestly where it cannot.
 */
export function parseJsonLoosely(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    throw new ProviderError("malformed", "The model's reply was not valid JSON", true);
  }
}
