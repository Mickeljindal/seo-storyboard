import { KLOUDBEAN_KNOWLEDGE_PROMPT, scoreKsaGcpAlignment } from "./kloudbean-knowledge";

/**
 * Kloudbean topical authority guardrails.
 * Every topic, brief, and article must deepen understanding of Kloudbean
 * or how to use workloads ON Kloudbean — never generic off-brand SEO filler.
 */

/** Core copy for AI system prompts — keep in sync with product marketing. */
export const KLOUDBEAN_PROMPT_CORE = `SCOPE (NON-NEGOTIABLE):
- You ONLY create content for Kloudbean (kloudbean.com) — Zero-Ops managed multi-cloud by Secured Orbis Pvt. Ltd.
- Every article must answer: "Why Kloudbean?" or "How do I run X on Kloudbean?" or "Kloudbean vs [competitor] for [use case]".
- Do NOT write generic cloud tutorials, unrelated SaaS roundups, or competitor love letters. If Kloudbean is not the resolution, reject the angle.
- Depth means: product specifics (7 providers, bundled BitNinja + Cloudflare Enterprise, FLB, R2 storage, KloudGPT, self-hosted app catalog, Enterprise $7,500/mo / $45K implementation, NCA/MISA delivery), pricing anchors, migration path, and internal links to sibling Kloudbean cluster pages.
- Supported self-hosted apps on Kloudbean: n8n, Langflow, Open WebUI, Ollama, Nextcloud, Plausible, Ghost, Vaultwarden, Gitea, Immich, Supabase (as hosted workload), etc.
- Geo focus: Saudi Arabia, UAE, India, Global — cite NCA/CSCC/SAMA/MISA where relevant.

${KLOUDBEAN_KNOWLEDGE_PROMPT}`;

const STRONG_SIGNALS = [
  "kloudbean",
  "kloudgpt",
  "managed cloud",
  "managed hosting",
  "managed wordpress",
  "managed aws",
  "managed gcp",
  "managed azure",
  "managed linode",
  "managed digitalocean",
  "managed hetzner",
  "managed vultr",
  "managed postgres",
  "managed postgresql",
  "managed mysql",
  "managed mongodb",
  "managed elasticsearch",
  "self-host",
  "self hosted",
  "self-hosted",
  "deploy on",
  "deploy to",
  "deploy ",
  "cloudways",
  "wp engine",
  "kinsta",
  "runcloud",
  "serverpilot",
  "alternative",
  "vs ",
  " versus ",
  "nca ",
  "cscc",
  "sama ",
  "misa ",
  "bitninja",
  "cloudflare enterprise",
  "flexible load balancer",
  "object storage",
  "r2 storage",
  "free migration",
  "devops support",
  "enterprise plan",
  "agency hosting",
  "zero egress",
  "n8n",
  "langflow",
  "open webui",
  "ollama",
  "nextcloud",
  "plausible",
  "vaultwarden",
  "immich",
  "dammam",
  "me-central2",
  "me central2",
  "data residency",
  "in-kingdom",
  "saudi arabia hosting",
  "ksa hosting",
  "gcp dammam",
  "google cloud dammam",
  "supabase",
  "linode",
  "digitalocean",
  "hetzner",
  "vultr",
  "wordpress hosting",
  "nodejs hosting",
  "laravel hosting",
  "django hosting",
  "fastapi",
  "next.js",
  "nextjs",
];

/** Keywords that are almost never Kloudbean-scoped unless paired with hosting/deploy signals. */
const WEAK_ALONE = [
  "weather",
  "recipe",
  "casino",
  "forex",
  "crypto trading",
  "dating",
  "crm software",
  "email marketing",
  "instagram growth",
  "tiktok",
  "resume template",
  "minecraft server", // unless "managed" or kloudbean
];

const OFF_BRAND_BLOCK = [
  "shopify store design",
  "google ads tutorial",
  "facebook ads",
  "seo agency",
  "link building service",
  "guest post",
  "ahrefs tutorial",
  "semrush",
];

