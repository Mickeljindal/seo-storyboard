/**
 * TOOL QUALITY SCORECARD
 *
 * Deterministic static checks on an assembled tool page (the single HTML block)
 * so we never auto-publish a broken or thin tool. Returns a 0–100 score, the
 * list of issues, and a `blocking` flag for hard failures (no script, no inputs).
 *
 * Pure function — no I/O — so it's fast and testable.
 */

export type ToolScore = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  blocking: boolean;
  issues: string[];
  checks: { label: string; ok: boolean; weight: number }[];
};

const BANNED = [
  "in today's",
  "in the world of",
  "seamless",
  "seamlessly",
  "robust",
  "leverage",
  "unlock",
  "dive into",
  "elevate",
  "game-changer",
  "cutting-edge",
  "revolutionize",
  "unleash",
];

/** Rough check that the inline JS has balanced braces/parens (catches truncation). */
function scriptLooksBalanced(html: string): boolean {
  const m = html.match(/<script>([\s\S]*?)<\/script>/i);
  if (!m) return false;
  const js = m[1];
  const bal = (open: string, close: string) =>
    js.split(open).length - 1 === js.split(close).length - 1;
  return bal("{", "}") && bal("(", ")") && bal("[", "]");
}

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreToolHtml(html: string): ToolScore {
  const lower = html.toLowerCase();
  const text = visibleText(html);
  const words = text ? text.split(/\s+/).length : 0;
  const inputs = (html.match(/<(input|select|textarea)\b/gi) ?? []).length;
  const hasScript = /<script>[\s\S]*\S[\s\S]*<\/script>/i.test(html);
  const hasButton = /<button\b/i.test(html) || /kbt-btn/.test(html);
  const hasFaq = /kbt-faq/.test(html) || /frequently asked/i.test(lower);
  const hasSchema = /application\/ld\+json/i.test(html);
  const hasContent = words >= 250;
  const hasCta = /console\.kloudbean\.com|kloudbean\.com\/register|kloudbean\.com/i.test(lower);
  const hasH2 = /<h2\b/i.test(html);
  const balanced = scriptLooksBalanced(html);
  const bannedHits = BANNED.filter((b) => lower.includes(b));

  const checks: ToolScore["checks"] = [
    { label: "Has interactive JS", ok: hasScript, weight: 18 },
    { label: "JS not truncated (balanced)", ok: balanced, weight: 14 },
    { label: "Has inputs", ok: inputs >= 1, weight: 16 },
    { label: "Has an action button", ok: hasButton, weight: 8 },
    { label: `Readable content (${words}w ≥ 250)`, ok: hasContent, weight: 14 },
    { label: "Has H2 content sections", ok: hasH2, weight: 6 },
    { label: "Has FAQ", ok: hasFaq, weight: 8 },
    { label: "Has JSON-LD schema", ok: hasSchema, weight: 8 },
    { label: "Has Kloudbean CTA", ok: hasCta, weight: 4 },
    { label: "No AI-tell phrases", ok: bannedHits.length === 0, weight: 4 },
  ];

  const score = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const issues = checks.filter((c) => !c.ok).map((c) => c.label);
  if (bannedHits.length) issues.push(`AI-tell phrases: ${bannedHits.join(", ")}`);

  // Blocking: a tool with no working JS or no inputs is broken — never publish.
  const blocking = !hasScript || !balanced || inputs < 1;

  const grade: ToolScore["grade"] =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 55 ? "D" : "F";

  return { score, grade, blocking, issues, checks };
}
