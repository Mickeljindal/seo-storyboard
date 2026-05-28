import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { execSync } from "node:child_process";

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

const schemaPath = path.join(root, "database/migrations/001_schema_pglite.sql");
const patchPath = path.join(root, "database/migrations/002_patch_columns.sql");

await client.exec(fs.readFileSync(schemaPath, "utf8"));
console.log("✓ Schema:", path.basename(schemaPath));

if (fs.existsSync(patchPath)) {
  await client.exec(fs.readFileSync(patchPath, "utf8"));
  console.log("✓ Schema:", path.basename(patchPath));
}

const count = await client.query(`SELECT COUNT(*)::int AS n FROM articles`);
const n = count.rows[0]?.n ?? 0;
console.log(`✓ Articles: ${n}`);

if (n === 0) {
  console.log("\nSeeding 59 articles…");
  execSync("npx --yes jiti scripts/seed-db-pglite.ts", { stdio: "inherit", cwd: root, env: { ...process.env, DATABASE_MODE: "pglite" } });
}

await client.close();
console.log("\n✓ Local database ready (PGlite — no Docker, no Kloudbean)");
