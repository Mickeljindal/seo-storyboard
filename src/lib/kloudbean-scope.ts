import { KLOUDBEAN_KNOWLEDGE_PROMPT, scoreKsaGcpAlignment } from "./kloudbean-knowledge";
import { KLOUDBEAN_ICP_PROMPT, scoreIcpAlignment, ICP_KEYWORD_SIGNALS } from "./kloudbean-icp";
import { KLOUDBEAN_PLANS_PROMPT, KLOUDBEAN_HONESTY_GUARDRAILS } from "./kloudbean-plans";
import { scoreCapabilityAlignment } from "./kloudbean-capabilities";

// Static capability block (avoids calling a function at module-init which pulls server deps)
const CAPABILITY_BLOCK = `KLOUDBEAN CAPABILITY GRAPH (HARD BOUNDARY — never recommend tech outside this):
- Kloudbean is LINUX-based managed cloud hosting. Web servers: Nginx, Apache, OpenLiteSpeed.
- Supported runtimes: Node.js, PHP, Python, Ruby, Go, Java.
- Supported frameworks: React, Next.js, Vue/Nuxt, Laravel, Django, Flask, FastAPI, WordPress, Static/JAMstack.
- Managed databases: MySQL, MariaDB, PostgreSQL, MongoDB, Redis, Elasticsearch.
- DOES NOT SUPPORT (never present as hostable on Kloudbean): Windows Server, IIS, .NET Framework (Windows), MSSQL/SQL Server, MS Access, ColdFusion, Windows desktop apps, cPanel/Plesk.
- Windows Server, IIS, classic .NET Framework, and MSSQL are NOT available — Kloudbean runs Linux web stacks only.
- You MAY mention unsupported tech ONLY in a migration/comparison frame ("move off Windows/IIS to a Linux stack on Kloudbean"). Never write a "deploy X on IIS/Windows on Kloudbean" tutorial.`;

/**
 * Kloudbean topical authority guardrails.
 * Every topic, brief, and article must deepen understanding of Kloudbean
 * or how to use workloads ON Kloudbean — never generic off-brand SEO filler.
 */

/** Core copy for AI system prompts — keep in sync with product marketing. */
export const KLOUDBEAN_PROMPT_CORE = `SCOPE (NON-NEGOTIABLE):
- You ONLY create content for Kloudbean (kloudbean.com) — managed multi-cloud hosting by Secured Orbis Pvt. Ltd. Tagline: "Build. Deploy. Scale — Faster Than Ever."
- Kloudbean is GLOBAL (a large, active customer base worldwide, shipping since 2023). Its biggest opportunity: people who BUILD apps fast (often with AI / vibe-coding tools — Lovable, Bolt, Cursor, Replit, v0) and need to DEPLOY, HOST, and OWN them on one managed server. Saudi/Dammam is one enterprise segment, not the whole focus.
- Every article must answer one of: "How do I deploy/host/run X on Kloudbean?", "Why Kloudbean for [builder/agency/founder]?", or "Kloudbean vs [competitor] for [use case]".
- Do NOT write generic cloud tutorials, unrelated SaaS roundups, or competitor love letters. If Kloudbean is not the resolution, reject the angle.
- Depth means: product specifics (supported clouds — AWS, Akamai Linode, Vultr, DigitalOcean, Google Cloud, Amazon Lightsail, UpCloud; NOT Azure/Oracle/Alibaba/IBM/Hetzner — bundled stack, FLB, S3/R2 storage, KloudGPT, self-hosted app catalog, managed DBs, CI/CD), pricing anchors (plans from $8/mo), one-click deploy, and internal links to sibling Kloudbean cluster pages.
- Supported self-hosted apps on Kloudbean: n8n, Supabase, GitLab, Langflow, Open WebUI, Ollama, Nextcloud, Plausible, Ghost, Vaultwarden, Gitea, Immich, etc.
- Geo: GLOBAL first (US, UK, EU, India, MENA). For in-country data residency: KSA = Google Cloud Dammam (me-central2). Cite NCA/CSCC/SAMA only for KSA/enterprise topics, and only as public frameworks. Never name a client or its initials.

${KLOUDBEAN_ICP_PROMPT}

${CAPABILITY_BLOCK}

${KLOUDBEAN_PLANS_PROMPT}

${KLOUDBEAN_HONESTY_GUARDRAILS}

${KLOUDBEAN_KNOWLEDGE_PROMPT}`;

