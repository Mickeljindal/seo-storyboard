import "@tanstack/react-start/server-only";
import fs from "node:fs";
import {
  classifyDomain,
  linkValueScore,
  normaliseDomain,
  spamScore,
  topicalRelevance,
  type DomainClass,
  type OpportunityType,
} from "./link-classifier";

/**
 * PROSPECTING RECIPES — five different questions, one pipeline.
 *
 * Until now the system could ask exactly one question: "who links to a competitor,
 * anywhere on their site?" That is a good question and it is not the only one. Each
 * recipe here asks a different one, and the difference matters because the ANSWER
 * changes what the email can honestly say:
 *
 *   skyscraper     Who cited this specific competitor article?
 *                  -> we know the exact page they chose to link, so the email can
 *                     name it and name what it leaves out.
 *   product_review Who reviewed this competitor recently?
 *                  -> they test products and publish findings, so the honest ask is
 *                     "look at ours", not "insert a link".
 *   guest_post     Who accepts contributions on this topic?
 *                  -> the ask is a pitch, and it should reference their guidelines.
 *   podcast        Which shows has this person appeared on?
 *                  -> not a link ask at all. The ask is to be a guest.
 *   resource_page  Which resource lists cover this keyword?
 *                  -> the ask is an addition to a curated list.
 *
 * WHERE THE DATA COMES FROM, and why two of these cost nothing.
 *
 * Skyscraper and product_review read the competitor backlink exports already on
 * disk, because those CSVs carry `target_url` for every single link. That means
 * "who links to THIS article" is answerable from real backlink data rather than
 * inferred from a search result, which is both more accurate and free. The other
 * three need a live search, and use the Serper client that already exists.
 *
 * WHAT EVERY RECIPE MUST DO, because the pipeline downstream depends on it:
 *
 *   1. Write `bestSourceUrl` and `bestSourceTitle`. The pitch drafter's angle
 *      picker reads ONLY those two fields, and the follow-up rebuilds its input
 *      from the stored row. A recipe that keeps its evidence anywhere else gets a
 *      follow-up written on a different angle than the first email.
 *   2. Set an `opportunityType` that the drafter has a body builder for. An
 *      unmatched type silently falls through to the generic editorial wording.
 *   3. Self-limit per run. The job queue kills anything past 120 seconds.
 *   4. Insert at status 'needs_contact'. Contact finding and drafting then pick the
 *      row up with no further wiring.
 */

export type RecipeName =
  | "skyscraper"
  | "product_review"
  | "guest_post"
  | "podcast"
  | "resource_page";

export const RECIPES: {
  name: RecipeName;
  /** What a person calls it. Plain words, no jargon. */
  label: string;
  /** What you type in. */
  inputLabel: string;
  inputHint: string;
  /** One sentence on what comes back. */
  outputs: string;
  /** True when it needs a paid search API rather than the exports on disk. */
  needsSearch: boolean;
}[] = [
  {
    name: "skyscraper",
    label: "Who links to a rival's article",
    inputLabel: "A rival's article address, or a few words from its address",
    inputHint: "heroku.com/blog/pricing  ·  or just: pricing",
    outputs: "Every site that links to that page, from our own backlink exports.",
    needsSearch: false,
  },
  {
    name: "product_review",
    label: "Who reviewed a rival recently",
    inputLabel: "One or more rival names",
    inputHint: "heroku, render, railway",
    outputs: "Blogs that published a review of them, newest first.",
    needsSearch: false,
  },
  {
    name: "guest_post",
    label: "Who takes guest posts",
    inputLabel: "Topics, one per line or comma separated",
    inputHint: "managed hosting, node deployment, devops",
    outputs: "Sites openly asking for contributions on those topics.",
    needsSearch: true,
  },
  {
    name: "podcast",
    label: "Podcasts someone has been on",
    inputLabel: "A person's name, and their company if it helps",
    inputHint: "Guillermo Rauch Vercel",
    outputs: "Shows that have featured them, so we can pitch the same shows.",
    needsSearch: true,
  },
  {
    name: "resource_page",
    label: "Resource lists on a topic",
    inputLabel: "Keywords, one per line or comma separated",
    inputHint: "web hosting, deployment tools",
    outputs: "Curated resource pages that could add one more entry.",
    needsSearch: true,
  },
];

export type RecipeCandidate = {
  domain: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  anchor: string | null;
  targetUrl: string | null;
  opportunityType: OpportunityType;
  /** Whatever this recipe knows that the standard columns cannot hold. */
  evidence: Record<string, unknown>;
  /** Only the export-based recipes know this; search-based ones do not. */
  authority?: number;
  refdomainBacklinks?: number;
  linksTo?: string[];
  firstSeen?: string | null;
  lastSeen?: string | null;
};

export type RecipeResult = {
  ok: boolean;
  recipe: RecipeName;
  runId: string | null;
  found: number;
  stored: number;
  duplicates: number;
  rejected: number;
  queriesUsed: number;
  readout: string;
  samples: { domain: string; title: string | null; value: number }[];
  error?: string;
};

/* -------------------------------------------------------------------------- *
 * Shared helpers
 * -------------------------------------------------------------------------- */

