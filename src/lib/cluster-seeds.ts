import { CLUSTERS } from "./pillars";

/**
 * Hub seeds for keyword discovery — every seed must expand into Kloudbean-scoped
 * topics that match the real ICP (deploy AI/vibe-coded apps, self-host tools,
 * agency multi-app hosting, vs competitors, pricing/consolidation, enterprise).
 * Cluster IDs map to CLUSTERS in pillars.ts.
 */
export const CLUSTER_HUBS: Record<
  number,
  { seeds: string[]; pillar: 1 | 2 | 3 | 4 | 5; anchor: string }
> = {
  // 1 — Deploy AI / Vibe-Coded Apps
  1: {
    seeds: [
      "deploy lovable app",
      "lovable self hosted",
      "deploy bolt.new app",
      "deploy cursor app",
      "where to host vibe coded app",
      "deploy ai generated app",
    ],
    pillar: 4,
    anchor: "Deploy Lovable",
  },
  // 2 — Self-Hosted Tools
  2: {
    seeds: [
      "self host n8n",
      "self host supabase",
      "self host gitlab",
      "ollama hosting",
      "langflow deploy",
    ],
    pillar: 3,
    anchor: "AI & Tools",
  },
  // 3 — App Deployment Tutorials (stacks)
  3: {
    seeds: [
      "deploy nextjs app to server",
      "deploy nodejs app with database",
      "deploy laravel app",
      "deploy django app",
      "deploy react app to production",
    ],
    pillar: 4,
    anchor: "Deploy Next.js",
  },
  // 4 — vs Competitors
  4: {
    seeds: [
      "vercel alternative full stack hosting",
      "render.com alternative",
      "railway alternative",
      "cloudways alternative",
      "heroku alternative",
      "netlify alternative backend",
    ],
    pillar: 1,
    anchor: "Alternatives Page",
  },
  // 5 — Agency & Multi-App Hosting
  5: {
    seeds: [
      "host multiple client websites one server",
      "agency hosting many apps",
      "white label hosting agency",
      "reseller cloud hosting",
    ],
    pillar: 1,
    anchor: "Agency Partners",
  },
  // 6 — WordPress & Frontend
  6: {
    seeds: [
      "managed wordpress hosting",
      "host wordpress and nextjs together",
      "wp engine alternative",
      "kinsta alternative",
    ],
    pillar: 1,
    anchor: "WordPress Hosting",
  },
  // 7 — Databases, Storage & S3
  7: {
    seeds: [
      "managed postgresql hosting",
      "managed mongodb hosting",
      "s3 object storage zero egress",
      "managed redis hosting",
    ],
    pillar: 5,
    anchor: "Managed Databases",
  },
  // 8 — Pricing, Cost & SaaS Consolidation
  8: {
    seeds: [
      "reduce saas costs self host",
      "cheap full stack hosting",
      "managed cloud hosting pricing",
      "consolidate apps one server",
    ],
    pillar: 1,
    anchor: "Pricing",
  },
  // 9 — Security, Scaling & Load Balancing
  9: {
    seeds: [
      "ddos protection included hosting",
      "bitninja managed hosting",
      "flexible load balancer multi cloud",
      "auto scaling managed cloud",
    ],
    pillar: 5,
    anchor: "Security Suite",
  },
  // 10 — Enterprise & Data Residency (incl. KSA)
  10: {
    seeds: [
      "enterprise managed cloud hosting",
      "data residency cloud hosting",
      "nca compliant cloud hosting saudi",
      "gcp dammam managed hosting",
      "self host gitlab enterprise",
    ],
    pillar: 2,
    anchor: "Enterprise Hosting",
  },
};

export const DEFAULT_COMPETITOR_DOMAIN = "cloudways.com";

export function clusterById(id: number) {
  return CLUSTERS.find((c) => c.id === id) ?? { id, name: "Cluster", short: "?" };
}

export function normalizeKeyword(kw: string): string {
  return kw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function slugFromKeyword(kw: string): string {
  return kw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleFromKeyword(
  keyword: string,
  clusterName: string,
  intent: string | null,
): string {
  const k = normalizeKeyword(keyword);
  const words = keyword.split(" ").map((w) => (w.length <= 3 ? w : w.charAt(0).toUpperCase() + w.slice(1)));
  const base = words.join(" ");

  if (k.includes("kloudbean")) {
    if (intent === "commercial") return `${base}: Plans, Features & Migration`;
    if (intent === "transactional") return `${base}: Deploy in Minutes`;
    return `${base}: In-Depth Guide`;
  }

  if (intent === "commercial") return `${base} on Kloudbean vs Alternatives (${clusterName})`;
  if (intent === "transactional") return `Run ${base} on Kloudbean — Setup Guide`;
  return `${base} on Kloudbean: ${clusterName} Deep Dive`;
}
