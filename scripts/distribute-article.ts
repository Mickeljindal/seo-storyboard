#!/usr/bin/env -S npx tsx
/**
 * Build the full channel pack for an article: every social, community, and
 * syndication asset plus an email draft, assembled from copy that already passed
 * the article's own review gates.
 *
 *   npx tsx scripts/distribute-article.ts <slug>
 *   npx tsx scripts/distribute-article.ts <slug> --channels linkedin,x_thread,reddit
 *   npx tsx scripts/distribute-article.ts <slug> --email        # also draft the broadcast
 *   npx tsx scripts/distribute-article.ts --channels-list       # show the catalogue
 *
 * Nothing is posted or sent. Assets are saved as drafts and printed here so they
 * can be copied straight out.
 */
import { loadProjectEnv } from "../src/lib/load-env";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  loadProjectEnv();

  if (process.argv.includes("--channels-list")) {
    const { CHANNELS } = await import("../src/lib/distribution-channels");
    console.log("CHANNEL CATALOGUE\n");
    for (const c of CHANNELS) {
      console.log(`  ${c.id.padEnd(20)} ${c.kind.padEnd(12)} self-promo: ${c.selfPromo}`);
      console.log(`  ${"".padEnd(20)} ${c.note}`);
      if (c.requiresCanonical) console.log(`  ${"".padEnd(20)} REQUIRES a canonical URL back to us.`);
      console.log("");
    }
    return;
  }

  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) {
    console.error("Usage: npx tsx scripts/distribute-article.ts <slug> [--channels a,b] [--email]");
    process.exit(1);
  }

  const articlesRepo = await import("../src/server/db/repos/articles");
  const all = await articlesRepo.listArticles({ limit: 2000 });
  const article = all.find((a) => a.url_slug === slug);
  if (!article) {
    console.error(`No article in the engine with slug "${slug}". Sync content-studio first.`);
    process.exit(1);
  }

  const channelsArg = arg("--channels");
  const { planDistribution, planEmailBroadcast } = await import("../src/lib/distribution-plan");
  const plan = await planDistribution(article.id, {
    channels: channelsArg ? channelsArg.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
  });
  if (!plan.ok) {
    console.error(plan.error);
    process.exit(1);
  }

  console.log(`ARTICLE : ${article.title}`);
  console.log(`URL     : ${plan.url}`);
  console.log(`SAVED   : ${plan.saved} channel draft(s)\n`);

  for (const a of plan.assets) {
    console.log("=".repeat(78));
    console.log(`${a.channel.toUpperCase()}${a.subject ? `  ·  subject: ${a.subject}` : ""}`);
    if (a.canonicalUrl) console.log(`canonical: ${a.canonicalUrl}`);
    console.log(`rule: ${a.guidance}`);
    console.log("-".repeat(78));
    if (a.parts?.length) {
      a.parts.forEach((p, i) => console.log(`${i + 1}/${a.parts!.length}  ${p}\n`));
    } else {
      console.log(a.body);
    }
    console.log("");
  }

  if (process.argv.includes("--email")) {
    const b = await planEmailBroadcast(article.id, { url: plan.url });
    if (b.ok) {
      console.log("=".repeat(78));
      console.log(`EMAIL BROADCAST drafted (id ${b.broadcastId})`);
      console.log(`subject: ${b.subject}`);
      console.log("Status is draft and dry-run. Approve it before anything can send.");
    } else {
      console.log(`email draft failed: ${b.error}`);
    }
  }
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
