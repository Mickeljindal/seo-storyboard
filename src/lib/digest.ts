import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";

/**
 * WEEKLY DIGEST — sends a summary of what the engine did.
 *
 * Delivers via webhook (Slack, Discord, or any URL that accepts JSON POST).
 * Configurable via DIGEST_WEBHOOK_URL in .env.
 */

export type DigestData = {
  period: string;
  totalArticles: number;
  published: number;
  drafted: number;
  discovered: number;
  avgScore: number;
  topArticles: { title: string; score: number; status: string }[];
  refreshed: number;
  errors: number;
  search?: { clicks: number; impressions: number; avgPosition: number; pages: number };
  tools?: {
    total: number;
    published: number;
    optimized: number;
    gated: number;
    avgAioseo: number | null;
  };
};

export async function buildWeeklyDigest(): Promise<DigestData> {
  const repo = await import("@/server/db/repos/articles");
  const all = await repo.listArticles({ limit: 5000 });
  const now = Date.now();
  const weekAgo = now - 7 * 86400_000;

  const thisWeek = all.filter((a) => {
    const created = a.created_at ? new Date(a.created_at).getTime() : 0;
    const published = a.published_at ? new Date(a.published_at).getTime() : 0;
    return created >= weekAgo || published >= weekAgo;
  });

  const published = thisWeek.filter((a) => a.status === "published" || a.status === "promoted");
  const drafted = thisWeek.filter((a) => a.content_draft && a.status !== "published");
  const discovered = thisWeek.filter((a) => a.status === "idea");
  const scores = all.filter((a) => a.quality_score).map((a) => a.quality_score!);
  const avgScore = scores.length
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : 0;

  const topArticles = [...published, ...drafted]
    .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
    .slice(0, 5)
    .map((a) => ({ title: a.title, score: a.quality_score ?? 0, status: a.status }));

  // Real search performance (own analytics) — best-effort, never blocks the digest.
  let search: DigestData["search"];
  try {
    const { getPerformanceTotals } = await import("@/server/db/repos/search-performance");
    const totals = await getPerformanceTotals();
    if (totals.pages > 0) {
      search = {
        clicks: totals.clicks,
        impressions: totals.impressions,
        avgPosition: totals.avgPosition,
        pages: totals.pages,
      };
    }
  } catch {
    /* analytics optional */
  }

  // Tool pages summary — best-effort.
  let tools: DigestData["tools"];
  try {
    const toolsRepo = await import("@/server/db/repos/tools");
    const allTools = await toolsRepo.listTools({ limit: 2000 });
    if (allTools.length) {
      const published = allTools.filter(
        (t) => t.status === "published" || t.status === "optimized",
      ).length;
      const optimized = allTools.filter((t) => t.status === "optimized").length;
      const gated = allTools.filter((t) => t.gate_enabled === "yes").length;
      const scoreVals = allTools
        .map((t) => t.aioseo_score_after ?? t.aioseo_score_before)
        .filter((s): s is number => typeof s === "number");
      const avgAioseo = scoreVals.length
        ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length)
        : null;
      tools = { total: allTools.length, published, optimized, gated, avgAioseo };
    }
  } catch {
    /* tools optional */
  }

  return {
    period: `${new Date(weekAgo).toISOString().slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`,
    totalArticles: all.length,
    published: published.length,
    drafted: drafted.length,
    discovered: discovered.length,
    avgScore,
    topArticles,
    refreshed: 0,
    errors: 0,
    search,
    tools,
  };
}

export async function sendDigestWebhook(): Promise<{ ok: boolean; error?: string }> {
  loadProjectEnv();
  const url = process.env.DIGEST_WEBHOOK_URL?.trim();
  if (!url) return { ok: false, error: "DIGEST_WEBHOOK_URL not set in .env" };

  try {
    const digest = await buildWeeklyDigest();
    const message = [
      `📊 **Kloudbean SEO Weekly Digest** (${digest.period})`,
      `📝 Total articles: ${digest.totalArticles}`,
      `✅ Published this week: ${digest.published}`,
      `📄 Drafted: ${digest.drafted}`,
      `🔍 New topics discovered: ${digest.discovered}`,
      `📈 Avg quality score: ${digest.avgScore}/100`,
      digest.search
        ? `\n**Real search (Google Search Console):**\n🖱️ Clicks: ${digest.search.clicks} · 👁️ Impressions: ${digest.search.impressions} · 📍 Avg position: ${digest.search.avgPosition} · across ${digest.search.pages} pages`
        : "",
      digest.tools
        ? `\n**Tool pages:**\n🧰 ${digest.tools.total} tools · ✅ ${digest.tools.published} live · ✨ ${digest.tools.optimized} optimized · 🔒 ${digest.tools.gated} gated · 📊 avg AIOSEO ${digest.tools.avgAioseo ?? "?"}/100`
        : "",
      digest.topArticles.length
        ? `\n**Top articles:**\n${digest.topArticles.map((a) => `• ${a.title} (${a.score} pts, ${a.status})`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = { text: message, content: message }; // works for Slack + Discord

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
