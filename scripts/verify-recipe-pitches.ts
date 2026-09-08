import { loadProjectEnv } from "../src/lib/load-env";
loadProjectEnv();

/**
 * VERIFY THE PER-RECIPE PITCH WORDING.
 *
 * Entirely pure: no network, no database, no search credits. `draftLinkPitch` is a
 * deterministic template function, so the wording it produces can be asserted
 * directly, which is the only way to keep promises like "a podcast pitch never
 * asks for a link" from quietly rotting.
 *
 * Most of these assertions exist because the alternative wording would be either
 * dishonest or embarrassing, not because it would crash.
 *
 *   npx tsx scripts/verify-recipe-pitches.ts
 */

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const { draftLinkPitch, personalNoteFor } = await import("../src/lib/link-pitch-drafter");

type Input = Parameters<typeof draftLinkPitch>[0];
const base: Input = {
  domain: "sitepoint.com",
  contactName: "Jane Doe",
  contactEmail: "editor@sitepoint.com",
  opportunityType: "editorial_mention",
  bestSourceUrl: "https://sitepoint.com/blog/node-deployment-guide",
  bestSourceTitle: "How to deploy a Node app properly",
  bestAnchor: "Heroku",
  bestTargetUrl: "https://heroku.com/pricing",
  linksTo: ["heroku"],
  authority: 60,
};

/* ========================================================================== *
 * 1. Each recipe produces its own wording
 * ========================================================================== */
console.log("\n1) each recipe gets its own email, not the generic one\n");

const sky = draftLinkPitch({
  ...base,
  opportunityType: "skyscraper",
  sourceRecipe: "skyscraper",
  recipeEvidence: { citedUrl: "https://heroku.com/pricing", citedRival: "heroku" },
});
const rev = draftLinkPitch({
  ...base,
  opportunityType: "product_review",
  sourceRecipe: "product_review",
  bestSourceTitle: "Heroku review: what it costs once you leave the free tier",
  recipeEvidence: { reviewed: "heroku", reviewTitle: "Heroku review" },
});
const pod = draftLinkPitch({
  ...base,
  domain: "syntax.fm",
  contactEmail: "hello@syntax.fm",
  opportunityType: "podcast",
  sourceRecipe: "podcast",
  bestSourceTitle: "Syntax",
  recipeEvidence: { show: "Syntax", personSearched: "Guillermo Rauch" },
});
const guest = draftLinkPitch({ ...base, opportunityType: "guest_post", acceptsGuestPosts: true });
const resource = draftLinkPitch({ ...base, opportunityType: "resource_page" });
const listicle = draftLinkPitch({ ...base, opportunityType: "listicle" });
const generic = draftLinkPitch({ ...base, opportunityType: "editorial_mention" });

for (const [name, p] of Object.entries({ sky, rev, pod, guest, resource, listicle, generic })) {
  check(`${name} drafts successfully`, p.ok, p.error ?? "");
  check(`${name} has a subject and a body`, !!p.subject && p.bodyText.length > 150);
  check(`${name} carries an unsubscribe line`, /unsubscribe/i.test(p.bodyText));
}

const subjects = [sky, rev, pod, guest, resource, listicle, generic].map((p) => p.subject);
check(
  "all seven subjects are different from each other",
  new Set(subjects).size === 7,
  subjects.join(" || "),
);

/* ========================================================================== *
 * 2. The skyscraper email
 * ========================================================================== */
console.log("\n2) the skyscraper email names the page they cited and claims nothing about being better\n");

check("it mentions the page they cited", /heroku\.com/i.test(sky.bodyText), sky.subject);
check("it quotes their own article title", sky.bodyText.includes("How to deploy a Node app properly"));
/**
 * The assertion that matters. "Ours is better than the one you linked" is
 * unverifiable, it is what every skyscraper email says, and an editor who chose
 * that link will stop reading. The honest move is to name a gap.
 */
