import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Conversion attribution server functions.
 *
 * Ingests signup/paid events (from the WP plugin webhook buffer, or directly),
 * attributes each to the tool/article that drove it via the kbsrc/kbsurface
 * params we tag onto every console link, persists them, and records a strong
 * 'converted' learning signal so discovery optimises for revenue — not clicks.
 */

type RawConversion = {
  event?: string;
  source_slug?: string | null;
  source_url?: string | null;
  surface?: string | null;
  ref?: string | null;
  plan?: string | null;
  value?: number | null;
  currency?: string | null;
  external_id?: string | null;
  occurred_at?: string | null;
};

/** Resolve a raw event to a stored conversion (attributed to a tool/article + cluster). */
async function resolveConversion(raw: RawConversion) {
  const { parseAttribution } = await import("./attribution");
  const parsed = parseAttribution(raw.source_url);
  const slug = (raw.source_slug || parsed.slug || "").trim() || null;
  let surface = (raw.surface || parsed.surface || "unknown").toLowerCase();
  if (surface !== "tool" && surface !== "article") surface = "unknown";

  let toolId: string | null = null;
  let articleId: string | null = null;
  let clusterId: number | null = null;

  if (slug) {
    try {
      if (surface !== "article") {
        const toolsRepo = await import("@/server/db/repos/tools");
        const tool = await toolsRepo.getToolBySlug(slug);
        if (tool) {
          toolId = tool.id;
          surface = "tool";
        }
      }
      if (!toolId) {
        const articlesRepo = await import("@/server/db/repos/articles");
        const article = await articlesRepo.getArticleBySlug(slug);
        if (article) {
          articleId = article.id;
          clusterId = article.cluster_id ?? null;
          surface = "article";
        }
      }
    } catch {
      /* attribution best-effort */
    }
  }

  const eventAllowed = ["signup", "paid", "lead", "view"];
  const event = eventAllowed.includes(String(raw.event)) ? String(raw.event) : "signup";

  return {
    event,
    sourceSlug: slug,
    sourceUrl: raw.source_url ?? null,
    surface,
    toolId,
    articleId,
    clusterId,
    ref: raw.ref ?? parsed.ref ?? null,
    plan: raw.plan ?? null,
    value: raw.value ?? null,
    currency: raw.currency ?? "USD",
    externalId: raw.external_id ?? null,
    occurredAt: raw.occurred_at ? new Date(raw.occurred_at) : null,
  };
}

/** Ingest a batch of raw conversions: attribute, store (deduped), reward learning. */
export async function ingestConversionsInternal(
  raws: RawConversion[],
): Promise<{ received: number; stored: number; signups: number; paid: number; value: number }> {
  if (!raws.length) return { received: 0, stored: 0, signups: 0, paid: 0, value: 0 };
  const convRepo = await import("@/server/db/repos/conversions");
  const signalsRepo = await import("@/server/db/repos/signals");
  const { rewardFromConversion } = await import("./learning-ranker");

  const resolved = [];
  for (const r of raws) resolved.push(await resolveConversion(r));

  const stored = await convRepo.insertConversions(resolved);

  // Record learning signals (only for new rows is ideal, but signals are cheap +
  // the learning aggregate averages — so we record per resolved event).
  let signups = 0;
  let paid = 0;
  let value = 0;
  for (const c of resolved) {
    if (c.event === "paid") paid++;
    else if (c.event === "signup" || c.event === "lead") signups++;
    value += c.value ?? 0;
    await signalsRepo.recordSignal({
      articleId: c.articleId,
      clusterId: c.clusterId,
      event: "converted",
      reward: rewardFromConversion({
        event: c.event as "signup" | "paid" | "lead" | "view",
        value: c.value,
      }),
      features: { kind: "conversion", surface: c.surface, event: c.event, slug: c.sourceSlug },
    });
  }

  return { received: raws.length, stored, signups, paid, value: Number(value.toFixed(2)) };
}

/** Pull buffered conversions from the WP plugin + ingest them. */
export async function syncConversionsInternal(): Promise<{
  received: number;
  stored: number;
  signups: number;
  paid: number;
  value: number;
  error?: string;
}> {
  const { hasPluginConfigured, getConversions } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) {
    return {
      received: 0,
      stored: 0,
      signups: 0,
      paid: 0,
      value: 0,
      error: "Plugin not configured",
    };
  }
  const raws = await getConversions();
  return ingestConversionsInternal(raws as RawConversion[]);
}

export const syncConversionsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  return syncConversionsInternal();
});

export const recordConversionFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      event: z.enum(["signup", "paid", "lead", "view"]).default("signup"),
      source_slug: z.string().nullable().optional(),
      source_url: z.string().nullable().optional(),
      surface: z.string().nullable().optional(),
      ref: z.string().nullable().optional(),
      plan: z.string().nullable().optional(),
      value: z.number().nullable().optional(),
      currency: z.string().nullable().optional(),
      external_id: z.string().nullable().optional(),
      occurred_at: z.string().nullable().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    return ingestConversionsInternal([data as RawConversion]);
  });

export const conversionsSummaryFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ days: z.number().min(1).max(365).default(90) }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const convRepo = await import("@/server/db/repos/conversions");
    const [summary, recent] = await Promise.all([
      convRepo.conversionSummary(data?.days ?? 90),
      convRepo.listConversions(50),
    ]);
    return { summary, recent };
  });

export const listConversionsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().min(1).max(500).default(100) }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const convRepo = await import("@/server/db/repos/conversions");
    return convRepo.listConversions(data?.limit ?? 100);
  });
