import "@tanstack/react-start/server-only";

/**
 * REDDIT REPLY DRAFTER — writes the comment a human then reads, edits, and posts.
 *
 * The hard part of replying on Reddit is not the prose, it is the restraint. So
 * the rules below are enforced in code rather than trusted to a prompt:
 *
 *   - The answer has to stand alone. If the reader takes nothing but the comment,
 *     they should still be able to fix their problem. A comment that only says
 *     "we wrote about this, here is a link" is the thing everyone hates.
 *   - A link is only ever appended where the community allows it. In a subreddit
 *     whose rules say no self-promotion, the drafter strips the URL and the
 *     affiliation pitch entirely and returns the answer alone.
 *   - Affiliation is disclosed whenever a link is included. Undisclosed vendor
 *     comments are the fastest route to a domain-wide ban.
 *   - Product facts come from the same grounding the article writer uses (the
 *     support KB and the RAG). If neither is available the draft stays generic
 *     rather than inventing a capability.
 */

export type DraftInput = {
  title: string;
  body: string;
  subreddit: string;
  selfPromoAllowed: string; // yes | limited | no | unknown
  matchedArticleSlugs: string[];
  matchedTerms: string[];
  intent: string | null;
};

export type DraftResult = {
  ok: boolean;
  draft: string;
  grounded: boolean;
  includesLink: boolean;
  error?: string;
};

const BLOG = "https://www.kloudbean.com/blog";

/** Never link in these, whatever the scoring says. */
function linkAllowed(selfPromoAllowed: string): boolean {
  return selfPromoAllowed === "yes" || selfPromoAllowed === "limited";
}

/**
 * Strip anything that reads as a pitch. Used for the no-self-promo case, where
 * the only acceptable comment is a straight answer.
 */
function stripPromotion(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/kloudbean|kloudbeansite|we (?:wrote|built|offer)|our (?:platform|guide|article)/i.test(line))
    .join("\n")
    .replace(/https?:\/\/\S*kloudbean\S*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SYSTEM = `You are an experienced infrastructure engineer answering a question on Reddit. You work at Kloudbean, a managed cloud hosting platform.

HOW TO WRITE:
- Answer the actual question, concretely and completely. Assume the reader will never click anything.
- Lead with the diagnosis, not the fix list: tell them how to tell which case they are in.
- Be specific: name the real error string, the real command, the real config line.
- Short paragraphs. No headings, no bullet-point walls, no bold text. Reddit prose, not a blog post.
- PLAIN ENGLISH. Short sentences. Use the simple word over the clever one. A tired developer at 2am should get it on one read.
- No marketing language. No "game-changer", no "unlock", no "in today's landscape".
- If the honest answer is that their current setup is fine, say that.
- Never invent a Kloudbean feature, price, or benchmark. If you are unsure what the product does, do not mention the product.
- Never claim personal experience of a specific customer or incident.
- 120 to 220 words. Anything longer does not get read.

Return the comment text only. No preamble, no quotes, no markdown headings.`;

/**
 * Build the reply. Uses the article library for a genuinely relevant link, the
 * support KB / RAG for product accuracy, and an LLM only for the prose.
 */
export async function draftRedditReply(input: DraftInput): Promise<DraftResult> {
  const allowLink = linkAllowed(input.selfPromoAllowed);

  // Product grounding, exactly as the article writer gets it.
  let grounding = "";
  let grounded = false;
  try {
    const topic = `${input.title} ${input.matchedTerms.join(" ")}`;
    const { getSupportKnowledgeContext } = await import("./support-kb");
    const kb = await getSupportKnowledgeContext(2200, topic);
    if (kb?.trim()) {
      grounding += `\n\n${kb}`;
      grounded = true;
    }
  } catch {
    /* grounding is best-effort; the draft simply stays generic */
  }
  if (!grounded) {
    try {
      const { ragGroundingForTopic } = await import("./rag-client");
      const rag = await ragGroundingForTopic(input.title, input.matchedTerms[0] ?? null, "global", 2000);
      if (rag.block?.trim()) {
        grounding += `\n\n${rag.block}`;
        grounded = true;
      }
    } catch {
      /* same */
    }
  }

  const linkLine = allowLink && input.matchedArticleSlugs[0]
    ? `\n\nIf a link is appropriate, the single most relevant one is ${BLOG}/${input.matchedArticleSlugs[0]}/ — include it ONCE at the end, in parentheses, and disclose that you work at Kloudbean. If the answer above is already complete, leave the link out.`
    : `\n\nDo NOT include any link and do NOT mention Kloudbean: this subreddit does not permit self-promotion. Answer only.`;

  let model;
  try {
    const { createAiProvider } = await import("./ai-provider");
    model = createAiProvider();
  } catch (e) {
    return { ok: false, draft: "", grounded, includesLink: false, error: `AI not configured: ${String((e as Error)?.message ?? e)}` };
  }

  const prompt = `Subreddit: r/${input.subreddit}
Self-promotion policy for this subreddit: ${input.selfPromoAllowed}
Thread intent: ${input.intent ?? "unknown"}

Title: ${input.title}

Post body:
${(input.body || "(no body: title-only post)").slice(0, 2500)}

Terms that matched our knowledge: ${input.matchedTerms.join(", ") || "none"}${linkLine}${grounding}`;

  try {
    const { generateText } = await import("ai");
    const resp = await generateText({
      model,
      system: SYSTEM,
      prompt,
      temperature: 0.6,
      maxOutputTokens: 600,
    });
    let draft = (resp.text ?? "").trim();
    if (!draft) return { ok: false, draft: "", grounded, includesLink: false, error: "Empty draft" };

    // Enforce the no-promo rule in code, not just in the prompt.
    if (!allowLink) draft = stripPromotion(draft);

    const includesLink = /https?:\/\/\S*kloudbean/i.test(draft);
    // If a link slipped in, it must carry a disclosure.
    if (includesLink && !/i work at kloudbean|i'm at kloudbean|disclosure/i.test(draft)) {
      draft = `${draft}\n\n(Disclosure: I work at Kloudbean.)`;
    }

    return { ok: true, draft, grounded, includesLink };
  } catch (e) {
    return { ok: false, draft: "", grounded, includesLink: false, error: String((e as Error)?.message ?? e) };
  }
}
