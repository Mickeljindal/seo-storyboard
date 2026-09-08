import "@tanstack/react-start/server-only";

/**
 * CONTACT FINDER — reads a prospect's own public pages to work out whether they
 * are worth writing to, who to write to, and whether they openly accept
 * contributions.
 *
 * This is the step the miner deliberately could not do. A CSV can tell you a
 * domain published a page about hosting in 2024; only fetching the site tells you
 * whether it is still live, whether it is in English, and whether there is a real
 * human behind an address. Guessing any of that at 12,000-domain scale produces
 * confident nonsense, so the miner leaves those fields null and this fills them.
 *
 * BEING A GOOD CITIZEN, because we are about to touch thousands of sites we do
 * not own:
 *   - A truthful User-Agent naming the project with a contact URL, never a
 *     spoofed browser string.
 *   - robots.txt is fetched first and honoured for every path.
 *   - At most a handful of pages per domain, with a pause between requests.
 *   - Short timeouts, and a failure is recorded rather than retried in a loop.
 *
 * ONE DELIBERATE OMISSION. Cloudflare's email-protection obfuscation is trivial
 * to reverse, and this code does not do it. The whole point of that markup is
 * that the owner does not want their address collected automatically. Decoding it
 * would be technically easy and exactly the kind of thing that earns a spam
 * complaint, so an obfuscated address is treated as no address.
 *
 * WHAT IT REFUSES TO DO. It never invents a name. If it cannot find a person, the
 * prospect keeps a role address and the pitch drafter is told there is no name, so
 * the copy stays honest rather than opening with "Hi there" pretending to know
 * somebody.
 */

const UA =
  process.env.OUTREACH_CRAWLER_UA?.trim() ||
  "KloudbeanResearchBot/1.0 (+https://www.kloudbean.com/; contact hello@kloudbean.com)";

const TIMEOUT_MS = Number(process.env.CONTACT_FETCH_TIMEOUT_MS || 9000);
const PER_REQUEST_DELAY_MS = Number(process.env.CONTACT_CRAWL_DELAY_MS || 1200);

/**
 * Fallback paths, used only when the homepage did not link anywhere useful.
 *
 * Kept short and mixed by purpose on purpose. An earlier version listed four
 * guest-post variants first, and since the crawl is capped at five pages, a site
 * whose contact page is at /contact never got asked: the budget was spent on
 * /write-for-us, /contribute, /guest-post and /write-for-us/ all returning 404.
 * Reading the homepage's own links (below) is both more accurate and cheaper, so
 * this list is now the last resort rather than the plan.
 */
const FALLBACK_PATHS = ["/contact", "/about", "/write-for-us", "/contact-us"];

/** Homepage links worth following, ranked by how likely they carry an address. */
const LINK_INTENT: { re: RegExp; score: number }[] = [
  { re: /(write[- ]for[- ]us|contribute|guest[- ]post|become[- ]a[- ](contributor|writer)|submit[- ]an?[- ](article|post)|contributor[- ]guidelines|editorial[- ]guidelines)/i, score: 5 },
  { re: /(contact[- ]?us|contact|get[- ]in[- ]touch|reach[- ]us)/i, score: 4 },
  { re: /(editorial[- ]team|our[- ]team|meet[- ]the[- ]team|about[- ]us|about|staff|authors?|masthead)/i, score: 3 },
  { re: /(advertise|sponsor|partnerships?|press|media[- ]kit)/i, score: 2 },
];

/**
 * Addresses that are useless or actively wrong to pitch.
 *
 * The separator alternative at the end matters: matching only `token@` let
 * `accounts.receivable@octopus.com` through as a perfectly good editorial contact.
 * Pitching a guest post to accounts receivable is the kind of mistake that makes a
 * whole programme look automated, which it is, but it should not look it.
 */
