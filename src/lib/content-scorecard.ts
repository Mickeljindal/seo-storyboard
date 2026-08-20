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
  /**
   * Article slug. Used only by the competitor-hand-off check, to exempt the
   * genres where pointing at an alternative is honest advice rather than a
   * self-inflicted wound (self-host guides, head-to-head pages, compliance).
   */
  slug?: string | null;
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

/**
 * CLAIM-INTEGRITY PATTERNS — claim shapes that are essentially never honest.
 *
 * These complement OVERPROMISE_PATTERNS in kloudbean-plans.ts, which already
 * covers compliance certification, 100%/absolute guarantees, and ranking
 * promises. This set covers what that one does not: self-directed superlatives,
 * pure marketing absolutes, borrowed authority, and fabricated first-party
 * evidence.
 *
 * Kept in sync with .kiro/steering/seo-operating-system.md section 6 and with
 * STRATEGY_CONTRACT in content-engine.ts.
 *
 * VALIDATED: every pattern below was run against all 288 existing articles and
 * produced ZERO matches, so none of them fire on legitimate technical prose.
 * Two candidates were REMOVED during that testing because they produced only
 * false positives:
 *   - "unmatched"  → real usage is nginx/router terminology ("unmatched
 *                    requests", "unmatched routes"), not a marketing claim.
 *   - "unbeatable" → appeared in legitimate rhetoric that sets up a
 *                    counterargument ("looks unbeatable until you count the
 *                    evenings").
 * If you add a pattern here, test it against the library first. A check that
 * mostly cries wolf trains everyone to ignore the whole gate.
 *
 * The `issue` text is surfaced verbatim to the AI editor as a mandatory fix, so
 * write each one as an instruction, not just a complaint.
 */
/**
 * Sentence-level guards for the claim gates.
 *
 * Why this exists: the gates used to run `pattern.test(md)` across the whole
 * document, which cannot tell a claim from its own denial. Every one of the 13
 * real hits across the 288 published articles was a false positive of exactly
 * that kind: "no host can make you PCI compliant", the FAQ question "Is
 * Kloudbean SOC 2 certified?", an H1 carrying the target keyword, or two
 * internal link anchors sitting side by side. Flagging those is worse than
 * useless, because the auto-revise loop then rewrites the honest disclaimer.
 */

/** Negation/attribution cues that make a flagged phrase a denial or a caveat. */
const NEGATION_CUES =
  /\b(?:no|not|never|nobody|none|neither|nor|without|cannot|can't|won't|wouldn't|isn't|aren't|doesn't|don't|didn't|hasn't|haven't|myth|misconception|instead\s+of|rather\s+than)\b/i;

/**
 * A first-party ASSERTION: us, joined by a linking verb to the claim.
 *
 * Deliberately stricter than "the sentence mentions we". "We go deeper in SOC 2
 * compliant hosting" is authorial voice pointing at an internal link, whereas
 * "Kloudbean is SOC 2 certified" is the claim this gate exists to stop.
 */
const FIRST_PARTY_ASSERTION =
  /\b(?:kloudbean|we|our\s+(?:platform|hosting|servers?|infrastructure)|this\s+platform|the\s+platform)\s+(?:is|are|was|were|has|have|holds?|became|remains?|stays?)\b|\bwe're\b/i;

/**
 * True when a matched phrase in this sentence should NOT be treated as a claim:
 * the sentence denies it, or the sentence is a question (an FAQ heading such as
 * "Is Kloudbean SOC 2 certified?" is the setup for an honest "no", not a claim).
 *
 * The negation cue must sit OUTSIDE the matched span, otherwise a pattern that
 * contains its own cue (like "never fails" or "no other host") would always
 * excuse itself and the gate would never fire.
 *
 * Sentences come from the shared splitSentences(), which already strips code
 * fences and markdown headings. That is deliberate: it also removes the H1
 * false positive, since an article legitimately titled "SOC 2 Compliant
 * Hosting" is naming its topic, not claiming a certificate.
 */
function isExcusedByContext(sentence: string, match: string): boolean {
  if (/\?\s*$/.test(sentence)) return true;
  const outside = sentence.split(match).join(" ");
  return NEGATION_CUES.test(outside);
}

