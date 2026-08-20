#!/usr/bin/env node
/**
 * Audit the two systemic content problems an owner review surfaced. Read-only.
 *
 *   1. PROMO       The product bolted onto the end as a promotional insert
 *                  rather than connected to the problems the article explains.
 *   2. HAND-OFF    Prose on our own blog that sends the reader to a competitor.
 *
 * Both are also enforced deterministically in src/lib/content-scorecard.ts
 * (`product_woven`, `no_competitor_handoff`). Keep the heuristics here in sync
 * with that file, or the audit and the gate will disagree.
 *
 * Usage: node scripts/audit-promo-and-concede.mjs [--json] [--verbose]
 */
import fs from "node:fs";
import path from "node:path";

const CS = "content-studio";

/**
 * The three stock headings that made the library read like one template.
 * At the time of the audit: "Where Kloudbean fits" ×49, the ", honestly"
 * variant ×13, and "Where this leaves Kloudbean" ×12, so 74 of 91 flagged
 * articles shared one of three interchangeable titles. The heading itself is
 * the tell, whatever its position in the article.
 */
const STOCK_H2 =
  /^\s*(?:where\s+kloudbean\s+fits(?:\s*,\s*(?:honestly|and\s+where\s+it\s+stops))?|where\s+this\s+leaves\s+kloudbean|where\s+a\s+managed\s+cloud\s+fits(?:\s*,\s*honestly)?|how\s+kloudbean\s+does\s+it)\s*$/i;

/**
 * Only real rivals count as a hand-off.
 *
 * DigitalOcean, Linode, Lightsail, Vultr, AWS, GCP and UpCloud are deliberately
 * absent: they are Kloudbean's own seven clouds, so "pick DigitalOcean if you
 * want to stay on the same infrastructure" is the console offering a provider,
 * not a hand-off. Their managed PaaS layers, which ARE rivals, are listed.
 *
 * Matching a bare capitalised word instead produced six false positives out of
 * eighteen hits, all harmless prose: "stay on Full (strict)" (a Cloudflare SSL
 * mode), "stay on React 18" (a version pin), and "stay on Saudi soil" (data
 * residency, three times).
 */
const RIVAL =
  "(?:Cloudways|Heroku|Vercel|Netlify|Render|Railway|Fly\\.io|Fly|Replit|Supabase|Firebase|Upstash|Neon|PlanetScale|MongoDB\\s+Atlas|Atlas|Aiven|RDS|Kinsta|WP\\s+Engine|WPEngine|SiteGround|Bluehost|Hostinger|DreamHost|Hetzner|Cloud\\s+Run|App\\s+Platform|Amplify|Platform\\.sh|Koyeb|Deta|Glitch|n8n\\s+Cloud|Shopify)";

const HANDOFF = [
  [new RegExp(`\\b(?:pick|choose|go\\s+with)\\s+${RIVAL}\\s+if\\b`), "pick <rival> if"],
  [new RegExp(`\\bstick\\s+with\\s+${RIVAL}\\b`), "stick with <rival>"],
  [new RegExp(`\\bstay\\s+on\\s+${RIVAL}\\b`), "stay on <rival>"],
  [new RegExp(`\\b(?:honestly|frankly),\\s+stay\\s+(?:on\\s+${RIVAL}|put)\\b`, "i"), "honestly, stay put"],
  [/\bno\s+reason\s+to\s+(?:move|switch|leave|migrate)\b/i, "no reason to switch"],
];

/**
 * Three genres may honestly point at an alternative: self-host guides (where
 * "just use the hosted version" is real advice), head-to-head pages (which
 * exist to help someone choose), and compliance pages (where the customer
 * genuinely owns obligations).
 */
const EXEMPT_HANDOFF = (slug) =>
  /^self-host-/.test(slug) ||
  /-vs-/.test(slug) ||
  /(compliance|pdpl|csf|cscc|gdpr|soc2|hipaa|pci|nis2|dpdp|pdpa)/i.test(slug);

