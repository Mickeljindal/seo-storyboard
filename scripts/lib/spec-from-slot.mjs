// Turn a slot's own description into a strictly-shaped template spec.
//
// The AI supplies CONTENT only (commands, labels, rows, series). Layout, colour
// and typography stay in the templates, so hundreds of images come out visually
// consistent and nothing can drift into broken markup.
//
// Uses the same OpenAI-compatible endpoint the rest of the engine uses
// (AI_API_KEY/OPENAI_API_KEY + AI_BASE_URL/OPENAI_BASE_URL + AI_MODEL).

const SCHEMAS = {
  terminal: `{"type":"terminal","title":"short headline (<=52 chars)","subtitle":"one short clarifying line","tab":"e.g. redis-cli - session","lines":[{"kind":"cmd|out|ok|warn|err|comment","text":"...","prompt":"only on cmd lines"}]}
Rules: 6-12 lines. REAL runnable commands and REAL output shapes for that exact tool.
- ONLY "cmd" lines carry "prompt". An "out" line is the tool's reply and has NO prompt field, and must NEVER contain the prompt string itself.
- Output must match the tool. Redis replies "(integer) 1" and "OK", not "mycounter: 1". psql replies with a table. Get this right.
Worked example:
{"type":"terminal","title":"Redis counters and sorted sets","subtitle":"Real replies, not pseudo-code","tab":"redis-cli - session","lines":[{"kind":"cmd","text":"INCR page:views","prompt":"127.0.0.1:6379>"},{"kind":"out","text":"(integer) 1"},{"kind":"cmd","text":"ZADD board 100 alice","prompt":"127.0.0.1:6379>"},{"kind":"out","text":"(integer) 1"},{"kind":"cmd","text":"SET s:42 \\"{}\\" EX 60","prompt":"127.0.0.1:6379>"},{"kind":"ok","text":"OK"},{"kind":"comment","text":"# the key expires on its own"}]}`,
  graph: `{"type":"graph","title":"short headline","subtitle":"one line","yLabel":"what the y axis measures","xLabel":"time →","series":[12 numbers 0-100 telling the story],"ceiling":{"value":0-100,"label":"e.g. maxmemory"},"annotation":"short note on the shape"}
Rules: the series must SHOW the point (a climb, a plateau, a spike, a drop). Numbers are relative, not real measurements.
- USE THE FULL HEIGHT. The peak of the series must reach 88-100, otherwise the chart looks empty.
- A BASELINE IS NEVER 0. Quiet traffic sits around 8-15, so the reader can see it is a real line rather than nothing.
- A SPIKE IS STEEP: hold the baseline for several points, then jump to the peak within one or two points and stay there. Example of a spike: [10,12,9,11,10,95,98,96,99,97,98,96].
- If the description mentions ANY limit, ceiling, cap, max, quota or threshold being reached, you MUST include "ceiling" with that limit's real name as the label. Omit "ceiling" only when no limit is involved.
- Keep "annotation" under 60 characters and make it a complete phrase.
Worked example:
{"type":"graph","title":"Connections hit the Postgres cap","subtitle":"New clients start getting refused","yLabel":"Open connections","xLabel":"time →","series":[10,22,38,55,70,84,94,100,100,100,100,100],"ceiling":{"value":100,"label":"max_connections"},"annotation":"new clients refused past this line"}`,
  bars: `{"type":"bars","title":"short headline","subtitle":"one line","unitLabel":"what the bars measure","bars":[{"label":"name","value":0-100,"valueLabel":"short reading","tone":"purple|green|red|grey"}],"note":"one takeaway line"}
Rules: 2-5 bars comparing MAGNITUDE between named things. "value" is relative, not a measurement.
- Make the difference obvious: if one thing dwarfs another, the values must show it.
- "valueLabel" is a short qualitative reading like "small" or "10x larger". Never invent a price or a precise figure.
Worked example:
{"type":"bars","title":"Storage is cheap, moving data is not","subtitle":"Same files, two different costs","unitLabel":"relative monthly cost","bars":[{"label":"Storing the files","value":12,"valueLabel":"small","tone":"green"},{"label":"Egress for the same files","value":95,"valueLabel":"the real bill","tone":"red"}],"note":"Egress is what turns a cheap bucket into an expensive one."}`,
  timeline: `{"type":"timeline","title":"short headline","subtitle":"one line","lanes":[{"label":"scenario name","segments":[{"kind":"up|down|deploy","label":"short","width":1-10}]}],"note":"one takeaway line"}
Rules: 2 lanes, each the SAME scenario done differently, so the reader sees one lane has a red gap and the other does not.
- "up" = serving normally, "down" = failing requests, "deploy" = mid-deployment.
- Each lane needs 2-4 segments and the widths across a lane should sum to a similar total.
Worked example:
{"type":"timeline","title":"The gap a naive deploy leaves","subtitle":"Same release, two strategies","lanes":[{"label":"Stop then start","segments":[{"kind":"up","label":"old version","width":4},{"kind":"down","label":"requests fail","width":2},{"kind":"up","label":"new version","width":4}]},{"label":"Overlapping","segments":[{"kind":"up","label":"old version","width":4},{"kind":"deploy","label":"both live","width":2},{"kind":"up","label":"new version","width":4}]}],"note":"The new version is healthy before the old one stops, so nothing fails."}`,
  comparison: `{"type":"comparison","title":"short headline","subtitle":"one line","headers":["<name the thing being compared, e.g. Requirement / What you need / Check>","<Option A>","<Option B>"],"rows":[["the item being compared",{"text":"Yes","tone":"pos"},{"text":"No","tone":"neg"}]]}
Rules: 4-6 rows, 2-3 columns after the first. The FIRST header must be a real column name for that article's subject (never the literal words "Row label" or "Option").
- The first cell of each row is a plain string. EVERY other cell MUST be an object with a "tone": "pos" (good), "neg" (bad), "neu" (it depends). Never a bare string in a comparison column, or the colour coding is lost.
- Keep cell text under 22 characters.
Worked example:
{"type":"comparison","title":"One server or a balanced pair","subtitle":"What changes when a node dies","headers":["What happens","Single server","Balanced pair"],"rows":[["A node dies",{"text":"Site is down","tone":"neg"},{"text":"Traffic shifts","tone":"pos"}],["Deploys",{"text":"Downtime","tone":"neg"},{"text":"Rolling","tone":"pos"}],["Monthly cost",{"text":"Lower","tone":"pos"},{"text":"Roughly double","tone":"neu"}]]}`,
  panel: `{"type":"panel","title":"short headline","subtitle":"one line","label":"<a real section name, e.g. Environment variables>","rows":[{"k":"the setting or field name","v":"its value","highlight":true}],"confirm":"the reassuring result line"}
Rules: 3-5 rows. Highlight only the rows that carry the point. "v" is a short value or code.
- "label" must be a REAL section name from the product screen. Never output the literal words "SECTION LABEL".
- Omit "confirm" if nothing is being confirmed.
Worked example:
{"type":"panel","title":"Production environment variables","subtitle":"Set before the build, not after","label":"Environment variables","rows":[{"k":"DATABASE_URL","v":"postgres-123456","highlight":true},{"k":"NODE_ENV","v":"production","highlight":true},{"k":"PORT","v":"3000"}],"confirm":"Saved. The next deploy picks these up."}`,
  fanout: `{"type":"fanout","title":"short headline","subtitle":"one line","source":{"label":"the one thing","sub":"short detail"},"targets":[{"label":"target","sub":"short detail","tone":"purple|green|plain"}],"edgeLabel":"<=16 chars, what travels","note":"one takeaway line"}
Rules: use this when ONE thing talks to SEVERAL at once (a load balancer and its backends, a primary and its replicas, an app and several services). 2-4 targets.
- Targets are PARALLEL siblings, never a sequence. Do not imply one target feeds the next.
- Tone: "green" for a healthy target, "red" for a failing or removed one, "purple" otherwise.
Worked example:
{"type":"fanout","title":"Health checks run against every node","subtitle":"The balancer polls each backend independently","source":{"label":"Load balancer","sub":"polls every few seconds"},"targets":[{"label":"App server 1","sub":"passing","tone":"green"},{"label":"App server 2","sub":"failing, taken out","tone":"purple"}],"edgeLabel":"health check","note":"A node that fails its check stops receiving traffic until it recovers."}`,
  flow: `{"type":"flow","title":"short headline","subtitle":"one line","nodes":[{"label":"stage","sub":"3-5 word detail","tone":"dark|purple|green|plain"}],"edges":["<=16 chars","..."],"note":"one takeaway line"}
Rules: 3-4 nodes, left to right, in real execution order. edges has exactly nodes.length-1 entries. First node "dark", last "green", middle "purple".
- Each edge label is what TRAVELS along that arrow: <=14 chars, lowercase, no arrows, and it must NOT repeat the node names. Good: "HTTPS", "routes", "SQL query", "cache miss". Bad: "Browser <= LB", "-> App".
Worked example:
{"type":"flow","title":"How a request reaches your app","subtitle":"One hop per box","nodes":[{"label":"Browser","sub":"user request","tone":"dark"},{"label":"Load balancer","sub":"health checks","tone":"purple"},{"label":"App servers","sub":"two instances","tone":"purple"},{"label":"Database","sub":"single primary","tone":"green"}],"edges":["HTTPS","routes","SQL query"],"note":"If one app server fails, the balancer stops sending it traffic."}`,
};

