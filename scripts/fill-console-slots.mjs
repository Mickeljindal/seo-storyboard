// Fill "console" .img-slot placeholders with the REAL Kloudbean dashboard
// screenshots already downloaded from support.kloudbean.com.
//
// No AI call is involved: the slot's own wording names the screen it wants, so a
// keyword match against the screenshot map is both cheaper and more reliable
// than asking a model to pick.
//
// Usage:
//   node scripts/fill-console-slots.mjs --dry
//   node scripts/fill-console-slots.mjs
import fs from "node:fs";
import path from "node:path";
import { parseSlots, classifySlot } from "./plan-article-images.mjs";

const ROOT = "content-studio";
const DRY = process.argv.includes("--dry");
const map = JSON.parse(fs.readFileSync(`${ROOT}/assets/console-real/screenshot-map.json`, "utf8"));
const PUBLISHED = new Set(
  (JSON.parse(fs.readFileSync(`${ROOT}/_published.json`, "utf8")).published ?? []).map((p) => p.slug),
);

/**
 * Which console screen a slot is asking for, matched on the words the editor used.
 * Ordered most-specific first, because "database" appears inside plenty of
 * sentences that are really about something else.
 */
/**
 * Slots that mention a screen but NOT a Kloudbean one: a third-party tool's own
 * admin panel, or a conceptual shot like "four browser tabs open at once".
 * Substituting a Kloudbean dashboard there would be actively misleading, so these
 * stay as placeholders for a human.
 */
const NOT_OURS = [
  // Another product's own UI.
  /open ?webui|grafana|n8n|supabase studio|phpmyadmin|pgadmin|wp-admin|wordpress admin|strapi admin/i,
  /github|gitlab|bitbucket|cloudflare dashboard|stripe/i,
  // A browser window rather than our console.
  /browser tabs|separate tabs|tabs .*open at once|sprawl/i,
  /network tab|devtools|dev tools|browser console|padlock|address bar|admin login/i,
];

// Order matters: the FIRST match wins, so the most specific screen has to come
// first. "environment variables ... custom domain" must land on env-vars, not on
// domain-aliases, which is why env-vars sits above the domain rule.
const RULES = [
  // "the dashboard showing servers, apps and databases under one login" is asking
  // for the overview screen, whatever feature the article happens to be about.
  [/dashboard (showing|listing|with).{0,60}(under one|one login|same account|all in one|servers?, ?apps)/i, "dashboard"],
  [/environment variable|env var|\.env/i, "env-vars"],
  [/domain alias|apex and www|domain management|where the domain goes|custom domain/i, "domain-aliases"],
  [/load balancer|flb/i, "flb-load-balancer"],
  [/bucket|object storage|s3/i, "s3-buckets"],
  [/backup|restore|snapshot/i, "manage-backups"],
  [/ssl|certificate|https|tls/i, "ssl-certificate"],
  [/staging/i, "staging"],
  [/git|deploy|repo|branch|pull & deploy|ci\/cd/i, "git-deployment"],
  [/managed database|launch a database|database.*(list|tile|section)|postgres|mysql|mongo|redis|elasticsearch/i, "launch-database"],
  [/health|monitor|cpu|memory|metric/i, "server-health"],
  [/firewall|ip (access|allow|whitelist)/i, "firewall"],
  [/team member|subuser|uac|permission|access control|role/i, "subusers-uac"],
  [/2fa|two-factor|account security|password/i, "user-2fa-security"],
  [/region|datacenter|data centre|location/i, "add-server-region"],
  [/add(ing)? (an )?app|application (list|page)|apps page/i, "add-application"],
  [/add(ing)? (a )?server|launch(ing)? (a )?server|provision/i, "add-server"],
  [/dashboard|console|one place|same account|single pane/i, "dashboard"],
];

function pickSlot(hint, note = "") {
  const t = `${hint} ${note}`;
  if (NOT_OURS.some((re) => re.test(t))) return null; // leave it for a human
  for (const [re, slot] of RULES) if (re.test(t)) return slot;
  return "dashboard"; // a real screen beats a placeholder
}

const dirs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
  .map((d) => d.name)
  .filter((s) => !PUBLISHED.has(s));

let filled = 0,
  touched = 0,
  missing = 0,
  skipped = 0;
const log = [];

for (const slug of dirs) {
  const htmlPath = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes('class="img-slot"')) continue;

  const slots = parseSlots(html);
  let changed = 0;
  for (const s of slots) {
    if (classifySlot(s.hint, s.note).renderer !== "screenshot") continue;
    const key = pickSlot(s.hint, s.note);
    if (!key) {
      skipped++;
      log.push(`  ${slug} -> SKIP (not a Kloudbean screen): ${s.hint.slice(0, 70)}`);
      continue;
    }
    const entry = map.slots[key];
    if (!entry?.lead) {
      missing++;
      continue;
    }
    // Article dirs sit one level under content-studio/, so step up one.
    const src = `../${entry.lead.local}`;
    const alt = s.hint.replace(/"/g, "&quot;").replace(/\s+/g, " ").trim().slice(0, 180);
    const cap = entry.lead.caption ?? s.hint.replace(/\s+/g, " ").trim().slice(0, 140);
    const figure = `<figure>\n    <img src="${src}" alt="${alt}">\n    <figcaption>${cap.replace(/</g, "&lt;")}</figcaption>\n  </figure>`;
    html = html.replace(s.raw, figure);
    changed++;
    filled++;
    log.push(`  ${slug} -> ${key}`);
  }
  if (changed && !DRY) {
    fs.writeFileSync(htmlPath, html);

    // Mirror into the .md by MATCHING EACH MARKER ON ITS OWN TEXT, not by
    // position. The markers and the HTML slots are not guaranteed to be in the
    // same order or the same count, so replacing the Nth marker could drop a
    // console screenshot where a diagram belongs.
    const mdPath = path.join(ROOT, slug, `${slug}.md`);
    if (fs.existsSync(mdPath)) {
      let md = fs.readFileSync(mdPath, "utf8");
      md = md.replace(/<!--\s*ADD IMAGE:([\s\S]*?)-->/g, (whole, inner) => {
        const hint = inner.replace(/\s+/g, " ").trim();
        if (classifySlot(hint).renderer !== "screenshot") return whole; // not ours
        const key = pickSlot(hint);
        const entry = key ? map.slots[key] : null;
        if (!entry?.lead) return whole;
        return `![${hint.replace(/[[\]]/g, "").slice(0, 140)}](../${entry.lead.local})`;
      });
      fs.writeFileSync(mdPath, md);
    }
  }
  if (changed) touched++;
}

console.log(log.join("\n"));
console.log(`\n${DRY ? "[DRY] " : ""}console slots filled: ${filled} | articles touched: ${touched} | unmatched: ${missing}`);
