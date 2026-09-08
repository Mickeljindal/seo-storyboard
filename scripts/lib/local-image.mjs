// Generate an illustrative image with a LOCAL model on this Mac's GPU.
//
// Runs mflux (Apple MLX) entirely offline after the first weight download: no
// API key, no per-image cost, nothing leaves the machine.
//
// Used ONLY for genuinely pictorial slots. Anything whose value is exact text (a
// terminal session, a labelled graph, a table) goes through the SVG templates
// instead, because image models garble text and that is the single clearest
// "this was AI generated" tell.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const VENV = ".venv-image/bin";
/** Ungated on HuggingFace, MLX-native, fast on Apple Silicon. */
const DEFAULT_CMD = "mflux-generate-z-image-turbo";

/** House style, appended to every prompt so illustrations look like one library. */
const STYLE =
  "modern editorial tech illustration, clean minimal composition, deep navy background (#000f27), violet accent (#4F1AF3), soft green highlight (#40b75f), subtle depth, professional, high detail, no text, no words, no letters, no logos, no watermark, no UI screenshots";

const NEGATIVE =
  "text, words, letters, numbers, captions, labels, typography, watermark, logo, signature, ui, dashboard, chart, graph, table, code, terminal, blurry, distorted, extra limbs, deformed hands, cluttered";

/** Turn a slot description into a clean, textless image prompt. */
export function buildPrompt(hint, note = "") {
  const subject = `${hint} ${note}`
    .replace(/\s+/g, " ")
    .replace(/screenshot|dashboard|console|terminal|graph|chart|table|caption|label/gi, "")
    .trim()
    .slice(0, 320);
  return `${subject}. ${STYLE}`;
}

export function localModelAvailable() {
  return fs.existsSync(path.join(VENV, DEFAULT_CMD));
}

/**
 * Generate one PNG locally.
 * @param {{hint:string, note?:string, outPath:string, width?:number, height?:number, steps?:number, quantize?:number, timeoutMs?:number}} o
 */
export async function generateLocalImage(o) {
  if (!localModelAvailable()) throw new Error(`${DEFAULT_CMD} not installed in ${VENV}`);
  const prompt = buildPrompt(o.hint, o.note);
  fs.mkdirSync(path.dirname(o.outPath), { recursive: true });

  const args = [
    "--quantize", String(o.quantize ?? 4),
    "--steps", String(o.steps ?? 8),
    // Multiples of 16: the model rounds down otherwise and warns. 1200x672 is
    // the nearest valid pair to a 16:9 blog image.
    "--width", String(o.width ?? 1200),
    "--height", String(o.height ?? 672),
    "--prompt", prompt,
    "--negative-prompt", NEGATIVE,
    "--output", o.outPath,
  ];

  return new Promise((resolve, reject) => {
    const p = spawn(path.join(VENV, DEFAULT_CMD), args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    // Generous: the very first call may still be fetching weights.
    const timer = setTimeout(() => {
      p.kill("SIGKILL");
      reject(new Error("local image generation timed out"));
    }, o.timeoutMs ?? 20 * 60_000);
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && fs.existsSync(o.outPath)) resolve({ outPath: o.outPath, prompt });
      else reject(new Error(`${DEFAULT_CMD} exited ${code}: ${err.slice(-400)}`));
    });
  });
}
