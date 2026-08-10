/**
 * CLI: report what is actually in the engine DB, grouped by status.
 *
 *   npx tsx scripts/report-article-status.ts
 *
 * PGlite is single-connection, so run this with the dev server STOPPED.
 */
import fs from "node:fs";
import path from "node:path";
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

async function main() {
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  const rows: Array<{
    status: string | null;
    approval_status: string | null;
    n: number;
  }> = await db.execute(
    `select status, approval_status, count(*)::int as n
       from articles
      group by status, approval_status
      order by n desc`,
  ).then((r: any) => r.rows ?? r);

  const total: Array<{ n: number }> = await db
    .execute(`select count(*)::int as n from articles`)
    .then((r: any) => r.rows ?? r);

  const withBody: Array<{ n: number }> = await db
    .execute(
      `select count(*)::int as n from articles
        where content_html is not null and length(content_html) > 500`,
    )
    .then((r: any) => r.rows ?? r);

  console.log(`\nTOTAL articles in engine: ${total[0]?.n ?? 0}`);
  console.log(`With real body content:   ${withBody[0]?.n ?? 0}\n`);
  console.log("status            approval_status   count");
  console.log("-".repeat(48));
  for (const r of rows) {
    console.log(
      `${String(r.status ?? "-").padEnd(18)}${String(r.approval_status ?? "-").padEnd(18)}${r.n}`,
    );
  }
  console.log("");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
