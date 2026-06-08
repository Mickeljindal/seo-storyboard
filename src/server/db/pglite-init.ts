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
    const patchPath = path.join(root, "database/migrations/002_patch_columns.sql");
    await client.exec(fs.readFileSync(schemaPath, "utf8"));
    if (fs.existsSync(patchPath)) {
      await client.exec(fs.readFileSync(patchPath, "utf8"));
    }
  }

  const seeded = await seedPgliteArticles(client);
  if (seeded > 0) {
    console.log(`[pglite] Seeded ${seeded} articles`);
  }
}
