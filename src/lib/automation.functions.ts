import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * AUTOMATION — the "set it and forget it" content engine.
 *
 * Advances articles through the pipeline autonomously:
 *   idea → (research) → (brief) → (content+score) → (auto-publish if score高 & enabled)
 *
 * Designed to be called on a schedule (cron) when self-hosted on Kloudbean, or
 * manually from the UI. Each invocation processes a bounded batch so it stays
 * within request limits and AI budget.
 *
 * SAFETY: auto-publish only fires when:
 *   - autoPublish === true AND
 *   - the draft's quality score >= publishMinScore AND
 *   - the scorecard is not "blocking" (no banned/false claims) AND
 *   - WordPress is configured.
 */

const automationSchema = z.object({
  limit: z.number().min(1).max(50).default(5),
  geo: z.enum(["sa", "in", "ae", "global"]).optional(),
  doResearch: z.boolean().default(true),
  doBriefs: z.boolean().default(true),
  doContent: z.boolean().default(true),
  autoPublish: z.boolean().default(false),
  publishStatus: z.enum(["draft", "publish"]).default("draft"),
  publishMinScore: z.number().min(0).max(100).default(85),
});

export type AutomationResult = {
  processed: number;
  researched: number;
  briefed: number;
  written: number;
  published: number;
  skippedLowScore: number;
  blocked: number;
  errors: string[];
  items: {
    id: string;
    title: string;
    stage: string;
    score?: number;
    grade?: string;
    published?: boolean;
    error?: string;
  }[];
};

export const runContentAutomation = createServerFn({ method: "POST" })
  .inputValidator(automationSchema.parse)
  .handler(async ({ data }): Promise<AutomationResult> => {
    return runContentAutomationInternal(data);
  });

export async function runContentAutomationInternal(
  data: z.infer<typeof automationSchema>,
): Promise<AutomationResult> {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();

    const articlesRepo = await import("@/server/db/repos/articles");
    const { applyResearchToArticleInternal } = await import("./dataforseo.functions");
    const { generateBriefInternal, generateContentInternal } = await import("./ai.functions");
    const { hasAiCredentials } = await import("./ai-provider");

    const result: AutomationResult = {
      processed: 0,
      researched: 0,
      briefed: 0,
      written: 0,
      published: 0,
      skippedLowScore: 0,
      blocked: 0,
      errors: [],
      items: [],
    };

    // Pull a batch of articles that still need work (no content yet),
    // oldest-scheduled first.
    const all = await articlesRepo.listArticles({ geo: data.geo, limit: 500 });
    const queue = all
      .filter((a) => !a.content_draft || (a.quality_score ?? 0) === 0)
      .slice(0, data.limit);

    const aiReady = hasAiCredentials();

    for (const article of queue) {
      result.processed++;
      const item: AutomationResult["items"][number] = {
        id: article.id,
        title: article.title,
        stage: "start",
      };
      try {
        // 1. Research if missing — Serper (cheap) preferred, DataForSEO fallback.
        if (data.doResearch && !article.keyword_data) {
          try {
            const { hasSerperCredentials } = await import("./serper-client");
            if (hasSerperCredentials()) {
              const { serperResearchForKeyword } = await import("./serper-discovery");
              const r = await serperResearchForKeyword(
                String(article.target_keyword ?? article.title),
                String(article.geo_target ?? "global"),
              );
              if (r) {
                const kd = (article.keyword_data as Record<string, unknown> | null) ?? {};
                await articlesRepo.updateArticle(article.id, {
                  keyword_data: {
                    ...kd,
                    keyword: article.target_keyword,
                    paa_questions: r.paa_questions,
                    top_10_urls: r.top_10_urls,
                    related_keywords: r.related_keywords.map((k) => ({ keyword: k, volume: null, difficulty: null, intent: null })),
                    difficulty: r.difficulty,
                    search_intent: r.intent,
                    discovery_source: "serper",
                  },
                });
                result.researched++;
                item.stage = "researched";
              }
            } else {
              await applyResearchToArticleInternal(article.id, String(article.geo_target ?? "sa"));
              result.researched++;
              item.stage = "researched";
            }
          } catch (e) {
            result.errors.push(`research ${article.id}: ${String((e as Error)?.message ?? e)}`);
          }
        }

        // 2. Brief if missing
        if (data.doBriefs && aiReady && !article.brief) {
          const r = await generateBriefInternal(article.id);
          if (r.ok) { result.briefed++; item.stage = "briefed"; }
          else result.errors.push(`brief ${article.id}: ${r.error}`);
        }

        // 3. Content (multi-pass engine + score)
        if (data.doContent && aiReady) {
          const r = await generateContentInternal(article.id);
          if (r.ok) {
            result.written++;
            item.stage = "written";
          } else {
            result.errors.push(`content ${article.id}: ${r.error}`);
          }
        }

        // 4. Auto-publish gate
        const fresh = await articlesRepo.getArticleById(article.id);
        const report = fresh?.quality_report as { blocking?: boolean } | null;
        const score = fresh?.quality_score ?? 0;
        item.score = score;
        item.grade = (fresh?.quality_report as { grade?: string } | null)?.grade;

        if (data.autoPublish && fresh?.content_draft) {
          if (report?.blocking) {
            result.blocked++;
            item.stage = "blocked";
          } else if (score < data.publishMinScore) {
            result.skippedLowScore++;
            item.stage = "low-score";
          } else {
            try {
              const { publishArticleInternal } = await import("./wordpress.functions");
              const pub = await publishArticleInternal(article.id, data.publishStatus);
              if (pub.ok) {
                result.published++;
                item.published = true;
                item.stage = "published";
              } else {
                result.errors.push(`publish ${article.id}: ${pub.error}`);
              }
            } catch (e) {
              result.errors.push(`publish ${article.id}: ${String((e as Error)?.message ?? e)}`);
            }
          }
        }
      } catch (e) {
        item.error = String((e as Error)?.message ?? e);
        result.errors.push(`${article.id}: ${item.error}`);
      }
      result.items.push(item);
    }

    return result;
}
