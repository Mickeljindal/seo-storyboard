import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import { geoPolicyPromptBlock } from "./geo-provider-policy";
import { competitorContextForTopic } from "./competitors";
import { ragGroundingForTopic } from "./rag-client";
import { rewriteInternalLinksInMarkdown } from "./internal-links";
import { scoreContent, buildRevisionInstructions, type ScoreResult } from "./content-scorecard";
import { verifyClaims, buildClaimFixInstructions, type ClaimVerifyResult } from "./claim-verifier";

/**
 * MULTI-PASS CONTENT ENGINE — the "magical output" core.
 *
 * Pipeline per article:
 *   1. Ground: pull live Kloudbean facts from RAG KB + geo policy + competitor intel.
 *   2. Draft: write section-by-section from the brief outline (no single 8k cap).
 *   3. Stitch: assemble intro + sections + FAQ + CTA into one Markdown doc.
 *   4. Link: resolve [anchor](internal:slug) to REAL sibling articles.
 *   5. Score: deterministic scorecard (keyword, length, entities, banned claims…).
 *   6. Revise: if score < threshold or a banned claim exists, run an editor pass
 *      with targeted fixes — loop up to maxRevisions.
 *
 * Returns the final Markdown + score report. Caller persists it.
 */

export type ContentEngineOptions = {
  minScore?: number; // gate to stop revising (default 82)
  maxRevisions?: number; // editor passes (default 2)
  useRag?: boolean; // ground with live KB (default true)
  verifyClaims?: boolean; // RAG-grounded fact-check of Kloudbean claims (default = useRag)
  baseUrl?: string; // for internal link hrefs (e.g. https://kloudbean.com)
  humanize?: boolean; // run the human-voice polish pass (default true)
};

export type ContentEngineResult = {
  ok: boolean;
  markdown: string;
  score: ScoreResult;
  passes: number;
  internalLinks: { resolved: number; total: number };
  ragSources: { title: string; url: string }[];
  claims?: ClaimVerifyResult; // RAG-grounded fact-check report (when run)
  error?: string;
  log: string[];
};

/**
 * HUMAN VOICE STYLE GUIDE — injected into every writing pass.
 * This is what stops the output from reading like generic AI filler.
 */
const HUMAN_STYLE = `WRITE LIKE A HUMAN EXPERT, NOT AN AI. This is the most important rule.

VOICE:
- You are a senior cloud/DevOps engineer who has actually run these workloads, writing for a smart peer. Be direct, specific, and a little opinionated.
- Use second person ("you"), contractions ("you're", "it's", "don't"), and plain words.
- Lead with the concrete answer or the useful detail. Never warm up with throat-clearing.
- Bring lived-in detail: what you'd actually click, the gotcha nobody mentions, the number that matters. First-hand experience signals (E-E-A-T) beat generic explanation.

FORMAT — PROSE FIRST (critical, this is what stops it reading like AI):
- Write in FLOWING PARAGRAPHS. At least ~80% of the body must be real paragraphs of 3–5 sentences, not bullets.
- Use a bullet or numbered list ONLY when you're genuinely enumerating steps or discrete items — at most 1 short list per 2–3 H2 sections. Never turn explanation into bullets to pad.
- A comparison TABLE is allowed once, only when directly comparing options/competitors.
- Do NOT bold-label every paragraph (no "**Performance:** ..." pattern). That's an AI tell. Weave the point into the sentence.
- Don't end every section with a one-line takeaway. Just stop when the point is made.

BANNED AI-TELL PHRASES — never use any of these (or close variants):
"in today's digital landscape", "in the world of", "in the realm of", "when it comes to", "it's worth noting", "it's important to note", "needless to say", "moreover", "furthermore", "in conclusion", "in summary", "to sum up", "delve", "dive into", "embark", "leverage" (as a verb), "robust", "seamless", "seamlessly", "tailored", "ensure that", "navigate the", "unlock", "unleash", "elevate", "game-changer", "cutting-edge", "state-of-the-art", "harness", "empower", "streamline", "take it to the next level", "look no further", "rest assured", "the bottom line", "at the end of the day", "plethora", "myriad", "testament to", "in essence", "ultimately", "whether you're a beginner or", "this article will", "in this guide we will", "let's explore", "let's dive".

BANNED FORMULAIC PATTERNS (the biggest AI giveaways in 2026 — avoid all):
- "It's not just X, it's Y" / "This isn't just X — it's Y".
- "From X to Y, [something]" as a sentence opener.
- "Whether you're X or Y" constructions.
- Three-item rule-of-three lists in prose ("fast, secure, and scalable") more than once.
- Em-dash overuse — use them sparingly, not in every paragraph.
- Starting multiple sentences with "This" / "That" referring vaguely back.
- Rhetorical-question openers ("Ever wondered…?", "What if…?").

READABILITY (target ~grade 7–9):
- Vary sentence length hard. Mix 4-word sentences with 20-word ones. Never let three sentences in a row have the same rhythm.
- Prefer everyday words (use "use" not "utilize", "help" not "facilitate", "about" not "regarding").
- Concrete specifics over vague claims: real numbers, commands, product names, prices, steps.
- A short fragment for emphasis is fine. Starting a sentence with "And" or "But" is fine.

STRUCTURE:
- Don't restate the heading in the first sentence of a section.
- Don't start consecutive paragraphs with the same word.
- No meta-talk ("in this section", "as mentioned above").`;

