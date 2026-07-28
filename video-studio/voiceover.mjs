/**
 * ElevenLabs voiceover for the videos. For each beat we synthesize the
 * narration to speech, pad it with a short trailing silence, and concatenate
 * the clips into one voiceover.mp3. It also returns the per-beat audio
 * durations so the exporter can time each on-screen beat to its narration —
 * i.e. the visuals stay in sync with the voice.
 *
 * Config (env, e.g. project root .env):
 *   ELEVENLABS_API_KEY   (required to enable voiceover)
 *   ELEVENLABS_VOICE_ID  (optional; default a standard ElevenLabs voice)
 *   ELEVENLABS_MODEL_ID  (optional; default eleven_multilingual_v2)
 *   VO_PAD_SECONDS       (optional; trailing pause per beat, default 0.6)
 *   VO_MIN_BEAT          (optional; min seconds a beat stays on screen, default 2.4)
 */
import { spawn } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { loadEnv } from "./loadenv.mjs";

loadEnv();

function cfg() {
  return {
    key: process.env.ELEVENLABS_API_KEY,
    voice: process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb", // "George" (common default)
    model: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    pad: Number(process.env.VO_PAD_SECONDS || 0.6),
    minBeat: Number(process.env.VO_MIN_BEAT || 2.4),
  };
}

export function hasVoiceover() {
  return !!cfg().key;
}

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

async function synth(text, outMp3) {
  const { key, voice, model } = cfg();
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs HTTP ${res.status}: ${(await res.text()).slice(0, 180)}`);
  }
  await writeFile(outMp3, Buffer.from(await res.arrayBuffer()));
}

/**
 * Synthesize the whole video's voiceover.
 * Returns { beatDurs:[seconds per beat], audioPath, totalSeconds } or null if
 * voiceover isn't configured.
 */
export async function generateVoiceover(video, dir) {
  if (!hasVoiceover()) return null;
  const { pad, minBeat } = cfg();
  const voDir = join(dir, "vo");
  await rm(voDir, { recursive: true, force: true });
  await mkdir(voDir, { recursive: true });

  const padded = [];
  const beatDurs = [];
  for (let i = 0; i < video.beats.length; i++) {
    const raw = join(voDir, `b${i}.mp3`);
    await synth(video.beats[i].narration, raw);
    const d = await ffprobeDur(raw);
    const target = Math.max(minBeat, d + pad);
    const padFile = join(voDir, `b${i}_pad.mp3`);
    // Re-encode with trailing silence so this clip is exactly `target` long.
    await run("ffmpeg", ["-y", "-i", raw, "-af", `apad=pad_dur=${(target - d).toFixed(3)}`, "-t", target.toFixed(3), "-c:a", "libmp3lame", "-q:a", "3", padFile]);
    padded.push(padFile);
    beatDurs.push(Number(target.toFixed(3)));
  }

  const listFile = join(voDir, "list.txt");
  await writeFile(listFile, padded.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
  const audioPath = join(dir, "voiceover.mp3");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "libmp3lame", "-q:a", "3", audioPath]);

  await rm(voDir, { recursive: true, force: true });
  return { beatDurs, audioPath, totalSeconds: beatDurs.reduce((a, b) => a + b, 0) };
}
