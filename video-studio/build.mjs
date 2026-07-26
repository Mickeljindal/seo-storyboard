/**
 * Generates one folder per video under output/NN-slug/ containing:
 *   - script.md        (production script: beats, voiceover, CTA)
 *   - storyboard.html  (self-contained animated storyboard — open in a browser)
 *
 * Run:  node build.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEOS } from "./ideas.mjs";
import { buildStoryboardHtml, videoDurationMs } from "./template.mjs";
import { buildScriptMarkdown } from "./script-md.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

function folderName(v) {
  return `${v.id}-${v.slug}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const index = [];
  for (const v of VIDEOS) {
    const dir = join(OUT, folderName(v));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "script.md"), buildScriptMarkdown(v, v.number), "utf8");
    await writeFile(join(dir, "storyboard.html"), buildStoryboardHtml(v), "utf8");
    const secs = Math.round(videoDurationMs(v) / 1000);
    index.push({ number: v.number, id: v.id, title: v.title, icp: v.icpName, folder: folderName(v), seconds: secs });
    console.log(`✓ ${folderName(v)}  (${v.icpName}, ~${secs}s, ${v.beats.length} beats)`);
  }

  // A top-level index for humans + for the future in-app pipeline to read.
  const md = [
    "# Kloudbean Video Studio — 34 explainer videos",
    "",
    "Each folder has `script.md` + `storyboard.html`. Render MP4s with `npm run render-all`.",
    "",
    "| # | Video | Audience | Length | Folder |",
    "|---|-------|----------|--------|--------|",
    ...index.map((r) => `| ${r.id} | ${r.title} | ${r.icp} | ~${r.seconds}s | \`${r.folder}\` |`),
    "",
  ].join("\n");
  await writeFile(join(OUT, "INDEX.md"), md, "utf8");
  await writeFile(join(OUT, "index.json"), JSON.stringify(index, null, 2), "utf8");
  console.log(`\nGenerated ${VIDEOS.length} videos → ${OUT}`);
  console.log(`Next: open any output/*/storyboard.html, or run "npm run setup" then "npm run render-all" to export MP4s.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
