/**
 * Renders one storyboard.html to video.mp4 using deterministic frame capture:
 *   1. Playwright loads storyboard.html?export=1 at the video's native size.
 *   2. For each frame, we call window.__seek(ms) (positions the timeline AND
 *      freezes decorative animations), then screenshot -> frames/fNNNNN.png.
 *   3. ffmpeg stitches the PNG frames into an H.264 MP4.
 *
 * CLI:  node export.mjs <folderName|path-to-storyboard.html> [--fps 30] [--keep-frames]
 * Requires: playwright (+ chromium) installed, and ffmpeg on PATH.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

/** Resolve a folder arg to its storyboard.html path + working dir. */
async function resolveTarget(arg) {
  if (arg.endsWith(".html")) {
    const html = resolve(arg);
    return { html, dir: dirname(html) };
  }
  // folder name under output/
  const dir = join(OUT, arg);
  return { html: join(dir, "storyboard.html"), dir };
}

export async function exportVideo(arg, { fps: fpsOverride, keepFrames = false } = {}) {
  const { html, dir } = await resolveTarget(arg);
  if (!existsSync(html)) throw new Error(`storyboard.html not found: ${html}`);

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright not installed. From video-studio/ run:  npm install && npx playwright install chromium",
    );
  }

  const framesDir = join(dir, "frames");
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(html).href + "?export=1", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const meta = await page.evaluate(() => window.__videoMeta);
  if (!meta) {
    await browser.close();
    throw new Error("window.__videoMeta missing — is this a video-studio storyboard.html?");
  }
  const fps = fpsOverride ?? meta.fps ?? 30;
  await page.setViewportSize({ width: meta.width, height: meta.height });

  const totalFrames = Math.max(1, Math.round((meta.durationMs / 1000) * fps));
  process.stdout.write(`  rendering ${totalFrames} frames @ ${fps}fps (${meta.width}x${meta.height})… `);
  for (let f = 0; f < totalFrames; f++) {
    const ms = (f / fps) * 1000;
    await page.evaluate((t) => window.__seek(t), ms);
    const name = `f${String(f).padStart(5, "0")}.png`;
    await page.screenshot({ path: join(framesDir, name), clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
  }
  await browser.close();
  process.stdout.write("done\n");

  const mp4 = join(dir, "video.mp4");
  await run("ffmpeg", [
    "-y", "-framerate", String(fps),
    "-i", join(framesDir, "f%05d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
    "-movflags", "+faststart",
    mp4,
  ]);

  if (!keepFrames) await rm(framesDir, { recursive: true, force: true });
  const s = await stat(mp4);
  console.log(`  ✓ ${mp4}  (${(s.size / 1024 / 1024).toFixed(1)} MB)`);
  return mp4;
}

// CLI
const isCli = resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isCli) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  const fpsArg = args.indexOf("--fps");
  const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : undefined;
  const keepFrames = args.includes("--keep-frames");
  if (!target) {
    console.error("Usage: node export.mjs <folderName|storyboard.html> [--fps 30] [--keep-frames]");
    process.exit(1);
  }
  exportVideo(target, { fps, keepFrames }).catch((e) => {
    console.error("Export failed:", e.message);
    process.exit(1);
  });
}
