import "@tanstack/react-start/server-only";
import { renderOutreachEmail } from "./email-templates";
import type { OpportunityType } from "./link-classifier";
import { isUnpitchableAddress } from "./contact-finder";

/**
 * LINK PITCH DRAFTER — writes the email for one link opportunity.
 *
 * THE CENTRAL RULE: the ask matches what the page actually is. A page listing
 * eight hosting options, a curated resource list, a "write for us" page and a blog
 * post that mentioned Heroku once are four different conversations. Sending the
 * same "please link to us" to all four is precisely why most link outreach gets
 * deleted, and it deserves to.
 *
 * The strongest version of this is also the most honest one. A publisher with a
 * "best managed hosting" listicle has a genuine reason to care: their page is
 * incomplete without a option their readers would want, and completeness is the
 * whole value of that page. So the pitch names their page, names the gap, and
 * makes it trivially easy to say no.
 *
 * WHAT IS NEVER DONE HERE:
 *   - No invented flattery. Nothing says "I love your blog" or "I've been reading
 *     for years". The only specific claim about them is the page we actually read
 *     out of the export, and its title is quoted from their own data.
 *   - No invented product claims. Every differentiator comes from the confirmed
 *     capability list below, drawn from the product-truth files.
 *   - No invented metrics. No traffic figures, no "we grew X by Y%".
 *   - No link exchange, no payment, no reciprocal offer. Those are the schemes the
 *     operating rules forbid outright, and they are also what gets a domain
 *     penalised.
 *
 * Deterministic templates rather than an LLM, matching outreach-engine.ts. This
 * copy goes to a stranger's inbox under a real person's name, and a model that
 * improvises about somebody's publication is the failure mode to design out.
 */

/**
 * Confirmed differentiators, each phrased as something a reader of that kind of
 * page would actually want to know. Grounded in the product-truth files: seven
 * clouds, seven managed database engines, built-in object storage and load
 * balancer, no cap on applications per server, and in-Kingdom data residency.
 */