check(
  "it never claims our page is better than theirs",
  !/\b(better than|superior|more comprehensive|more in.?depth|beats|outranks)\b/i.test(sky.bodyText),
  (sky.bodyText.match(/\b(better than|superior|more comprehensive|beats)\b/i) ?? []).join(),
);
check(
  "it frames the offer as a gap rather than a replacement",
  /doesn't answer|leaves out|question it/i.test(sky.bodyText),
);
check("it gives them an easy way out", /ignore this|won't chase/i.test(sky.bodyText));

/* ========================================================================== *
 * 3. The product-review email
 * ========================================================================== */
console.log("\n3) the review email offers no incentive and asks for no kind words\n");

check("it names what they reviewed", /heroku/i.test(rev.bodyText), rev.subject);
/**
 * A paid or incentivised review is a link scheme with better manners, and it is
 * ruled out. So the email must not offer money, a gift, an affiliate cut or an
 * exchange of any kind.
 */
check(
  "it offers no payment, gift, commission or exchange",
  !/\b(paid|payment|compensat|sponsor|fee|affiliate|commission|discount|coupon|gift|in exchange|in return for)\b/i.test(
    rev.bodyText.replace(/no payment either direction/i, ""),
  ),
  (rev.bodyText.match(/\b(paid|sponsor|affiliate|commission|in exchange)\b/i) ?? []).join(),
);
check("it says outright that no payment is involved", /no payment either direction/i.test(rev.bodyText));
check("it asks for no link", /no link/i.test(rev.bodyText));
check(
  "it explicitly invites a negative verdict",
  /falls short, write that|no expectation of a kind word/i.test(rev.bodyText),
);
check(
  "it offers only the trial we actually have",
  /three-day trial/i.test(rev.bodyText) && !/free (month|year)|extended access|comped/i.test(rev.bodyText),
);

/* ========================================================================== *
 * 4. The podcast email
 * ========================================================================== */
console.log("\n4) the podcast email asks to appear, never for a link\n");

check("it names the show", /Syntax/.test(pod.subject) || /Syntax/.test(pod.bodyText), pod.subject);
check(
  "it says how we found them, rather than being coy about it",
  /Guillermo Rauch/.test(pod.bodyText),
);
/**
 * The whole point of a separate body. A show that receives a link request has
 * learned that nobody at our end listened to it.
 */
check(
  "it never asks for a link, a mention or a backlink",
  !/\b(backlink|add (a|the) link|link to (us|our)|include (a|our) link|mention us)\b/i.test(pod.bodyText),
  (pod.bodyText.match(/\b(backlink|link to us|mention us)\b/i) ?? []).join(),
);
check(
  "it does not paste an article URL as the ask",
  !/kloudbean\.com\/blog\//i.test(pod.bodyText),
  (pod.bodyText.match(/kloudbean\.com\/blog\/\S*/i) ?? []).join(),
);
check("it offers to make the host's job easier", /questions you could ask/i.test(pod.bodyText));
check("it promises not to pitch the product on air", /not our product/i.test(pod.bodyText));

/* ========================================================================== *
 * 5. The guest-post override must not hijack a podcast
 * ========================================================================== */
console.log("\n5) a show that also runs a blog is still pitched as a show\n");

const podWithBlog = draftLinkPitch({
  ...base,
  domain: "syntax.fm",
  contactEmail: "hello@syntax.fm",
  opportunityType: "podcast",
  // Plenty of shows also run a blog that takes contributions. The contact crawler
  // would have set this flag from a "write for us" link.
  acceptsGuestPosts: true,
  guidelinesUrl: "https://syntax.fm/write-for-us",
  sourceRecipe: "podcast",
  bestSourceTitle: "Syntax",
  recipeEvidence: { show: "Syntax", personSearched: "Guillermo Rauch" },
});
check(
  "acceptsGuestPosts does not turn a podcast pitch into an article pitch",
  podWithBlog.subject === pod.subject,
  `${podWithBlog.subject} vs ${pod.subject}`,
);
check(
  "and it still reads as a guest-appearance ask",
  /guest idea|episode/i.test(podWithBlog.bodyText),
);
// The override is still correct for everything else.
const listicleThatTakesPosts = draftLinkPitch({
  ...base,
  opportunityType: "listicle",
  acceptsGuestPosts: true,
});
check(
  "but a listicle site that takes contributions IS pitched a contribution",
  listicleThatTakesPosts.subject === guest.subject,
  listicleThatTakesPosts.subject,
);

/* ========================================================================== *
 * 6. An unwired type must not silently become the generic email
 * ========================================================================== */
console.log("\n6) every declared opportunity type has its own body wired up\n");

for (const t of [
  "listicle", "resource_page", "guest_post", "broken_link", "editorial_mention",
  "skyscraper", "product_review", "podcast",
]) {
  const p = draftLinkPitch({ ...base, opportunityType: t, sourceRecipe: t, recipeEvidence: { show: "Syntax", reviewed: "heroku", citedUrl: "https://heroku.com/x" } });
  check(`${t} produces a draft`, p.ok, p.error ?? "");
}
// A genuinely unknown type falls back on purpose, and that fallback is a decision
// rather than the tail of an if-chain.
const unknown = draftLinkPitch({ ...base, opportunityType: "something_new_nobody_wired" });
check("an unknown type still produces a usable email", unknown.ok);
check("and it is the generic editorial one", unknown.subject === generic.subject, unknown.subject);
// A directory is still refused outright.
const dir = draftLinkPitch({ ...base, opportunityType: "directory_listing" });
check("a directory listing is still refused", !dir.ok, dir.error ?? "drafted");

/* ========================================================================== *
 * 7. The follow-up argues the same point as the first email
 * ========================================================================== */
console.log("\n7) a follow-up keeps the recipe's angle instead of drifting to the generic one\n");

const podInput: Input = {
  ...base,
  domain: "syntax.fm",
  contactEmail: "hello@syntax.fm",
  opportunityType: "podcast",
  sourceRecipe: "podcast",
  bestSourceTitle: "Syntax",
  recipeEvidence: { show: "Syntax", personSearched: "Guillermo Rauch" },
};
const podStep2 = draftLinkPitch(podInput, 2);
check("the follow-up is a reply, not a fresh email", podStep2.subject.startsWith("Re: "));
check(
  "and it is a reply to the SAME subject",
  podStep2.subject === `Re: ${pod.subject}`,
  `${podStep2.subject} vs Re: ${pod.subject}`,
);
check("it still reads as a podcast note", /Syntax/.test(podStep2.bodyText));
check("it still asks for no link", !/backlink|link to us/i.test(podStep2.bodyText));
check("it promises to stop after this one", /won't email again|leave it/i.test(podStep2.bodyText));
check(
  "the article it points at has not changed between the two touches",
  podStep2.ourTargetSlug === pod.ourTargetSlug,
  `${pod.ourTargetSlug} -> ${podStep2.ourTargetSlug}`,
);

const revStep2 = draftLinkPitch(
  {
    ...base,
    opportunityType: "product_review",
    sourceRecipe: "product_review",
    recipeEvidence: { reviewed: "heroku", reviewTitle: "Heroku review" },
  },
  2,
);
check("a review follow-up still names what they reviewed", /heroku/i.test(revStep2.bodyText));

/**
 * The regression this whole design exists to prevent: if the evidence is missing,
 * the follow-up must still be coherent rather than referring to a show it cannot
 * name. Reads as a graceful degradation, not as a broken mail-merge.
 */
const podNoEvidence = draftLinkPitch({
  ...podInput,
  bestSourceTitle: null,
  recipeEvidence: null,
});
check("a podcast pitch with no evidence still drafts", podNoEvidence.ok);
check(
  "and it does not leave a hole where the show name should be",
  !/undefined|null|""/.test(podNoEvidence.bodyText) && /your show/i.test(podNoEvidence.bodyText),
  podNoEvidence.subject,
);

/* ========================================================================== *
 * 8. The personal note, which decides whether a draft can auto-approve
 * ========================================================================== */
console.log("\n8) the personal note is phrased for how we found them\n");

const note = (over: Parameters<typeof personalNoteFor>[0]) => personalNoteFor(over);

const podNote = note({
  source_recipe: "podcast",
  best_source_title: "Syntax",
  best_source_url: "https://syntax.fm/show/700",
  recipe_evidence: { show: "Syntax", personSearched: "Guillermo Rauch" },
  domain: "syntax.fm",
});
check("a podcast note says it is a podcast", /podcast "Syntax"/.test(podNote ?? ""), podNote ?? "null");
check("and does not claim they published an article", !/Published/i.test(podNote ?? ""));
check("and records who was on it", /Guillermo Rauch/.test(podNote ?? ""));

const revNote = note({
  source_recipe: "product_review",
  best_source_title: "Heroku review",
  best_source_url: "https://x.com/r",
  recipe_evidence: { reviewed: "heroku", reviewTitle: "Heroku review" },
  domain: "x.com",
});
check("a review note records what they reviewed", /Reviewed heroku/i.test(revNote ?? ""), revNote ?? "null");

const skyNote = note({
  source_recipe: "skyscraper",
  best_source_title: "Node deploy guide",
  best_source_url: "https://x.com/g",
  recipe_evidence: { citedUrl: "https://heroku.com/pricing" },
  domain: "x.com",
});
check("a skyscraper note records what they cited", /links to https:\/\/heroku\.com\/pricing/.test(skyNote ?? ""), skyNote ?? "null");

const plainNote = note({
  source_recipe: null,
  best_source_title: "Some guide",
  best_source_url: "https://x.com/a",
  recipe_evidence: null,
  domain: "x.com",
});
check("a mined prospect keeps the original wording", plainNote === `Published "Some guide" at https://x.com/a`, plainNote ?? "null");

const emptyNote = note({
  source_recipe: "skyscraper",
  best_source_title: null,
  best_source_url: null,
  recipe_evidence: null,
  domain: "x.com",
});
check(
  "with nothing specific to say it returns null rather than inventing something",
  emptyNote === null,
  String(emptyNote),
);

/* ========================================================================== *
 * 9. Nothing overclaims about the product
 * ========================================================================== */
console.log("\n9) no banned claim slips into any of the new wording\n");

const banned: { re: RegExp; why: string }[] = [
  { re: /\b100%\s*(uptime|secure)/i, why: "absolute uptime or security claim" },
  { re: /\bnever fails?\b/i, why: "never fails" },
  { re: /\bguarantee(d|s)?\b/i, why: "a guarantee" },
  { re: /\b(certified|certification)\b/i, why: "a compliance certification claim" },
  { re: /\bmakes you compliant\b/i, why: "makes you compliant" },
  { re: /\b(best|fastest|most secure|most reliable|unbeatable|industry.?leading)\b/i, why: "an unverifiable superlative" },
  { re: /\bunlimited\b/i, why: "an unqualified unlimited claim" },
  { re: /\bprivate network(ing)?\b/i, why: "private networking presented as a default" },
  { re: /\bVPC\b/, why: "VPC presented as a default" },
];
for (const [name, p] of Object.entries({ sky, rev, pod, guest, resource, listicle, generic, podStep2, revStep2 })) {
  for (const b of banned) {
    check(`${name}: no ${b.why}`, !b.re.test(p.bodyText), (p.bodyText.match(b.re) ?? []).join());
  }
}

/* ========================================================================== *
 * 10. A podcast with nothing hosting-shaped to go on
 * ========================================================================== */
console.log("\n10) an unmatched podcast gets an argument, not a product pitch\n");

const bareShow = draftLinkPitch({
  domain: "syntax.fm",
  contactName: "Wes",
  contactEmail: "hello@syntax.fm",
  opportunityType: "podcast",
  sourceRecipe: "podcast",
  // A show's title and URL say nothing about hosting, which is the normal case.
  bestSourceUrl: "https://syntax.fm/show/700",
  bestSourceTitle: "Syntax",
  recipeEvidence: { show: "Syntax", personSearched: "Guillermo Rauch" },
});
check("it drafts", bareShow.ok, bareShow.error ?? "");
check(
  "it does not fall back to the agency product pitch",
  bareShow.ourTargetSlug !== "how-agencies-host-20-client-apps",
  bareShow.ourTargetSlug,
);
check(
  "it offers the Kubernetes argument instead",
  bareShow.ourTargetSlug === "managed-cloud-vs-diy-devops",
  bareShow.ourTargetSlug,
);
check(
  "and the topic reads as a position rather than a feature list",
  /do not need Kubernetes/i.test(bareShow.bodyText),
);
check(
  "which no longer contradicts the promise not to pitch the product",
  /not our product/i.test(bareShow.bodyText) &&
    !/seven clouds|no cap on applications/i.test(bareShow.bodyText),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
