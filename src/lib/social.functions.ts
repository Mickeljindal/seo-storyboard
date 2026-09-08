import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * SOCIAL PUBLISHING server functions: manage connected channels, compose +
 * schedule posts, and publish them across every channel. The scheduler is
 * started lazily the first time any of these run.
 */

async function boot() {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { ensureSocialScheduler } = await import("./social-scheduler");
  ensureSocialScheduler();
}

const PLATFORMS = ["linkedin", "x", "facebook", "instagram", "threads", "mastodon", "webhook"] as const;

export const listSocialChannelsFn = createServerFn({ method: "GET" }).handler(async () => {
  await boot();
  const repo = await import("@/server/db/repos/social");
  const rows = await repo.listChannels();
  const { autopostArmed } = await import("./social-publisher");
  return {
    ok: true,
    armed: autopostArmed(),
    channels: rows.map((c) => ({
      id: c.id,
      platform: c.platform,
      label: c.label,
      mode: c.mode,
      hasWebhook: !!c.webhookUrl,
      hasToken: !!c.apiToken,
      meta: (c.meta ?? {}) as Record<string, string>,
      persona: c.persona ?? "",
      enabled: c.enabled,
      lastOkAt: c.lastOkAt ? c.lastOkAt.toISOString() : null,
      lastError: c.lastError,
    })),
  };
});

/** Per-platform connect requirements (token label + which ids to collect). */
export const getSocialProviderFieldsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { NATIVE_FIELDS } = await import("./social-native");
  return { ok: true, fields: NATIVE_FIELDS };
});

export const saveSocialChannelFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      platform: z.enum(PLATFORMS),
      label: z.string().min(1).max(60),
      mode: z.enum(["api", "webhook"]).default("api"),
      webhookUrl: z.string().url().max(500).optional().or(z.literal("")),
      apiToken: z.string().max(4000).optional().or(z.literal("")),
      meta: z.record(z.string(), z.string()).optional(),
      persona: z.string().max(280).optional().or(z.literal("")),
      enabled: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/social");
    const patch = {
      platform: data.platform,
      label: data.label,
      mode: data.mode,
      webhookUrl: data.webhookUrl ? data.webhookUrl : null,
      apiToken: data.apiToken ? data.apiToken : null,
      meta: data.meta ?? null,
      persona: data.persona ? data.persona : null,
      enabled: data.enabled,
    };
    if (data.id) {
      await repo.updateChannel(data.id, patch);
      return { ok: true, id: data.id };
    }
    const row = await repo.createChannel(patch);
    return { ok: true, id: row.id };
  });

export const deleteSocialChannelFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/social");
    await repo.deleteChannel(data.id);
    return { ok: true };
  });

/** Send a tiny test payload to one channel to confirm the connection works. */
export const testSocialChannelFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/social");
    const { dispatchToChannel } = await import("./social-publisher");
    const [ch] = await repo.getChannelsByIds([data.id]);
    if (!ch) return { ok: false, error: "channel not found" };
    const r = await dispatchToChannel(ch as never, {
      body: "✅ Test from Kloudbean SEO Engine — your channel is connected.",
      link: "https://www.kloudbean.com",
    });
    await repo.markChannelResult(ch.id, r.ok, r.error);
    return { ok: r.ok, dryRun: r.dryRun, skipped: r.skipped, error: r.error };
  });

export const createSocialPostFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      body: z.string().min(1).max(4000),
      link: z.string().max(500).optional(),
      imageUrl: z.string().max(1000).optional(),
      channelIds: z.array(z.string().uuid()).min(1),
      // ISO string; omitted = draft. "now" handled by publishNow.
      scheduledAt: z.string().datetime().optional(),
      publishNow: z.boolean().default(false),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/social");
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const status = data.publishNow ? "publishing" : scheduledAt ? "scheduled" : "draft";
    const post = await repo.createPost({
      body: data.body,
      link: data.link ?? null,
      imageUrl: data.imageUrl ?? null,
      channelIds: data.channelIds,
      scheduledAt,
      status,
      source: "manual",
    });
    if (data.publishNow) {
      const { publishSocialPost } = await import("./social-publisher");
      const r = await publishSocialPost(post.id);
      return { ok: true, id: post.id, status: r.status, published: true };
    }
    return { ok: true, id: post.id, status };
  });

