import { loadEnv } from "vite";
Object.assign(process.env, loadEnv("development", process.cwd(), ""));

process.env.DATABASE_MODE = "pglite";

const { getDb } = await import("../src/server/db/client.ts");
const { countArticles } = await import("../src/server/db/repos/articles.ts");

const db = await getDb();
const n = await countArticles();
console.log("✓ Local DB works —", n, "articles");
await db.$client?.close?.();
