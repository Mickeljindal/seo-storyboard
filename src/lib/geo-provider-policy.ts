/**
 * GEO → PROVIDER/REGION POLICY (source of truth)
 *
 * Kloudbean is multi-cloud, but it CANNOT serve every provider in every country.
 * The most important rule: for Saudi Arabia (KSA), the ONLY in-Kingdom option
 * Kloudbean offers is Google Cloud me-central2 (Dammam). None of Kloudbean's
 * other supported clouds (AWS, Linode, DigitalOcean, Vultr, UpCloud)
 * have a data center inside KSA. (Azure/Oracle/Alibaba/IBM are not offered at all.)
 *
 * Recommending any non-GCP provider for "Saudi hosting / data residency" is a
 * factual error. This module enforces that in BOTH directions:
 *   1. Topic/keyword discovery — reject off-policy "saudi <other-provider> hosting" ideas.
 *   2. AI brief + writer prompts — inject hard rules so the model never recommends
 *      a provider Kloudbean can't deliver in that market.
 */

export type GeoCode = "sa" | "in" | "ae" | "global";

/**
 * SUPPORTED PROVIDERS — the ONLY clouds Kloudbean actually offers.
 * Single source of truth. Edit here if Kloudbean adds/drops a provider.
 * NOTE: Azure, Oracle Cloud (OCI), Alibaba Cloud, and IBM Cloud are NOT offered.
 */
export type ProviderId =
  | "gcp"
  | "aws"
  | "linode"
  | "digitalocean"
  | "vultr"
  | "lightsail"
  | "upcloud";

export const PROVIDER_LABEL: Record<ProviderId, string> = {
  gcp: "Google Cloud (GCP)",
  aws: "AWS",
  linode: "Akamai Linode",
  digitalocean: "DigitalOcean",
  vultr: "Vultr",
  lightsail: "Amazon Lightsail",
  upcloud: "UpCloud",
};

export const SUPPORTED_PROVIDER_IDS = Object.keys(PROVIDER_LABEL) as ProviderId[];

/** Human list for prompts — the official 7 Kloudbean providers. */
export const SUPPORTED_PROVIDERS_TEXT = SUPPORTED_PROVIDER_IDS.map((p) => PROVIDER_LABEL[p]).join(", ");

/**
 * UNSUPPORTED providers Kloudbean does NOT offer. Kept here ONLY so we can
 * detect and reject false "managed <provider> hosting" topics. Comparison /
 * migration angles ("migrate off Azure to Kloudbean") are still allowed.
 */
export const UNSUPPORTED_PROVIDER_KEYWORDS: Record<string, string[]> = {
  "Microsoft Azure": ["azure", "microsoft azure"],
  "Oracle Cloud": ["oracle cloud", "oracle hosting", " oci ", "oci hosting"],
  "Alibaba Cloud": ["alibaba cloud", "aliyun"],
  "IBM Cloud": ["ibm cloud"],
  "Tencent Cloud": ["tencent cloud"],
  Hetzner: ["hetzner"],
};

export type GeoPolicy = {
  geo: GeoCode;
  label: string;
  /** Providers Kloudbean can position for IN-COUNTRY data residency. */
  inCountryProviders: ProviderId[];
  /** The canonical in-country region to anchor content on (if any). */
  primaryRegion: { providerId: ProviderId; regionId: string; city: string } | null;
  /**
   * Providers Kloudbean offers GLOBALLY (fine to mention for non-residency,
   * latency-tolerant, or comparison workloads), but NOT as in-country residency.
   */
  globalProviders: ProviderId[];
  /** Hard rules injected verbatim into AI prompts for this geo. */
  rules: string[];
  /** Data-residency / compliance bodies relevant to this geo. */
  complianceBodies: string[];
};

