import "@tanstack/react-start/server-only";
import { CLUSTERS } from "./pillars";

/**
 * SELF-LEARNING KNOWLEDGE GRAPH
 *
 * The system's evolving understanding of "what Kloudbean is" and the topic
 * universe around it. It is built in three layers:
 *
 *   1. SEED   — canonical entities from the Kloudbean KB (products, providers,
 *               competitors, personas, regions, self-hosted apps, clusters) and
 *               their relationships. This is the stable backbone.
 *   2. INGEST — every article, tool, and keyword becomes a topic/keyword node
 *               linked to the entities it mentions and to its cluster. The graph
 *               grows as the engine produces content.
 *   3. LEARN  — real outcomes (quality + Google Search Console rewards, already
 *               collected by the learning loop) are folded back as node rewards,
 *               so entities/clusters that actually win gain weight.
 *
 * Outputs that close the loop: content GAPS (important entities with thin topic
 * coverage) and graph-derived topic/tool/reel IDEAS.
 */

// --- canonical seed data (kept consistent with kloudbean-knowledge/scope) ---

const PROVIDERS = [
  "AWS",
  "Akamai Linode",
  "Vultr",
  "DigitalOcean",
  "Google Cloud",
  "Amazon Lightsail",
  "UpCloud",
];
const COMPETITORS = [
  "Cloudways",
  "WP Engine",
  "Kinsta",
  "Render",
  "Railway",
  "Vercel",
  "Heroku",
  "Netlify",
  "Fly.io",
  "RunCloud",
];
const SELF_HOSTED_APPS = [
  "n8n",
  "Supabase",
  "GitLab",
  "Langflow",
  "Open WebUI",
  "Ollama",
  "Nextcloud",
  "Plausible",
  "Ghost",
  "Vaultwarden",
  "Gitea",
  "Immich",
];
const PRODUCTS = [
  "Managed Cloud Hosting",
  "Flexible Load Balancer",
  "S3 / R2 Object Storage",
  "KloudGPT",
  "Managed Databases",
  "CI/CD Pipelines",
  "BitNinja Security",
  "Cloudflare Enterprise",
  "Free Migrations",
  "Self-Hosted App Catalog",
];
const PERSONAS = [
  "AI / Vibe Coders (Lovable, Bolt, Cursor)",
  "Agencies & Freelancers",
  "SaaS Founders",
  "WordPress Site Owners",
  "Enterprise & Regulated (KSA)",
];
const RUNTIMES = [
  "Node.js",
  "PHP",
  "Python",
  "Ruby",
  "Go",
  "Java",
  "Next.js",
  "Laravel",
  "Django",
  "WordPress",
];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * SEED — create the canonical entity backbone. Idempotent (upserts dedupe), so
 * it can run on every rebuild without duplicating.
 */
export async function seedKnowledgeGraph(): Promise<{ nodes: number; edges: number }> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  let nodes = 0;
  let edges = 0;

  const brandId = await kg.upsertNode({
    type: "concept",
    key: "kloudbean",
    label: "Kloudbean",
    description: "Managed multi-cloud hosting + bundled DevOps stack.",
    source: "seed",
    weightDelta: 5,
  });
  nodes++;

  const addAll = async (
    type: string,
    items: string[],
    relation: string,
    extra?: Partial<{ description: string }>,
  ) => {
    for (const item of items) {
      const id = await kg.upsertNode({
        type,
        key: norm(item),
        label: item,
        source: "seed",
        description: extra?.description,
      });
      nodes++;
      await kg.upsertEdge(brandId, id, relation);
      edges++;
    }
  };

  await addAll("product", PRODUCTS, "offers");
  await addAll("provider", PROVIDERS, "supports");
  await addAll("competitor", COMPETITORS, "competes_with");
  await addAll("persona", PERSONAS, "serves");
  await addAll("app", SELF_HOSTED_APPS, "hosts");
  await addAll("runtime", RUNTIMES, "runs");

  // Region
  const dammam = await kg.upsertNode({
    type: "region",
    key: "gcp-dammam-me-central2",
    label: "GCP Dammam (me-central2)",
    description: "In-Kingdom Google Cloud region for KSA data residency.",
    geo: "sa",
    source: "seed",
    weightDelta: 3,
  });
  nodes++;
  await kg.upsertEdge(brandId, dammam, "operates_in");
  edges++;

  // Clusters (topical authority) — link brand → cluster.
  for (const c of CLUSTERS) {
    const id = await kg.upsertNode({
      type: "cluster",
      key: `cluster-${c.id}`,
      label: c.name,
      clusterId: c.id,
      source: "seed",
      weightDelta: 2,
    });
    nodes++;
    await kg.upsertEdge(brandId, id, "covers");
    edges++;
  }

  return { nodes, edges };
}