const pub = new Set(
  JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8")).published.map((p) => p.slug),
);
const slugs = fs
  .readdirSync(CS)
  .filter((s) => fs.existsSync(path.join(CS, s, `${s}.md`)));

const rows = [];
for (const slug of slugs) {
  const md = fs.readFileSync(path.join(CS, slug, `${slug}.md`), "utf8");

  const stock = [...md.matchAll(/^##\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .find((h) => STOCK_H2.test(h));

  /**
   * SPREAD, not position.
   *
   * A character-offset measure was tried and abandoned: it cannot tell "bolted
   * on" from "has a CTA". Every article ends with a CTA and an FAQ that
   * legitimately name the product, so measuring where mentions sit flagged
   * either almost nothing or almost everything depending on whether those tails
   * were included. Counting how many explanatory sections mention the product
   * asks the question the check actually cares about, and it is exactly what a
   * real fix changes.
   */
  const sections = md
    .split(/^##\s+/m)
    .slice(1)
    .filter((s) => !/^\s*(?:FAQ|Frequently asked|Related reading)/i.test(s));
  const withMention = sections.filter((s) => /kloudbean/i.test(s)).length;
  const tooNarrow = sections.length >= 5 && withMention < 2;

  const handoffs = EXEMPT_HANDOFF(slug)
    ? []
    : HANDOFF.filter(([re]) => re.test(md)).map(([, label]) => label);
  // The opening is everything before the first H2, where the lead and the
  // TL;DR live. A hand-off there frames the whole page.
  const opening = md.split(/^##\s+/m)[0] ?? "";
  const inOpening = EXEMPT_HANDOFF(slug) ? false : HANDOFF.some(([re]) => re.test(opening));

  if (!stock && !tooNarrow && !handoffs.length) continue;
  rows.push({
    slug,
    live: pub.has(slug),
    stockHeading: stock ?? null,
    spread: `${withMention}/${sections.length}`,
    tooNarrow,
    handoffs,
    handoffInOpening: inOpening,
  });
}

if (process.argv.includes("--json")) {
  fs.writeFileSync("/tmp/promo-concede.json", JSON.stringify(rows, null, 2));
  console.log(`wrote /tmp/promo-concede.json (${rows.length} articles)`);
} else {
  const promo = rows.filter((r) => r.stockHeading || r.tooNarrow);
  const hand = rows.filter((r) => r.handoffs.length);
  const line = (label, set) =>
    `${label.padEnd(34)} ${String(set.length).padStart(3)}   live ${set.filter((r) => r.live).length}, unpublished ${set.filter((r) => !r.live).length}`;
  console.log(line("PROMO: bolted-on product", promo));
  console.log(`  stock heading ${promo.filter((r) => r.stockHeading).length}, too narrow ${promo.filter((r) => !r.stockHeading && r.tooNarrow).length}`);
  console.log(line("HAND-OFF: sends reader to rival", hand));
  console.log(`  in the opening or TLDR ${hand.filter((r) => r.handoffInOpening).length}`);
  console.log(`\nTOTAL articles needing a look ${rows.length}`);

  if (process.argv.includes("--verbose") || rows.length <= 30) {
    console.log("");
    for (const r of rows.sort((a, b) => a.live - b.live || a.slug.localeCompare(b.slug))) {
      const tags = [
        r.stockHeading ? `stock:"${r.stockHeading}"` : null,
        r.tooNarrow && !r.stockHeading ? `narrow ${r.spread}` : null,
        r.handoffs.length ? `handoff ${r.handoffs.join(", ")}${r.handoffInOpening ? " (OPENING)" : ""}` : null,
      ].filter(Boolean);
      console.log(`  ${r.live ? "LIVE" : "    "} ${r.slug.padEnd(44)} ${tags.join(" | ")}`);
    }
  }
}