export const GEO_POLICIES: Record<GeoCode, GeoPolicy> = {
  sa: {
    geo: "sa",
    label: "Saudi Arabia (KSA)",
    inCountryProviders: ["gcp"],
    primaryRegion: { providerId: "gcp", regionId: "me-central2", city: "Dammam" },
    globalProviders: ["gcp", "aws", "linode", "digitalocean", "vultr", "lightsail", "upcloud"],
    rules: [
      "KSA IN-KINGDOM DATA RESIDENCY = GOOGLE CLOUD me-central2 (Dammam) ONLY. This is the single in-Kingdom region Kloudbean can deliver.",
      "NEVER recommend AWS, Linode, DigitalOcean, Vultr, or UpCloud as a 'Saudi hosting' / 'KSA data residency' option — Kloudbean has no in-Kingdom data center for them.",
      "Kloudbean does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner at all — never present them as a Kloudbean option anywhere.",
      "If the keyword implies Saudi/KSA hosting or data residency, the ONLY correct answer is Kloudbean managed Google Cloud in Dammam (me-central2).",
      "You MAY mention other providers ONLY to contrast that they lack an in-Kingdom KSA region, making GCP Dammam via Kloudbean the right choice.",
      "Keep app + managed database in the same me-central2 region/VPC to avoid inter-region egress and keep data in-Kingdom.",
      "Do NOT promise unlimited/free egress in Dammam — Dammam egress is metered (state approximate, link to pricing).",
      "Reference NCA / CSCC / SAMA / MISA only for KSA/enterprise topics and only as supported by kloudbean.com copy.",
    ],
    complianceBodies: ["NCA", "CSCC", "SAMA", "MISA"],
  },
  ae: {
    geo: "ae",
    label: "United Arab Emirates (UAE)",
    inCountryProviders: [],
    primaryRegion: null,
    globalProviders: ["gcp", "aws", "linode", "digitalocean", "vultr", "lightsail", "upcloud"],
    rules: [
      "For UAE, prefer the lowest-latency nearby region Kloudbean offers; if a specific in-UAE residency region is not documented on kloudbean.com, say 'contact Kloudbean' rather than naming one.",
      "Do not claim an in-UAE data center Kloudbean does not document. Position low-latency regional hosting + bundled stack instead.",
      "Kloudbean does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner — never present them as a Kloudbean option.",
    ],
    complianceBodies: [],
  },
  in: {
    geo: "in",
    label: "India",
    inCountryProviders: ["gcp", "aws"],
    primaryRegion: null,
    globalProviders: ["gcp", "aws", "linode", "digitalocean", "vultr", "lightsail", "upcloud"],
    rules: [
      "For India, recommend among Kloudbean's supported providers that offer an in-country region (GCP, AWS) based on workload + price.",
      "Do not name a specific region unless it is supported on kloudbean.com; otherwise position 'India-region managed hosting on Kloudbean'.",
      "Kloudbean does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner — never present them as a Kloudbean option.",
    ],
    complianceBodies: [],
  },
  global: {
    geo: "global",
    label: "Global",
    inCountryProviders: [],
    primaryRegion: null,
    globalProviders: ["gcp", "aws", "linode", "digitalocean", "vultr", "lightsail", "upcloud"],
    rules: [
      "Global content may compare all of Kloudbean's supported providers (GCP, AWS, Linode, DigitalOcean, Vultr, UpCloud); recommend by workload, price, and region availability.",
      "Kloudbean does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner — never present them as a Kloudbean option (only as a competitor to migrate away from).",
      "Avoid country-specific residency claims unless the geo is explicitly that country.",
    ],
    complianceBodies: [],
  },
};

export function getGeoPolicy(geo: string | null | undefined): GeoPolicy {
  const key = (geo ?? "global").toLowerCase() as GeoCode;
  return GEO_POLICIES[key] ?? GEO_POLICIES.global;
}

/** Providers that must NOT be recommended for in-country residency in this geo. */
export function offPolicyProvidersForGeo(geo: string): ProviderId[] {
  const policy = getGeoPolicy(geo);
  const allowed = new Set(policy.inCountryProviders);
  return (Object.keys(PROVIDER_LABEL) as ProviderId[]).filter((p) => !allowed.has(p));
}

const PROVIDER_KEYWORDS: Record<ProviderId, string[]> = {
  gcp: ["gcp", "google cloud", "google-cloud"],
  aws: ["aws", "amazon web services", "amazon ec2", "ec2"],
  linode: ["linode", "akamai"],
  digitalocean: ["digitalocean", "digital ocean", "droplet"],
  vultr: ["vultr"],
  lightsail: ["lightsail", "amazon lightsail"],
  upcloud: ["upcloud"],
};

/** Detect which provider (if any) a keyword/text names. */
export function detectProviders(text: string): ProviderId[] {
  const k = text.toLowerCase();
  const found: ProviderId[] = [];
  for (const [id, terms] of Object.entries(PROVIDER_KEYWORDS) as [ProviderId, string[]][]) {
    if (terms.some((t) => k.includes(t))) found.push(id);
  }
  return found;
}

/** Detect unsupported providers (Azure, Oracle, Alibaba, IBM, Tencent) named in text. */
export function detectUnsupportedProviders(text: string): string[] {
  const k = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const [label, terms] of Object.entries(UNSUPPORTED_PROVIDER_KEYWORDS)) {
    if (terms.some((t) => k.includes(t))) found.push(label);
  }
  return found;
}

