/**
 * Verify Kloudbean DBS credentials match panel fields
 * Run: npm run db:check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDb } from "./connect-db.mjs";
import { formatKloudbeanDbError, getKloudbeanDbConfig } from "./kloudbean-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

console.log("Kloudbean DBS credential check\n");
console.log("Panel field          →  .env variable           →  value in .env");
console.log("─────────────────────────────────────────────────────────────────");

const rows = [
  ["Host", "DATABASE_HOST", process.env.DATABASE_HOST],
  ["Port", "DATABASE_PORT", process.env.DATABASE_PORT ?? "5432"],
  ["Database Name", "DATABASE_NAME", process.env.DATABASE_NAME],
  ["Master User", "DATABASE_USER", process.env.DATABASE_USER],
  ["Password", "DATABASE_PASSWORD", process.env.DATABASE_PASSWORD ? "(set)" : "(missing)"],
  ["IP (optional)", "DATABASE_FALLBACK_HOST", process.env.DATABASE_FALLBACK_HOST ?? "(not set)"],
];

for (const [panel, env, val] of rows) {
  const ok = val && val !== "(missing)" ? "✓" : "✗";
  console.log(`${ok} ${panel.padEnd(18)} →  ${env.padEnd(22)} →  ${val ?? ""}`);
}

const cfg = getKloudbeanDbConfig();
if (!cfg) {
  console.error("\n✗ Missing required fields. Copy all values from Kloudbean DBS → Administration.");
  process.exit(1);
}

console.log("\nConnection target (what the app uses):");
console.log(`  postgresql://${cfg.username}:***@${cfg.host}:${cfg.port}/${cfg.database}`);
console.log(`  SSL: ${cfg.ssl}`);

console.log("\nTesting connection…");
try {
  const { sql, config } = await connectDb();
  await sql`SELECT version()`;
  const tables = await sql`
    SELECT COUNT(*)::int AS n FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'articles'
  `;
  const n = tables[0]?.n ?? 0;
  await sql.end();
  console.log(`✓ Connected via ${config.host}:${config.port}`);
  console.log(`✓ articles table: ${n > 0 ? "exists" : "missing — run npm run setup"}`);
} catch (e) {
  console.error("\n✗", formatKloudbeanDbError(e));
  if (process.env.DATABASE_PUBLIC_ACCESS === "true") {
    console.error("\nPublic access is ON — re-copy Host, Database Name, Master User, Password from DBS → Access tab.");
    console.error("(Dashboard instance name may not equal Database Name in credentials.)");
  } else {
    console.error("\nMost common fix: DBS → Firewall → allow public access, or Access → whitelist your IP.");
  }
  process.exit(1);
}
