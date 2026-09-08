import "@tanstack/react-start/server-only";

/**
 * SOCIAL SCHEDULER — a lightweight always-on tick that publishes scheduled posts
 * when their time arrives. Mirrors the job-runner pattern: a single interval,
 * guarded by a kill switch (SOCIAL_SCHEDULER_DISABLED=1). Also called from the
 * autopilot cycle so due posts still go out even if the interval isn't running.
 */

const g = globalThis as typeof globalThis & { __kbSocialScheduler?: ReturnType<typeof setInterval> };

/** Publish every scheduled post whose time has come. Returns how many ran. */
export async function sweepDueSocialPosts(): Promise<{ published: number; errors: string[] }> {
  const repo = await import("@/server/db/repos/social");
  const { publishSocialPost } = await import("./social-publisher");
  const errors: string[] = [];
  let published = 0;
  try {
    const due = await repo.listDuePosts(new Date(), 20);
    for (const post of due) {
      try {
        await publishSocialPost(post.id);
        published++;
      } catch (e) {
        errors.push(`${post.id}: ${String((e as Error)?.message ?? e)}`);
      }
    }
  } catch (e) {
    errors.push(String((e as Error)?.message ?? e));
  }
  return { published, errors };
}

export function ensureSocialScheduler(): void {
  if (process.env.SOCIAL_SCHEDULER_DISABLED === "1") return;
  if (g.__kbSocialScheduler) return;
  const everyMs = Number(process.env.SOCIAL_SCHEDULER_INTERVAL_MS || 60_000);
  g.__kbSocialScheduler = setInterval(() => {
    void sweepDueSocialPosts().catch(() => {});
  }, everyMs);
  console.log(`[social-scheduler] started (every ${Math.round(everyMs / 1000)}s)`);
}
