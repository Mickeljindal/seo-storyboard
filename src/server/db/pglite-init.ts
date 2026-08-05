import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { seedPgliteArticles } from "./pglite-seed";

const g = globalThis as typeof globalThis & { __seoPgliteInit?: Promise<void> };

/** Create tables + seed when PGlite data dir is empty. Uses one client only. */
export function ensurePgliteReady(client: PGlite): Promise<void> {
  if (!g.__seoPgliteInit) {
    g.__seoPgliteInit = initPglite(client).catch((e) => {
      g.__seoPgliteInit = undefined;
      throw e;
    });
  }
  return g.__seoPgliteInit;
}

async function initPglite(client: PGlite): Promise<void> {
  const root = process.cwd();
  const check = await client.query<{ t: string | null }>(
    `SELECT to_regclass('public.articles')::text AS t`,
  );

  if (!check.rows[0]?.t) {
    const schemaPath = path.join(root, "database/migrations/001_schema_pglite.sql");
    await client.exec(fs.readFileSync(schemaPath, "utf8"));
  }

  // The patch file is fully idempotent (ADD COLUMN / CREATE TABLE IF NOT EXISTS),
  // so run it every init — this lets existing DBs pick up new tables/columns
  // (e.g. search_performance) without a full reset.
  const patchPath = path.join(root, "database/migrations/002_patch_columns.sql");
  if (fs.existsSync(patchPath)) {
    await client.exec(fs.readFileSync(patchPath, "utf8"));
  }

  const seeded = await seedPgliteArticles(client);
  if (seeded > 0) {
    console.log(`[pglite] Seeded ${seeded} articles`);
  }

  // Auto-sync locally-authored content-studio articles (new slugs only) so
  // articles you commit + push show up in the engine on the next app start.
  // Set INGEST_CONTENT_STUDIO=0 to disable. Never breaks boot.
  if (process.env.INGEST_CONTENT_STUDIO !== "0") {
    try {
      const { ingestContentStudio } = await import("./ingest-content-studio");
      const r = await ingestContentStudio(client, { mode: "new-only" });
      if (r.inserted > 0) console.log(`[pglite] Synced ${r.inserted} new content-studio article(s)`);
    } catch (e) {
      console.warn("[pglite] content-studio sync skipped:", (e as Error).message);
    }
  }
}
