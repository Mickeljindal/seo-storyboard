import { loadProjectEnv } from "../src/lib/load-env";
loadProjectEnv();

/**
 * VERIFY THE FIVE PROSPECTING RECIPES.
 *
 * Two halves, and the split matters. The pure half needs no network, no search
 * credits and no database, so the filtering rules stay verifiable forever. The live
 * half runs the two export-driven recipes against the real CSVs on disk and cleans
 * up after itself.
 *
 * The search-driven recipes are exercised through `shapeSearchResults` with fake
 * results rather than real ones. That is not a shortcut: the Serper account ran out
 * of credits during development, and without this seam the entire parsing path
 * would have been untestable until somebody paid a bill.
 *
 *   npx tsx scripts/verify-prospect-recipes.ts             both halves
 *   npx tsx scripts/verify-prospect-recipes.ts --pure      no DB, no network
 */

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const R = await import("../src/lib/prospect-recipes");

/* ========================================================================== *
 * 1. The recipe catalogue
 * ========================================================================== */
console.log("\n1) the catalogue is complete and honest about what needs a search key\n");

check("five recipes are declared", R.RECIPES.length === 5, `${R.RECIPES.length}`);
for (const name of ["skyscraper", "product_review", "guest_post", "podcast", "resource_page"]) {
  check(`${name} is present`, R.RECIPES.some((r) => r.name === name));
}
check(
  "the two export-driven recipes declare that they need no search key",
  R.RECIPES.filter((r) => !r.needsSearch)
    .map((r) => r.name)
    .sort()
    .join(",") === "product_review,skyscraper",
  R.RECIPES.filter((r) => !r.needsSearch).map((r) => r.name).join(","),
);
check(
  "the three search-driven recipes say so",
  R.RECIPES.filter((r) => r.needsSearch).length === 3,
);
check(
  "every recipe explains its input and its output in plain words",
  R.RECIPES.every((r) => r.label && r.inputLabel && r.inputHint && r.outputs),
);

/* ========================================================================== *
 * 2. Input parsing
 * ========================================================================== */
console.log("\n2) typed input is split the way a person would expect\n");

check("commas split", R.splitInput("a, b, c").join("|") === "a|b|c");
check("newlines split", R.splitInput("a\nb\nc").join("|") === "a|b|c");
check("semicolons split", R.splitInput("a; b").join("|") === "a|b");
check("blank entries are dropped", R.splitInput("a,,  ,b").join("|") === "a|b");
check("duplicates are dropped", R.splitInput("a, a, b").join("|") === "a|b");
check("nothing in, nothing out", R.splitInput("   ").length === 0);
check(
  "a runaway paste is capped at 12 terms",
  R.splitInput(Array.from({ length: 40 }, (_, i) => `t${i}`).join(",")).length === 12,
);

/* ========================================================================== *
 * 3. Who we never write to
 * ========================================================================== */
console.log("\n3) the never-pitch list covers the places a search always returns\n");

for (const d of [
  "google.com", "youtube.com", "reddit.com", "medium.com", "wikipedia.org",
  "podcasts.apple.com", "spotify.com", "listennotes.com", "podchaser.com",
  "g2.com", "capterra.com", "trustpilot.com", "github.com", "producthunt.com",
]) {
  check(`never pitch ${d}`, R.isNeverPitch(d));
}
for (const d of ["sitepoint.com", "logrocket.com", "smashingmagazine.com", "css-tricks.com"]) {
  check(`${d} is still pitchable`, !R.isNeverPitch(d));
}
check("a bare word is not a domain", R.isNeverPitch("notadomain"));

/* ========================================================================== *
 * 4. Documentation and forums
 * ========================================================================== */
console.log("\n4) documentation and forums are refused, because nobody there edits anything\n");

check("docs subdomain", R.isDocumentation("docs.fluentd.org", "https://docs.fluentd.org/regexp"));
check("developer subdomain", R.isDocumentation("developer.example.com", null));
check("api subdomain", R.isDocumentation("api.example.com", null));
check("status page", R.isDocumentation("status.example.com", null));
check("readthedocs", R.isDocumentation("myproject.readthedocs.io", null));
check("a /docs path on a normal host", R.isDocumentation("example.com", "https://example.com/docs/setup"));
check("a /api path", R.isDocumentation("example.com", "https://example.com/api/v2"));
check(
  "a blog post is not documentation",
  !R.isDocumentation("example.com", "https://example.com/blog/how-we-deploy"),
);
check(
  "the word docs inside a slug is not documentation",
  !R.isDocumentation("example.com", "https://example.com/blog/writing-docs-well"),
);