const BAD_MAILBOX =
  /^(noreply|no-reply|donotreply|postmaster|abuse|webmaster|hostmaster|privacy|dpo|gdpr|legal|dmca|copyright|security|billing|invoices?|accounts?|accounting|payments?|payable|receivable|ar|ap|finance|careers?|jobs?|recruit|recruiting|hr|people|unsubscribe|bounce|mailer-daemon|spam|sales|order|orders|shop|returns|support|helpdesk|tickets?|service|customercare)([._+-]|@)/i;

/**
 * Mailboxes that suggest somebody who commissions or edits content. Ranked,
 * because "editor@" is a far better target for a guest-post pitch than "info@".
 */
const MAILBOX_RANK: { re: RegExp; score: number; label: string }[] = [
  { re: /^(editor|editors|editorial|submissions?|submit|contribute|contributions?|guestpost|guest)@/i, score: 1, label: "editorial" },
  { re: /^(content|blog|news|press|pr|media|writers?)@/i, score: 0.85, label: "content" },
  { re: /^(hello|hi|hey|team|contact|enquiries|enquiry|inquiries)@/i, score: 0.6, label: "general" },
  { re: /^(info|admin|office|mail)@/i, score: 0.45, label: "generic" },
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Is this address one we should never pitch?
 *
 * Exported so the pitch drafter can check it again at draft time. That is not
 * belt-and-braces for its own sake: improving this filter does nothing for rows
 * already stored, and exactly that happened. accounts.receivable@octopus.com was
 * captured before the rule was tightened, survived the fix, and was still sitting
 * in the queue as an editorial contact afterwards. Re-checking at the point of use
 * means every future tightening protects old rows for free.
 */
export function isUnpitchableAddress(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return true;
  return BAD_MAILBOX.test(e);
}

export type ContactFinding = {
  domain: string;
  isLive: boolean;
  httpStatus: number | null;
  language: string | null;
  contactEmail: string | null;
  contactName: string | null;
  contactSource: string | null;
  contactConfidence: number;
  acceptsGuestPosts: boolean | null;
  guidelinesUrl: string | null;
  contactPageUrl: string | null;
  pagesFetched: number;
  note: string | null;
};

/* -------------------------------------------------------------------------- *
 * Fetching
 * -------------------------------------------------------------------------- */

async function fetchText(
  url: string,
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(ct) && res.ok) {
      return { ok: false, status: res.status, text: "", finalUrl: res.url || url };
    }
    // Cap the body: some of these pages are enormous and we only read the head
    // plus links.
    const raw = await res.text();
    return { ok: res.ok, status: res.status, text: raw.slice(0, 400_000), finalUrl: res.url || url };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: url };
  }
}

/**
 * A deliberately small robots.txt reader: collects Disallow rules that apply to
 * us, so we can skip a path rather than discovering later that we should not have
 * asked for it. Not a full spec implementation, and it errs towards obeying.
 */
