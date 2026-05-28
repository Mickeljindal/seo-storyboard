import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLUSTER_HUBS } from "../src/lib/cluster-seeds";
import { CLUSTERS } from "../src/lib/pillars";
import { SEED_ARTICLES } from "../src/lib/seed-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

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

import { connectDb } from "./connect-db.mjs";

const { sql } = await connectDb();

const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM articles`;
if (n > 0) {
  console.log(`Skip seed — ${n} articles already exist`);
  await sql.end();
  process.exit(0);
}

for (const [idx, a] of SEED_ARTICLES.entries()) {
  const c = clusterForPillar(a.pillar);
  const slug = a.target_keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await sql`
    INSERT INTO articles (title, target_keyword, pillar, priority, status, scheduled_week, url_slug, cluster_id, cluster_name, anchor, idea_index)
    VALUES (${a.title}, ${a.target_keyword}, ${a.pillar}, ${a.priority}, 'idea', ${Math.min(12, Math.floor(idx / 5) + 1)}, ${slug}, ${c.cluster_id}, ${c.cluster_name}, ${c.anchor}, ${idx + 1})
  `;
}

console.log(`✓ Seeded ${SEED_ARTICLES.length} articles`);
await sql.end();
