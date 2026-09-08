/**
 * LINK CLASSIFIER — decides what a linking domain actually is, what kind of
 * opportunity it represents, and whether it is worth an email at all.
 *
 * Pure functions, no I/O, so the judgement is testable and reviewable in one
 * place instead of being smeared through the miner.
 *
 * EVERY RULE BELOW CAME OUT OF THE REAL EXPORT, not from general link-building
 * advice. The measurements, over 94,009 link rows and 81,083 unique linking
 * domains across the six usable competitor exports:
 *
 *   1. AUTHORITY IS INVERSELY CORRELATED WITH OUTREACHABILITY. The domains
 *      linking to the most rivals are google.com, yahoo.com, telegram.me,
 *      medium.com, pinterest.com, packagist.org, producthunt.com and substack.com.
 *      At authority 70-75 it is cisco.com, docker.com, zapier.com, okta.com,
 *      redhat.com and academic journals. You cannot pitch any of them. The real
 *      editorial targets sit around 28-56: theregister.com, sitepoint.com,
 *      logrocket.com, tutsplus.com, stackoverflow.blog, keycdn.com, webfx.com.
 *      So authority is scored as a BAND, not "more is better". A naive sort by
 *      authority produces a worthless list that looks impressive.
 *
 *   2. 6,398 DOMAINS LINK FROM A PRIVACY OR LEGAL PAGE. "This site is hosted by
 *      Netlify" in a GDPR disclosure, /datenschutz, /mentions-legales,
 *      /impressum. Worth exactly nothing and rejected outright.
 *
 *   3. NOFOLLOW, SPONSORED AND UGC ARE ALL ZERO in the export, across all 94,009
 *      rows. So link quality cannot be judged from them and this file does not
 *      pretend otherwise.
 *
 * The honest boundary on what this can know: a URL and an authority number
 * cannot tell you whether a site is genuinely good, only whether it is plausibly
 * worth a human's attention. Anything needing the actual page (is it live, is it
 * in English, does it accept contributions) is left to the contact crawler, which
 * fetches and reads.
 */

export type DomainClass =
  | "editorial"
  | "directory"
  | "platform"
  | "corporate"
  | "academic"
  | "press_release"
  | "search_engine"
  | "registry"
  | "stats_farm"
  | "competitor"
  | "parked"
  | "unknown";

export type OpportunityType =
  | "listicle"
  | "resource_page"
  | "editorial_mention"
  | "guest_post"
  | "broken_link"
  | "directory_listing"
  /** A link from the bare homepage: a badge or footer credit, not an editorial call. */
  | "homepage_reference"
  /* ---- v27: types that only a prospecting recipe can produce ------------- */
  /**
   * They link to a specific competitor article, and we have a page covering the
   * part that article leaves out. Distinct from editorial_mention because we know
   * the exact URL they chose to cite, which is a much stronger opening than
   * "you write about hosting".
   */
  | "skyscraper"
  /**
   * They published a review of a competitor product recently. The ask is to look
   * at ours, not to insert a link, so it needs its own wording.
   */
  | "product_review"
  /**
   * A podcast. Not a link opportunity at all: the ask is to appear as a guest, and
   * treating it as a link request is how a good show decides you never listened.
   */
  | "podcast"
  | "none";

/* -------------------------------------------------------------------------- *
 * Domain classes
 * -------------------------------------------------------------------------- */

/**
 * Hosting and platform vendors. Never email a rival to ask for a link, and never
 * let one into the prospect list because their own docs mention a competitor.
 * Includes the export folder names plus the wider set of hosting brands that
 * turn up in this data.
 */