async function robotsDisallows(origin: string): Promise<string[]> {
  const r = await fetchText(`${origin}/robots.txt`).catch(() => null);
  if (!r || !r.ok || !r.text) return [];
  const lines = r.text.split(/\r?\n/).map((l) => l.trim());
  const disallow: string[] = [];
  let applies = false;
  for (const line of lines) {
    if (/^#/.test(line) || !line) continue;
    const ua = /^user-agent:\s*(.+)$/i.exec(line);
    if (ua) {
      const val = ua[1].trim().toLowerCase();
      applies = val === "*" || val.includes("kloudbean");
      continue;
    }
    if (!applies) continue;
    const d = /^disallow:\s*(.*)$/i.exec(line);
    if (d) {
      const p = d[1].trim();
      if (p) disallow.push(p);
    }
  }
  return disallow;
}

function blockedByRobots(pathname: string, disallow: string[]): boolean {
  return disallow.some((rule) => {
    if (rule === "/") return true;
    const clean = rule.replace(/\*$/, "");
    return pathname.startsWith(clean);
  });
}

/* -------------------------------------------------------------------------- *
 * Reading the page
 * -------------------------------------------------------------------------- */

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** The html lang attribute, then a stopword check as a sanity test. */
function detectLanguage(html: string): string | null {
  const m = /<html[^>]*\blang\s*=\s*["']?([a-z]{2})/i.exec(html);
  if (m) return m[1].toLowerCase();
  const text = stripHtml(html).toLowerCase().slice(0, 4000);
  if (!text) return null;
  const hits = (text.match(/\b(the|and|for|with|you|your|that|this|from|are|our)\b/g) ?? []).length;
  return hits >= 8 ? "en" : null;
}

/**
 * Does this site openly invite contributions? Requires a real signal, not merely
 * the word "guest" appearing somewhere, so a post ABOUT guest posting does not
 * read as an invitation.
 */
function guestPostSignal(html: string, baseUrl: string): { accepts: boolean; url: string | null } {
  const linkRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const label = stripHtml(m[2]).toLowerCase();
    const hay = `${href.toLowerCase()} ${label}`;
    if (
      /(write[- ]for[- ]us|become[- ]a[- ](contributor|writer|author)|guest[- ](post|posting|article|contribution)|submit[- ]an?[- ](article|post|story|tip)|contributor[- ]guidelines|editorial[- ]guidelines|pitch[- ]us|submit[- ]a[- ]guest)/i.test(
        hay,
      )
    ) {
      try {
        return { accepts: true, url: new URL(href, baseUrl).toString() };
      } catch {
        return { accepts: true, url: null };
      }
    }
  }
  // Fall back to prose, which is weaker but real.
  const text = stripHtml(html).toLowerCase();
  if (
    /(we accept guest (posts|articles)|write for us|become a contributor|submit a guest post|accepting guest contributions|contributor guidelines)/i.test(
      text,
    )
  ) {
    return { accepts: true, url: null };
  }
  return { accepts: false, url: null };
}

/**
 * Pull the most promising internal links off the homepage.
 *
 * A site knows where its own contact page is, so asking the homepage beats
 * guessing paths: it finds /company/contact-us, /en/kontakt and /pages/contact
 * that no fixed list would ever hit, and it wastes no requests on 404s.
 */
function discoverUsefulLinks(
  html: string,
  baseUrl: string,
  domain: string,
): { url: string; score: number }[] {
  const root = domain.replace(/^www\./, "");
  const scored = new Map<string, number>();

  const linkRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;

    let abs: URL;
    try {
      abs = new URL(href, baseUrl);
    } catch {
      continue;
    }
    // Same site only. Following outbound links would be both rude and useless.
    if (!abs.hostname.replace(/^www\./, "").endsWith(root)) continue;
    if (!/^https?:$/.test(abs.protocol)) continue;
    // Skip obvious content and asset URLs.
    if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|xml|rss)$/i.test(abs.pathname)) continue;
    if (abs.pathname === "/" || abs.pathname === "") continue;

    const label = stripHtml(m[2]).toLowerCase().slice(0, 80);
    const hay = `${abs.pathname.toLowerCase()} ${label}`;
    for (const intent of LINK_INTENT) {
      if (intent.re.test(hay)) {
        const url = abs.toString().split("#")[0];
        if ((scored.get(url) ?? 0) < intent.score) scored.set(url, intent.score);
        break;
      }
    }
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([url, score]) => ({ url, score }));
}

/** Was the address deliberately obfuscated? If so we leave it alone. */
function hasObfuscatedEmail(html: string): boolean {
  return (
    /\/cdn-cgi\/l\/email-protection/i.test(html) ||
    /data-cfemail\s*=/i.test(html) ||
    /\[\s*at\s*\][\s\S]{0,20}\[\s*dot\s*\]/i.test(html) ||
    /\(\s*at\s*\)[\s\S]{0,20}\(\s*dot\s*\)/i.test(html)
  );
}

/**
 * Pick the best address on a page.
 *
 * Two rules do most of the work: an address on the site's own domain beats a free
 * mailbox, and an editorial mailbox beats a generic one. `support@` and `sales@`
 * are excluded outright, because a guest-post pitch landing in a support queue is
 * a wasted email and a mild annoyance for a stranger.
 */
