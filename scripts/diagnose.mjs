/**
 * Full Kloudbean connection diagnosis — run on your Mac: npm run diagnose
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { getKloudbeanDbConfig } from "./kloudbean-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const cfg = getKloudbeanDbConfig();
if (!cfg) {
  console.error("✗ .env missing DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD");
  process.exit(1);
}

console.log("=== Kloudbean SEO — connection diagnosis ===\n");
console.log("From .env:");
console.log("  Host:", cfg.host);
console.log("  Port:", cfg.port);
console.log("  Database Name:", cfg.database);
console.log("  Master User:", cfg.username);
console.log("  Fallback IP:", process.env.DATABASE_FALLBACK_HOST ?? "(none)");
console.log("  Public access flag:", process.env.DATABASE_PUBLIC_ACCESS ?? "not set");
console.log("");

if (cfg.host.includes("ap-west") && !cfg.host.includes("mumbai")) {
  console.log("⚠ Host contains 'ap-west' but your DB may be in Mumbai — copy Host from DBS → Access tab.");
  console.log("  Wrong region hostname = ENOTFOUND or connection timeout.\n");
}

const hosts = [cfg.host];
const fb = process.env.DATABASE_FALLBACK_HOST?.trim();
if (fb && fb !== cfg.host) hosts.push(fb);

const sslModes = [false, "prefer", "require"];
let anyOk = false;

console.log("Trying host × SSL combinations:\n");

for (const host of hosts) {
  for (const ssl of sslModes) {
    const label = `${host} ssl=${ssl}`;
    const sql = postgres({
      host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      max: 1,
      ssl,
      connect_timeout: 12,
    });
    try {
      await sql`SELECT 1 AS ok`;
      const ver = await sql`SELECT version()`;
      await sql.end();
      console.log(`✓ WORKS  ${label}`);
      console.log(`         ${ver[0].version?.slice(0, 60)}...`);
      console.log("\n→ Add to .env:");
      console.log(`   DATABASE_HOST=${host}`);
      console.log(`   DATABASE_SSL=${ssl === false ? "false" : ssl}`);
      anyOk = true;
      break;
    } catch (e) {
      console.log(`✗ FAIL   ${label}`);
      console.log(`         ${e.message ?? e}`);
      await sql.end().catch(() => {});
    }
  }
  if (anyOk) break;
}

console.log("");
if (!anyOk) {
  console.log("=== Likely causes (in order) ===");
  console.log("1. Wrong Host — open DBS → Access tab, copy Host exactly (not dashboard title)");
  console.log("2. Wrong Database Name or Master User — must match Access tab, not instance label 'Kloudbean'");
  console.log("3. Wrong password — use Database Password from Access, not Kloudbean login");
  console.log("4. Firewall — if public access is ON, click Save Changes (button must not be grayed out)");
  console.log("5. DB still provisioning — wait 2–5 min after launch");
  process.exit(1);
}

console.log("=== Next ===");
console.log("npm run setup && npm run dev -- --host 127.0.0.1");
