// Legacy pillar list — kept for compatibility with existing components.
// The roadmap is now 10 topical-authority clusters (see CLUSTERS).
export const PILLARS = [
  { id: 1, name: "Managed Cloud Hosting (Multi-Cloud)", short: "Hosting", color: "var(--pillar-1)" },
  { id: 2, name: "Enterprise & Compliance (NCA / CSCC / MISA)", short: "Enterprise", color: "var(--pillar-2)" },
  { id: 3, name: "Self-Hosted AI & Open Source", short: "Self-host AI", color: "var(--pillar-3)" },
  { id: 4, name: "App Deployment Guides on Kloudbean", short: "Deploy", color: "var(--pillar-4)" },
  { id: 5, name: "DevOps Bundle Value (Security · FLB · S3 · CI/CD)", short: "DevOps", color: "var(--pillar-5)" },
] as const;

// 10 topical-authority clusters powering the 1,000-article roadmap.
export const CLUSTERS: { id: number; name: string; short: string }[] = [
  { id: 1, name: "Saudi Arabia Cloud Hosting Market", short: "SA Market" },
  { id: 2, name: "NCA Compliance Deep-Dive", short: "NCA" },
  { id: 3, name: "Security and DDoS Protection", short: "Security" },
  { id: 4, name: "Managed Cloud vs Competitors", short: "vs Competitors" },
  { id: 5, name: "Developer Deployment Tutorials", short: "Deploy" },
  { id: 6, name: "Self-Hosted AI Tools and Open Source Apps", short: "Self-host AI" },
  { id: 7, name: "Databases and Storage", short: "Data" },
  { id: 8, name: "Load Balancing and Scaling", short: "Scale" },
  { id: 9, name: "Cloud Pricing and Value", short: "Pricing" },
  { id: 10, name: "Agency, Freelancer, and Partner Programs", short: "Partners" },
];

export const clusterMeta = (id: number | null | undefined) =>
  CLUSTERS.find((c) => c.id === id) ?? { id: 0, name: "Uncategorised", short: "—" };

// Anchor pages on kloudbean.com that articles should internal-link to.
export const ANCHORS = [
  "Enterprise Hosting", "Managed Cloud", "Pricing", "FLB", "KloudGPT",
  "AI Tools", "NCA Compliance", "Security", "BitNinja", "WAF", "DDoS",
  "S3 Storage", "CI/CD", "Deploy Docs", "DB Docs", "Free Trial",
  "Agency Program", "Partner Program", "Alternatives Page", "n8n Plans",
  "Security Suite", "Enterprise",
] as const;

export type ArticleStatus =
  | "idea"
  | "keyword_researched"
  | "brief_generated"
  | "writing"
  | "review"
  | "published"
  | "promoted";

export const STATUSES: { id: ArticleStatus; label: string; tokenVar: string }[] = [
  { id: "idea", label: "Idea", tokenVar: "var(--status-idea)" },
  { id: "keyword_researched", label: "Keyword Researched", tokenVar: "var(--status-keyword)" },
  { id: "brief_generated", label: "Brief Generated", tokenVar: "var(--status-brief)" },
  { id: "writing", label: "Writing", tokenVar: "var(--status-writing)" },
  { id: "review", label: "Review", tokenVar: "var(--status-review)" },
  { id: "published", label: "Published", tokenVar: "var(--status-published)" },
  { id: "promoted", label: "Promoted", tokenVar: "var(--status-promoted)" },
];

export const statusLabel = (s: string) =>
  STATUSES.find((x) => x.id === s)?.label ?? s;

export const pillarMeta = (id: number) =>
  PILLARS.find((p) => p.id === id) ?? PILLARS[0];
