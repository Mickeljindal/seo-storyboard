import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server functions for multi-engine AI citation tracking (A2).
 *
 * - runCitationCheckFn: ask the configured answer engines a batch of questions,
 *   detect Kloudbean mention/citation, persist rows, and feed the learning loop.
 * - citationsSummaryFn / listCitationsFn: dashboard data.
 * - citationStatusFn: which engines are wired up.
 */

export const citationStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { configuredEngines } = await import("./citation-tracker");
  return { engines: configuredEngines() };
});

export const citationsSummaryFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ days: z.number().min(1).max(180).default(30) }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { citationSummary, listCitations } = await import("@/server/db/repos/citations");
    const [summary, recent] = await Promise.all([
      citationSummary(data?.days ?? 30),
      listCitations(60),
    ]);
    return { summary, recent };
  });

export const listCitationsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().min(1).max(500).default(100) }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { listCitations } = await import("@/server/db/repos/citations");
    return listCitations(data?.limit ?? 100);
  });

export const runCitationCheckFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      queries: z.array(z.string().min(3)).max(40).default([]),
      geo: z.string().default("global"),
      clusterId: z.number().nullable().optional(),
      engines: z.array(z.enum(["perplexity", "gemini", "openai"])).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    // No explicit queries → auto-build from recently published topics.
    if (!data.queries.length) {
      const derived = await buildDefaultCitationQueries(8);
      if (!derived.length) {
        return { ran: 0, stored: 0, cited: 0, mentioned: 0, results: [] };
      }
      let ran = 0;
      let stored = 0;
      let cited = 0;
      let mentioned = 0;
      const results: Awaited<ReturnType<typeof runCitationCheckInternal>>["results"] = [];
      for (const q of derived) {
        const r = await runCitationCheckInternal({
          queries: [q.query],
          geo: q.geo,
          clusterId: q.clusterId,
          engines: data.engines,
        });
        ran += r.ran;
        stored += r.stored;
        cited += r.cited;
        mentioned += r.mentioned;
        results.push(...r.results);
      }
      return { ran, stored, cited, mentioned, results };
    }
    return runCitationCheckInternal(data);
  });

export async function runCitationCheckInternal(opts: {
  queries: string[];
  geo?: string;
  clusterId?: number | null;
  engines?: ("perplexity" | "gemini" | "openai")[];
}): Promise<{
  ran: number;
  stored: number;
  cited: number;
  mentioned: number;
  results: {
    query: string;
    engine: string;
    cited: boolean;
    mentioned: boolean;
    position: number | null;
  }[];
}> {
  const { trackQuery, configuredEngines } = await import("./citation-tracker");
  const citationsRepo = await import("@/server/db/repos/citations");
  const signalsRepo = await import("@/server/db/repos/signals");

  const engines = opts.engines ?? configuredEngines();
  if (!engines.length) {
    return { ran: 0, stored: 0, cited: 0, mentioned: 0, results: [] };
  }

  const rows: citationsRepo.NewCitation[] = [];
  const summary: {
    query: string;
    engine: string;
    cited: boolean;
    mentioned: boolean;
    position: number | null;
  }[] = [];
  let cited = 0;
  let mentioned = 0;
  let ran = 0;

  for (const query of opts.queries) {
    const engineResults = await trackQuery(query, { engines });
    for (const r of engineResults) {
      if (!r.ok) continue;
      ran++;
      if (r.cited) cited++;
      if (r.mentioned) mentioned++;
      rows.push({
        query,
        engine: r.engine,
        geo: opts.geo ?? "global",
        clusterId: opts.clusterId ?? null,
        mentioned: r.mentioned,
        cited: r.cited,
        position: r.position,
        citedUrl: r.citedUrl,
        competitors: r.competitors,
        answerExcerpt: r.answerExcerpt,
        sources: r.sources,
      });
      summary.push({
        query,
        engine: r.engine,
        cited: r.cited,
        mentioned: r.mentioned,
        position: r.position,
      });
      // Learning signal: reward clusters/topics that actually earn citations.
      const reward = r.cited ? 1 : r.mentioned ? 0.3 : 0;
      await signalsRepo.recordSignal({
        clusterId: opts.clusterId ?? null,
        geo: opts.geo ?? null,
        event: "cited",
        reward,
        features: { kind: "ai_citation", engine: r.engine, cited: r.cited, mentioned: r.mentioned },
      });
    }
  }

  const stored = await citationsRepo.insertCitations(rows);
  return { ran, stored, cited, mentioned, results: summary };
}

/**
 * Build natural-language questions to probe AI engines, derived from recently
 * published articles' target keywords. These are the kinds of questions a buyer
 * would ask — where we want Kloudbean to be the cited source.
 */
export async function buildDefaultCitationQueries(
  limit = 8,
): Promise<{ query: string; clusterId: number | null; geo: string }[]> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const published = await articlesRepo.listArticles({
    status: "published",
    orderBy: "updated_at",
    limit: 60,
  });
  const seen = new Set<string>();
  const out: { query: string; clusterId: number | null; geo: string }[] = [];
  const templates = [
    (k: string) => `What is the best managed cloud hosting for ${k}?`,
    (k: string) => `Which hosting platform is best for ${k}?`,
    (k: string) => `Recommend a reliable provider for ${k}.`,
  ];
  let i = 0;
  for (const a of published) {
    const kw = (a.target_keyword ?? "").trim();
    if (!kw || seen.has(kw.toLowerCase())) continue;
    seen.add(kw.toLowerCase());
    const tmpl = templates[i % templates.length];
    out.push({ query: tmpl(kw), clusterId: a.cluster_id ?? null, geo: a.geo_target ?? "global" });
    i++;
    if (out.length >= limit) break;
  }
  return out;
}
