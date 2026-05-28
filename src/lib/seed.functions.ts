import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatDbError } from "./db-errors";
import { CLUSTER_HUBS } from "./cluster-seeds";
import { CLUSTERS } from "./pillars";
import { SEED_ARTICLES } from "./seed-data";

/** Map legacy 5 pillars → 10 topical clusters (rotated for variety). */
const PILLAR_CLUSTER_IDS: Record<number, number[]> = {
  1: [1, 4, 9, 10],
  2: [2],
  3: [6],
  4: [5],
  5: [3, 7, 8],
};

const pillarCounters: Record<number, number> = {};

function clusterMetaForPillar(pillar: number) {
  const ids = PILLAR_CLUSTER_IDS[pillar] ?? [1];
  const n = pillarCounters[pillar] ?? 0;
  pillarCounters[pillar] = n + 1;
  const clusterId = ids[n % ids.length];
  const cluster = CLUSTERS.find((c) => c.id === clusterId)!;
  const anchor = CLUSTER_HUBS[clusterId]?.anchor ?? "Managed Cloud";
  return {
    cluster_id: clusterId,
    cluster_name: cluster.name,
    anchor,
  };
}

export const seedArticles = createServerFn({ method: "POST" })
  .inputValidator(z.object({ force: z.boolean().optional() }).parse)
  .handler(async ({ data }) => {
    try {
    const articlesRepo = await import("@/server/db/repos/articles");
    const count = await articlesRepo.countArticles();
    if (count > 0 && !data.force) {
      const backfilled = await articlesRepo.backfillMissingClusters();
      if (backfilled > 0) {
        return { skipped: false, existing: count, backfilled };
      }
      return { skipped: true, existing: count };
    }
    if (data.force) {
      await articlesRepo.deleteAllArticles();
    }
    Object.keys(pillarCounters).forEach((k) => delete pillarCounters[Number(k)]);

    const rows = SEED_ARTICLES.map((a, idx) => {
      const cluster = clusterMetaForPillar(a.pillar);
      return {
        title: a.title,
        target_keyword: a.target_keyword,
        pillar: a.pillar,
        priority: a.priority,
        status: "idea" as const,
        idea_index: idx + 1,
        ...cluster,
        scheduled_week: Math.min(12, Math.floor(idx / 5) + 1),
        url_slug: a.target_keyword
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      };
    });
    await articlesRepo.insertArticles(rows);
    return { inserted: rows.length };
    } catch (e) {
      throw new Error(formatDbError(e));
    }
  });