const ANGLES: {
  match: RegExp;
  angle: string;
  slug: string;
  title: string;
  /**
   * The one grounded capability that backs THIS angle.
   *
   * Per-angle rather than shared, because a single boilerplate sentence about
   * seven clouds appeared byte-identical in every drafted email. Across different
   * recipients that is invisible right up until two of them compare notes, and it
   * dilutes the specific point the angle just made. A proof line that supports the
   * angle is better copy and cannot read as a mail-merge.
   */
  proof: string;
}[] = [
  {
    match: /\b(heroku|paas|dyno|platform as a service)\b/i,
    slug: "heroku-alternative",
    title: "The Heroku alternative breakdown",
    angle:
      "the per-service billing problem is the one most Heroku lists skip: a web process, a worker and a cron are three billed services there and three processes on one server elsewhere",
    proof:
      "Migration off a PaaS is free above 4GB, and there is a three-day trial, so the comparison can be tested rather than argued about."
  },
  {
    match: /\b(vercel|netlify|amplify|front.?end hosting|jamstack|static)\b/i,
    slug: "vercel-alternative-for-full-stack-apps",
    title: "The Vercel alternative breakdown for full-stack apps",
    angle:
      "most front-end host comparisons stop before the app grows a database, a worker and a cron, which is exactly where the pricing changes shape",
    proof:
      "The database, the worker and the cron live in the same dashboard as the app, on flat server pricing."
  },
  {
    match: /\b(wordpress|woocommerce|elementor|wp)\b/i,
    slug: "agency-wordpress-hosting",
    title: "WordPress hosting for agencies running client sites",
    angle:
      "the thing that decides an agency's hosting bill is whether the plan caps applications per server, and most comparison tables never mention it",
    proof:
      "There is no cap on applications per server on any plan, including the $8 tier. The only ceiling is the server's RAM."
  },
  {
    match: /\b(managed database|postgres|postgresql|mysql|mariadb|mongodb|redis|elasticsearch)\b/i,
    slug: "managed-postgresql-hosting",
    title: "Managed PostgreSQL hosting, and when to separate the data tier",
    angle:
      "seven managed engines behind one dashboard, and the honest limit that the primary is single-region even though read replicas are not",
    proof:
      "Seven managed engines, MySQL through Elasticsearch, each with its own hostname, mandatory TLS and IP allow-listing."
  },
  {
    match: /\b(node|express|nestjs|next\.?js|react|vue|angular)\b/i,
    slug: "deploy-node-app-to-managed-cloud",
    title: "Deploying a Node app to a managed cloud",
    angle:
      "the three things that break a first Node deploy every time are a hard-coded port, SQLite on local disk, and build-time environment variables set too late",
    proof:
      "Git push deploys with live build logs, and PM2 multi-process for Node, on a server you can SSH into."
  },
  {
    match: /\b(python|django|flask|fastapi)\b/i,
    slug: "deploy-python-app",
    title: "Deploying a Python app to production",
    angle: "worker and cron processes sit on the same server rather than billing as separate services",
    proof:
      "Flask, Django and FastAPI as managed runtimes, with cron jobs configured from the UI rather than over SSH."
  },
  {
    match: /\b(ai|llm|machine learning|ml model|gpu|inference|mistral|deepseek)\b/i,
    slug: "deploy-ai-built-app-to-production",
    title: "Deploying an AI-built app to production",
    angle:
      "self-hosting an open model on a GPU server, pinned to a chosen region, is a different story from calling a hosted model API and most lists only cover the second",
    proof:
      "GPU servers are self-serve, and the model can be pinned to a chosen region, including in-Kingdom Dammam."
  },
  {
    match: /\b(vps|dedicated|shared hosting|cloud hosting|cheap)\b/i,
    slug: "managed-vs-unmanaged-hosting",
    title: "Managed versus unmanaged hosting, decided properly",
    angle:
      "the useful comparison is not price but who carries the patching, backups and the 2am page, since that is the cost that does not appear on the invoice",
    proof:
      "Managed here means the server, stack, TLS, backups and patching. The application code and data stay yours."
  },
  {
    match: /\b(saudi|ksa|dammam|riyadh|jeddah|pdpl|nca|data residency|sovereignty)\b/i,
    slug: "data-residency-saudi-arabia",
    title: "Data residency in Saudi Arabia, and where data quietly leaks",
    angle:
      "managed databases running in-Kingdom in the Dammam region, which is a real gap in most managed-hosting comparisons",
    proof:
      "Managed databases run in-region on Google Cloud's Dammam region, aligned with PDPL expectations though not certified."
  },
  {
    match: /\b(serverless|lambda|edge|function)\b/i,
    slug: "serverless-vs-managed-servers",
    title: "Serverless versus a managed server, with the tradeoffs named",
    angle:
      "where serverless stops being cheaper, which is usually the moment a background worker or a persistent connection enters the picture",
    proof:
      "A long-running worker and a persistent database connection are ordinary here rather than an architectural problem."
  },
  {
    match: /\b(devops|kubernetes|docker|ci\/?cd|infrastructure|load balanc)\b/i,
    slug: "managed-cloud-vs-diy-devops",
    title: "Managed cloud versus running your own DevOps",
    angle: "most small teams do not need Kubernetes, and the honest version of that argument is worth making",
    proof:
      "Kubernetes and autoscaling exist on enterprise, and most teams are told plainly that they do not need either."
  },
  {
    match: /.*/,
    slug: "how-agencies-host-20-client-apps",
    title: "How agencies host 20+ client apps on one managed server",
    angle:
      "seven clouds behind one dashboard, and no cap on how many applications a server runs, which is the detail that changes the maths for anyone hosting client work",
    proof:
      "Seven clouds behind one login, including Lightsail and UpCloud, and no cap on applications per server at any tier."
  },
];

const BLOG = "https://www.kloudbean.com/blog";
const SITE = "https://www.kloudbean.com";

