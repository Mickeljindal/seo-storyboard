import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * MEDIA STUDIO server functions — make /studio dynamic. Generate on-brand
 * social posts / video scripts from the engine's real data (KloudGraph
 * opportunities, knowledge graph, article ideas, keywords) via the studio
 * engine, and report which sources are available.
 */

/** What real data the studio can currently draw from (+ whether AI is ready). */
export const studioSourcesStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getStudioSourceCounts } = await import("./studio-engine");
  const sources = await getStudioSourceCounts();
  return { ok: true, sources };
});

/**
 * Generate a fresh batch of dynamic studio content. `exclude` is the list of
 * headlines/titles already shown, so "Generate more" keeps producing new items.
 */
export const generateStudioContentFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      kind: z.enum(["social", "video"]),
      count: z.number().min(1).max(24).default(8),
      format: z.enum(["reel", "youtube"]).optional(),
      exclude: z.array(z.string()).max(1000).optional(),
      geo: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { generateStudioContent } = await import("./studio-engine");
    return generateStudioContent(data);
  });
