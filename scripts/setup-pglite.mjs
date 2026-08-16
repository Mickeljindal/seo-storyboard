import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const dataDir = path.join(root, process.env.DATABASE_PATH ?? ".local/seo-pglite");
fs.mkdirSync(path.dirname(dataDir), { recursive: true });
console.log("PGlite local database at:", dataDir);

const client = new PGlite(dataDir);

// Apply the PGlite base schema, then EVERY later migration in filename order.
// This used to name 001 and 002 explicitly, which meant any new migration was
// silently skipped locally and the local database quietly drifted from the
// committed schema. Discovering them keeps that from happening again.
const migDir = path.join(root, "database/migrations");
const BASE = "001_schema_pglite.sql";
const POSTGRES_ONLY = "001_schema.sql"; // the non-PGlite base, not for this engine

await client.exec(fs.readFileSync(path.join(migDir, BASE), "utf8"));
console.log("✓ Schema:", BASE);

const later = fs
  .readdirSync(migDir)
  .filter((f) => f.endsWith(".sql") && f !== BASE && f !== POSTGRES_ONLY)
  .sort();

for (const file of later) {
  try {
    await client.exec(fs.readFileSync(path.join(migDir, file), "utf8"));
    console.log("✓ Migration:", file);
  } catch (e) {
    // Migrations are written to be idempotent (IF NOT EXISTS), so a failure here
    // is a real problem worth seeing rather than swallowing.
    console.error(`✗ Migration ${file} failed:`, e.message);
    throw e;
  }
}

const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(root, "src") },
});
const { seedPgliteArticles } = jiti(path.join(root, "src/server/db/pglite-seed.ts"));
const seeded = await seedPgliteArticles(client);
if (seeded > 0) console.log(`✓ Seeded ${seeded} articles`);
else {
  const count = await client.query(`SELECT COUNT(*)::int AS n FROM articles`);
  console.log(`✓ Articles: ${count.rows[0]?.n ?? 0}`);
}

await client.close();
console.log("\n✓ Local database ready (PGlite — no Docker, no Kloudbean)");
