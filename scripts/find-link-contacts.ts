/**
 * Find a contact address and guest-post signals for mined link prospects.
 *
 *   npx tsx scripts/find-link-contacts.ts [--limit 25] [--min-value 20]
 *   npx tsx scripts/find-link-contacts.ts --one sitepoint.com
 *
 * Reads other people's public pages only. Honours robots.txt, identifies itself
 * truthfully, paces requests, and never sends anything.
 * Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

const arg = (name: string, dflt?: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > -1 ? (process.argv[i + 1] ?? dflt) : dflt;
};

async function main() {
  loadProjectEnv();

  const one = arg("--one");
  const finder = await import("../src/lib/contact-finder");

  if (one) {
    console.log(`Looking at ${one}…\n`);
    const f = await finder.findContactForDomain(one);
    for (const [k, v] of Object.entries(f)) {
      console.log(`  ${k.padEnd(20)} ${v === null ? "-" : String(v)}`);
    }
    return;
  }

  const limit = Number(arg("--limit", "25"));
  const minValue = Number(arg("--min-value", "20"));

  const repo = await import("../src/server/db/repos/link-prospects");
  const waiting = await repo.listLinkProspects({
    status: "needs_contact",
    minValue,
    needsContact: true,
    limit: 1,
  });
  if (!waiting.length) {
    console.log("Nothing waiting for a contact. Run scripts/mine-backlinks.ts first.");
    return;
  }

  console.log(`Crawling up to ${limit} domains (value >= ${minValue}), best first.`);
  console.log("Honouring robots.txt, ~1.2s between requests. This is deliberately slow.\n");

  const t0 = Date.now();
  const r = await finder.crawlContacts({ limit, minValue });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);

  console.log(`Done in ${mins} min.`);
  console.log(`  looked at              : ${r.attempted}`);
  console.log(`  found an address       : ${r.withContact}`);
  console.log(`  openly take guest posts: ${r.acceptsGuestPosts}`);
  console.log(`  blocked by bot defence : ${r.blocked}   (real sites, kept for a human)`);
  console.log(`  not reachable          : ${r.dead}`);
  console.log(`  not in English         : ${r.nonEnglish}`);
  console.log(`  address obfuscated     : ${r.obfuscated}  (left alone on purpose)`);
  if (r.errors.length) {
    console.log(`\n  errors (${r.errors.length}):`);
    for (const e of r.errors.slice(0, 8)) console.log(`    ${e}`);
  }

  const ready = await repo.countLinkProspects("ready");
  console.log(`\nReady to pitch: ${ready}`);
  console.log("Next: draft the pitches with  npx tsx scripts/draft-link-pitches.ts");
}

main().then(() => process.exit(0));
