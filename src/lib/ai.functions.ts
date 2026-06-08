import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createAiProvider, getAiModelName } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import { geoPolicyPromptBlock } from "./geo-provider-policy";
import { competitorContextForTopic } from "./competitors";
import type { KeywordResearch } from "./seo-types";

async function repos() {
  const [articles, briefs] = await Promise.all([
    import("@/server/db/repos/articles"),
    import("@/server/db/repos/briefs"),
  ]);
  return { articlesRepo: articles, briefsRepo: briefs };
}

async function ensureAiEnv() {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
}

async function supportKbBlock(): Promise<string> {
  try {
    const { getSupportKnowledgeContext } = await import("./support-kb");
    return await getSupportKnowledgeContext();
  } catch {
    return "";
  }
}

function buildResearchContext(article: Record<string, unknown>): string {
  const kd = article.keyword_data as KeywordResearch | null | undefined;
  const semantic = kd as Record<string, unknown> | null | undefined;
  const supporting = (semantic?.supporting_keywords as string[] | undefined) ?? [];
  const coreKw = semantic?.semantic_core_keyword as string | undefined;
  if (!kd) {
    return "No live keyword research yet — infer intent from title/keyword; prefer informational + commercial angles for Kloudbean.";
  }
  const lines = [
    `LIVE DATAFORSEO RESEARCH (use this — do not invent volumes):`,
    `- Search intent: ${kd.search_intent ?? "unknown"} (${Math.round((kd.intent_probability ?? 0) * 100)}% confidence)`,
    `- Monthly volume: ${kd.monthly_volume ?? "n/a"}`,
    `- Difficulty: ${kd.difficulty ?? "n/a"}/100`,
    `- Opportunity score: ${kd.opportunity_score ?? "n/a"}/100`,
    `- Traffic priority: ${kd.traffic_score ?? semantic?.traffic_score ?? "n/a"}/100`,
    coreKw ? `- Semantic cluster hub (core_keyword): ${coreKw}` : null,
    supporting.length ? `- Supporting keywords in cluster: ${supporting.slice(0, 10).join(", ")}` : null,
    kd.cluster_total_volume ? `- Cluster total addressable volume: ${kd.cluster_total_volume}/mo` : null,
    `- Suggested meta title: ${kd.meta_title}`,
    `- Suggested meta description: ${kd.meta_description}`,
    `- Content angle: ${kd.content_angle}`,
    `- PAA to answer: ${(kd.paa_questions ?? []).slice(0, 6).join(" | ")}`,
    `- SERP competitors: ${(kd.top_10_urls ?? []).slice(0, 5).join(", ")}`,
    `- Related keywords: ${(kd.related_keywords ?? []).slice(0, 8).map((r) => r.keyword).join(", ")}`,
    `- Topics to cover: ${(kd.topic_recommendations ?? []).join("; ")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

const SYSTEM = `You are the in-house SEO/GEO/AIO content strategist for Kloudbean (kloudbean.com), a Zero-Ops managed cloud platform by Secured Orbis Pvt. Ltd. Your mission is to win Google for Saudi Arabia, India, UAE and Global — and to be the cited source in AI Overviews (Google SGE), ChatGPT, Perplexity, Claude, and Gemini — through TOPICAL AUTHORITY on Kloudbean only, not backlinks.

${KLOUDBEAN_PROMPT_CORE}

KLOUDBEAN FACTS YOU MUST USE:
- What it is: managed cloud hosting on these providers (Akamai Linode, DigitalOcean, AWS, Vultr, Google Cloud, UpCloud). Any language, any framework — not just WordPress. Kloudbean does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner — never present them as a hosting option.
- Bundled FREE on every plan (~$5,000/mo of value): Cloudflare Enterprise DDoS, BitNinja Pro security + WAF, unlimited DevOps support hours, advanced caching, 45-day automated backups, free SSL, free migrations, uptime monitoring, CI/CD pipelines, managed databases (MySQL, Postgres, MongoDB, Elasticsearch).
- Products: Managed Cloud Hosting, Flexible Load Balancer (FLB), S3 Object Storage on Cloudflare R2 (zero egress), KloudGPT chat-deploy, Static Site Hosting, Self-Hosted apps (n8n, Langflow, Open WebUI, Ollama, Nextcloud, Plausible, Ghost, Vaultwarden, Gitea, Immich), Enterprise Hosting.
- Pricing anchors: Linode plans from $8/mo, DigitalOcean from $11/mo, AWS from $28/mo, n8n self-hosted from $6.99/mo, ENTERPRISE PLAN from $7,500/mo with $45,000 of implementation value, dedicated AM, NCA/CSCC/ECC delivery (trusted by MISA — Ministry of Investment Saudi Arabia).
- Support: 24/7/365, ~2-min avg response, free site migrations.

TOPICAL AUTHORITY RULES:
1. Treat every article as part of a cluster. Link out to 4-6 sibling articles inside the same cluster + 2 cross-cluster bridges.
2. Entity-first writing: 8-15 named entities per article.
3. Always include a final CTA pointing to the most relevant Kloudbean URL.
4. Quantify value vs DIY/AWS/WP-Engine/Cloudways/Zapier wherever possible.

GEO PROVIDER POLICY OVERRIDES THE GENERIC PROVIDER LIST:
- A "GEO PROVIDER POLICY" block is supplied per article. It is the SINGLE SOURCE OF TRUTH for which providers/regions Kloudbean can serve in that market. It overrides the generic provider list above whenever they conflict.
- For Saudi Arabia, the only in-Kingdom region is Google Cloud me-central2 (Dammam). Never recommend AWS/Linode/DigitalOcean/Vultr/UpCloud as a Saudi/KSA in-country hosting or data-residency option. Kloudbean does NOT offer Azure/Oracle/Alibaba/IBM Cloud or Hetzner at all.
- When a COMPETITOR INTELLIGENCE block is supplied, build the comparison_table from it: acknowledge the competitor fairly, then show where Kloudbean wins for the reader's use case. Never fabricate competitor specs.

Return ONLY a strict JSON object — no prose, no markdown fences. Schema:
{
  "h1": string,
  "target_keyword": string,
  "secondary_keywords": string[5],
  "search_intent": "informational" | "commercial" | "transactional" | "navigational",
  "word_count": number (default 2000–2400 for a full blog post),
  "meta_title": string (max 60 chars),
  "meta_description": string (max 160 chars),
  "url_slug": string,
  "tldr": string,
  "key_takeaways": string[],
  "entity_table": [{ "entity": string, "definition": string }],
  "comparison_table": { "columns": string[], "rows": [{ "label": string, "values": string[] }] } | null,
  "outline": [{ "h2": string, "description": string, "h3": [{ "title": string, "description": string }] }] (6–8 H2 sections, each with a one-line intent so the writer has real substance to cover),
  "paa_questions": string[],
  "faq": [{ "q": string, "a": string }] (5–7 real questions),
  "schema_jsonld": object,
  "competing_urls": string[3],
  "internal_links": [{ "anchor": string, "target_topic": string }],
  "kloudbean_angle": string,
  "enterprise_plan_hook": string,
  "cta": string,
  "cta_url": string,
  "tone": string
}`;

async function applyBriefToArticle(articleId: string, article: Record<string, unknown>, briefData: Record<string, unknown>) {
  const { articlesRepo, briefsRepo } = await repos();
  const version = (await briefsRepo.getLatestBriefVersion(articleId)) + 1;
  await briefsRepo.insertBrief(articleId, briefData, version, getAiModelName());
  await articlesRepo.updateArticle(articleId, {
    brief: briefData,
    status: "brief_generated",
    meta_title: briefData.meta_title,
    meta_description: briefData.meta_description,
    url_slug: briefData.url_slug ?? article.url_slug,
    secondary_keywords: Array.isArray(briefData.secondary_keywords) ? briefData.secondary_keywords : article.secondary_keywords,
    faq: Array.isArray(briefData.faq) ? briefData.faq : null,
    ai_overview: {
      tldr: briefData.tldr ?? null,
      key_takeaways: briefData.key_takeaways ?? [],
      entity_table: briefData.entity_table ?? [],
      comparison_table: briefData.comparison_table ?? null,
    },
    schema_jsonld: briefData.schema_jsonld ?? null,
    entities: Array.isArray(briefData.entity_table)
      ? (briefData.entity_table as { entity?: string }[]).map((e) => e?.entity).filter(Boolean)
      : [],
    internal_link_targets: Array.isArray(briefData.internal_links)
      ? (briefData.internal_links as { target_topic?: string }[]).map((l) => l?.target_topic).filter(Boolean)
      : [],
  });
  return version;
}

export async function generateBriefInternal(articleId: string): Promise<{ ok: boolean; error?: string }> {
  await ensureAiEnv();
  const { articlesRepo } = await repos();
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) return { ok: false, error: "not found" };
  const model = createAiProvider();
  const kb = await supportKbBlock();
  const geo = String(article.geo_target ?? "sa");
  const geoBlock = geoPolicyPromptBlock(geo);
  const competitorBlock = competitorContextForTopic(
    `${article.title} ${article.target_keyword ?? ""}`,
  );
  let ragBlock = "";
  try {
    const { ragGroundingForTopic } = await import("./rag-client");
    const g = await ragGroundingForTopic(String(article.title), article.target_keyword, geo);
    ragBlock = g.block;
  } catch {
    /* RAG optional */
  }
  const prompt = `Create a complete SEO content brief grounded in live search data. The reader must finish understanding Kloudbean deeply — not generic cloud theory.
Title: ${article.title}
Target keyword: ${article.target_keyword ?? ""}
Geo: ${geo}
Pillar: ${article.pillar}
Cluster: ${article.cluster_name ?? article.cluster_id ?? "n/a"}
Required outcome: Explain how Kloudbean hosts, secures, prices, or migrates this use case. kloudbean_angle must be specific (feature + proof point).

${geoBlock}
${competitorBlock ? `\n${competitorBlock}\n` : ""}
${ragBlock ? `\n${ragBlock}\n` : ""}
${kb ? `${kb}\n\n` : ""}${buildResearchContext(article as Record<string, unknown>)}`;
  try {
    const response = await generateText({ model, system: SYSTEM, prompt });
    let briefData: Record<string, unknown>;
    try {
      const text = response.text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      briefData = JSON.parse(text);
    } catch {
      briefData = { raw: response.text };
    }
    await applyBriefToArticle(articleId, article as Record<string, unknown>, briefData);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export async function generateContentInternal(articleId: string): Promise<{ ok: boolean; error?: string }> {
  await ensureAiEnv();
  const { articlesRepo } = await repos();
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) return { ok: false, error: "not found" };
  const brief = article.brief as Record<string, unknown> | null;
  if (!brief) return { ok: false, error: "brief required first" };

  try {
    const { runContentEngine } = await import("./content-engine");
    const { renderArticleHtml } = await import("./content-render");
    const result = await runContentEngine(article as Record<string, unknown>, {
      minScore: Number(process.env.CONTENT_MIN_SCORE ?? 82),
      maxRevisions: Number(process.env.CONTENT_MAX_REVISIONS ?? 2),
      useRag: process.env.KLOUDBEAN_RAG_DISABLED !== "1",
      baseUrl: process.env.WP_SITE_URL,
    });
    if (!result.ok) return { ok: false, error: result.error ?? "content engine failed" };

    const html = renderArticleHtml(result.markdown, brief);
    await articlesRepo.updateArticle(articleId, {
      content_draft: result.markdown,
      content_html: html,
      quality_score: result.score.score,
      quality_report: {
        score: result.score.score,
        grade: result.score.grade,
        summary: result.score.summary,
        blocking: result.score.blocking,
        banned_claims: result.score.bannedClaims,
        checks: result.score.checks,
        passes: result.passes,
        internal_links: result.internalLinks,
        rag_sources: result.ragSources,
        log: result.log,
      },
      status: article.status === "brief_generated" ? "writing" : article.status,
      word_count_target: (brief.word_count as number) ?? article.word_count_target,
    });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export const generateBrief = createServerFn({ method: "POST" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const r = await generateBriefInternal(data.articleId);
    if (!r.ok) throw new Error(r.error ?? "Brief generation failed");
    const { articlesRepo, briefsRepo } = await repos();
    const article = await articlesRepo.getArticleById(data.articleId);
    return { brief: article?.brief, version: await briefsRepo.getLatestBriefVersion(data.articleId) };
  });

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const r = await generateContentInternal(data.articleId);
    if (!r.ok) throw new Error(r.error ?? "Content generation failed");
    return { ok: true };
  });

export const testAiConnectionFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAiEnv();
  const { testAiConnection, getResolvedAiConfig } = await import("./ai-provider");
  const result = await testAiConnection();
  const cfg = getResolvedAiConfig();
  return { ...result, configured: !!cfg, model: cfg?.modelId, baseURL: cfg?.baseURL };
});

export const refreshSupportKbFn = createServerFn({ method: "POST" }).handler(async () => {
  await ensureAiEnv();
  const { refreshSupportKnowledge } = await import("./support-kb");
  return refreshSupportKnowledge();
});

export const bulkGenerateBriefs = createServerFn({ method: "POST" })
  .inputValidator(z.object({ onlyMissing: z.boolean().default(true) }).parse)
  .handler(async ({ data }) => {
    const { articlesRepo } = await repos();
    const rows = await articlesRepo.listArticleIds({
      briefNull: data.onlyMissing,
      limit: 500,
    });
    const ids = rows.map((r) => r.id);
    let success = 0,
      failed = 0;
    const errors: string[] = [];
    let i = 0;
    const CONCURRENCY = 3;
    async function worker() {
      while (i < ids.length) {
        const idx = i++;
        const r = await generateBriefInternal(ids[idx]);
        if (r.ok) success++;
        else {
          failed++;
          if (r.error) errors.push(r.error);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
    return { total: ids.length, success, failed, errors: errors.slice(0, 5) };
  });
