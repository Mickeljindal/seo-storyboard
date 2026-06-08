import "@tanstack/react-start/server-only";
import * as articlesRepo from "@/server/db/repos/articles";
import { CLUSTERS } from "./pillars";

/**
 * SEMANTIC SILO / TOPICAL MAP
 *
 * Organizes every article into a silo structure per cluster:
 *   - pillar/hub: the highest-opportunity broad article (the cluster's center)
 *   - supporting: narrower articles that link UP to the hub and SIDEWAYS to siblings
 *
 * This is what makes interlinking a real "silo": supporting → hub (contextual),
 * hub → supporting (curated), and limited cross-cluster bridges. The content
 * engine reads hub_article_id to point internal links the right way.
 */

export type SiloNode = {
  id: string;
  title: string;
  slug: string;
  keyword: string | null;
  clusterId: number | null;
  role: "pillar" | "hub" | "supporting";
  hubId: string | null;
  opportunity: number;
  status: string;
};

function opp(a: { quality_score?: number | null; keyword_data?: unknown }): number {
  const kd = a.keyword_data as { opportunity_score?: number } | null | undefined;
  return a.quality_score ?? kd?.opportunity_score ?? 0;
}

/**
 * Recompute the silo for one cluster (or all): pick the top article as hub,
 * everything else becomes supporting pointing to that hub. Persists silo_role +
 * hub_article_id so links and the strategy view reflect the real topical map.
 */
export async function rebuildSilo(geo?: string): Promise<{ clusters: number; hubs: number; supporting: number }> {
  const all = await articlesRepo.listArticles({ geo, limit: 5000 });
  let hubs = 0;
  let supporting = 0;
  const clusterIds = new Set<number>();

  // Group by cluster
  const byCluster = new Map<number, typeof all>();
  for (const a of all) {
    const cid = a.cluster_id ?? 0;
    clusterIds.add(cid);
    const list = byCluster.get(cid) ?? [];
    list.push(a);
    byCluster.set(cid, list);
  }

  for (const [cid, list] of byCluster) {
    if (cid === 0 || !list.length) continue;
    // Hub = highest opportunity (prefer already-published to anchor the silo).
    const sorted = [...list].sort((a, b) => {
      const pubA = a.status === "published" || a.status === "promoted" ? 1 : 0;
      const pubB = b.status === "published" || b.status === "promoted" ? 1 : 0;
      if (pubA !== pubB) return pubB - pubA;
      return opp(b) - opp(a);
    });
    const hub = sorted[0];
    for (const a of list) {
      const isHub = a.id === hub.id;
      const role = isHub ? "hub" : "supporting";
      const hubId = isHub ? null : hub.id;
      if (a.silo_role !== role || a.hub_article_id !== hubId) {
        await articlesRepo.updateArticle(a.id, { silo_role: role, hub_article_id: hubId });
      }
      if (isHub) hubs++;
      else supporting++;
    }
  }

  return { clusters: clusterIds.size, hubs, supporting };
}

/** Build the topical map for the strategy UI: clusters → hub + supporting nodes. */
export async function getTopicalMap(geo?: string): Promise<{
  clusters: {
    cluster_id: number;
    cluster_name: string;
    hub: SiloNode | null;
    supporting: SiloNode[];
    article_count: number;
    published: number;
  }[];
}> {
  const all = await articlesRepo.listArticles({ geo, limit: 5000 });
  const clusters = CLUSTERS.map((cluster) => {
    const inCluster = all.filter((a) => a.cluster_id === cluster.id);
    const nodes: SiloNode[] = inCluster.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.url_slug ?? "",
      keyword: a.target_keyword,
      clusterId: a.cluster_id,
      role: (a.silo_role as SiloNode["role"]) ?? "supporting",
      hubId: a.hub_article_id ?? null,
      opportunity: opp(a),
      status: a.status,
    }));
    const hub = nodes.find((n) => n.role === "hub" || n.role === "pillar") ?? null;
    const supporting = nodes.filter((n) => n.id !== hub?.id).sort((a, b) => b.opportunity - a.opportunity);
    return {
      cluster_id: cluster.id,
      cluster_name: cluster.name,
      hub,
      supporting,
      article_count: inCluster.length,
      published: inCluster.filter((a) => ["published", "promoted"].includes(a.status)).length,
    };
  });
  return { clusters };
}

/**
 * Re-cluster existing articles into the current 10-cluster scheme by matching
 * their title + keyword against cluster signal terms. Used after the cluster
 * definitions change so old articles map to the new global-ICP clusters.
 */
const CLUSTER_SIGNALS: Record<number, RegExp> = {
  1: /lovable|bolt\.?new|cursor|replit|\bv0\b|vibe.?cod|ai.generated app|ai.built app/i,
  2: /self.?host|\bn8n\b|supabase|gitlab|langflow|ollama|open webui|nextcloud|ghost|vaultwarden|gitea|immich/i,
  3: /deploy|next\.?js|node\.?js|laravel|django|flask|fastapi|react app|github.*deploy|ci\/cd/i,
  4: /\bvs\b|versus|alternative|compare|comparison|cloudways|render|railway|vercel|heroku|netlify|kinsta|wp engine/i,
  5: /agency|client (apps|sites|websites)|white.?label|reseller|multiple (apps|sites|projects)|freelanc/i,
  6: /wordpress|\bwp\b|woocommerce|frontend hosting/i,
  7: /database|postgres|mysql|mongodb|redis|elasticsearch|mariadb|object storage|\bs3\b|storage/i,
  8: /pricing|cost|cheap|affordable|saas (cost|sprawl|bill)|consolidat|value|tco/i,
  9: /security|ddos|bitninja|waf|firewall|load balanc|scaling|auto.?scal|backup|uptime/i,
  10: /enterprise|data residency|compliance|nca|cscc|sama|misa|dammam|ksa|saudi|government|gitlab|vpc|sla/i,
};

function detectClusterId(text: string): number {
  const t = text.toLowerCase();
  // priority order: most specific ICP clusters first
  const order = [1, 2, 4, 5, 6, 10, 3, 7, 9, 8];
  for (const id of order) {
    if (CLUSTER_SIGNALS[id].test(t)) return id;
  }
  return 8; // default: pricing/value (broad managed-cloud)
}

export async function reclusterArticles(): Promise<{ updated: number; total: number }> {
  const { CLUSTERS } = await import("./pillars");
  const { CLUSTER_HUBS } = await import("./cluster-seeds");
  const all = await articlesRepo.listArticles({ limit: 5000 });
  let updated = 0;
  for (const a of all) {
    const cid = detectClusterId(`${a.title} ${a.target_keyword ?? ""}`);
    const cluster = CLUSTERS.find((c) => c.id === cid);
    const anchor = CLUSTER_HUBS[cid]?.anchor ?? a.anchor ?? "Managed Cloud";
    if (a.cluster_id !== cid || a.cluster_name !== cluster?.name) {
      await articlesRepo.updateArticle(a.id, {
        cluster_id: cid,
        cluster_name: cluster?.name ?? null,
        anchor,
      });
      updated++;
    }
  }
  await rebuildSilo();
  return { updated, total: all.length };
}