function pickEmail(
  html: string,
  domain: string,
): { email: string; confidence: number; kind: string } | null {
  const found = new Set<string>();

  // mailto: links first: an explicit invitation to write to that address.
  const mailtoRe = /href\s*=\s*["']mailto:([^"'?]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html))) found.add(m[1].trim().toLowerCase());

  const inText = stripHtml(html).match(EMAIL_RE) ?? [];
  for (const e of inText) found.add(e.trim().toLowerCase());

  const root = domain.replace(/^www\./, "").split(".").slice(-2).join(".");
  let best: { email: string; confidence: number; kind: string } | null = null;

  for (const email of found) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) continue;
    if (BAD_MAILBOX.test(email)) continue;
    // Tracking and asset addresses that show up in markup.
    if (/(sentry|wixpress|example\.com|domain\.com|yourdomain|email\.com|test\.com)/i.test(email)) continue;
    if (/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(email)) continue;

    const onOwnDomain = email.endsWith(`@${root}`) || email.includes(`.${root}`);
    let confidence = onOwnDomain ? 0.6 : 0.3;
    let kind = "unknown";

    for (const r of MAILBOX_RANK) {
      if (r.re.test(email)) {
        confidence += r.score * 0.35;
        kind = r.label;
        break;
      }
    }
    // A personal-looking address on their own domain is the best outcome.
    if (onOwnDomain && kind === "unknown" && /^[a-z]+(\.[a-z]+)?@/.test(email)) {
      confidence += 0.2;
      kind = "person";
    }
    confidence = Math.min(0.95, Math.round(confidence * 100) / 100);
    if (!best || confidence > best.confidence) best = { email, confidence, kind };
  }
  return best;
}

/**
 * A name ONLY if the page states one right next to the address.
 *
 * An earlier version also guessed the first name from the mailbox, on the theory
 * that jane@ means Jane. It turned friends@themeisle.com into "Friends", which
 * would have opened an email with "Hi Friends,". Guessing a stranger's name wrong
 * is worse than not using one, and inventing personalisation is exactly what the
 * outreach engine is built not to do, so the guess is gone.
 */
