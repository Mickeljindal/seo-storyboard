// Apply the screenshot map across UNPUBLISHED content-studio articles.
//
// Rules (agreed with owner):
//   - Never touch published articles (content-studio/_published.json) or the
//     no-match slots (cloudflare, cron-jobs).
//   - Replace each synthetic ../assets/console/<slot>.png with the REAL support
//     screenshot, framework- and DB-engine-aware.
//   - For the article's CORE feature (detected from the slug), expand the first
//     clean <figure> of that slot into the full real STEP SEQUENCE. Every other
//     occurrence becomes the single representative "lead" image.
//   - Keep the .md mirror in sync.
//
// Usage:
//   node scripts/apply-screenshot-map.mjs --dry     (report only)
//   node scripts/apply-screenshot-map.mjs           (apply)
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = "content-studio";
const map = JSON.parse(fs.readFileSync(`${ROOT}/assets/console-real/screenshot-map.json`, "utf8"));
const publishedDoc = JSON.parse(fs.readFileSync(`${ROOT}/_published.json`, "utf8"));
const PUBLISHED = new Set((publishedDoc.published ?? []).map((p) => p.slug));
const NO_MATCH = new Set(map.noMatch);

const SLOTS = Object.keys({
  "add-server": 1, "add-server-region": 1, dashboard: 1, "add-application": 1,
  "launch-database": 1, "env-vars": 1, "git-deployment": 1, "server-health": 1,
  "manage-backups": 1, "flb-load-balancer": 1, "ssl-certificate": 1, "s3-buckets": 1,
  firewall: 1, "subusers-uac": 1, "user-2fa-security": 1, staging: 1, cloudflare: 1, "cron-jobs": 1,
});

// ---- detection from slug ------------------------------------------------
function detectFramework(slug) {
  const s = slug.toLowerCase();
  if (/next-?js/.test(s)) return "nextjs";
  if (/laravel/.test(s)) return "laravel";
  if (/django/.test(s)) return "django";
  if (/fast-?api/.test(s)) return "fastapi";
  if (/flask/.test(s)) return "flask";
  if (/\bvue\b|vuejs/.test(s)) return "vue";
  if (/angular/.test(s)) return "angular";
  if (/\breact\b/.test(s)) return "react";
  if (/pm2|multi-process|cluster/.test(s)) return "node";
  if (/node|express|nest/.test(s)) return "nodespm";
  return null;
}
function detectDbEngine(slug) {
  const s = slug.toLowerCase();
  if (/postgre|psql/.test(s)) return "postgres";
  if (/mariadb/.test(s)) return "mariadb";
  if (/mysql/.test(s)) return "mysql";
  if (/mongo/.test(s)) return "mongodb";
  if (/redis/.test(s)) return "redis";
  if (/elastic/.test(s)) return "elasticsearch";
  return null;
}
// which feature the article centers on -> expand that slot to full sequence
function detectCoreSlot(slug) {
  const s = slug.toLowerCase();
  if (/object-storage|(^|[-])s3([-]|$)|bucket/.test(s)) return "s3-buckets";
  if (/load-balancer|(^|[-])flb([-]|$)/.test(s)) return "flb-load-balancer";
  if (/backup|restore|disaster-recovery/.test(s)) return "manage-backups";
  if (/(^|[-])ssl([-]|$)|certificate|https|(^|[-])tls([-]|$)/.test(s)) return "ssl-certificate";
  if (/uac|subuser|team-member|access-control|user-role|permission/.test(s)) return "subusers-uac";
  if (/staging/.test(s)) return "staging";
  if (/server-health|monitoring|observability/.test(s)) return "server-health";
  if (/environment-variable|env-var|dotenv|(^|[-])secrets?([-]|$)/.test(s)) return "env-vars";
  if (/managed-(postgres|mysql|mariadb|mongo|redis|database)|(postgres|mysql|mongodb|redis|elasticsearch)-hosting|database-hosting/.test(s))
    return "launch-database";
  if (/ci-cd|cicd|continuous-deploy|auto-deploy|deploy-from-git|git-deploy/.test(s)) return "git-deployment";
  return null;
}

function resolveEntry(slot, fw, db) {
  if (NO_MATCH.has(slot)) return null;
  if (fw && map.frameworks[fw] && map.frameworks[fw][slot]) return map.frameworks[fw][slot];
  if (slot === "launch-database" && db && map.dbEngines[db]) return map.dbEngines[db]["launch-database"];
  return map.slots[slot] ?? null;
}
const REL = (local) => `../${local}`; // article dirs are one level under content-studio/