export type LinkPitch = {
  ok: boolean;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  assetUrl: string;
  ourTargetSlug: string;
  pitchAngle: string;
  /** False when we had no page title to quote and had to stay generic. */
  specific: boolean;
  error?: string;
};

export type LinkPitchInput = {
  domain: string;
  contactName?: string | null;
  contactEmail: string;
  opportunityType: OpportunityType | string;
  bestSourceUrl?: string | null;
  bestSourceTitle?: string | null;
  bestAnchor?: string | null;
  bestTargetUrl?: string | null;
  linksTo?: string[];
  acceptsGuestPosts?: boolean | null;
  guidelinesUrl?: string | null;
  authority?: number;
  /**
   * v27. Which recipe found this prospect, and what that recipe knew.
   *
   * Both are read from the STORED row at both call sites, never passed only in
   * memory. That is not tidiness: the follow-up is drafted days later by
   * `draftFollowUpFor`, which rebuilds this input from the database. Anything held
   * only in memory during the first draft would be missing by then, and the
   * follow-up would quietly argue a different point than the email it follows.
   */
  sourceRecipe?: string | null;
  recipeEvidence?: Record<string, string | number | boolean | null> | null;
};

/**
 * Pick the angle from what their page is actually about.
 *
 * TWO THINGS THIS GETS RIGHT, both learned the hard way.
 *
 * It ignores the anchor text. The anchor in this dataset is nearly always the
 * rival's bare brand name ("Netlify" appears as the anchor 7,606 times), so
 * including it meant the anchor decided the angle. prisma.io's page on
 * "13 Best Serverless Computing Platforms & Database Providers" was pitched the
 * front-end-hosting angle purely because the anchor said Netlify.
 *
 * And it scores every angle rather than taking the first regex that hits, so the
 * result does not depend on the order of the list. A title mentioning both
 * serverless and databases should pick whichever is the stronger signal, not
 * whichever happens to be declared earlier.
 */
function pickAngle(input: LinkPitchInput): (typeof ANGLES)[number] {
  const hay = `${input.bestSourceTitle ?? ""} ${(input.bestSourceUrl ?? "").replace(/[-_/]/g, " ")}`;
  let best: { a: (typeof ANGLES)[number]; hits: number } | null = null;

  for (const a of ANGLES) {
    if (a.match.source === ".*") continue; // the catch-all is the fallback, not a candidate
    const m = hay.match(new RegExp(a.match.source, "gi"));
    const hits = m ? m.length : 0;
    if (hits > 0 && (!best || hits > best.hits)) best = { a, hits };
  }
  return best?.a ?? ANGLES[ANGLES.length - 1];
}

/**
 * Which rival that specific page links to.
 *
 * Read from the target URL, which is the exact page their link points at, so this
 * is a verified fact about the page rather than an inference. Falling back to
 * "this domain links to Netlify somewhere" would let the email assert something
 * about a page we did not check, and being wrong about their own article in the
 * first sentence is the fastest way to lose a reader.
 */
function rivalMentioned(input: LinkPitchInput): string | null {
  const PRETTY: Record<string, string> = {
    heroku: "Heroku",
    netlify: "Netlify",
    vercel: "Vercel",
    cloudways: "Cloudways",
    kinsta: "Kinsta",
    railway: "Railway",
    render: "Render",
    digitalocean: "DigitalOcean",
    linode: "Linode",
    vultr: "Vultr",
    wpengine: "WP Engine",
    flywheel: "Flywheel",
    pantheon: "Pantheon",
    siteground: "SiteGround",
  };
  const target = (input.bestTargetUrl ?? "").toLowerCase();
  for (const [key, pretty] of Object.entries(PRETTY)) {
    if (target.includes(key)) return pretty;
  }
  // No target URL recorded: say nothing rather than guess at their content.
  return null;
}

function shortTitle(t?: string | null): string | null {
  if (!t) return null;
  // Publishers append their own brand; the reader knows their own site.
  return t.replace(/\s*[|\-–—]\s*[^|\-–—]{2,28}$/, "").trim().slice(0, 110) || null;
}

