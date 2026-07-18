import "@tanstack/react-start/server-only";

/**
 * EXPERIENCE ENGINE (E-E-A-T) — injects real operational lessons into content
 * instead of generic AI explanation. This is the cheapest, realest lever for
 * "Experience" in Google's E-E-A-T: a sentence that reads like someone who
 * has actually run the infrastructure, not a rephrased Wikipedia summary.
 *
 * Snippets are curated in the `experience_snippets` table (dashboard-managed,
 * see /experience) and matched to a topic by tag overlap + cluster. The seed
 * set below is a realistic starting library — replace/expand with real
 * support-ticket and postmortem material as it accumulates.
 *
 * IMPORTANT — HONESTY: snippets must describe genuine, verifiable patterns
 * ("we see this repeatedly," "a common mistake") rather than inventing a
 * specific named customer or a fabricated statistic. The writer prompt
 * instructs the AI to keep this framing when weaving a snippet in.
 */

export type SeedSnippet = {
  title: string;
  kind: "lesson" | "mistake" | "migration" | "incident" | "benchmark";
  body: string;
  tags: string[];
  clusterId?: number | null;
};

/** Starter library — general, honest operational lessons (edit freely in the dashboard). */
export const SEED_EXPERIENCE_SNIPPETS: SeedSnippet[] = [
  {
    title: "The #1 WordPress migration mistake",
    kind: "mistake",
    body: "The most common migration mistake we see is moving the database before the wp-content uploads folder finishes syncing — the site comes up with broken images and a stale search index. The fix is boring but reliable: freeze writes on the old host, sync files first, then the database, then flip DNS last.",
    tags: ["wordpress", "migration", "migrate"],
  },
  {
    title: "Redis without eviction policy tuning",
    kind: "mistake",
    body: "A recurring setup mistake with Redis is leaving the default eviction policy (noeviction) on a cache-only instance. Under memory pressure, Redis stops accepting writes entirely instead of quietly evicting old keys, which looks like a random outage. Setting allkeys-lru for pure caching workloads avoids this class of incident.",
    tags: ["redis", "cache", "caching", "performance"],
  },
  {
    title: "Queue workers dying silently after deploys",
    kind: "lesson",
    body: "Laravel queue workers (and most background-job workers in other frameworks) keep running the OLD code in memory after a deploy unless they're explicitly restarted. Teams that skip a supervisor restart hook after deploy end up debugging 'phantom' bugs that were already fixed in the code — the worker just never picked up the new version.",
    tags: ["laravel", "queue workers", "horizon", "deployment", "deploy"],
  },
  {
    title: "The DNS TTL trap during migrations",
    kind: "lesson",
    body: "Lowering DNS TTL only helps if it's done days before the cutover, not the day of. A record with a 24-hour TTL set an hour before migration still has visitors hitting the old server for up to a day. Dropping TTL to 300 seconds at least 48 hours ahead is what actually gives you a clean, fast cutover window.",
    tags: ["dns", "migration", "migrate", "cutover"],
  },
  {
    title: "CDN caching dynamic API responses by accident",
    kind: "incident",
    body: "A subtle production incident pattern: a CDN rule meant for static assets accidentally matches an API route, and suddenly every user is served the same cached JSON response meant for someone else. The giveaway is support tickets describing 'seeing someone else's data' that resolve themselves after a hard refresh. Explicit cache-control headers on API routes prevent this category of bug entirely.",
    tags: ["cdn", "cloudflare", "cache", "api", "security"],
  },
  {
    title: "Auto-scaling that scales the wrong resource",
    kind: "mistake",
    body: "Auto-scaling rules configured purely on CPU often miss the real bottleneck — a PHP-FPM pool that's maxed out on worker processes while CPU sits at 40%. The fix is scaling on a composite signal (queue depth + FPM pool saturation), not CPU alone, otherwise you pay for extra servers that don't actually relieve the pressure point.",
    tags: ["scaling", "autoscaling", "load balancer", "performance"],
  },
  {
    title: "Database connection pool exhaustion under traffic spikes",
    kind: "lesson",
    body: "When a marketing campaign sends a traffic spike, the database often isn't the bottleneck — the connection pool is. Each app server opening its own max pool size multiplies fast across horizontally scaled instances, and Postgres/MySQL simply refuses new connections once the server-side max is hit. A shared connection pooler (PgBouncer for Postgres, ProxySQL for MySQL) sized to the DB's real limit, not the app's, is the fix that scales.",
    tags: ["database", "postgres", "mysql", "scaling", "traffic"],
  },
  {
    title: "WooCommerce checkout timeouts under load",
    kind: "incident",
    body: "WooCommerce sites under sudden load (a flash sale, a viral post) tend to fail at checkout specifically, not on browsing — because checkout triggers synchronous stock checks, tax calculation, and payment gateway calls that don't cache. Pre-warming object cache and moving stock decrement to an async queue is what actually holds up under a spike; scaling web servers alone doesn't fix a synchronous-call bottleneck.",
    tags: ["woocommerce", "wordpress", "ecommerce", "checkout", "performance"],
  },
  {
    title: "The backup that was never tested",
    kind: "lesson",
    body: "The most dangerous backup is one that has never been restored. Automated backups routinely 'succeed' while silently missing a table, a cron job, or an environment file — and the gap only shows up during an actual disaster, when it's too late to fix calmly. A monthly test restore into a throwaway environment is the only way to know a backup strategy actually works.",
    tags: ["backup", "backups", "disaster recovery", "security"],
  },
  {
    title: "Same-region 'multi-AZ' isn't disaster recovery",
    kind: "lesson",
    body: "Multiple availability zones inside one region protect against a rack or data-center failure, not a regional outage, a botched DNS change, or a bad deploy — those take down every AZ in the region at once. Real resilience for a business-critical app means a tested failover plan to a second region or provider, not just spreading servers across AZs and calling it done.",
    tags: ["disaster recovery", "uptime", "reliability", "infrastructure"],
  },
  {
    title: "Migrating off shared hosting: the hidden cron jobs",
    kind: "migration",
    body: "Shared-hosting migrations often miss cron jobs configured through the hosting panel rather than in code — a scheduled cache warm, an email digest, a backup script. They're invisible in a code repo, so the new environment quietly loses functionality that nobody notices until a report stops arriving weeks later. Auditing the old panel's cron list before cutover, not just the codebase, closes this gap.",
    tags: ["migration", "migrate", "cron", "shared hosting"],
  },
  {
    title: "SSL renewal automation that silently stops working",
    kind: "incident",
    body: "Automated SSL renewal (Let's Encrypt or similar) commonly breaks after an unrelated infra change — a firewall rule, a load balancer swap, a DNS provider switch — because the renewal challenge can no longer reach the validation endpoint. It keeps 'succeeding' in logs until the certificate actually expires, which is why monitoring certificate expiry directly, not just renewal-job exit codes, matters.",
    tags: ["ssl", "security", "certificates", "cloudflare"],
  },
  {
    title: "Docker images that grow forever",
    kind: "lesson",
    body: "Docker build caches and multi-stage builds that aren't cleaned up regularly turn a 200MB image into a 2GB one within months, slowing every deploy and eating registry storage costs. Pinning base image versions and pruning build layers on a schedule keeps deploy times and storage costs from creeping upward without anyone noticing until the bill or the deploy time makes it obvious.",
    tags: ["docker", "ci/cd", "deployment", "containers"],
  },
  {
    title: "Load balancer health checks that lie",
    kind: "incident",
    body: "A load balancer health check hitting '/' often reports a server as healthy even when the actual application is broken — WordPress can serve a cached static page while the PHP backend and database are both down. Health checks need to hit a real application endpoint that touches the database, not just confirm the web server process is alive.",
    tags: ["load balancer", "health check", "uptime", "reliability"],
  },
  {
    title: "The cost of not right-sizing after a traffic drop",
    kind: "lesson",
    body: "Teams scale up for a launch or campaign and then forget to scale back down once traffic normalizes — the infrastructure bill stays at peak-traffic sizing for months longer than needed. A quarterly right-sizing review against actual usage (not the original provisioning) is a simple habit that routinely finds 20-30% in avoidable spend on over-provisioned servers.",
    tags: ["cost", "pricing", "right-sizing", "cloud cost"],
  },
];