function pickName(html: string, email: string | null): string | null {
  if (!email) return null;
  const text = stripHtml(html);
  // "Jane Doe (jane@example.com)" or "Jane Doe - jane@example.com"
  const near = new RegExp(
    `([A-Z][a-z]+ [A-Z][a-z]+)[^.]{0,40}${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  ).exec(text);
  return near ? near[1] : null;
}

/* -------------------------------------------------------------------------- *
 * The crawl
 * -------------------------------------------------------------------------- */

/** Look at one domain. Fetches a few pages at most and never retries in a loop. */
export async function findContactForDomain(domain: string): Promise<ContactFinding> {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const origin = `https://${clean}`;
  const finding: ContactFinding = {
    domain: clean,
    isLive: false,
    httpStatus: null,
    language: null,
    contactEmail: null,
    contactName: null,
    contactSource: null,
    contactConfidence: 0,
    acceptsGuestPosts: null,
    guidelinesUrl: null,
    contactPageUrl: null,
    pagesFetched: 0,
    note: null,
  };

  const home = await fetchText(`${origin}/`);
  finding.pagesFetched++;
  finding.httpStatus = home.status;

  if (!home.ok || !home.text) {
    // 403 from a bot-protection layer is extremely common here and is not the
    // same thing as a dead site, so say which it was.
    finding.note =
      home.status === 403 || home.status === 429
        ? `blocked by bot protection (HTTP ${home.status})`
        : home.status === 0
          ? "no response (timeout, DNS, or TLS failure)"
          : `homepage returned HTTP ${home.status}`;
    finding.isLive = home.status >= 200 && home.status < 500 && home.status !== 0;
    return finding;
  }

  finding.isLive = true;
  finding.language = detectLanguage(home.text);

  const disallow = await robotsDisallows(origin);
  await new Promise((r) => setTimeout(r, PER_REQUEST_DELAY_MS));

  // The homepage often carries everything we need.
  let guest = guestPostSignal(home.text, home.finalUrl);
  let best = pickEmail(home.text, clean);
  let bestFrom = best ? "homepage" : null;
  let obfuscated = hasObfuscatedEmail(home.text);

  /**
   * Plan the visits, splitting the budget between the two questions.
   *
   * There are two separate things to learn: an address, and whether they accept
   * contributions. A single ranked list answers whichever question its top links
   * happen to serve and drops the other. That regressed wpshout.com, where link
   * discovery filled the budget with contact and about pages and the
   * /write-for-us page that had previously been found never got fetched. So each
   * question gets guaranteed slots.
   */
  const discovered = discoverUsefulLinks(home.text, home.finalUrl, clean);
  const contributeLinks = discovered.filter((d) => d.score === 5).map((d) => d.url);
  const contactLinks = discovered.filter((d) => d.score < 5).map((d) => d.url);

  const toVisit: string[] = [];
  const push = (u: string | null | undefined) => {
    if (!u) return;
    if (toVisit.length >= 5 || toVisit.includes(u)) return;
    try {
      if (blockedByRobots(new URL(u).pathname, disallow)) return;
    } catch {
      return;
    }
    toVisit.push(u);
  };

  // One slot reserved for the contributions question, one for the address.
  push(guest.url);
  push(contributeLinks[0]);
  push(contactLinks[0]);
  push(contributeLinks[1]);
  push(contactLinks[1]);
  // Only guess when the site told us nothing.
  if (!contributeLinks.length && !guest.url) push(`${origin}/write-for-us`);
  if (!contactLinks.length) for (const p of FALLBACK_PATHS) push(`${origin}${p}`);

  for (const url of toVisit) {
    // Stop early once we have a strong editorial address and know the answer on
    // contributions. No reason to keep taking someone's bandwidth.
    if (best && best.confidence >= 0.85 && guest.accepts) break;
    if (finding.pagesFetched >= 6) break;

    let pathname = "/";
    try {
      pathname = new URL(url).pathname;
    } catch {
      continue;
    }
    if (blockedByRobots(pathname, disallow)) continue;

    const page = await fetchText(url);
    finding.pagesFetched++;
    await new Promise((r) => setTimeout(r, PER_REQUEST_DELAY_MS));
    if (!page.ok || !page.text) continue;

    if (hasObfuscatedEmail(page.text)) obfuscated = true;

    if (!guest.accepts) {
      const g = guestPostSignal(page.text, page.finalUrl);
      if (g.accepts) guest = { accepts: true, url: g.url ?? url };
    }
    if (/write-for-us|contribute|guest-post|guidelines/i.test(pathname) && !finding.guidelinesUrl) {
      finding.guidelinesUrl = page.finalUrl;
    }
    if (/contact/i.test(pathname) && !finding.contactPageUrl) {
      finding.contactPageUrl = page.finalUrl;
    }

    const candidate = pickEmail(page.text, clean);
    if (candidate && (!best || candidate.confidence > best.confidence)) {
      best = candidate;
      bestFrom = /write-for-us|contribute|guest-post|guidelines/i.test(pathname)
        ? "guidelines"
        : /contact/i.test(pathname)
          ? "contact-page"
          : "about-page";
    }
  }

  finding.acceptsGuestPosts = guest.accepts;
  if (guest.url && !finding.guidelinesUrl) finding.guidelinesUrl = guest.url;

  if (best) {
    finding.contactEmail = best.email;
    finding.contactConfidence = best.confidence;
    finding.contactSource = bestFrom ?? "page";
    finding.contactName = pickName(home.text, best.email);
  } else if (obfuscated) {
    // Their choice, and we respect it. Recorded so nobody keeps re-crawling.
    finding.note = "address is deliberately obfuscated; left alone on purpose";
  } else {
    finding.note = finding.note ?? "no public address found";
  }

  return finding;
}

/* -------------------------------------------------------------------------- *
 * Batch
 * -------------------------------------------------------------------------- */

export type ContactCrawlResult = {
  attempted: number;
  withContact: number;
  acceptsGuestPosts: number;
  dead: number;
  blocked: number;
  nonEnglish: number;
  obfuscated: number;
  errors: string[];
};

/**
 * Work through the domains that need a contact, best-scoring first.
 *
 * Capped per run because this is thousands of requests to other people's servers.
 * Highest value first means a small daily budget still lands on the targets worth
 * having.
 */
export async function crawlContacts(
  opts: { limit?: number; minValue?: number } = {},
): Promise<ContactCrawlResult> {
  const repo = await import("@/server/db/repos/link-prospects");
  const { linkValueScore, topicalRelevance } = await import("./link-classifier");

  const limit = opts.limit ?? Number(process.env.CONTACT_CRAWL_PER_RUN || 25);
  const candidates = await repo.listLinkProspects({
    status: "needs_contact",
    minValue: opts.minValue ?? 20,
    needsContact: true,
    limit,
  });

  const out: ContactCrawlResult = {
    attempted: 0,
    withContact: 0,
    acceptsGuestPosts: 0,
    dead: 0,
    blocked: 0,
    nonEnglish: 0,
    obfuscated: 0,
    errors: [],
  };

  for (const p of candidates) {
    out.attempted++;
    try {
      const f = await findContactForDomain(p.domain);

      // Re-score now that we know whether there is a human and whether they take
      // contributions. Both were unknown at mining time.
      const value = linkValueScore({
        authority: p.authority,
        refdomainBacklinks: p.refdomain_backlinks,
        domain: p.domain,
        domainClass: p.domain_class as never,
        opportunityType: (f.acceptsGuestPosts ? "guest_post" : p.opportunity_type) as never,
        rivalCount: p.rival_count,
        linkCount: p.link_count,
        hasContact: !!f.contactEmail,
        acceptsGuestPosts: f.acceptsGuestPosts,
        // Recomputed from the stored evidence so the re-score keeps the topical
        // check rather than silently dropping it back to the neutral default.
        relevance: topicalRelevance(p.best_source_title, p.best_source_url, p.best_anchor),
      });

      let status = "needs_contact";
      let reject: string | null = null;

      if (!f.isLive) {
        status = "rejected";
        reject = f.note ?? "site not reachable";
        out.dead++;
      } else if (/bot protection/.test(f.note ?? "")) {
        // Not a rejection: the site is real, we simply cannot read it. Left for a
        // human to check rather than thrown away.
        out.blocked++;
      } else if (f.language && f.language !== "en") {
        status = "rejected";
        reject = `site is in "${f.language}", outside our language`;
        out.nonEnglish++;
      } else if (f.contactEmail) {
        status = "ready";
        out.withContact++;
      }

      if (/obfuscated/.test(f.note ?? "")) out.obfuscated++;
      if (f.acceptsGuestPosts) out.acceptsGuestPosts++;

      await repo.saveVetting(p.id, {
        isLive: f.isLive,
        language: f.language,
        acceptsGuestPosts: f.acceptsGuestPosts,
        guidelinesUrl: f.guidelinesUrl,
        contactPageUrl: f.contactPageUrl,
        contactEmail: f.contactEmail,
        contactName: f.contactName,
        contactSource: f.contactSource,
        contactConfidence: f.contactConfidence,
        // A guest-post invitation genuinely changes what we are looking at.
        opportunityType: f.acceptsGuestPosts ? "guest_post" : undefined,
        valueScore: value,
        status,
        rejectReason: reject,
        notes: f.note,
      });
    } catch (e) {
      out.errors.push(`${p.domain}: ${String((e as Error)?.message ?? e).slice(0, 120)}`);
    }
  }

  return out;
}