/* -------------------------------------------------------------------------- *
 * One body per opportunity type
 * -------------------------------------------------------------------------- */

function listiclePitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle);
  const rival = rivalMentioned(input);

  return {
    subject: title ? `A missing option in "${title}"` : `One more option worth listing`,
    opening: title
      ? `I was reading your "${title}" piece${rival ? `, the one that covers ${rival}` : ""}.`
      : `I came across your roundup on hosting options${rival ? ` that covers ${rival}` : ""}.`,
    value: `We run Kloudbean, a managed cloud, and there is one specific reason it belongs on that kind of list: ${angle.angle}. ${angle.proof}`,
    ask: `If you think it earns a slot, everything you'd need is on ${SITE}/. If it does not fit the piece, no reply needed and I won't chase it.`,
  };
}

function resourcePagePitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle);
  return {
    subject: title ? `A resource for "${title}"` : `A resource for your hosting list`,
    opening: title
      ? `Your "${title}" list is the kind of page people actually keep open.`
      : `You keep a curated list of hosting and deployment resources.`,
    value: `We publish a guide that fits it: "${angle.title}". The useful part is the bit most versions skip, which is that ${angle.angle}. ${angle.proof}`,
    ask: `Here it is if you want to look: ${BLOG}/${angle.slug}/. Add it or don't, either is fine.`,
  };
}

function guestPostPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  return {
    subject: `Contributing to ${input.domain.replace(/^www\./, "")}`,
    opening: input.guidelinesUrl
      ? `I read your contributor guidelines, so I'll keep this to the point.`
      : `You take outside contributions, so I'll keep this to the point.`,
    value: `I write about running production infrastructure, and I'd pitch one piece rather than a list of vague ideas: ${angle.angle}. I can write it with real specifics, the failure modes and the tradeoffs, not a vendor overview. For context on where I'm coming from: ${angle.proof}`,
    ask: `If the angle is wrong for your readers, tell me and I'll drop it. If it's close, I'll send an outline first so you're not reading a finished draft you didn't ask for. Here's an example of how I write: ${BLOG}/${angle.slug}/.`,
  };
}

function brokenLinkPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle);
  return {
    subject: title ? `A dead link on "${title}"` : `A dead link on one of your pages`,
    opening: title
      ? `Small thing: one of the outbound links on your "${title}" page looks like it no longer resolves.`
      : `Small thing: one of the outbound links on this page looks like it no longer resolves.`,
    value: `Worth a check either way. If you want a live replacement for that section, we have a guide covering the same ground: "${angle.title}".`,
    ask: `Flagging it because a dead link is annoying for your readers, not to get something out of it. Use the replacement or don't: ${BLOG}/${angle.slug}/.`,
  };
}

function editorialMentionPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle);
  const rival = rivalMentioned(input);
  return {
    subject: title ? `Something your "${title}" piece raised` : `A follow-on to something you published`,
    opening: title
      ? `You wrote "${title}"${rival ? `, which mentions ${rival}` : ""}.`
      : `You've written about hosting and deployment${rival ? `, including ${rival}` : ""}.`,
    value: `The question readers usually ask next is the one that's hardest to answer briefly: ${angle.angle}. We wrote it up properly in "${angle.title}". ${angle.proof}`,
    ask: `Sending it because it's genuinely the missing half of that topic, not asking for anything: ${BLOG}/${angle.slug}/. If you ever want a technical read on a piece in this area, I'm happy to help.`,
  };
}

/* -------------------------------------------------------------------------- *
 * v27 — one body per recipe, where the recipe changes what we can honestly say
 * -------------------------------------------------------------------------- */