const COMPARISON_FRAMING = /\b(vs|versus|alternative|compare|comparison|migrate|migration|move (from|off)|switch (from|off)|leaving)\b/;

/**
 * Reject topics that present an UNSUPPORTED provider as a Kloudbean offering,
 * e.g. "managed Azure hosting", "Oracle Cloud on Kloudbean".
 * Allowed: comparison/migration framing ("migrate off Azure to Kloudbean",
 * "Azure alternative") — those help us win.
 */
export function validateSupportedProviders(keyword: string): { ok: boolean; reason?: string } {
  const unsupported = detectUnsupportedProviders(keyword);
  if (unsupported.length === 0) return { ok: true };
  if (COMPARISON_FRAMING.test(keyword.toLowerCase())) return { ok: true };
  return {
    ok: false,
    reason: `Kloudbean does not offer ${unsupported.join(", ")} — only ${SUPPORTED_PROVIDERS_TEXT}. Allowed only as a migration/comparison angle.`,
  };
}

const RESIDENCY_SIGNALS = [
  "data residency",
  "in-kingdom",
  "in kingdom",
  "saudi",
  "ksa",
  "dammam",
  "riyadh",
  "jeddah",
  "nca",
  "sama",
  "data localization",
  "data localisation",
  "sovereign",
];

/** True when the keyword is about in-country hosting/residency for the geo. */
export function isResidencyIntent(keyword: string, geo: string): boolean {
  const k = keyword.toLowerCase();
  if (geo === "sa") {
    return RESIDENCY_SIGNALS.some((s) => k.includes(s)) || /\bhost(ing)?\b/.test(k);
  }
  return RESIDENCY_SIGNALS.some((s) => k.includes(s));
}

/**
 * Validate a discovered topic against geo policy.
 * Returns { ok, reason } — ok=false means the keyword recommends a provider
 * Kloudbean can't deliver in that market (e.g. "aws saudi arabia hosting").
 */
export function validateTopicAgainstGeoPolicy(
  keyword: string,
  geo: string,
): { ok: boolean; reason?: string } {
  const policy = getGeoPolicy(geo);
  if (policy.inCountryProviders.length === 0) return { ok: true };

  const named = detectProviders(keyword);
  if (named.length === 0) return { ok: true };

  // Only enforce when the keyword is about in-country residency/hosting.
  if (!isResidencyIntent(keyword, geo)) return { ok: true };

  const allowed = new Set(policy.inCountryProviders);
  const offPolicy = named.filter((p) => !allowed.has(p));

  // "alternative" / "vs" framing is allowed (we compare to win), even off-policy.
  if (/\b(vs|versus|alternative|compare|comparison)\b/.test(keyword.toLowerCase())) {
    return { ok: true };
  }

  if (offPolicy.length > 0) {
    return {
      ok: false,
      reason: `${policy.label}: Kloudbean has no in-country region for ${offPolicy
        .map((p) => PROVIDER_LABEL[p])
        .join(", ")} — only ${policy.inCountryProviders
        .map((p) => PROVIDER_LABEL[p])
        .join(", ")} (${policy.primaryRegion?.city ?? "in-country"}).`,
    };
  }
  return { ok: true };
}

/** Hard policy block injected into AI prompts, tailored to the article geo. */
export function geoPolicyPromptBlock(geo: string): string {
  const policy = getGeoPolicy(geo);
  const region = policy.primaryRegion
    ? `${PROVIDER_LABEL[policy.primaryRegion.providerId]} ${policy.primaryRegion.regionId} (${policy.primaryRegion.city})`
    : "no single in-country region — see rules";

  const lines = [
    `GEO PROVIDER POLICY — ${policy.label} (NON-NEGOTIABLE):`,
    `- Kloudbean's ONLY supported clouds: ${SUPPORTED_PROVIDERS_TEXT}. It does NOT offer Azure, Oracle Cloud, Alibaba Cloud, IBM Cloud, or Hetzner — never present these as a Kloudbean option (only as a competitor to migrate away from).`,
    policy.inCountryProviders.length
      ? `- In-country residency provider(s): ${policy.inCountryProviders.map((p) => PROVIDER_LABEL[p]).join(", ")}.`
      : `- No documented in-country residency region — do not invent one.`,
    policy.primaryRegion ? `- Anchor in-country content on: ${region}.` : null,
    ...policy.rules.map((r) => `- ${r}`),
    policy.complianceBodies.length
      ? `- Compliance bodies in scope: ${policy.complianceBodies.join(", ")} (only when supported by kloudbean.com).`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}
