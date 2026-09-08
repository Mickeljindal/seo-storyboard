#!/usr/bin/env node
/**
 * Upgrade the conversion block at the end of every UNPUBLISHED article to the
 * CTA pattern the owner hand-built on live WordPress.
 *
 *   node scripts/upgrade-article-ctas.mjs                  # dry run, prints the plan
 *   node scripts/upgrade-article-ctas.mjs --apply          # write the changes
 *   node scripts/upgrade-article-ctas.mjs --only <slug>    # single article
 *
 * WHAT IT LEARNS FROM (captured read-only from live posts, see
 * scripts/extract-live-cta-patterns.mjs):
 *   - a self-contained block with an ISOLATED class prefix and its own <style>,
 *     so pasting into WordPress cannot collide with theme CSS
 *   - wrap: max-width 1140px, padding 60px, radius 22px, gradient overlay,
 *     decorative glow, optional background artwork, responsive at 768px
 *   - content order: pill eyebrow, 48px heading, 18px description,
 *     tick feature chips, then a white primary button and an underlined link
 *   - the real destinations: console.kloudbean.com/register for signup, the
 *     pricing page, and calendly.com/kloudbean for a sales conversation
 *   - the Saudi treatment: Saudi green #006C35, the Saudi skyline artwork, a
 *     flag eyebrow, and in-Kingdom Dammam wording
 *
 * DELIBERATE DIFFERENCE FROM THE LIVE SAUDI CTA: the live version lists private
 * networking, VPN, and SAML SSO as plain features. Steering says VPC and VPN are
 * Enterprise-only and SAML SSO is unconfirmed, so those chips are either labelled
 * Enterprise or left out here rather than promised on a standard plan.
 *
 * Live articles are never touched.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");

const apply = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const REGISTER = "https://console.kloudbean.com/register";
const PRICING = "https://www.kloudbean.com/pricing/";
const CALENDLY = "https://calendly.com/kloudbean";
const SKYLINE = "https://www.kloudbean.com/wp-content/uploads/2026/08/Saudi-Arabia-Skyline-.svg";

/* ---------------------------------------------------------------------------
 * Variants. Each is a real audience with its own promise and its own chips.
 * Headings stay short on purpose so they read like a person wrote them.
 * Every chip below is traceable to the product-truth steering files.
 * ------------------------------------------------------------------------- */
