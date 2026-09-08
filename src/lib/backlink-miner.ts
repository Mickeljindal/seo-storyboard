import "@tanstack/react-start/server-only";
import path from "node:path";
import fs from "node:fs";
import {
  classifyDomain,
  classifyOpportunity,
  linkValueScore,
  normaliseDomain,
  spamScore,
  topicalRelevance,
  type DomainClass,
  type OpportunityType,
} from "./link-classifier";

/**
 * BACKLINK MINER — turns the competitor exports in kloudgraph-semrush-export/
 * into a worked list of link opportunities.
 *
 * The input is 94,009 link rows and around 178,000 referring-domain rows across
 * six competitors. The output is a few thousand domains that publish about this
 * category, each with the specific page that already mentions a rival, what kind
 * of ask that page supports, and a priority score.
 *
 * THE ONE IDEA WORTH KEEPING. A page that already lists eight hosting options is
 * the best link target in existence, because asking to be considered for a ninth
 * slot helps the publisher's reader rather than costing them something. That is
 * why opportunity type is weighted so heavily, and why 5,417 listicle domains
 * matter far more than 23,200 ordinary mentions.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not decide anything it cannot know
 * from a CSV. Whether a site is live, in English, or open to contributions needs
 * the actual page, so those stay null here and are filled in by the contact
 * crawler. A miner that guessed at them would produce confident nonsense at
 * 81,000-row scale.
 *
 * Aggregation is by domain, not by link, because the unit of outreach is one
 * email to one publication however many times they have mentioned a rival.
 */

export type MinedDomain = {
  domain: string;
  authority: number;
  refdomainBacklinks: number;
  country: string | null;
  ipAddress: string | null;
  linksTo: Set<string>;
  linkCount: number;
  hasLostLink: boolean;
  bestSourceUrl: string | null;
  bestSourceTitle: string | null;
  bestAnchor: string | null;
  bestTargetUrl: string | null;
  bestTypeRank: number;
  bestRelevance: number;
  opportunityType: OpportunityType;
  firstSeen: string | null;
  lastSeen: string | null;
};

/**
 * Higher wins when a domain has several linking pages of different kinds.
 *
 * The three v27 recipe types appear here for completeness of the Record, not
 * because this miner assigns them: `classifyOpportunity` cannot produce them from
 * a CSV row alone, since they depend on what a recipe was asked to look for. They
 * are ranked so that if a recipe-sourced row is ever re-mined, its type does not
 * lose to a weaker page found in the export.
 */
const TYPE_RANK: Record<OpportunityType, number> = {
  listicle: 7,
  skyscraper: 7,
  product_review: 7,
  guest_post: 6,
  resource_page: 5,
  broken_link: 4,
  podcast: 4,
  directory_listing: 3,
  editorial_mention: 2,
  homepage_reference: 1,
  none: 0,
};

export function exportRoot(): string {
  return path.join(process.cwd(), "kloudgraph-semrush-export");
}

/**
 * Competitor folders that actually contain data. Several exports are one-line
 * empty files, so the folder list alone overstates coverage.
 */
