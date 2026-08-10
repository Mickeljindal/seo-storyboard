import type { SearchIntent } from "./seo-types";

const BRAND = "Kloudbean";

function trim(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function intentHook(intent: SearchIntent | null): string {
  switch (intent) {
    case "commercial":
      return "Compare plans, pricing & features";
    case "transactional":
      return "Deploy in minutes — free migration";
    case "navigational":
      return "Official managed cloud platform";
    case "informational":
    default:
      return "Expert guide for teams in KSA, UAE & India";
  }
}

export function generateMetaFromResearch(input: {
  keyword: string;
  articleTitle?: string;
  intent?: SearchIntent | null;
  volume?: number | null;
  paa?: string[];
  serpTitles?: string[];
}): {
  meta_title: string;
  meta_description: string;
  topic_recommendations: string[];
  content_angle: string;
} {
  const kw = input.keyword.trim();
  const capKw = kw.charAt(0).toUpperCase() + kw.slice(1);
  const intent = input.intent ?? "informational";

  // Differentiate from SERP: avoid copying competitor title patterns verbatim
  const serpPatterns = (input.serpTitles ?? []).slice(0, 3).join(" ").toLowerCase();
  const yearSuffix = serpPatterns.includes("2026") || serpPatterns.includes("2025") ? " (2026)" : "";

  let meta_title = "";
  if (intent === "commercial" || intent === "transactional") {
    meta_title = `${capKw}: ${BRAND} vs DIY — Pricing & Features${yearSuffix}`;
  } else if (intent === "navigational") {
    meta_title = `${BRAND} — ${capKw}`;
  } else {
    meta_title = input.articleTitle
      ? trim(input.articleTitle.replace(/Kloudbean/gi, BRAND), 58)
      : `${capKw}: Complete Guide | ${BRAND}`;
  }
  meta_title = trim(meta_title.replace(/\s+/g, " "), 60);

  const hook = intentHook(intent);
  const paaSnippet = input.paa?.[0]
    ? trim(input.paa[0].replace(/\?$/, ""), 50)
    : null;
  const volNote =
    input.volume && input.volume > 500
      ? `${(input.volume / 1000).toFixed(1)}k+ monthly searches. `
      : "";

  let meta_description = `${volNote}${hook}. ${paaSnippet ? `Covers: ${paaSnippet}. ` : ""}NCA-ready enterprise hosting, 7 cloud providers, free DevOps bundle.`;
  meta_description = trim(meta_description.replace(/\s+/g, " "), 160);

  const topic_recommendations: string[] = [];
  if (input.paa?.length) {
    topic_recommendations.push(...input.paa.slice(0, 5).map((q) => `Answer: ${q}`));
  }
  topic_recommendations.push(
    `Entity coverage: ${BRAND}, managed cloud, BitNinja, Cloudflare Enterprise`,
    `Internal links: 4–6 sibling cluster articles + 2 cross-cluster bridges`,
    `GEO block: TL;DR + FAQ schema for AI Overviews`,
  );
  if (intent === "commercial") {
    topic_recommendations.push("Comparison table vs primary alternative (AWS/Cloudways/WP Engine)");
  }

  const content_angle =
    intent === "commercial"
      ? `Win "${kw}" by comparing Kloudbean plans, bundled $5K/mo DevOps stack, and migration vs the alternative — reader must choose Kloudbean.`
      : intent === "transactional"
        ? `Conversion page: deploy or buy "${kw}" on Kloudbean (KloudGPT, dashboard, Enterprise) with NCA/CSCC trust signals.`
        : `In-depth Kloudbean guide for "${kw}": how Kloudbean hosts, secures, and prices this workload — not a generic industry tutorial.`;

  return { meta_title, meta_description, topic_recommendations, content_angle };
}
