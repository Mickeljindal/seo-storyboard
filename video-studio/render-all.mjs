/**
 * Renders every video's storyboard.html to video.mp4 (or a subset).
 *
 * CLI:
 *   node render-all.mjs                 # render all 34
 *   node render-all.mjs --only 01,05    # render specific numbers
 *   node render-all.mjs --fps 24        # override fps (faster/smaller)
 *   node render-all.mjs --keep-frames   # keep PNG frames for inspection
 */
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exportVideo } from "./export.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.indexOf("--only");
  const only = onlyArg >= 0 ? new Set(args[onlyArg + 1].split(",").map((s) => s.trim())) : null;
  const fpsArg = args.indexOf("--fps");
  const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : undefined;
  const keepFrames = args.includes("--keep-frames");
  const skipExisting = args.includes("--skip-existing");

  const entries = (await readdir(OUT, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const targets = entries.filter((name) => !only || only.has(name.slice(0, 2)));
  if (!targets.length) {
    console.error("No matching folders. Run `node build.mjs` first.");
    process.exit(1);
  }

  console.log(`Rendering ${targets.length} video(s)…\n`);
  let ok = 0;
  for (const name of targets) {
    if (skipExisting && existsSync(join(OUT, name, "video.mp4"))) {
      console.log(`${name} — skip (already rendered)`);
      ok++;
      continue;
    }
    console.log(name);
    try {
      await exportVideo(name, { fps, keepFrames });
      ok++;
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${targets.length} rendered.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
