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

type PgliteGlobals = typeof globalThis & {
  __seoDb?: AppDb;
  __seoPglite?: import("@electric-sql/pglite").PGlite;
  __seoDbPromise?: Promise<AppDb>;
};

const g = globalThis as PgliteGlobals;

export function isPgliteMode() {
  loadProjectEnv();
  return process.env.DATABASE_MODE === "pglite";
}

async function openPgliteDb(): Promise<AppDb> {
  if (g.__seoDb) return g.__seoDb;

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = path.join(process.cwd(), process.env.DATABASE_PATH ?? ".local/seo-pglite");
  const fs = await import("node:fs");
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });

  if (!g.__seoPglite) {
    g.__seoPglite = new PGlite(dataDir);
  }

  const { ensurePgliteReady } = await import("./pglite-init");
  await ensurePgliteReady(g.__seoPglite);

  g.__seoDb = drizzle(g.__seoPglite, { schema }) as AppDb;
  return g.__seoDb;
}

async function openPostgresDb(): Promise<AppDb> {
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
      return drizzlePg(client, { schema });
    } catch (e) {
      lastErr = e as Error;
      if (!/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EPERM/i.test(lastErr.message)) {
        throw new Error(formatKloudbeanDbError(lastErr));
      }
    }
  }
  throw new Error(formatKloudbeanDbError(lastErr));
}

async function initDb(): Promise<AppDb> {
  loadProjectEnv();
  if (isPgliteMode()) return openPgliteDb();
  return openPostgresDb();
}

export async function getDb(): Promise<AppDb> {
  if (g.__seoDb) return g.__seoDb;
  if (!g.__seoDbPromise) {
    g.__seoDbPromise = initDb().catch((e) => {
      g.__seoDbPromise = undefined;
      throw e;
    });
  }
  return g.__seoDbPromise;
}

export { schema };