/** Read one string out of the recipe's evidence blob, safely. */
function ev(input: LinkPitchInput, key: string): string | null {
  const v = (input.recipeEvidence ?? {})[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * They cited a specific rival article.
 *
 * The difference between this and the generic editorial pitch is the whole reason
 * the recipe exists: we know the exact URL they chose to link, so the first line
 * can name it. That is a checkable fact about an editorial decision they made,
 * which is a much better opening than "you write about hosting".
 *
 * WHAT THIS DELIBERATELY DOES NOT SAY. It never claims our page is better than the
 * one they cited. That is an unverifiable superlative, it is the exact thing every
 * skyscraper email says, and an editor who liked the piece enough to link it will
 * simply stop reading. The honest version names something the cited page does not
 * cover and leaves the judgement to them.
 */
function skyscraperPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle);
  const cited = ev(input, "citedUrl") ?? input.bestTargetUrl ?? null;
  const rival = rivalMentioned(input);
  // A bare host reads better in a sentence than a full URL with its query string.
  const citedHost = cited
    ? cited.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
    : null;

  return {
    subject: title ? `The ${rival ?? "guide"} link in "${title}"` : `Something the guide you linked leaves out`,
    opening: title
      ? `In your "${title}" piece you point readers at ${citedHost ?? "a guide"} for the detail.`
      : `You point readers at ${citedHost ?? "a guide"} for the detail on this.`,
    value: `That guide is solid on what it covers. The question it doesn't answer is the one people hit next: ${angle.angle}. We wrote that part up in "${angle.title}". ${angle.proof}`,
    ask: `Only worth adding if it genuinely fills a gap for your readers: ${BLOG}/${angle.slug}/. If it doesn't, ignore this and I won't chase it.`,
  };
}

/**
 * They review products, and they reviewed a rival.
 *
 * The ask here is NOT a link, and getting that right matters. Somebody who spends
 * hours testing a product and writing up what they found is not going to insert a
 * mention because a vendor asked. What they might do is look at another one.
 *
 * TWO HARD RULES, both from the operating rules rather than from taste.
 * No payment, no incentive and no exchange is offered, because that is a paid
 * review and a link scheme wearing a friendly face. And no positive coverage is
 * requested, which has to be said out loud in the email: a reviewer who suspects
 * otherwise is right to bin it. Only the confirmed trial is offered, nothing
 * invented about comped or extended access.
 */
function productReviewPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const title = shortTitle(input.bestSourceTitle) ?? ev(input, "reviewTitle");
  const reviewed = ev(input, "reviewed") ?? rivalMentioned(input);
  const pretty = reviewed
    ? reviewed.charAt(0).toUpperCase() + reviewed.slice(1)
    : "one of the managed platforms";

  return {
    subject: title ? `You reviewed ${pretty} — one more worth a look` : `A managed platform worth testing`,
    opening: title
      ? `I read your ${pretty} review. You actually ran the thing, which is rarer than it should be in that category.`
      : `You review hosting platforms properly rather than rewriting feature lists.`,
    value: `We run Kloudbean, and the reason I think it's worth your time rather than just another entry: ${angle.angle}. ${angle.proof}`,
    ask: `There's a free three-day trial if you want to poke at it, and I'll answer anything technical you ask. To be clear about what I'm not asking: no payment either direction, no link, and no expectation of a kind word. If you test it and it falls short, write that. A review that only ever says nice things is worth nothing to your readers and nothing to us.`,
  };
}

/**
 * A podcast, where the ask is to appear rather than to link.
 *
 * This is the one body that is not a link request at all, and treating it as one
 * is exactly how a good show decides nobody at our end has ever listened. So there
 * is no article URL in the ask and no mention of a link.
 *
 * The specific person we searched for is named on purpose. Hiding how we found the
 * show would be the coy version, and a host can see straight through it: they know
 * who has been on their own show. Saying "I came across your episode with X"
 * is both true and the most natural reason a stranger would be writing.
 */
