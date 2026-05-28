import "@tanstack/react-start/server-only";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  connectionAttempts,
  formatKloudbeanDbError,
  getKloudbeanDbConfig,
  postgresOptions,
} from "@/lib/kloudbean-db";
import { loadProjectEnv } from "@/lib/load-env";
import * as schema from "./schema";

type AppDb = ReturnType<typeof drizzlePg<typeof schema>>;
let _db: AppDb | undefined;
let _pglite: import("@electric-sql/pglite").PGlite | undefined;

export function isPgliteMode() {
  loadProjectEnv();
  return process.env.DATABASE_MODE === "pglite";
}

export async function getDb(): Promise<AppDb> {
  if (_db) return _db;
  loadProjectEnv();

  if (isPgliteMode()) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir = path.join(
      process.cwd(),
      process.env.DATABASE_PATH ?? ".local/seo-pglite",
    );
    const fs = await import("node:fs");
    fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    _pglite = new PGlite(dataDir);
    _db = drizzle(_pglite, { schema }) as AppDb;
    return _db;
  }

  const cfg = getKloudbeanDbConfig();
  if (!cfg) {
    throw new Error(
      "Database not configured. Set DATABASE_MODE=pglite for local file DB, or set DATABASE_HOST/USER/PASSWORD for Postgres.",
    );
  }

  let lastErr: Error | undefined;
  for (const attempt of connectionAttempts(cfg)) {
    try {
      const client = postgres(postgresOptions(attempt));
      await client`SELECT 1`;
      _db = drizzlePg(client, { schema });
      return _db;
    } catch (e) {
      lastErr = e as Error;
      if (!/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EPERM/i.test(lastErr.message)) {
        throw new Error(formatKloudbeanDbError(lastErr));
      }
    }
  }
  throw new Error(formatKloudbeanDbError(lastErr));
}

export { schema };
