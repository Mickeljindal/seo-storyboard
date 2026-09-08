/**
 * Show the most recent growth jobs and what they returned. Diagnostic only:
 * answers "did the automation actually run, and what did each task do?"
 *
 * Run with the dev server STOPPED. PGlite allows a single writer, and a second
 * process attaching to the same data directory fails noisily.
 */
import { loadProjectEnv } from "../src/lib/load-env";

async function main() {
  loadProjectEnv();
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  const rows: any = await db.execute(
    `select id, type, status, attempts, label, result, error,
            to_char(created_at,'HH24:MI:SS') as created,
            to_char(finished_at,'HH24:MI:SS') as finished
     from jobs
     where type in ('crawl_trends','crawl_reddit_threads','draft_reddit_replies','crawl_communities','prune_trends','distribute_article')
     order by id desc limit 15`,
  );
  const list = rows.rows ?? rows;
  if (!list.length) {
    console.log("No growth jobs found at all — nothing was ever enqueued.");
  }
  for (const r of list) {
    console.log(`#${r.id} ${r.type} [${r.status}] attempts=${r.attempts} ${r.created}→${r.finished ?? "-"}`);
    if (r.result) console.log(`     result: ${JSON.stringify(r.result).slice(0, 300)}`);
    if (r.error) console.log(`     ERROR : ${String(r.error).slice(0, 400)}`);
  }

  const s: any = await db.execute(
    `select key, value from app_settings where key like 'growth.%' order by key`,
  );
  console.log("\n--- cadence stamps ---");
  for (const r of s.rows ?? s) console.log(`  ${r.key} = ${r.value}`);

  const o: any = await db.execute(
    `select count(*) as total,
            count(draft_reply) as with_reply,
            count(*) filter (where status='new') as new_ones
     from reddit_opportunities`,
  );
  const c = (o.rows ?? o)[0];
  console.log(
    `\nreddit_opportunities: total=${c.total} new=${c.new_ones} with_draft_reply=${c.with_reply}`,
  );
}

main().then(() => process.exit(0));
