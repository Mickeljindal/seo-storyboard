/**
 * CLI: build CONTENT-MAP.html, a single self-contained visual of the content
 * library grouped into silos, for sharing with non-technical stakeholders.
 *
 *   npx tsx scripts/build-content-map.ts
 *
 * No JS in the output, no external assets, no build step. Inline SVG and CSS
 * only, so the file can be emailed, opened offline, or screenshotted.
 *
 * Classification is deterministic and first-match-wins, in the SILOS order
 * below. Every article lands in exactly one silo. Anything unmatched is
 * reported loudly rather than silently dropped, so the totals always add up.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const studio = path.join(root, "content-studio");

type Silo = {
  key: string;
  name: string;
  colour: string;
  /** Buyer journey stage this silo mostly serves. */
  stage: "Problem" | "Comparison" | "Ready to buy";
  /** Why this silo exists, in plain language. */
  why: string;
  /** What it is deliberately NOT trying to do. */
  limit: string;
  match: RegExp;
  slugs: string[];
};

// Order matters: first match wins.
const SILOS: Silo[] = [
  {
    key: "competitors",
    name: "Competitor alternatives & migrations",
    colour: "#4F1AF3",
    stage: "Ready to buy",
    why: "Someone already unhappy with their current host is the cheapest customer to win. They have the problem, the budget, and the intent. These pages meet them at the exact moment they are searching for a way out.",
    limit: "Not for people who have never hosted anything. It assumes they already pay someone else.",
    match:
      /-alternatives?$|-alternative-for-|^migrate-|-vs-kloudbean|^kloudbean-vs-|^why-is-my-.*-bill|^move-lovable-app-off-|^render-cold-starts|^render-free-database|^heroku-cost-after|^vercel-for-node-backends|^render-vs-railway|^cloudways-velocity|^lovable-self-hosted|^lovable-on-managed-aws/,
    slugs: [],
  },
  {
    key: "errors",
    name: "Errors & troubleshooting",
    colour: "#d13b3b",
    stage: "Problem",
    why: "This is our traffic engine. Something is broken, they search the exact error text, and they need an answer in the next five minutes. Highest volume and lowest competition of anything we write. It builds trust before we ever mention the product.",
    limit: "Low intent to buy today. These readers are here to fix a problem, so we sell softly and win them later.",
    match:
      /^fix-|^err-|^error-|^http-error-|^http-4|^cloudflare-|^\d{3}-|^there-has-been-a-critical|^briefly-unavailable|^codeigniter-404|^pm2-app-keeps-restarting|^why-my-ai-app-works|^port-25-blocked|^n-plus-one-query/,
    slugs: [],
  },
  {
    key: "deploy",
    name: "Deploy guides (frameworks & AI builders)",
    colour: "#2f8f49",
    stage: "Ready to buy",
    why: "A developer searching how to deploy their exact framework is about to pick a host. One guide per framework means we show up no matter what they built with, including apps built by AI tools like Cursor, Lovable, and Bolt.",
    limit: "Each guide only serves one framework, so this silo needs breadth rather than depth.",
    match: /^deploy-|^how-to-deploy-any-app$|^where-to-deploy-nodejs|^from-prototype-to-production/,
    slugs: [],
  },
  {
    key: "databases",
    name: "Managed databases & data layer",
    colour: "#0d7d8c",
    stage: "Comparison",
    why: "Databases are where hosting decisions get serious and where people pay more. Covers the six engines we manage, plus how to connect from every popular ORM, so the answer is always ours.",
    limit: "Assumes they already have an app. Not an entry point for beginners.",
    match:
      /^managed-(mysql|postgresql|mariadb|mongodb|redis|elasticsearch|memcached)|^connect-|^database-|^mysql-|^postgresql-|^mariadb-vs|^mysql-vs|^redis-|^when-to-use-(a-nosql|redis)|^full-text-search|^pgvector|^add-managed-database|^managed-database-vs|^celery-with-redis|^neon-alternative|^upstash-alternative|^planetscale-alternative|^supabase-alternative|^mongodb-atlas-alternative|^aws-rds-alternative|^firebase-alternative|^self-host-supabase/,
    slugs: [],
  },
  {
    key: "compliance",
    name: "Saudi market, compliance & enterprise",
    colour: "#000f27",
    stage: "Ready to buy",
    why: "The highest value deals we can win. Regulated and government buyers have real budgets and few credible suppliers who understand the local rules. Nobody else is writing seriously about the Saudi frameworks.",
    limit: "Long sales cycles. These pages are for enterprise conversations, not self-serve signups, so they never quote a monthly price.",
    match:
      /^cscc-|^nca-|^pdpl|^iso-27001|^hipaa|^pci-|^soc2|^gdpr|^data-residency|saudi|^managed-hosting-ksa|riyadh|dammam|^critical-systems|^database-private-access|^secure-compliant|^single-tenant|^cloud-sla/,
    slugs: [],
  },
  {
    key: "wordpress",
    name: "WordPress & CMS",
    colour: "#7d4bd1",
    stage: "Comparison",
    why: "The largest hosting market in the world by number of sites. Agencies and site owners search these terms constantly, and it is a market that already understands paying for managed hosting.",
    limit: "Crowded and competitive. We compete on operational depth, not on beginner tutorials.",
    match:
      /wordpress|woocommerce|^joomla-|^wp-rest-api|^speed-up-woo|^how-to-clear-wordpress/,
    slugs: [],
  },
  {
    key: "selfhost",
    name: "Self-hosting open source tools",
    colour: "#c47b0a",
    stage: "Ready to buy",
    why: "Someone searching how to self-host a tool has already decided to run their own server. They just need somewhere to put it. Very short path from reading to signing up.",
    limit: "Each tool is a small audience on its own. The value is in the total, not any single page.",
    match: /^self-host-|^best-self-hosted-tools$|^discord-bot-hosting$/,
    slugs: [],
  },
  {
    key: "concepts",
    name: "Infrastructure explainers",
    colour: "#5a6b8c",
    stage: "Problem",
    why: "Plain-language answers to the concepts people meet while shopping for hosting. These earn links, get quoted by AI assistants, and make us the source that explains things clearly.",
    limit: "Almost no buying intent directly. Their job is authority and internal links to the pages that do convert.",
    match:
      /-explained$|^what-is-|^what-a-waf|^how-cloud-hosting-works|^ssl-tls|^what-is-sni|^cdn-|^dns-|^reverse-proxy|^high-availability|^vertical-vs-horizontal|^autoscaling|^kubernetes-vs-docker|^webhooks-guide|^uptime-monitoring|^managed-cloud-hosting-myths|^is-free-hosting-worth-it/,
    slugs: [],
  },
  {
    key: "security",
    name: "Security & access control",
    colour: "#8c1d3f",
    stage: "Comparison",
    why: "Security questions come up right before someone commits to a host, especially for teams. Answering them properly removes the last objection.",
    limit: "We cover the infrastructure half honestly and say plainly which parts remain the customer's job.",
    match:
      /^security-|^ssh-key|^secrets-|^jwt-|^fail2ban|^server-hardening|^user-access-control|^ai-built-app-security|^container-security|^custom-domain-and-ssl/,
    slugs: [],
  },
  {
    key: "ops",
    name: "Node.js & production operations",
    colour: "#1f6b8c",
    stage: "Comparison",
    why: "The day-two problems that appear after launch: process managers, background jobs, logging, health checks, zero-downtime releases. This is where we prove we understand production, not just first deploys.",
    limit: "Technical and narrow. Written for engineers, not buyers.",
    match:
      /^nodejs-|^pm2-|^gunicorn-|^graceful-shutdown|^scale-websockets|^structured-logging|^zero-downtime|^nginx-reverse-proxy|^ci-cd-|^environment-variables|^run-a-cron-job|^server-backups|^host-app-api|^host-multiple-apps|^store-user-uploads|^s3-compatible|^gcs-object-storage|^zero-egress|^flask-vs-django|^gitlab-vs-github|^ftp-vs-sftp|^check-ubuntu-version|^docker-container-hosting|^best-managed-nodejs|^cheapest-way-to-host-nodejs|^deploy-node-app|^how-to-migrate-hosting-zero-downtime/,
    slugs: [],
  },
  {
    key: "agencies",
    name: "Agencies & white label",
    colour: "#a8481f",
    stage: "Ready to buy",
    why: "An agency is one signup that brings twenty client sites. Highest value per customer of any self-serve segment, and they buy on operational fit rather than price.",
    limit: "Small search volume. This silo is about deal size, not traffic.",
    match: /agenc|^white-label|^reseller-hosting|^hosting-for-agencies/,
    slugs: [],
  },
  {
    key: "cost",
    name: "Pricing & cost control",
    colour: "#6b8c1f",
    stage: "Comparison",
    why: "Cost is the number one reason people move hosts. These pages catch the moment a bill gets uncomfortable and make the maths honest instead of salesy.",
    limit: "We avoid quoting competitor prices that change, so these lean on structure rather than exact figures.",
    match:
      /^cost-of|^cloud-hosting-pricing|^how-to-cut-your-cloud-bill|^cut-saas-bill|^the-real-cost|^free-tier-vs|^free-app-hosting|^managed-vs-unmanaged|^what-is-a-managed-server/,
    slugs: [],
  },
  {
    key: "platform",
    name: "Platform & positioning pages",
    colour: "#4a4a4a",
    stage: "Ready to buy",
    why: "The pages that answer why us, for a reader who is already comparing us against the market. These carry the direct commercial message.",
    limit: "Few in number by design. Too many of these and the library stops looking useful and starts looking like a brochure.",
    match: /./,
    slugs: [],
  },
];

