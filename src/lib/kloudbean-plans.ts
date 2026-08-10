/**
 * KLOUDBEAN SUBSCRIPTION TIERS + HONESTY GUARDRAILS
 *
 * Source of truth: support.kloudbean.com/docs/getting-started/subscription-tier
 * and kloudbean.com/enterprise, kloudbean.com/smb-premium-support-plan.
 *
 * Two jobs:
 *  1. Give the content engine ACCURATE plan facts (so it can recommend the right
 *     tier and link to /pricing or /enterprise).
 *  2. Enforce HONESTY — Kloudbean has real limits. Over-promising (especially on
 *     compliance/fintech) erodes trust and AI-citation quality, and can harm the
 *     brand. These guardrails keep claims defensible.
 */

export type PlanId = "standard" | "premium" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  url: string;
  idealFor: string[];
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  standard: {
    id: "standard",
    name: "Standard",
    price: "from $8/mo",
    url: "https://www.kloudbean.com/pricing/",
    idealFor: [
      "Individuals, freelancers, small businesses",
      "Single or few applications",
      "Budget-conscious builders getting started",
    ],
    highlights: [
      "Default plan on every new service",
      "Responsive managed support",
      "7 cloud providers, unlimited free SSL, 7 managed databases (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB)",
      "CI/CD, multi-cloud load balancing, S3 object storage",
      "1 free migration per server",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: "custom pricing",
    url: "https://www.kloudbean.com/smb-premium-support-plan/",
    idealFor: [
      "Growing businesses with increasing traffic",
      "Teams needing faster support + automated backups",
      "Apps needing zero-downtime deploys",
    ],
    highlights: [
      "Everything in Standard, plus:",
      "BitNinja Pro added security layer included",
      "Daily automated backups + disaster recovery",
      "Dedicated account manager (partial), WhatsApp support",
      "Up to 10 free migrations, zero-downtime deployments",
      "Advanced caching + auto-scaling",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "custom / contact sales",
    url: "https://www.kloudbean.com/enterprise/",
    idealFor: [
      "Large-scale / mission-critical operations",
      "Orgs needing dedicated DevOps + 99.9% uptime SLA",
      "Advanced security, private network, compliance needs",
    ],
    highlights: [
      "Everything in Standard + Premium, plus:",
      "Dedicated DevOps engineer + dedicated account manager",
      "99.9% uptime SLA, unlimited applications & migrations",
      "Private VPC, VPN setup, custom security policies",
      "Custom infrastructure setup + dedicated monitoring",
      "Compliance support (SOC 2, ISO 27001, HIPAA, GDPR — in progress)",
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);

/**
 * What's bundled on ALL plans. Use these freely.
 * NOTE: BitNinja Pro + automated backups are Premium/Enterprise — NOT Standard.
 */
export const ALL_PLAN_VALUE = [
  "Managed DevOps support",
  "Advanced caching",
  "Migrations done-for-you (1 on Standard)",
  "Uptime monitoring",
  "Free SSL certificates",
  "3-day free trial, no hidden fees",
];

/**
 * HONESTY GUARDRAILS — injected into every AI prompt. Kloudbean has real limits;
 * over-promising harms trust, AI citations, and the brand. Be confident, not hype.
 */
export const KLOUDBEAN_HONESTY_GUARDRAILS = `HONESTY GUARDRAILS (NON-NEGOTIABLE — over-promising harms the brand and AI-citation trust):
- COMPLIANCE IS IN PROGRESS, NOT ACHIEVED. SOC 2, ISO 27001, HIPAA, and GDPR are works in progress (targeted, not certified). NEVER claim Kloudbean is "SOC 2 certified", "HIPAA compliant", or "ISO 27001 certified". Say "compliance support" or "working toward / in progress" and point to Enterprise + sales.
- FINTECH / HEALTHCARE / REGULATED: do NOT promise regulatory outcomes (PCI-DSS, SAMA, HIPAA guarantees). Position Kloudbean as providing the infrastructure foundation (private VPC, isolation, security stack, dedicated DevOps) and route compliance specifics to the Enterprise team. Never imply Kloudbean makes the customer compliant by itself.
- TIER ACCURACY: BitNinja Pro security and daily automated backups are PREMIUM/ENTERPRISE features, not Standard. 99.9% uptime SLA, dedicated DevOps engineer, private VPC, and VPN are ENTERPRISE-only. Unlimited applications is Enterprise. Don't attribute higher-tier features to the base plan.
- NO INVENTED OR UNPUBLISHABLE METRICS: do not fabricate uptime numbers, savings figures, customer counts, performance benchmarks, or SLAs. The figures "1,000+ businesses", "30+ countries", "~2-min response", and "99% CSAT" are NOT to be published — never use them as claims. For support, say "responsive managed support" (no number).
- NO ABSOLUTE GUARANTEES: avoid "100%", "always", "never goes down", "guaranteed ranking", "fully compliant". Prefer measured, specific, verifiable phrasing.
- RECOMMEND THE RIGHT TIER: match the reader to Standard (individuals/SMB, from $8/mo), Premium (growing businesses), or Enterprise (mission-critical, compliance, dedicated resources, custom / contact sales) — and link the matching page. Always tell readers to verify current pricing on the pricing page.
- When unsure about a capability or claim, write "contact Kloudbean" / link docs rather than guessing.`;

/** Compact plan reference for prompts. */
export const KLOUDBEAN_PLANS_PROMPT = `KLOUDBEAN PLANS (recommend the right one + link it):
- Standard (from $8/mo, ${PLANS.standard.url}): individuals, freelancers, SMBs, single/few apps. Default plan.
- Premium (custom, ${PLANS.premium.url}): growing businesses; adds BitNinja Pro, daily backups, dedicated AM (partial), WhatsApp support, zero-downtime deploys.
- Enterprise (custom / contact sales, ${PLANS.enterprise.url}): mission-critical; adds dedicated DevOps engineer, 99.9% uptime SLA, private VPC/VPN, unlimited apps, custom infra, compliance support (in progress).
All plans: responsive managed support, 7 providers, free SSL, 7 managed DBs (MySQL, MariaDB, PostgreSQL, Redis, Memcached, Elasticsearch, MongoDB), CI/CD, S3, multi-cloud load balancing, 3-day free trial. Always verify current pricing on the pricing page.`;

/**
 * Phrases that indicate risky over-promising (used by the scorecard).
 *
 * `needsFirstPartyAssertion: true` means the phrase is ONLY a violation when the
 * sentence actually asserts it OF US, subject plus linking verb ("Kloudbean is
 * SOC 2 certified"). Compliance vocabulary is unavoidable topic vocabulary:
 * "SOC 2 compliant hosting" is a target keyword, an H1, and an internal link
 * anchor across the whole enterprise cluster, and the honest sentences in those
 * articles are precisely the ones saying a host CANNOT hand you a certificate.
 * Without this, a document-wide substring test flags the disclaimer as the
 * violation and the auto-revise loop rewrites correct copy into something less
 * accurate. Absolute guarantees ("100% uptime", "guaranteed rankings") need no
 * subject, because nobody writes those honestly.
 *
 * Note it is an ASSERTION, not a bare mention of "we". "We go deeper in SOC 2
 * compliant hosting" is an internal link, not a certification claim.
 *
 * The scorecard applies these per sentence and additionally skips negated
 * sentences and questions. See flagOverpromise() in content-scorecard.ts.
 */
export const OVERPROMISE_PATTERNS: {
  pattern: RegExp;
  issue: string;
  needsFirstPartyAssertion?: boolean;
}[] = [
  // [^.\n] rather than [^.]: the window must not cross a line break, or the
  // secondary-keyword list in a file's frontmatter reads as one long claim.
  { pattern: /\b(soc\s?2|iso\s?27001|hipaa|pci[- ]?dss)\b[^.\n]{0,40}\b(certified|compliant)\b/i, issue: "Claims a compliance certification Kloudbean has not achieved (these are in progress).", needsFirstPartyAssertion: true },
  { pattern: /\bfully\s+(compliant|certified)\b/i, issue: "'Fully compliant/certified' over-promises — compliance is in progress.", needsFirstPartyAssertion: true },
  { pattern: /\b100%\s+(uptime|secure|compliant|guaranteed)\b/i, issue: "Absolute guarantee (100%) is an over-promise." },
  // Subject is inline rather than flagged, because it has to be ADJACENT. A
  // sentence like "the migrations we see almost never fail on the build" is
  // about migrations, not uptime, yet it contains "we".
  { pattern: /\b(kloudbean|we|our\s+(?:platform|hosting|servers?|infrastructure)|the\s+(?:platform|server|service)|your\s+(?:site|app|server))\s+never\s+(goes?\s+down|fails?|breaches?)\b/i, issue: "Absolute reliability claim is an over-promise." },
  // Plurals matter here: the natural phrasing is "guaranteed rankings", and the
  // earlier `(ranking|...)\b` never matched it because of the trailing \b.
  { pattern: /\bguarantee[sd]?\s+(rankings?|first page|top 10|results)\b/i, issue: "Guaranteed SEO ranking is an over-promise." },
  // No firstParty flag: "makes you PCI compliant" is a violation whoever the
  // stated subject is. The negation guard is what clears the honest usage
  // ("no honest host can make you PCI compliant on its own").
  { pattern: /\bmakes? you (fully )?(hipaa|pci|gdpr|soc\s?2)\b/i, issue: "Implies Kloudbean alone makes the customer compliant — it does not." },
];
