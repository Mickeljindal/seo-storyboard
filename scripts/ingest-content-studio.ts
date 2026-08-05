/**
 * CLI: ingest content-studio/ into the engine's PGlite DB.
 *
 *   npx tsx scripts/ingest-content-studio.ts            # full upsert
 *   npx tsx scripts/ingest-content-studio.ts --new-only # only new slugs (git-hook default)
 *
 * PGlite is single-connection, so this must run while the dev server is STOPPED.
 * If it detects a running dev server it exits without touching the DB (use the
 * in-app "Sync content-studio" action instead, or stop the server and re-run).
 */
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { ingestContentStudio } from "../src/server/db/ingest-content-studio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load .env (DATABASE_MODE / DATABASE_PATH).
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
  const mode = process.argv.includes("--new-only") ? "new-only" : "upsert";

  // Guard: never open PGlite while the dev server holds it (single-connection).
  const port = Number(process.env.PORT ?? 3000);
  if ((await portOpen(port)) || (await portOpen(5173))) {
    console.error(
      `[ingest] A dev server appears to be running (port ${port}/5173). PGlite is single-connection.\n` +
        `         Stop the dev server and re-run, or use the in-app "Sync content-studio" button.`,
    );
    process.exit(0); // exit 0 so a git hook never blocks the push
  }

  if (process.env.DATABASE_MODE && process.env.DATABASE_MODE !== "pglite") {
    console.error(`[ingest] DATABASE_MODE=${process.env.DATABASE_MODE}; this script only supports pglite.`);
    process.exit(0);
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = path.join(root, process.env.DATABASE_PATH ?? ".local/seo-pglite");
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);

  // Ensure the schema exists (mirrors pglite-init) in case the DB is fresh.
  const chk = await client.query<{ t: string | null }>(`SELECT to_regclass('public.articles')::text AS t`);
  if (!chk.rows[0]?.t) {
    const s1 = path.join(root, "database/migrations/001_schema_pglite.sql");
    if (fs.existsSync(s1)) await client.exec(fs.readFileSync(s1, "utf8"));
  }
  const patch = path.join(root, "database/migrations/002_patch_columns.sql");
  if (fs.existsSync(patch)) await client.exec(fs.readFileSync(patch, "utf8"));

  const res = await ingestContentStudio(client, {
    root: path.join(root, "content-studio"),
    mode,
    log: (m) => console.log(`[ingest] ${m}`),
  });

  console.log(
    `[ingest] done — ${res.inserted} inserted, ${res.updated} updated, ${res.skipped} skipped (of ${res.total}).`,
  );
  await client.close();
}

main().catch((e) => {
  console.error("[ingest] failed:", e);
  process.exit(1);
});
