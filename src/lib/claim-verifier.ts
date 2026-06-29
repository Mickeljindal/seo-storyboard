import "@tanstack/react-start/server-only";
import { generateText, type LanguageModel } from "ai";
import { askKloudbeanRag, hasRagConfigured } from "./rag-client";

/**
 * CLAIMS-VS-KB VERIFIER (RAG-grounded fact check).
 *
 * The deterministic scorecard catches banned phrasing and known-unsupported
 * providers, but it can't catch a plausible-sounding but WRONG product fact
 * the model invented (a feature Kloudbean doesn't have, a price that's off, a
 * compliance cert it doesn't hold, a made-up region/limit).
 *
 * This module extracts the concrete factual claims an article makes ABOUT
 * Kloudbean, grounds them against the live RAG knowledge base, and asks the
 * model to judge each claim as supported / unsupported / contradicted. The
 * findings feed the auto-revise loop, and CONTRADICTED claims are treated as
 * blocking (same severity as a banned claim) so we never publish a confident
 * falsehood about the product.
 */

export type ClaimVerdict = "supported" | "unsupported" | "contradicted";

export type ClaimFinding = {
  claim: string; // the sentence/assertion as written
  verdict: ClaimVerdict;
  reason: string; // why — grounded in KB
  fix: string; // concrete correction instruction
};

export type ClaimVerifyResult = {
  ran: boolean; // false if RAG/AI unavailable or no claims found
  findings: ClaimFinding[];
  contradicted: ClaimFinding[]; // subset, verdict === "contradicted"
  unsupported: ClaimFinding[]; // subset, verdict === "unsupported"
  blocking: boolean; // any contradicted claim → must fix before publish
  sources: { title: string; url: string }[];
  log: string[];
};

/** Verbs/markers that signal a checkable factual claim about the product. */
const CLAIM_MARKERS =
  /\b(kloudbean|we|our (platform|service|hosting))\b[^.!?]*\b(offer|offers|provide|provides|include|includes|support|supports|comes? with|features?|bundles?|guarantee|guarantees|comply|complies|compliant|certified|hosts?|deploys?|runs?|gives? you|lets? you|priced|pricing|costs?|starts? at|free|unlimited|\$\d|\d+\s?(gb|tb|vcpu|core|cores|ms|%|x\b))/i;

const NUMBER_OR_CERT =
  /(\$\s?\d|\d+\s?(gb|tb|vcpu|cores?|ms|%|gbps|requests|sites?|hours?|days?|x\b)|\b(iso\s?27001|soc\s?2|pci[\s-]?dss|gdpr|hipaa|sama|nca|cscc|misa|99\.\d+%)\b)/i;

/**
 * Pull candidate factual claims (sentences) about Kloudbean from the markdown.
 * Strips code blocks, headings, and list markup first.
 */
export function extractClaims(markdown: string, max = 18): string[] {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+.*$/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>]/g, " ");
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.split(/\s+/).length >= 5 && s.split(/\s+/).length <= 60);

  const seen = new Set<string>();
  const claims: string[] = [];
  for (const s of sentences) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    const mentionsKb = /\bkloudbean\b/i.test(s);
    if (!mentionsKb) continue;
    // Prioritise sentences that assert a checkable fact.
    if (CLAIM_MARKERS.test(s) || NUMBER_OR_CERT.test(s)) {
      seen.add(key);
      claims.push(s);
    }
    if (claims.length >= max) break;
  }
  return claims;
}

type RawVerdict = { claim?: string; verdict?: string; reason?: string; fix?: string };

function parseVerdicts(raw: string): RawVerdict[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as RawVerdict[];
    if (Array.isArray((parsed as { claims?: unknown }).claims))
      return (parsed as { claims: RawVerdict[] }).claims;
  } catch {
    // try to salvage a JSON array substring
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        return JSON.parse(m[0]) as RawVerdict[];
      } catch {
        /* give up */
      }
    }
  }
  return [];
}

function normVerdict(v: string | undefined): ClaimVerdict {
  const s = (v ?? "").toLowerCase();
  if (s.startsWith("contradict")) return "contradicted";
  if (s.startsWith("support")) return "supported";
  return "unsupported";
}

const VERIFY_SYSTEM = `You are a meticulous fact-checker for Kloudbean (a managed cloud hosting platform). You are given LIVE KNOWLEDGE pulled from Kloudbean's own knowledge base, and a list of factual CLAIMS an article makes about Kloudbean.

For EACH claim, judge it strictly against the LIVE KNOWLEDGE only:
- "supported": the knowledge base confirms the claim (or it's a safe, generic truth clearly consistent with it).
- "unsupported": the knowledge base neither confirms nor denies it (no evidence either way).
- "contradicted": the knowledge base shows the claim is FALSE or inconsistent (wrong feature, wrong price, a compliance/cert Kloudbean doesn't hold, a provider/region it doesn't offer, an impossible guarantee).

Be conservative: only mark "supported" when there is real evidence. Do not invent facts beyond the supplied knowledge.

Return ONLY a JSON array, one object per claim that is "unsupported" or "contradicted" (omit "supported" claims). Each object:
{"claim": "<the claim text>", "verdict": "unsupported|contradicted", "reason": "<short, cite the KB>", "fix": "<concrete instruction to correct or soften the claim>"}
If every claim is supported, return [].`;

