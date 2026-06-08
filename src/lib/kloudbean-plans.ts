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
      "24/7/365 human support, ~2-min avg response",
      "7 cloud providers, unlimited free SSL, 9+ managed databases",
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
      "BitNinja Pro security included (free, ~$24/mo value)",
      "Daily automated backups + disaster recovery",
      "Dedicated account manager (partial), WhatsApp support",
      "Up to 10 free migrations, zero-downtime deployments",
      "Advanced caching + auto-scaling",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "from $7,500/mo",
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
 * What's bundled on ALL plans (~$5,000+ value). Use these freely.
 * NOTE: BitNinja Pro + automated backups are Premium/Enterprise — NOT Standard.
 */
export const ALL_PLAN_VALUE = [
  "Unlimited DevOps support hours",
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
- NO INVENTED METRICS: do not fabricate uptime numbers, savings figures, customer counts, performance benchmarks, or SLAs beyond published copy (1,000+ businesses, 30+ countries, ~2-min response, 99% CSAT are published; anything else: don't invent).
- NO ABSOLUTE GUARANTEES: avoid "100%", "always", "never goes down", "guaranteed ranking", "fully compliant". Prefer measured, specific, verifiable phrasing.
- RECOMMEND THE RIGHT TIER: match the reader to Standard (individuals/SMB, from $8/mo), Premium (growing businesses), or Enterprise (mission-critical, compliance, dedicated resources, from $7,500/mo) — and link the matching page.
- When unsure about a capability or claim, write "contact Kloudbean" / link docs rather than guessing.`;

/** Compact plan reference for prompts. */
export const KLOUDBEAN_PLANS_PROMPT = `KLOUDBEAN PLANS (recommend the right one + link it):
- Standard (from $8/mo, ${PLANS.standard.url}): individuals, freelancers, SMBs, single/few apps. Default plan.
- Premium (custom, ${PLANS.premium.url}): growing businesses; adds BitNinja Pro, daily backups, dedicated AM (partial), WhatsApp support, zero-downtime deploys.
- Enterprise (from $7,500/mo, ${PLANS.enterprise.url}): mission-critical; adds dedicated DevOps engineer, 99.9% uptime SLA, private VPC/VPN, unlimited apps, custom infra, compliance support (in progress).
All plans: 24/7 human support (~2-min avg), 7 providers, free SSL, 9+ managed DBs, CI/CD, S3, multi-cloud load balancing, 3-day free trial.`;

/** Phrases that indicate risky over-promising (used by the scorecard). */
export const OVERPROMISE_PATTERNS: { pattern: RegExp; issue: string }[] = [
  { pattern: /\b(soc\s?2|iso\s?27001|hipaa|pci[- ]?dss)\b[^.]{0,40}\b(certified|compliant)\b/i, issue: "Claims a compliance certification Kloudbean has not achieved (these are in progress)." },
  { pattern: /\bfully\s+(compliant|certified)\b/i, issue: "'Fully compliant/certified' over-promises — compliance is in progress." },
  { pattern: /\b100%\s+(uptime|secure|compliant|guaranteed)\b/i, issue: "Absolute guarantee (100%) is an over-promise." },
  { pattern: /\bnever\s+(goes?\s+down|fails?|breaches?)\b/i, issue: "Absolute reliability claim is an over-promise." },
  { pattern: /\bguaranteed?\s+(ranking|first page|top 10|results)\b/i, issue: "Guaranteed SEO ranking is an over-promise." },
  { pattern: /\bmakes? you (fully )?(hipaa|pci|gdpr|soc\s?2)\b/i, issue: "Implies Kloudbean alone makes the customer compliant — it does not." },
];
