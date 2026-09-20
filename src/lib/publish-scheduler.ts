import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * PACED AUTO-PUBLISHER — one article live every N hours, then tell the team.
 *
 * ── Why this is a queued job and not a setInterval ──────────────────────────
 * The obvious build is `setInterval(publishNext, 8h)`. It is the wrong one here,
 * for three reasons this codebase already has scars from:
 *
 *   1. A timer resets on every deploy. Restart at 7h59m and the clock starts
 *      over, so "every 8 hours" silently becomes "whenever we last deployed".
 *   2. Two server instances mean two timers, so two articles per interval. The
 *      `jobs` table already solves this: claimJobs uses a conditional UPDATE, so
 *      a row can only ever be claimed once no matter how many instances run.
 *   3. A timer has no memory. A queued row with a future `run_after` is durable
 *      state you can inspect, cancel, or move.
 *
 * So the cadence is one self-perpetuating `publish_next_article` job: it runs,
 * publishes one article, and books the next one for `now + interval` before it
 * finishes. The always-on job-runner (job-runner.ts) drains it. No new timer.
 *
 * ── The gate ────────────────────────────────────────────────────────────────
 * publishContentStudioArticle() applies NO quality gate; it publishes whatever
 * it is handed. That is correct for a human clicking Publish, and unacceptable
 * for something firing unattended every 8 hours. So the gate lives here, and it
 * is deliberately about facts rather than taste: an unresolved
 * [VERIFY WITH PRODUCT TEAM] placeholder, a banned marketing blurb, an
 * overpromise that trips OVERPROMISE_PATTERNS, a thin word count, missing
 * structured data. A blocked article is SKIPPED, not retried forever, and the
 * cadence moves to the next candidate so one bad file cannot stall the pipeline.
 *
 * ── The order ───────────────────────────────────────────────────────────────
 * Not alphabetical, and not random. Hub-first by inbound internal links, the
 * same rule scripts/plan-publish-order.mjs uses: publish the pages other pages
 * already point at, so internal links go live BEFORE the articles linking to
 * them. Every article published in this order retires the largest possible
 * number of future dead links. Publishing in a careless order is how you end up
 * with hundreds of internal 404s.
 */

import { OVERPROMISE_PATTERNS } from "./kloudbean-plans";

export const PUBLISH_CADENCE_JOB = "publish_next_article";

/* ------------------------------------------------------------------ config */

export type CadenceConfig = {
  intervalMs: number;
  /** Minimum stored quality_score. 0 disables the check (many hand-written articles have no score). */
  minScore: number;
  /** Compose and notify, but do not publish. */
  dryRun: boolean;
  /** How many candidates to try before giving up for this run. */
  maxCandidates: number;
  /** Hard ceiling as a safety net against a runaway loop. */
  maxPerDay: number;
};

export function getCadenceConfig(): CadenceConfig {
  const hours = Number(process.env.PUBLISH_CADENCE_HOURS || 8);
  return {
    intervalMs: Math.max(5 * 60_000, hours * 3_600_000),
    minScore: Number(process.env.PUBLISH_CADENCE_MIN_SCORE || 0),
    dryRun: process.env.PUBLISH_CADENCE_DRY_RUN === "1",
    maxCandidates: Number(process.env.PUBLISH_CADENCE_MAX_CANDIDATES || 5),
    maxPerDay: Number(process.env.PUBLISH_CADENCE_MAX_PER_DAY || 6),
  };
}

/* ------------------------------------------------------- disk + link graph */

function contentStudioDir(): string {
  return path.join(process.cwd(), "content-studio");
}

function manifestPath(): string {
  return path.join(contentStudioDir(), "_published.json");
}

type Manifest = {
  note?: string;
  generated_at?: string;
  count?: number;
  published: {
    slug: string;
    wp_slug?: string;
    published_url?: string;
    published_at?: string;
    matched_by?: string;
  }[];
};

