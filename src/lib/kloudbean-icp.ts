/**
 * KLOUDBEAN ICP & USE-CASE SOURCE OF TRUTH
 *
 * Derived from how real Kloudbean customers actually use the platform (console
 * screenshots + kloudbean.com product pages). Kloudbean is GLOBAL — Saudi/Dammam
 * is ONE enterprise segment, not the whole story.
 *
 * The core story across every ICP: people building apps fast (often with AI /
 * vibe-coding tools like Lovable, Bolt, Cursor, Replit, v0) need somewhere real
 * to RUN them. Kloudbean lets them deploy and host MANY apps + self-hosted tools
 * on ONE managed server they fully own — replacing SaaS sprawl and DIY DevOps.
 *
 * This is injected into discovery + AI prompts so content speaks to these people
 * and these jobs-to-be-done, not generic "cloud hosting" filler.
 */

export type IcpId =
  | "vibecoder"
  | "ai_agency"
  | "saas_founder"
  | "freelance_dev"
  | "wp_agency"
  | "enterprise_gov";

export type Icp = {
  id: IcpId;
  name: string;
  who: string;
  pain: string;
  job: string; // the job-to-be-done Kloudbean solves
  proof: string; // real example pattern from actual usage
  keywords: string[]; // search language this person uses
};

export const ICPS: Record<IcpId, Icp> = {
  vibecoder: {
    id: "vibecoder",
    name: "Vibecoder / AI app builder",
    who: "Non-traditional builders shipping full-stack apps with Lovable, Bolt, Cursor, Replit, v0, Claude Code.",
    pain: "The app works on localhost but goes nowhere online — the deployment gap. SaaS builders lock in the code and bill per app.",
    job: "Deploy an AI-built React/Next/Node app to a real server in one click, own the code, and not pay per-app pricing.",
    proof: "Builders deploy a single AI-generated full-stack app to one managed server and keep the source code.",
    keywords: [
      "deploy lovable app", "host lovable app", "lovable self hosted", "deploy bolt.new app",
      "deploy cursor app", "deploy replit app", "deploy v0 app", "where to host vibe coded app",
      "deploy ai generated app", "host next.js app cheap", "deploy react app to server",
    ],
  },
  ai_agency: {
    id: "ai_agency",
    name: "AI / dev agency",
    who: "Agencies shipping many client apps and sites, often AI-generated, who need them all hosted and managed.",
    pain: "Juggling many client projects across Vercel/Netlify/Heroku gets expensive and scattered; managing per-client infra is a tax.",
    job: "Host dozens of client apps on one (or few) managed servers, white-label, with one bill and unlimited DevOps support.",
    proof: "An agency can run many client apps on a single managed server instead of separate per-app subscriptions.",
    keywords: [
      "host multiple client websites one server", "agency hosting many apps", "white label hosting agency",
      "manage multiple client apps hosting", "reseller cloud hosting", "agency multi-app server",
    ],
  },
  saas_founder: {
    id: "saas_founder",
    name: "SaaS founder / indie hacker",
    who: "Founders running a product (frontend + API + DB) plus self-hosted tools, watching burn rate.",
    pain: "PaaS usage bills spike at scale; SaaS subscriptions (automation, auth, analytics, DB) stack up to thousands per month.",
    job: "Run the whole stack — app, API, managed Postgres/MySQL/Mongo/Redis, plus self-hosted n8n/Supabase — on owned servers at a flat price.",
    proof: "A founder can run a product (frontend + API + database) alongside self-hosted tools like n8n and Supabase on managed servers.",
    keywords: [
      "self host supabase", "self host n8n", "cheap full stack hosting", "vercel alternative pricing",
      "railway alternative", "render alternative", "managed postgres hosting", "reduce saas costs self host",
    ],
  },
  freelance_dev: {
    id: "freelance_dev",
    name: "Freelance developer",
    who: "Independent developers hosting their own and client projects without a DevOps budget.",
    pain: "No time/skills to run security, backups, scaling; DIY VPS is fiddly and risky.",
    job: "Get a fully managed server (security, backups, CI/CD included) at a predictable low price, starting ~$8/mo.",
    proof: "A single managed server can run a mix of WordPress, Node, and frontend apps without separate hosting bills.",
    keywords: [
      "managed vps for developers", "cheap managed cloud server", "deploy node app with database",
      "managed hosting with ci/cd", "developer friendly cloud hosting",
    ],
  },
  wp_agency: {
    id: "wp_agency",
    name: "WordPress / marketing agency",
    who: "Marketing teams and agencies running WordPress plus modern frontends for clients.",
    pain: "WordPress-only hosts can't run their Next.js/Vue/Node apps too; managed WP hosts charge visit-based overages.",
    job: "Host WordPress AND modern app frameworks side by side on one managed platform, any stack.",
    proof: "One managed server can host WordPress alongside a Next.js frontend and Node services.",
    keywords: [
      "managed wordpress hosting", "host wordpress and nextjs together", "wp engine alternative",
      "kinsta alternative", "agency wordpress hosting",
    ],
  },
  enterprise_gov: {
    id: "enterprise_gov",
    name: "Enterprise / government (incl. KSA)",
    who: "Regulated orgs and government bodies needing compliance, data residency, and a controlled environment.",
    pain: "Need in-region data residency, audit-ready infra, and isolation — not a generic shared host.",
    job: "Run prod/QA/dev environments with managed DBs, load balancers, S3, and self-hosted GitLab — in-region (e.g. GCP Dammam for KSA).",
    proof: "A regulated organization can run in-region GCP Dammam servers with self-hosted GitLab, managed databases, load balancers, and S3 storage.",
    keywords: [
      "data residency cloud hosting", "compliant managed hosting", "self host gitlab", "government cloud hosting",
      "nca compliant hosting saudi", "in-kingdom data residency ksa", "enterprise managed cloud",
    ],
  },
};