const VARIANTS = {
  ksa: {
    prefix: "kbcta-ksa",
    theme: "ksa",
    eyebrow: "&#127774; IN-KINGDOM CLOUD INFRASTRUCTURE",
    headings: [
      "Keep your data inside the Kingdom.",
      "Run it in Dammam, not a region abroad.",
      "In-Kingdom hosting, managed for you.",
    ],
    descriptions: [
      "Launch a managed server and managed databases in Google Cloud's Dammam region (me-central2), keep automatic backups in-Kingdom, and run the whole stack from one dashboard.",
      "Provision in Google Cloud's Dammam region (me-central2) so the server, the managed database, and the backups all stay on Saudi soil, managed from a single dashboard.",
    ],
    features: [
      "Dammam (me-central2)",
      "Managed databases",
      "Object storage",
      "Automatic backups",
      "Free SSL",
      "One dashboard",
      "Free migration assistance",
    ],
    secondary: { label: "Talk to a cloud expert", href: CALENDLY },
  },
  compliance: {
    prefix: "kbcta-gov",
    theme: "ksa",
    eyebrow: "&#127774; REGULATED &amp; GOVERNMENT WORKLOADS",
    headings: [
      "Build the infrastructure half properly.",
      "Controls you can actually evidence.",
      "The technical controls, documented.",
    ],
    descriptions: [
      "Kloudbean delivers the infrastructure alignment behind these controls on managed enterprise engagements: centralised logging, immutable retention, private database access, MFA, and in-Kingdom hosting where required. Certification is assessed against your organisation, so governance and application work stay with you.",
      "On managed enterprise engagements Kloudbean builds and maintains the infrastructure controls, with evidence delivered as managed reports and in-Kingdom hosting available. The policy, staffing, and application-layer work remains yours, which is the honest boundary.",
    ],
    features: [
      "In-Kingdom (Dammam) available",
      "Centralised logging",
      "Immutable log storage",
      "Private database access",
      "MFA and least privilege",
      "Automatic backups",
      "Evidence as managed reports",
    ],
    secondary: { label: "Talk to a cloud expert", href: CALENDLY },
  },
  ai: {
    prefix: "kbcta-ai",
    theme: "navy",
    eyebrow: "AI APPS &middot; PRODUCTION INFRASTRUCTURE",
    headings: [
      "You built the app. Give it a real home.",
      "Take it off localhost for good.",
      "Prototype to production, without the babysitting.",
    ],
    descriptions: [
      "Run the app as an always-on process with managed databases, Redis, object storage, and automatic backups beside it. Deploy from Git with live build logs, and keep the infrastructure someone else's problem.",
      "Move the whole thing onto a managed server you own: always-on processes, a managed database for real data, object storage for uploads, and Git deploys with live build logs.",
    ],
    features: [
      "Managed databases",
      "Always-on processes",
      "Object storage",
      "Automatic backups",
      "Free SSL",
      "Git deploy",
      "Free migration",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  database: {
    prefix: "kbcta-db",
    theme: "teal",
    eyebrow: "MANAGED DATABASES &middot; SEVEN ENGINES",
    headings: [
      "A database you can dump and take with you.",
      "Managed, backed up, and still yours.",
      "One click to a real database.",
    ],
    descriptions: [
      "Launch MySQL, MariaDB, PostgreSQL, Redis, Memcached, MongoDB, or Elasticsearch in a click, reachable from your app server with automatic backups from minute one. Standard connection strings, standard dumps, no proprietary format.",
      "Seven managed engines, provisioned and patched for you, with access controlled and backups running automatically. Your schema, your queries, and your data stay exportable with the standard tools.",
    ],
    features: [
      "Seven managed engines",
      "One-click launch",
      "Automatic backups",
      "Controlled access",
      "Standard connection strings",
      "Free migration assistance",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  wordpress: {
    prefix: "kbcta-wp",
    theme: "navy",
    eyebrow: "MANAGED WORDPRESS &middot; ONE DASHBOARD",
    headings: [
      "WordPress, without the server admin.",
      "Managed stack, staging, and backups.",
      "Let someone else patch the server.",
    ],
    descriptions: [
      "Run WordPress and WooCommerce on a managed server with a staging site, automatic backups, free auto-renewing SSL, and a managed MySQL or MariaDB beside it. Pick the cloud and the region yourself.",
      "The stack, the patching, SSL, and backups are handled, so your work stays on the site rather than the box. Staging is one click, and the managed database sits right next to the app.",
    ],
    features: [
      "Managed WordPress stack",
      "One-click staging",
      "Managed MySQL and MariaDB",
      "Automatic backups",
      "Free SSL",
      "Built-in load balancer",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  agency: {
    prefix: "kbcta-agency",
    theme: "navy",
    eyebrow: "FOR AGENCIES &middot; MANY CLIENTS, ONE CONSOLE",
    headings: [
      "Run the whole client book from one console.",
      "One login. Every client app.",
      "Stop paying a platform per client.",
    ],
    descriptions: [
      "Host client apps as isolated applications on servers you own, each with its own database and SSL, with per-app backups and Git deploys, and scoped access for teammates through subusers and user access control.",
      "Consolidate the dashboards: isolated apps on managed servers, per-client databases, per-app backups you can restore individually, and permissions scoped per resource and action.",
    ],
    features: [
      "One dashboard",
      "Per-client isolation",
      "Subusers and access control",
      "Per-app backups",
      "Git deploys",
      "Free migration assistance",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  migration: {
    prefix: "kbcta-move",
    theme: "purple",
    eyebrow: "MIGRATE &middot; FLAT, PREDICTABLE PRICING",
    headings: [
      "Move it once. Own it after.",
      "Bring the app. Keep the deploy flow.",
      "A rehoming, not a rewrite.",
    ],
    descriptions: [
      "Migration assistance is free and there is a free trial to prove the setup first. You keep Git-based deploys, get managed databases beside the app, and pay a flat monthly price on the cloud you choose.",
      "Standard code moves onto a standard Linux server, so this is a migration rather than a rewrite. Pick from seven clouds, keep push-to-deploy, and get help moving the first workload across.",
    ],
    features: [
      "Free migration assistance",
      "Free trial",
      "Seven cloud providers",
      "Flat monthly price",
      "Managed databases",
      "Git deploy",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  security: {
    prefix: "kbcta-sec",
    theme: "navy",
    eyebrow: "SECURITY &middot; HARDENED BY DEFAULT",
    headings: [
      "The server layer, hardened for you.",
      "Patched, firewalled, and backed up.",
      "Close the doors you keep forgetting.",
    ],
    descriptions: [
      "Every server ships with a Shorewall firewall and Fail2ban, free auto-renewing SSL, automatic backups, and OS patching handled. Add IP access control or a Basic Auth gate when a site should not be public.",
      "The platform keeps the server, stack, SSL, and patching current, with automatic backups running. Application-level security stays yours, and that split is deliberate rather than hidden.",
    ],
    features: [
      "Shorewall firewall",
      "Fail2ban",
      "OS patching handled",
      "Free SSL",
      "IP access control",
      "Automatic backups",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  troubleshoot: {
    prefix: "kbcta-fix",
    theme: "navy",
    eyebrow: "DEPLOY &middot; LOGS THAT TELL YOU WHY",
    headings: [
      "Deploys that tell you what broke.",
      "Read the log, fix it, ship again.",
      "Fewer mysteries on the next deploy.",
    ],
    descriptions: [
      "Build logs stream live in the console, deployment history keeps what happened, and the logs viewer separates app errors from web requests, so a failed start is a five-minute read rather than a guessing game.",
      "Deploy from Git, watch the build output as it runs, and open the app error log when a process refuses to start. Managed processes restart on crash, and backups are automatic.",
    ],
    features: [
      "Live build logs",
      "Deployment history",
      "Logs viewer",
      "Managed process restarts",
      "Automatic backups",
      "Git deploy",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
  enterprise: {
    prefix: "kbcta-ent",
    theme: "purple",
    eyebrow: "ENTERPRISE &middot; CUSTOM ARCHITECTURE",
    headings: [
      "Architecture built around your requirements.",
      "The enterprise path, run for you.",
      "When the standard shape is not enough.",
    ],
    descriptions: [
      "Kubernetes, autoscaling, private networking, and the account-wide audit trail are part of the Enterprise package, delivered as a custom setup rather than a toggle on a standard plan. Pricing is scoped to the engagement.",
      "For workloads that need orchestration, private networking, or a custom architecture, Kloudbean operates it as an Enterprise engagement, acting like your in-house infrastructure team.",
    ],
    features: [
      "Kubernetes (Enterprise)",
      "Autoscaling (Enterprise)",
      "Private networking (Enterprise)",
      "Audit trail (Enterprise)",
      "Custom architecture",
      "In-Kingdom available",
    ],
    secondary: { label: "Talk to a cloud expert", href: CALENDLY },
  },
  general: {
    prefix: "kbcta-run",
    theme: "navy",
    eyebrow: "MANAGED CLOUD &middot; ONE DASHBOARD",
    headings: [
      "Own the server. Skip the server admin.",
      "One dashboard for the whole stack.",
      "Ship the app, not the infrastructure.",
    ],
    descriptions: [
      "Servers, managed databases, object storage, and a built-in load balancer live behind one login, on the cloud and region you pick. The stack, SSL, patching, and backups are handled for you.",
      "Pick from seven clouds, run your app on a managed server you control, and keep databases, storage, and deploys in the same dashboard instead of four separate vendors.",
    ],
    features: [
      "Seven cloud providers",
      "Managed databases",
      "Object storage",
      "Automatic backups",
      "Free SSL",
      "Git deploy",
      "Free migration assistance",
    ],
    secondary: { label: "See plans", href: PRICING },
  },
};

/* Theme colours. ksa uses the Saudi green and the skyline artwork the owner
 * uploaded; the others stay on the brand navy with different accents. */
const THEMES = {
  ksa: {
    base: "#006C35",
    overlay:
      "linear-gradient(100deg, rgba(0,60,30,.98) 0%, rgba(0,90,45,.96) 45%, rgba(0,108,53,.65) 70%, rgba(0,108,53,.18) 100%)",
    artwork: SKYLINE,
    glow: "rgba(255,255,255,.10)",
    btnText: "#006C35",
  },
  navy: {
    base: "#000F27",
    overlay: "linear-gradient(105deg, #000F27 0%, #04142E 55%, rgba(4,20,46,.78) 100%)",
    artwork: null,
    glow: "rgba(79,26,243,.20)",
    btnText: "#000F27",
  },
  purple: {
    base: "#0A0730",
    overlay: "linear-gradient(105deg, #0A0730 0%, #1B0F5A 58%, rgba(79,26,243,.55) 100%)",
    artwork: null,
    glow: "rgba(79,26,243,.28)",
    btnText: "#2A0E7A",
  },
  teal: {
    base: "#04202B",
    overlay: "linear-gradient(105deg, #04202B 0%, #073947 55%, rgba(14,116,144,.62) 100%)",
    artwork: null,
    glow: "rgba(45,212,191,.20)",
    btnText: "#064454",
  },
};

/* --------------------------------------------------------------------------- */

const live = new Set(
  JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8")).published.map((p) => p.slug),
);

const has = (text, ...words) => words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(text));

function pickVariant(slug, html) {
  const text = `${slug} ${html.replace(/<[^>]*>/g, " ").slice(0, 5000)}`;
  const s = slug;

  if (has(s, "cscc", "ecc", "pdpl", "nca") || /compliance|sovereignt/i.test(s)) return "compliance";
  if (has(s, "saudi", "ksa", "dammam", "riyadh", "jeddah", "arabic") || /kingdom/i.test(s)) return "ksa";
  if (/(^|-)(enterprise|kubernetes|k8s)(-|$)/i.test(s) || has(s, "autoscaling", "vpc", "vpn", "audit-trail"))
    return "enterprise";
  if (/alternative|migrat|move-|switch|vs-|-vs-|leaving/i.test(s)) return "migration";
  if (/wordpress|woocommerce|wp-|elementor|magento|drupal|joomla/i.test(s)) return "wordpress";
  if (/agenc|client|white-label|reseller|freelanc/i.test(s)) return "agency";
  if (/database|postgres|mysql|mariadb|mongo|redis|memcached|elasticsearch|sql|pgvector|replica/i.test(s))
    return "database";
  if (/security|secure|ssl|firewall|hardening|ddos|waf|headers|secrets|auth|2fa|encryption|backup/i.test(s))
    return "security";
  if (/^(fix|why|debug|troubleshoot)|error|fail|timeout|crash|5\d\d|4\d\d|not-working|disappear/i.test(s))
    return "troubleshoot";
  if (/\bai\b|agent|llm|rag|chatbot|lovable|cursor|bolt|v0|replit|windsurf|claude|vibe|gpt|openai/i.test(s))
    return "ai";
  if (/deploy|host|ci-cd|cron|node|python|django|laravel|next|react|vue|rails|golang|docker|pm2/i.test(s))
    return "ai";
  if (/\b(ai|agent|llm|rag)\b/i.test(text)) return "ai";
  return "general";
}

/** Stable per-slug index so copy choice is deterministic but spread out. */
function hashIndex(slug, n) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 100000;
  return h % n;
}

function buildCss(v) {
  const t = THEMES[v.theme];
  const p = v.prefix;
  const artwork = t.artwork
    ? `\n  background-image:url("${t.artwork}");\n  background-repeat:no-repeat;\n  background-position:right bottom;\n  background-size:62%;`
    : "";
  return `<style>
/* ${p}: self-contained CTA. Scoped class names so nothing inherits from or
   leaks into a theme's styles when this article is pasted into WordPress. */
.${p}-wrap{position:relative;overflow:hidden;width:100%;max-width:1140px;margin:50px auto;padding:60px;border-radius:22px;background:${t.base};${artwork}
  border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 45px rgba(0,0,0,.22);box-sizing:border-box;font-family:inherit}
.${p}-wrap *{box-sizing:border-box}
.${p}-overlay{position:absolute;inset:0;background:${t.overlay};pointer-events:none}
.${p}-wrap::before{content:"";position:absolute;width:500px;height:500px;right:-150px;bottom:-250px;border-radius:50%;background:radial-gradient(circle,${t.glow} 0%,rgba(64,183,95,.08) 38%,transparent 70%);pointer-events:none}
.${p}-content{position:relative;z-index:3;max-width:700px}
.${p}-eyebrow{display:inline-flex;align-items:center;padding:8px 14px;margin-bottom:18px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);border-radius:999px;font-size:11.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#fff}
.${p}-heading{margin:0 0 18px;font-size:44px;font-weight:800;line-height:1.09;letter-spacing:-1px;color:#fff;font-family:inherit}
.${p}-description{margin:0 0 26px;max-width:680px;font-size:18px;line-height:1.72;color:rgba(255,255,255,.9)}
.${p}-features{display:flex;flex-wrap:wrap;gap:10px 22px;margin-bottom:32px;padding:0;list-style:none}
.${p}-features li{font-size:14px;font-weight:600;line-height:1.5;color:rgba(255,255,255,.94);white-space:nowrap}
.${p}-buttons{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.${p}-btn{display:inline-flex;align-items:center;justify-content:center;padding:15px 26px;background:#fff;color:${t.btnText};font-weight:700;border:1px solid #fff;border-radius:10px;text-decoration:none;transition:.25s}
.${p}-btn:hover,.${p}-btn:focus-visible{background:transparent;color:#fff}
.${p}-link{color:#fff;font-weight:600;text-decoration:underline;text-underline-offset:5px}
.${p}-link:hover,.${p}-link:focus-visible{opacity:.88}
@media(max-width:768px){
  .${p}-wrap{padding:36px 24px${t.artwork ? ";background-size:118%;background-position:center bottom" : ""}}
  .${p}-heading{font-size:31px}
  .${p}-description{font-size:16px}
  .${p}-features li{white-space:normal}
  .${p}-buttons{flex-direction:column;align-items:stretch;gap:14px}
  .${p}-btn{width:100%}
  .${p}-link{text-align:center}
}
</style>`;
}

function buildHtml(v, heading, description) {
  const p = v.prefix;
  const chips = v.features.map((f) => `      <li>&#10003; ${f}</li>`).join("\n");
  return `<div class="${p}-wrap">
  <div class="${p}-overlay"></div>
  <div class="${p}-content">
    <div class="${p}-eyebrow">${v.eyebrow}</div>
    <p class="${p}-heading">${heading}</p>
    <p class="${p}-description">${description}</p>
    <ul class="${p}-features">
${chips}
    </ul>
    <div class="${p}-buttons">
      <a class="${p}-btn" href="${REGISTER}">Start free &#8594;</a>
      <a class="${p}-link" href="${v.secondary.href}">${v.secondary.label}</a>
    </div>
  </div>
</div>
${buildCss(v)}`;
}

const decode = (s) =>
  s
    .replace(/&#127774;/g, "\u{1F1F8}\u{1F1E6}")
    .replace(/&middot;/g, "\u00b7")
    .replace(/&amp;/g, "&")
    .replace(/&#8594;/g, "\u2192")
    .replace(/&#10003;/g, "\u2713");

function buildMarkdown(v, heading, description) {
  const chips = v.features.map((f) => `- ${f}`).join("\n");
  return `<!-- cta:start -->
**${decode(heading)}**

${decode(description)}

${chips}

[Start free](${REGISTER}) &middot; [${v.secondary.label}](${v.secondary.href})
<!-- cta:end -->`.replace(/&middot;/g, "\u00b7");
}

/* --------------------------------------------------------------------------- */

const slugs = fs
  .readdirSync(CS)
  .filter((d) => fs.existsSync(path.join(CS, d, `${d}.html`)) && fs.existsSync(path.join(CS, d, `${d}.md`)))
  .filter((d) => !live.has(d))
  .filter((d) => (only ? d === only : true))
  .sort();

const tally = {};
const skipped = [];
let changed = 0;

for (const slug of slugs) {
  const htmlPath = path.join(CS, slug, `${slug}.html`);
  const mdPath = path.join(CS, slug, `${slug}.md`);
  let html = fs.readFileSync(htmlPath, "utf8");
  let md = fs.readFileSync(mdPath, "utf8");

  if (/kbcta-[a-z]+-wrap/.test(html)) {
    skipped.push([slug, "already upgraded"]);
    continue;
  }
  const ctaMatch = html.match(/[ \t]*<div class="cta">((?:(?!<\/?div\b)[\s\S])*?)<\/div>\n?/);
  if (!ctaMatch) {
    skipped.push([slug, "no .cta block"]);
    continue;
  }
  const mdAlreadyDone = md.includes("<!-- cta:start -->");

  const variantKey = pickVariant(slug, html);
  const v = VARIANTS[variantKey];
  const heading = v.headings[hashIndex(slug, v.headings.length)];
  const description = v.descriptions[hashIndex(`${slug}x`, v.descriptions.length)];

  // --- HTML: swap the old block for the new component ---
  const newHtmlBlock = buildHtml(v, heading, description);
  const nextHtml = html.replace(ctaMatch[0], `${newHtmlBlock}\n`);

  // --- Markdown: replace the mirrored CTA copy that sits just before the FAQ ---
  // Try each CTA paragraph in turn. Some articles mirror only the body
  // paragraph in markdown and have no bold lead line to match on.
  const ctaParas = [...ctaMatch[0].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) =>
      m[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#8217;/g, "'")
        .trim(),
    )
    .filter(Boolean);
  // FAQ headings are not uniform: "## FAQ", "## Bluehost alternative FAQ",
  // "## Frequently asked questions". Take the first H2 that is a FAQ heading.
  const faqIdx = md.search(/^##\s+.*(?:\bFAQ\b|frequently asked).*$/im);
  // Never let a probe match inside the YAML front matter: the title and meta
  // description echo the CTA wording, and matching there would delete the article.
  const fmEnd = /^---\s*\n/.test(md) ? md.indexOf("\n---", 3) + 4 : 0;
  let mdStart = -1;
  for (const leadPlain of ctaParas) {
    if (mdStart > -1) break;
    // Match on the first few WORDS, not an exact slice: the markdown mirror
    // often renders the same lead as a heading with the full stop dropped.
    const words = leadPlain
      .replace(/[*_`]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6)
      .map((w) => w.replace(/[.,:;!?]+$/, ""))
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // The CTA is the LAST place this wording appears, so take the final match
    // that sits after the front matter and before the FAQ.
    const probeRe = new RegExp(words.join("[\\s\\S]{0,3}"), "gi");
    let found = -1;
    let hit;
    while ((hit = probeRe.exec(md)) !== null) {
      if (hit.index >= fmEnd && (faqIdx === -1 || hit.index < faqIdx)) found = hit.index;
      if (hit.index > (faqIdx === -1 ? md.length : faqIdx)) break;
    }
    if (found > -1) {
      mdStart = md.lastIndexOf("\n", found - 1) + 1;
      // absorb a preceding thematic break or a heading marker line
      const before = md.slice(0, mdStart).trimEnd();
      const lastLine = before.slice(before.lastIndexOf("\n") + 1).trim();
      if (lastLine === "---") mdStart = before.lastIndexOf("\n") + 1;
    }
  }
  const mdEnd = faqIdx === -1 ? md.length : faqIdx;
  if (mdAlreadyDone) {
    // Markdown was upgraded on an earlier pass; only the HTML still needs it.
    tally[variantKey] = (tally[variantKey] ?? 0) + 1;
    changed++;
    if (apply) fs.writeFileSync(htmlPath, nextHtml);
    continue;
  }
  if (mdStart === -1 || mdStart >= mdEnd) {
    skipped.push([slug, "could not locate CTA copy in markdown"]);
    continue;
  }
  // Safety rail. Replacing a CTA should remove a short conversion block and
  // nothing else, so refuse anything that looks like it would eat real content.
  const removed = md.slice(mdStart, mdEnd);
  const removedHeadings = (removed.match(/^##\s+/gm) ?? []).length;
  if (removed.length > 2000 || removedHeadings > 1 || !removed.includes("kloudbean.com")) {
    skipped.push([
      slug,
      `refused: replacement region looks wrong (${removed.length} chars, ${removedHeadings} headings)`,
    ]);
    continue;
  }
  const nextMd = `${md.slice(0, mdStart)}${buildMarkdown(v, heading, description)}\n\n${md.slice(mdEnd)}`;

  tally[variantKey] = (tally[variantKey] ?? 0) + 1;
  changed++;
  if (apply) {
    fs.writeFileSync(htmlPath, nextHtml);
    fs.writeFileSync(mdPath, nextMd);
  }
}

console.log(`${apply ? "UPGRADED" : "DRY RUN"}: ${changed} unpublished article(s)`);
console.log(`live articles skipped by design: ${live.size}`);
console.log("\nvariant distribution");
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(13)} ${String(n).padStart(4)}`);
}
if (skipped.length) {
  console.log(`\nskipped ${skipped.length}:`);
  const reasons = {};
  for (const [, r] of skipped) reasons[r] = (reasons[r] ?? 0) + 1;
  for (const [r, n] of Object.entries(reasons)) console.log(`  ${String(n).padStart(4)}  ${r}`);
  for (const [s, r] of skipped.filter(([, r]) => r !== "no .cta block")) console.log(`     - ${s}: ${r}`);
}
if (!apply) console.log("\nNothing written. Re-run with --apply to make the change.");