function podcastPitch(
  input: LinkPitchInput,
  angle: { slug: string; title: string; angle: string; proof: string },
): { subject: string; opening: string; value: string; ask: string } {
  const show = ev(input, "show") ?? shortTitle(input.bestSourceTitle);
  const person = ev(input, "personSearched");

  return {
    subject: show ? `A guest idea for ${show}` : `A guest idea for your show`,
    opening: person
      ? `I found ${show ?? "your show"} through the ${person} episode, and went through a few more after it.`
      : `I've been going through ${show ?? "your show"}'s back catalogue.`,
    value: `I run infrastructure at Kloudbean, a managed cloud, so the episodes I could actually add something to are the operational ones. One topic I'd bring rather than a list of vague ideas: ${angle.angle}. I'd talk about where it breaks and what it costs, not our product.`,
    ask: `If that's not the right shape for your audience, say so and I'll leave it. If it's close, I'll send three or four specific questions you could ask me, so you can judge the conversation before booking anything.`,
  };
}

/* -------------------------------------------------------------------------- *
 * Public
 * -------------------------------------------------------------------------- */

/** Draft the first touch for one link opportunity. */
export function draftLinkPitch(input: LinkPitchInput, step = 1): LinkPitch {
  if (!input.contactEmail?.trim()) {
    return {
      ok: false,
      subject: "",
      bodyText: "",
      bodyHtml: "",
      assetUrl: "",
      ourTargetSlug: "",
      pitchAngle: "",
      specific: false,
      error: "No contact address",
    };
  }
  if (input.opportunityType === "directory_listing") {
    // A directory is a submission form, not a person. Emailing one is noise.
    return {
      ok: false,
      subject: "",
      bodyText: "",
      bodyHtml: "",
      assetUrl: "",
      ourTargetSlug: "",
      pitchAngle: "",
      specific: false,
      error: "Directory listing: submit through their form, do not email",
    };
  }

  let angle = pickAngle(input);

  /**
   * A podcast needs a different fallback than everything else.
   *
   * `pickAngle` reads the page title and URL, and for a show those are the show's
   * name and its episode URL, which say nothing about hosting. So a podcast almost
   * always lands on the catch-all, and the catch-all is "seven clouds behind one
   * dashboard, and no cap on applications per server". That is a product pitch. In
   * an email that promises to talk about "where it breaks and what it costs, not
   * our product", it directly contradicts the sentence above it.
   *
   * So an unmatched podcast gets the argument that actually works out loud: most
   * teams do not need Kubernetes. It is a real position, it is honest, and a host
   * can build a conversation on it.
   */
  if (input.opportunityType === "podcast" && angle.match.source === ".*") {
    angle = ANGLES.find((a) => a.slug === "managed-cloud-vs-diy-devops") ?? angle;
  }

  /**
   * A guest-post invitation overrides the stored type, with ONE exception.
   *
   * A site that takes contributions is nearly always better pitched a contribution
   * than a link, so that override is right. But a podcast is not: plenty of shows
   * also run a blog that accepts guest posts, and pitching an article to a show we
   * found by looking for episodes would throw away the only specific thing we know
   * about them. The recipe's own intent wins there.
   */
  const type =
    input.acceptsGuestPosts && input.opportunityType !== "podcast"
      ? "guest_post"
      : input.opportunityType;

  /**
   * A lookup rather than the ternary chain this replaced.
   *
   * The chain ended in `: editorialMentionPitch(...)`, so any opportunity type
   * nobody had wired up fell through to the generic editorial wording and looked
   * like it worked. That is how a podcast would have been sent a link request. A
   * map makes an unwired type visible, and the fallback below is now a deliberate
   * decision rather than the last branch of an if.
   */
  const BODIES: Record<string, (i: LinkPitchInput, a: typeof angle) => {
    subject: string;
    opening: string;
    value: string;
    ask: string;
  }> = {
    listicle: listiclePitch,
    resource_page: resourcePagePitch,
    guest_post: guestPostPitch,
    broken_link: brokenLinkPitch,
    editorial_mention: editorialMentionPitch,
    homepage_reference: editorialMentionPitch,
    skyscraper: skyscraperPitch,
    product_review: productReviewPitch,
    podcast: podcastPitch,
  };

  const build = BODIES[String(type)] ?? editorialMentionPitch;
  const parts = build(input, angle);

  // A follow-up is one short nudge that adds a reason to reply, never a re-send.
  // The reason it exists at all is that a first email genuinely gets buried; the
  // reason there is only one is that a second nudge is just pressure.
  const subject = step >= 2 ? `Re: ${parts.subject}` : parts.subject;
  const opening =
    step >= 2
      ? `Following up once on the note below, then I'll leave it. ${parts.opening}`
      : parts.opening;
  const ask =
    step >= 2
      ? `If it's not for you, ignoring this is a perfectly good answer and I won't email again.`
      : parts.ask;

  const rendered = renderOutreachEmail({
    subject,
    greetingName: input.contactName?.split(/\s+/)[0] ?? null,
    personalNote: opening,
    valueParagraph: parts.value,
    ask,
  });

  return {
    ok: true,
    subject: rendered.subject,
    bodyText: rendered.text,
    bodyHtml: rendered.html,
    assetUrl: `${BLOG}/${angle.slug}/`,
    ourTargetSlug: angle.slug,
    pitchAngle: angle.angle,
    // Specific means we could quote their own page title. Without one the email is
    // measurably weaker, and the batch reports how many came out that way rather
    // than papering over it.
    specific: !!input.bestSourceTitle,
  };
}

