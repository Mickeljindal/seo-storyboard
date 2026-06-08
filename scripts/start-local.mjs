import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== SEO Storyboard — local fix & start ===\n");
console.log("1. Setting up PGlite database + seed…");
execSync("node scripts/setup.mjs", { stdio: "inherit", cwd: root });

console.log("\n2. Starting dev server at http://127.0.0.1:3000/\n");
console.log("   (If port 3000 is busy, check the terminal for the actual URL)\n");
execSync("npm run dev", { stdio: "inherit", cwd: root });
