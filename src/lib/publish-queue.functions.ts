import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * PRE-PUBLISH REVIEW QUEUE — server functions for the /publish-queue dashboard.
 */

export const listPublishQueueFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { listQueue } = await import("./publish-queue");
  const items = await listQueue();
  return { ok: true, items };
});

export const approveAndPublishFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { approveAndPublish } = await import("./publish-queue");
    const r = await approveAndPublish(data.articleId);
    if (!r.ok) throw new Error(r.error ?? "Publish failed");
    return r;
  });

export const rejectFromQueueFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ articleId: z.string().uuid(), reason: z.string().max(500).default("") }).parse,
  )
  .handler(async ({ data }) => {
    const { rejectFromQueue } = await import("./publish-queue");
    return rejectFromQueue(data.articleId, data.reason);
  });

export const snoozeQueueItemFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ articleId: z.string().uuid(), extraHours: z.number().min(1).max(168).default(24) })
      .parse,
  )
  .handler(async ({ data }) => {
    const { snoozeQueueItem } = await import("./publish-queue");
    return snoozeQueueItem(data.articleId, data.extraHours);
  });

/** Manually queue an already-drafted article (outside the Autopilot flow). */
export const queueArticleForReviewFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ articleId: z.string().uuid(), holdHours: z.number().min(1).max(168).default(24) })
      .parse,
  )
  .handler(async ({ data }) => {
    const { queueForReview } = await import("./publish-queue");
    const r = await queueForReview(data.articleId, data.holdHours);
    if (!r.ok) throw new Error(r.error ?? "Could not queue for review");
    return r;
  });
