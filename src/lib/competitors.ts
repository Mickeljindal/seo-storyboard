/**
 * COMPETITOR INTELLIGENCE (source of truth for "Kloudbean vs X" content)
 *
 * Goal: outrank cloudways.com, render.com, railway.com, vercel.com, etc. by
 * writing comparison + alternative content that is sharper, more factual, and
 * more decision-useful than theirs — always resolving to "choose Kloudbean".
 *
 * Each entry feeds:
 *   - comparison_table rows in AI briefs
 *   - "vs" / "alternative" article angles
 *   - the writer prompt so claims are grounded, not invented
 *
 * IMPORTANT: positioning angles must be defensible. Where a number could change,
 * the writer is instructed to phrase it as "as of publ] / verify on pricing page".
 * Keep this in sync with kloudbean.com marketing. Do NOT fabricate competitor specs.
 */

export type CompetitorId =
  | "cloudways"
  | "render"
  | "railway"
  | "vercel"
  | "kinsta"
  | "wpengine"
  | "digitalocean"
  | "heroku";

export type Competitor = {
  id: CompetitorId;
  name: string;
  domain: string;
  /** One-line neutral description of what they are. */
  what: string;
  /** Who they target / where they win. State fairly — credibility matters. */
  strengths: string[];
  /** Honest, defensible gaps vs Kloudbean. These drive the comparison angle. */
  weaknesses: string[];
  /** How Kloudbean wins for the reader's use case. */
  kloudbeanWins: string[];
  /** Best comparison framing for SEO ("X vs Kloudbean for <use case>"). */
  bestAngles: string[];
};

