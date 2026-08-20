/**
 * Kloudbean knowledge graph & guardrails for AI briefs, topics, and content.
 * Source of truth: https://support.kloudbean.com — cite doc paths when making product claims.
 */

export const SUPPORT_KB_BASE = "https://support.kloudbean.com";

/**
 * Canonical doc paths, verified against the live sitemap (Aug 2026 crawl).
 *
 * These are now only convenience anchors for linking and for narrow re-fetches.
 * The support KB no longer depends on this list: `support-kb.ts` discovers every
 * page from /sitemap.xml, which is what stops the list going stale silently.
 *
 * It went stale badly once. Six of the seven previous entries
 * (/docs/cloud-providers/google-cloud, /docs/regions/gcp-dammam-me-central2,
 * /docs/enterprise/enterprise-plan, /docs/security/bitninja-cloudflare,
 * /docs/migrations/free-migration, /docs/applications/self-hosted-catalog) had
 * been renamed or removed. Because the docs site answers unknown paths with a
 * 200 and a generic shell rather than a 404, the crawler cached the navigation
 * menu for all six and the writer prompt presented it as source of truth.
 *
 * If you add a path here, confirm it appears in the sitemap first:
 *   npm run kb:crawl -- --dry
 */
export const SUPPORT_DOC_PATHS = {
  intro: "/docs/intro",
  postgresLaunch: "/docs/database-launch/launching-postgres",
  selectingCloudProvider: "/docs/getting-started/selecting-cloud-provider",
  selectingServerLocation: "/docs/getting-started/selecting-server-location",
  enterpriseIncluded: "/docs/enterprise/what-is-included",
  enterpriseUpgrade: "/docs/enterprise/upgrading-to-enterprise",
  enterpriseCompliance: "/docs/enterprise/compliance-support",
  enterpriseSiem: "/docs/enterprise/siem-security-logging",
  enterpriseSecretManager: "/docs/enterprise/secret-manager",
  enterpriseDatabases: "/docs/enterprise/mission-critical-databases",
  enterpriseRegionalBuckets: "/docs/enterprise/regional-storage-buckets",
  bitninja: "/docs/server-management/enabling-bitninja-security",
  backups: "/docs/server-management/managing-server-backups",
  migrationsOverview: "/docs/migrations/overview",
  ipAccessControl: "/docs/application-management/restricting-access-by-ip",
  redirects: "/docs/application-management/configuring-redirects",
  responseHeaders: "/docs/application-management/adding-response-headers",
  securityHeaders: "/docs/security-maintenance/adding-security-headers",
  objectStorage: "/docs/s3-object-storage/overview",
  loadBalancer: "/docs/flexible-load-balancers/overview",
  staticSites: "/docs/static-site-hosting/overview",
  subscriptionTier: "/docs/getting-started/subscription-tier",
  freeTrial: "/docs/getting-started/starting-free-trial",
  // Note: "/docs/faqs" is NOT a real page. The live paths are the ones below.
  faqs: "/docs/faqs/general",
  faqsIndex: "/docs/category/faqs",
} as const;

/**
 * KSA data residency — GCP Dammam (me-central2) is the only in-Kingdom GCP region
 * Kloudbean content should align around for Saudi workloads.
 */
export const KSA_GCP_DAMMAM_FACTS = {
  regionId: "me-central2",
  city: "Dammam",
  country: "Saudi Arabia (KSA)",
  positioning:
    "For KSA data residency on Google Cloud via Kloudbean, anchor on GCP me-central2 (Dammam) — not generic multi-region GCP marketing.",
  pricingNotes: [
    "Dammam uses premium-tier infrastructure and local data-residency compliance — compute, storage, and egress are typically higher than US/EU regions.",
    "Outbound internet egress in Dammam is metered (often cited ~$0.12–$0.19/GB depending on tier) — state as approximate, link to Kloudbean/GCP pricing pages.",
    "Traffic between app and database in the same Dammam region / same VPC is internal and not billed as internet egress.",
    "Do not promise unlimited free bandwidth for KSA egress.",
  ],
  complianceNotes: [
    "Reference NCA, CSCC, SAMA only when the article geo is sa/enterprise and the claim is supported on kloudbean.com or support.kloudbean.com.",
    "Never name a client, its ministry or agency, or its initials. Public regulators and published frameworks only.",
    "GCP Dammam access has Google Cloud partner/residency constraints — do not claim every global GCP region is available to every KSA customer without verification.",
  ],
  contentAngles: [
    "Run NCA-aware workloads on GCP Dammam via Kloudbean managed hosting",
    "Keep app + managed PostgreSQL/MySQL/MongoDB in me-central2 to avoid inter-region egress",
    "Kloudbean bundles DevOps, BitNinja, Cloudflare Enterprise, backups — compare TCO vs DIY GCP Dammam",
    "Enterprise Plan delivery for government and regulated KSA buyers",
  ],
} as const;

