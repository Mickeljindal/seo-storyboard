import fs from "node:fs";
import path from "node:path";

let loaded = false;

/** Load .env into process.env for server functions (Vite does not always do this in dev). */
export function loadProjectEnv() {
  if (loaded) return;
  const root = process.cwd();
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!val) continue;
      if (!process.env[key]) process.env[key] = val;
    }
  }
  loaded = true;
}