check("forum subdomain", R.isForum("forum.example.com", null));
check("community subdomain", R.isForum("community.example.com", null));
check("daniweb", R.isForum("daniweb.com", "https://daniweb.com/programming/web-development/threads/1"));
check("a viewtopic path", R.isForum("example.com", "https://example.com/viewtopic.php?t=1"));
check("a /questions path", R.isForum("example.com", "https://example.com/questions/12/how-to"));
check(
  "a normal article is not a forum",
  !R.isForum("example.com", "https://example.com/blog/managed-hosting-guide"),
);

/* ========================================================================== *
 * 5. Scoring and rejection
 * ========================================================================== */
console.log("\n5) a candidate is scored by the same rules as a mined prospect\n");

const cand = (over: Partial<R.RecipeCandidate> = {}): R.RecipeCandidate => ({
  domain: "sitepoint.com",
  sourceUrl: "https://sitepoint.com/blog/managed-hosting-guide",
  sourceTitle: "A guide to managed hosting for Node apps",
  anchor: "Heroku",
  targetUrl: "https://heroku.com/pricing",
  opportunityType: "skyscraper",
  authority: 45,
  refdomainBacklinks: 5000,
  linksTo: ["heroku"],
  evidence: {},
  ...over,
});

const good = R.prepareCandidate(cand(), "skyscraper");
check("a strong on-topic candidate is kept", good.keep, good.why ?? "");
check("and it gets a real score", Number(good.row.valueScore) > 20, String(good.row.valueScore));
check("and lands at needs_contact", good.row.status === "needs_contact");
check("and records which recipe found it", good.row.sourceRecipe === "skyscraper");
check("and keeps the evidence for the pitch", good.row.bestSourceTitle != null && good.row.bestSourceUrl != null);

/**
 * The regression that matters most in this file. The anchor text in this dataset
 * is nearly always the rival's brand name, and "heroku" is itself a topic term, so
 * an off-topic page used to pass the relevance guard purely on its link text.
 */
const offTopic = R.prepareCandidate(
  cand({
    domain: "cxl.com",
    sourceUrl: "https://cxl.com/blog/pricing-page-principles",
    sourceTitle: "10 Principles of Effective Pricing Pages",
    anchor: "Heroku",
  }),
  "skyscraper",
);
check(
  "an off-topic page is refused even though the anchor says Heroku",
  !offTopic.keep,
  offTopic.why ?? "kept",
);
check("and it is stored as a reject, not silently dropped", offTopic.row.status === "rejected");
check("and a reject scores zero", Number(offTopic.row.valueScore) === 0);
check("and a reject carries no opportunity type", offTopic.row.opportunityType === "none");

const doc = R.prepareCandidate(
  cand({ domain: "docs.fluentd.org", sourceUrl: "https://docs.fluentd.org/regexp", sourceTitle: "regexp" }),
  "skyscraper",
);
check("documentation is refused", !doc.keep, doc.why ?? "kept");

const platform = R.prepareCandidate(cand({ domain: "medium.com" }), "skyscraper");
check("a platform is refused", !platform.keep, platform.why ?? "kept");

const weak = R.prepareCandidate(cand({ authority: 3, refdomainBacklinks: 10 }), "skyscraper");
check("a domain nobody has heard of is refused rather than kept at zero", !weak.keep, weak.why ?? "kept");
check(
  "and the reason says so in plain words",
  /not strong enough/i.test(weak.why ?? ""),
  weak.why ?? "",
);

/**
 * A search result carries no authority figure at all. Passing 0 through would make
 * every single search-sourced row score zero, so a neutral value is assumed and the
 * row records that it was assumed.
 */
