/**
 * Renders a storyboard to MP4 via deterministic frame capture (Playwright) +
 * ffmpeg. Supports:
 *   --format youtube|reel|both   16:9 (video.mp4) and/or 9:16 (video-reel.mp4)
 *   --voiceover                  mux your MANUAL narration audio + sync beats to it
 *   --fps N   --keep-frames
 *
 * With --voiceover, we look for audio you dropped in the video's folder
 * (voiceover.mp3, or per-beat vo/1.mp3…), time each on-screen beat to it, and
 * mux it into the MP4. No TTS API is called — see voiceover.mjs.
 *
 * Requires: playwright (+ chromium) and ffmpeg on PATH.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VIDEOS } from "./ideas.mjs";
import { buildStoryboardHtml } from "./template.mjs";
import { resolveVoiceover } from "./voiceover.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

function findVideo(folder) {
  return VIDEOS.find((v) => `${v.id}-${v.slug}` === folder);
}

async function loadChromium() {
  try {
    const { chromium } = await import("playwright");
    return chromium;
  } catch {
    throw new Error("Playwright not installed. From video-studio/ run:  npm install && npx playwright install chromium");
  }
}

async function captureAndEncode(dir, html, { fps, keepFrames, outName, audioPath }) {
  const chromium = await loadChromium();
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
    throw new Error("window.__videoMeta missing — not a video-studio storyboard.");
  }
  const useFps = fps ?? meta.fps ?? 30;
  await page.setViewportSize({ width: meta.width, height: meta.height });
  const totalFrames = Math.max(1, Math.round((meta.durationMs / 1000) * useFps));
  process.stdout.write(`  ${outName}: ${totalFrames} frames @ ${useFps}fps (${meta.width}x${meta.height})… `);
  for (let f = 0; f < totalFrames; f++) {
    await page.evaluate((t) => window.__seek(t), (f / useFps) * 1000);
    await page.screenshot({ path: join(framesDir, `f${String(f).padStart(5, "0")}.png`), clip: { x: 0, y: 0, width: meta.width, height: meta.height } });
  }
  await browser.close();
  process.stdout.write("done\n");

  const mp4 = join(dir, outName);
  const v = ["-framerate", String(useFps), "-i", join(framesDir, "f%05d.png")];
  const enc = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20", "-movflags", "+faststart"];
  if (audioPath && existsSync(audioPath)) {
    await run("ffmpeg", ["-y", ...v, "-i", audioPath, ...enc, "-c:a", "aac", "-b:a", "160k", "-shortest", mp4]);
  } else {
    await run("ffmpeg", ["-y", ...v, ...enc, mp4]);
  }
  if (!keepFrames) await rm(framesDir, { recursive: true, force: true });
  const s = await stat(mp4);
  console.log(`  ✓ ${mp4}  (${(s.size / 1024 / 1024).toFixed(1)} MB)`);
  return mp4;
}

/** Export one video in one format (youtube|reel), optional voiceover. */
export async function exportVideo(arg, { fps, keepFrames = false, format = "youtube", voiceover = false } = {}) {
  const aspect = format === "reel" ? "9:16" : "16:9";
  const outName = format === "reel" ? "video-reel.mp4" : "video.mp4";

  // Path to a storyboard.html directly (custom): render silent as-is.
  if (arg.endsWith(".html")) {
    const html = resolve(arg);
    if (!existsSync(html)) throw new Error(`storyboard.html not found: ${html}`);
    return captureAndEncode(dirname(html), html, { fps, keepFrames, outName, audioPath: null });
  }

  const dir = join(OUT, arg);
  const video = findVideo(arg);
  if (!video) {
    // Fall back to the pre-built storyboard.html (silent, 16:9).
    const html = join(dir, "storyboard.html");
    if (!existsSync(html)) throw new Error(`Unknown video "${arg}" and no storyboard.html found.`);
    return captureAndEncode(dir, html, { fps, keepFrames, outName, audioPath: null });
  }
  await mkdir(dir, { recursive: true });

  // Voiceover: use manual audio you dropped in the folder, timing beats to it.
  let vo = null;
  if (voiceover) {
    vo = await resolveVoiceover(video, dir);
    if (vo) {
      console.log(`  voiceover: ${vo.mode} track — timing beats to audio`);
    } else {
      console.log(`  (no voiceover audio found — drop "voiceover.mp3" in output/${arg}/, or per-beat clips in output/${arg}/vo/1.mp3…; rendering silent)`);
    }
  }

  const beats = video.beats.map((b, i) => (vo ? { ...b, dur: vo.beatDurs[i] } : b));
  const renderVideo = { ...video, aspect, beats };
  const tmpHtml = join(dir, `.render-${format}.html`);
  await writeFile(tmpHtml, buildStoryboardHtml(renderVideo), "utf8");

  try {
    return await captureAndEncode(dir, tmpHtml, { fps, keepFrames, outName, audioPath: vo?.audioPath ?? null });
  } finally {
    await rm(tmpHtml, { force: true });
    // Only remove the generated temp mix — never a file you dropped in.
    if (vo?.cleanup && vo.audioPath) await rm(vo.audioPath, { force: true });
  }
}

/** Export the requested formats ("youtube"|"reel"|"both"). */
export async function exportVideoFormats(arg, { format = "youtube", ...opts } = {}) {
  const formats = format === "both" ? ["youtube", "reel"] : [format];
  const out = [];
  for (const f of formats) out.push(await exportVideo(arg, { ...opts, format: f }));
  return out;
}

// CLI
const isCli = resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isCli) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--"));
  const fpsArg = args.indexOf("--fps");
  const fmtArg = args.indexOf("--format");
  const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : undefined;
  const format = fmtArg >= 0 ? args[fmtArg + 1] : "youtube";
  const keepFrames = args.includes("--keep-frames");
  const voiceover = args.includes("--voiceover");
  if (!target) {
    console.error("Usage: node export.mjs <folder|storyboard.html> [--format youtube|reel|both] [--voiceover] [--fps N] [--keep-frames]");
    process.exit(1);
  }
  exportVideoFormats(target, { fps, keepFrames, format, voiceover }).catch((e) => {
    console.error("Export failed:", e.message);
    process.exit(1);
  });
}
