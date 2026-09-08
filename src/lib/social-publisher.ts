import "@tanstack/react-start/server-only";

/**
 * SOCIAL PUBLISHER — sends one post to each connected channel.
 *
 * webhook mode: POSTs the content to the channel's automation URL (n8n / Zapier
 *   / Make / Buffer), which fans out to the real account. This is the path that
 *   actually transmits today.
 * api mode: reserved for native per-platform OAuth integrations added later; for
 *   now it simulates (dry-run) with a clear note so nothing silently fails.
 *
 * Master safety switch: nothing transmits unless SOCIAL_AUTOPOST_ENABLED=1. Until
 * then every dispatch is a dry-run (composed + logged, not sent).
 */

export type ChannelRow = {
  id: string;
  platform: string;
  label: string;
  mode: string;
  webhookUrl: string | null;
  apiToken: string | null;
  meta: Record<string, unknown> | null;
  enabled: boolean;
};

export type DispatchResult = {
  channelId: string;
  platform: string;
  label: string;
  ok: boolean;
  dryRun: boolean;
  skipped: boolean;
  error?: string;
  at: string;
};

export function autopostArmed(): boolean {
  return process.env.SOCIAL_AUTOPOST_ENABLED === "1";
}

export type PostContent = { body: string; link?: string | null; imageUrl?: string | null };

export async function dispatchToChannel(channel: ChannelRow, content: PostContent): Promise<DispatchResult> {
  const base = {
    channelId: channel.id,
    platform: channel.platform,
    label: channel.label,
    at: new Date().toISOString(),
  };
  if (!channel.enabled) {
    return { ...base, ok: false, dryRun: false, skipped: true, error: "channel disabled" };
  }

  // Direct native API mode — post straight to the platform with the connected token.
  if (channel.mode === "api") {
    if (!autopostArmed()) {
      return { ...base, ok: false, dryRun: true, skipped: false };
    }
    const { postNative } = await import("./social-native");
    const r = await postNative(
      { platform: channel.platform, apiToken: channel.apiToken, meta: channel.meta },
      content,
    );
    return { ...base, ok: r.ok, dryRun: false, skipped: false, error: r.error };
  }

  const url = channel.webhookUrl?.trim() || process.env.SOCIAL_WEBHOOK_URL?.trim();
  if (!url) {
    return { ...base, ok: false, dryRun: false, skipped: false, error: "no webhook URL configured" };
  }
  if (!autopostArmed()) {
    return { ...base, ok: false, dryRun: true, skipped: false };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "kloudbean-seo-engine",
        platform: channel.platform,
        channel: channel.label,
        text: content.body,
        link: content.link ?? "https://www.kloudbean.com",
        image: content.imageUrl ?? null,
        ts: base.at,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { ...base, ok: false, dryRun: false, skipped: false, error: `webhook ${res.status}` };
    return { ...base, ok: true, dryRun: false, skipped: false };
  } catch (e) {
    return { ...base, ok: false, dryRun: false, skipped: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Publish a stored post to all its channels; updates its status + per-channel results. */
export async function publishSocialPost(
  postId: string,
): Promise<{ ok: boolean; status: string; results: DispatchResult[]; error?: string }> {
  const repo = await import("@/server/db/repos/social");
  const post = await repo.getPost(postId);
  if (!post) return { ok: false, status: "failed", results: [], error: "post not found" };
  if (post.status === "canceled") return { ok: false, status: "canceled", results: [], error: "canceled" };

  const channels = (await repo.getChannelsByIds(post.channelIds ?? [])) as ChannelRow[];
  if (!channels.length) {
    await repo.updatePostStatus(postId, "failed", [{ error: "no channels" }]);
    return { ok: false, status: "failed", results: [], error: "no channels selected" };
  }

  await repo.updatePostStatus(postId, "publishing");
  const content: PostContent = { body: post.body, link: post.link, imageUrl: post.imageUrl };
  const results: DispatchResult[] = [];
  for (const ch of channels) {
    const r = await dispatchToChannel(ch, content);
    results.push(r);
    await repo.markChannelResult(ch.id, r.ok, r.error);
  }

  const anyLiveOk = results.some((r) => r.ok && !r.dryRun);
  const anyLiveFail = results.some((r) => !r.dryRun && !r.skipped && !r.ok);
  const allDryOrSkip = results.every((r) => r.dryRun || r.skipped);

  let status: string;
  if (allDryOrSkip) status = "posted"; // simulated — results carry dryRun flags
  else if (anyLiveOk && !anyLiveFail) status = "posted";
  else if (anyLiveOk && anyLiveFail) status = "partial";
  else status = "failed";

  const posted = status === "posted" || status === "partial";
  await repo.updatePostStatus(postId, status, results, posted);
  return { ok: status !== "failed", status, results };
}