export const COMPETITORS: Record<CompetitorId, Competitor> = {
  cloudways: {
    id: "cloudways",
    name: "Cloudways",
    domain: "cloudways.com",
    what: "Managed cloud hosting layer on top of DigitalOcean, Linode, Vultr, AWS, and GCP, popular for WordPress/PHP.",
    strengths: [
      "Established brand with large WordPress/PHP user base",
      "Simple per-server pricing across a few providers",
    ],
    weaknesses: [
      "Security and CDN often cost extra (e.g. Cloudflare Enterprise add-on billed per domain) rather than bundled",
      "Support hours are not unlimited managed DevOps the way Kloudbean positions",
      "No in-Kingdom Saudi (Dammam) GCP residency positioning for NCA/MISA buyers",
      "Now part of DigitalOcean — narrowing multi-cloud independence",
    ],
    kloudbeanWins: [
      "Cloudflare Enterprise DDoS + BitNinja Pro WAF bundled FREE on every plan (no per-domain add-on)",
      "Unlimited managed DevOps support hours, not capped tickets",
      "7 providers incl. GCP me-central2 Dammam for KSA data residency + NCA/MISA delivery",
      "45-day automated backups, free migrations, CI/CD, managed databases included",
    ],
    bestAngles: [
      "Cloudways alternative for Saudi/KSA data residency (Dammam)",
      "Cloudways vs Kloudbean: bundled security & DevOps TCO",
      "Cloudways add-on costs vs Kloudbean all-inclusive plans",
    ],
  },
  render: {
    id: "render",
    name: "Render",
    domain: "render.com",
    what: "Developer PaaS for deploying web services, static sites, cron jobs, and managed Postgres from Git.",
    strengths: [
      "Clean Git-push deploy UX for developers",
      "Good for small/medium stateless services and side projects",
    ],
    weaknesses: [
      "Limited region choice; no in-Kingdom Saudi (Dammam) residency",
      "Costs scale steeply for always-on services, bandwidth, and managed Postgres",
      "Not multi-cloud — you cannot choose GCP/AWS/Linode underneath",
      "No bundled enterprise WAF/DDoS or unlimited managed DevOps support",
    ],
    kloudbeanWins: [
      "Multi-cloud choice (7 providers) incl. GCP Dammam — Render is single-platform",
      "Bundled BitNinja + Cloudflare Enterprise security vs DIY on Render",
      "Predictable managed pricing with unlimited DevOps support, not per-resource PaaS metering",
      "Enterprise + NCA/MISA delivery path Render does not offer",
    ],
    bestAngles: [
      "Render alternative with multi-cloud + Saudi data residency",
      "Render vs Kloudbean for production apps that outgrow PaaS pricing",
      "Render pricing at scale vs Kloudbean managed cloud",
    ],
  },
  railway: {
    id: "railway",
    name: "Railway",
    domain: "railway.com",
    what: "Developer-first PaaS for quickly deploying apps, databases, and services with usage-based pricing.",
    strengths: [
      "Excellent fast-start DX and templates",
      "Great for prototypes, hobby, and early-stage apps",
    ],
    weaknesses: [
      "Usage-based pricing can spike unpredictably for production workloads",
      "Limited regions; no in-Kingdom Saudi (Dammam) residency or NCA/MISA path",
      "No bundled enterprise security suite or unlimited managed DevOps",
      "Not multi-cloud — no choice of GCP/AWS/Linode underneath",
    ],
    kloudbeanWins: [
      "Predictable plans vs usage-based bill shock at scale",
      "GCP Dammam in-Kingdom residency for KSA — Railway has none",
      "Bundled WAF/DDoS/backups/DevOps vs assembling it yourself",
      "Production + enterprise-grade managed operations",
    ],
    bestAngles: [
      "Railway alternative for production & predictable pricing",
      "Railway vs Kloudbean when usage-based costs scale",
      "Railway alternative with Saudi data residency",
    ],
  },
  vercel: {
    id: "vercel",
    name: "Vercel",
    domain: "vercel.com",
    what: "Frontend cloud / edge platform best known for Next.js, static sites, and serverless functions.",
    strengths: [
      "Best-in-class for Next.js, edge, and Jamstack front ends",
      "Strong DX, previews, and global edge CDN",
    ],
    weaknesses: [
      "Bandwidth and function overages get expensive fast at scale",
      "Backend/stateful + heavy compute workloads are a poor fit",
      "No in-Kingdom Saudi (Dammam) residency, NCA/MISA, or full managed-server control",
      "Not multi-cloud managed hosting — you don't own the underlying VM/DB stack",
    ],
    kloudbeanWins: [
      "Full managed servers + databases across 7 clouds vs front-end-only edge",
      "GCP Dammam residency + NCA/MISA enterprise delivery for KSA",
      "Predictable managed pricing vs Vercel bandwidth/function overage",
      "Bundled security + unlimited DevOps for full-stack production apps",
    ],
    bestAngles: [
      "Vercel alternative for full-stack / backend-heavy apps",
      "Vercel bandwidth costs vs Kloudbean managed hosting",
      "Host Next.js on Kloudbean with Saudi data residency",
    ],
  },
  kinsta: {
    id: "kinsta",
    name: "Kinsta",
    domain: "kinsta.com",
    what: "Premium managed WordPress/application hosting on Google Cloud.",
    strengths: ["Polished managed WordPress experience", "Runs on Google Cloud premium tier"],
    weaknesses: [
      "Premium pricing with visit/bandwidth caps per plan",
      "Single-cloud (GCP) — no Linode/AWS/Vultr/UpCloud choice",
      "No KSA Dammam residency positioning for NCA/MISA buyers",
    ],
    kloudbeanWins: [
      "Multi-cloud incl. GCP Dammam for KSA residency",
      "No visit caps; bundled security + unlimited DevOps",
      "Any stack, not WordPress-centric pricing",
    ],
    bestAngles: ["Kinsta alternative multi-cloud", "Kinsta vs Kloudbean pricing & visit caps"],
  },
  wpengine: {
    id: "wpengine",
    name: "WP Engine",
    domain: "wpengine.com",
    what: "Managed WordPress hosting platform for agencies and businesses.",
    strengths: ["Mature WordPress tooling and agency features", "Strong brand in WP space"],
    weaknesses: [
      "WordPress-only; not for general apps",
      "Visit-based overage pricing; add-ons for security/CDN",
      "No KSA Dammam residency / NCA path",
    ],
    kloudbeanWins: [
      "Any stack on 7 clouds, not WordPress-only",
      "Bundled enterprise security + DevOps vs add-ons",
      "GCP Dammam residency for KSA",
    ],
    bestAngles: ["WP Engine alternative for any stack", "WP Engine vs Kloudbean for agencies"],
  },
  digitalocean: {
    id: "digitalocean",
    name: "DigitalOcean",
    domain: "digitalocean.com",
    what: "Cloud infrastructure provider (Droplets, App Platform, managed DBs) for developers.",
    strengths: ["Low entry price", "Developer-friendly raw infrastructure"],
    weaknesses: [
      "Mostly unmanaged — you run ops, security, backups yourself",
      "No bundled enterprise WAF/DDoS or managed DevOps hours",
      "No in-Kingdom Saudi residency for NCA/MISA",
    ],
    kloudbeanWins: [
      "Fully managed DigitalOcean (and 6 other clouds) with ops handled",
      "Bundled BitNinja + Cloudflare Enterprise + backups",
      "GCP Dammam residency path for KSA",
    ],
    bestAngles: ["Managed DigitalOcean via Kloudbean", "DigitalOcean DIY vs Kloudbean managed TCO"],
  },
  heroku: {
    id: "heroku",
    name: "Heroku",
    domain: "heroku.com",
    what: "Veteran PaaS for deploying apps via Git, now with higher pricing post free-tier removal.",
    strengths: ["Familiar classic PaaS workflow", "Large add-on ecosystem"],
    weaknesses: [
      "Expensive dynos/add-ons; free tier removed",
      "Limited regions; no KSA residency",
      "Not multi-cloud managed hosting",
    ],
    kloudbeanWins: [
      "Predictable managed plans vs dyno/add-on costs",
      "Multi-cloud + GCP Dammam residency",
      "Bundled security + unlimited DevOps",
    ],
    bestAngles: ["Heroku alternative with predictable pricing", "Migrate off Heroku to Kloudbean"],
  },
};

