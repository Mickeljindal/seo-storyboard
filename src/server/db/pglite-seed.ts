import type { PGlite } from "@electric-sql/pglite";
import { CLUSTER_HUBS } from "@/lib/cluster-seeds";
import { CLUSTERS } from "@/lib/pillars";
import { SEED_ARTICLES } from "@/lib/seed-data";

const PILLAR_CLUSTER_IDS: Record<number, number[]> = {
  1: [1, 4, 9, 10],
  2: [2],
  3: [6],
  4: [5],
  5: [3, 7, 8],
};

function clusterForPillar(pillar: number, counters: Record<number, number>) {
  const ids = PILLAR_CLUSTER_IDS[pillar] ?? [1];
  const n = counters[pillar] ?? 0;
  counters[pillar] = n + 1;
  const clusterId = ids[n % ids.length];
  const cluster = CLUSTERS.find((c) => c.id === clusterId)!;
  const anchor = CLUSTER_HUBS[clusterId]?.anchor ?? "Managed Cloud";
  return { cluster_id: clusterId, cluster_name: cluster.name, anchor };
}

/** Seed articles using the existing PGlite connection — never open a second instance. */
export async function seedPgliteArticles(client: PGlite): Promise<number> {
  const existing = await client.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM articles`);
  const n = Number(existing.rows[0]?.n ?? 0);
  if (n > 0) return 0;

  const counters: Record<number, number> = {};
  for (const [idx, a] of SEED_ARTICLES.entries()) {
    const c = clusterForPillar(a.pillar, counters);
    const slug = a.target_keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const geo = detectSeedGeo(`${a.title} ${a.target_keyword}`);
    await client.query(
      `INSERT INTO articles (title, target_keyword, pillar, priority, status, scheduled_week, url_slug, cluster_id, cluster_name, anchor, idea_index, geo_target)
       VALUES ($1, $2, $3, $4, 'idea', $5, $6, $7, $8, $9, $10, $11)`,
      [
        a.title,
        a.target_keyword,
        a.pillar,
        a.priority,
        Math.min(12, Math.floor(idx / 5) + 1),
        slug,
        c.cluster_id,
        c.cluster_name,
        c.anchor,
        idx + 1,
        geo,
      ],
    );
  }
  return SEED_ARTICLES.length;
}

/**
 * Only tag an article as Saudi (sa) when it is genuinely about KSA/Saudi/Dammam
 * or local compliance. Everything else is global — so generic AWS/Linode/etc.
 * hosting topics don't get force-fit into the GCP-Dammam-only KSA rule.
 */
function detectSeedGeo(text: string): "sa" | "global" {
  const k = text.toLowerCase();
  return /saudi|ksa|dammam|me-central|riyadh|jeddah|\bnca\b|cscc|sama|misa|in-kingdom|data residency/.test(k)
    ? "sa"
    : "global";
}
