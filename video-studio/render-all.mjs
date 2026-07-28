/**
 * Renders every video (or a subset) to MP4.
 *
 * CLI:
 *   node render-all.mjs                          # all, 16:9 YouTube, silent
 *   node render-all.mjs --format both            # 16:9 + 9:16 reel
 *   node render-all.mjs --voiceover              # ElevenLabs voiceover baked in
 *   node render-all.mjs --only 01,05 --format reel --voiceover
 *   node render-all.mjs --fps 24 --skip-existing
 */
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exportVideoFormats } from "./export.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

function outputsFor(format) {
  if (format === "reel") return ["video-reel.mp4"];
  if (format === "both") return ["video.mp4", "video-reel.mp4"];
  return ["video.mp4"];
}

async function main() {
  const args = process.argv.slice(2);
  const val = (flag, def) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : def;
  };
  const only = args.indexOf("--only") >= 0 ? new Set(val("--only", "").split(",").map((s) => s.trim())) : null;
  const fpsArg = args.indexOf("--fps");
  const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : undefined;
  const format = val("--format", "youtube");
  const keepFrames = args.includes("--keep-frames");
  const voiceover = args.includes("--voiceover");
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

  const expected = outputsFor(format);
  console.log(`Rendering ${targets.length} video(s) — format ${format}${voiceover ? " + voiceover" : ""}…\n`);
  let ok = 0;
  for (const name of targets) {
    if (skipExisting && expected.every((f) => existsSync(join(OUT, name, f)))) {
      console.log(`${name} — skip (already rendered)`);
      ok++;
      continue;
    }
    console.log(name);
    try {
      await exportVideoFormats(name, { fps, keepFrames, format, voiceover });
      ok++;
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${targets.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