const STRONG_SIGNALS = [
  "kloudbean",
  "kloudgpt",
  "managed cloud",
  "managed hosting",
  "managed wordpress",
  "managed aws",
  "managed gcp",
  "managed linode",
  "managed digitalocean",
  "managed vultr",
  "managed upcloud",
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
  "render.com",
  "render hosting",
  "railway.app",
  "railway hosting",
  "vercel",
  "heroku",
  "netlify",
  "fly.io",
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
  "vultr",
  "upcloud",
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
  // ICP alignment — vibecoders, agencies, SaaS founders, deploy/self-host jobs.
  score += scoreIcpAlignment(k);
  // Capability alignment — penalize unsupported tech (Windows/IIS/MSSQL/.NET).
  score += scoreCapabilityAlignment(k);

  for (const s of STRONG_SIGNALS) {
    if (k.includes(s)) score += 3;
  }
  // ICP keyword signals (deploy lovable, host client apps, self-host n8n, etc.)
  for (const s of ICP_KEYWORD_SIGNALS) {
    if (k.includes(s)) { score += 2; break; }
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

/** Curated fallbacks (global ICP) when discovery returns thin/off-brand ideas. */
export const CLUSTER_FALLBACK_KEYWORDS: Record<number, string[]> = {
  // 1 — Deploy AI / Vibe-Coded Apps
  1: [
    "deploy lovable app on kloudbean",
    "lovable self hosted hosting",
    "deploy bolt.new app to server",
    "host vibe coded app",
    "deploy cursor app",
  ],
  // 2 — Self-Hosted Tools
  2: [
    "self host n8n on kloudbean",
    "self host supabase",
    "self host gitlab",
    "ollama gpu hosting",
    "langflow self hosted",
  ],
  // 3 — App Deployment Tutorials
  3: [
    "deploy nextjs app to server",
    "deploy node js app with database",
    "deploy laravel app",
    "deploy django production",
  ],
  // 4 — vs Competitors
  4: [
    "vercel alternative full stack",
    "render alternative",
    "railway alternative",
    "cloudways alternative",
    "heroku alternative",
  ],
  // 5 — Agency & Multi-App Hosting
  5: [
    "host multiple client websites one server",
    "agency hosting many apps",
    "white label hosting agency",
    "reseller cloud hosting",
  ],
  // 6 — WordPress & Frontend
  6: [
    "managed wordpress hosting",
    "host wordpress and nextjs together",
    "wp engine alternative",
    "kinsta alternative",
  ],
  // 7 — Databases, Storage & S3
  7: [
    "managed postgresql hosting",
    "managed mongodb hosting",
    "s3 object storage zero egress",
    "managed redis hosting",
  ],
  // 8 — Pricing & Consolidation
  8: [
    "reduce saas costs self host",
    "cheap full stack hosting",
    "managed cloud hosting pricing",
    "consolidate apps one server",
  ],
  // 9 — Security, Scaling & Load Balancing
  9: [
    "ddos protection included hosting",
    "bitninja managed hosting",
    "flexible load balancer multi cloud",
    "auto scaling managed cloud",
  ],
  // 10 — Enterprise & Data Residency (incl. KSA)
  10: [
    "enterprise managed cloud hosting",
    "data residency cloud hosting",
    "nca compliant hosting saudi",
    "gcp dammam managed hosting",
    "self host gitlab enterprise",
  ],
};

export function filterToKloudbeanTopics<T extends { keyword: string }>(
  items: T[],
  minScore = 4,
): T[] {
  return items.filter((item) => isKloudbeanScopedKeyword(item.keyword, minScore));
}
