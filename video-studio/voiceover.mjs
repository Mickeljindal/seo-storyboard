/**
 * MANUAL voiceover — no API calls. You generate the narration audio yourself
 * (e.g. in ElevenLabs), drop the file into the video's output folder, and the
 * exporter times the on-screen beats to it and muxes it into the MP4.
 *
 * Two ways to supply audio (checked in this order):
 *   1. Per-beat  — output/<folder>/vo/1.mp3, 2.mp3, … one clip per beat
 *      (also .m4a/.wav/.aac/.ogg). Each beat stays on screen for the length of
 *      its clip → tightest sync.
 *   2. Whole video — output/<folder>/voiceover.mp3 (or narration.* / voice.*)
 *      the full narration in one file. Beats are timed proportionally to each
 *      beat's narration length so the visuals track the voice.
 *
 * The `script.md` in each folder has the exact voiceover text to paste in.
 * Tuning (env): VO_PAD_SECONDS (pause after each per-beat clip, default 0.6),
 * VO_MIN_BEAT (min seconds a per-beat stays up, default 2.4).
 */
import { spawn } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PAD = Number(process.env.VO_PAD_SECONDS || 0.6);
const MIN_BEAT = Number(process.env.VO_MIN_BEAT || 2.4);
const AUDIO_EXT = ["mp3", "m4a", "wav", "aac", "ogg"];

function run(cmd, args) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", rej);
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} failed: ${err.slice(-200)}`))));
  });
}

function ffprobeDur(file) {
  return new Promise((res) => {
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    let o = "";
    p.stdout.on("data", (d) => (o += d));
    p.on("close", () => res(parseFloat(String(o).trim()) || 0));
  });
}

const words = (s) => (String(s).trim().match(/\S+/g) || []).length;

function findFile(dir, base) {
  for (const e of AUDIO_EXT) {
    const p = join(dir, `${base}.${e}`);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Find manual voiceover audio for a video and return timing + a track to mux.
 * Returns { beatDurs, audioPath, cleanup, mode } or null if none supplied.
 * `cleanup` = whether audioPath is a generated temp file safe to delete
 * (never true for a file you dropped in).
 */
export async function resolveVoiceover(video, dir) {
  const n = video.beats.length;

  // 1. Per-beat clips: vo/1.mp3 .. vo/N.mp3
  const voDir = join(dir, "vo");
  if (existsSync(voDir)) {
    const perBeat = [];
    for (let i = 1; i <= n; i++) {
      const f = findFile(voDir, String(i));
      if (!f) {
        perBeat.length = 0;
        break;
      }
      perBeat.push(f);
    }
    if (perBeat.length === n && n > 0) {
      const tmp = join(dir, ".vo-mix");
      await rm(tmp, { recursive: true, force: true });
      await mkdir(tmp, { recursive: true });
      const padded = [];
      const beatDurs = [];
      for (let i = 0; i < n; i++) {
        const dsec = await ffprobeDur(perBeat[i]);
        const target = Math.max(MIN_BEAT, dsec + PAD);
        const pf = join(tmp, `p${i}.mp3`);
        await run("ffmpeg", ["-y", "-i", perBeat[i], "-af", `apad=pad_dur=${(target - dsec).toFixed(3)}`, "-t", target.toFixed(3), "-c:a", "libmp3lame", "-q:a", "3", pf]);
        padded.push(pf);
        beatDurs.push(Number(target.toFixed(3)));
      }
      const list = join(tmp, "list.txt");
      await writeFile(list, padded.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
      const mixed = join(dir, ".voiceover-mixed.mp3");
      await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c:a", "libmp3lame", "-q:a", "3", mixed]);
      await rm(tmp, { recursive: true, force: true });
      return { beatDurs, audioPath: mixed, cleanup: true, mode: "per-beat" };
    }
  }

  // 2. One full-length file for the whole video.
  const full = findFile(dir, "voiceover") || findFile(dir, "narration") || findFile(dir, "voice");
  if (full) {
    const total = await ffprobeDur(full);
    if (total > 0) {
      const w = video.beats.map((b) => Math.max(1, words(b.narration)));
      const tw = w.reduce((a, b) => a + b, 0);
      const beatDurs = w.map((x) => Number(((x / tw) * total).toFixed(3)));
      return { beatDurs, audioPath: full, cleanup: false, mode: "full" };
    }
  }

  return null;
}