export function usableCompetitors(): { competitor: string; backlinks: string; refdomains: string }[] {
  const root = exportRoot();
  if (!fs.existsSync(root)) return [];
  const out: { competitor: string; backlinks: string; refdomains: string }[] = [];

  for (const dir of fs.readdirSync(root)) {
    const full = path.join(root, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    const files = fs.readdirSync(full);
    const bl = files.find((f) => /-backlinks\.csv$/i.test(f) && !/^kloudbean/i.test(f));
    const rd = files.find((f) => /-backlinks_refdomains\.csv$/i.test(f) && !/^kloudbean/i.test(f));
    if (!bl) continue;
    const blPath = path.join(full, bl);
    // A header-only export is 1 line; treat anything tiny as absent.
    if (fs.statSync(blPath).size < 500) continue;
    out.push({
      competitor: dir,
      backlinks: blPath,
      refdomains: rd ? path.join(full, rd) : "",
    });
  }
  return out;
}

/**
 * Read every export and aggregate by domain.
 *
 * Streams rather than parsing whole files, because the refdomain exports are
 * 30,000 rows each and there are six of them.
 */
export async function aggregateExports(opts: { minAuthority?: number } = {}): Promise<{
  domains: Map<string, MinedDomain>;
  stats: { competitors: string[]; linkRows: number; refdomainRows: number };
}> {
  const { forEachCsvRow } = await import("./csv");
  const sources = usableCompetitors();
  const domains = new Map<string, MinedDomain>();
  const stats = { competitors: [] as string[], linkRows: 0, refdomainRows: 0 };

  // Pass 1: referring domains give authority, country and their total backlink
  // count. Authority is the cheapest way to drop the junk floor before doing any
  // per-link work, and at authority 2 that floor is over 15,000 domains.
  const authority = new Map<string, { a: number; bl: number; country: string | null; ip: string | null }>();
  for (const src of sources) {
    if (!src.refdomains || !fs.existsSync(src.refdomains)) continue;
    stats.refdomainRows += await forEachCsvRow(src.refdomains, (row) => {
      const d = normaliseDomain(row.domain ?? "");
      if (!d) return;
      const a = Number(row.domain_ascore ?? 0) || 0;
      const bl = Number(row.backlinks ?? 0) || 0;
      const prev = authority.get(d);
      // Keep the highest authority seen: the same domain appears in several
      // exports and the figures differ slightly between them.
      if (!prev || a > prev.a) {
        authority.set(d, {
          a,
          bl: Math.max(bl, prev?.bl ?? 0),
          country: (row.country ?? "").trim() || prev?.country || null,
          ip: (row.ip_address ?? "").trim() || prev?.ip || null,
        });
      } else if (bl > prev.bl) {
        prev.bl = bl;
      }
    });
  }

  const minAuthority = opts.minAuthority ?? 12;

  // Pass 2: the individual links give the page, the anchor and the opportunity.
  for (const src of sources) {
    stats.competitors.push(src.competitor);
    stats.linkRows += await forEachCsvRow(src.backlinks, (row) => {
      const sourceUrl = row.source_url ?? "";
      const d = normaliseDomain(sourceUrl);
      if (!d || !d.includes(".")) return;

      const auth = authority.get(d);
      const a = auth?.a ?? Number(row.page_ascore ?? 0) ?? 0;
      // Drop the junk floor here rather than carrying 81,000 rows into the DB.
      if (a < minAuthority) return;

      const { domainClass } = classifyDomain(d);
      const lost = (row.lost_link ?? "").toLowerCase() === "true";
      const { opportunityType } = classifyOpportunity(sourceUrl, row.source_title, {
        domainClass,
        hasLostLink: lost,
      });

      let entry = domains.get(d);
      if (!entry) {
        entry = {
          domain: d,
          authority: a,
          refdomainBacklinks: auth?.bl ?? 0,
          country: auth?.country ?? null,
          ipAddress: auth?.ip ?? null,
          linksTo: new Set<string>(),
          linkCount: 0,
          hasLostLink: false,
          bestSourceUrl: null,
          bestSourceTitle: null,
          bestAnchor: null,
          bestTargetUrl: null,
          bestTypeRank: -1,
          bestRelevance: 0,
          opportunityType: "none",
          firstSeen: null,
          lastSeen: null,
        };
        domains.set(d, entry);
      }

      entry.linkCount++;
      entry.linksTo.add(src.competitor);
      if (lost) entry.hasLostLink = true;

      const first = (row.first_seen ?? "").trim();
      const last = (row.last_seen ?? "").trim();
      if (first && (!entry.firstSeen || first < entry.firstSeen)) entry.firstSeen = first;
      if (last && (!entry.lastSeen || last > entry.lastSeen)) entry.lastSeen = last;

      /**
       * Keep the single best page from this domain, because that page becomes the
       * evidence in the pitch.
       *
       * Ranked on type AND topical relevance together. Type alone picked "The 13
       * Best Yahoo Pipes Alternatives" on makeuseof.com over anything about
       * hosting: a real listicle, entirely the wrong subject. A domain that has
       * both an off-topic listicle and an on-topic blog post should be pitched on
       * the post.
       */
      const title = (row.source_title ?? "").trim() || null;
      const anchor = (row.anchor ?? "").trim() || null;
      const rel = topicalRelevance(title, sourceUrl, anchor);
      const rank = (TYPE_RANK[opportunityType] ?? 0) * (0.35 + rel);

      if (rank > entry.bestTypeRank) {
        entry.bestTypeRank = rank;
        entry.opportunityType = opportunityType;
        entry.bestSourceUrl = sourceUrl || null;
        entry.bestSourceTitle = title;
        entry.bestAnchor = anchor;
        entry.bestTargetUrl = (row.target_url ?? "").trim() || null;
        entry.bestRelevance = rel;
      }
    });
  }

  return { domains, stats };
}

export type MineResult = {
  linkRows: number;
  refdomainRows: number;
  competitors: string[];
  domainsSeen: number;
  stored: number;
  rejected: number;
  byType: Record<string, number>;
  byClass: Record<string, number>;
  rejectReasons: Record<string, number>;
  topDomains: { domain: string; authority: number; value: number; type: string; rivals: number }[];
};

/**
 * Mine the exports and store what is worth pursuing.
 *
 * Rejected rows are stored too, with the reason, rather than silently dropped.
 * That is deliberate: without it, nobody can answer "why isn't theregister.com in
 * the list", and a filter bug looks identical to an empty dataset. The rejects
 * also stop a later run from re-evaluating the same 60,000 domains from scratch.
 */
export async function mineBacklinks(
  opts: { minAuthority?: number; minValue?: number; storeRejects?: boolean } = {},
): Promise<MineResult> {
  const repo = await import("@/server/db/repos/link-prospects");
  const minValue = opts.minValue ?? 8;
  const storeRejects = opts.storeRejects !== false;

  const { domains, stats } = await aggregateExports({ minAuthority: opts.minAuthority });

  const result: MineResult = {
    linkRows: stats.linkRows,
    refdomainRows: stats.refdomainRows,
    competitors: stats.competitors,
    domainsSeen: domains.size,
    stored: 0,
    rejected: 0,
    byType: {},
    byClass: {},
    rejectReasons: {},
    topDomains: [],
  };

  const keep: Parameters<typeof repo.insertLinkProspectsIgnoringDuplicates>[0] = [];
  const scored: { domain: string; authority: number; value: number; type: string; rivals: number }[] = [];

  for (const entry of domains.values()) {
    const { domainClass, rejectReason: classReject } = classifyDomain(entry.domain);
    const { opportunityType } = entry.opportunityType === "none"
      ? { opportunityType: "none" as OpportunityType }
      : { opportunityType: entry.opportunityType };

    // Re-derive the opportunity reject reason from the best page we kept.
    const oppCheck = entry.bestSourceUrl
      ? classifyOpportunity(entry.bestSourceUrl, entry.bestSourceTitle, {
          domainClass,
          hasLostLink: entry.hasLostLink,
        })
      : { opportunityType: "none" as OpportunityType, rejectReason: "no source page recorded" };

    const reject = classReject ?? oppCheck.rejectReason;
    const rivalCount = entry.linksTo.size;

    const value = linkValueScore({
      authority: entry.authority,
      refdomainBacklinks: entry.refdomainBacklinks,
      domain: entry.domain,
      domainClass: domainClass as DomainClass,
      opportunityType: oppCheck.opportunityType,
      rivalCount,
      linkCount: entry.linkCount,
      relevance: entry.bestRelevance,
    });

    const spam = spamScore({
      domain: entry.domain,
      authority: entry.authority,
      refdomainBacklinks: entry.refdomainBacklinks,
    });

    // A page with no connection to hosting at all is not an opportunity, however
    // strong the domain. Pitching it would visibly be a mail-merge that never read
    // the page.
    const offTopic = entry.bestRelevance === 0 && !!entry.bestSourceTitle;

    const isReject = !!reject || offTopic || value < minValue;
    const finalReject =
      reject ??
      (offTopic ? "linking page is not about hosting or deployment" : null) ??
      (value < minValue ? `value ${value} below cutoff ${minValue}` : null);

    result.byClass[domainClass] = (result.byClass[domainClass] ?? 0) + 1;
    if (isReject) {
      result.rejected++;
      const key = (finalReject ?? "unknown").replace(/\d+/g, "N").slice(0, 60);
      result.rejectReasons[key] = (result.rejectReasons[key] ?? 0) + 1;
      if (!storeRejects) continue;
    } else {
      result.byType[oppCheck.opportunityType] = (result.byType[oppCheck.opportunityType] ?? 0) + 1;
      scored.push({
        domain: entry.domain,
        authority: entry.authority,
        value,
        type: oppCheck.opportunityType,
        rivals: rivalCount,
      });
    }

    keep.push({
      domain: entry.domain,
      homepageUrl: `https://${entry.domain}/`,
      authority: entry.authority,
      refdomainBacklinks: entry.refdomainBacklinks,
      country: entry.country,
      ipAddress: entry.ipAddress,
      linksTo: [...entry.linksTo].sort(),
      rivalCount,
      linkCount: entry.linkCount,
      bestSourceUrl: entry.bestSourceUrl,
      bestSourceTitle: entry.bestSourceTitle,
      bestAnchor: entry.bestAnchor,
      bestTargetUrl: entry.bestTargetUrl,
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen,
      hasLostLink: entry.hasLostLink,
      domainClass,
      opportunityType: isReject ? "none" : oppCheck.opportunityType,
      rejectReason: finalReject,
      valueScore: isReject ? 0 : value,
      spamScore: spam,
      // 'needs_contact' is the honest next step: worth pursuing, but not
      // actionable until somebody can be written to.
      status: isReject ? "rejected" : "needs_contact",
    });
  }

  result.stored = await repo.insertLinkProspectsIgnoringDuplicates(keep);
  scored.sort((a, b) => b.value - a.value);
  result.topDomains = scored.slice(0, 25);
  return result;
}