/** All seed entity terms (for substring matching during ingest). */
function entityTerms(): { type: string; label: string }[] {
  return [
    ...PRODUCTS.map((label) => ({ type: "product", label })),
    ...PROVIDERS.map((label) => ({ type: "provider", label })),
    ...COMPETITORS.map((label) => ({ type: "competitor", label })),
    ...SELF_HOSTED_APPS.map((label) => ({ type: "app", label })),
    ...RUNTIMES.map((label) => ({ type: "runtime", label })),
  ];
}

/**
 * INGEST — turn articles, tools, and keywords into topic/keyword nodes linked to
 * the entities they mention and to their cluster.
 */
export async function ingestContentIntoGraph(): Promise<{ topics: number; links: number }> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  const articlesRepo = await import("@/server/db/repos/articles");
  let topics = 0;
  let links = 0;

  const terms = entityTerms();

  // Pre-resolve entity node ids once.
  const entityIds = new Map<string, string>();
  for (const t of terms) {
    const id = await kg.upsertNode({
      type: t.type,
      key: norm(t.label),
      label: t.label,
      source: "seed",
      weightDelta: 0,
    });
    entityIds.set(norm(t.label), id);
  }
  // cluster ids
  const clusterIds = new Map<number, string>();
  for (const c of CLUSTERS) {
    const id = await kg.upsertNode({
      type: "cluster",
      key: `cluster-${c.id}`,
      label: c.name,
      clusterId: c.id,
      source: "seed",
      weightDelta: 0,
    });
    clusterIds.set(c.id, id);
  }

  const linkTopicToEntities = async (topicId: string, text: string, clusterId?: number | null) => {
    const hay = ` ${norm(text)} `;
    for (const t of terms) {
      if (hay.includes(` ${norm(t.label)} `) || hay.includes(norm(t.label))) {
        const eid = entityIds.get(norm(t.label));
        if (eid) {
          await kg.upsertEdge(topicId, eid, "mentions");
          links++;
        }
      }
    }
    if (clusterId != null && clusterIds.has(clusterId)) {
      await kg.upsertEdge(topicId, clusterIds.get(clusterId)!, "belongs_to");
      links++;
    }
  };

  // Articles → topic nodes
  const articles = await articlesRepo.listArticles({ limit: 1000 });
  for (const a of articles) {
    const label = a.target_keyword || a.title;
    if (!label) continue;
    const id = await kg.upsertNode({
      type: "topic",
      key: norm(label),
      label,
      clusterId: a.cluster_id ?? null,
      geo: a.geo_target ?? null,
      source: "article",
      data: { articleId: a.id, status: a.status, quality: a.quality_score },
      weightDelta: a.status === "published" ? 2 : 1,
    });
    topics++;
    await linkTopicToEntities(id, `${a.title} ${a.target_keyword ?? ""}`, a.cluster_id);
  }

  // Tools → topic nodes
  try {
    const toolsRepo = await import("@/server/db/repos/tools");
    const tools = await toolsRepo.listTools({ limit: 1000 });
    for (const t of tools) {
      const label = t.target_keyword || t.name;
      const id = await kg.upsertNode({
        type: "topic",
        key: norm(label),
        label,
        source: "tool",
        data: { toolId: t.id, status: t.status },
        weightDelta: 1,
      });
      topics++;
      await linkTopicToEntities(id, `${t.name} ${t.target_keyword ?? ""}`, null);
    }
  } catch {
    /* tools optional */
  }

  return { topics, links };
}

/**
 * KLOUDGRAPH — fold real competitor intelligence into the graph. Competitor
 * nodes gain weight from their ACTUAL measured strength (ranking keywords +
 * backlinks + referring domains), not a static guess, and every keyword this
 * niche has proven demand for (via keyword-gap data) becomes a topic node
 * linked to its competitor(s) and cluster — so the graph's gap analysis and
 * the competitor graph work off the same live picture.
 */
