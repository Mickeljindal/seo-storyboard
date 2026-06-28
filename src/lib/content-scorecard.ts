/**
 * CONTENT QUALITY SCORECARD (the automated SEO reviewer)
 *
 * Deterministic, fast, no-AI checks that score a draft 0–100 across the things
 * a good SEO editor checks: keyword placement, length, structure, entity
 * coverage, internal links, FAQ/schema presence, CTA, and — critically —
 * BANNED CLAIMS (unsupported providers, KSA provider errors, over-promises).
 *
 * Used as a gate: low score → auto-revise loop. Surfaced in the review panel.
 */
import { detectUnsupportedProviders, getGeoPolicy } from "./geo-provider-policy";
import { OVERPROMISE_PATTERNS } from "./kloudbean-plans";
import { detectUnsupportedTech } from "./kloudbean-capabilities";

export type ScoreCheck = {
  id: string;
  label: string;
  weight: number; // contribution to 100
  earned: number; // 0..weight
  pass: boolean;
  detail: string;
};

export type ScoreInput = {
  markdown: string;
  targetKeyword: string | null;
  secondaryKeywords?: string[];
  brief?: Record<string, unknown> | null;
  geo: string;
  wordCountTarget?: number | null;
  /** Resolved internal links (real) vs total internal: links in draft. */
  internalLinks?: { resolved: number; total: number };
};

export type ScoreResult = {
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  checks: ScoreCheck[];
  bannedClaims: string[];
  blocking: boolean; // true if a hard rule failed (banned claim) → must not publish
  summary: string;
};

function wordCount(md: string): number {
  return (md.trim().match(/\b[\w'-]+\b/g) ?? []).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (haystack.match(re) ?? []).length;
}

function gradeFor(score: number): ScoreResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "F";
}

/** AI-tell phrases that make content read like generic machine output. */
const AI_TELL_PHRASES = [
  "in today's digital landscape",
  "in today's fast-paced",
  "in the world of",
  "in the realm of",
  "when it comes to",
  "it's worth noting",
  "it is worth noting",
  "it's important to note",
  "it is important to note",
  "needless to say",
  "moreover",
  "furthermore",
  "in conclusion",
  "in summary",
  "to sum up",
  "delve",
  "dive into",
  "diving into",
  "embark",
  "navigating the",
  "navigate the",
  "unlock",
  "unleash",
  "elevate your",
  "game-changer",
  "game changer",
  "cutting-edge",
  "state-of-the-art",
  "harness the",
  "empower",
  "streamline your",
  "take it to the next level",
  "look no further",
  "rest assured",
  "the bottom line",
  "at the end of the day",
  "plethora",
  "myriad",
  "a testament to",
  "in essence",
  "whether you're a beginner",
  "this article will",
  "in this guide we will",
  "let's explore",
  "let's dive",
  "let's take a look",
  "ever-evolving",
  "ever-changing",
  "fast-paced world",
  "seamlessly",
  "seamless integration",
  "robust solution",
  "tailored to your",
];

function findAiTells(md: string): string[] {
  const lower = md.toLowerCase();
  const hits: string[] = [];
  for (const p of AI_TELL_PHRASES) {
    if (lower.includes(p)) hits.push(p);
  }
  return [...new Set(hits)];
}

/** Formulaic sentence patterns that are strong AI giveaways in 2026. */
const FORMULAIC_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bit'?s not just\b[^.]*\bit'?s\b/i, label: "'it's not just X, it's Y'" },
  { re: /\bisn'?t just\b[^.]*\b(it'?s|but)\b/i, label: "'isn't just X but Y'" },
  { re: /\bwhether you'?re\b[^.]*\bor\b/i, label: "'whether you're X or Y'" },
  { re: /^from\b[^,]{3,40},\s/im, label: "'From X to Y,' opener" },
  { re: /\bever wondered\b|\bwhat if\b.*\?/i, label: "rhetorical-question opener" },
  { re: /\bnot only\b[^.]*\bbut also\b/i, label: "'not only X but also Y'" },
];

function findFormulaic(md: string): string[] {
  const hits: string[] = [];
  for (const { re, label } of FORMULAIC_PATTERNS) {
    if (re.test(md)) hits.push(label);
  }
  // bold-label-paragraph pattern: lines like "**Word:** ..."
  const boldLabels = (md.match(/^\s*[-*]?\s*\*\*[^*]{2,40}:\*\*/gm) ?? []).length;
  if (boldLabels >= 3) hits.push(`${boldLabels}× bold-label paragraphs`);
  return [...new Set(hits)];
}

