/**
 * Data-driven hero descriptors for EVERY Kloudbean blog article.
 *
 * buildAllHeroes() scans ../ (content-studio) for each <slug>/<slug>.md, reads
 * the front matter (title, meta_description, cluster) plus the article HTML
 * (eyebrow, and a byline tagline if one exists), then derives a per-article
 * hero descriptor for hero-card.mjs: { slug, archetype, palette, motif, eyebrow,
 * headline, sub, ...archetypeData }.
 *
 * ACCURACY: hero copy may only use agreed, safe facts (7 clouds, free
 * auto-renewing SSL, automatic backups, one-click staging, managed CI/CD from
 * Git, one dashboard, built-in load balancer, S3/GCS object storage). No
 * customer counts, prices, SLA %, response times, "6/9 databases" as a number,
 * or BitNinja. A sanitizer strips those defensively; per-slug data below is
 * hand-checked against those rules.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, ".."); // content-studio/
const SKIP_DIRS = new Set(["assets", "hero-studio"]);

const PALETTE_KEYS = ["violet", "green", "teal", "blue", "magenta", "amber", "maroon", "indigo"];
// Distinct starting offset per archetype so each archetype rotates through all
// 8 palettes in sequence: consecutive same-archetype heroes never repeat a
// palette, and the overall spread stays even.
const PALETTE_OFFSET = { terminal: 0, versus: 1, centered: 2, flow: 3, checklist: 5, stat: 6 };

// ---------------------------------------------------------------------------
// small parsing helpers
// ---------------------------------------------------------------------------
const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Parse a leading YAML-ish front matter block: key: value (quotes optional). */
function frontMatter(md) {
  const m = md.match(/^\uFEFF?---\s*\n([\s\S]*?)\n---\s*(\n|$)/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[kv[1]] = v;
  }
  return out;
}

function firstH1(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? collapse(m[1]) : "";
}

/** Extract an attribute-bearing tag's inner/attr text via a simple regex. */
function tag(html, re) {
  const m = html.match(re);
  return m ? collapse(m[1]) : "";
}

function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "\u00b7")
    .replace(/&amp;/g, "&");
}

