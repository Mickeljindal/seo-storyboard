/**
 * Diagnostic: run the exact same sync the dashboard runs, and print each step.
 * Usage: npx tsx scripts/debug-sync.ts
 */
import { loadProjectEnv } from "../src/lib/load-env";
loadProjectEnv();

async function main() {
  console.log("=== 1. Plugin health (what the engine sees) ===");
  const { pingPlugin, listToolCategories } = await import("../src/lib/wp-plugin-client");
  const ping = await pingPlugin();
  console.log(JSON.stringify(ping, null, 2));

  console.log("\n=== 2. /categories response (what the dropdown shows) ===");
  const cats = await listToolCategories();
  console.log(`total categories: ${cats.length}`);
  for (const c of cats.slice(0, 10))
    console.log(`  - ${c.name} · pages=${c.page_count} · taxonomy=${c.taxonomy ?? "(none)"}`);

  console.log("\n=== 2b. RAW /tools/list response from engine's client ===");
  const { listToolPages } = await import("../src/lib/wp-plugin-client");
  const raw = await listToolPages({ category: "Developer Tools", perPage: 50, page: 1, status: "any" });
  console.log("shape:", {
    total: raw.total,
    total_pages: raw.total_pages,
    category: raw.category,
    category_found: raw.category_found,
    taxonomy: raw.taxonomy,
    items_length: raw.items?.length ?? 0,
  });
  console.log("first 3 items:", raw.items?.slice(0, 3));

  console.log("\n=== 3. Actual sync of Developer Tools ===");
  const { syncExistingToolsInternal } = await import("../src/lib/tools.functions");
  const res = await syncExistingToolsInternal({
    category: "Developer Tools",
    maxPages: 40,
    perPage: 50,
  });
  console.log(JSON.stringify(res, null, 2));

  console.log("\n=== 4. DB state after sync (existing tools in this category) ===");
  const toolsRepo = await import("../src/server/db/repos/tools");
  const rows = await toolsRepo.listExistingToolsByCategory("Developer Tools");
  console.log(`existing tools in DB (category=Developer Tools): ${rows.length}`);
  for (const t of rows.slice(0, 5))
    console.log(`  - ${t.name} · slug=${t.url_slug} · wp_post_id=${t.wp_post_id}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
