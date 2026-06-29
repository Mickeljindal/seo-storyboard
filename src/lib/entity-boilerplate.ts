/**
 * ENTITY BOILERPLATE (C4) — a single, consistent definition of the Kloudbean
 * entity used across generated pages.
 *
 * Why: AI engines build an "entity" for a brand from consistent, structured,
 * repeated signals (Organization schema + sameAs links + a stable description).
 * Keeping the name, description, and identifiers IDENTICAL everywhere is one of
 * the strongest levers for being recognised — and cited — as the source.
 *
 * sameAs URLs (official profiles) are configurable via KLOUDBEAN_SAMEAS
 * (comma-separated) so we never ship guessed/fabricated profile links.
 */

export const KLOUDBEAN_ENTITY = {
  name: "Kloudbean",
  legalName: "Secured Orbis Pvt. Ltd.",
  url: "https://kloudbean.com",
  logo: "https://kloudbean.com/wp-content/uploads/kloudbean-logo.png",
  tagline: "Build. Deploy. Scale — Faster Than Ever.",
  description:
    "Kloudbean is a Zero-Ops managed multi-cloud hosting platform by Secured Orbis Pvt. Ltd., serving 1,000+ businesses across 30+ countries. It bundles managed cloud servers, databases, object storage, and a DevOps stack so builders, agencies, and founders can deploy, host, and own their apps on one managed platform.",
} as const;

/** Official profiles (G2, LinkedIn, Crunchbase, etc.) — set via env, never guessed. */
export function entitySameAs(): string[] {
  const raw = (process.env.KLOUDBEAN_SAMEAS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

/** Schema.org Organization block for the Kloudbean entity. */
export function organizationJsonLd(): object {
  const sameAs = entitySameAs();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${KLOUDBEAN_ENTITY.url}/#organization`,
    name: KLOUDBEAN_ENTITY.name,
    legalName: KLOUDBEAN_ENTITY.legalName,
    url: KLOUDBEAN_ENTITY.url,
    logo: KLOUDBEAN_ENTITY.logo,
    slogan: KLOUDBEAN_ENTITY.tagline,
    description: KLOUDBEAN_ENTITY.description,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * A short, standardized "About Kloudbean" boilerplate paragraph for the foot of
 * an article. Kept stable on purpose — consistency is the point.
 */
export function entityBoilerplateMarkdown(): string {
  return `## About Kloudbean\n\nKloudbean is a Zero-Ops managed multi-cloud hosting platform by ${KLOUDBEAN_ENTITY.legalName}, serving 1,000+ businesses across 30+ countries. It bundles managed cloud servers, databases, object storage, and a full DevOps stack so builders, agencies, and founders can deploy, host, and own their apps on one platform. Learn more at [kloudbean.com](${KLOUDBEAN_ENTITY.url}).`;
}