/** First natural sentence (guards abbreviations like Node.js / vs. 5 / .com). */
function firstSentence(t) {
  const s = collapse(t);
  const m = s.match(/^(.*?[.!?])(\s+[A-Z(]|$)/s);
  return m ? m[1] : s;
}

// ---------------------------------------------------------------------------
// accuracy sanitizer — cut a string at the first forbidden token
// ---------------------------------------------------------------------------
const FORBIDDEN = [
  /\$\s?\d/i, // prices
  /\b\d[\d,]*\s*\+\s*(customers|users|sites|developers|teams|clients|countries)/i,
  /\b1,?000\s*\+/i,
  /\b\d+\s*\+\s*countries/i,
  /\b\d+(\.\d+)?\s?%/, // SLA / percentages
  /\b\d+\s?ms\b/i,
  /\bmilliseconds?\b/i,
  /\bresponse\s+time/i,
  /\b(two-minute|~?\s?2-?\s?min(ute)?s?)\b/i,
  /\b24\/7\s*human/i,
  /\b(six|nine|\d+)\s+(managed\s+)?databases?\b/i, // contested DB counts
  /\bbitninja\b/i,
];

/** Trim trailing separators / dangling conjunctions (repeat for chains like
 * "... and the" -> "..."). Complete sentences ending in . ! ? are preserved. */
function tidyTail(s) {
  let prev;
  do {
    prev = s;
    s = s
      .replace(/[\s,;:·\u00b7\-\u2013\u2014]+$/g, "")
      .replace(/\s+(and|or|vs|with|plus|for|the|a|an|of|to)$/i, "");
  } while (s !== prev);
  return s.trim();
}

function sanitize(text) {
  let s = collapse(text);
  let cut = -1;
  for (const re of FORBIDDEN) {
    const m = s.match(re);
    if (m && (cut === -1 || m.index < cut)) cut = m.index;
  }
  if (cut >= 0) s = tidyTail(s.slice(0, cut));
  return s;
}

function clip(text, n = 112) {
  const s = collapse(text);
  if (s.length <= n + 6) return tidyTail(s);
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return tidyTail(sp > 40 ? cut.slice(0, sp) : cut);
}

// ---------------------------------------------------------------------------
// pretty tech names (eyebrows + versus competitor labels)
// ---------------------------------------------------------------------------
const PRETTY = {
  nextjs: "Next.js", next: "Next.js", node: "Node.js", react: "React", vue: "Vue",
  astro: "Astro", django: "Django", flask: "Flask", fastapi: "FastAPI", laravel: "Laravel",
  rails: "Rails", golang: "Go", go: "Go", cursor: "Cursor", bolt: "Bolt", v0: "v0",
  lovable: "Lovable", replit: "Replit", windsurf: "Windsurf", claude: "Claude Code",
  cloudways: "Cloudways", kinsta: "Kinsta", heroku: "Heroku", vercel: "Vercel",
  netlify: "Netlify", railway: "Railway", render: "Render", digitalocean: "DigitalOcean",
  kloudbean: "Kloudbean", mysql: "MySQL", postgresql: "PostgreSQL", postgres: "PostgreSQL",
  redis: "Redis", n8n: "n8n", ghost: "Ghost", gitlab: "GitLab", nextcloud: "Nextcloud",
  supabase: "Supabase", langflow: "Langflow", ollama: "Ollama", wordpress: "WordPress",
  woocommerce: "WooCommerce", ai: "AI apps", vpc: "VPC", ssl: "SSL", waf: "WAF",
  gdpr: "GDPR", pci: "PCI", soc2: "SOC 2", ddos: "DDoS", vps: "VPS", s3: "S3",
  aws: "AWS", saas: "SaaS", "wp-engine": "WP Engine", "fly-io": "Fly.io",
};

// ---------------------------------------------------------------------------
// per-slug eyebrow overrides (short uppercase topic labels)
// ---------------------------------------------------------------------------
const EYEBROW = {
  "add-managed-database-to-your-app": "MANAGED DATABASE",
  "agency-wordpress-hosting": "AGENCY WORDPRESS",
  "arabic-wordpress-hosting": "ARABIC WORDPRESS",
  "autoscaling-explained": "AUTOSCALING",
  "best-managed-cloud-hosting": "MANAGED CLOUD HOSTING",
  "best-self-hosted-tools": "SELF-HOSTED TOOLS",
  "ci-cd-auto-deploy-from-github": "CI/CD FROM GIT",
  "cloud-hosting-pricing-explained": "CLOUD PRICING",
  "cloud-load-balancer-explained": "LOAD BALANCER",
  "cloud-hosting-saudi-arabia": "CLOUD HOSTING · KSA",
  "cloud-sla-explained": "CLOUD SLA",
  "cloudways-alternatives": "CLOUDWAYS ALTERNATIVE",
  "container-security-scanning": "CONTAINER SECURITY",
  "cost-of-running-a-side-project": "SIDE-PROJECT COST",
  "custom-domain-and-ssl-for-your-app": "DOMAIN + SSL",
  "cut-saas-bill-4000-to-100": "SAAS COST",
  "data-residency-explained": "DATA RESIDENCY",
  "database-read-replicas-scaling": "READ REPLICAS",
  "ddos-protection-explained": "DDOS PROTECTION",
  "deploy-ai-built-app-to-production": "DEPLOY AI APPS",
  "deploy-bolt-new-app": "DEPLOY BOLT.NEW",
  "deploy-claude-code-app": "DEPLOY CLAUDE CODE",
  "deploy-fullstack-react-app-to-production": "DEPLOY REACT",
  "deploy-lovable-app-to-your-own-server": "DEPLOY LOVABLE",
  "deploy-nextjs-app-to-your-own-server": "DEPLOY NEXT.JS",
  "deploy-node-app-to-managed-cloud": "DEPLOY NODE.JS",
  "digitalocean-vs-kloudbean": "DIGITALOCEAN vs KLOUDBEAN",
  "discord-bot-hosting": "DISCORD BOTS",
  "docker-container-hosting": "DOCKER HOSTING",
  "enterprise-wordpress-hosting": "ENTERPRISE WORDPRESS",
  "environment-variables-done-right": "ENV VARS",
  "fix-503-after-deploying-your-app": "FIX 503",
  "fix-error-establishing-database-connection-wordpress": "WORDPRESS DB ERROR",
  "fix-ssl-certificate-errors": "SSL ERRORS",
  "fly-io-alternative": "FLY.IO ALTERNATIVE",
  "free-app-hosting-options": "FREE HOSTING",
  "free-tier-vs-cheap-vps": "FREE TIER vs VPS",
  "gcp-dammam-region-guide": "GCP DAMMAM REGION",
  "gdpr-compliant-hosting": "GDPR HOSTING",
  "headless-wordpress-hosting": "HEADLESS WORDPRESS",
  "heroku-alternative-for-modern-apps": "HEROKU ALTERNATIVE",
  "host-app-api-and-database-on-one-server": "ONE SERVER, WHOLE STACK",
  "host-multiple-apps-one-server": "MULTI-APP HOSTING",
  "hosting-for-agencies-playbook": "AGENCY PLAYBOOK",
  "hosting-for-saudi-ecommerce": "SAUDI ECOMMERCE",
  "how-agencies-host-20-client-apps": "AGENCY HOSTING",
  "how-cloud-hosting-works": "HOW HOSTING WORKS",
  "how-to-deploy-any-app": "DEPLOY ANY APP",
  "how-to-clear-wordpress-cache": "WORDPRESS CACHE",
  "how-to-cut-your-cloud-bill": "CLOUD COSTS",
  "how-to-migrate-hosting-zero-downtime": "ZERO-DOWNTIME MIGRATION",
  "is-free-hosting-worth-it": "FREE HOSTING",
  "kloudbean-vs-cloudways": "KLOUDBEAN vs CLOUDWAYS",
  "kloudbean-vs-kinsta": "KLOUDBEAN vs KINSTA",
  "kloudbean-vs-wp-engine": "KLOUDBEAN vs WP ENGINE",
  "lovable-on-managed-aws": "LOVABLE ON AWS",
  "lovable-self-hosted-alternative": "LOVABLE ALTERNATIVE",
  "managed-cloud-hosting-myths": "HOSTING MYTHS",
  "managed-database-vs-self-managed": "MANAGED DB vs DIY",
  "managed-hosting-ksa": "MANAGED HOSTING · KSA",
  "data-residency-saudi-arabia": "DATA RESIDENCY · KSA",
  "pdpl-compliance-hosting": "PDPL COMPLIANCE",
  "low-latency-hosting-riyadh-jeddah": "LOW LATENCY · KSA",
  "managed-mariadb-hosting": "MANAGED MARIADB",
  "managed-mongodb-hosting": "MANAGED MONGODB",
  "managed-elasticsearch-hosting": "MANAGED ELASTICSEARCH",
  "managed-mysql-hosting": "MANAGED MYSQL",
  "managed-postgresql-hosting": "MANAGED POSTGRESQL",
  "managed-redis-hosting": "MANAGED REDIS",
  "managed-vs-unmanaged-hosting": "MANAGED vs UNMANAGED",
  "move-lovable-app-off-netlify": "MOVE OFF NETLIFY",
  "move-lovable-app-off-vercel": "MOVE OFF VERCEL",
  "mysql-vs-postgresql": "MYSQL vs POSTGRESQL",
  "nca-ecc-compliant-hosting": "NCA ECC · KSA",
  "netlify-alternative-for-full-stack-apps": "NETLIFY ALTERNATIVE",
  "pci-compliant-hosting": "PCI HOSTING",
  "railway-alternative-for-vibe-coded-apps": "RAILWAY ALTERNATIVE",
  "render-alternative-for-vibe-coded-apps": "RENDER ALTERNATIVE",
  "reseller-hosting-vs-managed-cloud": "RESELLER vs MANAGED",
  "gcs-object-storage-buckets": "GCS OBJECT STORAGE",
  "s3-compatible-object-storage": "OBJECT STORAGE",
  "scalable-wordpress-hosting": "SCALABLE WORDPRESS",
  "secure-compliant-hosting": "SECURITY & COMPLIANCE",
  "secure-wordpress-hosting": "SECURE WORDPRESS",
  "security-headers-guide": "SECURITY HEADERS",
  "self-host-ghost": "SELF-HOST GHOST",
  "self-host-gitlab": "SELF-HOST GITLAB",
  "self-host-langflow": "SELF-HOST LANGFLOW",
  "self-host-n8n": "SELF-HOST N8N",
  "self-host-nextcloud": "SELF-HOST NEXTCLOUD",
  "self-host-ollama-open-webui": "SELF-HOST OLLAMA",
  "self-host-supabase": "SELF-HOST SUPABASE",
  "server-backups-guide": "SERVER BACKUPS",
  "single-tenant-vs-multi-tenant": "TENANCY MODELS",
  "soc2-compliant-hosting": "SOC 2 HOSTING",
  "speed-up-wordpress": "SPEED UP WORDPRESS",
  "the-real-cost-of-unmanaged-vps": "UNMANAGED VPS COST",
  "vercel-alternative-for-full-stack-apps": "VERCEL ALTERNATIVE",
  "what-a-waf-does": "WHAT A WAF DOES",
  "what-is-a-vpc": "WHAT IS A VPC",
  "white-label-hosting-for-agencies": "WHITE-LABEL HOSTING",
  "wordpress-cli-guide": "WP-CLI",
  "wordpress-multisite-hosting": "WORDPRESS MULTISITE",
  "wp-rest-api-guide": "WP REST API",
  "zero-egress-object-storage": "OBJECT STORAGE",
};

/** Fallback eyebrow when a slug isn't in the map (data-driven from slug). */
function deriveEyebrow(slug) {
  if (EYEBROW[slug]) return EYEBROW[slug];
  const label = (frag) =>
    frag
      .split("-")
      .map((w) => PRETTY[w] || (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
      .join(" ");
  const vs = slug.match(/^(.+?)-vs-(.+)$/);
  if (vs) return `${label(vs[1])} vs ${label(vs[2])}`.replace(/ VS /gi, " vs ").toUpperCase().replace(/ VS /g, " vs ");
  const alt = slug.match(/^(.+?)-alternatives?$/);
  if (alt) return `${label(alt[1])} ALTERNATIVE`.toUpperCase();
  const dep = slug.match(/^deploy-(.+?)(-app)?(-to-.*|-production)?$/);
  if (dep) return `DEPLOY ${label(dep[1])}`.toUpperCase();
  const man = slug.match(/^managed-(.+?)-hosting$/);
  if (man) return `MANAGED ${label(man[1])}`.toUpperCase();
  const self = slug.match(/^self-host-(.+)$/);
  if (self) return `SELF-HOST ${label(self[1])}`.toUpperCase();
  const exp = slug.match(/^(.+)-explained$/);
  if (exp) return label(exp[1]).toUpperCase();
  return label(slug.replace(/-(hosting|guide|options|for-.*|to-.*)$/g, "")).toUpperCase();
}

// ---------------------------------------------------------------------------
// headline overrides (only where the title carries a forbidden token, e.g. a
// price, or where a punchier grounded line reads better than the raw title)
// ---------------------------------------------------------------------------
const HEADLINE = {
  "cut-saas-bill-4000-to-100": "We cut the SaaS bill by owning the server",
  "how-agencies-host-20-client-apps": "How agencies run many client apps",
};

/** Derive a punchy headline from the title (strip after ":" or "("), sanitize. */
function deriveHeadline(slug, title, byline) {
  if (HEADLINE[slug]) return HEADLINE[slug];
  if (byline && !/faster than ever/i.test(byline)) {
    const s = sanitize(byline);
    if (s.length >= 8) return s;
  }
  let t = collapse(title);
  const ci = t.indexOf(":");
  if (ci > 0) t = t.slice(0, ci);
  const pi = t.indexOf("(");
  if (pi > 0) t = t.slice(0, pi);
  t = sanitize(collapse(t));
  return t || collapse(title);
}

// ---------------------------------------------------------------------------
// family classification -> archetype + motif
// ---------------------------------------------------------------------------
const COMPETITORS = /cloudways|kinsta|wp-engine|fly-io|heroku|vercel|netlify|railway|render|digitalocean/;
function familyOf(slug) {
  const s = slug;
  // migration first, so "move-...-off-vercel" doesn't get pulled into versus
  if (/^move-/.test(s) || /migrate/.test(s)) return "migrate";
  if (/(^|-)vs(-|$)/.test(s) || /alternatives?/.test(s) || COMPETITORS.test(s)) return "versus";
  if (
    /^deploy-/.test(s) ||
    s === "ci-cd-auto-deploy-from-github" ||
    s === "custom-domain-and-ssl-for-your-app" ||
    s === "environment-variables-done-right" ||
    s === "fix-503-after-deploying-your-app" ||
    s === "lovable-on-managed-aws"
  )
    return "deploy";
  if (/backup/.test(s)) return "backup";
  if (/secure|security|compliant|gdpr|pci|soc2|waf|headers|ddos|(^|-)ssl(-|$)|certificate/.test(s)) return "security";
  if (/wordpress|woocommerce|(^|-)wp-/.test(s)) return "wordpress";
  if (/managed-(mysql|postgresql|redis|database)|(^|-)database|storage|(^|-)s3(-|$)|object|read-replicas/.test(s))
    return "data";
  if (/pricing|cost|(^|-)free(-|$)|saas-bill|cloud-bill/.test(s)) return "cost";
  return "concept";
}

/** Topical glyph name from hero-card's glyph() set. */
function motifOf(slug) {
  const s = slug;
  const map = [
    [/backup/, "backup"],
    [/migrate|move-/, "migrate"],
    [/mysql|postgresql|postgres|redis|read-replicas|-database|database-/, "database"],
    [/supabase/, "database"],
    [/storage|object|s3/, "cloud"],
    [/(^|-)vs(-|$)|alternatives?|myths/, "compare"],
    [/cloudways|kinsta|wp-engine|fly-io|heroku|vercel|netlify|railway|render|digitalocean/, "compare"],
    [/gdpr|pci|soc2|compliant|waf|ddos|secure|security|headers/, "shield"],
    [/(^|-)ssl(-|$)|certificate|custom-domain/, "ssl"],
    [/pricing|cost|(^|-)free(-|$)|saas-bill|cloud-bill/, "cost"],
    [/discord|(^|-)bot/, "bot"],
    [/langflow|ollama|(^|-)ai(-|$)|open-webui/, "bot"],
    [/n8n/, "network"],
    [/nextcloud|lovable-on-managed-aws|-aws/, "cloud"],
    [/vpc|residency|load-balancer|one-server/, "network"],
    [/autoscaling|scalable|multisite|multiple-apps|agenc|client-apps|reseller|white-label|tenant/, "scale"],
    [/speed|cache/, "speed"],
    [/container|docker/, "container"],
    [/wordpress|woocommerce|(^|-)wp-/, "wordpress"],
    [/503/, "code"],
    [/ci-cd|env|deploy-|golang|rails|django|flask|fastapi|laravel|node|react|vue|astro|nextjs/, "code"],
    [/sla/, "shield"],
    [/self-host|ghost|gitlab/, "container"],
  ];
  for (const [re, name] of map) if (re.test(s)) return name;
  return "cloud";
}

// slugs whose deploy-family archetype is fixed (rest of deploy-* alternates)
const DEPLOY_FLOW = new Set([
  "ci-cd-auto-deploy-from-github",
  "custom-domain-and-ssl-for-your-app",
  "lovable-on-managed-aws",
]);
const DEPLOY_TERMINAL = new Set(["environment-variables-done-right", "fix-503-after-deploying-your-app"]);
// security slugs that must stay explanatory (avoid implying unowned features)
const SECURITY_CENTERED = new Set([
  "fix-ssl-certificate-errors",
  "what-a-waf-does",
  "ddos-protection-explained",
  "container-security-scanning",
]);
// concept slugs routed to pipeline flow instead of centered
const CONCEPT_FLOW = new Set(["self-host-n8n", "self-host-gitlab", "self-host-nextcloud"]);
const CONCEPT_TERMINAL = new Set(["discord-bot-hosting"]);
// stat slugs (only grounded, non-contested numbers)
const STAT = {
  "server-backups-guide": { statBig: "3\u00b72\u00b71", statLabel: "the backup rule" },
  "managed-cloud-hosting-myths": { statBig: "7", statLabel: "cloud providers" },
};

function archetypeOf(slug, family, counters) {
  if (STAT[slug]) return "stat";
  switch (family) {
    case "versus":
      return "versus";
    case "migrate":
      return "flow";
    case "backup":
      return "stat";
    case "security":
      return SECURITY_CENTERED.has(slug) ? "centered" : "checklist";
    case "wordpress":
      return counters.wp++ % 2 === 0 ? "checklist" : "centered";
    case "data":
      return "centered";
    case "cost":
      return "centered";
    case "deploy":
      if (DEPLOY_FLOW.has(slug)) return "flow";
      if (DEPLOY_TERMINAL.has(slug)) return "terminal";
      return counters.dep++ % 2 === 0 ? "terminal" : "flow";
    case "concept":
    default:
      if (CONCEPT_TERMINAL.has(slug)) return "terminal";
      if (CONCEPT_FLOW.has(slug)) return "flow";
      if (/^self-host-/.test(slug)) return counters.self++ % 2 === 0 ? "centered" : "flow";
      return "centered";
  }
}

// ---------------------------------------------------------------------------
// archetype-specific data (grounded + safe)
// ---------------------------------------------------------------------------
const KB = { name: "Kloudbean", note: "the whole stack, one login", hot: true };
const VERSUS = {
  "cloudways-alternatives": [KB, { name: "Cloudways", note: "WordPress-first host" }],
  "kloudbean-vs-cloudways": [KB, { name: "Cloudways", note: "WordPress-first host" }],
  "kloudbean-vs-kinsta": [KB, { name: "Kinsta", note: "managed WordPress" }],
  "kloudbean-vs-wp-engine": [KB, { name: "WP Engine", note: "managed WordPress" }],
  "digitalocean-vs-kloudbean": [KB, { name: "DigitalOcean", note: "raw cloud + tooling" }],
  "fly-io-alternative": [KB, { name: "Fly.io", note: "edge-first PaaS" }],
  "heroku-alternative-for-modern-apps": [KB, { name: "Heroku", note: "the PaaS classic" }],
  "netlify-alternative-for-full-stack-apps": [KB, { name: "Netlify", note: "frontend-first PaaS" }],
  "vercel-alternative-for-full-stack-apps": [KB, { name: "Vercel", note: "frontend-first PaaS" }],
  "railway-alternative-for-vibe-coded-apps": [KB, { name: "Railway", note: "app PaaS" }],
  "render-alternative-for-vibe-coded-apps": [KB, { name: "Render", note: "app PaaS" }],
  "lovable-self-hosted-alternative": [KB, { name: "Lovable", note: "the builder's hosting" }],
  "reseller-hosting-vs-managed-cloud": [
    { name: "Managed cloud", note: "own the whole stack", hot: true },
    { name: "Reseller hosting", note: "the older model" },
  ],
  "managed-vs-unmanaged-hosting": [
    { name: "Managed", note: "server + stack handled", hot: true },
    { name: "Unmanaged", note: "you're the sysadmin" },
  ],
  "managed-database-vs-self-managed": [
    { name: "Managed DB", note: "backups + patching done", hot: true },
    { name: "Self-managed", note: "you run it" },
  ],
  "mysql-vs-postgresql": [
    { name: "PostgreSQL", note: "JSONB + extensions" },
    { name: "MySQL", note: "simple, fast, everywhere" },
  ],
  "single-tenant-vs-multi-tenant": [
    { name: "Single-tenant", note: "your own server" },
    { name: "Multi-tenant", note: "a shared platform" },
  ],
  "free-tier-vs-cheap-vps": [
    { name: "Cheap VPS", note: "you own root" },
    { name: "Free tier", note: "limits and sleeps" },
  ],
};

function versusData(slug) {
  if (VERSUS[slug]) return VERSUS[slug];
  // generic fallback: Kloudbean vs the named competitor from the slug
  const m = slug.match(/^(.+?)-vs-kloudbean$/) || slug.match(/^kloudbean-vs-(.+)$/) || slug.match(/^(.+?)-alternatives?$/);
  const other = m ? (PRETTY[m[1]] || m[1].split("-").map((w) => PRETTY[w] || w).join(" ")) : "the alternative";
  return [KB, { name: other, note: "the alternative" }];
}

function terminalData(slug) {
  const s = slug;
  if (s === "environment-variables-done-right")
    return {
      termName: "env",
      terminal: [
        { k: "c", t: "# secrets live in the environment, not in code" },
        { k: "g", t: "export DATABASE_URL=..." },
        { k: "w", t: "\u2713 app reads it at boot" },
      ],
    };
  if (s === "fix-503-after-deploying-your-app")
    return {
      termName: "fix 503",
      terminal: [
        { k: "c", t: "# 503 = the proxy can't reach your app" },
        { k: "g", t: "app.listen(process.env.PORT)" },
        { k: "w", t: "\u2713 200 OK" },
      ],
    };
  if (s === "discord-bot-hosting")
    return {
      termName: "bot",
      terminal: [
        { k: "c", t: "# keep it online 24/7" },
        { k: "g", t: "pm2 start index.js --name bot" },
        { k: "w", t: "\u2713 online \u00b7 auto-restart on crash" },
      ],
    };
  if (/django/.test(s))
    return {
      termName: "deploy",
      terminal: [
        { k: "c", t: "# migrate, collect, serve" },
        { k: "g", t: "python manage.py migrate" },
        { k: "w", t: "\u2713 gunicorn live on your domain" },
      ],
    };
  if (/laravel/.test(s))
    return {
      termName: "deploy",
      terminal: [
        { k: "c", t: "# run the migrations" },
        { k: "g", t: "php artisan migrate --force" },
        { k: "w", t: "\u2713 deployed \u00b7 queue running" },
      ],
    };
  if (/rails/.test(s))
    return {
      termName: "deploy",
      terminal: [
        { k: "c", t: "# migrate then boot" },
        { k: "g", t: "rails db:migrate" },
        { k: "w", t: "\u2713 puma live with SSL" },
      ],
    };
  if (/golang/.test(s))
    return {
      termName: "build",
      terminal: [
        { k: "c", t: "# one static binary" },
        { k: "g", t: "go build -o app ." },
        { k: "w", t: "\u2713 running behind SSL" },
      ],
    };
  if (/(^|-)node(-|$)|express/.test(s))
    return {
      termName: "node",
      terminal: [
        { k: "c", t: "# start and keep it alive" },
        { k: "g", t: "pm2 start app.js --name web" },
        { k: "w", t: "\u2713 online \u00b7 auto-restart on crash" },
      ],
    };
  // default: the managed CI/CD story
  return {
    termName: "deploy",
    terminal: [
      { k: "c", t: "# ship it" },
      { k: "g", t: "git push kloudbean main" },
      { k: "w", t: "\u2713 built \u00b7 live with SSL" },
    ],
  };
}

const FLOW_DEPLOY = [
  { k: "push", v: "git push", d: "your repo" },
  { k: "build", v: "install + build", d: "live logs" },
  { k: "live", v: "running", d: "SSL \u00b7 always-on", hot: true },
];
const FLOW_CICD = [
  { k: "push", v: "git push", d: "GitHub" },
  { k: "build", v: "install + build", d: "live build logs" },
  { k: "deploy", v: "auto-live", d: "on every push", hot: true },
];
const FLOW_DOMAIN = [
  { k: "point", v: "add domain", d: "DNS records" },
  { k: "verify", v: "DNS resolves", d: "to your server" },
  { k: "secure", v: "free SSL", d: "auto-renews", hot: true },
];
const FLOW_MIGRATE = [
  { k: "copy", v: "sync data", d: "from old host" },
  { k: "deploy", v: "stand up app", d: "new server" },
  { k: "cutover", v: "switch DNS", d: "zero downtime", hot: true },
];
const FLOW_MOVE = [
  { k: "export", v: "your code", d: "off the PaaS" },
  { k: "deploy", v: "your server", d: "live build logs" },
  { k: "live", v: "your domain", d: "free SSL", hot: true },
];
const FLOW_SELFHOST = [
  { k: "server", v: "spin up", d: "your cloud" },
  { k: "install", v: "deploy the app", d: "live logs" },
  { k: "live", v: "your domain", d: "free SSL", hot: true },
];

function flowData(slug) {
  if (slug === "ci-cd-auto-deploy-from-github") return FLOW_CICD;
  if (slug === "custom-domain-and-ssl-for-your-app") return FLOW_DOMAIN;
  if (slug === "how-to-migrate-hosting-zero-downtime") return FLOW_MIGRATE;
  if (/^move-/.test(slug)) return FLOW_MOVE;
  if (/^self-host-/.test(slug)) return FLOW_SELFHOST;
  return FLOW_DEPLOY;
}

const CHECKLIST_WP = ["Managed WordPress", "One-click staging", "Free auto-renewing SSL", "Automatic backups"];
const CHECKLIST_SECURITY = ["Free auto-renewing SSL", "Shorewall + Fail2ban", "Automatic backups", "Scoped access (UAC)"];
const CHECKLIST_COMPLIANCE = [
  "Encryption in transit (SSL)",
  "Scoped access (UAC)",
  "Automatic backups",
  "Audit trail (Enterprise)",
];

function checklistData(slug) {
  if (/wordpress|woocommerce|(^|-)wp-/.test(slug)) return CHECKLIST_WP;
  if (/gdpr|pci|soc2|compliant/.test(slug)) return CHECKLIST_COMPLIANCE;
  return CHECKLIST_SECURITY;
}

// Per-slug hero overrides: a fully specified descriptor that bypasses the
// automatic derivation for flagship pages the heuristics would under-serve.
// Copy here obeys the same accuracy rules as everything else (no customer
// counts, prices, SLA %, contested numbers).
const HERO_OVERRIDES = {
  // The slug reads "compliance" rather than "compliant", so familyOf routes it
  // to "concept" and it would land on a generic centered hero. This is the CSCC
  // pillar page, so it gets a checklist of the four public NCA control domains,
  // which is also exactly what the article's own hero alt text describes.
  "nca-cscc-compliance-guide": {
    archetype: "checklist",
    palette: "blue",
    motif: "shield",
    eyebrow: "NCA CSCC \u00b7 KSA",
    headline: "NCA CSCC,\ndomain by domain.",
    sub: "The four control domains behind Saudi Arabia's critical-systems framework.",
    checklist: [
      "Cybersecurity Governance",
      "Cybersecurity Defence",
      "Cybersecurity Resilience",
      "Third-Party & Cloud",
    ],
  },
  // Agency access-control spoke: a checklist of the four roles reads far better
  // than the auto-derived generic centered card.
  "subuser-and-uac-guide": {
    archetype: "checklist",
    palette: "indigo",
    motif: "shield",
    eyebrow: "Access control",
    headline: "Give access,\nnot the keys.",
    sub: "One login per person, scoped per resource and per action.",
    checklist: [
      "Developer: deploy, not delete",
      "Client: view their own, only",
      "Billing: invoices, no server",
      "Contractor: one app, time-boxed",
    ],
  },
  // Self-hosted password manager: the reassurance plus the three non-negotiables.
  "self-host-vaultwarden": {
    archetype: "checklist",
    palette: "maroon",
    motif: "shield",
    eyebrow: "Self-hosted \u00b7 Password manager",
    headline: "Own the vault\nthat holds it all.",
    sub: "Bitwarden-compatible, zero-knowledge, and yours. Backups are the whole game.",
    checklist: [
      "Zero-knowledge: server can't read it",
      "HTTPS on, always",
      "Lock down the admin page",
      "Backups are existential",
    ],
  },
  // Self-hosted design tool: lead with what makes Penpot its own argument.
  "self-host-penpot": {
    archetype: "checklist",
    palette: "magenta",
    motif: "generic",
    eyebrow: "Self-hosted \u00b7 Design",
    headline: "Own the design\ntool, and the files.",
    sub: "Open-source Figma alternative, built on SVG and CSS, one-click to run.",
    checklist: [
      "Open source, MPL-2.0",
      "SVG + CSS, real code out",
      "One-click on Kloudbean",
      "No per-seat bill",
    ],
  },
  // Self-hosted social scheduler: value props plus the honest "you bring the keys".
  "self-host-postiz": {
    archetype: "checklist",
    palette: "teal",
    motif: "network",
    eyebrow: "Self-hosted \u00b7 Social scheduling",
    headline: "Own your posting,\nnot the bill.",
    sub: "Open-source Buffer alternative. One calendar, ~20 platforms, flat cost.",
    checklist: [
      "~20 platforms, one calendar",
      "Open source, no per-channel bill",
      "You bring the API keys",
      "One-click on Kloudbean",
    ],
  },
  // Self-hosted mailing-list manager: lead with the "manages, doesn't send" truth.
  "self-host-listmonk": {
    archetype: "checklist",
    palette: "amber",
    motif: "network",
    eyebrow: "Self-hosted \u00b7 Email",
    headline: "Own the list,\nnot the per-sub bill.",
    sub: "Fast open-source mailing-list manager. One Go binary, one Postgres.",
    checklist: [
      "Go single binary + Postgres",
      "Manages the list, not the sending",
      "Pairs with SES: cheap at scale",
      "Own your subscribers",
    ],
  },
  // WordPress maintenance retainer: the care-plan deliverables.
  "wordpress-maintenance-retainer-plans": {
    archetype: "checklist",
    palette: "violet",
    motif: "wordpress",
    eyebrow: "WordPress care plans",
    headline: "Turn maintenance\ninto revenue.",
    sub: "The work you already do, packaged as a plan clients renew.",
    checklist: [
      "Updates on staging first",
      "Backups plus a tested restore",
      "Security and uptime watch",
      "A monthly report they renew for",
    ],
  },
  // Fleet backup strategy: checklist of the fleet rules.
  "multi-client-backup-strategy": {
    archetype: "checklist",
    palette: "teal",
    motif: "backup",
    eyebrow: "Fleet backups",
    headline: "Back up a fleet,\nnot a site.",
    sub: "Isolated per client, retained per plan, and actually restore-tested.",
    checklist: [
      "Isolate: one client's data only",
      "Retention per client, per plan",
      "Off-box, automatic, 3-2-1",
      "Sample and rotate restore tests",
    ],
  },
  // Migration as a service: the safe cutover flow.
  "agency-migration-service-guide": {
    archetype: "flow",
    palette: "green",
    motif: "migrate",
    eyebrow: "Migration service",
    headline: "We'll move you, free, no downtime.",
    sub: "Old site serves until a verified copy is proven. Then DNS flips.",
    flow: [
      { k: "copy", v: "to staging", d: "old site serves" },
      { k: "verify", v: "definition of done", d: "on the copy" },
      { k: "live", v: "cut over DNS", d: "only if it passed", hot: true },
    ],
  },
  // Agency onboarding runbook: checklist of the phases.
  "agency-onboarding-checklist": {
    archetype: "checklist",
    palette: "green",
    motif: "generic",
    eyebrow: "Client onboarding",
    headline: "Onboard the same\nway, every time.",
    sub: "A runbook with a finish line, so nothing goes live half-configured.",
    checklist: [
      "Intake before you touch anything",
      "Provision walled-off",
      "Verify to a definition of done",
      "Handover, then bill",
    ],
  },
  // Agency offboarding runbook: the clean-exit sequence.
  "agency-client-offboarding": {
    archetype: "checklist",
    palette: "maroon",
    motif: "migrate",
    eyebrow: "Client offboarding",
    headline: "A clean exit,\nevery time.",
    sub: "Their data is theirs. Hand it back completely, then close up.",
    checklist: [
      "Export everything, portable",
      "Transfer the site and DNS",
      "Revoke every login",
      "Retain, then delete",
    ],
  },
  // Agency pricing spoke: a checklist of the models beats a generic centered card.
  "client-billing-and-markup-for-hosting": {
    archetype: "checklist",
    palette: "amber",
    motif: "cost",
    eyebrow: "Agency billing",
    headline: "Bill the management,\nnot the metal.",
    sub: "Three ways to price hosting, and the margin math behind each.",
    checklist: [
      "Cost-plus: simple, capped upside",
      "Tiered plans: predictable revenue",
      "Care plan: best margin, stickiest",
      "Never pass through at cost",
    ],
  },
  // The "-vs-" slug would auto-build a Kloudbean-vs-X versus card, which is wrong
  // for a platform comparison. Pin it to the actual two platforms, WooCommerce
  // highlighted since this is Kloudbean's blog and we host it.
  "woocommerce-vs-shopify": {
    archetype: "versus",
    palette: "violet",
    motif: "compare",
    eyebrow: "WooCommerce vs Shopify",
    headline: "Own it,\nor rent it.",
    sub: "One fork decides the rest: a store you host, or a store hosted for you.",
    versus: [
      { name: "WooCommerce", note: "you own it, you host it", hot: true },
      { name: "Shopify", note: "hosted, hands-off, a cut per sale" },
    ],
  },
};

// ---------------------------------------------------------------------------
// main builder
// ---------------------------------------------------------------------------
export function buildAllHeroes() {
  const slugs = readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name))
    .map((d) => d.name)
    .filter((slug) => existsSync(join(CONTENT_DIR, slug, `${slug}.md`)))
    .sort();

  const counters = { dep: 0, wp: 0, self: 0 };
  const palCount = {}; // per-archetype rotation counter

  const heroes = [];
  for (const slug of slugs) {
    // A flagship override wins outright and skips derivation for that slug only.
    const ov = HERO_OVERRIDES[slug];
    if (ov) {
      heroes.push({ slug, ...ov });
      continue;
    }
    const mdPath = join(CONTENT_DIR, slug, `${slug}.md`);
    const htmlPath = join(CONTENT_DIR, slug, `${slug}.html`);
    const md = readFileSync(mdPath, "utf8");
    const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
    const fm = frontMatter(md);

    const title =
      fm.title ||
      firstH1(md) ||
      decodeEntities(tag(html, /<title>([\s\S]*?)<\/title>/i)) ||
      slug;
    const metaDesc =
      fm.meta_description ||
      decodeEntities(tag(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i)) ||
      decodeEntities(tag(html, /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i)) ||
      "";
    const byline = decodeEntities(tag(html, /<p\s+class=["']byline["']>([\s\S]*?)<\/p>/i));
    const dotIdx = byline.indexOf("\u00b7");
    const bylineTag = dotIdx >= 0 ? byline.slice(dotIdx + 1).trim() : "";

    const family = familyOf(slug);
    const archetype = archetypeOf(slug, family, counters);
    const motif = motifOf(slug);

    const off = PALETTE_OFFSET[archetype] ?? 0;
    palCount[archetype] = (palCount[archetype] ?? 0) + 1;
    const palette = PALETTE_KEYS[(off + palCount[archetype] - 1) % PALETTE_KEYS.length];

    const eyebrow = deriveEyebrow(slug);
    const headline = deriveHeadline(slug, title, bylineTag);
    // sub: first sentence of the meta; if that's very short, append the next
    // sentence only when it fits whole (so we never dangle mid-second-sentence)
    let subSrc = firstSentence(metaDesc);
    if (subSrc.length < 45) {
      const rest = collapse(metaDesc).slice(subSrc.length).trim();
      const s2 = firstSentence(rest);
      if (s2 && (subSrc + " " + s2).length <= 120) subSrc = (subSrc + " " + s2).trim();
    }
    const sub = clip(sanitize(subSrc));

    const hero = { slug, archetype, palette, motif, eyebrow, headline, sub };

    if (archetype === "versus") hero.versus = versusData(slug);
    else if (archetype === "flow") hero.flow = flowData(slug);
    else if (archetype === "terminal") Object.assign(hero, terminalData(slug));
    else if (archetype === "checklist") hero.checklist = checklistData(slug);
    else if (archetype === "stat") Object.assign(hero, STAT[slug] || { statBig: "7", statLabel: "cloud providers" });

    heroes.push(hero);
  }
  return heroes;
}

// CLI dry-run: `node hero-data.mjs` prints a summary + distributions.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const heroes = buildAllHeroes();
  const byArch = {};
  const byPal = {};
  for (const h of heroes) {
    byArch[h.archetype] = (byArch[h.archetype] || 0) + 1;
    byPal[h.palette] = (byPal[h.palette] || 0) + 1;
  }
  for (const h of heroes) {
    const extra = h.versus
      ? " | versus:" + h.versus.map((r) => r.name).join("/")
      : h.flow
        ? " | flow"
        : h.terminal
          ? " | term:" + h.termName
          : h.checklist
            ? " | chk"
            : h.statBig
              ? " | stat:" + h.statBig
              : "";
    console.log(
      `${h.slug}\n    [${h.archetype}/${h.palette}/${h.motif}] eyebrow="${h.eyebrow}"\n    H="${h.headline}"\n    sub="${h.sub}"${extra}`,
    );
  }
  console.log("\n=== archetype distribution ===");
  for (const k of Object.keys(byArch).sort()) console.log(`  ${k}: ${byArch[k]}`);
  console.log("=== palette distribution ===");
  for (const k of PALETTE_KEYS) console.log(`  ${k}: ${byPal[k] || 0}`);
  console.log(`\ntotal heroes: ${heroes.length}`);
}
