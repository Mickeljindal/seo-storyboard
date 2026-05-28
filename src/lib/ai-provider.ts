import { createOpenAI } from "@ai-sdk/openai";

export type AiProviderKind = "deepseek" | "openrouter" | "openai" | "custom";

export interface ResolvedAiConfig {
  kind: AiProviderKind;
  apiKey: string;
  baseURL: string;
  modelId: string;
  label: string;
}

function inferKind(apiKey: string, baseURL: string, explicit?: string): AiProviderKind {
  if (explicit === "deepseek" || baseURL.includes("deepseek.com")) return "deepseek";
  if (explicit === "openrouter" || apiKey.startsWith("sk-or-") || baseURL.includes("openrouter.ai")) return "openrouter";
  if (explicit === "openai" || baseURL.includes("api.openai.com")) return "openai";
  return "custom";
}

function resolveModelId(kind: AiProviderKind, explicit?: string): string {
  const model = explicit?.trim();
  if (model) {
    // Never send deepseek model IDs to OpenRouter/OpenAI
    if (kind !== "deepseek" && model.includes("deepseek")) {
      return kind === "openrouter" ? "openai/gpt-4o-mini" : "gpt-4o-mini";
    }
    return model;
  }
  if (kind === "deepseek") return "deepseek-chat";
  if (kind === "openrouter") return "openai/gpt-4o-mini";
  return "gpt-4o-mini";
}

/** Resolve AI credentials — DeepSeek first, then OpenAI-compatible fallback. */
export function getResolvedAiConfig(): ResolvedAiConfig | null {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    const baseURL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
    const modelId = resolveModelId(
      "deepseek",
      process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || "deepseek-chat",
    );
    return {
      kind: "deepseek",
      apiKey: deepseekKey,
      baseURL,
      modelId,
      label: `DeepSeek · ${modelId}`,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const rawBase = (process.env.OPENAI_BASE_URL || "").trim().replace(/\/$/, "");
  const baseURL =
    rawBase ||
    (apiKey.startsWith("sk-or-") ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1");

  // Common setup: DeepSeek key stored under OPENAI_* vars
  if (baseURL.includes("deepseek.com") || process.env.AI_PROVIDER === "deepseek") {
    const modelId = resolveModelId(
      "deepseek",
      process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || "deepseek-chat",
    );
    return {
      kind: "deepseek",
      apiKey,
      baseURL,
      modelId,
      label: `DeepSeek (via OPENAI_*) · ${modelId}`,
    };
  }

  const kind = inferKind(apiKey, baseURL, process.env.AI_PROVIDER);
  const modelId = resolveModelId(kind, process.env.AI_MODEL);

  const label =
    kind === "openrouter"
      ? `OpenRouter · ${modelId}`
      : kind === "openai"
        ? `OpenAI · ${modelId}`
        : kind === "deepseek"
          ? `DeepSeek · ${modelId}`
          : `Custom · ${modelId}`;

  return { kind, apiKey, baseURL, modelId, label };
}

export function hasAiCredentials(): boolean {
  return getResolvedAiConfig() !== null;
}

function providerHeaders(kind: AiProviderKind): Record<string, string> | undefined {
  if (kind !== "openrouter") return undefined;
  return {
    "HTTP-Referer": process.env.APP_URL || "https://kloudbean.com",
    "X-Title": "Kloudbean SEO Storyboard",
  };
}

export function createAiProvider() {
  const cfg = getResolvedAiConfig();
  if (!cfg) {
    throw new Error(
      "AI not configured. Set DEEPSEEK_API_KEY (recommended) or OPENAI_API_KEY in .env, then restart the dev server.",
    );
  }
  const openai = createOpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    headers: providerHeaders(cfg.kind),
  });
  return openai(cfg.modelId);
}

export function getAiModelName() {
  return getResolvedAiConfig()?.modelId ?? process.env.AI_MODEL ?? "gpt-4o-mini";
}

export function getAiProviderLabel() {
  return getResolvedAiConfig()?.label ?? "not configured";
}

/** Live ping — used by health check and Settings. */
export async function testAiConnection(): Promise<{ ok: boolean; message: string; provider?: string }> {
  const cfg = getResolvedAiConfig();
  if (!cfg) {
    return {
      ok: false,
      message: "Set DEEPSEEK_API_KEY (recommended) or OPENAI_API_KEY in .env — restart npm run dev",
    };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...providerHeaders(cfg.kind),
    };

    const res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: cfg.modelId,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 8,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const body = await res.text();
    if (!res.ok) {
      let detail = body.slice(0, 280);
      try {
        const j = JSON.parse(body) as { error?: { message?: string } };
        detail = j.error?.message ?? detail;
      } catch {
        /* keep raw */
      }
      return { ok: false, message: `${cfg.label} — HTTP ${res.status}: ${detail}`, provider: cfg.label };
    }

    return { ok: true, message: `${cfg.label} — connected`, provider: cfg.label };
  } catch (e: unknown) {
    return {
      ok: false,
      message: `${cfg.label} — ${String((e as Error)?.message ?? e)}`,
      provider: cfg.label,
    };
  }
}