const COMPETITOR = new RegExp(
  "(^|\\.)(" +
    [
      "cloudways", "digitalocean", "fly\\.io", "getflywheel", "flywheel", "heroku",
      "hostinger", "kamatera", "kinsta", "linode", "netlify", "nexcess", "northflank",
      "pantheon", "ploi", "pressable", "pressidium", "railway", "render", "runcloud",
      "servebolt", "serveravatar", "sevalla", "siteground", "spinupwp", "vercel",
      "vultr", "wpengine", "wpvip", "kloudbean",
      // wider hosting/PaaS set present in the export
      "bluehost", "godaddy", "namecheap", "hostgator", "dreamhost", "a2hosting",
      "inmotionhosting", "greengeeks", "ionos", "ovhcloud", "hetzner", "scaleway",
      "upcloud", "aws\\.amazon", "azure", "supabase", "planetscale", "neon\\.tech",
      "koyeb", "deta", "adaptable", "qovery", "porter\\.run", "platform\\.sh",
      "acquia", "liquidweb", "rocket\\.net", "convesio", "closte", "gridpane",
      // Vendors that also sell hosting or a server panel, so pitching them is
      // still pitching a rival. Found by reviewing the first mining run, where
      // elementor.com and cyberpanel.net both ranked as top "editorial" targets.
      "elementor", "cyberpanel", "cpanel", "plesk", "webmin", "virtualmin",
      "wix\\.com", "duda", "webflow", "shopify", "bigcommerce", "squarespace",
      "tiiny\\.host", "surge\\.sh", "pages\\.dev", "workers\\.dev", "firebaseapp",
      "herokuapp", "onrender", "up\\.railway", "netlify\\.app", "vercel\\.app",
    ].join("|") +
    // (\.|$) rather than \. — an earlier version required a trailing dot, so any
    // entry that already carried its TLD (fly.io, tiiny.host, pages.dev,
    // vercel.app) could only match as a subdomain and never as the domain itself.
    // fly.io was silently not excluded at all.
    ")(\\.|$)",
  "i",
);

/**
 * User-generated platforms. Not outreach targets: you do not email medium.com to
 * ask for a link, you publish there. Those belong to the community finder, which
 * is a different play in the same system.
 */
const PLATFORM =
  /(^|\.)(medium|substack|beehiiv|ghost\.io|blogspot|blogger|wordpress\.(com|org)|wix|wixsite|weebly|squarespace|tumblr|livejournal|typepad|hashnode|dev\.to|hackernoon|qiita|zenn\.dev|note\.com|hatena|habr|csdn|jianshu|zhihu|cnblogs|velog|tistory|brunch\.co|naver|vocal\.media|telegra?m|t\.me|linktr|bio\.link|bio\.site|carrd|about\.me|gravatar|disqus|reddit|quora|stackexchange|stackoverflow\.com|serverfault|superuser|askubuntu|github|gitlab|bitbucket|gitbook|codepen|jsfiddle|replit|glitch\.me|observablehq|kaggle|huggingface|pastebin|gist|facebook|instagram|twitter|x\.com|linkedin|pinterest|tiktok|youtube|vimeo|twitch|slideshare|scribd|issuu|academia\.edu|researchgate|goodreads|flipboard|theoldreader|rattibha|wikidot|wikiwiki|fandom|miraheze|viblo|teletype|rentry|telegra\.ph|hackmd|notion\.site|coda\.io|slid\.es|pocketcasts|listennotes|podbean|buzzsprout|libsyn|anchor\.fm)\./i;

const SEARCH_ENGINE =
  /(^|\.)(google|googleusercontent|yahoo|bing|yandex|ya\.ru|baidu|duckduckgo|ecosia|qwant|naver\.com|seznam|ask\.com|aol)\./i;

/** Package registries and mirrors: automated references, never editorial. */
const REGISTRY =
  /(^|\.)(packagist|npmjs|npm\.im|pypi|rubygems|crates\.io|maven|mvnrepository|nuget|hex\.pm|pub\.dev|dockerhub|hub\.docker|quay\.io|jsdelivr|unpkg|cdnjs|snyk|libraries\.io|deps\.dev|socket\.dev|repology|launchpad|sourceforge|apache\.org|eclipse\.org|debian|ubuntu\.com|archlinux|fedoraproject|opensuse)\./i;

