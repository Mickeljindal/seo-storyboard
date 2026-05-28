import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { CLUSTER_HUBS } from "../src/lib/cluster-seeds";
import { CLUSTERS } from "../src/lib/pillars";
import { SEED_ARTICLES } from "../src/lib/seed-data";

const dataDir = path.join(process.cwd(), process.env.DATABASE_PATH ?? ".local/seo-pglite");
const client = new PGlite(dataDir);

const PILLAR_CLUSTER_IDS: Record<number, number[]> = {
  1: [1, 4, 9, 10],
  2: [2],
  3: [6],
  4: [5],
  5: [3, 7, 8],
};
const counters: Record<number, number> = {};

function clusterForPillar(pillar: number) {
  const ids = PILLAR_CLUSTER_IDS[pillar] ?? [1];
  const n = counters[pillar] ?? 0;
  counters[pillar] = n + 1;
  const clusterId = ids[n % ids.length];
  const cluster = CLUSTERS.find((c) => c.id === clusterId)!;
  const anchor = CLUSTER_HUBS[clusterId]?.anchor ?? "Managed Cloud";
  return { cluster_id: clusterId, cluster_name: cluster.name, anchor };
}

const existing = await client.query(`SELECT COUNT(*)::int AS n FROM articles`);
if (Number(existing.rows[0]?.n ?? 0) > 0) {
  console.log("Skip seed — articles already exist");
  await client.close();
  process.exit(0);
}

for (const [idx, a] of SEED_ARTICLES.entries()) {
  const c = clusterForPillar(a.pillar);
  const slug = a.target_keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await client.query(
    `INSERT INTO articles (title, target_keyword, pillar, priority, status, scheduled_week, url_slug, cluster_id, cluster_name, anchor, idea_index)
     VALUES ($1, $2, $3, $4, 'idea', $5, $6, $7, $8, $9, $10)`,
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
    ],
  );
}

console.log(`✓ Seeded ${SEED_ARTICLES.length} articles`);
await client.close();
