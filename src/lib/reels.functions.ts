import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * REELS STUDIO server functions: discover short-video ideas from the knowledge
 * graph, generate full scripts + Sora/Veo/AI-Studio prompts, and manage them.
 */

export const discoverReelIdeasFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ limit: z.number().min(1).max(40).default(12) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { discoverReelIdeas } = await import("./reel-engine");
    const reelsRepo = await import("@/server/db/repos/reels");

    const existing = await reelsRepo.listReelTitles();
    const ideas = (await discoverReelIdeas(data.limit + 6)).filter(
      (i) => !existing.has(i.title.trim().toLowerCase()),
    );

    const saved = await reelsRepo.insertReels(
      ideas.slice(0, data.limit).map((i) => ({
        title: i.title,
        topic: i.topic,
        format: i.format,
        status: "idea",
        cluster_id: i.cluster_id ?? null,
        idea_data: i,
        engine_source: "reel-idea-bringer",
      })),
    );

    return { ok: true, saved: saved.length, ideas: ideas.slice(0, data.limit) };
  });

export async function generateReelInternal(
  reelId: string,
): Promise<{ ok: boolean; error?: string }> {
  const reelsRepo = await import("@/server/db/repos/reels");
  const reel = await reelsRepo.getReelById(reelId);
  if (!reel) return { ok: false, error: "Reel not found" };

  const idea = (reel.idea_data ?? {}) as Record<string, unknown>;
  const { generateReel } = await import("./reel-engine");
  const result = await generateReel({
    title: reel.title,
    topic: reel.topic ?? (idea.topic as string) ?? reel.title,
    format: (reel.format as never) ?? "explainer",
    angle:
      (idea.angle as string) ?? "Educational explainer that resolves to hosting it on Kloudbean.",
    cluster_id: reel.cluster_id,
    source: (idea.source as string) ?? "manual",
  });

  if (!result.ok) {
    await reelsRepo.updateReel(reelId, {
      status: "idea",
      notes: result.error ?? "generation failed",
    });
    return { ok: false, error: result.error };
  }

  await reelsRepo.updateReel(reelId, {
    status: "scripted",
    hook: result.hook,
    hook_variations: result.hook_variations,
    script: result.script,
    voiceover: result.voiceover,
    caption: result.caption,
    hashtags: result.hashtags,
    cta: result.cta,
    duration_seconds: result.duration_seconds,
    platform_prompts: result.platform_prompts,
  });
  return { ok: true };
}

export const generateReelFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ reelId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await generateReelInternal(data.reelId);
    if (!r.ok) throw new Error(r.error ?? "Reel generation failed");
    return r;
  });

/** Quick manual add of a reel idea by title + format. */
export const addReelFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(3).max(160),
      topic: z.string().max(120).optional(),
      format: z
        .enum([
          "explainer",
          "educational",
          "how_it_works",
          "viral",
          "comparison",
          "listicle",
          "myth_bust",
          "tutorial",
        ])
        .default("explainer"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const reelsRepo = await import("@/server/db/repos/reels");
    const reel = await reelsRepo.insertReel({
      title: data.title.trim(),
      topic: data.topic?.trim() || data.title.trim(),
      format: data.format,
      status: "idea",
      idea_data: {
        title: data.title.trim(),
        topic: data.topic?.trim() || data.title.trim(),
        format: data.format,
        angle: "Educational explainer that resolves to hosting it on Kloudbean.",
        source: "manual",
      },
      engine_source: "manual-add",
    });
    return { ok: true, reel };
  });

export const markReelStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      reelId: z.string().uuid(),
      status: z.enum(["idea", "scripted", "ready", "published"]),
    }).parse,
  )
  .handler(async ({ data }) => {
    const reelsRepo = await import("@/server/db/repos/reels");
    await reelsRepo.updateReel(data.reelId, { status: data.status });
    return { ok: true };
  });

export const listReelsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      status: z.string().optional(),
      format: z.string().optional(),
      limit: z.number().min(1).max(300).default(200),
    }).parse,
  )
  .handler(async ({ data }) => {
    const reelsRepo = await import("@/server/db/repos/reels");
    const items = await reelsRepo.listReels({
      status: data.status,
      format: data.format,
      limit: data.limit,
    });
    const total = await reelsRepo.countReels();
    return { ok: true, total, items };
  });

export const reelsStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hasAiCredentials } = await import("./ai-provider");
  return { aiReady: hasAiCredentials() };
});