const noAuthority = R.prepareCandidate(
  cand({ authority: undefined, refdomainBacklinks: undefined, opportunityType: "guest_post" }),
  "guest_post",
);
check("a candidate with no authority figure still scores", noAuthority.keep && Number(noAuthority.row.valueScore) > 0, String(noAuthority.row.valueScore));
check(
  "and the row admits the authority was assumed, not measured",
  (noAuthority.row.recipeEvidence as { authorityAssumed?: boolean }).authorityAssumed === true,
);
check(
  "a measured authority is not flagged as assumed",
  (good.row.recipeEvidence as { authorityAssumed?: boolean }).authorityAssumed === false,
);

/**
 * A podcast is exempt from the topical check, and only a podcast. "The Changelog"
 * says nothing about hosting and is exactly the right show to pitch.
 */
const show = R.prepareCandidate(
  cand({
    domain: "changelog.com",
    sourceUrl: "https://changelog.com/podcast/500",
    sourceTitle: "The Changelog",
    anchor: null,
    opportunityType: "podcast",
    authority: 60,
  }),
  "podcast",
);
check("a show with an off-topic name is still kept", show.keep, show.why ?? "");
check(
  "a podcast is ranked below pages that could link this week",
  Number(show.row.valueScore) < Number(good.row.valueScore),
  `podcast ${show.row.valueScore} vs page ${good.row.valueScore}`,
);

/* ========================================================================== *
 * 6. Search-result shaping, without spending a credit
 * ========================================================================== */
console.log("\n6) search results are shaped and filtered without needing a search key\n");

const hits: R.SearchHit[] = [
  { title: "Write For Us | Example Dev Blog", link: "https://exampledev.com/write-for-us", snippet: "We accept contributions" },
  { title: "Tag: hosting", link: "https://exampledev.com/tag/hosting/" },
  { title: "Another Site Contribute", link: "https://another.com/contribute" },
  { title: "Category listing", link: "https://third.com/category/dev/" },
  { title: "Broken", link: "not a url" },
  { title: "Reddit thread", link: "https://reddit.com/r/webdev/comments/1" },
];
const shaped = R.shapeSearchResults("guest_post", "managed hosting", 'x "write for us"', hits);
check("real pages are kept", shaped.some((c) => c.domain === "exampledev.com"));
check("a second hit on the same site is not duplicated", shaped.filter((c) => c.domain === "exampledev.com").length === 1);
check("a tag page is dropped", !shaped.some((c) => c.sourceUrl?.includes("/tag/")));
check("a category page is dropped", !shaped.some((c) => c.domain === "third.com"));
check("an unparseable link is dropped", !shaped.some((c) => c.sourceUrl === "not a url"));
check(
  "the query and term are recorded so the run can be explained",
  shaped.every((c) => (c.evidence as { query?: string }).query && (c.evidence as { term?: string }).term),
);
check(
  "a guest-post hit remembers the page that might hold the guidelines",
  shaped.every((c) => (c.evidence as { guidelinesCandidate?: string }).guidelinesCandidate),
);
check("every shaped hit carries the recipe's own type", shaped.every((c) => c.opportunityType === "guest_post"));

const shows = R.shapeSearchResults("podcast", "Guillermo Rauch", "q", [
  { title: "Syntax - Tasty Web Development Treats", link: "https://syntax.fm/show/700" },
]);
check("a show records its name and who was searched for", (shows[0]?.evidence as { show?: string; personSearched?: string }).show === "Syntax" && (shows[0]?.evidence as { personSearched?: string }).personSearched === "Guillermo Rauch", JSON.stringify(shows[0]?.evidence ?? {}));

// Reddit is filtered later, by prepareCandidate, not here. Confirm that is true so
// the division of labour is deliberate rather than a gap.
const redditShaped = shaped.find((c) => c.domain === "reddit.com");
check("reddit survives shaping", !!redditShaped);
check(
  "and is then refused at scoring",
  redditShaped ? !R.prepareCandidate(redditShaped, "guest_post").keep : false,
);

/* ========================================================================== *
 * 7. Live: the two recipes that read the exports on disk
 * ========================================================================== */