/**
 * Software directories and alternative-finders. These ARE a real opportunity, but
 * a listing submission rather than an email pitch, so they get their own class
 * and their own opportunity type.
 */
const DIRECTORY =
  /(^|\.)(saashub|webcatalog|alternativeto|alternative\.to|slant\.co|stackshare|siftery|g2|capterra|getapp|softwareadvice|trustradius|producthunt|betalist|launchingnext|postmake|libhunt|awesomeopensource|openalternative|toolify|futurepedia|theresanaiforthat|saasworthy|sourceforge|crozdesk|financesonline|goodfirms|clutch\.co|designrush|serchen|softwaresuggest|tekpon|partnerbase|similarweb|crunchbase|zoominfo|owler|pitchbook|tracxn|peerspot|growjo|getlatka|latka|builtwith|wappalyzer|siteslikeme|producthunt)\./i;

const ACADEMIC =
  /(\.edu(\.[a-z]{2})?|\.ac\.[a-z]{2}|\.edu$|(^|\.)(arxiv|mdpi|springer|elsevier|sciencedirect|wiley|tandfonline|jstor|ssrn|researchsquare|biorxiv|semanticscholar|scholar\.google|core\.ac|doaj|ieee|acm\.org)\.)|(^|\.)(uni|univ)[a-z-]*\.[a-z]{2,3}$|\.(ufpr|usp)\.br$/i;

const PRESS_RELEASE =
  /(^|\.)(prnewswire|businesswire|globenewswire|einpresswire|openpr|prweb|newswire|accesswire|issuewire|pressat|prlog|24-7pressrelease|abnewswire|releasewire)\./i;

/**
 * Statistics content farms. These publish "N statistics for 2026" pages that link
 * out to every vendor in a category, which is why they appear against all six
 * rivals at once. High authority, zero editorial judgement, no value in a link
 * from them, and they never reply to anything.
 */
const STATS_FARM =
  /(^|\.)(zipdo|worldmetrics|wifitalents|gitnux|truelist|findstack|explodingtopics|marketsplash|sci-tech-today|electroiq|blogging-?wizard-?stats|statisticsanddata|demandsage|luisazhou|enterpriseappstoday)\./i;

/** Domains that exist to hold a name rather than publish anything. */
const PARKED =
  /(^|\.)(sedo|dan\.com|afternic|hugedomains|undeveloped|parkingcrew|bodis|above\.com|namebright)\.|^(site|example|test|localhost|domain)\.(com|help|org)$/i;

/**
 * A cheap language guess from the domain alone. Not authoritative: it only
 * pre-filters the obvious cases so the crawler spends its budget on plausible
 * targets. The crawler reads the real page and decides properly.
 */
const NON_ENGLISH_TLD =
  /\.(cn|jp|kr|ru|ua|tw|hk|vn|th|id|ir|il|gr|bg|rs|hr|sk|si|lt|lv|ee|hu|ro|cz|pl|tr|sa|ae|eg|ma|kz|uz|by|mn|np|bd|lk|mm|kh|la)$/i;

const NON_LATIN_HOST = /[^\u0000-\u007F]/;

/**
 * Classify a domain. Order matters: competitor first because a rival's own
 * subdomain would otherwise look like a perfectly good editorial site.
 */
