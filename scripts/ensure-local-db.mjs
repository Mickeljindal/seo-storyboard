/**
 * Start local Postgres without Kloudbean or Docker.
 * Uses embedded-postgres (bundled PG binary in node_modules).
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
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const host = process.env.DATABASE_HOST ?? "127.0.0.1";
const port = Number(process.env.DATABASE_PORT ?? 5432);
const database = process.env.DATABASE_NAME ?? "seo_storyboard";
const user = process.env.DATABASE_USER ?? "seo";
const password = process.env.DATABASE_PASSWORD ?? "changeme";

async function canConnect() {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres({
      host,
      port,
      database,
      user,
      password,
      max: 1,
      connect_timeout: 2,
    });
    await sql`SELECT 1`;
    await sql.end();
    return true;
  } catch {
    return false;
  }
}

if (await canConnect()) {
  console.log(`✓ Local Postgres already running at ${host}:${port}/${database}`);
  process.exit(0);
}

console.log("Starting embedded local Postgres (no Kloudbean, no Docker)…");

const EmbeddedPostgres = (await import("embedded-postgres")).default;
const dataDir = path.join(root, ".local-postgres");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user,
  password,
  port,
  persistent: true,
});

await pg.initialise();
await pg.start();

try {
  await pg.createDatabase(database);
  console.log(`✓ Created database: ${database}`);
} catch {
  console.log(`✓ Database ${database} ready`);
}

if (!(await canConnect())) {
  console.error("✗ Postgres started but app cannot connect — check .env");
  process.exit(1);
}

console.log(`✓ Local Postgres at ${host}:${port}/${database}`);
console.log("  Data stored in:", dataDir);