/** Over-promise matches that survive the sentence-level guards. */
function flagOverpromise(md: string): string[] {
  const found: string[] = [];
  const sentences = splitSentences(md);
  for (const { pattern, issue, needsFirstPartyAssertion } of OVERPROMISE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace("g", ""));
    for (const s of sentences) {
      const m = re.exec(s);
      if (!m) continue;
      if (needsFirstPartyAssertion && !FIRST_PARTY_ASSERTION.test(s)) continue;
      if (isExcusedByContext(s, m[0])) continue;
      found.push(issue);
      break; // one report per pattern is enough to trigger a fix
    }
  }
  return found;
}

/** Claim-integrity matches that survive the same sentence-level guards. */
function flagClaimIntegrity(md: string): string[] {
  const found: string[] = [];
  const sentences = splitSentences(md);
  for (const { pattern, issue } of CLAIM_INTEGRITY_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace("g", ""));
    for (const s of sentences) {
      const m = re.exec(s);
      if (!m) continue;
      if (isExcusedByContext(s, m[0])) continue;
      found.push(issue);
      break;
    }
  }
  return found;
}

export const CLAIM_INTEGRITY_PATTERNS: { pattern: RegExp; issue: string }[] = [
  {
    pattern:
      /\b(?:kloudbean|we|our\s+platform|our\s+hosting)\s+(?:is|are|remains?|offers?)\s+(?:the\s+)?(?:best|fastest|most\s+(?:secure|reliable|affordable|powerful|advanced))\b/i,
    issue:
      "Unverifiable self-superlative (Kloudbean/we is the best/fastest/most X). Replace it with the specific, checkable reason a reader would choose this — a real capability, limit, or trade-off.",
  },
  {
    pattern:
      /\b(?:industry[-\s]leading|world[-\s]class|best[-\s]in[-\s]class|award[-\s]winning|second\s+to\s+none)\b/i,
    issue:
      "Empty marketing absolute (industry-leading / world-class / best-in-class / award-winning / second to none). Delete it and state the concrete thing it was standing in for.",
  },
  {
    pattern: /\bno\s+other\s+(?:host|provider|platform)\b/i,
    issue:
      "Unverifiable market-wide claim ('no other host/provider/platform'). We cannot verify what every competitor does. Narrow it to what Kloudbean actually offers.",
  },
  {
    pattern:
      /\b(?:official(?:ly)?\s+(?:partner|certified|endorsed)|in\s+partnership\s+with|certified\s+by|endorsed\s+by)\b/i,
    issue:
      "Borrowed authority: implies a partnership, certification, or endorsement. Remove it unless the relationship is in the approved product-truth source.",
  },
  {
    pattern:
      /\b(?:our|internal)\s+(?:benchmarks?|tests?|research|data|study|studies)\s+(?:show|shows|showed|found|prove|proves|indicate)\b/i,
    issue:
      "Claims first-party research we do not have. Remove the framing, or attribute the point to a real named source. Never invent a benchmark or study.",
  },
  {
    pattern:
      /\b(?:kloudbean|our\s+customers?|our\s+users?)\b[^.]{0,70}\b\d{1,3}(?:\.\d+)?%\s*(?:faster|cheaper|less|more|improvement|reduction|savings?)\b/i,
    issue:
      "A measured percentage improvement attributed to Kloudbean or its customers, with no source. Remove the figure or describe the benefit qualitatively.",
  },
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

/**
 * Em-dash density in PROSE (code/inline-code stripped). Em-dashes are the #1
 * AI-writing tell readers flag, so we want them near zero in body prose.
 */
function emDashDensity(md: string): { count: number; per1000: number } {
  const prose = md.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const count = (prose.match(/—/g) ?? []).length;
  const words = (prose.match(/\b[\w'-]+\b/g) ?? []).length || 1;
  return { count, per1000: (count / words) * 1000 };
}

/**
 * Depth signals that separate lived-in engineering writing from generic
 * explanation: an anti-pattern/gotcha beat, a clear opinion, and (best of all)
 * a grounded first-person experience insight. We reward having at least TWO of
 * the three categories.
 *
 * IMPORTANT: the experience/"we" category must be grounded in provided
 * RAG/experience context (the revision instruction says never invent one), so
 * we deliberately let anti-pattern + opinion satisfy this on their own — both
 * are matters of VOICE, not factual claims, so they carry no fabrication risk.
 */
function depthSignals(md: string): { categories: number; found: string[] } {
  const lower = md.toLowerCase();
  const found: string[] = [];
  const experience = [
    "we see",
    "we've seen",
    "we regularly",
    "we frequently",
    "a common mistake we",
    "customers migrate",
    "when customers",
    "we solve",
    "in our experience",
    "we've helped",
    "we often see",
    "one issue we",
  ];
  const antipattern = [
    "where people get",
    "where this breaks",
    "where teams get",
    "gets this wrong",
    "screw this up",
    "trips up",
    "the trap",
    "goes wrong",
    "worst version",
    "anti-pattern",
    "common mistake",
    "the mistake",
  ];
  const opinion = [
    "honestly",
    "my take",
    "you don't need",
    "don't reach for",
    "is the wrong",
    "don't optimize",
    "don't bother",
    "i'd avoid",
    "my honest",
    "the honest take",
  ];
  if (experience.some((p) => lower.includes(p))) found.push("experience");
  if (antipattern.some((p) => lower.includes(p))) found.push("anti-pattern");
  if (opinion.some((p) => lower.includes(p))) found.push("opinion");
  return { categories: found.length, found };
}

/**
 * PRODUCT INTEGRATION — is Kloudbean connected to the problem, or bolted on?
 *
 * Why this check exists: an audit of the library found 91 articles ending on a
 * product-named H2, and 74 of them used one of just three interchangeable stock
 * titles ("Where Kloudbean fits" ×49, "Where Kloudbean fits, honestly" ×13,
 * "Where this leaves Kloudbean" ×12). Readers described the result exactly:
 * the product reads as a promotional insert near the end rather than something
 * connected to the problems the article just explained.
 *
 * Two independent failure signals, because they have different causes:
 *   1. A STOCK product heading. Always a fail, whatever its position. The title
 *      itself is the template tell, and it is what makes 49 articles feel like
 *      one author ran one template.
 *   2. END-LOADED mentions. If most product mentions sit in the last quarter of
 *      the document, the product was appended rather than woven in.
 *
 * The fix is never to delete the product or to soften the wording. It is to move
 * the relevance up into the sections where the platform genuinely changes the
 * outcome, and to give the closing section a reader-serving job (who fixes what,
 * what to check next) instead of a promotional one.
 */
const STOCK_PRODUCT_H2 =
  /^\s*(?:where\s+kloudbean\s+fits(?:\s*,\s*(?:honestly|and\s+where\s+it\s+stops))?|where\s+this\s+leaves\s+kloudbean|where\s+a\s+managed\s+cloud\s+fits(?:\s*,\s*honestly)?|how\s+kloudbean\s+does\s+it)\s*$/i;

function productIntegration(md: string): {
  stockHeading: string | null;
  sections: number;
  sectionsWithMention: number;
} {
  const headings = [...md.matchAll(/^##\s+(.+)$/gm)];
  const stock = headings.find((h) => STOCK_PRODUCT_H2.test(h[1].trim()));

  // SPREAD, not position. How many of the article's explanatory sections
  // actually mention the product?
  //
  // A character-offset measure was tried first and abandoned, because it cannot
  // tell "bolted on" from "has a CTA". Every article ends with a CTA and an FAQ
  // that legitimately name the product, so measuring where mentions sit flagged
  // either almost nothing (CTA included, mentions look spread) or almost
  // everything (CTA excluded, so the CTA became the new end). Both readings
  // were noise.
  //
  // Section spread asks the question the check actually cares about, and it is
  // exactly what a fix has to change: is the product connected to the problems
  // being explained, or confined to the closing? It is also immune to document
  // length, CTA placement, and FAQ size.
  const sections = md
    .split(/^##\s+/m)
    .slice(1)
    .filter((s) => !/^\s*(?:FAQ|Frequently asked|Related reading)/i.test(s));
  const withMention = sections.filter((s) => /kloudbean/i.test(s)).length;

  return {
    stockHeading: stock ? stock[1].trim() : null,
    sections: sections.length,
    sectionsWithMention: withMention,
  };
}

/**
 * COMPETITOR HAND-OFF — prose that actively sends the reader to a rival.
 *
 * This is Kloudbean's own blog. Being fair to a competitor is required; telling
 * the reader to go buy from one is not the same thing, and the audit found 32
 * articles doing it, 7 of them inside the .tldr where it is the first thing
 * anyone reads. The worst cases conceded a segment Kloudbean genuinely serves
 * (a "pick Cloudways if your world is WordPress and PHP" line, on a platform
 * that runs WordPress, WooCommerce, Laravel, Magento, Drupal and Joomla with
 * staging).
 *
 * IMPORTANT SCOPE LIMIT: three genres say "the hosted option is fine" or
 * "responsibility stays with you" for honest reasons, and must not be flagged.
 *   - self-host guides, where "just use the hosted version" is real advice;
 *   - head-to-head "X vs Y" pages, which exist to help someone choose;
 *   - compliance pages, where the customer genuinely owns obligations.
 * The caller passes `allowsHandoff` for those. Everywhere else, a hand-off is a
 * self-inflicted wound: state the trade-off honestly, then stop short of
 * recommending the rival.
 */
/**
 * A hand-off only counts when the thing being recommended is a real rival.
 *
 * VALIDATED against the library: matching a bare capitalised word after
 * "stay on" produced six false positives out of eighteen hits, and every one
 * was harmless technical or geographic prose: "stay on Full (strict)" (a
 * Cloudflare SSL mode), "stay on React 18" (a version pin), "stay on Saudi
 * soil" (data residency, ×3), and "pick DigitalOcean if you want to stay on the
 * same infrastructure" — which is Kloudbean's own console offering one of its
 * seven clouds, so flagging it was exactly backwards. Requiring a named
 * competitor removes all six without weakening the real signal.
 */
const RIVAL =
  "(?:Cloudways|Heroku|Vercel|Netlify|Render|Railway|Fly\\.io|Fly|Replit|Supabase|Firebase|Upstash|Neon|PlanetScale|MongoDB\\s+Atlas|Atlas|Aiven|RDS|Kinsta|WP\\s+Engine|WPEngine|SiteGround|Bluehost|Hostinger|DreamHost|Hetzner|Cloud\\s+Run|App\\s+Platform|Amplify|Platform\\.sh|Koyeb|Deta|Glitch|n8n\\s+Cloud|Shopify)";
// NOTE: DigitalOcean, Linode, Lightsail, Vultr, AWS, GCP and UpCloud are
// deliberately ABSENT. They are Kloudbean's own seven clouds, so "pick
// DigitalOcean if you want to stay on the same infrastructure" is the console
// offering a provider, not a hand-off to a competitor. Their managed PaaS
// layers, which ARE rivals, are listed separately (App Platform, Cloud Run,
// Amplify).

const HANDOFF_PATTERNS: { re: RegExp; label: string }[] = [
  { re: new RegExp(`\\b(?:pick|choose|go\\s+with)\\s+${RIVAL}\\s+if\\b`), label: "'pick <rival> if'" },
  { re: new RegExp(`\\bstick\\s+with\\s+${RIVAL}\\b`), label: "'stick with <rival>'" },
  { re: new RegExp(`\\bstay\\s+on\\s+${RIVAL}\\b`), label: "'stay on <rival>'" },
  {
    re: new RegExp(`\\b(?:honestly|frankly),\\s+stay\\s+(?:on\\s+${RIVAL}|put)\\b`, "i"),
    label: "'honestly, stay put'",
  },
  {
    re: /\bno\s+reason\s+to\s+(?:move|switch|leave|migrate)\b/i,
    label: "'no reason to switch'",
  },
];

function findHandoffs(md: string): { label: string; inOpening: boolean }[] {
  const out: { label: string; inOpening: boolean }[] = [];
  // The opening = everything before the first H2, which is where the lead and
  // the TL;DR live. A hand-off there frames the entire page.
  const opening = md.split(/^##\s+/m)[0] ?? "";
  for (const { re, label } of HANDOFF_PATTERNS) {
    const bare = new RegExp(re.source, re.flags.replace("g", ""));
    if (!bare.test(md)) continue;
    out.push({ label, inOpening: bare.test(opening) });
  }
  return out;
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

  // --- 16b. Near-zero em-dashes in prose (the single biggest AI tell) ---
  const em = emDashDensity(md);
  const emOk = em.per1000 <= 1.5;
  checks.push({
    id: "em_dashes",
    label: "Near-zero em-dashes in prose",
    weight: 8,
    earned: emOk ? 8 : em.per1000 <= 4 ? 3 : 0,
    pass: emOk,
    detail: `${em.count} in prose (${em.per1000.toFixed(1)}/1000 words)`,
  });

  // --- 16c. Engineering depth: opinion + anti-pattern + grounded experience ---
  const depth = depthSignals(md);
  const depthOk = depth.categories >= 2;
  checks.push({
    id: "depth_signals",
    label: "Engineering depth (opinion, anti-pattern, grounded experience)",
    weight: 6,
    earned: depth.categories >= 2 ? 6 : depth.categories === 1 ? 3 : 0,
    pass: depthOk,
    detail: depth.found.length ? depth.found.join(", ") : "none",
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

  // --- 17b. GEO quick answer (extraction-friendly block for AI engines) ---
  const ao = input.brief?.ai_overview as Record<string, unknown> | null | undefined;
  const quickAnswer = String(input.brief?.quick_answer ?? ao?.quick_answer ?? "").trim();
  const qaWords = quickAnswer ? (quickAnswer.match(/\b[\w'-]+\b/g) ?? []).length : 0;
  const qaOk = qaWords >= 25 && qaWords <= 75;
  checks.push({
    id: "quick_answer",
    label: "GEO quick-answer block (25–75 words)",
    weight: 6,
    earned: qaOk ? 6 : quickAnswer ? 3 : 0,
    pass: qaOk,
    detail: quickAnswer ? `${qaWords} words` : "missing",
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

  // --- 19. Product woven into the problem, not bolted on at the end ---
  const pi = productIntegration(md);
  // Only judge spread on articles long enough for it to mean something. Below
  // about five sections, "two of them" is not evidence of anything.
  const tooNarrow = pi.sections >= 5 && pi.sectionsWithMention < 2;
  const piFail = !!pi.stockHeading || tooNarrow;
  checks.push({
    id: "product_woven",
    label: "Product connected to the problem, not appended as a promo section",
    weight: 8,
    earned: piFail ? (pi.stockHeading ? 0 : 3) : 8,
    pass: !piFail,
    detail: pi.stockHeading
      ? `stock heading "${pi.stockHeading}" (used across dozens of articles)`
      : `mentioned in ${pi.sectionsWithMention} of ${pi.sections} body sections`,
  });

  // --- 20. No hand-off that sends the reader to a competitor ---
  // Self-host guides, head-to-head comparisons and compliance pages are exempt:
  // there, "the hosted option is fine" / "you own this obligation" is honest.
  const slug = String(input.slug ?? "");
  const allowsHandoff =
    /^self-host-/.test(slug) ||
    /-vs-/.test(slug) ||
    /(compliance|pdpl|csf|cscc|gdpr|soc2|hipaa|pci|nis2|dpdp|pdpa)/i.test(slug);
  const handoffs = allowsHandoff ? [] : findHandoffs(md);
  const handoffInOpening = handoffs.some((h) => h.inOpening);
  checks.push({
    id: "no_competitor_handoff",
    label: "No hand-off telling the reader to pick a competitor",
    weight: 6,
    earned: handoffs.length === 0 ? 6 : handoffInOpening ? 0 : 2,
    pass: handoffs.length === 0,
    detail: allowsHandoff
      ? "exempt genre (self-host / head-to-head / compliance)"
      : handoffs.length
        ? `${handoffs.map((h) => h.label).join(", ")}${handoffInOpening ? " — IN THE OPENING/TLDR" : ""}`
        : "clean",
  });

  // --- BANNED CLAIMS (hard rules) ---
  const bannedClaims: string[] = [];
  const unsupported = detectUnsupportedProviders(md);
  // Only flag unsupported providers when presented as a Kloudbean offering (not pure comparison).
  //
  // Three precision fixes here, all found by auditing the published library:
  //   \b around the subjects - "we" with no word boundary matched inside
  //     "lowest", which is how hetzner-vs-kloudbean got flagged for a sentence
  //     reading "...lowest bill and enjoy the ops? Hetzner".
  //   [^.\n] instead of [^.] - the window must not span a line break.
  //   comparisonFrame - a "X vs Kloudbean" page names its rival by design. The
  //     unsupported-TECH check below already honours this; providers should too.
  const providerComparisonFrame =
    /\b(vs|versus|alternative|compared? (to|with)|migrate|migration|move (from|off)|switch (from|off)|instead of)\b/i.test(
      lower,
    );
  if (!providerComparisonFrame) {
    for (const u of unsupported) {
      const first = u.split(" ")[0];
      const re = new RegExp(
        `\\b(kloudbean|we|our platform)\\b[^.\\n]{0,60}\\b${first}\\b|\\b${first}\\b[^.\\n]{0,40}(on kloudbean|via kloudbean)`,
        "i",
      );
      if (re.test(md)) {
        bannedClaims.push(`Presents unsupported provider "${u}" as a Kloudbean offering.`);
      }
    }
  }
  bannedClaims.push(...ksaProviderViolations(md, input.geo));
  // Over-promise patterns
  if (/unlimited\s+(bandwidth|egress)/i.test(md) && /(ksa|saudi|dammam)/i.test(lower)) {
    bannedClaims.push("Over-promise: 'unlimited bandwidth/egress' in a KSA/Dammam context.");
  }
  // Honesty guardrails: compliance over-claims, absolute guarantees, fake certs.
  // Evaluated per sentence so a denial ("no host can make you PCI compliant")
  // and a keyword-bearing heading are not mistaken for the claim itself.
  bannedClaims.push(...flagOverpromise(md));
  // Claim integrity: self-superlatives, marketing absolutes, borrowed authority,
  // fabricated first-party evidence. See CLAIM_INTEGRITY_PATTERNS above.
  bannedClaims.push(...flagClaimIntegrity(md));
  // Unresolved verification markers must never reach publication. The whole
  // point of writing [VERIFY WITH PRODUCT TEAM] instead of guessing is that it
  // is a task someone actions, so it has to block the publish path or it just
  // becomes a different way of shipping an unknown.
  const verifyMarkers = (md.match(/\[VERIFY[^\]]*\]/gi) ?? []).length;
  if (verifyMarkers > 0) {
    bannedClaims.push(
      `${verifyMarkers} unresolved verification marker(s) left in the draft. Confirm each fact against the product-truth source and replace the marker, or cut the sentence. Do not publish with a [VERIFY...] marker in the body.`,
    );
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
      case "em_dashes":
        fixes.push(
          `Cut em-dashes from prose (${c.detail}) to near zero. Replace each with a comma, a period, parentheses, or two separate sentences. This is the single biggest AI-writing tell.`,
        );
        break;
      case "depth_signals":
        fixes.push(
          `Add lived-in engineering depth (currently: ${c.detail}). Include an honest "here's where this usually breaks" anti-pattern and at least one clear engineering opinion. If — and ONLY if — the provided experience/RAG grounding supports it, add a first-person "a common mistake we see" insight. Never invent an experience, a customer, or a statistic that isn't in the grounding.`,
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
      case "product_woven":
        fixes.push(
          `The product currently reads as a promotional insert rather than something connected to the problems the article explains (${c.detail}). Fix it STRUCTURALLY, do not just soften the wording, and do not delete the product. Three things: (1) never use a stock heading like "Where Kloudbean fits", "Where Kloudbean fits, honestly", or "Where this leaves Kloudbean" — dozens of articles already use those and they are the reason the library reads like one template; write a heading that names the reader's actual question. (2) Move the platform's relevance UP into the two or three sections where it genuinely changes the outcome, at the moment that problem is being explained. (3) Give the closing section a reader-serving job instead of a selling one, for example splitting the problems into which ones the reader's own code owns versus which ones the host owns. Where a problem is NOT something any host can fix, say so plainly, ours included. That honesty is what makes the rest credible.`,
        );
        break;
      case "no_competitor_handoff":
        fixes.push(
          `This is Kloudbean's own blog and the draft actively sends the reader to a competitor (${c.detail}). Being fair to a rival is required; recommending one is not the same thing. Remove the hand-off. Give the competitor at most ONE honest, measured line about its real strength, then pivot to what it does not settle. Critically, never concede a segment Kloudbean actually serves: it runs WordPress, WooCommerce, Laravel, Magento, Drupal and Joomla with staging, plus Node, Python, Ruby, Java and Go, so "pick them if you only need WordPress and PHP" is both factually wrong and self-defeating. Reframe the choice on SCOPE rather than quality: state what each one covers, and let the reader see which fits.`,
        );
        break;
      case "quick_answer":
        fixes.push(
          `Right after the TL;DR line, add or tighten a standalone 40-60 word paragraph that directly answers "${input.targetKeyword}" in one self-contained thought — no "as mentioned above", written so an AI engine could quote it verbatim (currently ${c.detail}).`,
        );
        break;
    }
  }
  for (const b of result.bannedClaims) {
    fixes.push(`FIX (mandatory): ${b}`);
  }
  return fixes.length ? `Revise the article to fix these issues:\n- ${fixes.join("\n- ")}` : "";
}
