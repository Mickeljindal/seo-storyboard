import "@tanstack/react-start/server-only";
import { KLOUDBEAN_ENTITY } from "./entity-boilerplate";

/**
 * ENTITY DISTRIBUTION (roadmap #7 / the 0.66 lever).
 *
 * Brand mentions across the web correlate with AI citations far more strongly
 * than backlinks. The writing engine can't post to G2 or LinkedIn itself, but it
 * CAN track the off-site presence as a checklist of high-value tasks and flag
 * where Kloudbean's name/facts must stay identical (entity consistency is the #1
 * trust signal). This module seeds that checklist and exposes the canonical
 * facts a human should copy verbatim onto each platform.
 */

export type SeedAsset = {
  platform: string;
  assetType: "listing" | "profile" | "review" | "mention" | "wiki";
  name: string;
  priority: number; // 1 high, 2 med, 3 low
  notes: string;
};

/** Curated, high-value off-site assets for a managed-cloud-hosting brand. */
export const SEED_ASSETS: SeedAsset[] = [
  {
    platform: "G2",
    assetType: "listing",
    name: "G2 product listing",
    priority: 1,
    notes:
      "Cloud Hosting / PaaS category. Seed reviews from happy customers. Reviews + listing get cited by AI for 'best hosting' queries.",
  },
  {
    platform: "Capterra",
    assetType: "listing",
    name: "Capterra / GetApp listing",
    priority: 1,
    notes:
      "Web hosting + cloud categories. Claim the listing, keep description identical to canonical.",
  },
  {
    platform: "Crunchbase",
    assetType: "profile",
    name: "Crunchbase company profile",
    priority: 1,
    notes:
      "Org entity anchor: legal name, founded, HQ, description. AI + knowledge panels read this.",
  },
  {
    platform: "LinkedIn",
    assetType: "profile",
    name: "LinkedIn company page",
    priority: 1,
    notes: "Keep tagline + about identical. Post consistently — mentions feed citation signal.",
  },
  {
    platform: "Trustpilot",
    assetType: "review",
    name: "Trustpilot business profile",
    priority: 2,
    notes: "Review platform; trust signal for commercial queries.",
  },
  {
    platform: "TrustRadius",
    assetType: "review",
    name: "TrustRadius listing",
    priority: 3,
    notes: "B2B review site; secondary to G2/Capterra.",
  },
  {
    platform: "Wikipedia",
    assetType: "wiki",
    name: "Wikipedia article (if eligible)",
    priority: 2,
    notes:
      "Only if notability criteria are met (independent coverage). Strong entity anchor if eligible — do NOT create prematurely.",
  },
  {
    platform: "Wikidata",
    assetType: "wiki",
    name: "Wikidata entity",
    priority: 2,
    notes:
      "Structured entity (Q-id) linking site, Crunchbase, LinkedIn. Easier than Wikipedia; great for the knowledge graph.",
  },
  {
    platform: "Product Hunt",
    assetType: "listing",
    name: "Product Hunt listing",
    priority: 3,
    notes: "Launch/announcement presence; bursty mentions.",
  },
  {
    platform: "GitHub",
    assetType: "profile",
    name: "GitHub org profile",
    priority: 3,
    notes: "Org profile + any OSS/examples; consistent name + bio.",
  },
  {
    platform: "YouTube",
    assetType: "profile",
    name: "YouTube channel",
    priority: 3,
    notes: "Demo/deploy videos; description links back to canonical.",
  },
  {
    platform: "Reddit/Forums",
    assetType: "mention",
    name: "Community mentions (Reddit, IndieHackers)",
    priority: 2,
    notes: "Authentic, non-promotional mentions in relevant threads — high citation correlation.",
  },
];

/** Canonical facts a human should copy VERBATIM onto every platform. */
export function canonicalEntityFacts(): {
  name: string;
  legalName: string;
  url: string;
  tagline: string;
  description: string;
  oneLiner: string;
} {
  return {
    name: KLOUDBEAN_ENTITY.name,
    legalName: KLOUDBEAN_ENTITY.legalName,
    url: KLOUDBEAN_ENTITY.url,
    tagline: KLOUDBEAN_ENTITY.tagline,
    description: KLOUDBEAN_ENTITY.description,
    oneLiner: `${KLOUDBEAN_ENTITY.name} — Zero-Ops managed multi-cloud hosting by ${KLOUDBEAN_ENTITY.legalName}.`,
  };
}

/** Idempotently seed the curated checklist (skips existing platform+name). */
export async function seedEntityDistribution(): Promise<number> {
  const repo = await import("@/server/db/repos/entity-assets");
  return repo.seedEntityAssets(
    SEED_ASSETS.map((s) => ({
      platform: s.platform,
      assetType: s.assetType,
      name: s.name,
      priority: s.priority,
      notes: s.notes,
      status: "todo",
    })),
  );
}
