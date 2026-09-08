/**
 * Check whether the links we asked for actually appeared.
 *
 *   npx tsx scripts/verify-link-placements.ts [--limit 20]
 *   npx tsx scripts/verify-link-placements.ts --url https://example.com/best-hosting
 *   npx tsx scripts/verify-link-placements.ts --self-test
 *
 * Reads other people's public pages only. Sends nothing, changes nothing on their
 * side. Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? (process.argv[i + 1] ?? d) : d;
};
const has = (n: string) => process.argv.includes(n);

/**
 * Assertions on the parser, which is where the subtle mistakes live.
 * No network and no database, so this is safe to run any time.
 */
async function selfTest() {
  const { findOurLinks, isFollowedRel } = await import("../src/lib/link-verifier");
  let pass = 0;
  let fail = 0;
  const ok = (label: string, cond: boolean, detail = "") => {
    if (cond) {
      pass++;
      console.log(`  PASS  ${label}`);
    } else {
      fail++;
      console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    }
  };
  const D = ["kloudbean.com"];

  console.log("what counts as a link\n");
  ok(
    "a plain anchor to us is found",
    findOurLinks('<a href="https://www.kloudbean.com/blog/x/">Kloudbean</a>', D).length === 1,
  );
  ok(
    "the anchor text is captured",
    findOurLinks('<a href="https://kloudbean.com/">managed cloud</a>', D)[0]?.anchor ===
      "managed cloud",
  );
  ok(
    "nested markup inside the anchor is stripped",
    findOurLinks('<a href="https://kloudbean.com/"><strong>Klou</strong>dbean</a>', D)[0]
      ?.anchor === "Kloudbean",
  );
  ok(
    "a protocol-relative href is found",
    findOurLinks('<a href="//kloudbean.com/x">k</a>', D).length === 1,
  );
  ok(
    "a subdomain of ours counts",
    findOurLinks('<a href="https://docs.kloudbean.com/x">k</a>', D).length === 1,
  );

  console.log("\nwhat must NOT count as a link\n");
  ok(
    "our name in plain text is not a link",
    findOurLinks("<p>We host with Kloudbean at kloudbean.com and like it.</p>", D).length === 0,
  );
  ok(
    "a canonical tag is not a link",
    findOurLinks('<link rel="canonical" href="https://kloudbean.com/" />', D).length === 0,
  );
  ok(
    "our URL inside JSON-LD is not a link",
    findOurLinks('<script type="application/ld+json">{"url":"https://kloudbean.com/"}</script>', D)
      .length === 0,
  );
  ok(
    "a lookalike domain is not us",
    findOurLinks('<a href="https://kloudbean.com.evil.example/">k</a>', D).length === 0,
  );
  ok(
    "a domain that merely ends with our name is not us",
    findOurLinks('<a href="https://notkloudbean.com/">k</a>', D).length === 0,
  );
  ok("a relative href cannot point at us", findOurLinks('<a href="/blog/x">k</a>', D).length === 0);

  console.log("\nfollowed versus not\n");
  ok("no rel means followed", isFollowedRel(null) === true);
  ok('rel="noopener" is still followed', isFollowedRel("noopener noreferrer") === true);
  ok("nofollow is not followed", isFollowedRel("nofollow") === false);
  ok("sponsored is not followed", isFollowedRel("sponsored") === false);
  ok("ugc is not followed", isFollowedRel("ugc") === false);
  ok("a mixed rel with nofollow is not followed", isFollowedRel("noopener nofollow") === false);

  console.log("\nwhich link is chosen when there are several\n");
  const many = findOurLinks(
    '<a href="https://kloudbean.com/a" rel="nofollow">a</a><a href="https://kloudbean.com/b">b</a>',
    D,
  );
  ok("both are found", many.length === 2, String(many.length));
  ok(
    "the followed one is identifiable",
    many.find((l) => isFollowedRel(l.rel))?.href === "https://kloudbean.com/b",
  );

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

async function main() {
  loadProjectEnv();

  if (has("--self-test")) {
    await selfTest();
    return;
  }

  const one = arg("--url");
  const verifier = await import("../src/lib/link-verifier");

  if (one) {
    console.log(`Checking ${one}\nLooking for links to: ${verifier.ourDomains().join(", ")}\n`);
    const f = await verifier.checkPageForOurLink(one);
    for (const [k, v] of Object.entries(f)) {
      console.log(`  ${k.padEnd(16)} ${v === null ? "-" : String(v)}`);
    }
    return;
  }

  const limit = Number(arg("--limit", "20"));
  const repo = await import("../src/server/db/repos/link-checks");
  const due = await repo.listDueForVerification(limit);

  if (!due.length) {
    console.log("Nothing due for a link check. Prospects become due once they are emailed.");
    return;
  }

  console.log(`Checking up to ${limit} pages, ~1.5s apart. This is deliberately slow.\n`);
  const t0 = Date.now();
  const r = await verifier.verifyLinks({ limit });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);

  console.log(`Done in ${mins} min.`);
  console.log(`  pages checked        : ${r.checked}`);
  console.log(`  link is there        : ${r.found}`);
  console.log(`  ...newly found       : ${r.newlyFound}`);
  console.log(`  ...but nofollow      : ${r.nofollow}   (real, but passes no credit)`);
  console.log(`  no link yet          : ${r.stillMissing}`);
  console.log(`  LINK DISAPPEARED     : ${r.lost}`);
  console.log(`  blocked, needs a human: ${r.blocked}`);
  if (r.errors.length) {
    console.log(`\n  errors (${r.errors.length}):`);
    for (const e of r.errors.slice(0, 6)) console.log(`    ${e}`);
  }

  const s = await repo.verificationSummary();
  console.log(
    `\nOverall: ${s.liveFollowed} live followed, ${s.liveNofollow} nofollow, ${s.lost} lost, ${s.neverChecked} never checked.`,
  );
}

main().then(() => process.exit(process.exitCode ?? 0));