function readManifest(): Manifest {
  try {
    const raw = fs.readFileSync(manifestPath(), "utf8");
    const d = JSON.parse(raw) as Manifest;
    if (Array.isArray(d?.published)) return d;
  } catch {
    /* a missing manifest just means "nothing known live from the file" */
  }
  return { published: [] };
}

/**
 * Record a publish in the committed manifest. publishContentStudioArticle
 * updates the DB but not this file, and the engine DB is ephemeral, so without
 * this the article would look unpublished again after a restart and the cadence
 * would republish it. Idempotent.
 */
function recordInManifest(slug: string, url: string, wpSlug?: string): void {
  try {
    const m = readManifest();
    if (m.published.some((p) => p.slug === slug)) return;
    m.published.push({
      slug,
      wp_slug: wpSlug ?? slug,
      published_url: url,
      published_at: new Date().toISOString(),
      matched_by: "cadence",
    });
    m.count = m.published.length;
    m.generated_at = new Date().toISOString();
    fs.writeFileSync(manifestPath(), `${JSON.stringify(m, null, 2)}\n`, "utf8");
  } catch (e) {
    console.warn(`[cadence] could not update manifest for ${slug}:`, (e as Error)?.message);
  }
}

/** slug -> outbound internal slugs, for every article with a body file on disk. */
function buildLinkGraph(): { outbound: Map<string, Set<string>>; inbound: Map<string, number> } {
  const root = contentStudioDir();
  const outbound = new Map<string, Set<string>>();
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(root);
  } catch {
    return { outbound, inbound: new Map() };
  }
  for (const slug of entries) {
    const f = path.join(root, slug, `${slug}.html`);
    if (!fs.existsSync(f)) continue;
    const set = new Set<string>();
    const html = fs.readFileSync(f, "utf8");
    for (const m of html.matchAll(/kloudbean\.com\/blog\/([a-z0-9-]+)\//g)) {
      if (m[1] !== slug) set.add(m[1]);
    }
    outbound.set(slug, set);
  }
  const inbound = new Map<string, number>();
  for (const [, targets] of outbound) {
    for (const t of targets) inbound.set(t, (inbound.get(t) ?? 0) + 1);
  }
  return { outbound, inbound };
}

/* ------------------------------------------------------------ the gate */

export type GateResult = { ok: boolean; reasons: string[] };

