import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.DATABASE_URL;
const ssl = /sslmode=require/i.test(url ?? "") ? "require" : false;

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? `: ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}${detail ? `: ${detail}` : ""}`);
}

console.log("=== Kloudbean SEO — full test ===\n");

// 1. Database
let sql;
try {
  sql = postgres(url, { max: 1, ssl, connect_timeout: 15 });
  await sql`SELECT 1`;
  pass("Database connect", url?.replace(/:[^:@]+@/, ":***@"));
} catch (e) {
  fail("Database connect", e.message);
  console.log("\nStopped — fix DATABASE_URL / Kloudbean firewall first.");
  process.exit(1);
}

// 2. Schema
try {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('articles','keywords','raffle_draws','engine_runs')
  `;
  const names = tables.map((t) => t.table_name);
  if (names.includes("articles")) pass("Schema: articles table");
  else fail("Schema: articles table missing — run npm run db:migrate");
} catch (e) {
  fail("Schema check", e.message);
}

// 3. Article count
let articleCount = 0;
try {
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM articles`;
  articleCount = n;
  pass("Articles in DB", String(n));
} catch (e) {
  fail("Articles count", e.message);
}

// 4. Raffle pool query (same as app)
try {
  const pool = await sql`
    SELECT id, title, cluster_id, anchor, status
    FROM articles
    WHERE status = 'idea'
    LIMIT 10
  `;
  pass("Raffle pool query", `${pool.length} ideas (sample)`);
} catch (e) {
  fail("Raffle pool query", e.message);
}

// 5. Columns for raffle
try {
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name IN ('anchor','cluster_id','idea_index')
  `;
  if (cols.length >= 3) pass("Raffle columns", "anchor, cluster_id, idea_index");
  else fail("Raffle columns", `missing: ${3 - cols.length}`);
} catch (e) {
  fail("Raffle columns", e.message);
}

// 6. Env: AI
if (process.env.OPENAI_API_KEY) pass("AI (OpenRouter)", process.env.AI_MODEL ?? "default");
else fail("AI", "OPENAI_API_KEY missing");

// 7. Env: DataForSEO
if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) pass("DataForSEO credentials", "configured");
else fail("DataForSEO", "missing login/password");

// 8. Env: WordPress
if (process.env.WP_SITE_URL && process.env.WP_USERNAME && process.env.WP_APP_PASSWORD) pass("WordPress credentials", process.env.WP_SITE_URL);
else fail("WordPress", "missing WP_* vars");

// 9. Cluster/anchor populated (after seed)
if (articleCount > 0) {
  try {
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM articles WHERE cluster_id IS NOT NULL`;
    if (n > 0) pass("Articles with cluster_id", `${n}/${articleCount}`);
    else fail("Articles with cluster_id", "0 — re-seed from app or npm run setup");
  } catch (e) {
    fail("Cluster backfill check", e.message);
  }
}

await sql.end();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n=== ${results.length - failed}/${results.length} passed ===`);
if (articleCount === 0) {
  console.log("\n→ Next: npm run dev → open app → Seed 59 ideas (or run seed via app)");
}
process.exit(failed > 0 ? 1 : 0);