/** Insert the seed library, skipping titles that already exist. */
export async function seedExperienceSnippets(): Promise<{ inserted: number; skipped: number }> {
  const repo = await import("@/server/db/repos/experience");
  const existing = await repo.listExperienceSnippets({ limit: 5000 });
  const existingTitles = new Set(existing.map((s) => s.title.trim().toLowerCase()));
  const toInsert = SEED_EXPERIENCE_SNIPPETS.filter(
    (s) => !existingTitles.has(s.title.trim().toLowerCase()),
  );
  const inserted = await repo.insertExperienceSnippets(toInsert);
  return { inserted, skipped: SEED_EXPERIENCE_SNIPPETS.length - toInsert.length };
}

/**
 * Build a grounding block for the writer: 1-2 relevant real-world lessons the
 * article should weave in naturally (not as a bolted-on "Lessons Learned"
 * dump, unless the outline already has such a section).
 */
export async function experiencePromptBlock(
  topicText: string,
  clusterId: number | null,
): Promise<string> {
  try {
    const repo = await import("@/server/db/repos/experience");
    const snippets = await repo.findRelevantSnippets(topicText, clusterId, 2);
    if (!snippets.length) return "";

    const lines = [
      "REAL OPERATIONAL EXPERIENCE (E-E-A-T — weave 1 of these in naturally where relevant, in your own words, framed as a pattern we see repeatedly, NOT as a specific unnamed customer story; do not quote verbatim):",
    ];
    for (const s of snippets) {
      lines.push(`- [${s.kind}] ${s.body}`);
    }
    return lines.join("\n");
  } catch {
    return ""; // optional — never blocks generation
  }
}
