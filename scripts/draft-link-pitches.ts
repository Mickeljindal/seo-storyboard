/**
 * Draft the outreach pitch for each link opportunity that has a contact.
 *
 *   npx tsx scripts/draft-link-pitches.ts [--limit 25] [--min-value 20]
 *   npx tsx scripts/draft-link-pitches.ts --preview      # show the emails, write nothing
 *
 * Drafts only. Nothing is sent, and nothing is approved. Sending stays behind the
 * existing two switches (dryRun:false AND EMAIL_SEND_ENABLED=1).
 * Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

const arg = (name: string, dflt?: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > -1 ? (process.argv[i + 1] ?? dflt) : dflt;
};
const has = (n: string) => process.argv.includes(n);

async function main() {
  loadProjectEnv();

  const limit = Number(arg("--limit", "25"));
  const minValue = Number(arg("--min-value", "20"));

  const repo = await import("../src/server/db/repos/link-prospects");
  const drafter = await import("../src/lib/link-pitch-drafter");

  if (has("--preview")) {
    const rows = await repo.listLinkProspects({
      status: "ready",
      hasContact: true,
      minValue,
      limit: Number(arg("--limit", "4")),
    });
    if (!rows.length) {
      console.log("Nothing ready. Run find-link-contacts.ts first.");
      return;
    }
    for (const p of rows) {
      const pitch = drafter.draftLinkPitch({
        domain: p.domain,
        contactName: p.contact_name,
        contactEmail: p.contact_email!,
        opportunityType: p.opportunity_type,
        bestSourceUrl: p.best_source_url,
        bestSourceTitle: p.best_source_title,
        bestAnchor: p.best_anchor,
        bestTargetUrl: p.best_target_url,
        linksTo: p.links_to,
        acceptsGuestPosts: p.accepts_guest_posts,
        guidelinesUrl: p.guidelines_url,
        authority: p.authority,
      });
      console.log("=".repeat(78));
      console.log(`${p.domain}  (${p.opportunity_type}, score ${p.value_score}, authority ${p.authority})`);
      console.log(`To: ${p.contact_email}`);
      if (!pitch.ok) {
        console.log(`SKIPPED: ${pitch.error}\n`);
        continue;
      }
      console.log(`Subject: ${pitch.subject}`);
      console.log(`Specific to their page: ${pitch.specific ? "yes" : "NO (generic)"}`);
      console.log("-".repeat(78));
      console.log(pitch.bodyText.replace(/\n{3,}/g, "\n\n"));
      console.log();
    }
    return;
  }

  console.log(`Drafting up to ${limit} pitches (value >= ${minValue})…\n`);
  const r = await drafter.draftLinkPitchBatch({ limit, minValue });

  console.log(`  drafted                    : ${r.drafted}`);
  console.log(`  skipped                    : ${r.skipped}`);
  console.log(`  generic (no page to quote) : ${r.generic}`);
  console.log(`  held: address low confidence: ${r.lowConfidence}`);
  if (r.errors.length) {
    console.log(`\n  errors (${r.errors.length}):`);
    for (const e of r.errors.slice(0, 8)) console.log(`    ${e}`);
  }

  const outreach = await import("../src/server/db/repos/outreach");
  const drafts = await outreach.listMessages({ status: "draft", limit: 500 });
  const links = drafts.filter((d) => d.campaign === "link_building");
  console.log(`\nLink-building drafts waiting for review: ${links.length}`);
  console.log("Read them with:  npx tsx scripts/draft-link-pitches.ts --preview");
  console.log("Nothing is sent until it is approved AND both send switches are on.");
}

main().then(() => process.exit(0));