const SYSTEM = `You design ONE technical diagram for a Kloudbean engineering blog. You return STRICT JSON matching the given schema. No markdown, no prose, no code fences.

Hard rules:
- Everything must be TECHNICALLY CORRECT and realistic. Real command names, real flags, real output shapes, real port numbers, real env var names.
- NEVER invent benchmarks, percentages, prices, or customer numbers. Graph series are relative shapes, not measurements.
- Keep every string tight. Titles <=52 chars. No em-dashes. No marketing language.
- Kloudbean facts only where relevant: managed databases have their own host (e.g. postgres-123456.kloudbeansite.com) and are locked down with IP allow-listing; the app's own MySQL/MariaDB is on the app server at 127.0.0.1:3306. Never claim a managed Postgres/Redis runs on localhost.
- Answer with JSON only.`;

/**
 * Where to get a spec from.
 *
 * LOCAL FIRST, deliberately. A local mlx-lm server on Apple Silicon writes these
 * small JSON specs perfectly well, costs nothing, needs no key, and does not stop
 * working when a credit balance runs out, which is exactly what blocked a 600-image
 * batch before. The hosted endpoint stays as a fallback for machines without the
 * local model running.
 *
 * Start the local server with:
 *   .venv-image/bin/mlx_lm.server --model mlx-community/Qwen2.5-7B-Instruct-4bit --port 8081
 */
