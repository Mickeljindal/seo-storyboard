import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("=== Local PGlite setup (zero config) ===\n");

execSync("npm run setup", { stdio: "inherit", cwd: root });
console.log("\n→ http://127.0.0.1:3000/\n");
execSync("npm run dev -- --host 127.0.0.1", { stdio: "inherit", cwd: root });
