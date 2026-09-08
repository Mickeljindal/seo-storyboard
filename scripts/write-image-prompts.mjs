// For every .img-slot still unfilled, write a READY-TO-PASTE prompt (or a capture
// instruction) so a human can produce the image by hand without re-reading the
// article.
//
// Two honest categories, because they need different things:
//
//   GENERATE  - the visual is a diagram/chart/table/terminal. These can be built
//               automatically from HTML/CSS once AI credit is available, but a
//               paste-ready image prompt is provided as a manual fallback.
//   CAPTURE   - the visual is a real browser window or another product's UI
//               (Open WebUI, Metabase, a devtools Network tab). No prompt should
//               fake these: an invented screenshot of someone else's product is a
//               lie a reader can catch. So the instruction says what to capture.
//
// Output:
//   1. an HTML comment injected directly above each placeholder, so the prompt
//      sits where the image goes
//   2. content-studio/_IMAGE-PROMPTS.md, one section per article, for bulk work
//
// Usage:
//   node scripts/write-image-prompts.mjs --dry
//   node scripts/write-image-prompts.mjs
import fs from "node:fs";
import path from "node:path";
import { parseSlots, classifySlot } from "./plan-article-images.mjs";

const ROOT = "content-studio";
const DRY = process.argv.includes("--dry");
const PUBLISHED = new Set(
  (JSON.parse(fs.readFileSync(`${ROOT}/_published.json`, "utf8")).published ?? []).map((p) => p.slug),
);

const BRAND =
  "Brand palette: deep navy #000f27 background, violet #4F1AF3 primary accent, green #40b75f for success or positive states. Clean modern editorial style, generous whitespace, flat vector look, no drop shadows, no stock-photo people, no watermark, no logos.";

/** Per-type direction, so the prompt asks for the right KIND of picture. */
const DIRECTION = {
  terminal: {
    what: "a realistic terminal / command-line screenshot",
    extra:
      "Dark terminal window with a title bar. Monospaced text must be SHARP and SPELLED CORRECTLY. Show the real commands and realistic output. Colour-code: violet prompt, white commands, grey output, green success, red errors.",
    ratio: "16:9",
  },
  graph: {
    what: "a clean line chart / time-series graph",
    extra:
      "Label both axes. Draw the trend the description implies. Add a dashed red threshold line only if a limit is being hit. Legible axis labels, no 3D, no gradient clutter.",
    ratio: "16:9",
  },
  comparison: {
    what: "a side-by-side comparison table",
    extra:
      "Navy header row with white uppercase headings. Alternating light row stripes. Use green pills for good, red pills for bad, grey pills for it-depends. Text must be crisp and correctly spelled.",
    ratio: "16:9",
  },
  panel: {
    what: "a clean settings / configuration panel UI mockup",
    extra:
      "A white card with a small uppercase section label, then labelled rows. Highlight the row that carries the point with a violet border. Optional green check line at the bottom confirming the result.",
    ratio: "16:9",
  },
  flow: {
    what: "a left-to-right architecture / flow diagram",
    extra:
      "3 or 4 rounded boxes connected by arrows in real execution order. First box navy, middle boxes violet, last box green. Short label plus a small sub-label in each box. One short caption under the diagram.",
    ratio: "16:9",
  },
  illustration: {
    what: "an abstract editorial tech illustration",
    extra: "No text of any kind. Conceptual and clean.",
    ratio: "16:9",
  },
};

/** A paste-ready image prompt. */
function buildPrompt(type, hint, note, articleTitle) {
  const d = DIRECTION[type] ?? DIRECTION.flow;
  const lines = [
    `Create ${d.what} for a technical blog post titled "${articleTitle}".`,
    ``,
    `What it must show: ${hint}`,
  ];
  if (note) lines.push(`Also: ${note}`);
  lines.push(
    ``,
    d.extra,
    BRAND,
    `Aspect ratio ${d.ratio}, high resolution, readable at 1200px wide.`,
    `Everything shown must be technically accurate. Do not invent numbers, prices, or benchmarks.`,
  );
  return lines.join("\n");
}

/** An instruction to go and take a real screenshot, with no invented content. */
function buildCapture(type, hint, note) {
  const target =
    type === "third-party-ui"
      ? "another product's own interface"
      : "a real browser window (address bar, devtools, or tabs)";
  return [
    `SCREENSHOT NEEDED (do not generate this one).`,
    `This slot shows ${target}, so an AI image would be inaccurate and a reader could tell.`,
    ``,
    `Capture: ${hint}`,
    note ? `Note: ${note}` : ``,
    ``,
    `Crop to 16:9, keep text legible at 1200px wide, and blur or fake any real credentials, tokens, IPs or customer data.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const dirs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
  .map((d) => d.name)
  .filter((s) => !PUBLISHED.has(s));

let injected = 0,
  gen = 0,
  cap = 0,
  articles = 0;
const md = [
  `# Image prompts for the remaining article slots`,
  ``,
  `Auto-generated by \`scripts/write-image-prompts.mjs\`. One entry per unfilled \`.img-slot\`.`,
  ``,
  `Two kinds:`,
  ``,
  `- **GENERATE** - paste the prompt into ChatGPT / an image model. These can also be produced automatically with \`node scripts/generate-article-images.mjs --all\` once AI credit is available, which is cheaper and keeps the whole library visually consistent.`,
  `- **CAPTURE** - take a real screenshot. These show a browser window or another product's UI, so generating them would be inaccurate.`,
  ``,
  `The same prompt is also injected as an HTML comment directly above each placeholder in the article.`,
  ``,
  `---`,
  ``,
];

for (const slug of dirs) {
  const htmlPath = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes('class="img-slot"')) continue;

  const articleTitle =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? slug;
  const slots = parseSlots(html);
  const entries = [];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const c = classifySlot(s.hint, s.note);
    const isCapture = c.renderer === "manual" || c.renderer === "screenshot";
    const body = isCapture
      ? buildCapture(c.type, s.hint, s.note)
      : buildPrompt(c.type, s.hint, s.note, articleTitle);
    const kind = isCapture ? "CAPTURE" : "GENERATE";
    if (isCapture) cap++;
    else gen++;

    // Inject above the placeholder. No src="..." anywhere in the comment: the
    // article validator flags that pattern as a missing image even inside a comment.
    const marker = `<!-- IMAGE ${kind} [${c.type}] #${i + 1}\n${body.replace(/--+>/g, "->")}\n-->`;
    if (!html.includes(`IMAGE ${kind} [${c.type}] #${i + 1}`)) {
      html = html.replace(s.raw, `${marker}\n  ${s.raw}`);
      injected++;
    }
    entries.push({ n: i + 1, kind, type: c.type, body });
  }

  if (entries.length) {
    articles++;
    md.push(`## ${articleTitle}`, ``, `\`${slug}\` - ${entries.length} slot(s)`, ``);
    for (const e of entries) {
      md.push(`### #${e.n} - ${e.kind} (${e.type})`, ``, "```", e.body, "```", ``);
    }
    md.push(`---`, ``);
  }

  if (!DRY && entries.length) fs.writeFileSync(htmlPath, html);
}

if (!DRY) fs.writeFileSync(`${ROOT}/_IMAGE-PROMPTS.md`, md.join("\n"));

console.log(
  `${DRY ? "[DRY] " : ""}articles: ${articles} | prompts injected: ${injected} | GENERATE: ${gen} | CAPTURE: ${cap}`,
);
if (!DRY) console.log(`wrote ${ROOT}/_IMAGE-PROMPTS.md`);
