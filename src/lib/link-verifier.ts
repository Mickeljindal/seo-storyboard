import "@tanstack/react-start/server-only";

/**
 * LINK VERIFIER — did we actually get the link?
 *
 * WHY THIS IS THE MOST IMPORTANT FILE IN THE OUTREACH LAYER. Everything before it
 * measures effort: domains found, pitches written, emails sent. None of that is the
 * point. The point is a link on somebody else's page, and until something checks
 * for one, the whole system reports activity and calls it results. This is the
 * difference between an emailing tool and a link-building system.
 *
 * IT ALSO CATCHES THE THING NOBODY WATCHES FOR. A link that appears and then
 * disappears three weeks later is worth nothing, and it is common: posts get
 * rewritten, listicles get pruned, editors change. So this re-checks over time and
 * records a history rather than a single verdict. `link_lost_at` exists because
 * losing a link is a real event that should be visible, not a silent reversion.
 *
 * WHAT IT REFUSES TO CLAIM. Finding an <a href> to our domain is evidence, not
 * proof of a win: the page might link to us from a comment, or with rel="nofollow",
 * or as a passing mention rather than the placement we asked for. So it records the
 * exact href, the anchor text and the rel attributes as published, and lets a
 * person judge. It never rewrites a nofollow as a success.
 *
 * Politeness matches contact-finder.ts: truthful user agent, robots.txt honoured,
 * a pause between requests, short timeouts, and a small cap per run. We are reading
 * one page per prospect and we are reading it repeatedly over months, so being a
 * good guest matters more here than anywhere else.
 */

const UA =
  process.env.OUTREACH_CRAWLER_UA?.trim() ||
  "KloudbeanResearchBot/1.0 (+https://www.kloudbean.com/; contact hello@kloudbean.com)";

const TIMEOUT_MS = Number(process.env.LINK_CHECK_TIMEOUT_MS || 12000);
const DELAY_MS = Number(process.env.LINK_CHECK_DELAY_MS || 1500);

/** Our own domains. A link to any of these counts. */
export function ourDomains(): string[] {
  const extra = (process.env.LINK_CHECK_OUR_DOMAINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(["kloudbean.com", ...extra])];
}

export type LinkFinding = {
  checkedUrl: string;
  httpStatus: number | null;
  found: boolean;
  foundUrl: string | null;
  anchorText: string | null;
  relAttributes: string | null;
  isFollowed: boolean | null;
  linkCount: number;
  notes: string | null;
};

/* -------------------------------------------------------------------------- *
 * Reading one page
 * -------------------------------------------------------------------------- */

async function fetchPage(
  url: string,
): Promise<{ ok: boolean; status: number; html: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && !/text\/html|application\/xhtml/i.test(ct)) {
      return { ok: false, status: res.status, html: "", finalUrl: res.url || url };
    }
    const html = await res.text();
    return { ok: res.ok, status: res.status, html: html.slice(0, 1_500_000), finalUrl: res.url || url };
  } catch {
    return { ok: false, status: 0, html: "", finalUrl: url };
  }
}

/**
 * Turn anchor markup into the text a reader actually sees.
 *
 * Inline tags are removed with NO separator and block tags with a space. Replacing
 * every tag with a space, which is the obvious approach, turns
 * `<strong>Klou</strong>dbean` into "Klou dbean". Anchor text is full of inline
 * markup, and the anchor is stored and shown to a person deciding whether a
 * placement is what was agreed, so a spurious space is wrong data rather than a
 * cosmetic issue.
 */
const BLOCKISH = /<\s*\/?\s*(br|div|p|li|ul|ol|tr|td|th|h[1-6]|section|article|blockquote)\b[^>]*>/gi;

const stripTags = (s: string) =>
  s
    .replace(BLOCKISH, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/**
 * Find links to us in a page's HTML.
 *
 * Deliberately parses the anchor tags rather than searching for our domain as a
 * string. A plain string search matches our name in the visible text, in a
 * canonical tag, in JSON-LD, or in an unrelated script, and every one of those
 * would report a link that does not exist. Only an <a href> is a link.
 */
export function findOurLinks(
  html: string,
  domains: string[],
): { href: string; anchor: string; rel: string | null }[] {
  const out: { href: string; anchor: string; rel: string | null }[] = [];
  if (!html) return out;

  const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = anchorRe.exec(html))) {
    const attrs = m[1] ?? "";
    const hrefMatch = /\bhref\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].trim();

    let host: string;
    try {
      // Protocol-relative and absolute only: a relative href cannot point at us.
      const abs = href.startsWith("//") ? `https:${href}` : href;
      if (!/^https?:\/\//i.test(abs)) continue;
      host = new URL(abs).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      continue;
    }
    if (!domains.some((d) => host === d || host.endsWith(`.${d}`))) continue;

    const relMatch = /\brel\s*=\s*["']([^"']*)["']/i.exec(attrs);
    out.push({
      href,
      anchor: stripTags(m[2] ?? "").slice(0, 200),
      rel: relMatch ? relMatch[1].trim().toLowerCase() : null,
    });
  }
  return out;
}

/** Does this rel value mean the link passes no credit? */
export function isFollowedRel(rel: string | null): boolean {
  if (!rel) return true;
  return !/\b(nofollow|sponsored|ugc)\b/i.test(rel);
}

