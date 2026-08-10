// Legacy pillar list — kept for compatibility with existing components.
// The roadmap is now 10 topical-authority clusters (see CLUSTERS).
export const PILLARS = [
  { id: 1, name: "Managed Cloud Hosting (Multi-Cloud)", short: "Hosting", color: "var(--pillar-1)" },
  { id: 2, name: "Enterprise & Compliance (NCA / CSCC / SAMA)", short: "Enterprise", color: "var(--pillar-2)" },
  { id: 3, name: "Self-Hosted AI & Open Source", short: "Self-host AI", color: "var(--pillar-3)" },
  { id: 4, name: "App Deployment Guides on Kloudbean", short: "Deploy", color: "var(--pillar-4)" },
  { id: 5, name: "DevOps Bundle Value (Security · FLB · S3 · CI/CD)", short: "DevOps", color: "var(--pillar-5)" },
] as const;

// 10 topical-authority clusters powering the 1,000-article roadmap.
export const CLUSTERS: { id: number; name: string; short: string }[] = [
  { id: 1, name: "Deploy AI / Vibe-Coded Apps (Lovable, Bolt, Cursor)", short: "Deploy AI Apps" },
  { id: 2, name: "Self-Hosted Tools (n8n, Supabase, GitLab)", short: "Self-host" },
  { id: 3, name: "App Deployment Tutorials (Next.js, Node, Laravel, Python)", short: "Deploy Stacks" },
  { id: 4, name: "Managed Cloud vs Competitors (Vercel, Render, Railway, Cloudways)", short: "vs Competitors" },
  { id: 5, name: "Agency & Multi-App Hosting", short: "Agencies" },
  { id: 6, name: "WordPress & Frontend Hosting", short: "WordPress" },
  { id: 7, name: "Databases, Storage & S3", short: "Data" },
  { id: 8, name: "Pricing, Cost & SaaS Consolidation", short: "Pricing" },
  { id: 9, name: "Security, Scaling & Load Balancing", short: "Security/Scale" },
  { id: 10, name: "Enterprise & Data Residency (incl. KSA / Dammam)", short: "Enterprise" },
];

export const clusterMeta = (id: number | null | undefined) =>
  CLUSTERS.find((c) => c.id === id) ?? { id: 0, name: "Uncategorised", short: "—" };

// Anchor pages on kloudbean.com that articles should internal-link to.
export const ANCHORS = [
  "Managed Cloud", "Pricing", "Free Trial", "Deploy Lovable", "Deploy Next.js",
  "Deploy Node.js", "WordPress Hosting", "AI & Tools", "FLB", "KloudGPT",
  "S3 Storage", "CI/CD", "Managed Databases", "Security Suite", "BitNinja",
  "Agency Partners", "Alternatives Page", "Enterprise Hosting", "NCA Compliance",
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
