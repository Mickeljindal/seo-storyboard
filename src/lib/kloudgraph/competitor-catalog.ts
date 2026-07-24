/**
 * KLOUDGRAPH — competitor catalog.
 *
 * The single source of truth for "which market segment is this competitor
 * in" (tier + category). Used by:
 *   - kloudgraph.functions.ts (seedCompetitorsFn) to seed the registry
 *   - semrush-import.ts (importSemrushFolder) to tag a competitor with its
 *     segment the moment its export is imported, instead of leaving every
 *     newly-discovered domain as tier 1 / category null
 *   - market-map.ts to roll competitor strength + opportunities up by segment
 *
 * Matching is done by second-level domain label (sld), not exact domain, so
 * "railway.app" and "railway.com" (Semrush changed which one it tracks) both
 * resolve to the same catalog entry.
 */

export type CompetitorMeta = { domain: string; tier: number; category: string };

export const COMPETITOR_CATALOG: CompetitorMeta[] = [
  // Tier 1 — direct: managed cloud / premium managed WordPress (incl. enterprise WP)
  { domain: "cloudways.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "kinsta.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "wpengine.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "rocket.net", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "pressable.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "nexcess.net", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "convesio.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "servebolt.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "getflywheel.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "pressidium.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "wpvip.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "pantheon.io", tier: 1, category: "Managed cloud / WordPress" },
  // Tier 2 — control panels / managed VPS
  { domain: "runcloud.io", tier: 2, category: "Control panel / managed VPS" },
  { domain: "gridpane.com", tier: 2, category: "Control panel / managed VPS" },
  { domain: "spinupwp.com", tier: 2, category: "Control panel / managed VPS" },
  { domain: "ploi.io", tier: 2, category: "Control panel / managed VPS" },
  { domain: "serveravatar.com", tier: 2, category: "Control panel / managed VPS" },
  // Tier 3 — modern PaaS / app deploy
  { domain: "vercel.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "netlify.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "render.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "railway.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "fly.io", tier: 3, category: "PaaS / app deploy" },
  { domain: "heroku.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "northflank.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "sevalla.com", tier: 3, category: "PaaS / app deploy" },
  // Tier 4 — raw cloud infrastructure
  { domain: "digitalocean.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "vultr.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "linode.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "kamatera.com", tier: 4, category: "Cloud infrastructure" },
  // Tier 5 — big hosts with broad overlap
  { domain: "hostinger.com", tier: 5, category: "Broad host" },
  { domain: "siteground.com", tier: 5, category: "Broad host" },
];

/** Second-level label of a domain (e.g. "pantheon.io" → "pantheon"). Kept in
 * sync with the identical helper in semrush-import.ts (duplicated to avoid a
 * cross-module dependency for one string function). */
function sld(domain: string): string {
  const parts = domain
    .toLowerCase()
    .replace(/^www\./, "")
    .split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

const BY_SLD = new Map(COMPETITOR_CATALOG.map((c) => [sld(c.domain), c]));

/** Look up a competitor's tier/category by domain (matches on second-level label). */
export function metaForDomain(domain: string): CompetitorMeta | null {
  return BY_SLD.get(sld(domain)) ?? null;
}
