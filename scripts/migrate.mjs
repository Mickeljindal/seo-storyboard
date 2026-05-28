import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, "run-migrations.mjs");
const child = spawn(process.execPath, [runner], { stdio: "inherit", cwd: path.join(__dirname, "..") });
child.on("exit", (code) => process.exit(code ?? 1));
