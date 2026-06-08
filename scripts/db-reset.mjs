import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const dataDir = path.join(root, process.env.DATABASE_PATH ?? ".local/seo-pglite");

if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("✓ Removed corrupted PGlite data:", dataDir);
} else {
  console.log("No PGlite data dir to remove:", dataDir);
}

console.log("\nRun: npm run setup && npm run dev");