const LOCAL_BASE = (process.env.LOCAL_AI_BASE_URL?.trim() || "http://127.0.0.1:8081/v1").replace(/\/$/, "");
const LOCAL_MODEL = process.env.LOCAL_AI_MODEL?.trim() || "mlx-community/Qwen2.5-7B-Instruct-4bit";

let _localUp = null;
async function localAvailable() {
  if (_localUp !== null) return _localUp;
  if (process.env.IMAGE_SPEC_FORCE_REMOTE === "1") return (_localUp = false);
  try {
    const res = await fetch(`${LOCAL_BASE}/models`, { signal: AbortSignal.timeout(2500) });
    _localUp = res.ok;
  } catch {
    _localUp = false;
  }
  return _localUp;
}

function remoteConfig() {
  const key = process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  const base = (process.env.AI_BASE_URL?.trim() || process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  return key ? { key, base, model, local: false } : null;
}

async function aiConfig() {
  if (await localAvailable()) return { key: "local", base: LOCAL_BASE, model: LOCAL_MODEL, local: true };
  return remoteConfig();
}

/**
 * Ask the model for a spec for this slot.
 * @param {'terminal'|'graph'|'comparison'|'panel'|'flow'} type
 * @param {{hint:string, note?:string, articleTitle:string, slug:string}} ctx
 */
export async function specFromSlot(type, ctx) {
  const cfg = await aiConfig();
  if (!cfg)
    throw new Error(
      "No spec backend. Start the local model (.venv-image/bin/mlx_lm.server --model mlx-community/Qwen2.5-7B-Instruct-4bit --port 8081) or set AI_API_KEY.",
    );
  const schema = SCHEMAS[type];
  if (!schema) throw new Error(`no schema for type ${type}`);

  const prompt = `Article: "${ctx.articleTitle}" (slug: ${ctx.slug})
The editor asked for this specific visual, in their own words:
  "${ctx.hint}"${ctx.note ? `\n  extra note: "${ctx.note}"` : ""}

Produce a ${type} visual for exactly that. Match this JSON schema:
${schema}`;

  // A spec is a small JSON object, so max_tokens is capped deliberately: left
  // unset, some gateways reserve their whole context window and then refuse the
  // call outright when the credit balance is low.
  //
  // The ladder exists because that refusal is a 402 that names a smaller budget
  // we COULD afford. Retrying smaller turns a hard failure into a slightly
  // terser diagram, which is the right trade for a 739-image batch.
  // Locally there is no budget to run out of, so ask once with generous room.
  // The hosted path keeps the shrinking ladder, because a 402 there names a
  // smaller budget we could still afford and a terser diagram beats a failure.
  // Terminal transcripts are the longest specs by far (up to 14 lines, each an
  // object), so they get extra room. Everything else fits comfortably.
  const localBudget = type === "terminal" ? 1400 : 900;
  const start = Number(process.env.IMAGE_SPEC_MAX_TOKENS ?? (cfg.local ? localBudget : 650));
  const ladder = cfg.local ? [start] : [start, 400, 300, 220].filter((n, i, a) => n > 0 && a.indexOf(n) === i);

  // A small local model occasionally emits a malformed array or a stray trailing
  // comma. One retry at a lower temperature fixes almost all of those, and is far
  // cheaper than losing the image.
  const attempts = cfg.local ? [0.4, 0.15] : [0.4];
  let parseErr = null;
  for (const temperature of attempts) {
    try {
      return await requestSpec(cfg, type, prompt, ladder, temperature);
    } catch (e) {
      const msg = String(e?.message ?? e);
      // Retry both malformed JSON and a spec that parsed but would render badly
      // (currently a degenerate graph series). Both are the model having an off
      // moment, and a second pass at lower temperature usually fixes them.
      if (/JSON|Expected|Unexpected|truncated|degenerate/i.test(msg)) {
        parseErr = e;
        continue;
      }
      throw e;
    }
  }
  throw parseErr ?? new Error("spec generation failed");
}

async function requestSpec(cfg, type, prompt, ladder, temperature) {
  let lastErr = "";
  for (const maxTokens of ladder) {
    const res = await fetch(`${cfg.base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.local ? {} : { Authorization: `Bearer ${cfg.key}` }),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
        // mlx_lm.server does not implement response_format, and the prompt plus
        // the brace-extraction below already guarantee we get an object out.
        ...(cfg.local ? {} : { response_format: { type: "json_object" } }),
      }),
      // Local generation is slower per call than a hosted API, so allow more time.
      signal: AbortSignal.timeout(cfg.local ? 180_000 : 90_000),
    });

    if (res.status === 402) {
      lastErr = `AI 402 at max_tokens=${maxTokens}`;
      continue; // try a smaller budget
    }
    if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    const first = text.indexOf("{");
    if (first < 0) throw new Error("AI returned no JSON object");
    const last = text.lastIndexOf("}");
    const raw = last > first ? text.slice(first, last + 1) : text.slice(first);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // A long terminal transcript can run past the token limit and stop
      // mid-array. The part that DID arrive is usually perfectly good, so repair
      // the structure rather than throwing the whole spec away.
      parsed = JSON.parse(repairJson(raw));
    }
    return sanitizeSpec(type, parsed);
  }
  throw new Error(`${lastErr} — out of AI credits, top up OpenRouter or set DEEPSEEK_API_KEY`);
}

/**
 * Salvage truncated or slightly malformed JSON.
 *
 * Handles the three things a small model actually gets wrong: it stops
 * mid-generation leaving unclosed strings/arrays/objects, it leaves a trailing
 * comma, and it emits a raw newline or tab inside a string. Everything else is
 * left to fail loudly.
 */
export function repairJson(raw) {
  let s = raw.replace(/```json|```/g, "").trim();

  // Escape control characters that appear INSIDE string literals.
  let out = "";
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      esc = true;
      continue;
    }
    if (ch === '"') inStr = !inStr;
    if (inStr && (ch === "\n" || ch === "\r" || ch === "\t")) {
      out += ch === "\t" ? "\\t" : "\\n";
      continue;
    }
    out += ch;
  }
  s = out;

  // If a string was left open by truncation, close it.
  const quotes = (s.match(/(?<!\\)"/g) ?? []).length;
  if (quotes % 2 === 1) s += '"';

  // Drop a dangling comma, or a key that was cut off before its value arrived
  // (`..., "b` or `..., "b":`). Both leave JSON that can never parse.
  s = s
    .replace(/,\s*$/, "")
    .replace(/,\s*"[^"]*"?\s*:?\s*$/, "")
    .replace(/\{\s*"[^"]*"?\s*:?\s*$/, "{");
  const stack = [];
  inStr = false;
  esc = false;
  for (const ch of s) {
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  while (stack.length) s += stack.pop() === "{" ? "}" : "]";

  return s.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Defensive normalisation. The templates trust their input, so anything that
 * could break a layout (an over-long edge label, a wrong-length edges array, a
 * non-numeric series) is corrected here rather than in the template.
 */
export function sanitizeSpec(type, s) {
  // Em-dashes are banned in our prose style, but a bare comma reads wrong in a
  // terminal tab title ("redis-cli , session"), so use a hyphen separator.
  const clip = (v, n) => (typeof v === "string" ? v.replace(/\s*—\s*/g, " - ").trim().slice(0, n) : v);
  /** Clip to a whole word, so a label never ends mid-word. */
  const wordClip = (v, n) => {
    if (typeof v !== "string") return v;
    const t = v.replace(/\s*—\s*/g, " - ").trim();
    if (t.length <= n) return t;
    return t.slice(0, n).replace(/\s+\S*$/, "");
  };
  s.title = clip(s.title, 64);
  s.subtitle = clip(s.subtitle, 110);

  if (type === "bars") {
    s.unitLabel = clip(s.unitLabel, 40);
    s.bars = (s.bars ?? []).slice(0, 6).map((b, i) => ({
      label: clip(b.label, 34),
      value: Math.max(0, Math.min(100, Number(b.value) || 0)),
      valueLabel: clip(b.valueLabel, 18),
      tone: ["purple", "green", "red", "grey"].includes(b.tone) ? b.tone : i === 0 ? "purple" : "grey",
    }));
    if (s.bars.length < 2) throw new Error("bars needs at least 2 bars");
    // All-equal bars show nothing; the whole point is the difference in magnitude.
    if (new Set(s.bars.map((b) => b.value)).size < 2) throw new Error("degenerate bars (all equal)");
    s.note = clip(s.note, 120);
  }
  if (type === "timeline") {
    s.lanes = (s.lanes ?? []).slice(0, 3).map((l) => ({
      label: clip(l.label, 26),
      segments: (l.segments ?? []).slice(0, 5).map((g) => ({
        kind: ["up", "down", "deploy"].includes(g.kind) ? g.kind : "up",
        label: clip(g.label, 22),
        width: Math.max(1, Math.min(10, Number(g.width) || 1)),
      })),
    })).filter((l) => l.segments.length);
    if (s.lanes.length < 2) throw new Error("timeline needs 2 lanes to compare");
    s.note = clip(s.note, 120);
  }
  if (type === "fanout") {
    s.source = {
      label: clip(s.source?.label, 22) || "Source",
      sub: clip(s.source?.sub, 30),
    };
    s.targets = (s.targets ?? []).slice(0, 4).map((t) => {
      const sub = clip(t.sub, 30) ?? "";
      // A node described as failing should LOOK failing. Colour carries this
      // faster than the sub-label does.
      const bad = /\b(fail|failing|failed|down|unhealthy|removed|taken out|offline|refused|error)\b/i.test(sub);
      return {
        label: clip(t.label, 26),
        sub,
        tone: ["purple", "green", "red", "plain"].includes(t.tone) && !bad ? t.tone : bad ? "red" : "purple",
      };
    });
    // A single target is not a fan-out; the caller should have used flow.
    if (s.targets.length < 2) s.targets.push({ label: "Second node", sub: "", tone: "purple" });
    s.edgeLabel = clip(s.edgeLabel, 16);
    s.note = clip(s.note, 120);
  }
  if (type === "flow") {
    s.nodes = (s.nodes ?? []).slice(0, 4).map((n, i, arr) => ({
      label: clip(n.label, 22),
      sub: clip(n.sub, 30),
      tone: n.tone ?? (i === 0 ? "dark" : i === arr.length - 1 ? "green" : "purple"),
    }));
    const need = Math.max(0, s.nodes.length - 1);
    const nodeWords = new Set(
      s.nodes.flatMap((n) => String(n.label ?? "").toLowerCase().split(/\s+/)).filter(Boolean),
    );
    s.edges = (s.edges ?? [])
      .slice(0, need)
      .map((e) => {
        // Strip arrow glyphs and any restatement of the node names: an edge saying
        // "Browser <= LB" is noise, because both boxes are already labelled.
        let t = String(e ?? "").replace(/[<>=→←-]{2,}|[→←]/g, " ").replace(/\s+/g, " ").trim();
        const kept = t
          .split(" ")
          .filter((w) => !nodeWords.has(w.toLowerCase().replace(/[^a-z0-9]/gi, "")))
          .join(" ")
          .trim();
        if (kept) t = kept;
        return clip(t, 14);
      })
      .map((e) => e || "");
    s.note = clip(s.note, 120);
  }
  if (type === "terminal") {
    s.tab = clip(s.tab, 40);
    s.lines = (s.lines ?? [])
      .slice(0, 14)
      .map((l) => {
        const kind = ["cmd", "out", "ok", "warn", "err", "comment"].includes(l.kind) ? l.kind : "out";
        let text = clip(l.text, 96) ?? "";
        // A reply line must not carry the prompt: small models like to echo
        // "127.0.0.1:6379>" as output, which reads as a broken transcript.
        if (kind !== "cmd") text = text.replace(/^\s*(?:\$|[\w.:-]+>)\s*/, "").trim();
        return { kind, text, ...(kind === "cmd" ? { prompt: clip(l.prompt, 24) || "$" } : {}) };
      })
      // Drop lines that were nothing but a prompt.
      .filter((l) => l.text.length > 0);
  }
  if (type === "graph") {
    s.series = (Array.isArray(s.series) ? s.series : [])
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.max(0, Math.min(100, n)))
      .slice(0, 16);
    if (s.series.length < 4) s.series = [6, 20, 38, 56, 70, 80, 86, 88, 87, 88];

    // Reject a DEGENERATE series. A small model sometimes emits something like
    // [0,0,0,0,0,0,0,0,0,100]: a flat line with one spike at the end, which
    // renders as an empty chart and tells the reader nothing. Throwing here sends
    // it back through the retry rather than shipping a meaningless graph.
    const distinct = new Set(s.series).size;
    const counts = {};
    for (const v of s.series) counts[v] = (counts[v] ?? 0) + 1;
    const dominant = Math.max(...Object.values(counts)) / s.series.length;
    if (distinct < 4 || dominant > 0.7) {
      throw new Error(`degenerate graph series (${distinct} distinct, ${Math.round(dominant * 100)}% one value)`);
    }
    // A series that never climbs past the lower half leaves most of the chart
    // empty and reads as a rendering fault rather than data.
    const peak = Math.max(...s.series);
    if (peak < 60) throw new Error(`weak graph series (peak only ${peak})`);
    // Lift a zero floor: a baseline drawn exactly on the axis looks like no data.
    if (Math.min(...s.series) === 0) s.series = s.series.map((v) => (v === 0 ? 8 : v));
    if (s.ceiling && !Number.isFinite(Number(s.ceiling.value))) delete s.ceiling;
    if (s.ceiling) s.ceiling = { value: Number(s.ceiling.value), label: clip(s.ceiling.label, 24) };
    s.yLabel = clip(s.yLabel, 30);
    s.xLabel = clip(s.xLabel, 24) || "time →";
    // Clipped on a word boundary: a mid-word cut ("as keys are") reads like a bug.
    s.annotation = wordClip(s.annotation, 62);
  }
  if (type === "comparison") {
    s.headers = (s.headers ?? []).slice(0, 4).map((h) => clip(h, 26));
    // The model sometimes echoes the schema's own placeholder. Shipping "Row
    // label" as a visible column header looks like a broken template, so swap in
    // a neutral but sensible name.
    if (/^(row ?label|label|item|option [ab]|column ?\d?)$/i.test(String(s.headers[0] ?? "")))
      s.headers[0] = "Requirement";
    // Words that reliably indicate a good or bad outcome, so a bare string cell
    // still gets its colour. Without this the table renders as flat grey text and
    // loses the at-a-glance read that is the whole point of a comparison.
    const POS = /\b(yes|always|included|free|automatic|automated|built-?in|supported|continues?|fail-?safe|higher|better|rolling|zero|none|instant|ideal|by design)\b/i;
    const NEG = /\b(no|never|down|outage|manual|extra|unsupported|not (its job|available|supported)|lower|worse|limited|downtime|lost|fails?)\b/i;
    s.rows = (s.rows ?? []).slice(0, 7).map((r, ri) =>
      (Array.isArray(r) ? r : []).slice(0, s.headers.length).map((c, ci) => {
        if (c && typeof c === "object")
          return {
            text: clip(c.text, 24),
            tone: ["pos", "neg", "neu"].includes(c.tone) ? c.tone : "neu",
            mono: !!c.mono,
          };
        const text = clip(c, 40) ?? "";
        if (ci === 0) return text; // first column is the row label, stays plain
        return { text: clip(text, 24), tone: POS.test(text) ? "pos" : NEG.test(text) ? "neg" : "neu" };
      }),
    );
  }
  if (type === "panel") {
    s.label = clip(s.label, 34);
    // Same class of bug as the comparison "Row label": the model echoes the
    // schema's own placeholder, and it renders as a visibly broken template.
    if (/^(section ?label|label|section|title|placeholder)$/i.test(String(s.label ?? "").trim()))
      s.label = "Settings";
    s.rows = (s.rows ?? []).slice(0, 6).map((r) => ({
      k: clip(r.k, 46),
      v: clip(r.v, 26),
      highlight: !!r.highlight,
    }));
    s.confirm = clip(s.confirm, 88);
  }
  return s;
}