const SECTION_SYSTEM = `You are the lead content writer for Kloudbean (kloudbean.com). You write ONE section of a larger SEO article at a time, in clean Markdown.

${KLOUDBEAN_PROMPT_CORE}

${HUMAN_STYLE}

Rules for the section you write:
- Write ONLY the requested section (its ## H2 and any ### H3s). Do not write the intro, other sections, the FAQ, or the conclusion.
- Open the section with a concrete fact, number, step, or example — not a definition of the heading.
- Be specific and Kloudbean-centric: name real products, features, setup steps, pricing language, and compliance facts from the supplied knowledge.
- Use the supplied GEO PROVIDER POLICY as the single source of truth for providers/regions. Never recommend a provider Kloudbean does not offer.
- Use the exact target keyword phrase verbatim at least once where it reads naturally.
- For links to OTHER Kloudbean topics, you MUST use the form [anchor](internal:slug-guess). NEVER write absolute https://kloudbean.com/... URLs yourself — the system resolves internal: links to real pages.
- Return Markdown for this section only — no preamble, no code fences.`;

const INTRO_SYSTEM = `You are the lead content writer for Kloudbean (kloudbean.com). Write the OPENING of an SEO article in Markdown.

${KLOUDBEAN_PROMPT_CORE}

${HUMAN_STYLE}

Write:
1. The # H1 — base it on the provided H1 but you MUST include the exact target keyword phrase verbatim in the H1. Keep it human, not stuffed.
2. A bold **TL;DR:** line that gives the actual answer in one sentence (what Kloudbean does for this, with a concrete detail).
3. 1–2 short intro paragraphs. Open with a real hook — a specific problem, number, or scenario the reader recognizes — not a definition or "in today's…". Name Kloudbean within the first 120 words and include the exact target keyword phrase verbatim within the first 100 words.
For links to other Kloudbean topics use [anchor](internal:slug) — never write absolute kloudbean.com URLs yourself.
Return Markdown only — no code fences, no other sections.`;

const EDITOR_SYSTEM = `You are a senior SEO editor for Kloudbean (kloudbean.com). You receive a full Markdown article and a list of required fixes. Apply ALL fixes while preserving correct content.

${KLOUDBEAN_PROMPT_CORE}

${HUMAN_STYLE}

Rules:
- Keep the article's structure and good parts; only change what's needed to satisfy the fixes.
- Rewrite any sentence that uses a banned AI-tell phrase so it sounds like a human expert.
- Enforce the GEO PROVIDER POLICY strictly. Remove or correct any provider Kloudbean does not offer, and any KSA provider that isn't GCP Dammam.
- Ensure the exact target keyword phrase appears in the H1 and within the first 100 words, and 2–4 times total, reading naturally.
- Internal links MUST be in the form [anchor](internal:slug). Convert any hand-written https://kloudbean.com/... internal links into [anchor](internal:slug) form. Keep external links as-is.
- Return the COMPLETE corrected article in Markdown only — no commentary, no code fences.`;

