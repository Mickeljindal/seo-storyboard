import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * IN-APP AI ASSISTANT — answers questions about how to use this platform,
 * grounded in the portal Help KB (retrieveKb) plus live engine stats so it can
 * answer both "how do I…" and "what's my current state" questions.
 */

const askSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(12)
    .default([]),
});

async function liveStats(): Promise<string> {
  const parts: string[] = [];
  try {
    const articles = await import("@/server/db/repos/articles");
    parts.push(`articles: ${await articles.countArticles()}`);
  } catch {
    /* optional */
  }
  try {
    const tools = await import("@/server/db/repos/tools");
    const all = await tools.listTools({ limit: 1000 });
    const live = all.filter((t) => t.status === "published" || t.status === "optimized").length;
    const gated = all.filter((t) => t.gate_enabled === "yes").length;
    parts.push(`tools: ${all.length} (${live} live, ${gated} gated)`);
  } catch {
    /* optional */
  }
  try {
    const reels = await import("@/server/db/repos/reels");
    parts.push(`reels: ${await reels.countReels()}`);
  } catch {
    /* optional */
  }
  try {
    const kg = await import("@/server/db/repos/knowledge-graph");
    parts.push(
      `knowledge graph: ${await kg.countNodes()} entities, ${await kg.countEdges()} links`,
    );
  } catch {
    /* optional */
  }
  return parts.length ? `CURRENT ENGINE STATE — ${parts.join(" · ")}.` : "";
}

export const askPortalAssistantFn = createServerFn({ method: "POST" })
  .inputValidator(askSchema.parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();

    const { retrieveKb } = await import("./portal-kb");
    const hits = retrieveKb(data.message, 4);
    const context = hits
      .map((h, i) => `[#${i + 1}] ${h.article.title}\n${h.article.body}`)
      .join("\n\n---\n\n");
    const stats = await liveStats();

    const { hasAiCredentials, createAiProvider } = await import("./ai-provider");
    if (!hasAiCredentials()) {
      // Graceful fallback: answer straight from the KB snippet.
      const top = hits[0];
      return {
        ok: true,
        answer: top
          ? `${top.snippet}\n\n(Open the Help tab for the full "${top.article.title}" article. Set an AI key in .env for richer answers.)`
          : "I couldn't find that in the docs. Open the Help tab to browse all topics. (Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env to enable full AI answers.)",
        sources: hits.map((h) => ({ id: h.article.id, title: h.article.title })),
      };
    }

    const { generateText } = await import("ai");
    const model = createAiProvider();

    const historyText = data.history
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const system = `You are the in-app assistant for the Kloudbean SEO Engine — an autonomous content/SEO platform (the internal tool the user is currently using, NOT the Kloudbean hosting product).

RULES:
- Answer ONLY about how to use this platform: articles, tool pages, the signup gate, the knowledge graph, Reels Studio, autopilot, settings/.env, and troubleshooting.
- Ground every answer in the DOCS CONTEXT provided. If the docs don't cover it, say so briefly and point to the Help tab — do not invent features.
- Be concise and practical. Use short steps. When relevant, name the exact tab to click (e.g. "Tool Pages → Sync from WordPress").
- If the user asks about their current numbers, use the ENGINE STATE line.
- Never output secrets or make up env values.`;

    const prompt = `${stats ? stats + "\n\n" : ""}DOCS CONTEXT:\n${context || "(no matching docs)"}\n\n${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ""}User question: ${data.message}\n\nAnswer:`;

    try {
      const { text } = await generateText({
        model,
        system,
        prompt,
        temperature: 0.3,
        maxOutputTokens: 700,
      });
      return {
        ok: true,
        answer: text.trim(),
        sources: hits.map((h) => ({ id: h.article.id, title: h.article.title })),
      };
    } catch (e) {
      return {
        ok: false,
        answer: `Sorry — I hit an error reaching the AI provider: ${String((e as Error)?.message ?? e)}. You can still browse the Help tab.`,
        sources: hits.map((h) => ({ id: h.article.id, title: h.article.title })),
      };
    }
  });

/** Full KB grouped by category — for the Help/Docs page. */
export const listKbFn = createServerFn({ method: "GET" }).handler(async () => {
  const { PORTAL_KB } = await import("./portal-kb");
  return { articles: PORTAL_KB };
});