const BLURB_RE = /1,000\+|30\+ countries|two-minute|~2-min|24\/7 human/gi;
const PLACEHOLDER_RE = /\[VERIFY WITH PRODUCT TEAM\]|\[CONFIRM\b|\[TODO\b|\[TBD\b/i;

/**
 * Deterministic pre-publish checks against the file that is about to ship.
 * Facts, not style: anything here would be a real defect on a live page.
 */
export function gateArticleFile(slug: string): GateResult {
  const reasons: string[] = [];
  const file = path.join(contentStudioDir(), slug, `${slug}.html`);
  if (!fs.existsSync(file)) return { ok: false, reasons: [`no file at ${slug}/${slug}.html`] };
  const html = fs.readFileSync(file, "utf8");

  // An unresolved placeholder is a missing fact, and the one thing that must
  // never reach a published page.
  const ph = html.match(PLACEHOLDER_RE);
  if (ph) reasons.push(`unresolved placeholder ${ph[0]}`);

  const blurbs = html.match(BLURB_RE);
  if (blurbs?.length)
    reasons.push(`${blurbs.length} banned blurb(s): ${[...new Set(blurbs)].join(", ")}`);

  // Reuse the engine's own claim guardrails rather than a second opinion.
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  for (const { pattern, issue } of OVERPROMISE_PATTERNS) {
    if (pattern.test(text)) reasons.push(`overpromise: ${issue}`);
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 1400) reasons.push(`thin: ${words} words (want 1400+)`);

  if (!/<script type="application\/ld\+json">/i.test(html)) reasons.push("no JSON-LD");
  if (!/<title>[^<]{10,}<\/title>/i.test(html)) reasons.push("missing or stub <title>");
  if (!/<meta\s+name="description"\s+content="[^"]{40,}"/i.test(html))
    reasons.push("missing or thin meta description");

  return { ok: reasons.length === 0, reasons };
}

/* ------------------------------------------------------- candidate picking */

export type Candidate = { slug: string; articleId: string; title: string; inbound: number };

/** Everything already live, from the DB (authoritative) plus the manifest. */
async function liveSlugs(): Promise<Set<string>> {
  const live = new Set<string>();
  for (const p of readManifest().published) if (p.slug) live.add(p.slug);
  try {
    const repo = await import("@/server/db/repos/articles");
    const all = await repo.listArticles({ limit: 5000 });
    for (const a of all) {
      const isLive =
        !!a.published_url || a.approval_status === "published" || a.status === "published";
      if (isLive && a.url_slug) live.add(a.url_slug);
    }
  } catch (e) {
    console.warn("[cadence] could not read articles for live state:", (e as Error)?.message);
  }
  return live;
}

/**
 * Unpublished articles, hub-first. Returns the ranked shortlist rather than one
 * slug, so the caller can skip a gate failure and take the next.
 */
export async function rankCandidates(limit = 25): Promise<Candidate[]> {
  const { outbound, inbound } = buildLinkGraph();
  const live = await liveSlugs();
  const repo = await import("@/server/db/repos/articles");

  const unpublished = [...outbound.keys()].filter((s) => !live.has(s));
  const ranked = unpublished.sort((a, b) => {
    const ia = inbound.get(a) ?? 0;
    const ib = inbound.get(b) ?? 0;
    if (ib !== ia) return ib - ia;
    // Tie-break: prefer an article whose own outbound links are already live, so
    // it ships with fewer deferred links.
    const sa = [...(outbound.get(a) ?? [])].filter((t) => !live.has(t)).length;
    const sb = [...(outbound.get(b) ?? [])].filter((t) => !live.has(t)).length;
    return sa - sb;
  });

  const out: Candidate[] = [];
  for (const slug of ranked) {
    if (out.length >= limit) break;
    // No article row means it was never ingested, so there is no id to publish.
    const row = await repo.getArticleBySlug(slug).catch(() => null);
    if (!row?.id) continue;
    out.push({
      slug,
      articleId: row.id,
      title: row.title ?? slug,
      inbound: inbound.get(slug) ?? 0,
    });
  }
  return out;
}

/* ------------------------------------------------------------- the run */

export type CadenceRunResult = {
  ok: boolean;
  dryRun: boolean;
  published?: { slug: string; title: string; url: string };
  skipped: { slug: string; reasons: string[] }[];
  notified?: { target: string; ok: boolean; error?: string }[];
  nextAt?: string;
  remaining?: number;
  error?: string;
};

/** How many articles this cadence has published in the last 24 hours. */
async function publishedLastDay(): Promise<number> {
  try {
    const repo = await import("@/server/db/repos/articles");
    const all = await repo.listArticles({ limit: 5000 });
    const cutoff = Date.now() - 24 * 3_600_000;
    return all.filter((a) => a.published_at && new Date(a.published_at).getTime() >= cutoff).length;
  } catch {
    return 0;
  }
}

/**
 * Publish the next eligible article, notify, and book the following run.
 * Never throws: the job handler needs a result, and once an article is live a
 * thrown error would make the queue retry the publish.
 */
export async function runPublishCadenceOnce(
  opts: { reschedule?: boolean } = {},
): Promise<CadenceRunResult> {
  const cfg = getCadenceConfig();
  const skipped: CadenceRunResult["skipped"] = [];
  const reschedule = opts.reschedule !== false;

  try {
    const perDay = await publishedLastDay();
    if (perDay >= cfg.maxPerDay) {
      if (reschedule) await bookNextRun(cfg.intervalMs);
      return {
        ok: false,
        dryRun: cfg.dryRun,
        skipped,
        error: `daily cap reached (${perDay}/${cfg.maxPerDay} in the last 24h)`,
      };
    }

    const candidates = await rankCandidates(cfg.maxCandidates * 4);
    if (!candidates.length) {
      if (reschedule) await bookNextRun(cfg.intervalMs);
      return { ok: false, dryRun: cfg.dryRun, skipped, error: "nothing left to publish" };
    }

    let tried = 0;
    for (const c of candidates) {
      if (tried >= cfg.maxCandidates) break;
      tried++;

      const gate = gateArticleFile(c.slug);
      if (!gate.ok) {
        skipped.push({ slug: c.slug, reasons: gate.reasons });
        continue;
      }

      if (cfg.minScore > 0) {
        const repo = await import("@/server/db/repos/articles");
        const row = await repo.getArticleById(c.articleId);
        const score = row?.quality_score ?? 0;
        const blocking = (row?.quality_report as { blocking?: unknown } | null)?.blocking;
        if (score < cfg.minScore) {
          skipped.push({ slug: c.slug, reasons: [`quality ${score} < ${cfg.minScore}`] });
          continue;
        }
        if (blocking) {
          skipped.push({ slug: c.slug, reasons: ["quality report has blocking issues"] });
          continue;
        }
      }

      // ---- this one is going out
      if (cfg.dryRun) {
        const nextAt = reschedule ? new Date(Date.now() + cfg.intervalMs) : null;
        return {
          ok: true,
          dryRun: true,
          published: {
            slug: c.slug,
            title: c.title,
            url: `https://www.kloudbean.com/blog/${c.slug}/ (dry run, not published)`,
          },
          skipped,
          nextAt: nextAt?.toISOString(),
          remaining: candidates.length - 1,
        };
      }

      const { publishContentStudioArticle } = await import("./wp-publish-content-studio");
      const res = await publishContentStudioArticle(c.articleId, "publish");
      if (!res.ok || !res.link) {
        skipped.push({ slug: c.slug, reasons: [res.error ?? "publish failed"] });
        // A WordPress rate limit is not this article's fault. Surface it so the
        // queue's own 429 handling defers the job instead of burning a retry.
        if (res.error && /\b429\b|rate[\s-]?limit/i.test(res.error)) {
          throw new Error(res.error);
        }
        continue;
      }

      let wpSlug: string | undefined;
      try {
        wpSlug = new URL(res.link).pathname.replace(/\/+$/, "").split("/").pop() || undefined;
      } catch {
        /* keep the folder slug */
      }
      recordInManifest(c.slug, res.link, wpSlug);

      const nextAt = reschedule ? await bookNextRun(cfg.intervalMs) : null;

      // Notify AFTER the article is live and the next run is booked, so a broken
      // webhook cannot affect either.
      let notified: CadenceRunResult["notified"];
      try {
        const { notify, buildPublishedMessage } = await import("./notify");
        const results = await notify({
          title: c.title,
          link: res.link,
          text: buildPublishedMessage({
            title: c.title,
            link: res.link,
            nextAt: nextAt ?? null,
          }),
          meta: {
            slug: c.slug,
            wp_slug: wpSlug,
            inbound_links: c.inbound,
            images: res.images,
            links_deferred: res.linksDeferred,
            links_healed: res.linksHealed,
          },
        });
        notified = results.map((r) => ({ target: r.target, ok: r.ok, error: r.error }));
      } catch (e) {
        console.warn("[cadence] notification failed (article is live):", (e as Error)?.message);
      }

      return {
        ok: true,
        dryRun: false,
        published: { slug: c.slug, title: c.title, url: res.link },
        skipped,
        notified,
        nextAt: nextAt?.toISOString(),
        remaining: Math.max(0, candidates.length - 1),
      };
    }

    // Everything tried was blocked. Still reschedule, so the cadence recovers
    // on its own once the blocked articles are fixed.
    if (reschedule) await bookNextRun(cfg.intervalMs);
    return {
      ok: false,
      dryRun: cfg.dryRun,
      skipped,
      error: `all ${tried} candidate(s) blocked by the pre-publish gate`,
    };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    // Let a rate-limit error propagate: drainJobs turns it into a defer rather
    // than a failure, which is exactly the behaviour we want.
    if (/\b429\b|rate[\s-]?limit/i.test(msg)) throw e;
    if (reschedule) await bookNextRun(cfg.intervalMs).catch(() => null);
    return { ok: false, dryRun: cfg.dryRun, skipped, error: msg };
  }
}

/* -------------------------------------------------------- start/stop/status */

/** Book the next cadence run, unless one is already booked. */
export async function bookNextRun(delayMs: number): Promise<Date> {
  const { enqueueJobs, hasActiveJobOfType } = await import("@/server/db/repos/jobs");
  const at = new Date(Date.now() + delayMs);
  // Without this guard, calling start twice would leave two future rows and the
  // cadence would quietly double.
  if (await hasActiveJobOfType(PUBLISH_CADENCE_JOB)) {
    const { nextRunAtForType } = await import("@/server/db/repos/jobs");
    return (await nextRunAtForType(PUBLISH_CADENCE_JOB)) ?? at;
  }
  await enqueueJobs([
    {
      type: PUBLISH_CADENCE_JOB,
      payload: {},
      label: `Publish next article (due ${at.toISOString().slice(0, 16).replace("T", " ")}Z)`,
      // One attempt: a retry storm must not publish several articles back to
      // back. A failed run is rebooked by the run itself.
      maxAttempts: 1,
      runAfter: at,
    },
  ]);
  return at;
}

/** Start the cadence. `firstRunNow` books it immediately instead of after one interval. */
export async function startPublishCadence(
  firstRunNow = false,
): Promise<{ ok: boolean; nextAt: string; alreadyRunning: boolean }> {
  const cfg = getCadenceConfig();
  const { hasActiveJobOfType } = await import("@/server/db/repos/jobs");
  const already = await hasActiveJobOfType(PUBLISH_CADENCE_JOB);
  const at = await bookNextRun(firstRunNow ? 0 : cfg.intervalMs);
  try {
    const { ensureJobRunner } = await import("./job-runner");
    ensureJobRunner();
  } catch {
    /* the runner starts on boot too */
  }
  return { ok: true, nextAt: at.toISOString(), alreadyRunning: already };
}

export async function stopPublishCadence(): Promise<{ ok: boolean; cancelled: number }> {
  const { cancelPendingJobsOfType } = await import("@/server/db/repos/jobs");
  const cancelled = await cancelPendingJobsOfType(PUBLISH_CADENCE_JOB);
  return { ok: true, cancelled };
}

export async function publishCadenceStatus(): Promise<{
  running: boolean;
  nextAt: string | null;
  config: CadenceConfig;
  notifyTargets: string[];
  publishedLast24h: number;
  remaining: number;
  nextUp: { slug: string; inbound: number; gate: GateResult }[];
}> {
  const cfg = getCadenceConfig();
  const { hasActiveJobOfType, nextRunAtForType } = await import("@/server/db/repos/jobs");
  const { configuredNotifyTargets } = await import("./notify");
  const candidates = await rankCandidates(5);
  const live = await liveSlugs();
  const { outbound } = buildLinkGraph();
  return {
    running: await hasActiveJobOfType(PUBLISH_CADENCE_JOB),
    nextAt: (await nextRunAtForType(PUBLISH_CADENCE_JOB))?.toISOString() ?? null,
    config: cfg,
    notifyTargets: configuredNotifyTargets(),
    publishedLast24h: await publishedLastDay(),
    remaining: [...outbound.keys()].filter((s) => !live.has(s)).length,
    nextUp: candidates.map((c) => ({
      slug: c.slug,
      inbound: c.inbound,
      gate: gateArticleFile(c.slug),
    })),
  };
}