/**
 * Verify an article's Kloudbean claims against the RAG KB.
 * `groundingBlock` is the already-fetched RAG grounding (reused to save calls);
 * if empty, we fetch targeted KB context for the claims.
 */
export async function verifyClaims(
  markdown: string,
  model: LanguageModel,
  opts: { groundingBlock?: string; topic?: string; keyword?: string | null; geo?: string } = {},
): Promise<ClaimVerifyResult> {
  const log: string[] = [];
  const empty: ClaimVerifyResult = {
    ran: false,
    findings: [],
    contradicted: [],
    unsupported: [],
    blocking: false,
    sources: [],
    log,
  };

  if (!hasRagConfigured()) {
    log.push("claim-verify skipped: RAG disabled");
    return empty;
  }

  const claims = extractClaims(markdown);
  if (!claims.length) {
    log.push("claim-verify: no checkable Kloudbean claims found");
    return empty;
  }
  log.push(`claim-verify: ${claims.length} candidate claims`);

  // Build/augment grounding. Reuse the passed block; top it up with a
  // claim-focused KB question so we have evidence for the specific assertions.
  let grounding = (opts.groundingBlock ?? "").trim();
  const sources: { title: string; url: string }[] = [];
  try {
    const q = `What does Kloudbean actually offer regarding: ${claims
      .slice(0, 8)
      .join(" | ")
      .slice(
        0,
        600,
      )}? List exact features, plans/pricing, providers/regions, and compliance/certifications. State plainly what Kloudbean does NOT offer if relevant.`;
    const a = await askKloudbeanRag(q);
    if (a.ok && a.answer) {
      grounding = `${grounding}\n\nCLAIM-FOCUSED KB EVIDENCE:\n${a.answer.trim()}`.trim();
      for (const s of a.sources) if (s.url) sources.push({ title: s.title, url: s.url });
    }
  } catch (e) {
    log.push(`claim-verify KB fetch failed: ${String((e as Error)?.message ?? e)}`);
  }

  if (!grounding) {
    log.push("claim-verify skipped: no KB grounding available");
    return { ...empty, log };
  }

  let raw = "";
  try {
    const res = await generateText({
      model,
      system: VERIFY_SYSTEM,
      prompt: `LIVE KNOWLEDGE (Kloudbean KB):\n${grounding}\n\n---\nCLAIMS TO CHECK (one per line):\n${claims
        .map((c, i) => `${i + 1}. ${c}`)
        .join("\n")}\n\nReturn the JSON array now.`,
      temperature: 0,
      maxOutputTokens: 1500,
    });
    raw = res.text ?? "";
  } catch (e) {
    log.push(`claim-verify model call failed: ${String((e as Error)?.message ?? e)}`);
    return { ...empty, log };
  }

  const verdicts = parseVerdicts(raw)
    .filter((v) => v && typeof v.claim === "string" && v.claim.trim())
    .map<ClaimFinding>((v) => ({
      claim: String(v.claim).trim(),
      verdict: normVerdict(v.verdict),
      reason: String(v.reason ?? "").trim(),
      fix: String(v.fix ?? "").trim(),
    }))
    .filter((v) => v.verdict !== "supported");

  const contradicted = verdicts.filter((v) => v.verdict === "contradicted");
  const unsupported = verdicts.filter((v) => v.verdict === "unsupported");
  log.push(`claim-verify: ${contradicted.length} contradicted, ${unsupported.length} unsupported`);

  return {
    ran: true,
    findings: verdicts,
    contradicted,
    unsupported,
    blocking: contradicted.length > 0,
    sources,
    log,
  };
}

/** Turn claim findings into revision instructions for the editor pass. */
export function buildClaimFixInstructions(result: ClaimVerifyResult): string {
  if (!result.findings.length) return "";
  const lines: string[] = [];
  for (const f of result.contradicted) {
    lines.push(
      `FIX (mandatory — FALSE claim): "${f.claim}" — ${f.reason || "contradicted by Kloudbean KB"}. ${f.fix || "Correct it to match what Kloudbean actually offers, or remove it."}`,
    );
  }
  for (const f of result.unsupported) {
    lines.push(
      `Soften/verify unsupported claim: "${f.claim}" — ${f.reason || "not found in Kloudbean KB"}. ${f.fix || "Either ground it in a real Kloudbean fact or remove the specific assertion."}`,
    );
  }
  return lines.length
    ? `Fix these factual issues (checked against Kloudbean's knowledge base):\n- ${lines.join("\n- ")}`
    : "";
}
