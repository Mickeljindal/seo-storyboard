import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { connectDb } from "./connect-db.mjs";
import { formatKloudbeanDbError } from "./kloudbean-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (process.env.DATABASE_MODE === "pglite") {
  execSync("node scripts/setup-pglite.mjs", { stdio: "inherit", cwd: root });
  process.exit(0);
}

console.log("Connecting to PostgreSQL…");
let sql;
let config;
try {
  const conn = await connectDb();
  sql = conn.sql;
  config = conn.config;
  console.log(`✓ Connected to ${config.host}:${config.port}/${config.database}`);
} catch (err) {
  console.error("\n✗ Setup failed:", formatKloudbeanDbError(err));
  process.exit(1);
}

try {
  const migDir = path.join(root, "database/migrations");
  for (const file of fs.readdirSync(migDir).filter((f) => f.endsWith(".sql") && !f.includes("pglite")).sort()) {
    await sql.unsafe(fs.readFileSync(path.join(migDir, file), "utf8"));
    console.log("✓ Migration:", file);
  }
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM articles`;
  console.log(`✓ Articles: ${n}`);
  if (n === 0) {
    process.env.DATABASE_HOST = config.host;
    execSync("npx --yes tsx scripts/seed-db.ts", { stdio: "inherit", cwd: root });
  }
} finally {
  await sql.end();
}

console.log("\n✓ Setup complete");
