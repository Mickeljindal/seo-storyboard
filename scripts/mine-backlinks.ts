/**
 * Mine the competitor backlink exports into link opportunities.
 *
 *   npx tsx scripts/mine-backlinks.ts [--min-authority 12] [--min-value 8] [--dry]
 *
 * Reads kloudgraph-semrush-export/ only. Contacts nobody and sends nothing.
 * Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

const arg = (name: string, dflt?: string): string | undefined => {
  const i = process.argv.indexOf(name);
  return i > -1 ? (process.argv[i + 1] ?? dflt) : dflt;
};
const has = (name: string): boolean => process.argv.includes(name);

async function main() {
  loadProjectEnv();

  const minAuthority = Number(arg("--min-authority", "12"));
  const minValue = Number(arg("--min-value", "8"));
  const dry = has("--dry");

  const miner = await import("../src/lib/backlink-miner");
  const sources = miner.usableCompetitors();

  console.log(`Exports with real data: ${sources.length}`);
  for (const s of sources) console.log(`  ${s.competitor}`);
  if (!sources.length) {
    console.log("\nNothing to mine. Expected CSVs under kloudgraph-semrush-export/<competitor>/.");
    return;
  }

  if (dry) {
    console.log("\n--dry: aggregating without writing…");
    const { domains, stats } = await miner.aggregateExports({ minAuthority });
    console.log(`  link rows read     : ${stats.linkRows.toLocaleString()}`);
    console.log(`  refdomain rows read: ${stats.refdomainRows.toLocaleString()}`);
    console.log(`  domains at authority >= ${minAuthority}: ${domains.size.toLocaleString()}`);
    return;
  }

  console.log(`\nMining (authority >= ${minAuthority}, value >= ${minValue})…`);
  const t0 = Date.now();
  const r = await miner.mineBacklinks({ minAuthority, minValue });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\nRead ${r.linkRows.toLocaleString()} link rows + ${r.refdomainRows.toLocaleString()} refdomain rows in ${secs}s`);
  console.log(`Unique domains above the authority floor: ${r.domainsSeen.toLocaleString()}`);
  console.log(`  stored (new rows) : ${r.stored.toLocaleString()}`);
  console.log(`  rejected          : ${r.rejected.toLocaleString()}`);

  console.log("\nOpportunities kept, by type:");
  for (const [k, v] of Object.entries(r.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }

  console.log("\nDomain classes seen:");
  for (const [k, v] of Object.entries(r.byClass).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }

  console.log("\nWhy domains were rejected:");
  for (const [k, v] of Object.entries(r.rejectReasons).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${String(v).padStart(6)}  ${k}`);
  }

  console.log("\nTop 25 opportunities:");
  console.log(`  ${"score".padStart(6)} ${"auth".padStart(5)} ${"riv".padStart(4)}  ${"type".padEnd(18)} domain`);
  for (const d of r.topDomains) {
    console.log(
      `  ${String(d.value).padStart(6)} ${String(d.authority).padStart(5)} ${String(d.rivals).padStart(4)}  ${d.type.padEnd(18)} ${d.domain}`,
    );
  }

  console.log("\nNext: find contacts with  npx tsx scripts/find-link-contacts.ts");
}

main().then(() => process.exit(0));