/**
 * The one true, specific sentence about this prospect.
 *
 * It matters more than it looks. `autoApproveLinkPitches` refuses to approve any
 * draft whose prospect has an empty personal note, on the grounds that an email
 * with nothing specific in it should not go out unread. So a recipe that leaves
 * this null produces pitches that pile up in the queue forever, and the reason
 * given ("no specific page to reference") looks like a bug rather than a policy.
 *
 * Phrased per recipe because "Published X at Y" is wrong for a podcast, which
 * airs episodes, and thin for a review, where the fact worth recording is what
 * they reviewed.
 */
export function personalNoteFor(p: {
  source_recipe: string | null;
  best_source_title: string | null;
  best_source_url: string | null;
  recipe_evidence: Record<string, string | number | boolean | null> | null;
  domain: string;
}): string | null {
  const e = p.recipe_evidence ?? {};
  const str = (k: string): string | null => {
    const v = e[k];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  switch (p.source_recipe) {
    case "podcast": {
      const show = str("show") ?? p.best_source_title;
      const person = str("personSearched");
      if (!show) return null;
      return person
        ? `Runs the podcast "${show}", which featured ${person}`
        : `Runs the podcast "${show}"`;
    }
    case "product_review": {
      const what = str("reviewed");
      const title = str("reviewTitle") ?? p.best_source_title;
      if (!title && !what) return null;
      return what
        ? `Reviewed ${what}${title ? `: "${title}"` : ""}${p.best_source_url ? ` at ${p.best_source_url}` : ""}`
        : `Published "${title}" at ${p.best_source_url}`;
    }
    case "skyscraper": {
      const cited = str("citedUrl");
      if (!p.best_source_title) return null;
      return cited
        ? `Published "${p.best_source_title}" at ${p.best_source_url}, which links to ${cited}`
        : `Published "${p.best_source_title}" at ${p.best_source_url}`;
    }
    case "guest_post":
    case "resource_page":
    default:
      return p.best_source_title
        ? `Published "${p.best_source_title}" at ${p.best_source_url}`
        : null;
  }
}

export type DraftBatchResult = {
  drafted: number;
  skipped: number;
  generic: number;
  /** Held back because the address probably belongs to somebody else. */
  lowConfidence: number;
  errors: string[];
};

/**
 * Draft pitches for prospects that have a contact and no message yet.
 *
 * Each drafted pitch also creates the sales-side prospect row, so the send itself
 * goes through the existing vetted path (suppression, daily cap, unsubscribe,
 * pacing) rather than a second one built for links.
 */
export async function draftLinkPitchBatch(
  opts: { limit?: number; minValue?: number } = {},
): Promise<DraftBatchResult> {
  const linkRepo = await import("@/server/db/repos/link-prospects");
  const outreach = await import("@/server/db/repos/outreach");

  const out: DraftBatchResult = { drafted: 0, skipped: 0, generic: 0, lowConfidence: 0, errors: [] };
  const candidates = await linkRepo.listLinkProspects({
    status: "ready",
    hasContact: true,
    minValue: opts.minValue ?? 20,
    limit: opts.limit ?? 25,
  });

  // A low-confidence address is usually one found on a page belonging to a
  // different company: matrixinternet.ie yielded info@matrixinternet.eu at 0.46.
  // Emailing the wrong organisation is worse than emailing nobody, so those wait
  // for a human rather than going out on a guess.
  const minConfidence = Number(process.env.LINK_PITCH_MIN_CONFIDENCE || 0.5);

  for (const p of candidates) {
    if (!p.contact_email) {
      out.skipped++;
      continue;
    }
    // Re-check the address here, not only where it was collected, so a later
    // tightening of the rule also cleans up rows captured before it.
    if (isUnpitchableAddress(p.contact_email)) {
      await linkRepo.saveVetting(p.id, {
        contactEmail: null,
        contactName: null,
        contactSource: null,
        contactConfidence: 0,
        status: "needs_contact",
        notes: `stored address ${p.contact_email} is a do-not-pitch mailbox; cleared`,
      });
      out.skipped++;
      continue;
    }
    if (p.contact_confidence < minConfidence) {
      out.lowConfidence++;
      out.skipped++;
      continue;
    }
    // Honour the suppression list at draft time as well as at send time. Drafting
    // an email to somebody who asked us to stop is pointless work and a liability
    // sitting in the queue.
    if (await outreach.isSuppressed(p.contact_email)) {
      await linkRepo.updateLinkProspectStatus(p.id, "suppressed");
      out.skipped++;
      continue;
    }

    const pitch = draftLinkPitch({
      domain: p.domain,
      contactName: p.contact_name,
      contactEmail: p.contact_email,
      opportunityType: p.opportunity_type,
      bestSourceUrl: p.best_source_url,
      bestSourceTitle: p.best_source_title,
      bestAnchor: p.best_anchor,
      bestTargetUrl: p.best_target_url,
      linksTo: p.links_to,
      acceptsGuestPosts: p.accepts_guest_posts,
      guidelinesUrl: p.guidelines_url,
      authority: p.authority,
      sourceRecipe: p.source_recipe,
      recipeEvidence: p.recipe_evidence,
    });

    if (!pitch.ok) {
      out.skipped++;
      if (pitch.error) out.errors.push(`${p.domain}: ${pitch.error}`);
      continue;
    }
    if (!pitch.specific) out.generic++;

    try {
      // The contact becomes a normal prospect so the whole existing send path,
      // including the suppression check and the daily cap, applies unchanged.
      const prospect = await outreach.upsertProspect({
        email: p.contact_email,
        name: p.contact_name,
        company: p.domain,
        website: p.homepage_url,
        segment: "publisher",
        source: `backlink-mining:${(p.links_to ?? []).join("+") || "competitor-export"}`,
        consentBasis: "legitimate-interest",
        // The one true, specific line about them, phrased for how we found them.
        personalNote: personalNoteFor(p),
        notes: `link opportunity: ${p.opportunity_type}, authority ${p.authority}${
          p.source_recipe ? `, found by the ${p.source_recipe} recipe` : ""
        }, mentions ${(p.links_to ?? []).join(", ")}`,
      });

      await outreach.upsertMessage({
        prospectId: prospect.id,
        step: 1,
        subject: pitch.subject,
        bodyText: pitch.bodyText,
        bodyHtml: pitch.bodyHtml,
        assetUrl: pitch.assetUrl,
        campaign: "link_building",
        linkProspectId: p.id,
      });

      await linkRepo.savePitchPlan(p.id, {
        ourTargetSlug: pitch.ourTargetSlug,
        pitchAngle: pitch.pitchAngle,
        status: "queued",
      });
      await linkRepo.attachProspect(p.id, prospect.id);
      out.drafted++;
    } catch (e) {
      out.errors.push(`${p.domain}: ${String((e as Error)?.message ?? e).slice(0, 140)}`);
    }
  }

  return out;
}