export async function ingestKloudgraphIntoGraph(): Promise<{
  competitors: number;
  opportunities: number;
}> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  let competitors = 0;
  let opportunities = 0;

  try {
    const { getCompetitorStrength, getAggregatedOpportunities } =
      await import("./kloudgraph/opportunity-engine");

    // Competitor nodes — weight = real measured strength, not a guess.
    const strengths = await getCompetitorStrength();
    const competitorIds = new Map<string, string>();
    for (const c of strengths) {
      const id = await kg.upsertNode({
        type: "competitor",
        key: norm(c.domain),
        label: c.domain,
        description: `Tier ${c.tier ?? "?"} · ${c.rankingKeywords.toLocaleString()} ranking keywords · ${c.backlinkCount.toLocaleString()} backlinks`,
        data: { ...c, kloudgraph: true },
        source: "kloudgraph",
        weightDelta: c.strengthScore,
      });
      competitorIds.set(c.domain, id);
      competitors++;
    }

    // Opportunity keywords — proven demand this niche cares about, linked to
    // whichever competitors rank for them and to their content cluster.
    const opps = await getAggregatedOpportunities({ limit: 150, minRelevance: 0.55 });
    const clusterIds = new Map<number, string>();
    for (const c of CLUSTERS) {
      const id = await kg.upsertNode({
        type: "cluster",
        key: `cluster-${c.id}`,
        label: c.name,
        clusterId: c.id,
        source: "seed",
        weightDelta: 0,
      });
      clusterIds.set(c.id, id);
    }

    for (const o of opps) {
      const topicId = await kg.upsertNode({
        type: "opportunity",
        key: norm(o.keyword),
        label: o.keyword,
        clusterId: o.clusterId ?? null,
        source: "kloudgraph",
        data: {
          volume: o.volume,
          difficulty: o.difficulty,
          score: o.score,
          competitors: o.competitors,
        },
        weightDelta: o.score,
      });
      opportunities++;
      for (const dom of o.competitors) {
        const cid = competitorIds.get(dom);
        if (cid) await kg.upsertEdge(cid, topicId, "ranks_for", 1);
      }
      if (o.clusterId != null && clusterIds.has(o.clusterId)) {
        await kg.upsertEdge(topicId, clusterIds.get(o.clusterId)!, "belongs_to", 1);
      }
    }

    // Market segments — one node per competitor category (Managed cloud/
    // WordPress, PaaS, Cloud infra, etc.), weighted by winnability so the
    // graph surfaces "which segment to attack" alongside "which keyword".
    // Every competitor in that segment gets a "competes_in" edge to it.
    const { getMarketMap } = await import("./kloudgraph/market-map");
    const segments = await getMarketMap();
    for (const seg of segments) {
      const segId = await kg.upsertNode({
        type: "market_segment",
        key: norm(seg.category),
        label: seg.category,
        description: `${seg.competitorCount} competitors · ${seg.opportunityKeywords} unclaimed keyword(s) · winnability ${seg.winnabilityScore}`,
        data: { ...seg, kloudgraph: true },
        source: "kloudgraph",
        weightDelta: seg.winnabilityScore,
      });
      for (const dom of seg.competitors) {
        const cid = competitorIds.get(dom);
        if (cid) await kg.upsertEdge(cid, segId, "competes_in", 1);
      }
    }
  } catch {
    /* KLOUDGRAPH data optional — graph still works without it */
  }

  return { competitors, opportunities };
}

/**
 * LEARN — fold real outcomes into node rewards so the graph understands what
 * actually wins. Uses the same signals the discovery ranker uses.
 */
export async function learnIntoGraph(): Promise<{ clustersRewarded: number }> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  const { getLearningAggregates } = await import("@/server/db/repos/signals");
  const agg = await getLearningAggregates();
  let clustersRewarded = 0;
  for (const [cid, c] of Object.entries(agg.byCluster)) {
    const cluster = CLUSTERS.find((x) => x.id === Number(cid));
    if (!cluster) continue;
    await kg.addNodeReward("cluster", `cluster-${cid}`, c.avgReward * Math.min(c.n, 10));
    clustersRewarded++;
  }
  // Blend real search rewards per cluster when available.
  try {
    const { getSearchRewardByCluster } = await import("@/server/db/repos/search-performance");
    const { rewardFromSearch } = await import("./learning-ranker");
    const byCluster = await getSearchRewardByCluster(rewardFromSearch);
    for (const [cid, c] of Object.entries(byCluster)) {
      await kg.addNodeReward("cluster", `cluster-${cid}`, c.avgReward * 1.5);
    }
  } catch {
    /* search rewards optional */
  }
  return { clustersRewarded };
}

