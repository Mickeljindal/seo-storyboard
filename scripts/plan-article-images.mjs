// Inventory every .img-slot across the library and classify what KIND of visual
// each one should be, so the right renderer can build it.
//
// Renderers:
//   svg  -> deterministic HTML/CSS + inline SVG, rasterized by Playwright.
//           Used for anything whose value is EXACT TEXT or precise structure:
//           terminal sessions, graphs, flows, architectures, comparison tables.
//           A raster image model garbles this kind of content, so it never goes there.
//   ai   -> local image model (mflux on the Mac GPU). Only for genuinely
//           illustrative/conceptual scenes with no text to get wrong.
//
// Run: node scripts/plan-article-images.mjs [--json]
import fs from "node:fs";
import path from "node:path";

const ROOT = "content-studio";

/** Pull every slot (hint + note) out of one article's HTML, in document order. */
export function parseSlots(html) {
  const slots = [];
  const re = /<figure class="img-slot"[^>]*>([\s\S]*?)<\/figure>/g;
  let m;
  while ((m = re.exec(html))) {
    const inner = m[1];
    const hint = (inner.match(/<em>([\s\S]*?)<\/em>/)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
    const note = (inner.match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
    slots.push({ raw: m[0], index: m.index, hint, note });
  }
  return slots;
}

/**
 * Decide the renderer + visual type from the slot's own description.
 *
 * Deliberately biased toward `svg`: exact text is the whole point of most of
 * these slots, and that is precisely what image models cannot do. `ai` is the
 * exception, not the default.
 */
export function classifySlot(hint, note = "") {
  const t = `${hint} ${note}`.toLowerCase();

  // Terminal / CLI / code output — exact commands matter.
  if (/\b(terminal|shell|cli|command|redis-cli|psql|mysql>|bash|ssh|npm |curl|docker|kubectl|systemctl|journalctl|tail |grep |log output|stack trace|error message|console output|prompt)\b/.test(t))
    return { renderer: "svg", type: "terminal" };

  // A magnitude comparison between named things, not a quantity over time. Must
  // be checked before `graph`: "a short storage bar next to a tall egress bar" is
  // meaningless as a line chart.
  if (/\bbar chart\b|\bbars?\b.{0,30}\bnext to\b|\b(short|tall|small|large) .{0,20}bar\b/.test(t))
    return { renderer: "svg", type: "bars" };

  // Two scenarios laid out over elapsed time, where the POINT is that one has a
  // gap and the other does not. A single line cannot express that.
  if (/\b(before and after|before\/after|beside it|side by side).{0,60}\b(timeline|deploy|outage|downtime|gap)\b/.test(t) ||
      /\btimeline\b.{0,60}\b(gap|outage|downtime|fail|versus|vs\.?)\b/.test(t) ||
      /\b(uptime|deploy) timeline\b/.test(t))
    return { renderer: "svg", type: "timeline" };

  // Time series / metrics / usage — needs axes and labels.
  if (/\b(graph|chart|curve|over time|memory usage|cpu usage|latency|p95|p99|throughput|spike|timeline|trend|histogram|line chart|metrics|dashboard graph|monitor)\b/.test(t))
    return { renderer: "svg", type: "graph" };

  // Side-by-side / before-after / matrix.
  if (/\b(compare|comparison|versus|vs\.?|side by side|side-by-side|before and after|before\/after|matrix|table|checklist|pricing|cost breakdown|tiers?)\b/.test(t))
    return { renderer: "svg", type: "comparison" };

  // Config / settings / form / field / rules.
  if (/\b(setting|settings|config|configuration|field|form|rule|rules|toggle|dropdown|env var|environment variable|\.env|header|whitelist|allow-?list|permission|questionnaire)\b/.test(t))
    return { renderer: "svg", type: "panel" };

  // One thing talking to SEVERAL at once. Checked before `flow`, because a
  // linear chain misrepresents a fan-out: drawing a balancer and two backends in
  // a row claims the second backend is downstream of the first.
  if (/\b(load balancer|balancer).{0,40}\b(nodes?|backends?|servers?|instances?|pool|pair)\b/.test(t) ||
      /\b(across|between|to) (two|three|four|several|multiple|both|all) (servers?|nodes?|instances?|regions?|replicas?|backends?|zones?)\b/.test(t) ||
      /\b(primary|writer).{0,30}\b(replicas?|read replicas?)\b/.test(t) ||
      /\bhealth ?check/.test(t))
    return { renderer: "svg", type: "fanout" };

  // Architecture / flow / request path / topology.
  if (/\b(architecture|diagram|flow|request path|topology|pipeline|sequence|how .* works|traffic|routes? through|load balancer|proxy|tiers?|layers?|region|failover|replica|backup flow|map)\b/.test(t))
    return { renderer: "svg", type: "flow" };

  // A real product screen: better served by the console screenshot map.
  if (/\b(kloudbean (console|dashboard)|the console|the dashboard|admin panel|screenshot of the)\b/.test(t))
    return { renderer: "screenshot", type: "console" };

  // A file's CONTENTS is text, so it belongs in a terminal card, not an image.
  if (/\b(authorized_keys|\.env file|config file|file with|contents of|ssh key|public key|non-root|service user|sudo)\b/.test(t))
    return { renderer: "svg", type: "terminal" };

  // Another product's UI, or a real browser window. No renderer here can produce
  // these faithfully, and faking them would be a lie, so they stay for a human.
  if (/\b(metabase|nextcloud|open ?webui|grafana|n8n|supabase studio|phpmyadmin|pgadmin|strapi|wp-admin)\b/.test(t))
    return { renderer: "manual", type: "third-party-ui" };
  if (/\b(network tab|devtools|dev tools|browser console|padlock|address bar|browser tabs|separate tabs|sprawl|live .* on your custom domain|admin login)\b/.test(t))
    return { renderer: "manual", type: "browser-shot" };

  // Genuinely pictorial / conceptual: safe for a local image model.
  //
  // Deliberately NARROW. An earlier version matched "team" and "person", which
  // fired on "one key per teammate" and "one account per person" - both of which
  // are terminal output, not illustrations. A wrong bucket here means an image
  // model gets asked to render exact text, which is the one thing it cannot do.
  if (/\b(photo|photograph|illustration|conceptual|abstract|metaphor|hero image|mood board|artwork)\b/.test(t))
    return { renderer: "ai", type: "illustration" };

  // Default: structured SVG. Safer than guessing raster for something textual.
  return { renderer: "svg", type: "flow" };
}

// Only scan when run directly. This file is also imported for its parseSlots /
// classifySlot helpers, and an import must not kick off a library-wide walk.
const RUN_DIRECTLY = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

const dirs = !RUN_DIRECTLY
  ? []
  : fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
      .map((d) => d.name);

const plan = [];
const tally = {};
for (const slug of dirs) {
  const f = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, "utf8");
  if (!html.includes('class="img-slot"')) continue;
  const slots = parseSlots(html);
  const entries = slots.map((s, i) => {
    const c = classifySlot(s.hint, s.note);
    tally[c.type] = (tally[c.type] ?? 0) + 1;
    tally[`renderer:${c.renderer}`] = (tally[`renderer:${c.renderer}`] ?? 0) + 1;
    return { n: i + 1, hint: s.hint, note: s.note, ...c };
  });
  plan.push({ slug, count: entries.length, slots: entries });
}

if (RUN_DIRECTLY) {
  if (process.argv.includes("--json")) {
    fs.mkdirSync(".local", { recursive: true });
    fs.writeFileSync(".local/image-plan.json", JSON.stringify(plan, null, 2));
    console.log(`wrote .local/image-plan.json`);
  }

  const total = plan.reduce((n, a) => n + a.count, 0);
  console.log(`articles with slots: ${plan.length} | total slots: ${total}\n`);
  console.log("by type:");
  for (const [k, v] of Object.entries(tally).filter(([k]) => !k.startsWith("renderer:")).sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(14)} ${v}`);
  console.log("by renderer:");
  for (const [k, v] of Object.entries(tally).filter(([k]) => k.startsWith("renderer:")).sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.replace("renderer:", "").padEnd(14)} ${v}`);
}