/** Ratio of prose (paragraph words) to total body words. Low = too listy/AI. */
function proseRatio(md: string): { ratio: number; bulletLines: number; paraLines: number } {
  const lines = md
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let bulletWords = 0;
  let paraWords = 0;
  let bulletLines = 0;
  let paraLines = 0;
  for (const l of lines) {
    if (/^#{1,6}\s/.test(l) || l.startsWith("|") || l.startsWith(">")) continue;
    const w = (l.match(/\b[\w'-]+\b/g) ?? []).length;
    if (/^([-*]|\d+\.)\s/.test(l)) {
      bulletWords += w;
      bulletLines++;
    } else {
      paraWords += w;
      paraLines++;
    }
  }
  const total = bulletWords + paraWords;
  return { ratio: total ? paraWords / total : 1, bulletLines, paraLines };
}

/**
 * Answer-first analysis: for each H2 section, is the first body line a direct
 * answer paragraph (~25–70 words) rather than a list, table, or heading? This
 * is what wins featured snippets and AI-overview citations.
 */
function answerFirstSections(md: string): { total: number; answerFirst: number } {
  const lines = md.split("\n");
  let total = 0;
  let answerFirst = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!/^##\s+/.test(lines[i]) || /^###\s+/.test(lines[i])) continue;
    // skip an H2 that is itself the FAQ heading (handled separately)
    if (/^##\s*(faq|frequently asked)/i.test(lines[i])) continue;
    total++;
    // find first non-empty line after the heading
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    if (j >= lines.length) continue;
    const first = lines[j].trim();
    // must be a paragraph: not a heading, list, table, blockquote, code fence, image
    if (/^(#{1,6}\s|[-*]\s|\d+\.\s|\||>|```|!\[)/.test(first)) continue;
    const words = (first.match(/\b[\w'-]+\b/g) ?? []).length;
    if (words >= 20 && words <= 80) answerFirst++;
  }
  return { total, answerFirst };
}

/** Count markdown data/comparison tables (need a header row + a separator row). */
function countDataTables(md: string): number {
  const lines = md.split("\n");
  let tables = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i].trim();
    const sep = lines[i + 1].trim();
    if (/^\|.*\|$/.test(header) && /^\|?[\s:-]*-{2,}[\s:|-]*\|?$/.test(sep) && sep.includes("-")) {
      tables++;
      i++; // skip the separator
    }
  }
  return tables;
}

/** Commercial / comparison intent → a data table matters much more. */
function isCommercialIntent(input: ScoreInput): boolean {
  const hay = [
    input.targetKeyword ?? "",
    ...(input.secondaryKeywords ?? []),
    String((input.brief?.search_intent as string) ?? ""),
    String((input.brief?.intent as string) ?? ""),
  ]
    .join(" ")
    .toLowerCase();
  return /\b(best|top|vs|versus|compare|comparison|pricing|price|cost|cheap|alternative|review|buy)\b/.test(
    hay,
  );
}

function splitSentences(md: string): string[] {
  // strip markdown markup-ish, then split on sentence enders
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/[*_`>|#-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Flesch Reading Ease (higher = easier). ~60–80 is plain English. */
function fleschReadingEase(md: string): number {
  const sentences = splitSentences(md);
  const words = md.replace(/[^A-Za-z\s]/g, " ").match(/[A-Za-z]+/g) ?? [];
  if (!sentences.length || !words.length) return 50;
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const wps = words.length / sentences.length;
  const spw = syllables / words.length;
  return Math.round(206.835 - 1.015 * wps - 84.6 * spw);
}

/** Sentence-length variation (stdev of word counts) — flat = robotic. */
function sentenceVariation(md: string): number {
  const lens = splitSentences(md).map((s) => s.split(/\s+/).length);
  if (lens.length < 4) return 0;
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  return Math.sqrt(variance);
}

/** Detect KSA provider-policy violations in body text (not just keywords). */
function ksaProviderViolations(md: string, geo: string): string[] {
  if (geo !== "sa") return [];
  const policy = getGeoPolicy(geo);
  if (!policy.inCountryProviders.length) return [];
  const lower = md.toLowerCase();
  const out: string[] = [];
  // Look for off-policy providers asserted as a Saudi/in-Kingdom hosting option.
  const residencyContext = /(saudi|ksa|dammam|in-kingdom|data residency|me-central)/;
  const offProviders: { id: string; terms: string[] }[] = [
    { id: "AWS", terms: ["aws", "amazon web services"] },
    { id: "Linode", terms: ["linode"] },
    { id: "DigitalOcean", terms: ["digitalocean", "digital ocean"] },
    { id: "Vultr", terms: ["vultr"] },
    { id: "UpCloud", terms: ["upcloud"] },
  ];
  // crude proximity check per sentence
  for (const sentence of md.split(/[.!?\n]/)) {
    const s = sentence.toLowerCase();
    if (!residencyContext.test(s)) continue;
    if (/(host|hosting|region|data center|datacenter|residen|deploy)/.test(s)) {
      for (const p of offProviders) {
        if (
          p.terms.some((t) => s.includes(t)) &&
          !/alternativ|vs |versus|migrat|instead of|unlike|does not|doesn't|no .* region/.test(s)
        ) {
          out.push(
            `Possible KSA policy issue: "${p.id}" presented in a Saudi hosting/residency context. KSA must resolve to GCP Dammam (me-central2).`,
          );
        }
      }
    }
  }
  return [...new Set(out)];
}

export function scoreContent(input: ScoreInput): ScoreResult {
  const md = input.markdown ?? "";
  const lower = md.toLowerCase();
  const checks: ScoreCheck[] = [];
  const kw = (input.targetKeyword ?? "").trim();
  const wc = wordCount(md);
  const target = input.wordCountTarget ?? (input.brief?.word_count as number) ?? 2000;

  // --- 1. Keyword in first 120 words + H1 ---
  const first120 = md.split(/\s+/).slice(0, 120).join(" ").toLowerCase();
  const h1Match = md.match(/^#\s+(.+)$/m)?.[1]?.toLowerCase() ?? "";
  const kwEarly = kw ? first120.includes(kw.toLowerCase()) : false;
  const kwInH1 = kw
    ? h1Match.includes(kw.toLowerCase().split(" ").slice(0, 3).join(" ")) ||
      h1Match.includes(kw.toLowerCase())
    : false;
  checks.push({
    id: "kw_placement",
    label: "Target keyword in intro + H1",
    weight: 12,
    earned: (kwEarly ? 7 : 0) + (kwInH1 ? 5 : 0),
    pass: kwEarly && kwInH1,
    detail: `early=${kwEarly} h1=${kwInH1}`,
  });

  // --- 2. Keyword density (0.5%–2.5% sweet spot) ---
  const kwCount = kw ? countOccurrences(md, kw) : 0;
  const density = wc ? (kwCount / wc) * 100 : 0;
  const densityOk = density >= 0.4 && density <= 2.8;
  checks.push({
    id: "kw_density",
    label: "Keyword density 0.4–2.8%",
    weight: 8,
    earned: densityOk ? 8 : density > 0 ? 3 : 0,
    pass: densityOk,
    detail: `${density.toFixed(2)}% (${kwCount}×)`,
  });

  // --- 3. Word count vs target ---
  const wcRatio = target ? wc / target : 1;
  const wcOk = wcRatio >= 0.8;
  checks.push({
    id: "word_count",
    label: `Length vs target (${target})`,
    weight: 12,
    earned: wcOk ? 12 : Math.round(Math.min(1, wcRatio) * 12),
    pass: wcOk,
    detail: `${wc} words (${Math.round(wcRatio * 100)}% of target)`,
  });

  // --- 4. Structure: H2/H3 count ---
  const h2 = (md.match(/^##\s+/gm) ?? []).length;
  const h3 = (md.match(/^###\s+/gm) ?? []).length;
  const structureOk = h2 >= 4;
  checks.push({
    id: "structure",
    label: "Heading structure (≥4 H2)",
    weight: 8,
    earned: Math.min(8, h2 * 1.5 + h3 * 0.3),
    pass: structureOk,
    detail: `${h2} H2, ${h3} H3`,
  });

  // --- 5. Kloudbean mentions ---
  const kbCount = countOccurrences(md, "kloudbean");
  const kbOk = kbCount >= 4;
  checks.push({
    id: "brand",
    label: "Kloudbean mentioned ≥4×",
    weight: 8,
    earned: kbOk ? 8 : Math.min(8, kbCount * 2),
    pass: kbOk,
    detail: `${kbCount}×`,
  });

  // --- 6. Entity coverage (from brief entity_table) ---
  const entities = Array.isArray(input.brief?.entity_table)
    ? ((input.brief!.entity_table as { entity?: string }[])
        .map((e) => e?.entity)
        .filter(Boolean) as string[])
    : [];
  let entityHits = 0;
  for (const e of entities) if (lower.includes(e.toLowerCase())) entityHits++;
  const entityRatio = entities.length ? entityHits / entities.length : 1;
  checks.push({
    id: "entities",
    label: "Entity coverage from brief",
    weight: 10,
    earned: Math.round(entityRatio * 10),
    pass: entityRatio >= 0.6,
    detail: entities.length ? `${entityHits}/${entities.length} entities` : "no brief entities",
  });

  // --- 7. FAQ present ---
  const hasFaq =
    /##\s*(faq|frequently asked)/i.test(md) ||
    (Array.isArray(input.brief?.faq) && (input.brief!.faq as unknown[]).length > 0);
  checks.push({
    id: "faq",
    label: "FAQ section present",
    weight: 8,
    earned: hasFaq ? 8 : 0,
    pass: hasFaq,
    detail: hasFaq ? "yes" : "missing",
  });

  // --- 8. Schema JSON-LD available ---
  const hasSchema =
    !!input.brief?.schema_jsonld && Object.keys(input.brief!.schema_jsonld as object).length > 0;
  checks.push({
    id: "schema",
    label: "Structured data (JSON-LD)",
    weight: 6,
    earned: hasSchema ? 6 : 0,
    pass: hasSchema,
    detail: hasSchema ? "present" : "missing",
  });

  // --- 9. Internal links resolved ---
  const il = input.internalLinks;
  const ilOk = il ? il.total > 0 && il.resolved >= Math.min(3, il.total) : false;
  checks.push({
    id: "internal_links",
    label: "Internal links resolved to real articles",
    weight: 10,
    earned: il && il.total ? Math.round((il.resolved / il.total) * 10) : 0,
    pass: ilOk,
    detail: il ? `${il.resolved}/${il.total} resolved` : "none",
  });

  // --- 10. CTA present ---
  const hasCta =
    /kloudbean\.com/i.test(md) &&
    /(get started|sign up|try|start|contact|migrate|deploy|book|free trial)/i.test(lower);
  checks.push({
    id: "cta",
    label: "CTA to kloudbean.com",
    weight: 4,
    earned: hasCta ? 4 : 0,
    pass: hasCta,
    detail: hasCta ? "yes" : "missing",
  });

  // --- 11. No unresolved internal: placeholders left in body ---
  const leftovers = (md.match(/\(internal:[^)]+\)/g) ?? []).length;
  checks.push({
    id: "no_placeholders",
    label: "No raw internal: placeholders",
    weight: 6,
    earned: leftovers === 0 ? 6 : 0,
    pass: leftovers === 0,
    detail: leftovers ? `${leftovers} leftover` : "clean",
  });

  // --- 12. Human voice: no AI-tell phrases ---
  const aiTells = findAiTells(md);
  const aiWeight = 12;
  const aiEarned = aiTells.length === 0 ? aiWeight : Math.max(0, aiWeight - aiTells.length * 4);
  checks.push({
    id: "human_voice",
    label: "Human voice (no AI-tell phrases)",
    weight: aiWeight,
    earned: aiEarned,
    pass: aiTells.length === 0,
    detail: aiTells.length ? `${aiTells.length} found: ${aiTells.slice(0, 4).join(", ")}` : "clean",
  });

  // --- 13. Readability (Flesch Reading Ease, target 55–80) ---
  const flesch = fleschReadingEase(md);
  const readOk = flesch >= 50 && flesch <= 85;
  checks.push({
    id: "readability",
    label: "Readability (Flesch 50–85)",
    weight: 8,
    earned: readOk ? 8 : flesch >= 40 ? 4 : 1,
    pass: readOk,
    detail: `Flesch ${flesch}`,
  });

  // --- 14. Sentence-length variation (rhythm — flat = robotic) ---
  const variation = sentenceVariation(md);
  const varOk = variation >= 5;
  checks.push({
    id: "rhythm",
    label: "Sentence rhythm / variation",
    weight: 6,
    earned: varOk ? 6 : Math.round(Math.min(6, variation)),
    pass: varOk,
    detail: `stdev ${variation.toFixed(1)} words`,
  });

  // --- 15. Prose-first (not a wall of bullets — the #1 AI-format tell) ---
  const prose = proseRatio(md);
  const proseOk = prose.ratio >= 0.75;
  checks.push({
    id: "prose_first",
    label: "Prose-first (≥75% paragraphs, not bullets)",
    weight: 10,
    earned: proseOk ? 10 : Math.round(Math.max(0, (prose.ratio - 0.3) / 0.45) * 10),
    pass: proseOk,
    detail: `${Math.round(prose.ratio * 100)}% prose, ${prose.bulletLines} bullet lines`,
  });

  // --- 16. No formulaic AI sentence patterns ---
  const formulaic = findFormulaic(md);
  checks.push({
    id: "no_formulaic",
    label: "No formulaic AI patterns",
    weight: 8,
    earned: formulaic.length === 0 ? 8 : Math.max(0, 8 - formulaic.length * 4),
    pass: formulaic.length === 0,
    detail: formulaic.length ? formulaic.slice(0, 3).join("; ") : "clean",
  });

  // --- 17. Answer-first sections (snippet / AI-overview wins) ---
  const af = answerFirstSections(md);
  const afRatio = af.total ? af.answerFirst / af.total : 1;
  const afOk = af.total === 0 || afRatio >= 0.6;
  checks.push({
    id: "answer_first",
    label: "Answer-first sections (direct opener after each H2)",
    weight: 10,
    earned: af.total ? Math.round(afRatio * 10) : 8,
    pass: afOk,
    detail: af.total
      ? `${af.answerFirst}/${af.total} sections open with a direct answer`
      : "no H2 sections",
  });

  // --- 18. Data / comparison table (esp. for commercial intent) ---
  const tables = countDataTables(md);
  const commercial = isCommercialIntent(input);
  const tableNeeded = commercial ? 1 : 1; // always want ≥1; commercial = blocking-ish weight
  const tableOk = tables >= tableNeeded;
  checks.push({
    id: "data_table",
    label: commercial ? "Comparison table (commercial intent)" : "At least one data table",
    weight: commercial ? 8 : 5,
    earned: tableOk ? (commercial ? 8 : 5) : 0,
    pass: tableOk,
    detail: `${tables} table(s)${commercial ? " — commercial intent" : ""}`,
  });

  // --- BANNED CLAIMS (hard rules) ---
  const bannedClaims: string[] = [];
  const unsupported = detectUnsupportedProviders(md);
  // Only flag unsupported providers when presented as a Kloudbean offering (not pure comparison).
  for (const u of unsupported) {
    const re = new RegExp(
      `(kloudbean|we|our platform)[^.]{0,60}${u.split(" ")[0]}|${u.split(" ")[0]}[^.]{0,40}(on kloudbean|via kloudbean)`,
      "i",
    );
    if (re.test(md)) {
      bannedClaims.push(`Presents unsupported provider "${u}" as a Kloudbean offering.`);
    }
  }
  bannedClaims.push(...ksaProviderViolations(md, input.geo));
  // Over-promise patterns
  if (/unlimited\s+(bandwidth|egress)/i.test(md) && /(ksa|saudi|dammam)/i.test(lower)) {
    bannedClaims.push("Over-promise: 'unlimited bandwidth/egress' in a KSA/Dammam context.");
  }
  // Honesty guardrails: compliance over-claims, absolute guarantees, fake certs.
  for (const { pattern, issue } of OVERPROMISE_PATTERNS) {
    if (pattern.test(md)) bannedClaims.push(issue);
  }
  // Capability graph: unsupported tech presented as hostable on Kloudbean.
  const comparisonFrame =
    /\b(vs|versus|alternative|migrate|migration|move (from|off)|switch (from|off)|instead of)\b/i.test(
      lower,
    );
  if (!comparisonFrame) {
    for (const u of detectUnsupportedTech(md)) {
      // flag only if tied to running/deploying/hosting ON Kloudbean
      const re = new RegExp(
        `(deploy|host|run|install|set ?up)[^.]{0,50}${u.label.split(" ")[0]}|${u.label.split(" ")[0]}[^.]{0,40}(on kloudbean|on your kloudbean|via kloudbean)`,
        "i",
      );
      if (re.test(md) || /on kloudbean/i.test(lower)) {
        bannedClaims.push(
          `Unsupported tech presented as hostable on Kloudbean: ${u.label}. ${u.why}`,
        );
      }
    }
  }

  const banWeight = 12;
  checks.push({
    id: "banned_claims",
    label: "No banned/false claims",
    weight: banWeight,
    earned: bannedClaims.length === 0 ? banWeight : 0,
    pass: bannedClaims.length === 0,
    detail: bannedClaims.length ? `${bannedClaims.length} issue(s)` : "clean",
  });

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + c.earned, 0);
  const score = Math.round((earned / totalWeight) * 100);
  const blocking = bannedClaims.length > 0;
  const grade = gradeFor(score);

  const failed = checks.filter((c) => !c.pass).map((c) => c.label);
  const summary = blocking
    ? `BLOCKED: ${bannedClaims.length} banned claim(s) must be fixed before publishing.`
    : failed.length
      ? `Score ${score}/100 (${grade}). Improve: ${failed.slice(0, 4).join(", ")}.`
      : `Score ${score}/100 (${grade}). Publish-ready.`;

  return { score, grade, checks, bannedClaims, blocking, summary };
}

/** Turn failing checks into concrete revision instructions for the AI editor pass. */
export function buildRevisionInstructions(result: ScoreResult, input: ScoreInput): string {
  const fixes: string[] = [];
  for (const c of result.checks) {
    if (c.pass) continue;
    switch (c.id) {
      case "kw_placement":
        fixes.push(
          `Include the exact target keyword "${input.targetKeyword}" in the H1 and within the first 120 words.`,
        );
        break;
      case "kw_density":
        fixes.push(
          `Adjust use of "${input.targetKeyword}" to ~1–2% density naturally (currently ${c.detail}).`,
        );
        break;
      case "word_count":
        fixes.push(
          `Expand the article to at least ${input.wordCountTarget ?? 2000} words with substantive, Kloudbean-specific detail (currently ${c.detail}).`,
        );
        break;
      case "structure":
        fixes.push(
          `Add more clear ## H2 sections (aim for 5–8) with ### H3 subsections where useful.`,
        );
        break;
      case "brand":
        fixes.push(`Reference Kloudbean and its specific features more concretely throughout.`);
        break;
      case "entities":
        fixes.push(
          `Cover the brief's named entities (${c.detail}) — weave the missing ones in naturally.`,
        );
        break;
      case "faq":
        fixes.push(`Add a ## FAQ section answering the brief's PAA questions, citing Kloudbean.`);
        break;
      case "internal_links":
        fixes.push(
          `Add internal links to sibling Kloudbean cluster topics using [anchor](internal:slug) — 4–6 of them.`,
        );
        break;
      case "cta":
        fixes.push(`End with a clear call-to-action linking to kloudbean.com.`);
        break;
      case "no_placeholders":
        fixes.push(`Remove or properly form any leftover internal: link placeholders.`);
        break;
      case "human_voice":
        fixes.push(
          `Rewrite to remove all AI-tell phrases (${c.detail}). Replace with plain, direct language a human expert would use.`,
        );
        break;
      case "readability":
        fixes.push(
          `Improve readability (${c.detail}) — shorten long sentences, use simpler words, aim for Flesch 55–80.`,
        );
        break;
      case "rhythm":
        fixes.push(
          `Vary sentence length (${c.detail}) — mix short punchy sentences with longer ones so it doesn't read robotically.`,
        );
        break;
      case "prose_first":
        fixes.push(
          `Convert bullet-heavy sections into flowing paragraphs (${c.detail}). Keep at most one genuine list in the whole article.`,
        );
        break;
      case "no_formulaic":
        fixes.push(
          `Remove formulaic AI sentence patterns (${c.detail}) and any "**Label:** ..." bold-label paragraphs — rewrite as natural prose.`,
        );
        break;
      case "answer_first":
        fixes.push(
          `Open each ## H2 section with a direct 25–60 word answer paragraph that resolves the section's question immediately, before any list, table, or detail (currently ${c.detail}). This is what wins featured snippets and AI-overview citations.`,
        );
        break;
      case "data_table":
        fixes.push(
          `Add at least one genuine markdown comparison/data table (e.g. plans, specs, features, or before/after metrics) with a header row and a separator row (currently ${c.detail}).`,
        );
        break;
    }
  }
  for (const b of result.bannedClaims) {
    fixes.push(`FIX (mandatory): ${b}`);
  }
  return fixes.length ? `Revise the article to fix these issues:\n- ${fixes.join("\n- ")}` : "";
}