/** Full rebuild: seed → ingest → competitor intel → learn. Idempotent. */
export async function rebuildKnowledgeGraph(): Promise<{
  seeded: { nodes: number; edges: number };
  ingested: { topics: number; links: number };
  kloudgraph: { competitors: number; opportunities: number };
  learned: { clustersRewarded: number };
  totals: { nodes: number; edges: number };
}> {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const seeded = await seedKnowledgeGraph();
  const ingested = await ingestContentIntoGraph();
  const kloudgraph = await ingestKloudgraphIntoGraph();
  const learned = await learnIntoGraph();
  const kg = await import("@/server/db/repos/knowledge-graph");
  const totals = { nodes: await kg.countNodes(), edges: await kg.countEdges() };
  return { seeded, ingested, kloudgraph, learned, totals };
}

// --- queries: graph view, gaps, derived ideas -------------------------------

export type GraphView = {
  nodes: {
    id: string;
    type: string;
    label: string;
    weight: number;
    reward: number;
    mentions: number;
    degree: number;
  }[];
  edges: { source: string; target: string; relation: string; weight: number }[];
  byType: Record<string, number>;
};

/** Top-weighted nodes + their edges, for the dashboard graph. */
export async function getGraphView(limit = 60): Promise<GraphView> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  const allNodes = await kg.listNodes({ limit: 500 });
  const degrees = await kg.edgeDegrees();
  const ranked = allNodes
    .map((n) => ({ ...n, degree: degrees[n.id] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
  const keep = new Set(ranked.map((n) => n.id));
  const edges = (await kg.listEdges(3000)).filter(
    (e) => keep.has(e.source_id) && keep.has(e.target_id),
  );
  const byType: Record<string, number> = {};
  for (const n of allNodes) byType[n.type] = (byType[n.type] ?? 0) + 1;
  return {
    nodes: ranked.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      weight: Math.round(n.weight * 100) / 100,
      reward: Math.round(n.reward * 100) / 100,
      mentions: n.mentions,
      degree: n.degree,
    })),
    edges: edges.map((e) => ({
      source: e.source_id,
      target: e.target_id,
      relation: e.relation,
      weight: e.weight,
    })),
    byType,
  };
}

/**
 * GAPS — important entities (high weight) with thin topic coverage (low degree).
 * These are the highest-leverage things to write/build about next.
 */
export async function getGraphGaps(
  limit = 12,
): Promise<
  { id: string; type: string; label: string; weight: number; degree: number; reason: string }[]
> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  const degrees = await kg.edgeDegrees();
  const nodes = await kg.listNodes({ limit: 500 });
  const entityTypes = new Set([
    "product",
    "provider",
    "competitor",
    "app",
    "persona",
    "region",
    "cluster",
    "runtime",
  ]);
  return (
    nodes
      .filter((n) => entityTypes.has(n.type))
      .map((n) => ({ ...n, degree: degrees[n.id] ?? 0 }))
      // important but under-covered: weight high, few topic links
      .sort((a, b) => b.weight / (b.degree + 1) - a.weight / (a.degree + 1))
      .slice(0, limit)
      .map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        weight: Math.round(n.weight * 100) / 100,
        degree: n.degree,
        reason:
          n.degree <= 1
            ? `Core ${n.type} with almost no content — big opportunity`
            : `Under-covered ${n.type} (${n.degree} links) relative to its importance`,
      }))
  );
}

/** Plain-language summary of "what the system understands Kloudbean to be". */
export async function getGraphUnderstanding(): Promise<{
  summary: string;
  topEntities: { label: string; type: string; weight: number; reward: number }[];
}> {
  const kg = await import("@/server/db/repos/knowledge-graph");
  const nodes = await kg.listNodes({ limit: 40 });
  const top = nodes
    .filter((n) => n.type !== "topic" && n.type !== "keyword")
    .slice(0, 12)
    .map((n) => ({
      label: n.label,
      type: n.type,
      weight: Math.round(n.weight * 10) / 10,
      reward: Math.round(n.reward * 10) / 10,
    }));
  const products = nodes
    .filter((n) => n.type === "product")
    .slice(0, 4)
    .map((n) => n.label);
  const winning = nodes
    .filter((n) => n.reward > 0)
    .sort((a, b) => b.reward - a.reward)
    .slice(0, 3)
    .map((n) => n.label);
  const summary =
    `Kloudbean is understood as managed multi-cloud hosting with a bundled DevOps stack` +
    (products.length ? ` (${products.join(", ")})` : "") +
    `, serving AI/vibe-coders, agencies, SaaS founders and KSA enterprise.` +
    (winning.length
      ? ` Topics currently winning on real signals: ${winning.join(", ")}.`
      : ` No outcome signals yet — learning will sharpen this.`);
  return { summary, topEntities: top };
}
