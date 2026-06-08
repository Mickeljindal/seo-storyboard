import { createServerFn } from "@tanstack/react-start";
import {
  connectionAttempts,
  formatKloudbeanDbError,
  getKloudbeanDbConfig,
  postgresOptions,
} from "./kloudbean-db";
import { loadProjectEnv } from "./load-env";
import { hasDataForSeoCredentials } from "./dataforseo-client";
import { hasSerperCredentials, testSerperConnection } from "./serper-client";
import { hasAiCredentials, testAiConnection, getAiProviderLabel } from "./ai-provider";
import { getWpConfig } from "./wordpress-client";

export const getSystemHealth = createServerFn({ method: "GET" }).handler(async () => {
  loadProjectEnv();

  const checks: {
    database: { ok: boolean; message: string };
    dataforseo: { ok: boolean; message: string };
    serper: { ok: boolean; message: string };
    ai: { ok: boolean; message: string };
    wordpress: { ok: boolean; message: string };
  } = {
    database: { ok: false, message: "Not checked" },
    dataforseo: { ok: false, message: "Not configured" },
    serper: { ok: false, message: "Not configured" },
    ai: { ok: false, message: "Not configured" },
    wordpress: { ok: false, message: "Not configured" },
  };

  // Database (Kloudbean DBS — see launching-postgres docs)
  if (process.env.DATABASE_MODE === "pglite") {
    try {
      const articlesRepo = await import("@/server/db/repos/articles");
      const n = await articlesRepo.countArticles();
      checks.database = {
        ok: true,
        message: n > 0 ? `Local database · ${n} articles` : `Local database ready · run npm run setup to seed`,
        articleCount: n,
      } as typeof checks.database & { articleCount?: number };
    } catch (e: unknown) {
      checks.database = {
        ok: false,
        message: `${String((e as Error)?.message ?? e)} — run: npm run setup`,
      };
    }
  } else if (!getKloudbeanDbConfig()) {
    checks.database = {
      ok: false,
      message:
        "Set DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD from Kloudbean DBS → Administration",
    };
  } else {
    try {
      const postgres = (await import("postgres")).default;
      let sql: ReturnType<typeof postgres> | undefined;
      let lastErr = "";
      const dbCfg = getKloudbeanDbConfig()!;
      for (const attempt of connectionAttempts(dbCfg)) {
        const client = postgres({ ...postgresOptions(attempt), max: 1 });
        try {
          await client`SELECT 1`;
          sql = client;
          break;
        } catch (e) {
          lastErr = String((e as Error)?.message ?? e);
          await client.end().catch(() => {});
        }
      }
      if (!sql) throw new Error(lastErr || "Could not connect");

      const tables = await sql`
        SELECT COUNT(*)::int AS n FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'articles'
      `;
      const hasTable = Number(tables[0]?.n ?? 0) > 0;
      if (!hasTable) {
        checks.database = {
          ok: false,
          message: "Connected but articles table missing — run: npm run setup",
        };
      } else {
        const count = await sql`SELECT COUNT(*)::int AS n FROM articles`;
        const n = count[0]?.n ?? 0;
        checks.database = {
          ok: true,
          message: n > 0 ? `Connected · ${n} articles` : `Connected · 0 articles — click Seed 59 ideas`,
          articleCount: n,
        } as typeof checks.database & { articleCount?: number };
      }
      await sql.end();
    } catch (e: unknown) {
      checks.database = { ok: false, message: formatKloudbeanDbError(e) };
    }
  }

  // DataForSEO
  if (!hasDataForSeoCredentials()) {
    checks.dataforseo = { ok: false, message: "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env" };
  } else {
    try {
      const { dfsPost } = await import("./dataforseo-client");
      await dfsPost("/v3/keywords_data/google_ads/search_volume/live", [
        { keywords: ["test"], location_code: 2682, language_code: "en" },
      ]);
      checks.dataforseo = { ok: true, message: "API connected" };
    } catch (e: unknown) {
      checks.dataforseo = {
        ok: false,
        message: `API error: ${String((e as Error)?.message ?? e)}. Use API password from app.dataforseo.com/api-access`,
      };
    }
  }

  // Serper.dev (preferred discovery source)
  if (!hasSerperCredentials()) {
    checks.serper = { ok: false, message: "Set SERPER_API_KEY in .env (https://serper.dev) — preferred over DataForSEO" };
  } else {
    const s = await testSerperConnection();
    checks.serper = { ok: s.ok, message: s.message };
  }

  // AI — live ping (DeepSeek or OpenAI-compatible)
  if (!hasAiCredentials()) {
    checks.ai = {
      ok: false,
      message: "Set DEEPSEEK_API_KEY (recommended) or OPENAI_API_KEY in .env — restart dev server",
    };
  } else {
    const aiTest = await testAiConnection();
    checks.ai = { ok: aiTest.ok, message: aiTest.message || getAiProviderLabel() };
  }

  // WordPress
  const { config, missing } = getWpConfig();
  if (!config) {
    checks.wordpress = { ok: false, message: `Missing: ${missing.join(", ")}` };
  } else {
    try {
      const { testWordPressConnection } = await import("./wordpress-client");
      const r = await testWordPressConnection(config);
      checks.wordpress = r.connected
        ? { ok: true, message: `Connected to ${r.site} as ${r.user}` }
        : { ok: false, message: r.error ?? r.hint ?? "Connection failed" };
    } catch (e: unknown) {
      checks.wordpress = { ok: false, message: String((e as Error)?.message ?? e) };
    }
  }

  const discoveryOk = checks.serper.ok || checks.dataforseo.ok;
  const allOk = checks.database.ok && discoveryOk && checks.ai.ok;
  const articleCount =
    checks.database.ok && "articleCount" in checks.database
      ? (checks.database as { articleCount?: number }).articleCount ?? 0
      : 0;
  return {
    checks,
    ready: checks.database.ok && articleCount > 0,
    allOk,
  };
});
