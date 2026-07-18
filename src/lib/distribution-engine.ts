import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";

/**
 * DISTRIBUTION ENGINE — turns a published article into ready-to-post social +
 * newsletter drafts. Every article should be distributed, not just published
 * and left to sit; this generates the drafts, a human still reviews/posts them
 * (no auto-posting — that needs real social API credentials + is genuinely
 * risky to automate without a human check).
 */

export type LinkedInDraft = { post: string; hashtags: string[] };
export type XThreadDraft = { tweets: string[] };
export type NewsletterDraft = { subject: string; preview: string; body: string };

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJson<T>(raw: string): T | null {
  const s = stripFences(raw);
  try {
    return JSON.parse(s) as T;
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(s.slice(a, b + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const DISTRIBUTION_SYSTEM = `You are Kloudbean's social + email distribution writer. You take one published article and produce short-form distribution drafts for three channels. Return STRICT JSON only, no prose, no code fences.

${KLOUDBEAN_PROMPT_CORE}

RULES:
- Never invent facts not in the article summary provided. If unsure, keep it general.
- No AI-tell phrases ("in today's landscape", "game-changer", "unlock", etc). Write like a founder/engineer who actually wrote the piece, sharing it because it's genuinely useful.
- LinkedIn: 80-150 words, one clear insight from the article as the hook, a soft mention of Kloudbean (not salesy), ends with a link placeholder [ARTICLE_URL]. 3-5 relevant hashtags, no more.
- X thread: 4-6 tweets, each under 260 characters. Tweet 1 is the hook (no link). Last tweet includes [ARTICLE_URL]. Punchy, one idea per tweet.
- Newsletter: a short blurb (60-100 words) for a "what we published this week" section — subject line variant, a one-line preview text, and the body paragraph. Ends by inviting the reader to read the full piece at [ARTICLE_URL].

Return JSON exactly in this shape:
{
  "linkedin": { "post": "…", "hashtags": ["…", "…"] },
  "x_thread": { "tweets": ["…", "…", "…"] },
  "newsletter": { "subject": "…", "preview": "…", "body": "…" }
}`;

export type DistributionResult = {
  ok: boolean;
  linkedin?: LinkedInDraft;
  x_thread?: XThreadDraft;
  newsletter?: NewsletterDraft;
  error?: string;
};

/** Generate all three distribution drafts from an article's title + summary + URL. */
export async function generateDistribution(input: {
  title: string;
  summary: string; // tldr/meta_description — keep the prompt small & cheap
  keyTakeaways?: string[];
  url: string;
}): Promise<DistributionResult> {
  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return { ok: false, error: `AI not configured: ${String((e as Error)?.message ?? e)}` };
  }

  const prompt = `Article title: ${input.title}
Summary: ${input.summary}
${input.keyTakeaways?.length ? `Key takeaways:\n${input.keyTakeaways.map((k) => `- ${k}`).join("\n")}` : ""}
Article URL (use literally as [ARTICLE_URL]): ${input.url}`;

  try {
    const resp = await generateText({
      model,
      system: DISTRIBUTION_SYSTEM,
      prompt,
      temperature: 0.8,
      maxOutputTokens: 1200,
    });
    const parsed = extractJson<{
      linkedin?: LinkedInDraft;
      x_thread?: XThreadDraft;
      newsletter?: NewsletterDraft;
    }>(resp.text);
    if (!parsed)
      return { ok: false, error: "Could not parse distribution drafts from AI response." };

    // Replace the [ARTICLE_URL] placeholder with the real URL everywhere.
    const withUrl = (s: string) => s.replaceAll("[ARTICLE_URL]", input.url);
    const linkedin = parsed.linkedin
      ? { post: withUrl(parsed.linkedin.post), hashtags: parsed.linkedin.hashtags ?? [] }
      : undefined;
    const xThread = parsed.x_thread
      ? { tweets: (parsed.x_thread.tweets ?? []).map(withUrl) }
      : undefined;
    const newsletter = parsed.newsletter
      ? {
          subject: parsed.newsletter.subject,
          preview: parsed.newsletter.preview,
          body: withUrl(parsed.newsletter.body),
        }
      : undefined;

    return { ok: true, linkedin, x_thread: xThread, newsletter };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}