const HOSTING_CONTEXT = [
  "hosting",
  "host ",
  "server",
  "cloud",
  "vps",
  "deploy",
  "migrate",
  "backup",
  "ssl",
  "cdn",
  "waf",
  "ddos",
  "load balancer",
  "kubernetes",
  "docker",
  "database",
  "compliance",
  "enterprise",
];

export function normalizeForScope(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** 0 = off-brand, higher = more Kloudbean-relevant. Threshold: use >= 4 for auto-discovered topics. */
export function scoreKloudbeanRelevance(keyword: string): number {
  const k = normalizeForScope(keyword);
  if (!k || k.length < 3) return 0;

  for (const bad of OFF_BRAND_BLOCK) {
    if (k.includes(bad)) return 0;
  }

  let score = 0;
  if (k.includes("kloudbean") || k.includes("kloudgpt")) score += 12;
  score += scoreKsaGcpAlignment(k);

  for (const s of STRONG_SIGNALS) {
    if (k.includes(s)) score += 3;
  }

  const hasHosting = HOSTING_CONTEXT.some((h) => k.includes(h));
  if (hasHosting) score += 2;

  for (const weak of WEAK_ALONE) {
    if (k.includes(weak) && !hasHosting && !k.includes("kloudbean")) score -= 8;
  }

  // Pure generic tech learning without hosting path
  if (/^(how to|what is|learn |tutorial )/.test(k) && !hasHosting && !k.includes("kloudbean")) {
    score -= 5;
  }

  // Competitor brand alone is OK only with comparison/hosting context
  const competitors = ["aws", "azure", "gcp", "google cloud"];
  for (const c of competitors) {
    if (k.includes(c) && !k.includes("managed") && !k.includes("hosting") && !k.includes("kloudbean") && !k.includes("alternative")) {
      score -= 3;
    }
  }

  return Math.max(0, score);
}

export function isKloudbeanScopedKeyword(keyword: string, minScore = 4): boolean {
  return scoreKloudbeanRelevance(keyword) >= minScore;
}

/** Curated fallbacks when DataForSEO returns off-brand ideas. */
export const CLUSTER_FALLBACK_KEYWORDS: Record<number, string[]> = {
  1: [
    "kloudbean managed cloud hosting",
    "managed hosting saudi arabia kloudbean",
    "multi cloud dashboard kloudbean",
  ],
  2: [
    "kloudbean enterprise plan pricing",
    "nca compliant hosting kloudbean",
    "misa cloud hosting kloudbean",
    "gcp dammam managed hosting kloudbean",
    "google cloud me-central2 kloudbean",
    "ksa data residency hosting kloudbean",
  ],
  3: [
    "kloudbean ddos protection included",
    "bitninja managed hosting kloudbean",
    "waf managed cloud kloudbean",
  ],
  6: [
    "self host n8n kloudbean",
    "ollama gpu hosting kloudbean",
    "langflow on kloudbean",
  ],
  4: [
    "deploy nextjs kloudbean",
    "deploy laravel kloudbean",
    "github auto deploy kloudbean",
  ],
  5: [
    "kloudbean bitninja included",
    "kloudbean flexible load balancer",
    "kloudbean s3 r2 storage",
  ],
  7: [
    "managed postgresql kloudbean",
    "managed mongodb kloudbean",
    "kloudbean object storage pricing",
  ],
  8: [
    "kloudbean load balancer multi cloud",
    "auto scaling kloudbean",
    "kubernetes managed kloudbean",
  ],
  9: [
    "kloudbean pricing plans",
    "cheap managed cloud kloudbean",
    "enterprise cloud cost kloudbean",
  ],
  10: [
    "agency hosting kloudbean",
    "wordpress agency cloud kloudbean",
    "reseller hosting kloudbean",
  ],
};

export function filterToKloudbeanTopics<T extends { keyword: string }>(
  items: T[],
  minScore = 4,
): T[] {
  return items.filter((item) => isKloudbeanScopedKeyword(item.keyword, minScore));
}
