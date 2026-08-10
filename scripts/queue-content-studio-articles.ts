/**
 * CLI: put every ingested content-studio article into the publish review queue,
 * so they show up in the app ready for a human to approve and publish.
 *
 *   npx tsx scripts/queue-content-studio-articles.ts --dry-run
 *   npx tsx scripts/queue-content-studio-articles.ts
 *
 * Deliberate design choices:
 *
 *  - Direct SQL, NOT queueForReview(). That function also kicks off background
 *    LinkedIn/X/newsletter draft generation per article, which would mean ~288
 *    LLM jobs. Those drafts can be generated later, per article, on demand.
 *
 *  - scheduled_publish_at is left NULL on purpose. processReviewQueue() computes
 *    `(hours_until_publish ?? 1) <= 0` to decide what is due, so a NULL is never
 *    due. That means even if AUTOPILOT_AUTO_APPROVE_AFTER_HOLD is switched on
 *    later, this batch will not mass-publish itself. Publishing stays a human
 *    action, one article at a time.
 *
 *  - Only touches rows that actually have article body content, and never
 *    touches anything already approved, published, or rejected.
 *
 * PGlite is single-connection, so run with the dev server STOPPED.
 */
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function portOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
    sock.setTimeout(400, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const port = Number(process.env.PORT ?? 3000);
  if ((await portOpen(port)) || (await portOpen(5173))) {
    console.error(
      `[queue] A dev server appears to be running (port ${port}/5173). PGlite is single-connection.\n` +
        `        Stop the dev server and re-run.`,
    );
    process.exit(1);
  }

  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();
  const rows = (r: any) => r.rows ?? r;

  // Candidates: real article bodies, not already moved through the queue.
  const candidates = await db
    .execute(
      `select id, title, url_slug
         from articles
        where content_html is not null
          and length(content_html) > 500
          and coalesce(approval_status, 'none') = 'none'
        order by title`,
    )
    .then(rows);

  console.log(`\nCandidates to queue: ${candidates.length}`);
  if (candidates.length === 0) {
    console.log("Nothing to do.\n");
    process.exit(0);
  }
  console.log("First few:");
  for (const c of candidates.slice(0, 5)) console.log(`  - ${c.url_slug ?? c.title}`);
  if (candidates.length > 5) console.log(`  ... and ${candidates.length - 5} more`);

  if (dryRun) {
    console.log("\n--dry-run: no changes written.\n");
    process.exit(0);
  }

  const res = await db
    .execute(
      `update articles
          set approval_status = 'queued',
              queued_at = now(),
              status = 'review',
              updated_at = now()
        where content_html is not null
          and length(content_html) > 500
          and coalesce(approval_status, 'none') = 'none'`,
    )
    .then((r: any) => r);

  const after = await db
    .execute(
      `select coalesce(approval_status,'none') as approval_status, count(*)::int as n
         from articles
        where content_html is not null and length(content_html) > 500
        group by 1 order by n desc`,
    )
    .then(rows);

  console.log(`\nQueued. Rows affected: ${(res as any).rowCount ?? candidates.length}`);
  console.log("\nContent-bearing articles by approval_status:");
  for (const r of after) console.log(`  ${String(r.approval_status).padEnd(12)}${r.n}`);
  console.log(
    "\nscheduled_publish_at left NULL on purpose, so nothing auto-publishes.\n" +
      "Approve and publish them one at a time from the review queue in the app.\n",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