const POLISH_SYSTEM = `You are a top-tier human editor. You rewrite an AI-drafted article so no reader or AI-detector could tell it was machine-written, while keeping every fact, number, link, heading, and the overall structure intact.

${HUMAN_STYLE}

Your job:
- Rewrite for natural human rhythm: break up uniform sentences, cut filler, add concrete specifics already implied, and make transitions feel like a person wrote them in one sitting.
- CONVERT over-formatting to prose: if a section is mostly bullets or every paragraph starts with a bold label, rewrite it as flowing paragraphs. Keep at most one genuine list and at most one table in the whole article.
- Delete every banned AI-tell phrase and banned formulaic pattern, and any sentence that says nothing.
- Keep all Markdown headings (#, ##, ###), all [text](url) and [text](internal:slug) links, all real facts/numbers EXACTLY. Do not invent facts. Do not add providers Kloudbean doesn't offer.
- Keep the exact target keyword present in the H1 and early in the intro.
- Keep roughly the same length (do not shorten by more than ~10%).
- Return the COMPLETE rewritten article in Markdown only — no commentary, no code fences.`;

const EXPAND_SYSTEM = `You are a senior technical writer expanding an article to its target length with REAL substance.

${HUMAN_STYLE}

Rules:
- Add depth only where it helps: concrete steps, a realistic scenario, a specific example, an extra FAQ answer, a comparison point, a gotcha. Written as flowing paragraphs.
- NEVER pad with filler, repetition, restated points, or AI-tell phrases. If you can't add real value, don't add words.
- Preserve every existing heading, link, table, and fact. You may add new ## H2 or ### H3 sections if it reads naturally.
- Keep the exact target keyword in the H1 and intro.
- Return the COMPLETE expanded article in Markdown only — no commentary, no code fences.`;

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function wordsIn(s: string): number {
  return (s.trim().match(/\b[\w'-]+\b/g) ?? []).length;
}

type BriefOutlineH2 = {
  h2?: string;
  description?: string;
  h3?: { title?: string; description?: string }[];
};

export async function runContentEngine(
  article: Record<string, unknown>,
  options: ContentEngineOptions = {},
): Promise<ContentEngineResult> {
  const log: string[] = [];
  const minScore = options.minScore ?? 82;
  const maxRevisions = options.maxRevisions ?? 2;
  const useRag = options.useRag !== false;
  const doVerifyClaims = options.verifyClaims ?? useRag;

  const brief = (article.brief ?? {}) as Record<string, unknown>;
  const geo = String(article.geo_target ?? "sa");
  const title = String(brief.h1 ?? article.title ?? "");
  const keyword = String(article.target_keyword ?? brief.target_keyword ?? "");
  const wordTarget = (brief.word_count as number) ?? (article.word_count_target as number) ?? 2200;
  const outline = Array.isArray(brief.outline) ? (brief.outline as BriefOutlineH2[]) : [];
  const faq = Array.isArray(brief.faq) ? (brief.faq as { q?: string; a?: string }[]) : [];

  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return emptyResult(`AI not configured: ${String((e as Error)?.message ?? e)}`);
  }

  // 1. Grounding context (shared across passes)
  const geoBlock = geoPolicyPromptBlock(geo);
  const competitorBlock = competitorContextForTopic(
    `${title} ${keyword}`,
    String(article.competitor_domain ?? ""),
  );
  let ragBlock = "";
  let ragSources: { title: string; url: string }[] = [];
  if (useRag) {
    try {
      const g = await ragGroundingForTopic(title, keyword, geo);
      ragBlock = g.block;
      ragSources = g.sources.map((s) => ({ title: s.title, url: s.url }));
      log.push(`RAG grounding: ${ragSources.length} sources`);
    } catch (e) {
      log.push(`RAG grounding skipped: ${String((e as Error)?.message ?? e)}`);
    }
  }

  const grounding = [geoBlock, competitorBlock, ragBlock].filter(Boolean).join("\n\n");

  // 2. Draft section-by-section
  const sectionCount = outline.length || 6;
  const perSectionWords = Math.max(280, Math.round((wordTarget * 0.82) / sectionCount));

  let intro = "";
  try {
    intro = stripFences(
      (
        await generateText({
          model,
          system: INTRO_SYSTEM,
          prompt: `H1 basis: ${title}\nEXACT TARGET KEYWORD (must appear verbatim in the H1 and in the first 100 words): "${keyword}"\nGeo: ${geo}\nKloudbean angle: ${brief.kloudbean_angle ?? "managed multi-cloud + bundled DevOps stack"}\n\n${grounding}`,
          temperature: 0.8,
          maxOutputTokens: 900,
        })
      ).text,
    );
  } catch (e) {
    return emptyResult(`Intro generation failed: ${String((e as Error)?.message ?? e)}`);
  }

  const sections: string[] = [];
  if (outline.length) {
    // Write sections with limited concurrency to keep ordering + rate limits sane.
    for (let i = 0; i < outline.length; i++) {
      const h2 = outline[i];
      const h3List = Array.isArray(h2.h3)
        ? h2.h3.map((h) => `### ${h.title}${h.description ? ` — ${h.description}` : ""}`).join("\n")
        : "";
      const prompt = `Article H1: ${title}
Target keyword: ${keyword}
Geo: ${geo}
Write THIS section only (target ${perSectionWords}–${perSectionWords + 120} words, mostly flowing paragraphs):
## ${h2.h2}
${h2.description ? `Section intent: ${h2.description}` : ""}
${h3List ? `Subsections to cover:\n${h3List}` : ""}

${grounding}`;
      try {
        const txt = stripFences(
          (
            await generateText({
              model,
              system: SECTION_SYSTEM,
              prompt,
              temperature: 0.8,
              maxOutputTokens: 1800,
            })
          ).text,
        );
        sections.push(txt);
        log.push(`section ${i + 1}/${outline.length}: ${h2.h2} (${wordsIn(txt)} words)`);
      } catch (e) {
        log.push(`section ${i + 1} failed: ${String((e as Error)?.message ?? e)}`);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  } else {
    // No outline → fall back to one fuller pass.
    try {
      const txt = stripFences(
        (
          await generateText({
            model,
            system: SECTION_SYSTEM,
            prompt: `Write the full body (~${wordTarget} words) for "${title}" (keyword: ${keyword}, geo: ${geo}). Use multiple ## H2 sections.\n\n${grounding}`,
            temperature: 0.8,
            maxOutputTokens: 6000,
          })
        ).text,
      );
      sections.push(txt);
    } catch (e) {
      return emptyResult(`Body generation failed: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // 3. FAQ + CTA
  let faqBlock = "";
  if (faq.length) {
    faqBlock = "## FAQ\n\n" + faq.map((f) => `### ${f.q ?? ""}\n\n${f.a ?? ""}`).join("\n\n");
  }

  // 3b. Related guides — REAL sibling articles (guarantees a working authority mesh).
  let relatedBlock = "";
  try {
    const { buildLinkIndex } = await import("./internal-links");
    const index = await buildLinkIndex(String(article.id), geo);
    const clusterId = (article.cluster_id as number) ?? null;
    // Prefer same-cluster siblings, then fall back to any, prefer published.
    const ranked = index
      .map((c) => ({
        c,
        score: (c.clusterId === clusterId ? 2 : 0) + (c.publishedUrl ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.c);
    if (ranked.length) {
      relatedBlock =
        "## Related Kloudbean guides\n\n" +
        ranked.map((c) => `- [${c.title}](internal:${c.slug})`).join("\n");
    }
  } catch (e) {
    log.push(`related links skipped: ${String((e as Error)?.message ?? e)}`);
  }

  const ctaText = String(brief.cta ?? "Start your free Kloudbean trial");
  const ctaUrl = String(brief.cta_url ?? "https://kloudbean.com");
  const ctaBlock = `## Get started with Kloudbean\n\n${ctaText} — [${ctaText}](${ctaUrl}).`;

  let markdown = [intro, ...sections, faqBlock, relatedBlock, ctaBlock]
    .filter(Boolean)
    .join("\n\n");

  // 3c. Length floor — if under target, expand the thinnest sections with real
  // substance (not filler) so a "2000-word" article actually lands near 2000.
  const minWords = Math.round(wordTarget * 0.9);
  if (wordsIn(markdown) < minWords) {
    try {
      const expanded = stripFences(
        (
          await generateText({
            model,
            system: EXPAND_SYSTEM,
            prompt: `Target length: at least ${wordTarget} words (currently ${wordsIn(markdown)}). Add depth to the THINNEST sections — concrete steps, real examples, specifics, a short scenario, an extra FAQ answer. Do NOT add filler, repetition, or AI-tell phrases. Keep all headings, links, tables, and facts.\n\nTarget keyword (keep verbatim in H1 + intro): "${keyword}"\n\nARTICLE:\n\n${markdown}`,
            temperature: 0.8,
            maxOutputTokens: 9000,
          })
        ).text,
      );
      if (wordsIn(expanded) > wordsIn(markdown)) {
        markdown = expanded;
        log.push(`length expand: → ${wordsIn(markdown)} words`);
      }
    } catch (e) {
      log.push(`expand pass failed: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // 3c. Humanization polish pass — rewrite the whole draft in a natural human
  // voice (kills AI-tell phrasing, fixes rhythm/readability) while preserving
  // facts, headings, links, and tables.
  if (options.humanize !== false) {
    try {
      const polished = stripFences(
        (
          await generateText({
            model,
            system: POLISH_SYSTEM,
            prompt: `Target keyword (keep verbatim in H1 + early): "${keyword}"\nGeo: ${geo}\n\nREWRITE THIS ARTICLE:\n\n${markdown}`,
            temperature: 0.85,
            maxOutputTokens: 8000,
          })
        ).text,
      );
      if (polished && polished.length > markdown.length * 0.6) {
        markdown = polished;
        log.push("humanization polish pass applied");
      } else {
        log.push("polish pass skipped (output too short)");
      }
    } catch (e) {
      log.push(`polish pass failed: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // 4. Resolve internal links to real articles
  const linkRes = await rewriteInternalLinksInMarkdown(
    markdown,
    String(article.id),
    (article.cluster_id as number) ?? null,
    geo,
    { dropUnresolved: false, baseUrl: options.baseUrl },
  );
  markdown = linkRes.markdown;
  const totalLinks = linkRes.resolved + linkRes.unresolved;
  log.push(`internal links: ${linkRes.resolved}/${totalLinks} resolved`);

  // 5. Score
  let score = scoreContent({
    markdown,
    targetKeyword: keyword,
    secondaryKeywords: (article.secondary_keywords as string[]) ?? [],
    brief,
    geo,
    wordCountTarget: wordTarget,
    internalLinks: { resolved: linkRes.resolved, total: totalLinks },
  });
  log.push(`pass 0 score: ${score.score} (${score.grade})`);

  // 6. Auto-revise loop
  let passes = 0;
  while ((score.score < minScore || score.blocking) && passes < maxRevisions) {
    passes++;
    const instructions = buildRevisionInstructions(score, {
      markdown,
      targetKeyword: keyword,
      brief,
      geo,
      wordCountTarget: wordTarget,
    });
    if (!instructions) break;
    try {
      const revised = stripFences(
        (
          await generateText({
            model,
            system: EDITOR_SYSTEM,
            prompt: `${grounding}\n\n${instructions}\n\n---\nARTICLE TO REVISE:\n\n${markdown}`,
            temperature: 0.7,
            maxOutputTokens: 8000,
          })
        ).text,
      );
      if (revised && revised.length > 200) {
        const reLink = await rewriteInternalLinksInMarkdown(
          revised,
          String(article.id),
          (article.cluster_id as number) ?? null,
          geo,
          { dropUnresolved: false, baseUrl: options.baseUrl },
        );
        markdown = reLink.markdown;
        const reTotal = reLink.resolved + reLink.unresolved;
        score = scoreContent({
          markdown,
          targetKeyword: keyword,
          secondaryKeywords: (article.secondary_keywords as string[]) ?? [],
          brief,
          geo,
          wordCountTarget: wordTarget,
          internalLinks: { resolved: reLink.resolved, total: reTotal },
        });
        linkRes.resolved = reLink.resolved;
        linkRes.unresolved = reLink.unresolved;
        log.push(`pass ${passes} score: ${score.score} (${score.grade})`);
      }
    } catch (e) {
      log.push(`revise pass ${passes} failed: ${String((e as Error)?.message ?? e)}`);
      break;
    }
  }

  // 7. RAG-grounded claim verification (catch invented product facts)
  let claims: ClaimVerifyResult | undefined;
  if (doVerifyClaims) {
    try {
      claims = await verifyClaims(markdown, model, {
        groundingBlock: ragBlock,
        topic: title,
        keyword,
        geo,
      });
      log.push(...claims.log);
      if (claims.findings.length) {
        const claimFixes = buildClaimFixInstructions(claims);
        if (claimFixes) {
          passes++;
          const revised = stripFences(
            (
              await generateText({
                model,
                system: EDITOR_SYSTEM,
                prompt: `${grounding}\n\n${claimFixes}\n\n---\nARTICLE TO REVISE:\n\n${markdown}`,
                temperature: 0.5,
                maxOutputTokens: 8000,
              })
            ).text,
          );
          if (revised && revised.length > 200) {
            const reLink = await rewriteInternalLinksInMarkdown(
              revised,
              String(article.id),
              (article.cluster_id as number) ?? null,
              geo,
              { dropUnresolved: false, baseUrl: options.baseUrl },
            );
            markdown = reLink.markdown;
            linkRes.resolved = reLink.resolved;
            linkRes.unresolved = reLink.unresolved;
            score = scoreContent({
              markdown,
              targetKeyword: keyword,
              secondaryKeywords: (article.secondary_keywords as string[]) ?? [],
              brief,
              geo,
              wordCountTarget: wordTarget,
              internalLinks: {
                resolved: reLink.resolved,
                total: reLink.resolved + reLink.unresolved,
              },
            });
            log.push(`claim-fix pass ${passes} score: ${score.score} (${score.grade})`);
            // Re-verify once to confirm contradictions were resolved.
            claims = await verifyClaims(markdown, model, {
              groundingBlock: ragBlock,
              topic: title,
              keyword,
              geo,
            });
            log.push(...claims.log);
          }
        }
      }
      // A contradicted product claim is as serious as a banned claim.
      if (claims.blocking) {
        score = { ...score, blocking: true };
        if (!score.bannedClaims.some((b) => b.startsWith("Unverified claim"))) {
          score = {
            ...score,
            bannedClaims: [
              ...score.bannedClaims,
              ...claims.contradicted.map((c) => `Unverified claim contradicted by KB: ${c.claim}`),
            ],
            summary: `BLOCKED: ${claims.contradicted.length} claim(s) contradict the Kloudbean KB and must be fixed.`,
          };
        }
      }
    } catch (e) {
      log.push(`claim-verify skipped: ${String((e as Error)?.message ?? e)}`);
    }
  }

  return {
    ok: true,
    markdown,
    score,
    passes,
    internalLinks: { resolved: linkRes.resolved, total: linkRes.resolved + linkRes.unresolved },
    ragSources,
    claims,
    log,
  };
}

function emptyResult(error: string): ContentEngineResult {
  return {
    ok: false,
    markdown: "",
    score: {
      score: 0,
      grade: "F",
      checks: [],
      bannedClaims: [],
      blocking: true,
      summary: error,
    },
    passes: 0,
    internalLinks: { resolved: 0, total: 0 },
    ragSources: [],
    error,
    log: [error],
  };
}