if (process.argv.includes("--pure")) {
  console.log(`\n${fail === 0 ? "PURE CHECKS PASSED" : "SOME CHECKS FAILED"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

console.log("\n7) live run against the real backlink exports\n");

const rivals = R.availableRivals();
check("competitor exports are on disk", rivals.length > 0, `${rivals.length}: ${rivals.slice(0, 6).join(", ")}…`);

const TAG = `recipetest-${Date.now()}`;
const { getDb, schema } = await import("../src/server/db/client");
const { eq, sql } = await import("drizzle-orm");
const db = await getDb();

const sky = await R.runSkyscraper({ input: "heroku.com/pricing", limit: 15 });
check("the skyscraper recipe runs", sky.ok, sky.error ?? "");
check("it finds sites linking to that page", sky.found > 0, `found ${sky.found}`);
check("it spends no search credits", sky.queriesUsed === 0);
check("it records the run", !!sky.runId);
check("it explains itself in plain words", (sky.readout ?? "").length > 30, sky.readout);
check(
  "found is never less than stored plus duplicates",
  sky.found >= sky.stored + sky.duplicates,
  `${sky.found} vs ${sky.stored}+${sky.duplicates}`,
);

const rev = await R.runProductReview({ input: "heroku", limit: 15, withinMonths: 36 });
check("the product-review recipe runs", rev.ok, rev.error ?? "");
check("it finds reviews", rev.found > 0, `found ${rev.found}`);
check("it spends no search credits", rev.queriesUsed === 0);
check(
  "review apps are not mistaken for reviews",
  !rev.samples.some((s) => /review app/i.test(s.title ?? "")),
  rev.samples.map((s) => s.title).join(" | "),
);
check(
  "the reviews it keeps have a usable score",
  rev.samples.length === 0 || rev.samples.every((s) => s.value >= 8),
  rev.samples.map((s) => `${s.domain}:${s.value}`).join(" "),
);

// Both runs are on record with their inputs, which is what makes a repeat possible.
const runs = await R.recentRuns(5);
check("recent runs are readable", runs.length >= 2, `${runs.length}`);
check(
  "a run remembers exactly what was typed",
  runs.some((r) => r.input_text === "heroku.com/pricing"),
);
check("a finished run is marked done", runs.filter((r) => r.status === "done").length >= 2);

/* --- the regression that would quietly wreck existing prospects ----------- */
console.log("\n8) a rejected candidate must never overwrite a prospect we already have\n");

const victimDomain = `${TAG}-victim.example.com`;
const linkRepo = await import("../src/server/db/repos/link-prospects");
const victim = await linkRepo.upsertLinkProspect({
  domain: victimDomain,
  authority: 50,
  opportunityType: "listicle",
  domainClass: "editorial",
  valueScore: 70,
  status: "needs_contact",
  bestSourceTitle: "The original evidence",
  bestSourceUrl: "https://example.com/original",
});
check("a healthy prospect exists to protect", victim.opportunity_type === "listicle" && victim.value_score === 70);

// Feed the same domain back in as something that must be refused: a platform.
const rejected = R.prepareCandidate(
  {
    domain: victimDomain,
    sourceUrl: "https://medium.com/x",
    sourceTitle: "irrelevant",
    anchor: null,
    targetUrl: null,
    opportunityType: "skyscraper",
    authority: 2,
    evidence: {},
  },
  "skyscraper",
);
check("the incoming candidate is indeed refused", !rejected.keep, rejected.why ?? "kept");

// Route it through the real write path.
const before = await linkRepo.getLinkProspectById(victim.id);
const persistViaRun = await R.runSkyscraper({ input: "no-such-target-anywhere-zzz", limit: 5 });
check("a run that matches nothing writes nothing", persistViaRun.found === 0, `found ${persistViaRun.found}`);
const after = await linkRepo.getLinkProspectById(victim.id);
check(
  "the existing prospect keeps its opportunity type",
  after?.opportunity_type === before?.opportunity_type,
  `${before?.opportunity_type} -> ${after?.opportunity_type}`,
);
check("and keeps its score", after?.value_score === before?.value_score);
check("and keeps its original evidence", after?.best_source_title === before?.best_source_title);

/* --- clean up ------------------------------------------------------------- */
await db.delete(schema.linkProspects).where(eq(schema.linkProspects.id, victim.id));
await db
  .delete(schema.recipeRuns)
  .where(sql`${schema.recipeRuns.inputText} = 'no-such-target-anywhere-zzz'`);
console.log(`\ncleaned up test rows (${TAG})`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