/** Split a textarea into clean, de-duplicated terms. */
export function splitInput(text: string): string[] {
  return [
    ...new Set(
      (text ?? "")
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, 12);
}

/**
 * Domains that are never a prospect however well they match.
 *
 * Separate from `classifyDomain`, which judges what KIND of site something is.
 * This is a flat refusal list for the places a search inevitably returns and a
 * cold email must never go: the big platforms, the aggregators, and the podcast
 * directories. Pitching Apple Podcasts to appear on Apple Podcasts is the kind of
 * mistake that only an automated system makes.
 */
const NEVER_PITCH =
  /(^|\.)(google|youtube|facebook|instagram|twitter|x|linkedin|reddit|quora|medium|substack|wikipedia|amazon|apple|spotify|soundcloud|podcasts?\.apple|podchaser|listennotes|player\.fm|castbox|deezer|audible|stitcher|pocketcasts|overcast|tunein|iheart|podbean|buzzsprout|libsyn|anchor|transistor|simplecast|captivate|redcircle|megaphone|art19|acast|pinterest|tiktok|github|gitlab|stackoverflow|stackexchange|npmjs|pypi|docker|slideshare|scribd|issuu|glassdoor|indeed|crunchbase|producthunt|g2|capterra|trustpilot|getapp|softwareadvice|sitejabber|yelp|bbb)\./i;

export function isNeverPitch(domain: string): boolean {
  const d = normaliseDomain(domain);
  if (!d || !d.includes(".")) return true;
  return NEVER_PITCH.test(`${d}.`);
}

/**
 * Product documentation, API references and status pages.
 *
 * Nobody edits a company's docs because a stranger emailed asking. The first live
 * skyscraper run returned docs.fluentd.org at a value of 42.9 and
 * docs.publishing.service.gov.uk right behind it, both perfectly real links and
 * both completely unpitchable. Checked on the subdomain AND the path, because
 * plenty of sites put their docs at /docs rather than on docs.*.
 */
const DOCS_HOST = /^(docs?|developer|developers|api|apidocs|support|help|status|kb|wiki|man|readthedocs)\./i;
const DOCS_PATH = /^\/(docs?|api|reference|man|javadoc|godoc|apidocs|swagger|changelog|release-notes)(\/|$)/i;

/**
 * Forums and Q&A threads.
 *
 * A thread is written by whoever turned up, so there is no editor to write to and
 * nothing anybody will go back and change. The first product-review run returned
 * daniweb.com, a developer forum, scoring 44 as though it were a publication with
 * a reviews desk. Kept deliberately narrow: only unmistakable forum software paths
 * and hosts, because "community" appears in the URL of plenty of real blogs.
 */
const FORUM_HOST = /^(forum|forums|community|answers|ask|discuss|discourse)\./i;
const FORUM_PATH =
  /\/(forum|forums|viewtopic|showthread|threads?|topic|questions?|discussions?)(\/|\.|$)|\/t\/[^/]+\/\d+/i;

export function isForum(domain: string, url?: string | null): boolean {
  const d = normaliseDomain(domain);
  if (FORUM_HOST.test(d)) return true;
  if (/^(daniweb|codeproject|sitepoint\.com\/community|spiceworks)\./i.test(d)) return true;
  if (/^(daniweb|spiceworks)\.com$/i.test(d)) return true;
  if (!url) return false;
  try {
    return FORUM_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function isDocumentation(domain: string, url?: string | null): boolean {
  if (DOCS_HOST.test(normaliseDomain(domain))) return true;
  if (/\.readthedocs\.io$/i.test(normaliseDomain(domain))) return true;
  if (!url) return false;
  try {
    return DOCS_PATH.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/**
 * Fill in real DOMAIN authority for a set of candidate domains.
 *
 * WHY THIS EXISTS, and it is not a refinement. The backlinks export carries
 * `page_ascore`, which is the authority of the individual linking PAGE. The
 * refdomains export carries `domain_ascore`, which is the authority of the SITE.
 * They are frequently very different, and `authorityBand` returns 0 below 12,
 * which makes `linkValueScore` return 0 outright.
 *
 * The result, observed on the first live run: itqlick.com's "Heroku Reviews 2026:
 * Real Pros, Cons & Expert Value Verdict" and focos.io's "Heroku Review" both
 * scored exactly 0. Those are precisely the pages this recipe exists to find, and
 * a 0 means they sort below every reject and sit under the contact crawler's
 * minimum value forever. Kept but unusable is the worst of the available outcomes,
 * because nothing about the list looks broken.
 *
 * Reads only the refdomain files of the competitors actually being scanned, and
 * stops as soon as every wanted domain is accounted for.
 */
async function resolveAuthority(
  domains: Set<string>,
  sources: { competitor: string; refdomains: string }[],
): Promise<Map<string, { authority: number; backlinks: number; country: string | null }>> {
  const out = new Map<string, { authority: number; backlinks: number; country: string | null }>();
  if (!domains.size) return out;
  const { forEachCsvRow } = await import("./csv");

  for (const src of sources) {
    if (out.size >= domains.size) break;
    if (!src.refdomains || !fs.existsSync(src.refdomains)) continue;
    await forEachCsvRow(src.refdomains, (row) => {
      const d = normaliseDomain(row.domain ?? "");
      if (!d || !domains.has(d)) return;
      const a = Number(row.domain_ascore ?? 0) || 0;
      const bl = Number(row.backlinks ?? 0) || 0;
      const prev = out.get(d);
      // Keep the highest figure seen. The same domain appears in several exports
      // and the numbers differ slightly between them.
      if (!prev || a > prev.authority) {
        out.set(d, {
          authority: a,
          backlinks: Math.max(bl, prev?.backlinks ?? 0),
          country: (row.country ?? "").trim() || prev?.country || null,
        });
      } else if (bl > prev.backlinks) {
        prev.backlinks = bl;
      }
    });
  }
  return out;
}

/**
 * A page title from a search result or an export row, tidied.
 *
 * Publishers append their own brand to every title. The reader knows their own
 * site, and the trailing brand crowds out the part that is actually about them.
 */
function tidyTitle(t?: string | null): string | null {
  if (!t) return null;
  const s = t
    .replace(/\s*[|\-–—·]\s*[^|\-–—·]{2,32}$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, 200) || null;
}

/**
 * Score and filter one candidate, then shape it for the repo.
 *
 * Recipe-sourced rows go through the SAME scorer as mined rows, deliberately. A
 * second scoring path would drift from the first, and then two prospects with the
 * same value_score would not be comparable, which quietly breaks every ordering
 * and every metric in the workspace.
 */
export function prepareCandidate(
  c: RecipeCandidate,
  recipe: RecipeName,
  runId: string | null = null,
): { keep: boolean; why: string | null; row: Record<string, unknown> } {
  const domain = normaliseDomain(c.domain);
  const { domainClass, rejectReason } = classifyDomain(domain);

  /**
   * Relevance is judged on the title and the URL, and NOT on the anchor text.
   *
   * This is the same trap the pitch drafter's angle picker already documents, and
   * the first live run walked straight into it. The anchor in this dataset is
   * almost always the rival's bare brand name, and "heroku" is itself a topic term
   * worth 0.8. So including the anchor gave every single row a passing relevance
   * score and the off-topic guard below never fired once.
   *
   * Concretely: docs.fluentd.org's "regexp" page and cxl.com's "10 Principles of
   * Effective Pricing Pages" both survived at a healthy score, purely because the
   * word Heroku appeared in the link text. Neither is about hosting.
   */
  const relevance = topicalRelevance(c.sourceTitle, c.sourceUrl, null);

  /**
   * Authority is genuinely unknown for a search-sourced candidate, and pretending
   * otherwise would be the worst option available. Passing 0 means authorityBand
   * returns 0 and linkValueScore returns 0, so every search result would score
   * zero and sort below every reject. So they get a NEUTRAL 30, which lands in the
   * middle band, and the row records that the figure was assumed rather than
   * measured. A contact crawl re-scores it later with real information.
   */
  const authorityKnown = typeof c.authority === "number" && c.authority > 0;
  const authority = authorityKnown ? (c.authority as number) : 30;

  const value = linkValueScore({
    authority,
    refdomainBacklinks: c.refdomainBacklinks ?? 0,
    domain,
    domainClass: domainClass as DomainClass,
    opportunityType: c.opportunityType,
    rivalCount: c.linksTo?.length ?? 1,
    linkCount: 1,
    relevance,
  });

  const spam = spamScore({
    domain,
    authority,
    refdomainBacklinks: c.refdomainBacklinks ?? 0,
  });

  let why: string | null = rejectReason;
  if (!why && isNeverPitch(domain)) why = "platform or directory we never cold-email";
  if (!why && isDocumentation(domain, c.sourceUrl)) why = "product documentation, not an editorial page";
  if (!why && isForum(domain, c.sourceUrl)) why = "a forum thread, so there is no editor to write to";
  /**
   * The topical check is skipped for podcasts and only for podcasts. A show called
   * "Syntax" or "The Changelog" scores zero on hosting terms while being exactly
   * the right audience, so applying the filter here would reject the best targets
   * the recipe can find. Every other recipe keeps it, because there it is the
   * guard against pitching a page nobody read.
   */
  if (!why && c.opportunityType !== "podcast" && relevance === 0 && !!c.sourceTitle) {
    why = "the page is not about hosting or deployment";
  }
  if (!why && spam >= 60) why = `looks like a link farm (spam ${spam})`;
  /**
   * A score of 0 has to be a rejection, not a kept row.
   *
   * `linkValueScore` returns 0 outright for an authority under 12, and the contact
   * crawler only looks at rows scoring 20 or more. So a kept row at 0 is never
   * crawled, never pitched and never seen again, while still counting as a find. It
   * looks like a result and behaves like a leak. Same floor as the miner uses, so
   * the two paths agree.
   */
  const minValue = Number(process.env.RECIPE_MIN_VALUE || 8);
  if (!why && value < minValue) {
    why = `not strong enough to pursue (scored ${value}, needs ${minValue})`;
  }

  const keep = !why;

  return {
    keep,
    why,
    row: {
      domain,
      homepageUrl: `https://${domain}/`,
      authority,
      refdomainBacklinks: c.refdomainBacklinks ?? 0,
      linksTo: c.linksTo ?? [],
      rivalCount: c.linksTo?.length ?? 0,
      linkCount: 1,
      bestSourceUrl: c.sourceUrl,
      bestSourceTitle: tidyTitle(c.sourceTitle),
      bestAnchor: c.anchor,
      bestTargetUrl: c.targetUrl,
      firstSeen: c.firstSeen ?? null,
      lastSeen: c.lastSeen ?? null,
      hasLostLink: false,
      domainClass,
      opportunityType: keep ? c.opportunityType : "none",
      rejectReason: why,
      valueScore: keep ? value : 0,
      spamScore: spam,
      status: keep ? "needs_contact" : "rejected",
      sourceRecipe: recipe,
      recipeRunId: runId,
      recipeEvidence: {
        ...c.evidence,
        authorityAssumed: !authorityKnown,
        foundBy: recipe,
        foundAt: new Date().toISOString(),
      },
    },
  };
}

/**
 * Write the candidates, keeping recipe provenance even on a domain we already had.
 *
 * `insertLinkProspectsIgnoringDuplicates` skips an existing domain entirely, which
 * is right for re-mining but wrong here: a domain we found months ago through the
 * export, which a skyscraper run has now shown also cites a specific article, is
 * genuinely better information than we had. So known domains get the recipe
 * provenance and the sharper evidence, WITHOUT their workflow status, contact or
 * human edits being touched.
 */
async function persist(
  prepared: { keep: boolean; row: Record<string, unknown> }[],
  recipe: RecipeName,
  runId: string | null,
): Promise<{ stored: number; duplicates: number; enriched: number }> {
  const { getDb, schema } = await import("@/server/db/client");
  const { sql, inArray } = await import("drizzle-orm");
  const db = await getDb();

  const rows = prepared.map((p) => p.row);
  /**
   * Which domains a REJECTED candidate must never be allowed to touch.
   *
   * A rejected candidate carries opportunityType 'none' and valueScore 0. The first
   * version of this function enriched every duplicate regardless, so a recipe run
   * that rejected a domain for being off-topic would reach into a perfectly good
   * existing prospect and set its opportunity type to 'none', deleting its score
   * and its place in the queue. New rejects are still stored, so a repeat run
   * reports them as duplicates instead of offering the same junk again. They simply
   * may not overwrite anything.
   */
  const keepable = new Set(prepared.filter((p) => p.keep).map((p) => String(p.row.domain)));

  const domains = rows.map((r) => String(r.domain));
  const existing = domains.length
    ? await db
        .select({
          id: schema.linkProspects.id,
          domain: schema.linkProspects.domain,
          status: schema.linkProspects.status,
          bestSourceUrl: schema.linkProspects.bestSourceUrl,
        })
        .from(schema.linkProspects)
        .where(inArray(schema.linkProspects.domain, domains))
    : [];
  const known = new Map(existing.map((e) => [e.domain, e]));

  const fresh = rows.filter((r) => !known.has(String(r.domain)));
  const dupes = rows.filter((r) => known.has(String(r.domain)));

  let stored = 0;
  if (fresh.length) {
    const repo = await import("@/server/db/repos/link-prospects");
    // The bulk insert does not carry the v27 provenance columns, so those are
    // stamped straight after by domain. Two statements rather than a new bulk
    // path, because duplicating the insert would mean two places to keep in step.
    stored = await repo.insertLinkProspectsIgnoringDuplicates(
      fresh as unknown as Parameters<typeof repo.insertLinkProspectsIgnoringDuplicates>[0],
    );
    for (const r of fresh) {
      await db
        .update(schema.linkProspects)
        .set({
          sourceRecipe: recipe,
          recipeRunId: runId,
          recipeEvidence: r.recipeEvidence as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(sql`lower(${schema.linkProspects.domain}) = ${String(r.domain)}`);
    }
  }

  let enriched = 0;
  for (const r of dupes) {
    const prev = known.get(String(r.domain));
    if (!keepable.has(String(r.domain))) continue;
    // Anything a person has already acted on is left completely alone. Sharpening
    // the evidence under a pitch that has already gone out would make the record
    // disagree with the email that was actually sent.
    if (!prev || ["queued", "contacted", "replied", "won", "lost", "suppressed"].includes(prev.status)) {
      continue;
    }
    await db
      .update(schema.linkProspects)
      .set({
        sourceRecipe: recipe,
        recipeRunId: runId,
        recipeEvidence: r.recipeEvidence as Record<string, unknown>,
        // A recipe found a SPECIFIC page, which beats whatever generic best page
        // the export happened to pick.
        bestSourceUrl: (r.bestSourceUrl as string) ?? prev.bestSourceUrl,
        bestSourceTitle: r.bestSourceTitle as string,
        bestTargetUrl: r.bestTargetUrl as string,
        opportunityType: r.opportunityType as string,
        updatedAt: new Date(),
      })
      .where(sql`lower(${schema.linkProspects.domain}) = ${String(r.domain)}`);
    enriched++;
  }

  return { stored, duplicates: dupes.length, enriched };
}

/* -------------------------------------------------------------------------- *
 * Run bookkeeping
 * -------------------------------------------------------------------------- */

async function openRun(
  recipe: RecipeName,
  inputText: string,
  inputJson: Record<string, unknown>,
  campaign: string | null,
): Promise<string | null> {
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const db = await getDb();
    const [row] = await db
      .insert(schema.recipeRuns)
      .values({
        recipe,
        inputText,
        inputJson,
        campaignName: campaign,
        status: "running",
        startedAt: new Date(),
      })
      .returning({ id: schema.recipeRuns.id });
    return row?.id ?? null;
  } catch {
    // Bookkeeping must never stop the work it is recording.
    return null;
  }
}

async function closeRun(
  runId: string | null,
  patch: {
    status: "done" | "failed";
    found?: number;
    stored?: number;
    duplicates?: number;
    rejected?: number;
    queriesUsed?: number;
    readout?: string;
    error?: string;
  },
): Promise<void> {
  if (!runId) return;
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db
      .update(schema.recipeRuns)
      .set({ ...patch, finishedAt: new Date() })
      .where(eq(schema.recipeRuns.id, runId));
  } catch {
    /* same reasoning: a failed audit write must not fail the run */
  }
}

/* -------------------------------------------------------------------------- *
 * Recipe 1 — skyscraper, from the exports on disk
 * -------------------------------------------------------------------------- */

/**
 * Who links to a specific competitor article?
 *
 * Reads `target_url` from the backlink exports, which is the exact page each link
 * points at. This is the one recipe where the data is genuinely authoritative
 * rather than inferred, because it comes from a backlink crawl rather than from
 * guessing which search results might link somewhere.
 *
 * The input is matched loosely on purpose. Nobody wants to paste a URL with its
 * tracking parameters and hope it matches byte for byte, so a path fragment
 * ("blog/pricing") works as well as a full address.
 */
export async function runSkyscraper(opts: {
  input: string;
  limit?: number;
  minAuthority?: number;
  campaign?: string | null;
}): Promise<RecipeResult> {
  const runId = await openRun("skyscraper", opts.input, { limit: opts.limit }, opts.campaign ?? null);
  const out: RecipeResult = {
    ok: true,
    recipe: "skyscraper",
    runId,
    found: 0,
    stored: 0,
    duplicates: 0,
    rejected: 0,
    queriesUsed: 0,
    readout: "",
    samples: [],
  };

  try {
    const { usableCompetitors } = await import("./backlink-miner");
    const { forEachCsvRow } = await import("./csv");
    const sources = usableCompetitors();
    if (!sources.length) {
      out.ok = false;
      out.error = "No competitor backlink exports found on disk.";
      out.readout = "There are no backlink exports to read, so this recipe has nothing to search.";
      await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
      return out;
    }

    // Match on the path, without scheme, host prefix or query string, so a pasted
    // URL and a hand-typed fragment behave the same.
    const needles = splitInput(opts.input).map((t) =>
      t
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("?")[0]
        .replace(/\/$/, ""),
    );
    if (!needles.length) {
      out.ok = false;
      out.error = "Nothing to look for.";
      out.readout = "Type an article address, or a few words from one.";
      await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
      return out;
    }

    const minAuthority = opts.minAuthority ?? 12;
    const limit = Math.min(opts.limit ?? 60, 200);
    const byDomain = new Map<string, RecipeCandidate>();
    let matchedRows = 0;

    for (const src of sources) {
      // Once the cap is reached, stop reading files. A run that keeps streaming
      // 80,000 rows after it has what it needs is how the 120-second job timeout
      // gets hit.
      if (byDomain.size >= limit) break;
      await forEachCsvRow(src.backlinks, (row) => {
        if (byDomain.size >= limit) return;
        const target = (row.target_url ?? "").toLowerCase();
        if (!target) return;
        if (!needles.some((n) => target.includes(n))) return;

        const sourceUrl = row.source_url ?? "";
        const domain = normaliseDomain(sourceUrl);
        if (!domain || !domain.includes(".")) return;
        matchedRows++;

        const authority = Number(row.page_ascore ?? 0) || 0;
        if (authority && authority < minAuthority) return;

        const prev = byDomain.get(domain);
        if (prev) {
          // Same domain, another linking page. Record the rival but keep the first
          // page as the evidence: one page is enough to quote and two would make
          // the email vague.
          if (!prev.linksTo?.includes(src.competitor)) prev.linksTo?.push(src.competitor);
          return;
        }
        byDomain.set(domain, {
          domain,
          sourceUrl: sourceUrl || null,
          sourceTitle: (row.source_title ?? "").trim() || null,
          anchor: (row.anchor ?? "").trim() || null,
          targetUrl: (row.target_url ?? "").trim() || null,
          opportunityType: "skyscraper",
          authority,
          linksTo: [src.competitor],
          firstSeen: (row.first_seen ?? "").trim() || null,
          lastSeen: (row.last_seen ?? "").trim() || null,
          evidence: {
            citedUrl: (row.target_url ?? "").trim() || null,
            citedRival: src.competitor,
            anchorUsed: (row.anchor ?? "").trim() || null,
            matchedOn: needles.join(", "),
          },
        });
      });
    }

    out.found = byDomain.size;
    // Swap the per-page ascore for real site authority before scoring anything.
    const auth = await resolveAuthority(new Set(byDomain.keys()), sources);
    for (const [d, c] of byDomain) {
      const a = auth.get(d);
      if (a?.authority) {
        c.authority = a.authority;
        c.refdomainBacklinks = a.backlinks;
      }
    }
    const prepared = [...byDomain.values()].map((c) => prepareCandidate(c, "skyscraper", runId));
    out.rejected = prepared.filter((p) => !p.keep).length;
    const w = await persist(prepared, "skyscraper", runId);
    out.stored = w.stored;
    out.duplicates = w.duplicates;
    out.samples = prepared
      .filter((p) => p.keep)
      .slice(0, 8)
      .map((p) => ({
        domain: String(p.row.domain),
        title: (p.row.bestSourceTitle as string) ?? null,
        value: Number(p.row.valueScore ?? 0),
      }));

    out.readout =
      out.found === 0
        ? `No links to that page in the exports. ${matchedRows === 0 ? "Nothing matched the address at all, so try a shorter fragment of it." : "Everything that matched was below the authority floor."}`
        : `${out.found} sites link to that page. ${out.stored} are new and queued for a contact search, ${out.duplicates} we already had${w.enriched ? ` (${w.enriched} updated with the sharper evidence)` : ""}, ${out.rejected} were not worth pursuing.`;

    await closeRun(runId, {
      status: "done",
      found: out.found,
      stored: out.stored,
      duplicates: out.duplicates,
      rejected: out.rejected,
      readout: out.readout,
    });
    return out;
  } catch (e) {
    out.ok = false;
    out.error = String((e as Error)?.message ?? e).slice(0, 300);
    out.readout = `The run stopped: ${out.error}`;
    await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
    return out;
  }
}

/* -------------------------------------------------------------------------- *
 * Recipe 2 — product review, from the exports on disk
 * -------------------------------------------------------------------------- */

/**
 * Titles that mean somebody actually reviewed a product.
 *
 * TIGHTENED AFTER THE FIRST LIVE RUN, which returned four false positives out of
 * five samples. The loose version accepted a bare "tried", "testing" or
 * "after N years", and that pulled in "My Beancount books are 95% automatic after
 * 3 years" as a Heroku review. So the weak signals are gone and what is left is
 * language a person only writes when they are actually publishing a verdict.
 */
const REVIEW_SIGNAL =
  /\b(review(ed|s)?|hands[- ]on|we\s+tested|i\s+tested|our\s+experience|my\s+experience|honest\s+(review|opinion|take)|verdict|is\s+it\s+worth\s+it|why\s+we\s+(left|moved|switched|migrated))\b/i;

/**
 * Things that LOOK like a review and are not.
 *
 * "review app" is the important one and it cost four of the five results in the
 * first run. Heroku, GitLab and Render all ship a feature literally called review
 * apps, so "How to Create Review Apps on Heroku" is a tutorial about a product
 * feature, not a review of the product. It matched on the word "review" and read
 * as the best kind of prospect we have.
 *
 * Roundups are excluded for a different reason: they are a real opportunity, but a
 * listicle with its own pitch, and the miner already finds them. Letting them in
 * here would double-count them and send the wrong ask.
 */
const NOT_A_REVIEW =
  /\b(review\s+apps?|review\s+environments?|code\s+review|pull\s+request|peer\s+review|\d+\s+best|best\s+\d+|top\s+\d+|alternatives?|vs\.?|versus|comparison|compared)\b/i;

/**
 * Who published a review of a competitor, most recent first.
 *
 * The value of this list is not the link. It is that somebody there tests products
 * and writes up what they found, which is far rarer than somebody who publishes
 * lists. The ask that follows is therefore "have a look at ours", not "add a link",
 * and the recency filter exists because a reviewer who last reviewed anything in
 * 2019 is not reviewing anything now.
 */
export async function runProductReview(opts: {
  input: string;
  limit?: number;
  withinMonths?: number;
  campaign?: string | null;
}): Promise<RecipeResult> {
  const runId = await openRun(
    "product_review",
    opts.input,
    { limit: opts.limit, withinMonths: opts.withinMonths },
    opts.campaign ?? null,
  );
  const out: RecipeResult = {
    ok: true,
    recipe: "product_review",
    runId,
    found: 0,
    stored: 0,
    duplicates: 0,
    rejected: 0,
    queriesUsed: 0,
    readout: "",
    samples: [],
  };

  try {
    const { usableCompetitors } = await import("./backlink-miner");
    const { forEachCsvRow } = await import("./csv");
    const wanted = splitInput(opts.input).map((s) => s.toLowerCase().replace(/\..*$/, ""));
    const sources = usableCompetitors().filter(
      (s) => !wanted.length || wanted.some((w) => s.competitor.toLowerCase().includes(w)),
    );

    if (!sources.length) {
      out.ok = false;
      out.error = "No exports match those names.";
      const have = usableCompetitors().map((s) => s.competitor).join(", ");
      out.readout = have
        ? `No exports for that. The rivals we have data for are: ${have}.`
        : "There are no backlink exports on disk to read.";
      await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
      return out;
    }

    const months = Math.max(1, Math.min(opts.withinMonths ?? 24, 120));
    const cutoff = new Date(Date.now() - months * 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const limit = Math.min(opts.limit ?? 60, 200);
    const byDomain = new Map<string, RecipeCandidate>();
    let sawReviewish = 0;

    for (const src of sources) {
      if (byDomain.size >= limit) break;
      await forEachCsvRow(src.backlinks, (row) => {
        if (byDomain.size >= limit) return;
        const title = (row.source_title ?? "").trim();
        const sourceUrl = row.source_url ?? "";
        const hay = `${title} ${sourceUrl.replace(/[-_/]/g, " ")}`;
        if (!REVIEW_SIGNAL.test(hay)) return;
        if (NOT_A_REVIEW.test(hay)) return;
        sawReviewish++;

        const lastSeen = (row.last_seen ?? "").trim().slice(0, 10);
        // A missing date is kept: absent is not the same as old, and dropping it
        // would silently discard whole exports that omit the column.
        if (lastSeen && lastSeen < cutoff) return;

        const domain = normaliseDomain(sourceUrl);
        if (!domain || !domain.includes(".")) return;
        if (byDomain.has(domain)) return;

        byDomain.set(domain, {
          domain,
          sourceUrl: sourceUrl || null,
          sourceTitle: title || null,
          anchor: (row.anchor ?? "").trim() || null,
          targetUrl: (row.target_url ?? "").trim() || null,
          opportunityType: "product_review",
          authority: Number(row.page_ascore ?? 0) || 0,
          linksTo: [src.competitor],
          firstSeen: (row.first_seen ?? "").trim() || null,
          lastSeen: lastSeen || null,
          evidence: {
            reviewed: src.competitor,
            reviewUrl: sourceUrl || null,
            reviewTitle: title || null,
            lastSeen: lastSeen || null,
            withinMonths: months,
          },
        });
      });
    }

    out.found = byDomain.size;
    const auth = await resolveAuthority(new Set(byDomain.keys()), sources);
    for (const [d, c] of byDomain) {
      const a = auth.get(d);
      if (a?.authority) {
        c.authority = a.authority;
        c.refdomainBacklinks = a.backlinks;
      }
    }
    const prepared = [...byDomain.values()].map((c) => prepareCandidate(c, "product_review", runId));
    out.rejected = prepared.filter((p) => !p.keep).length;
    const w = await persist(prepared, "product_review", runId);
    out.stored = w.stored;
    out.duplicates = w.duplicates;
    out.samples = prepared
      .filter((p) => p.keep)
      .slice(0, 8)
      .map((p) => ({
        domain: String(p.row.domain),
        title: (p.row.bestSourceTitle as string) ?? null,
        value: Number(p.row.valueScore ?? 0),
      }));

    out.readout =
      out.found === 0
        ? sawReviewish > 0
          ? `Found ${sawReviewish} review-looking pages but all of them are older than ${months} months. Widen the window to see them.`
          : `No reviews of ${sources.map((s) => s.competitor).join(", ")} in the exports.`
        : `${out.found} sites reviewed ${sources.map((s) => s.competitor).join(", ")} in the last ${months} months. ${out.stored} are new, ${out.duplicates} we already had, ${out.rejected} were not worth pursuing.`;

    await closeRun(runId, {
      status: "done",
      found: out.found,
      stored: out.stored,
      duplicates: out.duplicates,
      rejected: out.rejected,
      readout: out.readout,
    });
    return out;
  } catch (e) {
    out.ok = false;
    out.error = String((e as Error)?.message ?? e).slice(0, 300);
    out.readout = `The run stopped: ${out.error}`;
    await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
    return out;
  }
}

/* -------------------------------------------------------------------------- *
 * Search-based recipes
 * -------------------------------------------------------------------------- */

/**
 * Search footprints per recipe.
 *
 * These are the queries that separate a site which openly asks for contributions
 * from a site that once wrote an article about guest posting. `inurl:` and
 * `intitle:` do most of that work, which is why they are here rather than a plain
 * keyword search.
 */
const FOOTPRINTS: Record<"guest_post" | "resource_page" | "podcast", (term: string) => string[]> = {
  guest_post: (t) => [
    `${t} "write for us"`,
    `${t} "contribute" inurl:write-for-us`,
    `${t} "guest post guidelines"`,
    `${t} intitle:"become a contributor"`,
  ],
  resource_page: (t) => [
    `${t} intitle:resources`,
    `${t} "useful resources" -inurl:forum`,
    `${t} intitle:"helpful resources"`,
    `${t} inurl:links "recommended"`,
  ],
  podcast: (t) => [
    `"${t}" podcast interview`,
    `"${t}" podcast episode guest`,
    `"${t}" "on the podcast"`,
  ],
};

/** Result URLs that are a listing of the thing rather than the thing itself. */
const LISTING_PATH = /\/(tag|tags|category|categories|search|page|author|feed|amp)\//i;

export type SearchHit = { title: string; link: string; snippet?: string };

/**
 * Turn raw search results into candidates.
 *
 * Split out from the search loop so it can be tested without spending a single
 * search credit, which turned out to matter immediately: the account ran dry
 * during the first live run, and without this seam the whole parsing and filtering
 * path would have been unverifiable until somebody topped it up.
 */
export function shapeSearchResults(
  recipe: "guest_post" | "resource_page" | "podcast",
  term: string,
  query: string,
  organic: SearchHit[],
): RecipeCandidate[] {
  const out: RecipeCandidate[] = [];
  const seen = new Set<string>();
  for (const r of organic ?? []) {
    const domain = normaliseDomain(r.link ?? "");
    if (!domain || !domain.includes(".")) continue;
    if (seen.has(domain)) continue;
    let path = "/";
    try {
      path = new URL(r.link).pathname;
    } catch {
      continue;
    }
    // A tag or category page is a listing OF the thing, not the thing. Pitching
    // one means pitching a URL that will look different next week.
    if (LISTING_PATH.test(path)) continue;
    seen.add(domain);
    out.push({
      domain,
      sourceUrl: r.link,
      sourceTitle: r.title || null,
      anchor: null,
      targetUrl: null,
      opportunityType: recipe,
      evidence: {
        query,
        term,
        snippet: (r.snippet ?? "").slice(0, 300) || null,
        ...(recipe === "podcast" ? { show: tidyTitle(r.title), personSearched: term } : {}),
        ...(recipe === "guest_post" ? { guidelinesCandidate: r.link } : {}),
      },
    });
  }
  return out;
}

async function runSearchRecipe(
  recipe: "guest_post" | "resource_page" | "podcast",
  opts: { input: string; limit?: number; geo?: string; campaign?: string | null },
): Promise<RecipeResult> {
  const runId = await openRun(recipe, opts.input, { limit: opts.limit, geo: opts.geo }, opts.campaign ?? null);
  const out: RecipeResult = {
    ok: true,
    recipe,
    runId,
    found: 0,
    stored: 0,
    duplicates: 0,
    rejected: 0,
    queriesUsed: 0,
    readout: "",
    samples: [],
  };

  try {
    const { hasSerperCredentials, serperSearch } = await import("./serper-client");
    if (!hasSerperCredentials()) {
      out.ok = false;
      out.error = "No search key configured.";
      out.readout =
        "This recipe needs a search key. Set SERPER_API_KEY, or use the two recipes that read the backlink exports instead, which need no key.";
      await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
      return out;
    }

    const terms = splitInput(opts.input);
    if (!terms.length) {
      out.ok = false;
      out.error = "Nothing to look for.";
      out.readout = "Type at least one topic, keyword or name.";
      await closeRun(runId, { status: "failed", error: out.error, readout: out.readout });
      return out;
    }

    const limit = Math.min(opts.limit ?? 40, 120);
    const geo = opts.geo ?? "us";
    /**
     * A hard query budget, checked before every request.
     *
     * Two reasons, and the second is the one that bites. Each query costs money, so
     * a careless run should not be able to spend a lot of it. And the job queue
     * kills anything past 120 seconds, so a run that fires 48 sequential searches
     * gets killed halfway and reports nothing, having paid for all of them.
     */
    const maxQueries = Math.max(1, Math.min(Number(process.env.RECIPE_MAX_QUERIES || 12), 30));
    const byDomain = new Map<string, RecipeCandidate>();
    const notes: string[] = [];
    const failures: string[] = [];
    let attempted = 0;
    let outOfCredits = false;

    outer: for (const term of terms) {
      for (const query of FOOTPRINTS[recipe](term)) {
        if (attempted >= maxQueries) {
          notes.push(`stopped at the ${maxQueries}-search limit`);
          break outer;
        }
        if (byDomain.size >= limit) break outer;

        attempted++;
        let organic: { title: string; link: string; snippet?: string }[] = [];
        try {
          const res = await serperSearch(query, geo);
          organic = res.organic ?? [];
          // Counted only when the search actually answered. Incrementing before the
          // request made a run that failed every time report twelve searches used,
          // which is both wrong and the opposite of reassuring.
          out.queriesUsed++;
        } catch (e) {
          const msg = String((e as Error)?.message ?? e);
          failures.push(msg.slice(0, 160));
          /**
           * Out of credits is not a transient failure and there is no point
           * spending the remaining eleven attempts discovering that again. Stop,
           * and say so plainly: this is the one error the person can actually fix,
           * and the first version buried it under "try a broader topic", which
           * would have sent somebody looking for a bug in their own search terms.
           */
          if (/not enough credits|quota|payment required|\b402\b/i.test(msg)) {
            outOfCredits = true;
            break outer;
          }
          continue;
        }

        for (const c of shapeSearchResults(recipe, term, query, organic)) {
          if (byDomain.size >= limit) break;
          if (byDomain.has(c.domain)) continue;
          byDomain.set(c.domain, c);
        }

        // A polite gap between searches. Nothing here is urgent.
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    out.found = byDomain.size;
    const prepared = [...byDomain.values()].map((c) => prepareCandidate(c, recipe, runId));
    out.rejected = prepared.filter((p) => !p.keep).length;
    const w = await persist(prepared, recipe, runId);
    out.stored = w.stored;
    out.duplicates = w.duplicates;
    out.samples = prepared
      .filter((p) => p.keep)
      .slice(0, 8)
      .map((p) => ({
        domain: String(p.row.domain),
        title: (p.row.bestSourceTitle as string) ?? null,
        value: Number(p.row.valueScore ?? 0),
      }));

    const what =
      recipe === "guest_post"
        ? "sites asking for contributions"
        : recipe === "resource_page"
          ? "resource pages"
          : "shows";

    /**
     * Three different reasons for an empty result, and they need three different
     * sentences. Collapsing them into one "nothing found, try a broader topic" is
     * how somebody spends an hour rewriting perfectly good search terms while the
     * real problem is an unpaid bill.
     */
    if (outOfCredits) {
      out.ok = false;
      out.error = "The search account is out of credits.";
      out.readout =
        "The search account has run out of credits, so this recipe cannot look anything up. Top up the Serper account, or use the two recipes that read the backlink exports on disk, which need no search account at all.";
    } else if (failures.length && out.found === 0) {
      out.ok = false;
      out.error = failures[0];
      out.readout = `Every search failed, so nothing was looked up. The first error was: ${failures[0]}`;
    } else if (out.found === 0) {
      out.readout = `Nothing came back from ${out.queriesUsed} searches. Try a broader topic, or drop the quotation marks around a name.`;
    } else {
      out.readout = `${out.found} ${what} found from ${out.queriesUsed} searches. ${out.stored} are new and queued for a contact search, ${out.duplicates} we already had, ${out.rejected} were not worth pursuing.${
        notes.length ? ` Note: ${notes.join("; ")}.` : ""
      }${failures.length ? ` ${failures.length} of the searches failed.` : ""}`;
    }

    await closeRun(runId, {
      status: out.ok ? "done" : "failed",
      found: out.found,
      stored: out.stored,
      duplicates: out.duplicates,
      rejected: out.rejected,
      queriesUsed: out.queriesUsed,
      readout: out.readout,
      error: out.error,
    });
    return out;
  } catch (e) {
    out.ok = false;
    out.error = String((e as Error)?.message ?? e).slice(0, 300);
    out.readout = `The run stopped: ${out.error}`;
    await closeRun(runId, {
      status: "failed",
      error: out.error,
      readout: out.readout,
      queriesUsed: out.queriesUsed,
    });
    return out;
  }
}

/** Sites openly asking for contributions on a topic. */
export const runGuestPost = (opts: {
  input: string;
  limit?: number;
  geo?: string;
  campaign?: string | null;
}) => runSearchRecipe("guest_post", opts);

/** Curated resource pages that could add one more entry. */
export const runResourcePages = (opts: {
  input: string;
  limit?: number;
  geo?: string;
  campaign?: string | null;
}) => runSearchRecipe("resource_page", opts);

/** Shows a named person has appeared on, so the same shows can be pitched. */
export const runPodcast = (opts: {
  input: string;
  limit?: number;
  geo?: string;
  campaign?: string | null;
}) => runSearchRecipe("podcast", opts);

/* -------------------------------------------------------------------------- *
 * One entry point
 * -------------------------------------------------------------------------- */

export async function runRecipe(
  recipe: RecipeName,
  opts: {
    input: string;
    limit?: number;
    geo?: string;
    minAuthority?: number;
    withinMonths?: number;
    campaign?: string | null;
  },
): Promise<RecipeResult> {
  switch (recipe) {
    case "skyscraper":
      return runSkyscraper(opts);
    case "product_review":
      return runProductReview(opts);
    case "guest_post":
      return runGuestPost(opts);
    case "resource_page":
      return runResourcePages(opts);
    case "podcast":
      return runPodcast(opts);
    default:
      return {
        ok: false,
        recipe,
        runId: null,
        found: 0,
        stored: 0,
        duplicates: 0,
        rejected: 0,
        queriesUsed: 0,
        readout: `There is no recipe called "${recipe}".`,
        samples: [],
        error: "unknown recipe",
      };
  }
}

/** Which rivals we actually hold export data for, for the UI to offer. */
export function availableRivals(): string[] {
  try {
    const root = `${process.cwd()}/kloudgraph-semrush-export`;
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((d) => {
        try {
          return fs.statSync(`${root}/${d}`).isDirectory();
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}

/** Recent runs, newest first, for the UI. */
export async function recentRuns(limit = 15): Promise<
  {
    id: string;
    recipe: string;
    input_text: string;
    status: string;
    found: number;
    stored: number;
    duplicates: number;
    rejected: number;
    queries_used: number;
    readout: string | null;
    error: string | null;
    created_at: string;
  }[]
> {
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const { desc } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.recipeRuns)
      .orderBy(desc(schema.recipeRuns.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      recipe: r.recipe,
      input_text: r.inputText,
      status: r.status,
      found: r.found,
      stored: r.stored,
      duplicates: r.duplicates,
      rejected: r.rejected,
      queries_used: r.queriesUsed,
      readout: r.readout ?? null,
      error: r.error ?? null,
      created_at: r.createdAt?.toISOString?.() ?? "",
    }));
  } catch {
    return [];
  }
}