export function classifyDomain(domainRaw: string): {
  domainClass: DomainClass;
  rejectReason: string | null;
} {
  const d = (domainRaw ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!d || !d.includes(".")) {
    return { domainClass: "unknown", rejectReason: "not a domain" };
  }
  if (COMPETITOR.test(`.${d}`) || COMPETITOR.test(d)) {
    return { domainClass: "competitor", rejectReason: "hosting vendor: never pitch a rival" };
  }
  if (PARKED.test(d)) return { domainClass: "parked", rejectReason: "parked or placeholder domain" };
  if (SEARCH_ENGINE.test(`.${d}`)) {
    return { domainClass: "search_engine", rejectReason: "search engine, nobody to email" };
  }
  if (REGISTRY.test(`.${d}`)) {
    return { domainClass: "registry", rejectReason: "package registry, links are automated" };
  }
  if (STATS_FARM.test(`.${d}`)) {
    return { domainClass: "stats_farm", rejectReason: "statistics content farm, links to every vendor" };
  }
  if (PRESS_RELEASE.test(`.${d}`)) {
    return { domainClass: "press_release", rejectReason: "press release wire, syndicated not editorial" };
  }
  if (ACADEMIC.test(d)) {
    return { domainClass: "academic", rejectReason: "academic publisher or university" };
  }
  if (DIRECTORY.test(`.${d}`)) {
    // Not rejected: a directory is a listing submission, which is a real play.
    return { domainClass: "directory", rejectReason: null };
  }
  if (PLATFORM.test(`.${d}`)) {
    return {
      domainClass: "platform",
      rejectReason: "user-generated platform: publish there instead of pitching it",
    };
  }
  if (NON_LATIN_HOST.test(d)) {
    return { domainClass: "unknown", rejectReason: "non-Latin domain, outside our language" };
  }
  if (NON_ENGLISH_TLD.test(d)) {
    return { domainClass: "unknown", rejectReason: "non-English region, outside our language" };
  }
  return { domainClass: "editorial", rejectReason: null };
}

/* -------------------------------------------------------------------------- *
 * Opportunity type, read from the linking page's URL
 * -------------------------------------------------------------------------- */

/** Legal and privacy pages. The single biggest source of worthless rows: 6,398. */
const LEGAL_PATH =
  /\/(privacy|privacy-?policy|datenschutz|datenschutzerklarung|mentions-?legales|impressum|terms|terms-of-(service|use)|tos|legal|legal-?notice|cookie|cookies|cookie-?policy|gdpr|dsgvo|aviso-?legal|politica-?de-?privacidad|condiciones|cgu|cgv|disclaimer|accessibility)(\/|$|\.)/i;

const DOCS_PATH =
  /\/(docs|documentation|api|api-?reference|reference|changelog|release-?notes|swagger|openapi|man|javadoc|godoc)(\/|$)/i;

/**
 * Best-of, alternatives and comparison pages. The most valuable opportunity in
 * this whole dataset, and the most honest ask available: a page that lists eight
 * options can carry a ninth, and the publisher benefits from being complete.
 * 5,417 domains have one.
 */
const LISTICLE_PATH =
  /(\b|\/|-)(best|top-?\d*|\d+-?best|alternatives?|alternative-?to|vs|versus|compare|comparison|comparisons|review|reviews|roundup|round-?up|cheapest|fastest|recommended|picks|shortlist|ranked|ranking)(\b|-|\/|$)/i;

/** Curated link and tool lists. */
const RESOURCE_PATH =
  /\/(resources?|tools?|links|stack|awesome[a-z-]*|directory|list|lists|recommendations?|toolbox|toolkit|software|apps)(\/|$)/i;

/** Ordinary editorial content, including date-based archives. */
const EDITORIAL_PATH =
  /\/(blog|posts?|articles?|news|tutorials?|guides?|how-?to|insights?|stories|magazine|journal|learn|academy|resources\/blog|p|entry|20\d\d)(\/|$)/i;

/**
 * Decide what kind of ask a page supports. Title is used as a secondary signal
 * because plenty of sites publish a listicle at a URL that does not say so.
 */