export const COMPETITOR_LIST = Object.values(COMPETITORS);

const DOMAIN_INDEX: Record<string, CompetitorId> = Object.fromEntries(
  COMPETITOR_LIST.map((c) => [c.domain.replace(/^www\./, ""), c.id]),
) as Record<string, CompetitorId>;

const NAME_INDEX: Record<string, CompetitorId> = Object.fromEntries(
  COMPETITOR_LIST.map((c) => [c.name.toLowerCase(), c.id]),
) as Record<string, CompetitorId>;

/** Resolve a competitor by domain (cloudways.com) or name (Cloudways). */
export function findCompetitor(input: string): Competitor | null {
  if (!input) return null;
  const norm = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const byDomain = DOMAIN_INDEX[norm];
  if (byDomain) return COMPETITORS[byDomain];
  const byName = NAME_INDEX[norm];
  if (byName) return COMPETITORS[byName];
  // partial: keyword mentions "cloudways"
  for (const c of COMPETITOR_LIST) {
    if (norm.includes(c.id) || norm.includes(c.name.toLowerCase())) return c;
  }
  return null;
}

/** Detect every competitor named in a keyword/title. */
export function detectCompetitors(text: string): Competitor[] {
  const k = text.toLowerCase();
  return COMPETITOR_LIST.filter((c) => k.includes(c.id) || k.includes(c.name.toLowerCase()) || k.includes(c.domain.replace(/\.com$/, "")));
}

/** Build a competitor intel block for AI prompts — only the relevant competitor(s). */
export function competitorPromptBlock(competitors: Competitor[]): string {
  if (!competitors.length) return "";
  const blocks = competitors.map((c) => {
    return [
      `COMPETITOR: ${c.name} (${c.domain}) — ${c.what}`,
      `  Their strengths (acknowledge fairly): ${c.strengths.join("; ")}`,
      `  Defensible gaps vs Kloudbean: ${c.weaknesses.join("; ")}`,
      `  How Kloudbean wins: ${c.kloudbeanWins.join("; ")}`,
    ].join("\n");
  });
  return [
    "COMPETITOR INTELLIGENCE (use to write a sharper, fairer, more decision-useful comparison than the competitor's own page — always resolve to Kloudbean for the reader's use case; never fabricate competitor specs, and phrase any number as 'verify on current pricing page'):",
    ...blocks,
  ].join("\n");
}

/** Convenience: prompt block from raw keyword/title + an optional configured competitor domain. */
export function competitorContextForTopic(text: string, configuredDomain?: string): string {
  const named = detectCompetitors(text);
  const configured = configuredDomain ? findCompetitor(configuredDomain) : null;
  const set = new Map<CompetitorId, Competitor>();
  for (const c of named) set.set(c.id, c);
  if (configured && set.size === 0) set.set(configured.id, configured);
  return competitorPromptBlock([...set.values()]);
}