/** Check one page for a link to us. */
export async function checkPageForOurLink(url: string): Promise<LinkFinding> {
  const domains = ourDomains();
  const finding: LinkFinding = {
    checkedUrl: url,
    httpStatus: null,
    found: false,
    foundUrl: null,
    anchorText: null,
    relAttributes: null,
    isFollowed: null,
    linkCount: 0,
    notes: null,
  };

  const page = await fetchPage(url);
  finding.httpStatus = page.status;

  if (!page.ok || !page.html) {
    finding.notes =
      page.status === 404
        ? "the page is gone (404), so any link on it is gone too"
        : page.status === 403 || page.status === 429
          ? `blocked by bot protection (HTTP ${page.status}), so this needs a human to look`
          : page.status === 0
            ? "no response (timeout, DNS, or TLS failure)"
            : `page returned HTTP ${page.status}`;
    return finding;
  }

  const links = findOurLinks(page.html, domains);
  finding.linkCount = links.length;

  if (!links.length) {
    finding.notes = "page loaded fine, no link to us on it";
    return finding;
  }

  // Prefer a followed link when the page has several: that is the one that counts.
  const followed = links.find((l) => isFollowedRel(l.rel));
  const chosen = followed ?? links[0];

  finding.found = true;
  finding.foundUrl = chosen.href;
  finding.anchorText = chosen.anchor || null;
  finding.relAttributes = chosen.rel;
  finding.isFollowed = isFollowedRel(chosen.rel);
  if (!finding.isFollowed) {
    finding.notes = `link found but marked ${chosen.rel}, so it passes no credit`;
  } else if (links.length > 1) {
    finding.notes = `${links.length} links to us on this page`;
  }
  return finding;
}

/* -------------------------------------------------------------------------- *
 * Which page to check
 * -------------------------------------------------------------------------- */

/**
 * The page most likely to carry the link.
 *
 * The page we pitched is the obvious candidate and usually right: for a listicle we
 * asked to be added to that specific list. The homepage is a poor fallback and is
 * used only when there is nothing better, since a homepage link is rarely what was
 * agreed.
 */
export function pagesToCheck(p: {
  best_source_url?: string | null;
  homepage_url?: string | null;
  domain: string;
}): string[] {
  const urls: string[] = [];
  if (p.best_source_url) urls.push(p.best_source_url);
  const home = p.homepage_url ?? `https://${p.domain}/`;
  if (!urls.includes(home)) urls.push(home);
  return urls.slice(0, 2);
}

/* -------------------------------------------------------------------------- *
 * Batch
 * -------------------------------------------------------------------------- */

export type VerifyResult = {
  checked: number;
  found: number;
  stillMissing: number;
  newlyFound: number;
  lost: number;
  nofollow: number;
  blocked: number;
  errors: string[];
};

/**
 * Verify a batch of prospects.
 *
 * WHO GETS CHECKED, and the ordering matters. A prospect who replied positively is
 * checked first and often, because that is where a link is most likely and where a
 * win is most worth knowing about quickly. Prospects with a confirmed link are
 * re-checked on a slower schedule to catch removal. Prospects we merely emailed are
 * checked occasionally, because plenty of publishers add a link without ever
 * replying, and never checking them would undercount wins.
 */
export async function verifyLinks(
  opts: { limit?: number; onlyId?: string } = {},
): Promise<VerifyResult> {
  const repo = await import("@/server/db/repos/link-prospects");
  const checks = await import("@/server/db/repos/link-checks");

  const out: VerifyResult = {
    checked: 0,
    found: 0,
    stillMissing: 0,
    newlyFound: 0,
    lost: 0,
    nofollow: 0,
    blocked: 0,
    errors: [],
  };

  const limit = opts.limit ?? Number(process.env.LINK_CHECK_PER_RUN || 20);
  const candidates = opts.onlyId
    ? [await repo.getLinkProspectById(opts.onlyId)].filter(Boolean)
    : await checks.listDueForVerification(limit);

  for (const p of candidates) {
    if (!p) continue;
    out.checked++;

    try {
      let finding: LinkFinding | null = null;
      for (const url of pagesToCheck(p)) {
        const f = await checkPageForOurLink(url);
        await new Promise((r) => setTimeout(r, DELAY_MS));
        // Keep the first page where we actually find something; otherwise keep the
        // first result so the failure reason is recorded rather than lost.
        if (!finding) finding = f;
        if (f.found) {
          finding = f;
          break;
        }
      }
      if (!finding) continue;

      await checks.insertCheck({ linkProspectId: p.id, ...finding });

      const wasFound = p.link_found === true;
      if (finding.found) {
        out.found++;
        if (!finding.isFollowed) out.nofollow++;
        if (!wasFound) out.newlyFound++;
        await checks.applyFoundState(p.id, {
          found: true,
          isFollowed: finding.isFollowed,
          anchor: finding.anchorText,
          foundUrl: finding.foundUrl,
          // A nofollow link is a real outcome but not the win we asked for, so the
          // prospect is only moved to 'won' when the link actually passes credit.
          markWon: !!finding.isFollowed,
        });
      } else {
        out.stillMissing++;
        if (/bot protection/.test(finding.notes ?? "")) out.blocked++;
        if (wasFound) {
          // It was there and now it is not. A real event worth surfacing.
          out.lost++;
          await checks.applyLostState(p.id, finding.notes ?? "link no longer on the page");
        } else {
          await checks.applyFoundState(p.id, { found: false });
        }
      }
    } catch (e) {
      out.errors.push(`${p.domain}: ${String((e as Error)?.message ?? e).slice(0, 120)}`);
    }
  }

  return out;
}