export function classifyOpportunity(
  sourceUrl: string,
  sourceTitle?: string | null,
  opts: { domainClass?: DomainClass; hasLostLink?: boolean } = {},
): { opportunityType: OpportunityType; rejectReason: string | null } {
  const url = (sourceUrl ?? "").trim();
  if (!url) return { opportunityType: "none", rejectReason: "no source page recorded" };

  if (opts.domainClass === "directory") {
    return { opportunityType: "directory_listing", rejectReason: null };
  }

  let path = "/";
  try {
    path = new URL(url).pathname || "/";
  } catch {
    const m = /https?:\/\/[^/]+(\/[^?#]*)/.exec(url);
    path = m?.[1] ?? "/";
  }

  if (LEGAL_PATH.test(path)) {
    return {
      opportunityType: "none",
      rejectReason: "links from a privacy or legal page, not editorial",
    };
  }
  if (DOCS_PATH.test(path)) {
    return { opportunityType: "none", rejectReason: "links from documentation, not editorial" };
  }

  const title = (sourceTitle ?? "").toLowerCase();
  const titleSaysListicle =
    /\b(best|top \d+|\d+ best|alternatives?|vs\.?|versus|compared?|comparison|review|cheapest|fastest)\b/i.test(
      title,
    );

  if (LISTICLE_PATH.test(path) || titleSaysListicle) {
    return { opportunityType: "listicle", rejectReason: null };
  }
  if (RESOURCE_PATH.test(path)) return { opportunityType: "resource_page", rejectReason: null };

  // A link that has since disappeared may be a genuine broken-link angle, but
  // only where the page is editorial. Confirming it needs a live fetch, so this
  // is a candidate, not a conclusion.
  if (opts.hasLostLink && EDITORIAL_PATH.test(path)) {
    return { opportunityType: "broken_link", rejectReason: null };
  }
  // A link from the bare homepage is a badge, a footer credit or a "powered by",
  // not a piece of writing anybody will revisit. Kept, but ranked far below a real
  // editorial mention instead of being counted as one.
  if (path === "/" || path === "") {
    return { opportunityType: "homepage_reference", rejectReason: null };
  }
  if (EDITORIAL_PATH.test(path)) {
    return { opportunityType: "editorial_mention", rejectReason: null };
  }
  return { opportunityType: "editorial_mention", rejectReason: null };
}

/* -------------------------------------------------------------------------- *
 * Scoring
 * -------------------------------------------------------------------------- */

/**
 * Authority as a band, 0..1.
 *
 * This is the counterintuitive part and the most important. Sorting by raw
 * authority surfaces google.com and medium.com, which cannot be pitched, while
 * burying sitepoint.com and logrocket.com, which can. The curve peaks across
 * 35-60 because that is where this dataset's genuinely outreachable publications
 * actually live.
 */
export function authorityBand(authority: number): number {
  const a = Number.isFinite(authority) ? authority : 0;
  if (a < 12) return 0; // the 15,178-domain junk floor at authority 2
  if (a < 20) return 0.18;
  if (a < 28) return 0.5;
  if (a < 35) return 0.82;
  if (a <= 60) return 1; // the sweet spot
  if (a <= 72) return 0.8;
  if (a <= 82) return 0.45; // large corporates: real, but long odds
  return 0.15; // google/medium/microsoft tier: effectively unpitchable
}

/**
 * How likely this domain is a link farm rather than a publication, 0..100.
 *
 * The clearest tell in the export is a domain with millions of backlinks and an
 * authority of 2, e.g. babynamewizard.co.uk with 2,579,103 backlinks at
 * authority 2. Real publications do not have that shape.
 */
export function spamScore(input: {
  domain: string;
  authority: number;
  refdomainBacklinks: number;
}): number {
  let s = 0;
  const a = input.authority || 0;
  const bl = input.refdomainBacklinks || 0;

  if (a <= 10 && bl > 100_000) s += 60;
  else if (a <= 15 && bl > 1_000_000) s += 55;
  else if (a <= 20 && bl > 500_000) s += 35;
  if (a <= 5) s += 20;

  const d = input.domain.toLowerCase();
  // Cheap bulk-registration TLDs, heavily over-represented in link schemes.
  if (/\.(xyz|top|click|loan|work|bid|win|gq|cf|tk|ml|ga|buzz|rest|icu|cyou|sbs|lol)$/i.test(d)) {
    s += 25;
  }
  // Machine-generated looking hostnames.
  if ((d.match(/-/g) ?? []).length >= 4) s += 15;
  if (/\d{4,}/.test(d)) s += 15;
  if (d.replace(/\./g, "").length > 30) s += 10;

  return Math.min(100, s);
}

const TYPE_WEIGHT: Record<OpportunityType, number> = {
  // A page that already lists competitors is the best possible target: the ask is
  // "you list eight, consider a ninth", which helps their reader too.
  listicle: 1,
  /**
   * v27. Ranked just under a listicle and above a plain editorial mention, because
   * we know the exact article they chose to cite. That is a real, checkable fact
   * about a specific editorial decision, which is a far better opening than
   * knowing only that the domain covers the category. Not ranked at 1: a person
   * who cited one guide is not necessarily rewriting it.
   */
  skyscraper: 0.95,
  guest_post: 0.9,
  resource_page: 0.85,
  /**
   * A recent review means somebody there tests products and writes them up, which
   * is the rarest and most useful signal in this whole dataset. Held slightly
   * under guest_post only because the ask is bigger: reviewing something takes
   * hours, where accepting a contribution takes minutes.
   */
  product_review: 0.88,
  broken_link: 0.75,
  directory_listing: 0.6,
  editorial_mention: 0.55,
  /**
   * A podcast is scored low ON PURPOSE, and the low number is not a judgement
   * about its worth. It is that this score decides queue ORDER for a link
   * pipeline, and an appearance is a slower, different kind of win. Ranking shows
   * highly here would push them ahead of pages that could link this week.
   */
  podcast: 0.4,
  // A bare homepage link is a badge, a footer credit or a "powered by", not an
  // editorial decision anybody will revisit. Worth keeping, worth ranking last.
  homepage_reference: 0.25,
  none: 0,
};

/** Ceiling for the base term, leaving headroom for the bonuses below. */
const BASE_MAX = 60;

/**
 * Terms that mean a page is actually about our category. Weighted, because
 * "managed hosting" is a much stronger signal than a bare mention of "cloud".
 */
const TOPIC_TERMS: { re: RegExp; w: number }[] = [
  { re: /\b(managed|web|website|wordpress|woocommerce|vps|cloud|app|application|node|php|laravel|django|rails)[\s-]?hosting\b/i, w: 1 },
  { re: /\b(hosting|host|hosts)\b/i, w: 0.7 },
  { re: /\b(deploy|deployment|deploying|self-?host|server|servers|vps|paas|iaas)\b/i, w: 0.65 },
  { re: /\b(heroku|netlify|vercel|cloudways|kinsta|railway|render|digitalocean|linode|vultr|wpengine|flywheel|pantheon|siteground|bluehost|hostinger)\b/i, w: 0.8 },
  { re: /\b(managed database|postgres|postgresql|mysql|mariadb|mongodb|redis|database)\b/i, w: 0.5 },
  { re: /\b(devops|ci\/?cd|kubernetes|docker|container|load balanc|autoscal|uptime|sre|infrastructure)\b/i, w: 0.5 },
  { re: /\b(cdn|ssl|tls|backup|staging|serverless|edge)\b/i, w: 0.4 },
  { re: /\b(agency|agencies|freelancer|client sites?|white ?label)\b/i, w: 0.35 },
  { re: /\b(saas|startup|web ?dev|web ?development|full[- ]?stack|backend)\b/i, w: 0.3 },
];

/**
 * How much a linking page is actually about what we sell, 0..1.
 *
 * WHY THIS EXISTS. Without it the miner happily surfaced "The 13 Best Yahoo Pipes
 * Alternatives" on makeuseof.com and "2018's Top 7 R Packages for Data Science" on
 * kdnuggets.com as prime targets. Both are genuinely listicles on genuinely
 * strong domains, and both are completely irrelevant to hosting. Pitching either
 * would read as a mail-merge that never looked at the page, which is the exact
 * failure that gets a sender blocked and deserves to.
 *
 * Judged from the page title, its URL and the anchor text, because that is all the
 * export gives us. A weak score here is a strong signal to look for a better page
 * on the same domain rather than to pitch this one.
 */
export function topicalRelevance(
  title?: string | null,
  url?: string | null,
  anchor?: string | null,
): number {
  const hay = `${title ?? ""} ${(url ?? "").replace(/[-_/]/g, " ")} ${anchor ?? ""}`;
  if (!hay.trim()) return 0;
  let best = 0;
  let sum = 0;
  for (const t of TOPIC_TERMS) {
    if (t.re.test(hay)) {
      best = Math.max(best, t.w);
      sum += t.w;
    }
  }
  if (best === 0) return 0;
  // The strongest single term dominates, with corroboration worth a little more.
  const score = Math.min(1, best + Math.min(sum - best, 1) * 0.25);
  return Math.round(score * 100) / 100;
}

/**
 * Overall priority, 0..100.
 *
 * SHAPE: a multiplicative BASE for the two things that can independently
 * disqualify a target, then ADDITIVE bonuses, then a multiplicative spam penalty.
 *
 * The base is multiplicative because a perfect listicle on a junk domain is still
 * junk, and a strong domain whose only link is from its privacy page is still not
 * an opportunity. Either factor alone must be able to kill the score, which a
 * weighted sum cannot do.
 *
 * The bonuses are additive because the first version multiplied them and every
 * single listicle in the 35-60 authority band came out at exactly 100.0. Twenty-five
 * top results, one score, no way to rank them. Capping the base at 60 and adding
 * bounded bonuses keeps the maximum reachable but rarely reached, so the ordering
 * carries information again.
 */
export function linkValueScore(input: {
  authority: number;
  refdomainBacklinks: number;
  domain: string;
  domainClass: DomainClass;
  opportunityType: OpportunityType;
  rivalCount: number;
  linkCount: number;
  hasContact?: boolean;
  acceptsGuestPosts?: boolean | null;
  /** 0..1 from topicalRelevance(). Treated as a third disqualifying factor. */
  relevance?: number;
}): number {
  if (input.opportunityType === "none") return 0;
  if (input.domainClass === "competitor") return 0;

  const band = authorityBand(input.authority);
  if (band === 0) return 0;

  const type = TYPE_WEIGHT[input.opportunityType] ?? 0.4;

  // Relevance sits in the multiplicative base alongside authority and type,
  // because a listicle about something else is not a smaller opportunity, it is
  // the wrong opportunity. Floored rather than zeroed when unknown, so a missing
  // title does not silently delete an otherwise good target.
  const rel = input.relevance == null ? 0.5 : Math.max(0.12, input.relevance);

  let score = BASE_MAX * band * type * rel;

  // Linking to several rivals proves they cover this category editorially rather
  // than having mentioned one vendor once. Capped at three, because beyond that it
  // stops meaning "relevant to us" and starts meaning "links to everyone", which
  // is how the stats farms got to the top of the first ranking.
  const rivals = Math.min(Math.max(input.rivalCount ?? 1, 1), 3);
  score += (rivals - 1) * 6; // +0, +6, +12

  // More links from one domain is mild corroboration, not a bigger prize.
  score += Math.min(input.linkCount ?? 1, 8) / 2; // up to +4

  if (input.domainClass === "editorial") score += 5;
  else if (input.domainClass === "corporate") score -= 15;
  else if (input.domainClass === "directory") score -= 5;

  // Knowing who to write to matters: a perfect target with no reachable human is
  // not actually an opportunity.
  if (input.hasContact) score += 8;
  if (input.acceptsGuestPosts) score += 10;

  const spam = spamScore(input);
  score *= 1 - Math.min(spam, 90) / 100;

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/** Registrable-ish domain from a URL or host string. Keeps a useful subdomain. */
export function normaliseDomain(input: string): string {
  let d = (input ?? "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  d = d.replace(/:\d+$/, "");
  return d;
}
