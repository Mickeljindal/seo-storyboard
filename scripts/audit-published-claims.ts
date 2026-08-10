/**
 * Run the REAL production claim gate across every published article.
 *
 *   npx tsx scripts/audit-published-claims.ts
 *   npm run audit:claims
 *
 * WHY THIS EXISTS
 * scripts/test-claim-gate.ts proves the gate behaves on hand-written examples.
 * This proves it behaves on the actual library, which is a different question.
 * The 288 shipped articles are the largest corpus of real, human-reviewed,
 * on-topic prose available, so they are the best available false-positive test
 * for a regex gate.
 *
 * It has already earned its keep. The first run reported 11 blocked articles,
 * every one a false positive, which exposed four defects in the gate:
 *
 *   1. Patterns ran against the whole document, so a denial ("no host can make
 *      you PCI compliant") was indistinguishable from the claim.
 *   2. Compliance vocabulary is topic vocabulary. "SOC 2 compliant hosting" is
 *      an H1, a target keyword, and a link anchor throughout the enterprise
 *      cluster, so the gate needed a first-party ASSERTION, not a keyword hit.
 *   3. `[^.]{0,N}` windows crossed newlines and swallowed frontmatter keyword
 *      lists.
 *   4. The unsupported-provider check had no word boundaries, so "we" matched
 *      inside "lowest", and no comparison-frame guard, so a "X vs Kloudbean"
 *      page was flagged for naming X.
 *
 * That failure mode is worse than a missed violation. A false positive feeds
 * buildRevisionInstructions() a mandatory fix, and the auto-revise loop then
 * rewrites a correct, carefully-hedged sentence into something less accurate.
 *
 * Expected output is 0 blocked. A non-zero count means either a real claim
 * problem in an article or a new regression in the gate. Read the sentence
 * before believing the gate: check which it is, then add the case to
 * test-claim-gate.ts so it stays fixed.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { scoreContent } from "../src/lib/content-scorecard";

const CS = join(process.cwd(), "content-studio");

const slugs = readdirSync(CS)
  .filter((d) => {
    if (d.startsWith(".") || d.startsWith("_") || d === "assets") return false;
    const p = join(CS, d);
    return statSync(p).isDirectory() && existsSync(join(p, `${d}.md`));
  })
  .sort();

const flagged: { slug: string; claims: string[] }[] = [];

for (const slug of slugs) {
  const markdown = readFileSync(join(CS, slug, `${slug}.md`), "utf8");
  const { bannedClaims } = scoreContent({
    markdown,
    targetKeyword: slug.replace(/-/g, " "),
    geo: "us",
    wordCountTarget: 1600,
  });
  if (bannedClaims.length) flagged.push({ slug, claims: bannedClaims });
}

console.log(`Articles scored:  ${slugs.length}`);
console.log(`Blocked by gate:  ${flagged.length}`);

if (flagged.length) {
  console.log("\nFlagged:");
  for (const { slug, claims } of flagged) {
    console.log(`\n  ${slug}`);
    for (const c of claims) console.log(`      ${c}`);
  }
  console.log(
    "\nBefore editing an article, read the flagged sentence. If the gate is " +
      "wrong, fix the pattern and add the sentence to scripts/test-claim-gate.ts.",
  );
  process.exit(1);
}

console.log("\nNo claim violations in the published library.");