export const publishSocialPostNowFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const { publishSocialPost } = await import("./social-publisher");
    const r = await publishSocialPost(data.id);
    return { ok: r.ok, status: r.status, results: r.results, error: r.error };
  });

export const cancelSocialPostFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/social");
    await repo.updatePostStatus(data.id, "canceled");
    return { ok: true };
  });

export const deleteSocialPostFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/social");
    await repo.deletePost(data.id);
    return { ok: true };
  });

/** Articles/ideas the user can turn into social posts (source picker). */
export const listSourceArticlesFn = createServerFn({ method: "GET" }).handler(async () => {
  const repo = await import("@/server/db/repos/articles");
  const rows = await repo.listArticles({ orderBy: "updated_at", limit: 200 });
  return {
    ok: true,
    articles: rows.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      url: a.published_url ?? null,
      keyword: a.target_keyword ?? null,
    })),
  };
});

/**
 * REPURPOSE: turn one blog idea/article (or a raw topic) into a UNIQUE post per
 * selected channel, then save them as drafts or schedule them (optionally
 * staggered). This is the "same idea, tailored per platform" flow.
 */
export const generateSocialFromSourceFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      articleId: z.string().uuid().optional(),
      topic: z.string().max(300).optional(),
      channelIds: z.array(z.string().uuid()).min(1),
      mode: z.enum(["draft", "schedule", "post"]).default("draft"),
      at: z.string().datetime().optional(),
      staggerMinutes: z.number().min(0).max(10080).default(0),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/social");
    const { composeSocialPost } = await import("./marketing-outbound");
    const { publishSocialPost } = await import("./social-publisher");

    // Resolve the source basis + a link.
    let basis = data.topic?.trim() ?? "";
    let link = "https://www.kloudbean.com";
    if (data.articleId) {
      const articlesRepo = await import("@/server/db/repos/articles");
      const a = await articlesRepo.getArticleById(data.articleId);
      if (!a) return { ok: false as const, error: "article not found", created: 0 };
      const brief = (a.brief ?? {}) as { quick_answer?: string };
      basis = [a.title, a.meta_description, brief.quick_answer, a.target_keyword ? `Keyword: ${a.target_keyword}` : ""]
        .filter(Boolean)
        .join(". ");
      link = a.published_url || (a.url_slug ? `https://www.kloudbean.com/blog/${a.url_slug}/` : link);
    }
    if (!basis) return { ok: false as const, error: "provide an article or a topic", created: 0 };

    const channels = await repo.getChannelsByIds(data.channelIds);
    if (!channels.length) return { ok: false as const, error: "no channels selected", created: 0 };

    const baseTime = data.mode === "schedule" && data.at ? new Date(data.at).getTime() : 0;
    let created = 0;
    let published = 0;
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      // Unique copy per channel: platform style + this account's persona/voice.
      const body = await composeSocialPost(basis, ch.platform, { link, persona: ch.persona });
      const scheduledAt = baseTime ? new Date(baseTime + i * data.staggerMinutes * 60_000) : null;
      const status = data.mode === "post" ? "publishing" : scheduledAt ? "scheduled" : "draft";
      const post = await repo.createPost({
        body,
        link,
        channelIds: [ch.id],
        scheduledAt,
        status,
        source: data.articleId ? "article" : "command",
      });
      created++;
      if (data.mode === "post") {
        try {
          const r = await publishSocialPost(post.id);
          if (r.ok) published++;
        } catch {
          /* individual failure is captured on the post row */
        }
      }
    }
    return { ok: true as const, created, published };
  });

export const listSocialPostsFn = createServerFn({ method: "GET" }).handler(async () => {
  await boot();
  const repo = await import("@/server/db/repos/social");
  const rows = await repo.listPosts(80);
  const counts = await repo.postCounts();
  return {
    ok: true,
    counts,
    posts: rows.map((p) => ({
      id: p.id,
      body: p.body,
      link: p.link,
      channelIds: p.channelIds ?? [],
      scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
      status: p.status,
      results: (p.results ?? []) as { platform?: string; label?: string; ok?: boolean; dryRun?: boolean; skipped?: boolean; error?: string }[],
      postedAt: p.postedAt ? p.postedAt.toISOString() : null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    })),
  };
});