// ---- per-file rewriters -------------------------------------------------
function rewriteHtml(html, { fw, db, coreSlot }) {
  let changed = 0;
  let expandedCore = false;

  // 1) expand the core slot's first clean <figure> into the sequence
  if (coreSlot && !NO_MATCH.has(coreSlot)) {
    const entry = resolveEntry(coreSlot, fw, db);
    if (entry && entry.steps.length >= 2) {
      const re = new RegExp(
        `<figure\\b[^>]*>\\s*<img\\b[^>]*src="\\.\\./assets/console/${coreSlot}\\.png"[^>]*>\\s*(?:<figcaption[^>]*>[\\s\\S]*?</figcaption>\\s*)?</figure>`,
      );
      html = html.replace(re, () => {
        expandedCore = true;
        changed += entry.steps.length;
        return entry.steps
          .map(
            (st) =>
              `<figure>\n    <img src="${REL(st.local)}" alt="${st.caption.replace(/"/g, "&quot;")}">\n    <figcaption>${st.caption}</figcaption>\n  </figure>`,
          )
          .join("\n  ");
      });
    }
  }

  // 2) lead-swap every remaining synthetic console image
  for (const slot of SLOTS) {
    if (NO_MATCH.has(slot)) continue;
    const entry = resolveEntry(slot, fw, db);
    if (!entry) continue;
    const leadPath = REL(entry.lead.local);
    const needle = `../assets/console/${slot}.png`;
    if (html.includes(needle)) {
      html = html.split(needle).join(leadPath);
      changed++;
    }
  }
  return { html, changed, expandedCore };
}

function rewriteMd(md, { fw, db, coreSlot }) {
  let changed = 0;
  if (coreSlot && !NO_MATCH.has(coreSlot)) {
    const entry = resolveEntry(coreSlot, fw, db);
    if (entry && entry.steps.length >= 2) {
      const re = new RegExp(`!\\[[^\\]]*\\]\\(\\.\\./assets/console/${coreSlot}\\.png\\)`);
      md = md.replace(re, () => {
        changed += entry.steps.length;
        return entry.steps.map((st) => `![${st.caption}](${REL(st.local)})`).join("\n\n");
      });
    }
  }
  for (const slot of SLOTS) {
    if (NO_MATCH.has(slot)) continue;
    const entry = resolveEntry(slot, fw, db);
    if (!entry) continue;
    const leadPath = REL(entry.lead.local);
    const needle = `../assets/console/${slot}.png`;
    if (md.includes(needle)) {
      md = md.split(needle).join(leadPath);
      changed++;
    }
  }
  return { md, changed };
}

// ---- walk ----------------------------------------------------------------
const dirs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
  .map((d) => d.name);

let touched = 0,
  skippedPub = 0,
  noImg = 0,
  totalSwaps = 0,
  expansions = 0;
const report = [];

for (const slug of dirs) {
  if (PUBLISHED.has(slug)) {
    skippedPub++;
    continue;
  }
  const htmlPath = path.join(ROOT, slug, `${slug}.html`);
  const mdPath = path.join(ROOT, slug, `${slug}.md`);
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("../assets/console/")) {
    noImg++;
    continue;
  }
  const ctx = { fw: detectFramework(slug), db: detectDbEngine(slug), coreSlot: detectCoreSlot(slug) };
  const rH = rewriteHtml(html, ctx);
  let mdChanged = 0;
  let mdOut = null;
  if (fs.existsSync(mdPath)) {
    const md = fs.readFileSync(mdPath, "utf8");
    const rM = rewriteMd(md, ctx);
    mdOut = rM.md;
    mdChanged = rM.changed;
  }
  if (rH.changed === 0 && mdChanged === 0) continue;
  touched++;
  totalSwaps += rH.changed;
  if (rH.expandedCore) expansions++;
  report.push(
    `${slug}  [fw=${ctx.fw ?? "-"} db=${ctx.db ?? "-"} core=${ctx.coreSlot ?? "-"}${rH.expandedCore ? " EXPANDED" : ""}]  html=${rH.changed} md=${mdChanged}`,
  );
  if (!DRY) {
    fs.writeFileSync(htmlPath, rH.html);
    if (mdOut != null) fs.writeFileSync(mdPath, mdOut);
  }
}

console.log(report.join("\n"));
console.log(
  `\n${DRY ? "[DRY] " : ""}articles touched: ${touched} | image swaps: ${totalSwaps} | sequence expansions: ${expansions}`,
);
console.log(`skipped published: ${skippedPub} | no console images: ${noImg} | total dirs scanned: ${dirs.length}`);