/** What Kloudbean can claim vs must not invent. */
export const KLOUDBEAN_CAPABILITY_GUARD = {
  canClaim: [
    "Managed multi-cloud hosting (AWS, Akamai Linode, Vultr, DigitalOcean, Google Cloud, Amazon Lightsail, UpCloud) through one console",
    "Any stack / language — not WordPress-only; one-click deploy of apps and self-hosted tools",
    "Bundled value: managed DevOps support, advanced caching, free SSL, free migrations, uptime monitoring, CI/CD, and 7 managed databases (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB)",
    "Baseline hardening on all plans (Shorewall + Fail2ban); Premium/Enterprise add BitNinja Pro as an added security layer + daily automated backups (NOT on Standard)",
    "Products: FLB, S3/R2 object storage, KloudGPT, static sites, self-hosted catalog (n8n, Supabase, GitLab, Ollama, Langflow, etc.)",
    "Three tiers: Standard (from $8/mo), Premium (custom), Enterprise (custom / contact sales) — verify current pricing on the pricing page",
    "Responsive managed support",
    "KSA GCP Dammam (me-central2) hosting path for data-residency use cases",
  ],
  mustNotClaim: [
    "Features not documented on kloudbean.com or support.kloudbean.com",
    "Customer / geography / response-time / CSAT figures as published metrics — do NOT assert '1,000+ businesses', '30+ countries', '~2 min avg response', '99% CSAT', or '24/7 human support' as a number. Use 'responsive managed support' (no figure) instead",
    "A specific Enterprise price such as '$7,500/mo' in general copy — Enterprise is custom / contact sales; always route readers to the pricing page to verify current pricing",
    "Unlimited egress/bandwidth in KSA/Dammam",
    "Any in-KSA region — only GCP Dammam (me-central2) is the in-Kingdom option; other providers have no in-KSA region on Kloudbean",
    "Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner as a Kloudbean offering — Kloudbean does NOT provide them (mention only as a competitor to migrate away from)",
    "SOC 2 / ISO 27001 / HIPAA / GDPR as ACHIEVED — they are IN PROGRESS. Never say 'certified' or 'compliant'; say 'compliance support / in progress' and route to Enterprise + sales",
    "That Kloudbean alone makes a customer compliant (PCI-DSS, HIPAA, SAMA) — it provides infrastructure foundations, not regulatory outcomes",
    "BitNinja Pro or daily automated backups as Standard-plan features — BitNinja is a real added security layer, but it is Premium/Enterprise; baseline hardening on Standard is Shorewall + Fail2ban",
    "Absolute guarantees: 100% uptime, 'never goes down', guaranteed rankings",
    "Exact pricing without checking current plan pages",
    "Competitor features as if Kloudbean offers them (e.g. Vercel Edge, PlanetScale-specific features)",
    "Generic tutorials that never resolve to 'host this on Kloudbean'",
  ],
  whenUnsure:
    "Say 'available on Kloudbean managed GCP Dammam' or 'contact sales' — never guess. Prefer linking support.kloudbean.com doc paths.",
} as const;

/** Injected into every AI system prompt. */
export const KLOUDBEAN_KNOWLEDGE_PROMPT = `KNOWLEDGE GRAPH & TRUTH (support.kloudbean.com):
- Treat ${SUPPORT_KB_BASE} as the primary product knowledge base. When stating how something works, prefer wording consistent with Kloudbean docs — not generic cloud blogs.
- For Saudi Arabia (geo sa): GCP **me-central2 (Dammam)** is the in-Kingdom Google Cloud region to center KSA data-residency content on. Do not imply other providers have equivalent in-KSA regions. Kloudbean does NOT offer Azure/Oracle/Alibaba/IBM Cloud at all.
- Dammam pricing: premium compute + metered egress; same-region app↔DB traffic is internal. Never promise unlimited KSA bandwidth.
- Ideation rule: every topic/brief must be something Kloudbean can **serve** (host, migrate, secure, operate) — not abstract SEO filler.
- No over-promising: if a feature is not in CAN CLAIM list or support docs, omit it or use "contact Kloudbean" / link to docs.
- Internal links in briefs should point to sibling Kloudbean cluster topics; CTA URLs must be real kloudbean.com paths.

KSA GCP DAMMAM ALIGNMENT (when geo is sa or keyword mentions KSA/Saudi/Dammam/NCA):
${KSA_GCP_DAMMAM_FACTS.contentAngles.map((a) => `- ${a}`).join("\n")}

CAPABILITY GUARDRAILS:
CAN: ${KLOUDBEAN_CAPABILITY_GUARD.canClaim.slice(0, 6).join("; ")} …
CANNOT: ${KLOUDBEAN_CAPABILITY_GUARD.mustNotClaim.join("; ")}
`;

/** Topic ideation filter boost for KSA + GCP Dammam aligned keywords. */
export function scoreKsaGcpAlignment(keyword: string): number {
  const k = keyword.toLowerCase();
  let s = 0;
  if (/ksa|saudi|dammam|me-central2|nca|misa|data residency|in-kingdom/.test(k)) s += 4;
  if (/gcp|google cloud/.test(k) && /ksa|saudi|dammam|residen/.test(k)) s += 5;
  if (/managed hosting|kloudbean/.test(k)) s += 2;
  return s;
}
