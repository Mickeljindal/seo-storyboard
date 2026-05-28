import { CLUSTERS } from "./pillars";

/**
 * Hub seeds for DataForSEO discovery — every seed must expand into
 * Kloudbean-scoped topics (managed cloud, deploy on Kloudbean, self-host on Kloudbean, or vs competitors).
 */
export const CLUSTER_HUBS: Record<
  number,
  { seeds: string[]; pillar: 1 | 2 | 3 | 4 | 5; anchor: string }
> = {
  1: {
    seeds: [
      "kloudbean managed cloud hosting",
      "managed hosting saudi arabia",
      "multi cloud hosting kloudbean",
    ],
    pillar: 1,
    anchor: "Managed Cloud",
  },
  2: {
    seeds: [
      "kloudbean enterprise plan",
      "nca compliant cloud hosting saudi",
      "misa cloud hosting kloudbean",
      "gcp dammam managed hosting kloudbean",
      "google cloud me-central2 saudi data residency",
    ],
    pillar: 2,
    anchor: "NCA Compliance",
  },
  3: {
    seeds: [
      "kloudbean ddos protection included",
      "bitninja managed hosting kloudbean",
      "waf managed cloud kloudbean",
    ],
    pillar: 5,
    anchor: "Security",
  },
  4: {
    seeds: [
      "cloudways alternative kloudbean",
      "wp engine alternative managed hosting",
      "managed aws vs diy kloudbean",
    ],
    pillar: 1,
    anchor: "Alternatives Page",
  },
  5: {
    seeds: [
      "deploy nodejs kloudbean",
      "deploy django kloudbean",
      "kloudbean github auto deploy",
    ],
    pillar: 4,
    anchor: "Deploy Docs",
  },
  6: {
    seeds: [
      "self host n8n kloudbean",
      "ollama hosting kloudbean",
      "langflow kloudbean deploy",
    ],
    pillar: 3,
    anchor: "AI Tools",
  },
  7: {
    seeds: [
      "managed postgresql kloudbean",
      "managed mongodb kloudbean",
      "kloudbean s3 object storage r2",
    ],
    pillar: 5,
    anchor: "S3 Storage",
  },
  8: {
    seeds: [
      "kloudbean flexible load balancer",
      "multi cloud load balancer kloudbean",
      "auto scaling managed cloud kloudbean",
    ],
    pillar: 5,
    anchor: "FLB",
  },
  9: {
    seeds: [
      "kloudbean pricing plans",
      "managed cloud hosting pricing comparison",
      "enterprise managed hosting cost kloudbean",
    ],
    pillar: 1,
    anchor: "Pricing",
  },
  10: {
    seeds: [
      "agency hosting kloudbean",
      "wordpress agency managed hosting",
      "freelancer managed cloud kloudbean",
    ],
    pillar: 1,
    anchor: "Agency Program",
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