export const ICP_LIST = Object.values(ICPS);

/** Vibe-coding / AI builder tools Kloudbean can deploy or that users come from. */
export const VIBE_TOOLS = [
  "Lovable", "Bolt.new", "Cursor", "Replit", "v0", "Claude Code", "Windsurf", "Codex",
];

/** Self-hostable tools customers run on Kloudbean. */
export const SELF_HOSTED_TOOLS = [
  "n8n", "Supabase", "GitLab", "Langflow", "Open WebUI", "Ollama", "Nextcloud",
  "Plausible", "Ghost", "Vaultwarden", "Gitea", "Immich",
];

/** Compact ICP block injected into AI prompts so content targets real buyers. */
export const KLOUDBEAN_ICP_PROMPT = `WHO KLOUDBEAN CONTENT IS FOR (write for these people, globally — not generic readers):
- Vibecoders / AI app builders: shipping apps with ${VIBE_TOOLS.slice(0, 5).join(", ")} who hit the "works on localhost, dies online" deployment gap. Kloudbean deploys their app to a real owned server in one click.
- AI / dev agencies: hosting many client apps on one managed server, white-label, one bill, unlimited DevOps.
- SaaS founders / indie hackers: running app + API + managed DB + self-hosted tools (${SELF_HOSTED_TOOLS.slice(0, 4).join(", ")}) at a flat price instead of SaaS-sprawl and PaaS bill-shock.
- Freelance devs: a fully managed server (security, backups, CI/CD) from ~$8/mo.
- WordPress / marketing agencies: WordPress AND Next.js/Vue/Node side by side, any stack.
- Enterprise / government (incl. KSA): compliance + data residency (KSA = GCP Dammam), managed DBs, load balancers, S3, self-hosted GitLab.

THE CORE STORY: build fast (often with AI) → deploy and own it on one managed Kloudbean server → consolidate many apps + tools in one place → predictable price, no DevOps, no SaaS sprawl. Position consolidation and cost savings qualitatively ("cut SaaS sprawl", "predictable flat price") — do NOT invent specific savings figures or app counts unless they appear in Kloudbean's published copy.

TONE: professional yet approachable (Kloudbean brand). Speak to the builder's real job-to-be-done. Lead with the concrete outcome. Be confident but DO NOT over-promise (see HONESTY GUARDRAILS).`;

/** Detect which ICP(s) a topic/keyword speaks to (for targeting + scoring). */
export function detectIcps(text: string): Icp[] {
  const k = text.toLowerCase();
  const hits = new Set<IcpId>();
  for (const icp of ICP_LIST) {
    if (icp.keywords.some((kw) => k.includes(kw)) || k.includes(icp.id)) hits.add(icp.id);
  }
  // tool-based signals
  if (VIBE_TOOLS.some((t) => k.includes(t.toLowerCase()))) hits.add("vibecoder");
  if (/agency|client (sites|apps|websites)|white.?label|reseller/.test(k)) hits.add("ai_agency");
  if (/self.?host|n8n|supabase|gitlab/.test(k)) hits.add("saas_founder");
  if (/wordpress|\bwp\b/.test(k)) hits.add("wp_agency");
  if (/nca|misa|data residency|government|compliance|dammam|ksa|saudi/.test(k)) hits.add("enterprise_gov");
  return [...hits].map((id) => ICPS[id]);
}

/** Signals that a keyword matches Kloudbean's real ICP jobs-to-be-done. */
export const ICP_KEYWORD_SIGNALS: string[] = [
  ...new Set(ICP_LIST.flatMap((i) => i.keywords)),
  ...VIBE_TOOLS.map((t) => t.toLowerCase()),
  ...SELF_HOSTED_TOOLS.map((t) => t.toLowerCase()),
  "deploy", "host", "self host", "self-hosted", "one server", "all in one", "consolidate",
];

/** Boost score (0–6) when a keyword maps to a strong Kloudbean ICP job. */
export function scoreIcpAlignment(keyword: string): number {
  const k = keyword.toLowerCase();
  let s = 0;
  if (VIBE_TOOLS.some((t) => k.includes(t.toLowerCase()))) s += 4;
  if (/deploy|host|self.?host/.test(k)) s += 2;
  if (/agency|client app|white.?label|multiple (apps|sites|projects)/.test(k)) s += 3;
  if (SELF_HOSTED_TOOLS.some((t) => k.includes(t.toLowerCase()))) s += 3;
  if (/alternative|vs |cheaper|pricing|cost/.test(k)) s += 2;
  return Math.min(6, s);
}