const STAGE_COLOUR: Record<string, string> = {
  Problem: "#d13b3b",
  Comparison: "#c47b0a",
  "Ready to buy": "#2f8f49",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function main() {
  const slugs = fs
    .readdirSync(studio, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !n.startsWith("_") && n !== "assets" && n !== "hero-studio")
    .filter((n) => fs.existsSync(path.join(studio, n, `${n}.html`)))
    .sort();

  for (const s of slugs) {
    const silo = SILOS.find((x) => x.match.test(s));
    if (silo) silo.slugs.push(s);
  }

  const total = slugs.length;
  const counted = SILOS.reduce((a, s) => a + s.slugs.length, 0);
  if (counted !== total) {
    console.error(`[map] MISMATCH: ${counted} classified vs ${total} articles`);
    process.exit(1);
  }

  const ordered = [...SILOS].sort((a, b) => b.slugs.length - a.slugs.length);
  const max = ordered[0].slugs.length;

  // Stage totals for the funnel.
  const stages: Array<"Problem" | "Comparison" | "Ready to buy"> = [
    "Problem",
    "Comparison",
    "Ready to buy",
  ];
  const stageTotals = stages.map((st) => ({
    stage: st,
    n: SILOS.filter((s) => s.stage === st).reduce((a, s) => a + s.slugs.length, 0),
  }));

  // ---- Bar chart (inline SVG) ----
  const rowH = 34;
  const barX = 300;
  const barW = 560;
  const chartH = ordered.length * rowH + 16;
  const bars = ordered
    .map((s, i) => {
      const y = i * rowH + 8;
      const w = Math.max(3, Math.round((s.slugs.length / max) * barW));
      return `
    <text x="288" y="${y + 15}" text-anchor="end" font-size="13" fill="#000f27">${esc(s.name)}</text>
    <rect x="${barX}" y="${y}" width="${w}" height="21" rx="4" fill="${s.colour}"/>
    <text x="${barX + w + 9}" y="${y + 15}" font-size="13" font-weight="600" fill="#000f27">${s.slugs.length}</text>`;
    })
    .join("");

  const chart = `<svg viewBox="0 0 940 ${chartH}" width="100%" role="img" aria-label="Number of articles in each content silo">
    <rect x="0" y="0" width="940" height="${chartH}" fill="#ffffff"/>${bars}
  </svg>`;

  // ---- Funnel ----
  const funnel = stageTotals
    .map((s) => {
      const pct = Math.round((s.n / total) * 100);
      return `<div class="fstage">
        <div class="fbar" style="background:${STAGE_COLOUR[s.stage]}"></div>
        <div class="fnum">${s.n}</div>
        <div class="flabel">${s.stage}</div>
        <div class="fpct">${pct}% of library</div>
      </div>`;
    })
    .join("");

  // ---- Silo cards ----
  const cards = ordered
    .map((s) => {
      const sample = s.slugs.slice(0, 6);
      return `<section class="card">
      <div class="chead" style="border-left-color:${s.colour}">
        <div>
          <h3>${esc(s.name)}</h3>
          <span class="stage" style="background:${STAGE_COLOUR[s.stage]}">${s.stage}</span>
        </div>
        <div class="count">${s.slugs.length}</div>
      </div>
      <p class="why"><strong>Why we cover it.</strong> ${esc(s.why)}</p>
      <p class="limit"><strong>What it does not do.</strong> ${esc(s.limit)}</p>
      <details>
        <summary>See example articles</summary>
        <ul>${sample.map((x) => `<li><code>${esc(x)}</code></li>`).join("")}</ul>
        ${s.slugs.length > sample.length ? `<p class="more">plus ${s.slugs.length - sample.length} more in this silo</p>` : ""}
      </details>
    </section>`;
    })
    .join("");

  const generated = new Date().toISOString().slice(0, 10);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kloudbean Content Map: ${total} articles, ${SILOS.length} silos</title>
<style>
  :root { --navy:#000f27; --purple:#4F1AF3; --green:#2f8f49; --line:#e4e8f0; }
  * { box-sizing:border-box; }
  body { margin:0; background:#f6f7fb; color:var(--navy);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:1000px; margin:0 auto; padding:40px 22px 70px; }
  header.top { border-bottom:3px solid var(--navy); padding-bottom:20px; margin-bottom:30px; }
  .eyebrow { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--purple); font-weight:700; }
  h1 { font-size:31px; margin:.28em 0 .18em; line-height:1.2; }
  .sub { color:#5a6b8c; margin:0; }
  h2 { font-size:21px; margin:44px 0 8px; }
  .lead { color:#3d4a63; margin:0 0 18px; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:26px 0 6px; }
  .kpi { background:#fff; border:1px solid var(--line); border-radius:10px; padding:15px; }
  .kpi b { display:block; font-size:27px; line-height:1.1; }
  .kpi span { font-size:12.5px; color:#5a6b8c; }
  .panel { background:#fff; border:1px solid var(--line); border-radius:12px; padding:20px; }
  .funnel { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .fstage { background:#fff; border:1px solid var(--line); border-radius:10px; padding:15px; }
  .fbar { height:6px; border-radius:3px; margin-bottom:11px; }
  .fnum { font-size:27px; font-weight:700; line-height:1.1; }
  .flabel { font-weight:600; }
  .fpct { font-size:12.5px; color:#5a6b8c; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:12px; padding:0 17px 15px; }
  .chead { display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
    border-left:5px solid var(--purple); margin:0 -17px 12px; padding:15px 17px 11px; border-bottom:1px solid var(--line); }
  .chead h3 { margin:0 0 7px; font-size:16.5px; }
  .count { font-size:25px; font-weight:700; line-height:1; white-space:nowrap; }
  .stage { display:inline-block; color:#fff; font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; }
  .why, .limit { font-size:14px; margin:.5em 0; }
  .limit { color:#5a6b8c; }
  details { margin-top:9px; font-size:13.5px; }
  summary { cursor:pointer; color:var(--purple); font-weight:600; }
  details ul { margin:9px 0 0; padding-left:19px; }
  code { background:#f2f4f9; padding:1px 5px; border-radius:4px; font-size:12.5px; }
  .more { color:#5a6b8c; font-size:12.5px; margin:7px 0 0; }
  table { width:100%; border-collapse:collapse; background:#fff; font-size:14.5px; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); }
  th { background:#f2f4f9; font-size:13px; text-transform:uppercase; letter-spacing:.05em; }
  .note { background:#fff8e6; border-left:4px solid #c47b0a; padding:13px 16px; border-radius:0 8px 8px 0; font-size:14.5px; }
  footer { margin-top:44px; padding-top:18px; border-top:1px solid var(--line); font-size:13px; color:#5a6b8c; }
  @media (max-width:760px){ .grid,.funnel,.kpis{grid-template-columns:1fr;} }
  @media print { body{background:#fff;} .card,.panel,.kpi,.fstage{break-inside:avoid;} details{display:none;} }
</style>
</head>
<body>
<div class="wrap">

  <header class="top">
    <span class="eyebrow">Kloudbean · Content strategy</span>
    <h1>What we are publishing, and why</h1>
    <p class="sub">${total} finished articles, grouped into ${SILOS.length} topic silos. Generated ${generated}.</p>
  </header>

  <div class="kpis">
    <div class="kpi"><b>${total}</b><span>Articles written and validated</span></div>
    <div class="kpi"><b>${SILOS.length}</b><span>Topic silos</span></div>
    <div class="kpi"><b>${total}</b><span>Queued, ready to publish</span></div>
    <div class="kpi"><b>0</b><span>Published so far</span></div>
  </div>

  <div class="note" style="margin-top:16px">
    <strong>The one number that matters right now.</strong> All ${total} articles are finished and sitting in the
    publish queue. None are live yet. Writing is no longer the bottleneck; publishing is.
  </div>

  <h2>How many articles in each silo</h2>
  <p class="lead">A silo is a group of related articles that link to each other. Search engines reward depth on a
  topic, so ten connected articles about databases beat ten unrelated ones.</p>
  <div class="panel">${chart}</div>

  <h2>How it maps to the buying journey</h2>
  <p class="lead">Every silo is aimed at a different moment. We deliberately do not put everything at the
  ready-to-buy end, because the problem-stage articles are what bring the traffic in the first place.</p>
  <div class="funnel">${funnel}</div>

  <h2>Every silo, and the reasoning</h2>
  <p class="lead">Each card says why the silo exists and, just as importantly, what it is not trying to do.</p>
  <div class="grid">${cards}</div>

  <h2>The strategy in four sentences</h2>
  <div class="panel">
    <p style="margin-top:0"><strong>1. Win on problems, not on adverts.</strong> The biggest silo is error and
    troubleshooting content. Someone whose site is down searches the exact error message. We answer it properly,
    they remember who helped, and we earn the right to sell later.</p>
    <p><strong>2. Be there for every framework.</strong> One deploy guide per technology means we appear whatever
    the developer built with, including apps generated by AI tools.</p>
    <p><strong>3. Take the customers who are already leaving someone else.</strong> Alternative and migration
    pages catch people who have the problem, the budget, and the intent today.</p>
    <p><strong>4. Own the ground nobody else will touch.</strong> Saudi compliance content is hard to write and
    valuable to the right buyer, which is exactly why almost no competitor has it.</p>
  </div>

  <h2>What we deliberately left out</h2>
  <table>
    <thead><tr><th>Not covered</th><th>Reason</th></tr></thead>
    <tbody>
      <tr><td>Basic Git tutorials</td><td>High traffic, but it is about the developer's laptop, not the server we run. Writing it would blur what we are known for.</td></tr>
      <tr><td>Plugin configuration guides</td><td>Big search numbers, no connection to hosting. Traffic that never becomes a customer.</td></tr>
      <tr><td>Anything we cannot honestly claim</td><td>If the product does not do it, we do not imply it. Several planned pages were changed or dropped for this reason.</td></tr>
      <tr><td>Duplicate angles on one keyword</td><td>Two articles chasing the same search compete with each other. Every new piece is checked against the library first.</td></tr>
    </tbody>
  </table>

  <footer>
    Generated from the article files themselves by <code>scripts/build-content-map.ts</code>, so the counts always
    match what is actually written. Re-run it after any new batch.
  </footer>

</div>
</body>
</html>
`;

  const out = path.join(root, "CONTENT-MAP.html");
  fs.writeFileSync(out, html, "utf8");

  console.log(`\n[map] Wrote ${path.relative(root, out)}`);
  console.log(`[map] ${total} articles across ${SILOS.length} silos\n`);
  for (const s of ordered) {
    console.log(`  ${String(s.slugs.length).padStart(3)}  ${s.stage.padEnd(13)} ${s.name}`);
  }
  console.log("");
  for (const st of stageTotals) console.log(`  ${String(st.n).padStart(3)}  ${st.stage}`);
  console.log("");
}

main();
